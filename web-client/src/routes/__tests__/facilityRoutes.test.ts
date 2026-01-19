import { describe, expect, it } from 'vitest';

import { buildFacilityPath, describeFacilityId, isFacilityMatch } from '../facilityRoutes';

describe('facilityRoutes', () => {
  it('describeFacilityId は空値をフォールバックに置き換える', () => {
    expect(describeFacilityId('  ')).toBe('未指定');
    expect(describeFacilityId(null, 'N/A')).toBe('N/A');
  });

  it('describeFacilityId はトリム済みの施設IDを返す', () => {
    expect(describeFacilityId(' FAC-01 ')).toBe('FAC-01');
  });

  it('isFacilityMatch は正規化した施設IDが一致した場合のみ true', () => {
    expect(isFacilityMatch('  FAC-01 ', 'FAC-01')).toBe(true);
    expect(isFacilityMatch('FAC-01', 'FAC-02')).toBe(false);
    expect(isFacilityMatch('', 'FAC-01')).toBe(false);
  });

  it('buildFacilityPath は主要画面のパスで二重スラッシュを含まない', () => {
    const facilityId = 'FAC-01';
    const targets = ['/reception', '/charts', '/patients'];
    targets.forEach((target) => {
      const built = buildFacilityPath(facilityId, target);
      expect(built.startsWith('/f/')).toBe(true);
      expect(built).toBe(`/f/${encodeURIComponent(facilityId)}${target}`);
      expect(built).not.toContain('//');
    });
  });
});
