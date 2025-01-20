package org.openmrs.module.biologicalorder;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import javax.jms.MapMessage;
import javax.jms.Message;

import org.openmrs.event.EventListener;
import org.openmrs.module.DaemonToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.openmrs.Concept;
import org.openmrs.Encounter;
import org.openmrs.EncounterRole;
import org.openmrs.EncounterType;
import org.openmrs.Form;
import org.openmrs.Location;
import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.Provider;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.api.ObsService;
import org.openmrs.api.context.Context;
import org.openmrs.api.context.Daemon;
import org.openmrs.api.db.hibernate.DbSession;
import org.openmrs.api.db.hibernate.DbSessionFactory;

@Component
public class OrderResultEventListener implements EventListener {
	
	protected final Log log = LogFactory.getLog(getClass());
	
	private static final String HIV_VIRAL_LOAD_UUID = "CI0050051AAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_VIRALLOADLOG = "164596AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_VIRAL_LOAD_QUALITATIVE = "1305AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_DETECTABLE = "1301AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_UNDETECTABE = "1306AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_VIRALLOAD = "856AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_ACCESSIONNUMBER = "162086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
	private static final String CONCEPT_RELEASED_DATE = "CI0050052AAAAAAAAAAAAAAAAAAAAAAAAAAA";

	private static final String FORM_UUID = "2db4f47f-8d19-4740-acea-fc8feb585b7a";
	private static final String CLINICIAN_ROLE_UUID = "d67a9eba-2ddd-42b5-814c-b39836536cce";
	private static final String PROVIDER_UUID = "738185ba-eac9-11e5-8f4d-e06995eac916";
	private static final String BIOLOGICAL_ENCOUNTER_TYPE_UUID = "b2750363-7c00-4ece-bceb-47ab09b8d21b";
	private static final String REQUEST_EXAM_UUID = "8b51ec84-de51-4090-bcde-b6862dc0e253";
	
	private DaemonToken daemonToken;
	
	@Autowired
	DbSessionFactory sessionFactory;
	
	private DbSession getSession() {
		return sessionFactory.getCurrentSession();
	}
	
	public OrderResultEventListener(DaemonToken token) {
		daemonToken = token;
	}
	
	public OrderResultEventListener() {
	}
	
	public DaemonToken getDaemonToken() {
		return daemonToken;
	}
	
	public void setDaemonToken(DaemonToken daemonToken) {
		this.daemonToken = daemonToken;
	}

	Location defaultLocation = new Location();

	Patient patient = new Patient();

	@Override
	public void onMessage(Message message) {
		log.trace(String.format("Received message: \n%s", message));
		System.out.println("IN EVENT LISTENER ::: OrderResultEventListener");
		try {
			Daemon.runInDaemonThread(() -> {
				try {
					processMessage(message);
				}
				catch (Exception e) {
					log.error(String.format("Failed to process obs message!\n%s", message.toString()), e);
				}
			}, daemonToken);
		} catch (Exception e) {
			log.error(String.format("Failed to start Daemon thread to process message!\n%s", message.toString()), e);
		}

	}
	
