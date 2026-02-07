import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaIncomeHandlers } from './orcaIncome';
import { orcaReportHandlers } from './orcaReport';
import { orcaAdditionalHandlers } from './orcaAdditional';
import { orcaClaimHandlers } from './orcaClaim';
import { orcaReceptionHandlers } from './orcaReception';
import { orcaMasterHandlers } from './orcaMaster';
import { orcaDeptInfoHandlers } from './orcaDeptInfo';
import { orcaPatientMemoHandlers } from './orcaPatientMemo';
import { orcaDiseaseHandlers } from './orcaDisease';
import { orcaOrderBundleHandlers } from './orcaOrderBundles';
import { stampTreeHandlers } from './stampTree';
import { karteImageHandlers } from './karteImage';
import { chartEventHandlers } from './chartEvents';
import { patientImagesHandlers } from './patientImages';

export const handlers = [
  ...outpatientHandlers,
  ...orcaQueueHandlers,
  ...orcaIncomeHandlers,
  ...orcaReportHandlers,
  ...orcaAdditionalHandlers,
  ...orcaClaimHandlers,
  ...orcaReceptionHandlers,
  ...orcaMasterHandlers,
  ...orcaDeptInfoHandlers,
  ...orcaPatientMemoHandlers,
  ...orcaDiseaseHandlers,
  ...orcaOrderBundleHandlers,
  ...stampTreeHandlers,
  ...karteImageHandlers,
  ...patientImagesHandlers,
  ...chartEventHandlers,
];
