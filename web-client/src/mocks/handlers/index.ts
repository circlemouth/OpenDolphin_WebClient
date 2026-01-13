import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaAdditionalHandlers } from './orcaAdditional';

export const handlers = [...outpatientHandlers, ...orcaQueueHandlers, ...orcaAdditionalHandlers];