	private Date removeTime(Date date) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);
		cal.set(Calendar.HOUR_OF_DAY, 0);
		cal.set(Calendar.MINUTE, 0);
		cal.set(Calendar.SECOND, 0);
		return cal.getTime();
	}
	
	private void processMessage(Message message) throws Exception {
		
		MapMessage mapMessage = (MapMessage) message;
		String uuid = mapMessage.getString("uuid");
		String userUuid = mapMessage.getString("userUuid");
		ObsService obsService = Context.getObsService();
		Obs obs = Context.getObsService().getObsByUuid(uuid);
		Double grossViralLoadInDouble = 0.0;
		boolean isDoubleValue = false;
		TimeZone.setDefault(TimeZone.getTimeZone("GMT+0"));

		if ((obs.getConcept().getUuid().compareTo(HIV_VIRAL_LOAD_UUID) == 0)
		        && (obs.getEncounter().getEncounterType().getUuid().compareTo(REQUEST_EXAM_UUID) == 0 )) {

			patient = Context.getPatientService().getPatient(obs.getPersonId());
			defaultLocation =  Context.getLocationService().getDefaultLocation();

			try {
				grossViralLoadInDouble = Double.parseDouble(obs.getValueText());
				isDoubleValue = true;
			} catch (Exception e) {
				System.out.println(e.getMessage());
			}

			Obs viralLoad = createObs(getConceptByUuid(CONCEPT_VIRALLOAD));
			viralLoad.setValueNumeric(isDoubleValue ? grossViralLoadInDouble : 49);

			Obs viralLoadQualitative = createObs(getConceptByUuid(CONCEPT_VIRAL_LOAD_QUALITATIVE));
			viralLoadQualitative.setValueCoded(isDoubleValue ? getConceptByUuid(CONCEPT_DETECTABLE) : getConceptByUuid(CONCEPT_UNDETECTABE));

			Obs viralLoadLog = createObs(getConceptByUuid(CONCEPT_VIRALLOADLOG));
			if (isDoubleValue) {
				double finalValue = Math.round((Math.log(grossViralLoadInDouble) / Math.log(10)) * 100.0) / 100.0;
				viralLoadLog.setValueNumeric(finalValue);
			}

			Obs accessionNumber = createObs(getConceptByUuid(CONCEPT_ACCESSIONNUMBER));
			accessionNumber.setValueText(obs.getEncounter().getOrders().iterator().next().getAccessionNumber());

			Obs grossViralLoad = createObs(getConceptByUuid(HIV_VIRAL_LOAD_UUID));
			grossViralLoad.setValueText(obs.getValueText());

			Obs releasedDate = createObs(getConceptByUuid(CONCEPT_RELEASED_DATE));
			releasedDate.setValueDatetime(obs.getObsDatetime());

			Encounter encounterSaved = createEncounter();
			viralLoad.setEncounter(encounterSaved);
			viralLoadQualitative.setEncounter(encounterSaved);
			accessionNumber.setEncounter(encounterSaved);
			grossViralLoad.setEncounter(encounterSaved);
			releasedDate.setEncounter(encounterSaved);
			
			obsService.saveObs(viralLoad, userUuid);
			obsService.saveObs(viralLoadQualitative, userUuid);
			obsService.saveObs(accessionNumber, userUuid);
			obsService.saveObs(grossViralLoad, userUuid);
			obsService.saveObs(releasedDate, userUuid);
			if (isDoubleValue) {
				viralLoadLog.setEncounter(encounterSaved);
				obsService.saveObs(viralLoadLog, userUuid);
			}
		}
	}

	private static Concept getConceptByUuid(String conceptUUID) {
		return Context.getConceptService().getConceptByUuid(conceptUUID);
	}

	private Encounter createEncounter() {
		EncounterType encounterType =Context.getEncounterService().getEncounterTypeByUuid(BIOLOGICAL_ENCOUNTER_TYPE_UUID);
		Form form = Context.getFormService().getFormByUuid(FORM_UUID);
		EncounterRole encounterRole = Context.getEncounterService().getEncounterRoleByUuid(CLINICIAN_ROLE_UUID);
		Provider provider = Context.getProviderService().getProviderByUuid(PROVIDER_UUID);
		Encounter encounter = new Encounter();
		encounter.setForm(form);
		encounter.setPatient(patient);
		encounter.setEncounterType(encounterType);
		Date encounterDate = new Date();
		encounter.setEncounterDatetime(removeTime(encounterDate));
		encounter.setLocation(defaultLocation);
		encounter.setProvider(encounterRole, provider);
		return Context.getEncounterService().saveEncounter(encounter);
	}

	private Obs createObs(Concept concept) {
		Obs obs = new Obs(patient, concept, removeTime(new Date()), defaultLocation);
		obs.setGroupMembers(null);
		return obs;
	}
}
