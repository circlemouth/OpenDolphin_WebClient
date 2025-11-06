import { describe, expect, it } from 'vitest';

import type { ModuleModelPayload } from '@/features/charts/types/module';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import {
  buildObjectiveNarrative,
  createProgressNoteDocument,
  type ProgressNoteBilling,
} from '@/features/charts/utils/progress-note-payload';
import type { AuthSession } from '@/libs/auth/auth-types';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const decodeBase64 = (input: string): string => {
  const sanitized = input.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of sanitized) {
    if (char === '=') {
      // Padding indicates the end of meaningful input.
      break;
    }
    const value = BASE64_CHARS.indexOf(char);
    if (value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new TextDecoder().decode(Uint8Array.from(bytes));
};

const encodeBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];

    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);

    output += BASE64_CHARS[(triple >> 18) & 0x3f];
    output += BASE64_CHARS[(triple >> 12) & 0x3f];
    output += index + 1 < bytes.length ? BASE64_CHARS[(triple >> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? BASE64_CHARS[triple & 0x3f] : '=';
  }

  return output;
};

describe('createProgressNoteDocument', () => {
  const draft: ProgressNoteDraft = {
    title: '高血圧フォロー',
    subjective: '食事療法を継続。頭痛なし。',
    objective: '血圧 132/84, 脈拍 68',
    ros: '咳嗽なし / 呼吸困難なし。',
    physicalExam: '胸部: 呼吸音清。腹部: 平坦・軟。',
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

  const insuranceBilling: ProgressNoteBilling = {
    mode: 'insurance',
    classCode: 'Z1',
    description: 'Z1 自費',
    guid: 'INS-001',
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
      billing: insuranceBilling,
    });

    expect(document.docInfoModel.docType).toBe('karte');
    expect(document.docInfoModel.title).toBe(draft.title);
    expect(document.docInfoModel.facilityName).toBe('OpenDolphin Clinic');
    expect(document.modules).toHaveLength(2);
    expect(document.docInfoModel.pVTHealthInsuranceModel?.insuranceClassCode).toBe('Z1');
    expect(document.docInfoModel.claimDate).not.toBeNull();
    expect(document.docInfoModel.sendMml).toBe(false);
    expect(document.linkId).toBeNull();
    expect(document.linkRelation).toBeNull();

    const [soaModule, planModule] = document.modules;
    expect(soaModule.moduleInfoBean).toBeTruthy();
    expect(planModule.moduleInfoBean).toBeTruthy();
    if (!soaModule.moduleInfoBean || !planModule.moduleInfoBean) {
      throw new Error('moduleInfoBean が未定義です');
    }
    expect(soaModule.moduleInfoBean.stampRole).toBe('soaSpec');
    expect(planModule.moduleInfoBean.stampRole).toBe('pSpec');

    const soaText = decodeBase64(soaModule.beanBytes ?? '');
    expect(soaText).toContain('S:');
    expect(soaText).toContain(draft.subjective);
    expect(soaText).toContain('ROS:');
    expect(soaText).toContain(draft.ros);
    expect(soaText).toContain('PE:');
    expect(soaText).toContain(draft.physicalExam);

    const planText = decodeBase64(planModule.beanBytes ?? '');
    expect(planText).toContain('P:');
    expect(planText).toContain(draft.plan);
  });

  it('marks self-pay notes to skip CLAIM transmission and embeds summary', () => {
    const billing: ProgressNoteBilling = {
      mode: 'self-pay',
      receiptCode: '950',
      label: 'その他の自費（非課税）',
      quantity: '1回',
      performer: '看護師A',
      lotNumber: 'LOT-01',
      memo: '麻酔クリーム込み',
    };

    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      billing,
    });

    expect(document.docInfoModel.healthInsurance).toBe('950');
    expect(document.docInfoModel.healthInsuranceDesc).toContain('その他の自費（非課税）');
    expect(document.docInfoModel.healthInsuranceDesc).toContain('数量: 1回');
    expect(document.docInfoModel.healthInsuranceDesc).toContain('実施者: 看護師A');
    expect(document.docInfoModel.healthInsuranceGUID).toBe('');
    expect(document.docInfoModel.sendClaim).toBe(false);
    expect(document.docInfoModel.claimDate).toBeNull();
    expect(document.docInfoModel.sendLabtest).toBe(false);
  });

  it('buildObjectiveNarrative joins core, ROS, and PE sections with headings', () => {
    expect(
      buildObjectiveNarrative({
        objective: 'バイタル安定。',
        ros: '胸部症状なし。',
        physicalExam: '心音整、雑音なし。',
      }),
    ).toBe('バイタル安定。\n\nROS:\n胸部症状なし。\n\nPE:\n心音整、雑音なし。');

    expect(
      buildObjectiveNarrative({
        objective: '',
        ros: '食欲良好',
        physicalExam: '',
      }),
    ).toBe('ROS:\n食欲良好');
  });

  it('supports taxable self-pay receipts by disabling CLAIM send', () => {
    const billing: ProgressNoteBilling = {
      mode: 'self-pay',
      receiptCode: '960',
      label: 'その他の自費（課税）',
    };

    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      billing,
    });

    expect(document.docInfoModel.healthInsurance).toBe('960');
    expect(document.docInfoModel.healthInsuranceDesc).toBe('その他の自費（課税）');
    expect(document.docInfoModel.sendClaim).toBe(false);
  });

  it('trims whitespace-only self-pay inputs before embedding description', () => {
    const billing: ProgressNoteBilling = {
      mode: 'self-pay',
      receiptCode: '950',
      label: 'その他の自費（非課税）',
      quantity: '  ',
      performer: '\n',
      lotNumber: '',
      memo: '  メモ  ',
    };

    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      billing,
    });

    expect(document.docInfoModel.healthInsuranceDesc).toBe('その他の自費（非課税） / 備考: メモ');
  });

  it('merges order modules and updates document flags', () => {
    const orderModule: ModuleModelPayload = {
      moduleInfoBean: {
        stampName: '内服薬処方',
        stampRole: 'p',
        stampNumber: 0,
        entity: 'medOrder',
        stampId: 'stamp-001',
      },
      beanBytes: encodeBase64('<ClaimItem code="123"/>'),
    };

    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      billing: insuranceBilling,
      orderModules: [orderModule],
    });

    expect(document.modules).toHaveLength(3);
    const orderEntry = document.modules[2];
    expect(orderEntry.moduleInfoBean?.stampName).toBe('内服薬処方');
    expect(orderEntry.moduleInfoBean?.entity).toBe('medOrder');
    expect(document.docInfoModel.hasRp).toBe(true);
    expect(document.docInfoModel.hasTreatment).toBe(false);
    expect(document.docInfoModel.hasLaboTest).toBe(false);
    expect(document.docInfoModel.sendLabtest).toBe(false);
  });

  it('enables labtest transmission when lab orders are present', () => {
    const labModule: ModuleModelPayload = {
      moduleInfoBean: {
        stampName: '血液検査セット',
        stampRole: 'p',
        stampNumber: 0,
        entity: 'testOrder',
        stampId: 'stamp-lab-001',
      },
      beanBytes: encodeBase64('<ClaimItem code="LAB001"/>'),
    };

    const document = createProgressNoteDocument({
      draft,
      visit,
      karteId: 4001,
      session,
      billing: insuranceBilling,
      orderModules: [labModule],
    });

    expect(document.docInfoModel.hasLaboTest).toBe(true);
    expect(document.docInfoModel.sendLabtest).toBe(true);
    expect(document.docInfoModel.priscriptionOutput).toBe(false);
  });

  it('validates claim items in order modules', () => {
    const invalidModule: ModuleModelPayload = {
      moduleInfoBean: {
        stampName: '検査依頼',
        stampRole: 'p',
        stampNumber: 0,
        entity: 'testOrder',
      },
      beanBytes: encodeBase64('<BundleTest></BundleTest>'),
    };

    expect(() =>
      createProgressNoteDocument({
        draft,
        visit,
        karteId: 4001,
        session,
        billing: insuranceBilling,
        orderModules: [invalidModule],
      }),
    ).toThrow('検査依頼 に ClaimItem 情報が含まれていません。ORCA 連携設定を確認してください。');
  });
});
