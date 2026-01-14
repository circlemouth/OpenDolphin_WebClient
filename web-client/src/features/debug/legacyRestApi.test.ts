import { describe, expect, it } from 'vitest';

import { __legacyRestTestUtils, buildLegacyRestUrl } from './legacyRestApi';

describe('legacyRestApi', () => {
  it('buildLegacyRestUrl adds query when provided', () => {
    expect(buildLegacyRestUrl('/pvt', 'patientId=00001')).toBe('/pvt?patientId=00001');
    expect(buildLegacyRestUrl('/pvt?sort=desc', 'page=1')).toBe('/pvt?sort=desc&page=1');
    expect(buildLegacyRestUrl('/pvt', '  ')).toBe('/pvt');
  });

  it('parseMaybeJson respects content type and payload shape', () => {
    const { parseMaybeJson } = __legacyRestTestUtils;
    expect(parseMaybeJson('{"ok":true}', 'application/json')).toEqual({ ok: true });
    expect(parseMaybeJson('not-json', 'application/json')).toBeUndefined();
    expect(parseMaybeJson(' {"x":1}', 'text/plain')).toEqual({ x: 1 });
    expect(parseMaybeJson('hello', 'text/plain')).toBeUndefined();
  });
});
