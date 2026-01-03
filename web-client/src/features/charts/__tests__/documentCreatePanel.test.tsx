import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { DocumentCreatePanel } from '../DocumentCreatePanel';
import { logUiState } from '../../../libs/audit/auditLogger';

vi.mock('../../../libs/audit/auditLogger', () => ({
  logUiState: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('DocumentCreatePanel', () => {
  const baseProps = {
    patientId: 'P-100',
    meta: {
      runId: 'RUN-DOC',
      cacheHit: false,
      missingMaster: false,
      fallbackUsed: false,
      dataSourceTransition: 'server' as const,
    },
  };

  it('文書作成メニューとフォームが表示される', () => {
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText('文書作成メニュー')).toBeInTheDocument();
    expect(screen.getByText('紹介状')).toBeInTheDocument();
    expect(screen.getByText('診断書')).toBeInTheDocument();
    expect(screen.getByText('返信書')).toBeInTheDocument();
    expect(screen.getByLabelText('テンプレート *')).toBeInTheDocument();
    expect(screen.getByLabelText('宛先医療機関 *')).toBeInTheDocument();
  });

  it('必須項目が未入力のときに警告を表示する', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText(/必須項目が未入力/)).toBeInTheDocument();
  });

  it('保存すると履歴に追加される', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    await user.selectOptions(screen.getByLabelText('テンプレート *'), 'REF-ODT-STD');
    await user.type(screen.getByLabelText('宛先医療機関 *'), '東京クリニック');
    await user.type(screen.getByLabelText('宛先医師 *'), '山田太郎');
    await user.type(screen.getByLabelText('紹介目的 *'), '精査依頼');
    await user.type(screen.getByLabelText('主病名 *'), '高血圧');
    await user.type(screen.getByLabelText('紹介内容 *'), '既往歴と検査結果を記載');

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText(/文書を保存しました/)).toBeInTheDocument();
    expect(screen.getByText('保存済み文書')).toBeInTheDocument();
    expect(screen.getAllByText('紹介状').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'プレビュー' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '印刷' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PDF出力' })).toBeInTheDocument();
  });

  it('文書履歴の検索・フィルタが機能する', async () => {
    localStorage.setItem('devFacilityId', 'F-1');
    localStorage.setItem('devUserId', 'U-1');
    localStorage.setItem('devPasswordMd5', 'md5');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText('テンプレート *'), 'REF-ODT-STD');
    await user.type(screen.getByLabelText('宛先医療機関 *'), '東京クリニック');
    await user.type(screen.getByLabelText('宛先医師 *'), '山田太郎');
    await user.type(screen.getByLabelText('紹介目的 *'), '精査依頼');
    await user.type(screen.getByLabelText('主病名 *'), '高血圧');
    await user.type(screen.getByLabelText('紹介内容 *'), '既往歴と検査結果を記載');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await user.click(screen.getByRole('tab', { name: /診断書/ }));
    await user.selectOptions(screen.getByLabelText('テンプレート *'), 'CERT-ODT-STD');
    await user.type(screen.getByLabelText('提出先 *'), '会社提出');
    await user.type(screen.getByLabelText('診断名 *'), '感冒');
    await user.type(screen.getByLabelText('用途 *'), '勤務先提出');
    await user.type(screen.getByLabelText('所見 *'), '安静と投薬');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await user.selectOptions(screen.getByLabelText('文書種別フィルタ'), 'certificate');
    const list = screen.getByRole('list');
    expect(within(list).getByText('会社提出')).toBeInTheDocument();
    expect(within(list).queryByText('東京クリニック')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('文書履歴の検索'), '会社');
    expect(within(list).getByText('会社提出')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('出力可否フィルタ'), 'available');
    expect(within(list).getByText('会社提出')).toBeInTheDocument();
  });

  it('中断で入力を破棄して閉じる', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} onClose={onClose} />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('宛先医療機関 *'), 'テスト病院');
    await user.click(screen.getByRole('button', { name: '中断' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText('入力を中断しました。')).toBeInTheDocument();
  });

  it('テンプレ選択でUIログを記録する', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    await user.selectOptions(screen.getByLabelText('テンプレート *'), 'REF-ODT-STD');
    const mocked = vi.mocked(logUiState);
    expect(mocked).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'scenario_change',
        screen: 'charts/document-create',
        controlId: 'document-template',
        details: expect.objectContaining({
          templateId: 'REF-ODT-STD',
        }),
      }),
    );
  });

  it('文書出力の成功結果を履歴とトーストへ反映する', () => {
    sessionStorage.setItem(
      'opendolphin:web-client:charts:document-history',
      JSON.stringify({
        version: 1,
        documents: [
          {
            id: 'doc-1',
            type: 'referral',
            issuedAt: '2025-12-01',
            title: '東京クリニック',
            savedAt: '2025-12-01T09:00:00Z',
            templateId: 'REF-ODT-STD',
            templateLabel: '標準紹介状',
            form: {
              issuedAt: '2025-12-01',
              templateId: 'REF-ODT-STD',
              hospital: '東京クリニック',
              doctor: '山田太郎',
              purpose: '精査依頼',
              diagnosis: '高血圧',
              body: '既往歴と検査結果を記載',
            },
            patientId: 'P-100',
          },
        ],
      }),
    );
    sessionStorage.setItem(
      'opendolphin:web-client:charts:printResult:document',
      JSON.stringify({
        documentId: 'doc-1',
        outcome: 'success',
        mode: 'print',
        at: '2026-01-03T00:00:00Z',
        detail: 'output=print afterprint',
        runId: 'RUN-DOC',
        traceId: 'TRACE-1',
        endpoint: 'window.print',
        httpStatus: 200,
      }),
    );
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/文書出力成功/)).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getByText(/監査結果: 成功/)).toBeInTheDocument();
  });

  it('文書出力の失敗結果で監査フィルタと復旧導線が表示される', async () => {
    sessionStorage.setItem(
      'opendolphin:web-client:charts:document-history',
      JSON.stringify({
        version: 1,
        documents: [
          {
            id: 'doc-2',
            type: 'certificate',
            issuedAt: '2025-12-02',
            title: '会社提出',
            savedAt: '2025-12-02T10:00:00Z',
            templateId: 'CERT-ODT-STD',
            templateLabel: '標準診断書',
            form: {
              issuedAt: '2025-12-02',
              templateId: 'CERT-ODT-STD',
              submitTo: '会社提出',
              diagnosis: '感冒',
              purpose: '勤務先提出',
              body: '安静と投薬',
            },
            patientId: 'P-100',
          },
        ],
      }),
    );
    sessionStorage.setItem(
      'opendolphin:web-client:charts:printResult:document',
      JSON.stringify({
        documentId: 'doc-2',
        outcome: 'failed',
        mode: 'pdf',
        at: '2026-01-03T00:00:00Z',
        detail: '印刷ダイアログの起動に失敗しました。',
        runId: 'RUN-DOC',
        traceId: 'TRACE-2',
        endpoint: 'window.print',
        httpStatus: 0,
      }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DocumentCreatePanel {...baseProps} />
      </MemoryRouter>,
    );
    await user.selectOptions(screen.getByLabelText('監査結果フィルタ'), 'failed');
    const list = screen.getByRole('list');
    expect(within(list).getByText('会社提出')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /再出力/ })).toBeInTheDocument();
  });
});
