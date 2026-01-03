import { describe, expect, it } from 'vitest';

import { describeFacilityId, isFacilityMatch } from '../facilityRoutes';

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
});
