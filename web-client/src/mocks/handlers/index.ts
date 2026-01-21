import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';
import { orcaAdditionalHandlers } from './orcaAdditional';
import { orcaReceptionHandlers } from './orcaReception';

export const handlers = [...outpatientHandlers, ...orcaQueueHandlers, ...orcaAdditionalHandlers, ...orcaReceptionHandlers];
