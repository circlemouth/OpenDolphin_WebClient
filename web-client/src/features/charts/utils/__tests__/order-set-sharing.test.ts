import { describe, expect, it } from 'vitest';

import type { OrderSetDefinition } from '@/features/charts/types/order-set';
import type { OrderSetShareItem } from '@/features/charts/utils/order-set-sharing';
import {
  buildSharePackage,
  mergeDefinitions,
  ORDER_SET_SHARE_VERSION,
  OrderSetShareParseError,
  parseSharePackage,
  toOrderSetInput,
} from '@/features/charts/utils/order-set-sharing';

const baseDefinition: OrderSetDefinition = {
  id: 'set-1',
  name: '高血圧 再診セット',
  description: '生活指導メモ',
  tags: ['内科'],
  progressNote: {
    subjective: 'S: 頭痛',
    objective: 'O: BP 150/90',
    assessment: 'A: 高血圧',
  },
  planItems: [
    {
      id: 'item-1',
      type: 'medication',
      title: 'アムロジピン 5mg',
      detail: '1錠 毎朝',
      note: '血圧手帳確認',
    },
  ],
  documentPreset: {
    templateId: 'instruction',
    memo: '減塩指導',
    extraNote: '',
  },
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  lastUsedAt: null,
};

describe('order-set-sharing utilities', () => {
  it('builds a share package with metadata', () => {
    const pkg = buildSharePackage([baseDefinition], {
      facilityName: 'テストクリニック',
      author: '担当医 太郎',
    });
    expect(pkg.version).toBe(ORDER_SET_SHARE_VERSION);
    expect(pkg.items).toHaveLength(1);
    expect(pkg.facilityName).toBe('テストクリニック');
    expect(pkg.author).toBe('担当医 太郎');
    const item = pkg.items[0];
    expect(item.name).toBe(baseDefinition.name);
    expect(item.planItems[0].title).toBe('アムロジピン 5mg');
  });

  it('parses share packages and sanitizes values', () => {
    const raw = JSON.stringify({
      version: ORDER_SET_SHARE_VERSION,
      exportedAt: '2026-05-10T12:00:00.000Z',
      items: [
        {
          name: 'セット1',
          tags: [' 内科 '],
          planItems: [
            { type: 'medication', title: ' 薬 ', detail: ' 1錠 ', note: ' ' },
          ],
        },
      ],
    });

    const parsed = parseSharePackage(raw);
    expect(parsed.items[0].planItems[0].title).toBe('薬');
    expect(parsed.items[0].tags?.[0]).toBe('内科');

    expect(() => parseSharePackage('{invalid}')).toThrow(OrderSetShareParseError);
  });

  it('merges shared definitions and keeps counts', () => {
    const importedItem: OrderSetShareItem = {
      name: '高血圧 再診セット',
      description: '更新説明',
      tags: ['内科', 'フォロー'],
      planItems: [
        { type: 'medication', title: 'バルサルタン 80mg', detail: '1錠 毎朝', note: '' },
      ],
    };

    const { next, result } = mergeDefinitions([baseDefinition], [toOrderSetInput(importedItem)], 'merge');
    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(next[0].planItems[0].title).toBe('バルサルタン 80mg');

    const secondImport: OrderSetShareItem = {
      name: '喘息管理',
      tags: ['呼吸器'],
      planItems: [{ type: 'guidance', title: '吸入指導', detail: '1日2回', note: '' }],
    };

    const mergeResult = mergeDefinitions(next, [toOrderSetInput(secondImport)], 'merge');
    expect(mergeResult.next).toHaveLength(2);
    expect(mergeResult.result.created).toBe(1);

    const replaceResult = mergeDefinitions(next, [toOrderSetInput(secondImport)], 'replace');
    expect(replaceResult.next).toHaveLength(1);
    expect(replaceResult.result.replaced).toBe(next.length);
  });
});
