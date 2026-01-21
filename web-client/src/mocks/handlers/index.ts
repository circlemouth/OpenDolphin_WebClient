import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaIncomeHandlers } from './orcaIncome';
import { orcaAdditionalHandlers } from './orcaAdditional';
import { orcaClaimHandlers } from './orcaClaim';
import { orcaReceptionHandlers } from './orcaReception';
import { orcaMasterHandlers } from './orcaMaster';
import { stampTreeHandlers } from './stampTree';
import { karteImageHandlers } from './karteImage';

export const handlers = [
  ...outpatientHandlers,
  ...orcaQueueHandlers,
  ...orcaIncomeHandlers,
  ...orcaAdditionalHandlers,
  ...orcaClaimHandlers,
  ...orcaReceptionHandlers,
  ...orcaMasterHandlers,
  ...stampTreeHandlers,
  ...karteImageHandlers,
];
