export type { AuditCategory, AuditSeverity, ClientAuditEvent } from './auditTrail';
export { initializeAuditTrail, recordAuditEvent, recordOperationEvent, flushBuffer } from './auditTrail';
