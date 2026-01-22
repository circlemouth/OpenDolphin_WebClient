import { describe, expect, it } from 'vitest';

import {
  appendImageAttachmentPlaceholders,
  buildImageAttachmentPlaceholder,
  type ChartImageAttachment,
} from '../documentImageAttach';
import { buildAttachmentReferencePayload } from '../../images/api';

const buildAttachment = (overrides: Partial<ChartImageAttachment> = {}): ChartImageAttachment => ({
  id: 901,
  title: '胸部X線',
  fileName: 'xray.png',
  contentType: 'image/png',
  contentSize: 1200,
  recordedAt: '2026-01-21T12:00:00Z',
  ...overrides,
});

describe('document image attach helpers', () => {
  it('placeholder はタイトル優先でリンク表記になる', () => {
    const placeholder = buildImageAttachmentPlaceholder(buildAttachment());
    expect(placeholder).toBe('[画像:胸部X線](attachment:901)');
  });

  it('placeholder は fileName にフォールバックする', () => {
    const placeholder = buildImageAttachmentPlaceholder(buildAttachment({ title: undefined }));
    expect(placeholder).toBe('[画像:xray.png](attachment:901)');
  });

  it('placeholder は既存本文の末尾に追記される', () => {
    const base = 'Free note';
    const appended = appendImageAttachmentPlaceholders(base, buildAttachment());
    expect(appended).toBe('Free note\n[画像:胸部X線](attachment:901)');
  });

  it('reference payload は添付IDを保持する', () => {
    const payload = buildAttachmentReferencePayload({
      attachments: [buildAttachment()],
      patientId: '0001',
      title: '紹介状',
    });
    expect(payload.attachment).toHaveLength(1);
    expect(payload.attachment[0]?.id).toBe(901);
    expect(payload.docInfoModel?.title).toBe('紹介状');
  });
});
