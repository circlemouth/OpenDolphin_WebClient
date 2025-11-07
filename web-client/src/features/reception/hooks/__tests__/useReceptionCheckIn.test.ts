import { describe, expect, it } from 'vitest';

import { extractPatientIdFromScan } from '@/features/reception/hooks/useReceptionCheckIn';

describe('extractPatientIdFromScan', () => {
  it('通常の数字列を抽出できる', () => {
    expect(extractPatientIdFromScan('00012345')).toBe('00012345');
  });

  it('アスタリスク付きバーコード形式を抽出できる', () => {
    expect(extractPatientIdFromScan('*00067890*')).toBe('00067890');
  });

  it('文字列中から最長の数字列を抽出できる', () => {
    expect(extractPatientIdFromScan('ID: 0123 CODE: 0123456')).toBe('0123456');
  });

  it('数字が含まれない場合は null を返す', () => {
    expect(extractPatientIdFromScan('NO_DATA')).toBeNull();
  });
});
