import { Global } from '@emotion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FocusTrapDialog } from '../../../components/modals/FocusTrapDialog';
import { hasStoredAuth } from '../../../libs/http/httpClient';
import { ToneBanner } from '../../reception/components/ToneBanner';
import { receptionStyles } from '../../reception/styles';
import { recordChartsAuditEvent } from '../audit';
import { chartsPrintStyles } from '../print/printStyles';
import { DocumentClinicalDocument } from '../print/documentClinicalDocument';
import {
  clearDocumentPrintPreview,
  loadDocumentPrintPreview,
  type DocumentOutputMode,
  type DocumentPrintPreviewState,
} from '../print/documentPrintPreviewStorage';
import { DOCUMENT_TYPE_LABELS } from '../documentTemplates';
import { useOptionalSession } from '../../../AppRouter';
import { buildFacilityPath } from '../../../routes/facilityRoutes';

type OutputMode = DocumentOutputMode;
type OutputStatus = 'idle' | 'printing' | 'completed' | 'failed';

const getState = (value: unknown): DocumentPrintPreviewState | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (!obj.document || !obj.meta) return null;
  return obj as DocumentPrintPreviewState;
};

export function ChartsDocumentPrintPage() {
  return (
    <>
      <Global styles={[receptionStyles, chartsPrintStyles]} />
      <ChartsDocumentPrintContent />
    </>
  );
}

