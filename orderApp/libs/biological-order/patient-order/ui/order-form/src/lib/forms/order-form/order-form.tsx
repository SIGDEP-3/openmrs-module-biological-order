import {
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Radio,
  Select,
  SelectItem,
  Space,
  Table,
  Text,
  useMantineTheme,
  Alert,
  Card,
  Title,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { Patient } from '@spbogui-openmrs/shared/model';
import { IconCalendar, IconCircle } from '@tabler/icons';
import dayjs from 'dayjs';
import { OrderFormType } from '../order-form-type';
import { createStyles } from '@mantine/core';
import { ObsInput } from '@spbogui-openmrs/shared/ui';
import { Concepts } from '@spbogui-openmrs/shared/utils';
import { openConfirmModal } from '@mantine/modals';
import { useFindLatestObs } from '../../use-find-latest-obs/use-find-latest-obs';
export const styles = createStyles((theme) => ({
  table: {
    '& > tbody > tr > td': {
      borderStyle: 'solid',
      borderColor: theme.colors.gray[3],
      borderWidth: 1,
    },
  },
  inValues : {
    backgroundColor: theme.colors.red[3]
  }
}));

/* eslint-disable-next-line */
export interface OrderFormProps {
  form: UseFormReturnType<OrderFormType>;
  patient?: Patient;
  providers: SelectItem[];
  regimenList: SelectItem[];
  isTransfered?: boolean,
  handleSubmit: (values: OrderFormType) => void;
  handleUpdateParent: () => void;
}
export function OrderForm({
  form,
  handleSubmit,
  handleUpdateParent,
  patient,
  providers,
  regimenList,
  isTransfered,
}: OrderFormProps) {
  const { classes } = styles();
  const theme = useMantineTheme();
  const currentDate = new Date(); 
  const futureDate =  new Date(dayjs(form.values.requestDate).format('YYYY-MM-DD'));
  function compareDates(date1: Date, date2: Date): number {
    const date1SansHeure = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const date2SansHeure = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    if (date1SansHeure < date2SansHeure) {
      return -1; // date1 est avant date2
    } else if (date1SansHeure > date2SansHeure) {
      return 1; // date1 est après date2
    } else {
      return 0; // date1 et date2 sont égales
    }
  }

  if(compareDates(futureDate, currentDate) == 0){
    futureDate.setDate(new Date().getDate());
  }else{
    futureDate.setDate(futureDate.getDate());
  }
  const pastDate = new Date();
  pastDate.setDate(currentDate.getDate() - 1);
  
  const {
    transfered
  } = useFindLatestObs(
    patient ? patient.uuid : '',
    dayjs(form.values.requestDate).format('YYYY-MM-DD'),
    ''
  );
  const openModal = () => openConfirmModal({
    title: 'Confirmation',
    centered: true,
    children: (
      <Text size="md">
        Etes vous sur de vouloir continuer ?
       </Text>
    ),
    labels: { confirm: 'Confirmer', cancel: 'Annuler' },
    onCancel: () => console.log('Cancel'),
    onConfirm() {
       handleSubmit(form.values);
       handleUpdateParent();
       const timer = setTimeout(() => {
        window.history.back();
      }, 5000); // 5000 millisecondes = 5 secondes
      return () => clearTimeout(timer);
    },
  });

  return (
      <form>
      {patient && (
        <>
          { patient.person.dead ? (
            <Alert color="red" title="ATTENTION !!!!">
            La demande ne peut etre effectuée car le patient est décédé .
          </Alert>): ''}
      
          { isTransfered  ? (
            <Alert color="red" ml={'xl'}>
            {"Patient transféré à : "+ transfered?.value}
          </Alert>): ''}

        <Container fluid id='print'  
        style={{
        border: patient.person.dead || isTransfered  ? '2px solid #ffe3e3': 'none', // Exemple de bordure de 2px solide rouge
        backgroundColor: theme.colors.gray[1],
      }}>
        <Card.Section mb={20}>
          <Title color={'cyan'} align="center"> FORMULAIRE DE DEMANDE DE CHARGE VIRALE</Title>
        </Card.Section>
      
<fieldset>
      <legend> 
        <Text size={'lg'} mb={'lg'} weight={'bold'} color={'cyan.6'}>IDENTITE DU PATIENT</Text>
        </legend>


          <Group mb={'xs'}>
            <Text size={'md'}>Date de naissance : </Text>
            <Text weight={'bold'}>
              {dayjs(patient.person.birthdate).format('DD/MM/YYYY')}
            </Text>
          </Group>
          <Group mb={'xs'}>
            <Text size={'md'}>Age : </Text>
            <Text weight={'bold'}>{patient.person.age}</Text>
            <Space />
            <Space />
            <Text size={'md'}>Sexe : </Text>
            <Text>Masculin</Text>{' '}
            {patient.person.gender === 'M' ? (
              <IconCircle strokeWidth={6} color={'#00abfb'} size={20} />
            ) : (
              <IconCircle stroke={1} color={'gray'} size={20} />
            )}
            <Space />
            <Text>Féminin</Text>{' '}
            {patient.person.gender === 'F' ? (
              <IconCircle
                stroke={6}
                style={{ color: theme.colors.blue[6] }}
                size={20}
              />
            ) : (
              <IconCircle stroke={1} color={'gray'} size={20} />
            )}
          </Group>
          {patient.person.gender === 'F'  &&(
            <Group>
              <Group>
                <Text size={'md'} pb={'xs'}>
                  Grossesse :
                </Text>
                <ObsInput
                  concept={Concepts.PREGNANCY_STATUS}
                  form={form}
                  type={'radio'}
                  name={'pregnancyStatus'}
                  readOnly>

                  <Group>
                    <Text size={'md'} pb={'xs'}>
                      Oui :{' '}
                    </Text>
                    <Radio value={Concepts.YES} />
                    <Text size={'md'} pb={'xs'}>
                      Non :{' '}
                    </Text>
                    <Radio value={Concepts.NO} />
                  </Group>
                  </ObsInput>
              </Group>
           
              <Space /> 
              <Space /> 
              <Space /> 
              <Space />
              <Space />
              <Group>
                <Text size={'md'} pb={'xs'}>
                  Allaitement :{' '}
                </Text>
                <ObsInput
                  concept={Concepts.CURRENTLY_BREAST_FEEDING}
                  form={form}
                  type={'radio'}
                  name={'currentlyBreastfeedingChild'}
                  readOnly
                >
                  <Group>
                    <Text size={'md'} pb={'xs'}>
                      Oui :{' '}
                    </Text>
                    <Radio value={Concepts.YES} />
                    <Text size={'md'} pb={'xs'}>
                      Non :{' '}
                    </Text>
                    <Radio value={Concepts.NO} />
                  </Group>
                  </ObsInput>
              </Group>
            </Group>
          )}
          </fieldset>

      <fieldset>
       <legend> 
        <Text size={'lg'} mb={'lg'} weight={'bold'} color={'cyan.6'}> DONNEES CLINIQUES</Text>
        </legend>  
    
          <Group>
            <Text size={'md'}>Type de VIH : <span style={{ color: theme.colors.red[8] }}>*</span> </Text>
            <Space />
            <Space />
            <Space />
            <ObsInput
              type="radio"
              concept={Concepts.HIV_TYPE}
              form={form}
              name={'hivType'}
              readOnly
            >
              <Group>
                <Text size={'md'} pb={'xs'}>
                  VIH-1 :
                </Text>
                <Radio value={Concepts.VIH_1} />

                <Text size={'md'} pb={'xs'}>
                  VIH-2 :
                </Text>
                <Radio value={Concepts.VIH_2} />

                <Text size={'md'} pb={'xs'}>
                  VIH-1 et VIH-2 :{' '}
                </Text>
                <Radio value={Concepts.VIH_1_2} />
              </Group>
            </ObsInput>
          </Group>
          <Group>
            <Text size={'md'}>Le patient est-il actuellement sous ARV ?  <span style={{ color: theme.colors.red[8] }}>*</span></Text>
            <ObsInput
              concept={Concepts.STARTED_ARV_TREATMENT}
              name="isOnTreatment"
              form={form}
              type={'radio'}
              readOnly
            >
              <Group>
                <Text size={'md'} pb={'xs'}>
                  Oui
                </Text>
                <Radio value={'true'} />
                <Text size={'md'} pb={'xs'}>
                  Non
                </Text>
                <Radio value={"false"} />
              </Group>
            </ObsInput>
          </Group>
          <Group>
            <Text size={'md'}>
              Si oui, Année initiation 1er traitement ARV{' '}
            </Text>
            <ObsInput
              form={form}
              name={'arvInitialYear'}
              concept={Concepts.ARV_START_DATE}
              readOnly={true}
              placeholder="......"
              maxDate={currentDate}
              type='date'
            />
          </Group>
          <Group>
            <Text size={'md'}>Ligne thérapeutique :  <span style={{ color: theme.colors.red[8] }}>*</span></Text>
            <ObsInput
              name="regimeLine"
              concept={Concepts.ANTI_RETRO_TREATMENT_LINE}
              form={form}
              type={'radio'}
              readOnly
            >
              <Group>
                <Text size={'md'} pb={'xs'}>
                  1
                  <sup>
                    <small>ère</small>
                  </sup>
                  Ligne:
                </Text>
                <Radio value={Concepts.FIRST_TREATMENT_LINE} />
                <Space />
                <Text size={'md'} pb={'xs'}>
                  2
                  <sup>
                    <small>ème</small>
                  </sup>
                  Ligne:
                </Text>
                <Radio value={Concepts.SECOND_TREATMENT_LINE} />
                <Space />
                <Text size={'md'} pb={'xs'}>
                  3
                  <sup>
                    <small>ème</small>
                  </sup>
                  Ligne:
                </Text>
                <Radio value={Concepts.THIRD_TREATMENT_LINE} />
                <Text size={'md'} pb={'xs'}>
                  Autre ligne:
                </Text>
                <Radio value={Concepts.OTHER} />
              
              </Group>
            </ObsInput>
          </Group>
          <Group mb={'md'}>
            <Text size={'md'}>Régime thérapeutique : <span style={{ color: theme.colors.red[8] }}>*</span></Text>
            <ObsInput
              form={form}
              name={'regime'}
              concept={Concepts.ARV_REGIMEN}
              data={regimenList}
              readOnly
              type={'select'}
              placeholder={'.........................................'}
            />
          </Group>
          <Paper  p={'xs'} bg={theme.colors.gray[1]} id='overflowId7'>
          <Group mb={'md'}>
            <Text  size={'md'} weight="bold" underline>
              Motif de la demande de la CV
            </Text>
            <ObsInput
              form={form}
              name={'requestReason'}
              concept={Concepts.REASON_FOR_VIRAL_LOAD_REQUEST}
              type={'radio'}
            >
              <Group pt={'xs'}>
                <Text size={'md'} pb={5}>
                  CV contrôle sous ARV
                </Text>
                <Radio
                  value={Concepts.CONTROL_VIRAL_LOAD}
                />
                <Space />
                <Text size={'md'} pb={5}>
                  Échec virologique
                </Text>
                <Radio
                  value={Concepts.VIROLOGIC_FAILURE}
                />
                <Space />
                <Text size={'md'} pb={5}>
                  Échec immunologique
                </Text>    
                <Radio
                  value={Concepts.IMUNOLOGOC_FAILURE}
                />
                
                <Space />
                <Text size={'md'} pb={8}>
                  Échec clinique
                </Text>
                <Radio
                  value={Concepts.CLINICAL_FAILURE}
                />
              </Group>
            </ObsInput>
            </Group>
            <Group mb={'md'}>
            <Text size={'md'} pb={5}>Autres (à préciser)</Text>
            <ObsInput
                  style={{ width: '20%' }}
                  placeholder={
                    '..................................................................'
                  }
                  concept={Concepts.OTHER_REASON}
                  form={form}
                  name={'otherCVReason'}
                />
            </Group>
          </Paper>
          </fieldset>
          <fieldset>
          <Grid my={'md'} pl={'lg'}>
            <Grid.Col span={6} p={'lg'}>
              <Text size={'md'} weight={'bold'} underline mb={'md'}>
                A l'initiation du traitement
              </Text>
              <Table>
              <tr>
                <td><Text size={'md'}>CD4 valeur absolue :</Text></td>
                <td><ObsInput
                  form={form}
                  name={'initialCd4Absolute'}
                  concept={Concepts.INNITIAL_CD4_COUNT}
                  placeholder={'.........................................'}
                  readOnly={true}
                /></td>
              </tr>
              <tr>
                <td><Text size={'md'}>CD4 pourcentage :</Text></td>
                <td><ObsInput
                  form={form}
                  name={'initialCd4Percentage'}
                  concept={Concepts.INNITIAL_CD4_PERCENT}
                  {...(form.values.initialCd4Percentage != undefined ? {readOnly: true}: {} )}
                  readOnly={true}
                  placeholder={'.........................................'}
                /> </td>
              </tr>
              <tr>
                <td><Text size={'md'}>Date :</Text></td>
                <td> <ObsInput
                  form={form}
                  name={'initialCd4Date'}
                  concept={Concepts.INNITIAL_CD4_DATE}
                  readOnly={true}
                  placeholder={'__/__/____'}
                  type={'date'}
                /> </td>
              </tr>
          </Table>
              
            </Grid.Col>
            <Grid.Col span={6} p={'lg'}>
              <Text size={'md'} weight={'bold'} underline mb={'md'}>
                A la demande de Charge virale
              </Text>
              <Table>
                <tr>
                  <td><Text size={'md'}>CD4 valeur absolue :</Text></td>
                  <td><ObsInput
                  form={form}
                  name={'latestCd4Absolute'}
                  concept={Concepts.LATE_CD4_COUNT}
                  readOnly={true}
                  placeholder={'.........................................'}
                /></td>
                </tr>
                <tr>
                  <td><Text size={'md'}>CD4 pourcentage :</Text></td>
                  <td><ObsInput
                  form={form}
                  name={'latestCd4Percentage'}
                  concept={Concepts.LATE_CD4_PERCENT}
                  readOnly={true}
                  placeholder={'.........................................'}
                /></td>
                </tr>
                <tr>
                  <td><Text size={'md'}>Date :</Text></td>
                  <td> <ObsInput
                  form={form}
                  name={'latestCd4Date'}
                  concept={Concepts.LATE_CD4_DATE}
                  placeholder={'__/__/____'}
                  readOnly={true}
                  type={'date'}
                /></td>
                </tr>
              </Table>
            </Grid.Col>
          </Grid>
          <Group>
            <Text size={'md'}>
              Le patient a-t-il déjà bénéficié d’une mesure de charge virale ? <span style={{ color: theme.colors.red[8] }}>*</span>
            </Text>
            <ObsInput
              form={form}
              name={'hasViralLoad'}
              concept={Concepts.HAS_VIRAL_LOAD}
              variant="unstyled"
              type={'radio'}
            >
              <Group>
                <Text size={'md'} pb={'xs'}>
                  Oui :{' '}
                </Text>
                <Radio value={Concepts.YES} />
                <Text size={'md'} pb={'xs'}>
                  Non :{' '}
                </Text>
                <Radio value={Concepts.NO} />
              </Group>
            </ObsInput>
          </Group>
        
            <Group>
            <Text size={'md'}>Si oui, Valeur : </Text>
            <ObsInput
              form={form}
              style={{ width: '20%' }}
              name={'latestViralLoad'}
              concept={Concepts.LAST_VIRAL_LOAD}
              placeholder={'......................................................'}
              readOnly
            />
          <Text size={'md'}>préciser le laboratoire : </Text>
          <ObsInput
            form={form}
            name={'latestViralLoadLaboratory'}
            concept={Concepts.LAST_VIRAL_LOAD_LABORATORY}
            readOnly
            placeholder={'......................................................'}
              />

          <Text size={'md'}>Date </Text>
            <ObsInput
              form={form}
              name={'latestViralLoadDate'}
              concept={Concepts.LAST_VIRAL_LOAD_DATE}
              placeholder={'__/__/____'}
              {...(form.values.latestViralLoadDate != undefined ? {readOnly: true}: {} )}
              type={'date'}
              readOnly
            />
          </Group>
    
          </fieldset>
    <fieldset >
       <legend> 
       <Text
            size={'lg'}
            my={'lg'}
            weight={'bold'}
            color={'cyan.6'}
            transform={'uppercase'}
          >
            Identification du prélèvement
          </Text>
        </legend>  
          
          <Paper  bg={theme.colors.gray[1]} id='overflowId6'>
            <Table className={classes.table}>
              <tbody>
                <tr>
                  <td>
                  <Table className={classes.table}>
                    <tr>
                      <td><Text size={'md'}>Nom du clinicien  <span style={{ color: theme.colors.red[8] }}>*</span></Text></td>
                      <td> <Select
                        searchable
                        data={providers}
                       // variant={'unstyled'}
                        {...form.getInputProps(
                          'encounter.encounterProviders.0.provider'
                        )}
                      /></td>
                    </tr>
                    <tr>
                      <td><Text size={'md'}>Date de la demande de l'analyse  <span style={{ color: theme.colors.red[8] }}>*</span></Text></td>
                      <td><ObsInput
                        concept={Concepts.VIRAL_LOAD_REQUEST_DATE}
                       // variant="unstyled"
                        placeholder={'__/__/____'}
                        form={form}
                        name={'requestDate'}
                        type={'date'}
                        readOnly
                      /></td>
                    </tr>
                    <tr>
                      <td><Text size={'md'}>N° Tel clinicien</Text></td>
                      <td><ObsInput
                        concept={Concepts.CLINICIAN_PHONE_NUMBER}
                        //variant="unstyled"
                        placeholder={'N° Tel clinicien'}
                        form={form}
                        name={'clinicianPhoneNumber'}
                        type={'number'}
                      /></td>
                    </tr>
                    <tr>
                      <td><Text size={'md'}>E-mail clinicien</Text></td>
                      <td><ObsInput
                        concept={Concepts.CLINICAL_EMAIL}
                       // variant="unstyled"
                        placeholder={'Email du clinicien'}
                        form={form}
                        name={'clinicianEmail'}
                       // type={'text'}
                      /></td>
                    </tr>
                  </Table>
                  
                  </td>
                  <td>

                    <Table>
                      <tr>
                        <td><Text size={'md'}>Nom du préleveur  <span style={{ color: theme.colors.red[8] }}>*</span></Text></td>
                        <td><Select
                        data={providers}
                        searchable
                        required
                        //variant={'unstyled'}
                        {...form.getInputProps(
                          'encounter.encounterProviders.1.provider'
                        )}
                      /></td>
                      </tr>
                      <tr>
                        <td><Text size={'md'}>Date du prélèvement  <span style={{ color: theme.colors.red[8] }}>*</span></Text></td>
                        <td> <DatePicker
                        icon={<IconCalendar />}
                        style={{ color :theme.colors.red[8], fontWeight: 'bold'}}
                        locale="fr"
                        inputFormat="DD/MM/YYYY"
                        minDate={futureDate}
                        maxDate={new Date()}
                        readOnly
                        placeholder={'__/__/____'}
                        {...form.getInputProps('encounter.encounterDatetime')}
                      /></td>
                      </tr>
                      <tr>
                        <td><Text size={'md'}>Heure du prélèvement</Text></td>
                        <td><ObsInput
                        concept={Concepts.VIRAL_LOAD_REQUEST_TIME}
                        placeholder={'__/__/____'}
                        form={form}
                        name={'encounterTime'}
                        type={'time'}
                        readOnly
                      /></td>
                      </tr>
                      <tr>
                        <td><Text size={'md'} >Type de prélèvement  <span style={{ color: theme.colors.red[8] }}>*</span></Text></td>                   
                        <td><ObsInput
                        type={'select'}
                        form={form}
                        name={'collectionType'}
                        concept={Concepts.COLLECTION_TYPE}
                        data={[
                          {
                            value: Concepts.PLASMA,
                            label: 'Plasma',
                          },
                          {
                            value: Concepts.DBS,
                            label: 'DBS',
                          },
                          {
                            value: Concepts.PSC,
                            label: 'PSC',
                          },
                        ]}
                      /></td>
                      </tr>
                    </Table>
                   
                  </td>
                </tr>
              </tbody>
            </Table>
            
          </Paper>
    </fieldset>
        </Container>
        { patient.person.dead ? ' ': (
          <Group position="center" p={'xs'}>
             <Button onClick={openModal}  disabled={!form.isValid()}>Enregistrer</Button>
           </Group>
          )
          }
        </>
      )}

      </form>
  );
}

export default OrderForm;
