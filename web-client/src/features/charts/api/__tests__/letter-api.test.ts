import { describe, expect, it } from 'vitest';

import type { RawLetterModuleResource } from '@/features/charts/types/letter';
import {
  __testables,
  buildMedicalCertificatePayload,
  transformLetterSummary,
  transformMedicalCertificate,
} from '@/features/charts/api/letter-api';

const baseRawLetter: RawLetterModuleResource = {
  id: 12,
  confirmed: '2025-03-10T10:15:30',
  title: '診断書:胃腸炎',
  status: 'F',
  letterType: 'medicalCertificate',
  handleClass: 'open.dolphin.letter.MedicalCertificateViewer',
  consultantHospital: 'テスト病院',
  consultantDept: '消化器内科',
  consultantDoctor: '山田 太郎',
  consultantZipCode: '100-0001',
  consultantAddress: '東京都千代田区1-1-1',
  consultantTelephone: '03-1234-5678',
  consultantFax: '03-1234-5679',
  patientId: '000001',
  patientName: '田中 花子',
  patientKana: 'タナカ ハナコ',
  patientGender: '女性',
  patientBirthday: '1980-02-14',
  patientAge: '45歳',
  patientAddress: '東京都江東区1-2-3',
  patientZipCode: '135-0001',
  patientTelephone: '03-9876-5432',
  patientMobilePhone: '080-0000-1111',
  letterItems: [{ name: 'disease', value: '急性胃腸炎' }],
  letterTexts: [{ name: 'informedContent', textValue: '自宅療養と水分補給を指示。' }],
  karteBean: { id: 88 },
  userModel: { id: 55, userId: 'TEST:doctor', commonName: '山田 太郎' },
};

describe('letter-api transforms', () => {
  it('converts summary safely', () => {
    const summary = transformLetterSummary(baseRawLetter);
    expect(summary).toEqual({
      id: 12,
      title: '診断書:胃腸炎',
      confirmedAt: '2025-03-10T10:15:30.000Z',
      status: 'F',
      letterType: 'medicalCertificate',
    });
  });

  it('normalizes medical certificate detail', () => {
    const detail = transformMedicalCertificate(baseRawLetter);
    expect(detail.disease).toBe('急性胃腸炎');
    expect(detail.informedContent).toContain('自宅療養');
    expect(detail.consultantHospital).toBe('テスト病院');
    expect(detail.patientName).toBe('田中 花子');
  });

  it('builds payloads for saving', () => {
    const detail = transformMedicalCertificate(baseRawLetter);
    const payload = buildMedicalCertificatePayload(detail, {
      karteId: 88,
      userModelId: 55,
      userId: 'TEST:doctor',
      commonName: '山田 太郎',
      now: new Date('2025-04-01T09:00:00Z'),
    });
    expect(payload.id).toBe(0);
    expect(payload.linkId).toBe(baseRawLetter.id);
    expect(payload.letterItems[0]).toEqual({ name: 'disease', value: '急性胃腸炎' });
    expect(payload.letterTexts[0]).toEqual({ name: 'informedContent', textValue: '自宅療養と水分補給を指示。' });
    expect(payload.karteBean.id).toBe(88);
    expect(payload.userModel.id).toBe(55);
  });

  it('handles invalid dates gracefully', () => {
    const { toIsoStringOrNull } = __testables;
    expect(toIsoStringOrNull('invalid')).toBe('invalid');
    expect(toIsoStringOrNull(undefined)).toBeNull();
  });
});