function ChartsDocumentPrintContent() {
  const session = useOptionalSession();
  const navigate = useNavigate();
  const location = useLocation();
  const restored = useMemo(() => loadDocumentPrintPreview(), []);
  const state = useMemo(() => getState(location.state) ?? restored?.value ?? null, [location.state, restored?.value]);
  const restoredAt = restored?.storedAt;
  const [printedAtIso] = useState(() => new Date().toISOString());
  const lastModeRef = useRef<OutputMode | null>(null);
  const [confirmMode, setConfirmMode] = useState<OutputMode | null>(null);
  const [outputStatus, setOutputStatus] = useState<OutputStatus>('idle');
  const [outputError, setOutputError] = useState<string | null>(null);
  const [lastOutputMode, setLastOutputMode] = useState<OutputMode | null>(null);
  const hasPermission = useMemo(() => hasStoredAuth(), []);
  const missingStateLoggedRef = useRef(false);
  const autoOutputRequestedRef = useRef(false);

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
    const docType = DOCUMENT_TYPE_LABELS[state.document.type] ?? '文書';
    document.title = `${docType}_print_${state.meta.runId}`;
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onAfterPrint = () => {
      const mode = lastModeRef.current;
      if (!mode) return;
      setOutputStatus('completed');
      setOutputError(null);
      recordChartsAuditEvent({
        action: 'PRINT_DOCUMENT',
        outcome: 'success',
        subject: 'charts-document-output',
        note: `output=${mode} afterprint`,
        patientId: state.document.patientId,
        actor: state.actor,
        runId: state.meta.runId,
        cacheHit: state.meta.cacheHit,
        missingMaster: state.meta.missingMaster,
        fallbackUsed: state.meta.fallbackUsed,
        dataSourceTransition: state.meta.dataSourceTransition,
        details: {
          operationPhase: 'do',
          documentType: state.document.type,
          documentTitle: state.document.title,
          documentIssuedAt: state.document.issuedAt,
          templateId: state.document.templateId,
          documentId: state.document.id,
        },
      });
      lastModeRef.current = null;
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, [state]);

  useEffect(() => {
    if (state || missingStateLoggedRef.current) return;
    missingStateLoggedRef.current = true;
    recordChartsAuditEvent({
      action: 'PRINT_DOCUMENT',
      outcome: 'blocked',
      subject: 'charts-document-output',
      note: 'missing_print_state',
      details: {
        operationPhase: 'lock',
        blockedReasons: ['missing_print_state'],
      },
    });
  }, [state]);

  const outputGuardReasons = useMemo(() => {
    if (!state) return [];
    const reasons: Array<{ key: string; summary: string; detail: string; next: string[] }> = [];
    if (!state.document.patientId) {
      reasons.push({
        key: 'patient_not_selected',
        summary: '患者未選択',
        detail: '患者IDが未確定のため出力できません。',
        next: ['Patients で患者を選択', 'Charts へ戻って文書を再作成'],
      });
    }
    if (!state.document.templateId) {
      reasons.push({
        key: 'template_missing',
        summary: 'テンプレ未選択',
        detail: 'テンプレートが未選択のため出力できません。',
        next: ['文書作成に戻りテンプレを選択', '保存後に再出力'],
      });
    }
    if (state.meta.missingMaster) {
      reasons.push({
        key: 'missing_master',
        summary: 'missingMaster=true',
        detail: 'マスタ欠損を検知したため出力を停止します。',
        next: ['Reception で master を再取得', '再取得完了後に再出力'],
      });
    }
    if (state.meta.fallbackUsed) {
      reasons.push({
        key: 'fallback_used',
        summary: 'fallbackUsed=true',
        detail: 'フォールバック経路のため出力を停止します。',
        next: ['Reception で再取得', 'master 解消後に再出力'],
      });
    }
    if (!hasPermission) {
      reasons.push({
        key: 'permission_denied',
        summary: '権限不足/認証不備',
        detail: '認証情報が揃っていないため出力できません。',
        next: ['再ログイン', '設定確認（facilityId/userId/password）'],
      });
    }
    return reasons;
  }, [hasPermission, state]);

  const outputDisabled = outputGuardReasons.length > 0;
  const outputGuardSummary = outputGuardReasons.map((reason) => reason.summary).join(' / ');
  const outputGuardDetail = outputGuardReasons.map((reason) => reason.detail).join(' / ');

  const recordOutputAudit = (
    outcome: 'started' | 'success' | 'blocked' | 'error',
    note: string,
    details?: Record<string, unknown>,
    error?: string,
  ) => {
    recordChartsAuditEvent({
      action: 'PRINT_DOCUMENT',
      outcome,
      subject: 'charts-document-output',
      note,
      error,
      actor: state?.actor,
      patientId: state?.document.patientId,
      runId: state?.meta.runId,
      cacheHit: state?.meta.cacheHit,
      missingMaster: state?.meta.missingMaster,
      fallbackUsed: state?.meta.fallbackUsed,
      dataSourceTransition: state?.meta.dataSourceTransition,
      details,
    });
  };

  const handleOutput = (mode: OutputMode) => {
    if (!state) return;
    if (outputDisabled) {
      const blockedReasons = outputGuardReasons.map((reason) => reason.key);
      const head = outputGuardReasons[0];
      const detail = outputGuardDetail || head?.detail || '出力前チェックでブロックされました。';
      recordOutputAudit('blocked', head?.detail ?? 'output_blocked', {
        operationPhase: 'lock',
        blockedReasons,
        documentType: state.document.type,
        documentTitle: state.document.title,
        documentIssuedAt: state.document.issuedAt,
        templateId: state.document.templateId,
        documentId: state.document.id,
      });
      setOutputStatus('failed');
      setOutputError(detail);
      return;
    }
    lastModeRef.current = mode;
    setLastOutputMode(mode);
    setOutputStatus('printing');
    setOutputError(null);
    recordOutputAudit('started', `output=${mode}`, {
      operationPhase: 'do',
      documentType: state.document.type,
      documentTitle: state.document.title,
      documentIssuedAt: state.document.issuedAt,
      templateId: state.document.templateId,
      documentId: state.document.id,
    });
    try {
      window.print();
    } catch (error) {
      const detail = error instanceof Error ? error.message : '印刷ダイアログの起動に失敗しました。';
      lastModeRef.current = null;
      setOutputStatus('failed');
      setOutputError(detail);
      recordOutputAudit(
        'error',
        `output=${mode} failed`,
        {
          operationPhase: 'do',
          documentType: state.document.type,
          documentTitle: state.document.title,
          documentIssuedAt: state.document.issuedAt,
          templateId: state.document.templateId,
          documentId: state.document.id,
        },
        detail,
      );
    }
  };

  const handleRequestOutput = (mode: OutputMode) => {
    if (!state) return;
    if (outputDisabled) {
      const blockedReasons = outputGuardReasons.map((reason) => reason.key);
      const head = outputGuardReasons[0];
      const detail = outputGuardDetail || head?.detail || '出力前チェックでブロックされました。';
      recordOutputAudit('blocked', head?.detail ?? 'output_blocked', {
        operationPhase: 'lock',
        blockedReasons,
        documentType: state.document.type,
        documentTitle: state.document.title,
        documentIssuedAt: state.document.issuedAt,
        templateId: state.document.templateId,
        documentId: state.document.id,
      });
      setOutputStatus('failed');
      setOutputError(detail);
      return;
    }
    setOutputStatus('idle');
    setOutputError(null);
    setConfirmMode(mode);
    recordOutputAudit('started', `output=${mode} approval_open`, {
      operationPhase: 'approval',
      approvalState: 'open',
      documentType: state.document.type,
      documentTitle: state.document.title,
      documentIssuedAt: state.document.issuedAt,
      templateId: state.document.templateId,
      documentId: state.document.id,
    });
  };

  useEffect(() => {
    if (!state?.initialOutputMode || autoOutputRequestedRef.current) return;
    autoOutputRequestedRef.current = true;
    handleRequestOutput(state.initialOutputMode);
  }, [handleRequestOutput, state]);

  const handleClose = () => {
    clearDocumentPrintPreview();
    navigate(buildFacilityPath(session?.facilityId, '/charts'));
  };

  if (!state) {
    return (
      <main className="charts-print">
        <div className="charts-print__screen-only">
          <ToneBanner
            tone="error"
            message="文書プレビューの状態が見つかりません（画面をリロードした可能性があります）"
            nextAction="Charts へ戻り、文書を保存してから再度プレビューを開いてください。"
          />
        </div>
        <div className="charts-print__toolbar">
          <div>
            <h1>文書印刷/エクスポート</h1>
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

  const exportDisabled = outputDisabled;
  const outputGuardHead = outputGuardReasons[0];
  const outputGuardNextAction = outputGuardHead ? outputGuardHead.next.join(' / ') : undefined;
  const outputGuardMessage = outputGuardSummary ? `出力ガード中: ${outputGuardSummary}` : '出力前チェックにより停止中です。';
  const docLabel = DOCUMENT_TYPE_LABELS[state.document.type] ?? '文書';

  return (
    <main className="charts-print">
      <div className="charts-print__screen-only">
        {restoredAt && !getState(location.state) && (
          <ToneBanner
            tone="info"
            message="文書プレビュー状態をセッションから復元しました（リロード対策）。"
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
          <h1>{docLabel} 印刷/エクスポート</h1>
          <p>
            印刷ダイアログから「送信先: PDFに保存」を選ぶことで PDF 出力として利用できます（ブラウザ仕様に従います）。
          </p>
        </div>
        <div className="charts-print__controls" role="group" aria-label="出力操作">
          <button
            type="button"
            className="charts-print__button charts-print__button--primary"
            onClick={() => handleRequestOutput('print')}
            disabled={exportDisabled}
            aria-disabled={exportDisabled}
          >
            印刷
          </button>
          <button
            type="button"
            className="charts-print__button"
            onClick={() => handleRequestOutput('pdf')}
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
            message={outputGuardMessage}
            nextAction={outputGuardNextAction ?? 'Reception で master 解決/再取得を行い、最新データで再度出力してください。'}
            runId={state.meta.runId}
          />
          <div className="charts-print__recovery" role="group" aria-label="出力復旧導線">
            <button
              type="button"
              className="charts-print__button"
              onClick={() => navigate(buildFacilityPath(session?.facilityId, '/reception'))}
            >
              Receptionへ戻る
            </button>
            <button type="button" className="charts-print__button charts-print__button--ghost" onClick={handleClose}>
              Chartsへ戻る
            </button>
          </div>
        </div>
      )}

      {outputStatus === 'failed' && (
        <div className="charts-print__screen-only">
          <ToneBanner
            tone="error"
            message={`出力に失敗しました: ${outputError ?? '原因不明'}`}
            nextAction="再試行するか、Reception/Charts に戻って状態を確認してください。"
            runId={state.meta.runId}
          />
          <div className="charts-print__recovery" role="group" aria-label="出力の再試行">
            <button
              type="button"
              className="charts-print__button charts-print__button--primary"
              onClick={() => handleRequestOutput(lastOutputMode ?? 'print')}
              disabled={exportDisabled}
            >
              再試行
            </button>
            <button
              type="button"
              className="charts-print__button"
              onClick={() => navigate(buildFacilityPath(session?.facilityId, '/reception'))}
            >
              Receptionへ戻る
            </button>
            <button type="button" className="charts-print__button charts-print__button--ghost" onClick={handleClose}>
              Chartsへ戻る
            </button>
          </div>
        </div>
      )}

      {outputStatus === 'completed' && (
        <div className="charts-print__screen-only">
          <ToneBanner
            tone="info"
            message="印刷ダイアログを閉じました。印刷/保存できなかった場合は再試行してください。"
            nextAction="再試行または戻るで運用を継続できます。"
            runId={state.meta.runId}
          />
          <div className="charts-print__recovery" role="group" aria-label="出力後の補助操作">
            <button
              type="button"
              className="charts-print__button"
              onClick={() => handleRequestOutput(lastOutputMode ?? 'print')}
              disabled={exportDisabled}
            >
              再試行
            </button>
            <button type="button" className="charts-print__button charts-print__button--ghost" onClick={handleClose}>
              閉じる
            </button>
          </div>
        </div>
      )}

      <FocusTrapDialog
        open={confirmMode !== null}
        role="dialog"
        title="出力の最終確認"
        description={`個人情報を含む診療文書を${confirmMode === 'pdf' ? 'PDF保存' : '印刷'}します。出力先/共有範囲を確認してください。（runId=${state.meta.runId}）`}
        onClose={() => {
          if (confirmMode) {
            recordOutputAudit('blocked', `output=${confirmMode} approval_cancelled`, {
              operationPhase: 'approval',
              approvalState: 'cancelled',
              blockedReasons: ['confirm_cancelled'],
              documentType: state.document.type,
              documentTitle: state.document.title,
              documentIssuedAt: state.document.issuedAt,
              templateId: state.document.templateId,
              documentId: state.document.id,
            });
          }
          setConfirmMode(null);
        }}
        testId="charts-document-print-dialog"
      >
        <div role="group" aria-label="出力の最終確認">
          <button
            type="button"
            onClick={() => {
              if (confirmMode) {
                recordOutputAudit('blocked', `output=${confirmMode} approval_cancelled`, {
                  operationPhase: 'approval',
                  approvalState: 'cancelled',
                  blockedReasons: ['confirm_cancelled'],
                  documentType: state.document.type,
                  documentTitle: state.document.title,
                  documentIssuedAt: state.document.issuedAt,
                  templateId: state.document.templateId,
                  documentId: state.document.id,
                });
              }
              setConfirmMode(null);
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              const mode = confirmMode ?? 'print';
              recordOutputAudit('started', `output=${mode} approval_confirmed`, {
                operationPhase: 'approval',
                approvalState: 'confirmed',
                documentType: state.document.type,
                documentTitle: state.document.title,
                documentIssuedAt: state.document.issuedAt,
                templateId: state.document.templateId,
                documentId: state.document.id,
              });
              setConfirmMode(null);
              handleOutput(mode);
            }}
          >
            出力する
          </button>
        </div>
      </FocusTrapDialog>

      <DocumentClinicalDocument
        document={state.document}
        printedAtIso={printedAtIso}
        actor={state.actor}
        facilityId={state.facilityId}
        meta={state.meta}
      />
    </main>
  );
}
