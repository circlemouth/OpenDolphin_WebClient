import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaAdditionalHandlers } from './orcaAdditional';
import { orcaClaimHandlers } from './orcaClaim';
import { orcaReceptionHandlers } from './orcaReception';

export const handlers = [
  ...outpatientHandlers,
  ...orcaQueueHandlers,
  ...orcaAdditionalHandlers,
  ...orcaClaimHandlers,
  ...orcaReceptionHandlers,
];
