import { chartHandlers } from '@/mocks/handlers/chartHandlers';
import { orcaMasterHandlers } from '@/mocks/handlers/orcaMasterHandlers';
import { scheduleHandlers } from '@/mocks/handlers/scheduleHandlers';

export const handlers = [...chartHandlers, ...orcaMasterHandlers, ...scheduleHandlers];
