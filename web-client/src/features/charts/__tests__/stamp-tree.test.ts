import { describe, expect, it } from 'vitest';

import { groupStampsByCategory, parseStampTreeXml, decodeStampTreeBytes } from '@/features/charts/utils/stamp-tree';

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<stampBox project="open.dolphin" version="1.0">
  <root name="処方" entity="medOrder">
    <node name="外用">
      <stampInfo name="軟膏スタンプ" entity="medOrder" role="p" editable="true" memo="軟膏処方" stampId="stamp-001" />
    </node>
    <stampInfo name="内服スタンプ" entity="medOrder" role="p" editable="true" memo="1日3回" stampId="stamp-002" />
  </root>
  <root name="検査" entity="testOrder">
    <stampInfo name="血液検査" entity="testOrder" role="p" editable="false" memo="基本検査セット" stampId="stamp-010" />
  </root>
</stampBox>`;

describe('stamp tree parser', () => {
  it('decodes base64 encoded tree bytes', () => {
    const encoded = Buffer.from(sampleXml, 'utf-8').toString('base64');
    expect(decodeStampTreeBytes(encoded)).toEqual(sampleXml);
  });

  it('parses XML to stamp definitions', () => {
    const stamps = parseStampTreeXml(sampleXml, 'personal', '個人スタンプ');
    expect(stamps).toHaveLength(3);
    const ointment = stamps.find((stamp) => stamp.stampId === 'stamp-001');
    expect(ointment).toMatchObject({
      name: '軟膏スタンプ',
      category: '処方',
      path: ['処方', '外用'],
      source: 'personal',
      memo: '軟膏処方',
      originTreeName: '個人スタンプ',
    });
  });

  it('groups stamps by category and sorts by label', () => {
    const stamps = parseStampTreeXml(sampleXml, 'personal');
    const grouped = groupStampsByCategory(stamps);
    expect(grouped).toHaveLength(2);
    const prescriptionGroup = grouped.find((group) => group.category === '処方');
    const labGroup = grouped.find((group) => group.category === '検査');
    expect(prescriptionGroup).toBeDefined();
    expect(prescriptionGroup?.stamps.map((stamp) => stamp.name)).toEqual(['内服スタンプ', '軟膏スタンプ']);
    expect(labGroup).toBeDefined();
    expect(labGroup?.stamps.map((stamp) => stamp.name)).toEqual(['血液検査']);
  });
});
