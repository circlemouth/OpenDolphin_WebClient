import { describe, expect, it } from 'vitest';

import { extractMedicalOutpatientRecord } from '../medicalOutpatient';

describe('medicalOutpatient', () => {
  it('セクション outcome から overall outcome=PARTIAL を導出する', () => {
    const payload = {
      runId: 'RUN',
      outcome: 'SUCCESS',
      outpatientList: [
        {
          patient: { patientId: '0001', wholeName: '山田 花子' },
          sections: {
            diagnosis: { outcome: 'SUCCESS', items: [{ name: '高血圧症', code: 'I10', status: '確定', date: '2025-12-18' }] },
            prescription: { outcome: 'MISSING', message: '未取得', items: [] },
            lab: { outcome: 'SUCCESS', items: [{ name: 'HbA1c', value: '5.8', unit: '%', date: '2025-12-18' }] },
            procedure: { outcome: 'SUCCESS', items: [] },
            memo: { outcome: 'SUCCESS', items: [{ text: 'メモ', date: '2025-12-18' }] },
          },
        },
      ],
    };

    const record = extractMedicalOutpatientRecord(payload, '0001');
    expect(record).toBeTruthy();
    expect(record?.outcome).toBe('PARTIAL');
    expect(record?.sections.find((s) => s.key === 'prescription')?.outcome).toBe('MISSING');
  });

  it('patientId 指定で対象レコードを選択する', () => {
    const payload = {
      outpatientList: [
        { patient: { patientId: '0001', wholeName: 'A' }, sections: { diagnosis: { outcome: 'SUCCESS', items: [] } } },
        {
          patient: { patientId: '0002', wholeName: 'B' },
          sections: { diagnosis: { outcome: 'SUCCESS', items: [{ name: '脂質異常症', code: 'E78' }] } },
        },
      ],
    };

    const record = extractMedicalOutpatientRecord(payload, '0002');
    expect(record?.patientId).toBe('0002');
    expect(record?.patientName).toBe('B');
    expect(record?.sections.find((s) => s.key === 'diagnosis')?.items[0]?.headline).toContain('脂質異常症');
  });

  it('セクションに ERROR がある場合は overall outcome=PARTIAL または ERROR になる', () => {
    const payload = {
      outpatientList: [
        {
          patient: { patientId: '0001' },
          sections: {
            diagnosis: { outcome: 'SUCCESS', items: [] },
            lab: { outcome: 'ERROR', message: 'timeout', items: [] },
            memo: { outcome: 'MISSING', items: [] },
          },
        },
      ],
    };
    const record = extractMedicalOutpatientRecord(payload, '0001');
    expect(record?.outcome).toBe('PARTIAL');
  });
});

