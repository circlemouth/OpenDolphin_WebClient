import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import { createProgressNoteDocument } from '@/features/charts/utils/progress-note-payload';
import type { AuthSession } from '@/libs/auth/auth-types';

describe('createProgressNoteDocument', () => {
  const draft: ProgressNoteDraft = {
    title: '高血圧フォロー',
    subjective: '食事療法を継続。頭痛なし。',
    objective: '血圧 132/84, 脈拍 68',
    assessment: 'コントロール良好、経過観察',
    plan: '処方継続、2ヶ月後受診',
  };

  const visit: PatientVisitSummary = {
    visitId: 1001,
    facilityId: '0001',
    visitDate: '2026-01-15',
    state: 1,
    memo: undefined,
    insuranceUid: 'INS-001',
    departmentCode: '01',
    departmentName: '内科',
    doctorId: 'DOC001',
    doctorName: '医師 太郎',
    jmariNumber: 'JMA12345',
    patientPk: 2001,
    patientId: 'P00001',
    fullName: '患者 太郎',
    kanaName: 'カンジャ タロウ',
    gender: 'M',
    birthday: '1980-05-01',
    ownerUuid: 'client-1',
    safetyNotes: ['服薬アドヒアランス要確認'],
    raw: {
      id: 1001,
      facilityId: '0001',
      pvtDate: '2026-01-15',
      state: 1,
      insuranceUid: 'INS-001',
      deptCode: '01',
      deptName: '内科',
      doctorId: 'DOC001',
      doctorName: '医師 太郎',
      patientModel: {
        id: 2001,
        patientId: 'P00001',
        fullName: '患者 太郎',
        kanaName: 'カンジャ タロウ',
        gender: 'M',
        birthday: '1980-05-01',
        ownerUUID: 'client-1',
      },
    },
  };

  const session: AuthSession = {
    credentials: {
      facilityId: '0001',
      userId: 'doctor01',
      passwordMd5: 'dummy',
      clientUuid: 'client-1',
    },
    userProfile: {
      facilityId: '0001',
      userId: 'doctor01',
      displayName: '医師 太郎',
      userModelId: 3001,
      facilityName: 'OpenDolphin Clinic',
      licenseName: '医師',
    },
  };

  it('builds a document payload with progress course modules', () => {
    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      facilityName: session.userProfile?.facilityName,
      userDisplayName: session.userProfile?.displayName,
      userModelId: session.userProfile?.userModelId,
      licenseName: session.userProfile?.licenseName,
      departmentCode: visit.departmentCode,
      departmentName: visit.departmentName,
    });

    expect(document.docInfoModel.docType).toBe('karte');
    expect(document.docInfoModel.title).toBe(draft.title);
    expect(document.docInfoModel.facilityName).toBe('OpenDolphin Clinic');
    expect(document.modules).toHaveLength(2);

    const [soaModule, planModule] = document.modules;
    expect(soaModule.moduleInfoBean.stampRole).toBe('soaSpec');
    expect(planModule.moduleInfoBean.stampRole).toBe('pSpec');

    const soaText = Buffer.from(soaModule.beanBytes ?? '', 'base64').toString('utf-8');
    expect(soaText).toContain('S:');
    expect(soaText).toContain(draft.subjective);

    const planText = Buffer.from(planModule.beanBytes ?? '', 'base64').toString('utf-8');
    expect(planText).toContain('P:');
    expect(planText).toContain(draft.plan);
  });
});
