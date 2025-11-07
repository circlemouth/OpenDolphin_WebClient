import { describe, expect, it } from 'vitest';

import { buildSchemaDocumentPayload } from '@/features/charts/utils/schema-payload';

const BASE_CONTEXT = {
  karteId: 99,
  patientId: '000001',
  patientPk: 101,
  patientName: '山本 次郎',
  patientGender: '男性',
  facilityName: 'テストクリニック',
  licenseName: '医師',
  departmentName: '内科',
  departmentCode: '01',
  userModelId: 400,
  userId: 'FAC:doc1',
  userCommonName: '山田 太郎',
  jpegBase64: 'dGVzdA==',
  title: '腹部シェーマ',
  medicalRole: 'Reference figure',
  now: new Date('2025-02-01T12:00:00Z'),
};

describe('buildSchemaDocumentPayload', () => {
  it('constructs document payload with schema entry', () => {
    const payload = buildSchemaDocumentPayload(BASE_CONTEXT);
    expect(payload.docInfoModel.title).toContain('シェーマ');
    expect(payload.schema).toHaveLength(1);
    const schema = payload.schema[0];
    expect(schema.confirmed).toBe('2025-02-01 21:00:00');
    expect(schema.started).toBe('2025-02-01 21:00:00');
    expect(schema.recorded).toBe('2025-02-01 21:00:00');
    expect(schema.status).toBe('F');
    expect(schema.linkId).toBeNull();
    expect(schema.linkRelation).toBeNull();
    expect(schema.userModel).toEqual({ id: 400, userId: 'FAC:doc1', commonName: '山田 太郎' });
    expect(schema.karteBean.patientModel).toEqual({ id: 101 });
    expect(schema.fileName.endsWith('-schema.jpg')).toBe(true);
    expect(schema.url).toBe(schema.fileName);
    expect(schema.contentType).toBe('image/jpeg');
    expect(schema.extRefModel).toEqual({
      contentType: 'image/jpeg',
      medicalRole: 'Reference figure',
      title: '腹部シェーマ',
      href: schema.fileName,
    });
    expect(schema.jpegByte).toBe('dGVzdA==');
    expect(payload.karteBean?.patientModel?.id).toBe(101);
    expect(payload.docInfoModel.patientName).toBe('山本 次郎');
    expect(payload.docInfoModel.patientGender).toBe('男性');
    expect(payload.docInfoModel.departmentDesc).toBe('内科,01,山田 太郎');
    expect(payload.docInfoModel.sendLabtest).toBe(false);
    expect(payload.docInfoModel.sendMml).toBe(false);
  });

  it('normalizes optional strings before building schema payload', () => {
    const payload = buildSchemaDocumentPayload({
      ...BASE_CONTEXT,
      title: '  手書きスケッチ ',
      medicalRole: '  Surgical plan ',
      fileName: '  custom-schema.jpeg ',
      userCommonName: '  佐藤 花子  ',
    });
    const schema = payload.schema[0];
    expect(schema.fileName).toBe('custom-schema.jpeg');
    expect(schema.url).toBe('custom-schema.jpeg');
    expect(schema.extRefModel).toMatchObject({
      title: '手書きスケッチ',
      medicalRole: 'Surgical plan',
      href: 'custom-schema.jpeg',
    });
    expect(schema.userModel.commonName).toBe('佐藤 花子');
    expect(payload.docInfoModel.departmentDesc).toBe('内科,01,佐藤 花子');
  });

  it('throws when mandatory image payload is missing', () => {
    expect(() =>
      buildSchemaDocumentPayload({
        ...BASE_CONTEXT,
        jpegBase64: '   ',
      }),
    ).toThrowError('シェーマ画像データ が未設定です。');
  });
});
