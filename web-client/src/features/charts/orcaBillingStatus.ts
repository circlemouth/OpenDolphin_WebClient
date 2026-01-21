import type { ClaimBundle, ClaimBundleStatus, ClaimQueueEntry } from '../outpatient/types';
import type { OrcaClaimSendCacheEntry } from './orcaClaimSendCache';
import type { OrcaIncomeInfoCacheEntry } from './orcaIncomeInfoCache';

export type BillingStatusDecision = {
  status?: ClaimBundleStatus;
  statusText?: string;
  invoiceNumber?: string;
  paid: boolean;
};

const normalizeInvoiceNumber = (value?: string | null) => value?.trim() || undefined;

export const buildPaidInvoiceSet = (income?: OrcaIncomeInfoCacheEntry | null) => {
  const invoices = income?.invoiceNumbers ?? [];
  return new Set(invoices.map((value) => value.trim()).filter(Boolean));
};

export const resolveBillingStatusFromInvoice = (
  invoiceNumber?: string | null,
  paidInvoiceNumbers?: Set<string>,
): BillingStatusDecision => {
  const normalized = normalizeInvoiceNumber(invoiceNumber);
  if (!normalized) return { paid: false };
  const paid = paidInvoiceNumbers?.has(normalized) ?? false;
  const status: ClaimBundleStatus = paid ? '会計済み' : '会計待ち';
  return {
    status,
    statusText: status,
    invoiceNumber: normalized,
    paid,
  };
};

export const buildSendClaimBundle = (
  entry: OrcaClaimSendCacheEntry,
  paidInvoiceNumbers?: Set<string>,
): ClaimBundle => {
  const decision = resolveBillingStatusFromInvoice(entry.invoiceNumber, paidInvoiceNumbers);
  const fallbackStatus: ClaimBundleStatus | undefined = entry.sendStatus === 'error' ? undefined : '会計待ち';
  const status = decision.status ?? fallbackStatus;
  const statusText = decision.statusText ?? (entry.sendStatus === 'error' ? '送信失敗' : fallbackStatus);
  return {
    bundleNumber: entry.invoiceNumber ?? entry.dataId ?? `send-${entry.patientId ?? 'unknown'}`,
    patientId: entry.patientId,
    appointmentId: entry.appointmentId,
    performTime: entry.savedAt,
    invoiceNumber: decision.invoiceNumber ?? entry.invoiceNumber ?? undefined,
    claimStatus: status,
    claimStatusText: statusText,
  };
};

export const buildQueueEntryFromSendCache = (
  entry: OrcaClaimSendCacheEntry,
  paidInvoiceNumbers?: Set<string>,
): ClaimQueueEntry => {
  const decision = resolveBillingStatusFromInvoice(entry.invoiceNumber, paidInvoiceNumbers);
  if (decision.paid) {
    return {
      id: `send-queue-${entry.patientId ?? entry.invoiceNumber ?? entry.dataId ?? 'unknown'}`,
      phase: 'ack',
      patientId: entry.patientId,
      appointmentId: entry.appointmentId,
      errorMessage: undefined,
    };
  }
  if (entry.sendStatus === 'error') {
    return {
      id: `send-queue-${entry.patientId ?? entry.invoiceNumber ?? entry.dataId ?? 'unknown'}`,
      phase: 'failed',
      patientId: entry.patientId,
      appointmentId: entry.appointmentId,
      errorMessage: entry.errorMessage,
    };
  }
  return {
    id: `send-queue-${entry.patientId ?? entry.invoiceNumber ?? entry.dataId ?? 'unknown'}`,
    phase: 'sent',
    patientId: entry.patientId,
    appointmentId: entry.appointmentId,
    nextRetryAt: entry.savedAt,
  };
};

export const mergeClaimBundles = (bundles: ClaimBundle[], sendBundles: ClaimBundle[]) => {
  if (sendBundles.length === 0) return bundles;
  const patientIds = new Set(sendBundles.map((bundle) => bundle.patientId).filter(Boolean));
  const appointmentIds = new Set(sendBundles.map((bundle) => bundle.appointmentId).filter(Boolean));
  const filtered = bundles.filter((bundle) => {
    if (bundle.patientId && patientIds.has(bundle.patientId)) return false;
    if (bundle.appointmentId && appointmentIds.has(bundle.appointmentId)) return false;
    return true;
  });
  return [...filtered, ...sendBundles];
};

export const mergeQueueEntries = (entries: ClaimQueueEntry[], sendEntries: ClaimQueueEntry[]) => {
  if (sendEntries.length === 0) return entries;
  const key = (entry: ClaimQueueEntry) => entry.appointmentId ? `appointment:${entry.appointmentId}` : `patient:${entry.patientId ?? entry.id}`;
  const map = new Map<string, ClaimQueueEntry>();
  entries.forEach((entry) => map.set(key(entry), entry));
  sendEntries.forEach((entry) => {
    const k = key(entry);
    if (!map.has(k)) {
      map.set(k, entry);
    }
  });
  return Array.from(map.values());
};

export const resolveOverallClaimStatus = (bundles: ClaimBundle[]) => {
  if (bundles.length === 0) return undefined;
  const statuses = bundles.map((bundle) => bundle.claimStatus).filter(Boolean) as ClaimBundleStatus[];
  if (statuses.length === 0) return undefined;
  if (statuses.every((status) => status === '会計済み')) return '会計済み' as ClaimBundleStatus;
  if (statuses.some((status) => status === '会計待ち')) return '会計待ち' as ClaimBundleStatus;
  return statuses[0];
};
