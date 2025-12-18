import { outpatientHandlers } from './outpatient';
import { orcaQueueHandlers } from './orcaQueue';

export const handlers = [...outpatientHandlers, ...orcaQueueHandlers];
