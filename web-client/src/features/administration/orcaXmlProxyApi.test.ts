import { beforeEach, describe, expect, it, vi } from 'vitest';

import { postOrcaXmlProxy } from './orcaXmlProxyApi';
import { httpFetch } from '../../libs/http/httpClient';

vi.mock('../../libs/http/httpClient', () => ({
  httpFetch: vi.fn(),
}));

const mockHttpFetch = vi.mocked(httpFetch);

const okXml = '<data><acceptlstv2res><Api_Result>00</Api_Result></acceptlstv2res></data>';

beforeEach(() => {
  mockHttpFetch.mockReset();
});

describe('orcaXmlProxyApi', () => {
  it('200 + Api_Result=00 で ok=true を返す', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response(okXml, { status: 200, headers: { 'Content-Type': 'application/xml' } }),
    );

    const result = await postOrcaXmlProxy({
      endpoint: 'acceptlstv2',
      xml: '<data></data>',
    });

    expect(result.ok).toBe(true);
    expect(result.apiResult).toBe('00');
    expect(result.status).toBe(200);
  });

  it('500 の場合は ok=false かつ error に HTTP 500 を含む', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response('<data></data>', { status: 500, headers: { 'Content-Type': 'application/xml' } }),
    );

    const result = await postOrcaXmlProxy({
      endpoint: 'acceptlstv2',
      xml: '<data></data>',
    });

    expect(result.ok).toBe(false);
    expect(result.error ?? '').toContain('HTTP 500');
  });

  it('XMLパース失敗で ok=false になり missingTags は空配列', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response('<data><broken>', { status: 200, headers: { 'Content-Type': 'application/xml' } }),
    );

    const result = await postOrcaXmlProxy({
      endpoint: 'acceptlstv2',
      xml: '<data></data>',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.missingTags).toEqual([]);
  });
});
