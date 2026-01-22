export type ChartImageAttachment = {
  id: number;
  title?: string;
  fileName?: string;
  contentType?: string;
  contentSize?: number;
  recordedAt?: string;
};

export const resolveImageAttachmentLabel = (attachment: ChartImageAttachment) => {
  return attachment.title || attachment.fileName || `attachment-${attachment.id}`;
};

export const buildImageAttachmentPlaceholder = (attachment: ChartImageAttachment) => {
  const label = resolveImageAttachmentLabel(attachment);
  return `[画像:${label}](attachment:${attachment.id})`;
};

export const appendImageAttachmentPlaceholders = (
  base: string,
  attachments: ChartImageAttachment | ChartImageAttachment[],
) => {
  const items = Array.isArray(attachments) ? attachments : [attachments];
  const placeholders = items.map((item) => buildImageAttachmentPlaceholder(item));
  if (placeholders.length === 0) return base;
  const trimmed = base.trimEnd();
  if (!trimmed) return placeholders.join('\n');
  const separator = trimmed.endsWith('\n') ? '' : '\n';
  return `${trimmed}${separator}${placeholders.join('\n')}`;
};
