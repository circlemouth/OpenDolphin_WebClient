import { Global } from '@emotion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { ReceptionEntry } from '../../reception/api';
import { receptionStyles } from '../../reception/styles';
import { ToneBanner } from '../../reception/components/ToneBanner';
import { recordChartsAuditEvent } from '../audit';
import { chartsPrintStyles } from '../print/printStyles';
import { OutpatientClinicalDocument, type ChartsPrintMeta } from '../print/outpatientClinicalDocument';
import { clearOutpatientPrintPreview, loadOutpatientPrintPreview } from '../print/printPreviewStorage';

type PrintLocationState = {
  entry: ReceptionEntry;
  meta: ChartsPrintMeta;
  actor: string;
  facilityId: string;
};

type OutputMode = 'print' | 'pdf';

const getState = (value: unknown): PrintLocationState | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (!obj.entry || !obj.meta) return null;
  return obj as PrintLocationState;
};

export function ChartsOutpatientPrintPage() {
  return (
    <>
      <Global styles={[receptionStyles, chartsPrintStyles]} />
      <ChartsOutpatientPrintContent />
    </>
  );
}

function ChartsOutpatientPrintContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const restored = useMemo(() => loadOutpatientPrintPreview(), []);
  const state = useMemo(() => getState(location.state) ?? restored?.value ?? null, [location.state, restored?.value]);
  const restoredAt = restored?.storedAt;
  const [printedAtIso] = useState(() => new Date().toISOString());
  const lastModeRef = useRef<OutputMode | null>(null);

  useEffect(() => {
    document.body.dataset.route = 'charts-print';
    return () => {
      if (document.body.dataset.route === 'charts-print') {
        delete document.body.dataset.route;
      }
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const patientId = state.entry.patientId ?? state.entry.id;
    const titleId = patientId ? `_${patientId}` : '';
    document.title = `診療記録${titleId}_${state.meta.runId}`;
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onAfterPrint = () => {
      const mode = lastModeRef.current;
      if (!mode) return;
      recordChartsAuditEvent({
        action: 'PRINT_OUTPATIENT',
        outcome: 'success',
        subject: 'outpatient-document-output',
        note: `output=${mode} afterprint`,
        patientId: state.entry.patientId ?? state.entry.id,
        appointmentId: state.entry.appointmentId,
        actor: state.actor,
        runId: state.meta.runId,
        cacheHit: state.meta.cacheHit,
        missingMaster: state.meta.missingMaster,
        fallbackUsed: state.meta.fallbackUsed,
        dataSourceTransition: state.meta.dataSourceTransition,
      });
      lastModeRef.current = null;
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, [state]);

  const handleOutput = (mode: OutputMode) => {
    if (!state) return;
    lastModeRef.current = mode;
    recordChartsAuditEvent({
      action: 'PRINT_OUTPATIENT',
      outcome: 'started',
      subject: 'outpatient-document-output',
      note: `output=${mode}`,
      patientId: state.entry.patientId ?? state.entry.id,
      appointmentId: state.entry.appointmentId,
      actor: state.actor,
      runId: state.meta.runId,
      cacheHit: state.meta.cacheHit,
      missingMaster: state.meta.missingMaster,
      fallbackUsed: state.meta.fallbackUsed,
      dataSourceTransition: state.meta.dataSourceTransition,
    });
    window.print();
  };

  const handleClose = () => {
    clearOutpatientPrintPreview();
    navigate('/charts');
  };

  if (!state) {
    return (
      <main className="charts-print">
        <div className="charts-print__screen-only">
          <ToneBanner
            tone="error"
            message="印刷プレビューの状態が見つかりません（画面をリロードした可能性があります）"
            nextAction="Charts へ戻り、患者を選択してから再度「印刷/エクスポート」を開いてください。"
          />
        </div>
        <div className="charts-print__toolbar">
          <div>
            <h1>診療記録（外来サマリ） 印刷/エクスポート</h1>
            <p>状態が無いため出力できません。</p>
          </div>
          <div className="charts-print__controls">
            <button type="button" className="charts-print__button charts-print__button--primary" onClick={handleClose}>
              Chartsへ戻る
            </button>
          </div>
        </div>
      </main>
    );
  }

  const exportDisabled = state.meta.missingMaster || state.meta.fallbackUsed;

  return (
    <main className="charts-print">
      <div className="charts-print__screen-only">
        {restoredAt && !getState(location.state) && (
          <ToneBanner
            tone="info"
            message="印刷プレビュー状態をセッションから復元しました（リロード対策）。"
            nextAction="出力後は「閉じる」でセッション保存データを破棄します。"
            runId={state.meta.runId}
          />
        )}
        <ToneBanner
          tone="warning"
          message="個人情報を含む診療文書です。画面共有/第三者の閲覧に注意し、印刷物・PDFは必要最小限にしてください。"
          nextAction="不要になった印刷物は施錠保管・回収・裁断等、施設規定に従って処理してください。"
          runId={state.meta.runId}
        />
      </div>

      <div className="charts-print__toolbar">
        <div>
          <h1>診療記録（外来サマリ） 印刷/エクスポート</h1>
          <p>
            印刷ダイアログから「送信先: PDFに保存」を選ぶことで PDF 出力として利用できます（ブラウザ仕様に従います）。
          </p>
        </div>
        <div className="charts-print__controls" role="group" aria-label="出力操作">
          <button
            type="button"
            className="charts-print__button charts-print__button--primary"
            onClick={() => handleOutput('print')}
            disabled={exportDisabled}
            aria-disabled={exportDisabled}
          >
            印刷
          </button>
          <button
            type="button"
            className="charts-print__button"
            onClick={() => handleOutput('pdf')}
            disabled={exportDisabled}
            aria-disabled={exportDisabled}
          >
            PDF出力
          </button>
          <button type="button" className="charts-print__button charts-print__button--ghost" onClick={handleClose}>
            閉じる
          </button>
        </div>
      </div>

      {exportDisabled && (
        <div className="charts-print__screen-only">
          <ToneBanner
            tone="warning"
            message={
              state.meta.missingMaster
                ? 'missingMaster=true のため出力をブロック中です。'
                : 'fallbackUsed=true（スナップショット経由）のため出力をブロック中です。'
            }
            nextAction="Reception で master 解決/再取得を行い、最新データで再度出力してください。"
            runId={state.meta.runId}
          />
        </div>
      )}

      <OutpatientClinicalDocument
        entry={state.entry}
        printedAtIso={printedAtIso}
        actor={state.actor}
        facilityId={state.facilityId}
        meta={state.meta}
      />
    </main>
  );
}
