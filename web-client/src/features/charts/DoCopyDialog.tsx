import { FocusTrapDialog } from '../../components/modals/FocusTrapDialog';
import { SOAP_SECTION_LABELS, type SoapSectionKey } from './soapNote';

export type DoCopyDialogState = {
  open: boolean;
  section: SoapSectionKey;
  source: { authoredAt?: string; authorRole?: string; body: string };
  target: { body: string };
  applied: boolean;
};

type DoCopyDialogProps = {
  state: DoCopyDialogState | null;
  onApply: () => void;
  onUndo: () => void;
  onClose: () => void;
};

export function DoCopyDialog({ state, onApply, onUndo, onClose }: DoCopyDialogProps) {
  const open = state?.open ?? false;
  const section = state?.section ?? 'subjective';
  const sourceBody = state?.source.body ?? '';
  const targetBody = state?.target.body ?? '';
  const applied = state?.applied ?? false;
  const sourceMeta = [state?.source.authoredAt ? `authoredAt=${state.source.authoredAt}` : null, state?.source.authorRole ? `role=${state.source.authorRole}` : null]
    .filter(Boolean)
    .join(' / ');

  return (
    <FocusTrapDialog
      open={open}
      role="dialog"
      title={`Do転記プレビュー（${SOAP_SECTION_LABELS[section]}）`}
      description="転記元の内容を、現在のSOAPドラフトへ反映します（Undoは1回）。"
      onClose={onClose}
      testId="charts-do-copy-dialog"
    >
      <div className="charts-do-copy">
        <div className="charts-do-copy__panel" aria-label="転記元">
          <div className="charts-do-copy__label">
            <strong>転記元</strong>
            <span className="charts-do-copy__meta">{sourceMeta || '—'}</span>
          </div>
          <textarea readOnly value={sourceBody} rows={7} />
        </div>

        <div className="charts-do-copy__panel" aria-label="転記先（現在ドラフト）">
          <div className="charts-do-copy__label">
            <strong>転記先（現在ドラフト）</strong>
            <span className="charts-do-copy__meta">上書きされます</span>
          </div>
          <textarea readOnly value={targetBody} rows={7} />
        </div>

        <div className="charts-do-copy__actions" role="group" aria-label="Do転記操作">
          {!applied ? (
            <>
              <button type="button" className="charts-do-copy__primary" onClick={onApply}>
                適用
              </button>
              <button type="button" className="charts-do-copy__ghost" onClick={onClose}>
                キャンセル
              </button>
            </>
          ) : (
            <>
              <button type="button" className="charts-do-copy__primary" onClick={onUndo}>
                Undo（取り消し）
              </button>
              <button type="button" className="charts-do-copy__ghost" onClick={onClose}>
                閉じる
              </button>
            </>
          )}
        </div>
      </div>
    </FocusTrapDialog>
  );
}

