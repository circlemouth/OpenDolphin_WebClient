import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaAdditionalHandlers } from './orcaAdditional';
import { orcaClaimHandlers } from './orcaClaim';

export const handlers = [...outpatientHandlers, ...orcaQueueHandlers, ...orcaAdditionalHandlers, ...orcaClaimHandlers];
