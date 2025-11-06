export type AttachmentKind = 'image' | 'pdf' | 'other';

export interface AttachmentSummary {
  id: number;
  documentId: number;
  title: string;
  description?: string;
  fileName?: string;
  extension?: string;
  contentType?: string;
  size?: number;
  recordedAt?: string | null;
  confirmedAt?: string | null;
  createdAt?: string | null;
  uri?: string | null;
  kind: AttachmentKind;
  documentTitle?: string;
  documentDepartment?: string;
  documentStatus?: string;
  thumbnailUri?: string | null;
}

export interface AttachmentContent {
  id: number;
  contentType: string;
  bytesBase64: string;
  dataUrl: string;
  fileName?: string;
}
