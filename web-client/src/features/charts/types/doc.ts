import type { AttachmentSummary } from '@/features/charts/types/attachment';
import type { ModuleModelPayload } from '@/features/charts/types/module';

export interface DocInfoSummary {
  docPk: number;
  parentPk?: number;
  docId?: string | null;
  docType?: string | null;
  title?: string | null;
  purpose?: string | null;
  purposeDesc?: string | null;
  confirmDate?: string | null;
  firstConfirmDate?: string | null;
  department?: string | null;
  departmentDesc?: string | null;
  healthInsurance?: string | null;
  healthInsuranceDesc?: string | null;
  patientName?: string | null;
  patientId?: string | null;
  facilityName?: string | null;
  createrLicense?: string | null;
  status?: string | null;
  hasMark?: boolean;
  hasImage?: boolean;
  hasRp?: boolean;
  hasTreatment?: boolean;
  hasLaboTest?: boolean;
  sendClaim?: boolean;
  sendLabtest?: boolean;
  sendMml?: boolean;
  claimDate?: string | null;
  versionNumber?: string | null;
  versionNotes?: string | null;
}

export interface DocumentModelPayload {
  id: number;
  confirmed?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  status?: string | null;
  docInfoModel?: DocInfoSummary | null;
  modules?: ModuleModelPayload[] | null;
  schema?: SchemaModelPayload[] | null;
  attachment?: AttachmentSummary[] | null;
}

export interface SchemaModelPayload {
  id: number;
  confirmed?: string | null;
  started?: string | null;
  status?: string | null;
  url?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  patientId?: string | null;
  memo?: string | null;
}

export interface DocInfoListResponse {
  list?: DocInfoSummary[] | null;
}

export interface DocumentListResponse {
  list?: DocumentModelPayload[] | null;
}
