import type { AttachmentKind } from '@/features/charts/types/attachment';

export interface MediaItem {
  id: string;
  title: string;
  capturedAt?: string | null;
  confirmedAt?: string | null;
  createdAt?: string | null;
  recordedAt?: string | null;
  description?: string;
  attachmentId: number;
  documentId: number;
  fileName?: string;
  size?: number;
  contentType?: string;
  kind: AttachmentKind;
  documentTitle?: string;
  documentDepartment?: string;
  documentStatus?: string;
  thumbnailUri?: string | null;
  uri?: string | null;
}
