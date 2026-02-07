import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import type { LiveRegionTone } from '../../libs/observability/types';
import { copyRunIdToClipboard } from '../../libs/observability/runIdCopy';
import { useAppToast } from '../../libs/ui/appToast';

type RunIdBadgeProps = {
  runId?: string;
  tone?: LiveRegionTone;
  showCopy?: boolean;
  className?: string;
};

export function RunIdBadge({ runId, tone = 'info', showCopy = true, className }: RunIdBadgeProps) {
  const resolvedRunId = resolveRunId(runId);
  const { enqueue } = useAppToast();

  const handleCopy = async () => {
    if (!resolvedRunId) {
      enqueue({ tone: 'error', message: 'RUN_ID が未取得です', detail: 'ログイン情報を確認してください。' });
      return;
    }
    try {
      const method = await copyRunIdToClipboard(resolvedRunId);
      if (method === 'prompt') {
        enqueue({ tone: 'info', message: '手動コピーを開きました', detail: resolvedRunId, durationMs: 3600 });
      } else {
        enqueue({ tone: 'success', message: 'RUN_ID をコピーしました', detail: resolvedRunId, durationMs: 2400 });
      }
    } catch {
      enqueue({
        tone: 'error',
        message: 'RUN_ID のコピーに失敗しました',
        detail: 'クリップボード権限を確認してください。',
        durationMs: 2400,
      });
    }
  };

  return (
    <div
      className={`runid-badge${className ? ` ${className}` : ''}`}
      role="status"
      aria-live={resolveAriaLive(tone)}
      aria-atomic="true"
      data-run-id={resolvedRunId}
    >
      <span className="runid-badge__label">RUN_ID</span>
      <span className="runid-badge__value">{resolvedRunId ?? '未取得'}</span>
      {showCopy && resolvedRunId ? (
        <button type="button" className="runid-badge__copy" onClick={handleCopy} aria-label="RUN_ID をコピー">
          コピー
        </button>
      ) : null}
    </div>
  );
}
