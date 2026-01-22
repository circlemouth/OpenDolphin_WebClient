import { describe, expect, it } from 'vitest';

import { buildAttachmentPayload, buildImageDocumentPayload, bytesToBase64, formatBytes, type UploadSource } from '../imageUploader';

describe('image uploader helpers', () => {
  it('bytesToBase64 は Uint8Array を base64 に変換する', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(bytesToBase64(bytes)).toBe('AQID');
  });

  it('buildAttachmentPayload はファイルメタと base64 を組み立てる', async () => {
    const source: UploadSource = {
      name: 'photo.png',
      type: 'image/png',
      size: 3,
      lastModified: 123,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
    const payload = await buildAttachmentPayload(source);
    expect(payload).toMatchObject({
      fileName: 'photo.png',
      contentType: 'image/png',
      contentSize: 3,
      lastModified: 123,
      extension: 'png',
      bytes: 'AQID',
    });
  });

  it('buildAttachmentPayload は拡張子なしの場合に extension を省略する', async () => {
    const source: UploadSource = {
      name: 'scan',
      type: '',
      size: 1,
      arrayBuffer: async () => new Uint8Array([255]).buffer,
    };
    const payload = await buildAttachmentPayload(source);
    expect(payload.extension).toBeUndefined();
    expect(payload.contentType).toBe('application/octet-stream');
  });

  it('buildImageDocumentPayload は添付とメタを付与する', () => {
    const payload = buildImageDocumentPayload({
      attachments: [
        {
          fileName: 'scan.jpg',
          contentType: 'image/jpeg',
          contentSize: 10,
          bytes: 'BASE64',
        },
      ],
      patientId: '0001',
      title: '画像添付',
    });
    expect(payload.attachment[0]?.title).toBe('画像添付');
    expect(payload.docInfoModel?.title).toBe('画像添付');
    expect(payload.docInfoModel?.patientId).toBe('0001');
  });

  it('buildImageDocumentPayload は memo/recordedAt を引き継ぐ', () => {
    const payload = buildImageDocumentPayload({
      attachments: [
        {
          fileName: 'scan.jpg',
          contentType: 'image/jpeg',
          contentSize: 10,
          bytes: 'BASE64',
          memo: 'attach-memo',
        },
      ],
      patientId: 'P-200',
      title: 'CT',
      memo: 'global-memo',
      recordedAt: '2026-01-22T00:00:00Z',
    });
    expect(payload.docInfoModel?.recordedAt).toBe('2026-01-22T00:00:00Z');
    expect(payload.docInfoModel?.patientId).toBe('P-200');
    expect(payload.attachment[0]?.memo).toBe('attach-memo');
  });

  it('formatBytes は人間可読なサイズに整形する', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(10 * 1024)).toBe('10 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatBytes(undefined)).toBe('―');
  });
});
