import { describe, expect, it } from 'vitest';

import { validateBundleForm } from '../OrderBundleEditPanel';

const baseForm = {
  bundleName: '',
  admin: '',
  bundleNumber: '1',
  adminMemo: '',
  memo: '',
  startDate: '2025-12-29',
  items: [{ name: '', quantity: '', unit: '', memo: '' }],
};

describe('validateBundleForm', () => {
  it('medOrder: RP名・薬剤/項目・用法を必須として判定する', () => {
    const issues = validateBundleForm({ form: baseForm, entity: 'medOrder', bundleLabel: 'RP名' });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_items', 'missing_usage', 'missing_bundle_name']);
  });

  it('medOrder: 必須条件を満たす場合はエラーなし', () => {
    const issues = validateBundleForm({
      form: {
        ...baseForm,
        bundleName: '降圧薬RP',
        admin: '1日1回',
        items: [{ name: 'アムロジピン', quantity: '1', unit: '錠', memo: '' }],
      },
      entity: 'medOrder',
      bundleLabel: 'RP名',
    });
    expect(issues).toHaveLength(0);
  });

  it('medOrder: 用法が未入力の場合にエラー', () => {
    const issues = validateBundleForm({
      form: {
        ...baseForm,
        bundleName: '降圧薬RP',
        admin: '',
        items: [{ name: 'アムロジピン', quantity: '1', unit: '錠', memo: '' }],
      },
      entity: 'medOrder',
      bundleLabel: 'RP名',
    });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_usage']);
  });

  it('medOrder: RP名が未入力の場合にエラー', () => {
    const issues = validateBundleForm({
      form: {
        ...baseForm,
        bundleName: '',
        admin: '1日1回',
        items: [{ name: 'アムロジピン', quantity: '1', unit: '錠', memo: '' }],
      },
      entity: 'medOrder',
      bundleLabel: 'RP名',
    });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_bundle_name']);
  });

  it('generalOrder: 項目が必須で、用法は必須にしない', () => {
    const issues = validateBundleForm({
      form: { ...baseForm, bundleName: '処置オーダー', admin: '' },
      entity: 'generalOrder',
      bundleLabel: 'オーダー名',
    });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_items']);
  });

  it.each(['treatmentOrder', 'testOrder', 'laboTest'])('BaseEditor系 %s は項目必須', (entity) => {
    const issues = validateBundleForm({
      form: { ...baseForm, bundleName: 'BaseEditor', admin: '' },
      entity,
      bundleLabel: 'オーダー名',
    });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_items']);
  });

  it('generalOrder: オーダー名が未入力の場合にエラー', () => {
    const issues = validateBundleForm({
      form: {
        ...baseForm,
        bundleName: '',
        items: [{ name: '処置A', quantity: '1', unit: '回', memo: '' }],
      },
      entity: 'generalOrder',
      bundleLabel: 'オーダー名',
    });
    expect(issues.map((issue) => issue.key)).toEqual(['missing_bundle_name']);
  });
});
