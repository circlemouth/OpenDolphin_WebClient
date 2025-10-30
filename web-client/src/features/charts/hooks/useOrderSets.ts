import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
  OrderSetDefinition,
  OrderSetInput,
  OrderSetPlanItem,
} from '@/features/charts/types/order-set';

const STORAGE_KEY = 'opd.web.orderSets.v1';

const nowIso = () => new Date().toISOString();

const withFreshIds = (items: OrderSetPlanItem[]): OrderSetPlanItem[] =>
  items.map((item) => ({ ...item, id: item.id || uuidv4() }));

const DEFAULT_ORDER_SETS: OrderSetDefinition[] = [
  {
    id: 'default-hypertension',
    name: '高血圧 再診セット',
    description: '生活指導と降圧薬継続、月1回フォローアップ用のセットです。',
    tags: ['内科', '慢性疾患'],
    progressNote: {
      objective: 'BP 138/84 mmHg。浮腫や胸痛なし。',
      assessment: '本態性高血圧。現治療を継続し生活指導を強化する。',
    },
    planItems: withFreshIds([
      {
        id: 'rx-amlodipine',
        type: 'medication',
        title: 'アムロジピン 5mg',
        detail: '1錠 毎朝 28日分',
        note: '血圧手帳で自宅測定を確認',
      },
      {
        id: 'guidance-lifestyle',
        type: 'guidance',
        title: '生活指導',
        detail: '減塩 6g/日 以下、アルコール適量。週3回の有酸素運動を推奨。',
        note: '次回来院時に体重・血圧を再確認',
      },
    ]),
    documentPreset: {
      templateId: 'instruction',
      memo: '血圧手帳を毎日記録し、次回来院時に持参してください。',
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastUsedAt: null,
  },
  {
    id: 'default-influenza',
    name: 'インフル予防接種セット',
    description: '予防接種問診・ consent 文書・ワクチン記録をまとめて適用。',
    tags: ['予防接種'],
    progressNote: {
      objective: '体温 36.6℃。咳嗽・全身倦怠感なし。',
      assessment: 'インフルエンザワクチン接種適応。',
    },
    planItems: withFreshIds([
      {
        id: 'inject-influenza',
        type: 'injection',
        title: 'インフルエンザ HA ワクチン',
        detail: '0.5mL 皮下 1回。本日実施。',
        note: '15分待機後に再診ブースで経過確認',
      },
      {
        id: 'procedure-fee',
        type: 'procedure',
        title: '予防接種実施料',
        detail: '公費対象。必要に応じて自費コード 960 を追加。',
        note: '',
      },
    ]),
    documentPreset: {
      templateId: 'vaccination-consent',
      memo: '副反応説明済。前回接種時副反応なし。',
      extraNote: '保護者同意取得済。',
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastUsedAt: null,
  },
];

const normalizeOrderSets = (sets: OrderSetDefinition[]): OrderSetDefinition[] =>
  sets.map((set) => ({
    ...set,
    tags: Array.isArray(set.tags) ? set.tags : [],
    planItems: withFreshIds(Array.isArray(set.planItems) ? set.planItems : []),
    createdAt: set.createdAt ?? nowIso(),
    updatedAt: set.updatedAt ?? nowIso(),
    lastUsedAt: set.lastUsedAt ?? null,
  }));

export const useOrderSets = () => {
  const [orderSets, setOrderSets] = useState<OrderSetDefinition[]>(() => DEFAULT_ORDER_SETS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setOrderSets(normalizeOrderSets(parsed));
          setHydrated(true);
          return;
        }
      }
      setOrderSets(DEFAULT_ORDER_SETS);
    } catch (error) {
      console.error('オーダセットの読み込みに失敗しました', error);
      setOrderSets(DEFAULT_ORDER_SETS);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orderSets));
    } catch (error) {
      console.error('オーダセットの保存に失敗しました', error);
    }
  }, [hydrated, orderSets]);

  const sorted = useMemo(() => {
    return [...orderSets].sort((a, b) => {
      const left = a.lastUsedAt ?? a.updatedAt;
      const right = b.lastUsedAt ?? b.updatedAt;
      return right.localeCompare(left);
    });
  }, [orderSets]);

  const createOrderSet = useCallback((input: OrderSetInput) => {
    const timestamp = nowIso();
    const definition: OrderSetDefinition = {
      id: uuidv4(),
      name: input.name,
      description: input.description ?? '',
      tags: input.tags,
      progressNote: input.progressNote,
      planItems: withFreshIds(input.planItems),
      documentPreset: input.documentPreset ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastUsedAt: null,
    };
    setOrderSets((prev) => [...prev, definition]);
    return definition;
  }, []);

  const updateOrderSet = useCallback((id: string, input: OrderSetInput) => {
    const timestamp = nowIso();
    let nextDefinition: OrderSetDefinition | null = null;
    setOrderSets((prev) =>
      prev.map((set) => {
        if (set.id !== id) {
          return set;
        }
        nextDefinition = {
          ...set,
          name: input.name,
          description: input.description ?? '',
          tags: input.tags,
          progressNote: input.progressNote,
          planItems: withFreshIds(input.planItems),
          documentPreset: input.documentPreset ?? null,
          updatedAt: timestamp,
        };
        return nextDefinition!;
      }),
    );
    return nextDefinition;
  }, []);

  const deleteOrderSet = useCallback((id: string) => {
    setOrderSets((prev) => prev.filter((set) => set.id !== id));
  }, []);

  const markOrderSetUsed = useCallback((id: string) => {
    const timestamp = nowIso();
    setOrderSets((prev) =>
      prev.map((set) =>
        set.id === id
          ? {
              ...set,
              lastUsedAt: timestamp,
            }
          : set,
      ),
    );
  }, []);

  return {
    orderSets: sorted,
    createOrderSet,
    updateOrderSet,
    deleteOrderSet,
    markOrderSetUsed,
  } as const;
};
