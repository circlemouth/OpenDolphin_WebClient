import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DocumentCreatePanel } from '../DocumentCreatePanel';

vi.mock('../../libs/audit/auditLogger', () => ({
  logUiState: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

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
    render(<DocumentCreatePanel {...baseProps} />);
    expect(screen.getByText('文書作成メニュー')).toBeInTheDocument();
    expect(screen.getByText('紹介状')).toBeInTheDocument();
    expect(screen.getByText('診断書')).toBeInTheDocument();
    expect(screen.getByText('返信書')).toBeInTheDocument();
    expect(screen.getByLabelText('宛先医療機関 *')).toBeInTheDocument();
  });

  it('必須項目が未入力のときに警告を表示する', async () => {
    const user = userEvent.setup();
    render(<DocumentCreatePanel {...baseProps} />);
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText(/必須項目が未入力/)).toBeInTheDocument();
  });

  it('保存すると履歴に追加される', async () => {
    const user = userEvent.setup();
    render(<DocumentCreatePanel {...baseProps} />);
    await user.type(screen.getByLabelText('宛先医療機関 *'), '東京クリニック');
    await user.type(screen.getByLabelText('宛先医師 *'), '山田太郎');
    await user.type(screen.getByLabelText('紹介目的 *'), '精査依頼');
    await user.type(screen.getByLabelText('主病名 *'), '高血圧');
    await user.type(screen.getByLabelText('紹介内容 *'), '既往歴と検査結果を記載');

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText(/文書を保存しました/)).toBeInTheDocument();
    expect(screen.getByText('保存済み文書')).toBeInTheDocument();
    expect(screen.getAllByText('紹介状').length).toBeGreaterThan(0);
  });

  it('中断で入力を破棄して閉じる', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DocumentCreatePanel {...baseProps} onClose={onClose} />);
    await user.type(screen.getByLabelText('宛先医療機関 *'), 'テスト病院');
    await user.click(screen.getByRole('button', { name: '中断' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText('入力を中断しました。')).toBeInTheDocument();
  });
});
