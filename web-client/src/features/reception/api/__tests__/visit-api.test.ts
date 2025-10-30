import { describe, expect, it } from 'vitest';

import type { PatientDetail } from '@/features/patients/types/patient';
import { buildVisitRegistrationPayload } from '@/features/reception/api/visit-api';

const createPatientDetail = (): PatientDetail => ({
  id: 1,
  patientId: '00012345',
  fullName: '山田 太郎',
  kanaName: 'ヤマダ タロウ',
  gender: 'M',
  genderDesc: '男性',
  birthday: '1980-01-01',
  memo: '既往歴あり',
  appMemo: '注意: 高血圧',
  relations: '本人',
  telephone: '0312345678',
  mobilePhone: '09011112222',
  email: 'patient@example.com',
  address: {
    zipCode: '1000001',
    address: '東京都千代田区千代田1-1',
  },
  reserve1: 'メモ1',
  reserve2: 'メモ2',
  reserve3: undefined,
  reserve4: undefined,
  reserve5: undefined,
  reserve6: undefined,
  safetyNotes: ['アレルギーあり'],
  healthInsurances: [
    {
      id: 9,
      beanBytes: '<xml>insurance</xml>',
    },
  ],
  raw: {
    patientId: '00012345',
    fullName: '山田 太郎',
    kanaName: 'ヤマダ タロウ',
    gender: 'M',
    genderDesc: '男性',
    birthday: '1980-01-01',
  },
});

describe('buildVisitRegistrationPayload', () => {
  it('整形済みの受付登録ペイロードを生成できる', () => {
    const patient = createPatientDetail();
    const checkInAt = new Date('2025-03-15T09:30:00+09:00');

    const payload = buildVisitRegistrationPayload(patient, {
      memo: '再来受付',
      departmentCode: '01',
      departmentName: '内科',
      doctorId: '1001',
      doctorName: '医師 太郎',
      insuranceUid: 'uid-123',
      appointment: '予約枠A',
      checkInAt,
    });

    expect(payload.pvtDate).toBe(checkInAt.toISOString());
    expect(payload.state).toBe(0);
    expect(payload.memo).toBe('再来受付');
    expect(payload.doctorId).toBe('1001');
    expect(payload.deptCode).toBe('01');
    expect(payload.department).toBe('内科,01,医師 太郎,1001');

    const patientModel = payload.patientModel as Record<string, unknown>;
    expect(patientModel.patientId).toBe('00012345');
    expect(patientModel.fullName).toBe('山田 太郎');
    expect(patientModel.kanaName).toBe('ヤマダ タロウ');
    expect(patientModel.genderDesc).toBe('男性');
    expect(patientModel.simpleAddressModel).toEqual({ zipCode: '1000001', address: '東京都千代田区千代田1-1' });
    expect(patientModel.healthInsurances).toEqual([
      {
        id: 9,
        beanBytes: '<xml>insurance</xml>',
      },
    ]);
  });
});
