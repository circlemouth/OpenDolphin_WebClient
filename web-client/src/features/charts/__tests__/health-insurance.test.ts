import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import {
  extractInsuranceOptions,
  parseHealthInsuranceBean,
  type ParseHealthInsuranceOptions,
} from '@/features/charts/utils/health-insurance';

const buildSampleBean = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<java version="1.8.0_202" class="java.beans.XMLDecoder">
 <object class="open.dolphin.infomodel.PVTHealthInsuranceModel">
  <void property="GUID">
   <string>INS-GUID-01</string>
  </void>
  <void property="insuranceClass">
   <string>国保</string>
  </void>
  <void property="insuranceClassCode">
   <string>Z1</string>
  </void>
  <void property="insuranceNumber">
   <string>1234567</string>
  </void>
  <void property="clientGroup">
   <string>ア</string>
  </void>
  <void property="clientNumber">
   <string>1234</string>
  </void>
  <void property="startDate">
   <string>2026-01-01</string>
  </void>
  <void property="expiredDate">
   <string>2026-12-31</string>
  </void>
 </object>
</java>`;

  return Buffer.from(xml, 'utf-8').toString('base64');
};

describe('health insurance utilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses java.beans XML encoded beans', () => {
    const bean = buildSampleBean();
    const parsed = parseHealthInsuranceBean(bean);

    expect(parsed).not.toBeNull();
    expect(parsed?.guid).toBe('INS-GUID-01');
    expect(parsed?.classCode).toBe('Z1');
    expect(parsed?.label).toContain('国保');
    expect(parsed?.label).toContain('保険者番号: 1234567');
    expect(parsed?.label).toContain('記号番号: ア1234');
  });

  it('returns normalized insurance options from visit data', () => {
    const visit: PatientVisitSummary = {
      visitId: 1,
      facilityId: '0001',
      visitDate: '2026-02-20',
      state: 1,
      patientPk: 1,
      patientId: 'P001',
      fullName: '患者 テスト',
      safetyNotes: [],
      raw: {
        id: 1,
        patientModel: {
          id: 1,
          patientId: 'P001',
          fullName: '患者 テスト',
          healthInsurances: [{ beanBytes: buildSampleBean() }],
        },
      },
    } as unknown as PatientVisitSummary;

    const options = extractInsuranceOptions(visit);
    expect(options).toHaveLength(1);
    expect(options[0].guid).toBe('INS-GUID-01');
  });

  it('reports warnings for unsupported property formats', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<java version="1.8.0_202" class="java.beans.XMLDecoder">
 <object class="open.dolphin.infomodel.PVTHealthInsuranceModel">
  <void property="insuranceClass">
   <string>社保</string>
  </void>
  <void property="nested">
   <object class="java.lang.Object">
    <void method="toString" />
   </object>
  </void>
 </object>
</java>`;
    const bean = Buffer.from(xml, 'utf-8').toString('base64');
    const warnings: string[] = [];
    const parsed = parseHealthInsuranceBean(bean, {
      onWarning: (message) => warnings.push(message),
    } satisfies ParseHealthInsuranceOptions);

    expect(parsed).not.toBeNull();
    expect(parsed?.label).toContain('社保');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('nested');
  });

  it('falls back to placeholder entry when decoding fails', () => {
    const originalBuffer = globalThis.Buffer;
    vi.stubGlobal('Buffer', {
      from: () => {
        throw new Error('decode failed');
      },
    });

    const parsed = parseHealthInsuranceBean('@@invalid@@', { fallbackLabel: '保険情報未設定' });

    expect(parsed).not.toBeNull();
    expect(parsed?.id.startsWith('bean:')).toBe(true);
    expect(parsed?.label).toBe('保険情報未設定');

    if (originalBuffer) {
      vi.stubGlobal('Buffer', originalBuffer);
    }
  });
});
