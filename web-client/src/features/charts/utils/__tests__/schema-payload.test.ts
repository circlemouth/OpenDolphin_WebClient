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
    expect(schema.extRefModel).toEqual(
      expect.objectContaining({ title: '腹部シェーマ', medicalRole: 'Reference figure' }),
    );
    expect(schema.jpegByte).toBe('dGVzdA==');
    expect(payload.karteBean.patientModel.id).toBe(101);
    expect(payload.docInfoModel.patientName).toBe('山本 次郎');
  });
});
