import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  fetchKarteImageList,
  sendKarteDocumentWithAttachments,
  validateAttachmentPayload,
  IMAGE_ATTACHMENT_ALLOWED_EXTENSIONS,
  IMAGE_ATTACHMENT_MAX_SIZE_BYTES,
  type KarteImageListItem,
} from '../api';
import { buildAttachmentPayload, buildImageDocumentPayload, formatBytes } from '../imageUploader';
import { logAuditEvent } from '../../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../../libs/telemetry/telemetryClient';
import { ensureObservabilityMeta, resolveAriaLive, resolveRunId } from '../../../libs/observability/observability';
import { ImageCameraCapture } from './ImageCameraCapture';
import { ImageDropzone } from './ImageDropzone';

type UploadStatus = 'queued' | 'uploading' | 'success' | 'error';

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
  endpoint?: string;
};

type StatusMessage = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

const PROGRESS_TICK_MS = 80;

const formatRecordedAt = (value?: string) => {
  if (!value) return '―';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ja-JP');
};

const buildUploadId = () => `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ImageDockedPanel({
  patientId,
  appointmentId,
  runId,
}: {
  patientId?: string;
  appointmentId?: string;
  runId?: string;
}) {
  const meta = ensureObservabilityMeta();
  const resolvedRunId = resolveRunId(runId) ?? meta.runId;
  const infoLive = resolveAriaLive('info');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const uploadItemsRef = useRef<UploadItem[]>([]);
  const progressTimersRef = useRef<Map<string, number>>(new Map());
  const uploadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  useEffect(() => {
    return () => {
      progressTimersRef.current.forEach((timer) => window.clearInterval(timer));
      progressTimersRef.current.clear();
      uploadItemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const imageListQuery = useQuery({
    queryKey: ['karte-image-list', patientId],
    queryFn: () => fetchKarteImageList({ chartId: patientId, allowTypoFallback: true }),
  });

  const listItems = imageListQuery.data?.list ?? [];

  const maxSizeLabel = useMemo(() => {
    return `最大 ${formatBytes(IMAGE_ATTACHMENT_MAX_SIZE_BYTES)}`;
  }, []);

  const updateUploadItem = useCallback((id: string, updater: (item: UploadItem) => UploadItem) => {
    setUploadItems((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const startProgressTicker = useCallback(
    (id: string) => {
      if (progressTimersRef.current.has(id)) return;
      const timer = window.setInterval(() => {
        setUploadItems((prev) =>
          prev.map((item) => {
            if (item.id !== id || item.status !== 'uploading') return item;
            const next = Math.min(item.progress + 5, 90);
            return { ...item, progress: next };
          }),
        );
      }, PROGRESS_TICK_MS);
      progressTimersRef.current.set(id, timer);
    },
    [],
  );

  const stopProgressTicker = useCallback((id: string) => {
    const timer = progressTimersRef.current.get(id);
    if (timer) {
      window.clearInterval(timer);
      progressTimersRef.current.delete(id);
    }
  }, []);

  const recordTelemetry = useCallback(
    (payload: { outcome: 'started' | 'success' | 'error'; contentSize: number; endpoint?: string; reason?: string; fileName?: string }) => {
      recordOutpatientFunnel('charts_patient_sidepane', {
        action: 'image_upload_ui',
        outcome: payload.outcome,
        note: JSON.stringify({
          contentSize: payload.contentSize,
          endpoint: payload.endpoint,
          fileName: payload.fileName,
        }),
        reason: payload.outcome === 'error' ? payload.reason ?? 'upload_failed' : undefined,
      });
    },
    [],
  );

  const recordAudit = useCallback(
    (payload: { outcome: 'started' | 'success' | 'error'; contentSize: number; endpoint?: string; fileName?: string; error?: string }) => {
      logAuditEvent({
        runId: resolvedRunId,
        traceId: meta.traceId,
        payload: {
          action: 'image_upload_ui',
          screen: 'charts',
          outcome: payload.outcome,
          endpoint: payload.endpoint,
          contentSize: payload.contentSize,
          fileName: payload.fileName,
          patientId,
          appointmentId,
          error: payload.error,
          details: {
            endpoint: payload.endpoint,
            contentSize: payload.contentSize,
            fileName: payload.fileName,
            patientId,
            appointmentId,
          },
        },
      });
    },
    [appointmentId, meta.traceId, patientId, resolvedRunId],
  );

  const handleUpload = useCallback(
    async (itemId: string) => {
      if (uploadingRef.current.has(itemId)) return;
      const item = uploadItemsRef.current.find((entry) => entry.id === itemId);
      if (!item) return;
      uploadingRef.current.add(itemId);
      updateUploadItem(itemId, (current) => ({
        ...current,
        status: 'uploading',
        progress: current.progress > 0 ? current.progress : 1,
        error: undefined,
      }));
      startProgressTicker(itemId);
      recordTelemetry({
        outcome: 'started',
        contentSize: item.file.size,
        endpoint: '/karte/document',
        fileName: item.file.name,
      });
      recordAudit({
        outcome: 'started',
        contentSize: item.file.size,
        endpoint: '/karte/document',
        fileName: item.file.name,
      });

      try {
        const attachment = await buildAttachmentPayload(item.file);
        const validation = validateAttachmentPayload([attachment]);
        if (!validation.ok) {
          const message = validation.errors.map((entry) => entry.message).join(' / ');
          updateUploadItem(itemId, (current) => ({ ...current, status: 'error', error: message, progress: 100 }));
          setStatusMessage({ tone: 'error', message: `アップロードに失敗しました: ${message}` });
          recordTelemetry({
            outcome: 'error',
            contentSize: item.file.size,
            endpoint: '/karte/document',
            reason: message,
            fileName: item.file.name,
          });
          recordAudit({
            outcome: 'error',
            contentSize: item.file.size,
            endpoint: '/karte/document',
            fileName: item.file.name,
            error: message,
          });
          return;
        }
        const payload = buildImageDocumentPayload({
          attachments: [attachment],
          patientId,
          title: '画像添付',
        });
        const result = await sendKarteDocumentWithAttachments(payload, { method: 'PUT', validate: false });
        if (!result.ok) {
          const message = result.error ?? `HTTP ${result.status}`;
          updateUploadItem(itemId, (current) => ({
            ...current,
            status: 'error',
            error: message,
            progress: 100,
            endpoint: result.endpoint,
          }));
          setStatusMessage({ tone: 'error', message: `アップロードに失敗しました: ${message}` });
          recordTelemetry({
            outcome: 'error',
            contentSize: item.file.size,
            endpoint: result.endpoint,
            reason: message,
            fileName: item.file.name,
          });
          recordAudit({
            outcome: 'error',
            contentSize: item.file.size,
            endpoint: result.endpoint,
            fileName: item.file.name,
            error: message,
          });
          return;
        }
        updateUploadItem(itemId, (current) => ({
          ...current,
          status: 'success',
          progress: 100,
          endpoint: result.endpoint,
        }));
        setStatusMessage({ tone: 'success', message: `${item.file.name} をアップロードしました。` });
        recordTelemetry({
          outcome: 'success',
          contentSize: item.file.size,
          endpoint: result.endpoint,
          fileName: item.file.name,
        });
        recordAudit({
          outcome: 'success',
          contentSize: item.file.size,
          endpoint: result.endpoint,
          fileName: item.file.name,
        });
        await imageListQuery.refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'アップロードに失敗しました。';
        updateUploadItem(itemId, (current) => ({
          ...current,
          status: 'error',
          error: message,
          progress: 100,
        }));
        setStatusMessage({ tone: 'error', message: `アップロードに失敗しました: ${message}` });
        recordTelemetry({
          outcome: 'error',
          contentSize: item.file.size,
          endpoint: '/karte/document',
          reason: message,
          fileName: item.file.name,
        });
        recordAudit({
          outcome: 'error',
          contentSize: item.file.size,
          endpoint: '/karte/document',
          fileName: item.file.name,
          error: message,
        });
      } finally {
        uploadingRef.current.delete(itemId);
        stopProgressTicker(itemId);
      }
    },
    [imageListQuery, patientId, recordAudit, recordTelemetry, startProgressTicker, stopProgressTicker, updateUploadItem],
  );

  useEffect(() => {
    const queued = uploadItems.filter((item) => item.status === 'queued');
    queued.forEach((item) => {
      handleUpload(item.id);
    });
  }, [handleUpload, uploadItems]);

  const enqueueFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setUploadItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: buildUploadId(),
        file,
        status: 'queued' as UploadStatus,
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const handleRetry = useCallback(
    (itemId: string) => {
      updateUploadItem(itemId, (current) => ({ ...current, status: 'queued', error: undefined, progress: 0 }));
    },
    [updateUploadItem],
  );

  const statusLive = statusMessage?.tone === 'error' ? resolveAriaLive('error') : resolveAriaLive('success');
  const statusRole = statusMessage?.tone === 'error' ? 'alert' : 'status';

  return (
    <section className="charts-image-panel" data-test-id="charts-image-panel" data-run-id={resolvedRunId}>
      <header className="charts-image-panel__header">
        <div>
          <p className="charts-image-panel__eyebrow">画像/スキャン</p>
          <h3>患者画像</h3>
          <p className="charts-image-panel__lead">
            サムネイル一覧の確認と、ファイル/カメラからのアップロード導線をまとめています。
          </p>
        </div>
        <div className="charts-image-panel__meta" aria-live={infoLive}>
          <span>対応拡張子: {IMAGE_ATTACHMENT_ALLOWED_EXTENSIONS.join(', ')}</span>
          <span>最大サイズ: {formatBytes(IMAGE_ATTACHMENT_MAX_SIZE_BYTES)}</span>
        </div>
      </header>

      {statusMessage ? (
        <div
          className={`charts-image-panel__status charts-image-panel__status--${statusMessage.tone}`}
          role={statusRole}
          aria-live={statusLive}
          aria-atomic="true"
          data-test-id="image-upload-status"
        >
          {statusMessage.message}
        </div>
      ) : null}

      {!patientId ? (
        <div className="charts-image-panel__notice" role="alert" aria-live="assertive">
          患者が未選択のため、画像の登録は無効です。患者を選択してください。
        </div>
      ) : null}

      <div className="charts-image-panel__upload">
        <ImageDropzone onFiles={enqueueFiles} disabled={!patientId} maxSizeLabel={maxSizeLabel} />
        <div className="charts-image-panel__queue" data-test-id="image-upload-queue">
          <h4>アップロード状況</h4>
          {uploadItems.length === 0 ? (
            <p className="charts-image-panel__empty" role="status" aria-live={infoLive}>
              追加した画像はここに表示されます。
            </p>
          ) : (
            <ul>
              {uploadItems.map((item) => (
                <li key={item.id} data-test-id="image-upload-item">
                  <div className="charts-image-panel__queue-item">
                    <div className="charts-image-panel__queue-thumb">
                      {item.previewUrl ? <img src={item.previewUrl} alt={item.file.name} /> : null}
                    </div>
                    <div className="charts-image-panel__queue-info">
                      <div className="charts-image-panel__queue-name">{item.file.name}</div>
                      <div className="charts-image-panel__queue-meta">
                        <span>{formatBytes(item.file.size)}</span>
                        <span>{item.status === 'uploading' ? 'アップロード中' : item.status === 'success' ? '完了' : item.status === 'error' ? '失敗' : '待機'}</span>
                      </div>
                      {item.error ? <p className="charts-image-panel__queue-error">{item.error}</p> : null}
                      <div className="charts-image-panel__queue-progress">
                        <progress value={item.progress} max={100} data-test-id="image-upload-progress" />
                        <span>{item.progress}%</span>
                      </div>
                    </div>
                    <div className="charts-image-panel__queue-actions">
                      {item.status === 'error' ? (
                        <button type="button" onClick={() => handleRetry(item.id)} disabled={!patientId}>
                          再試行
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ImageCameraCapture
          onCapture={(file) => enqueueFiles([file])}
          disabled={!patientId}
        />
      </div>

      <div className="charts-image-panel__gallery">
        <div className="charts-image-panel__gallery-header">
          <h4>サムネイル一覧</h4>
          <button type="button" onClick={() => imageListQuery.refetch()} disabled={imageListQuery.isFetching}>
            {imageListQuery.isFetching ? '更新中…' : '再取得'}
          </button>
        </div>
        {imageListQuery.isLoading ? (
          <p className="charts-image-panel__empty" role="status" aria-live={infoLive}>
            読み込み中…
          </p>
        ) : imageListQuery.isError || (imageListQuery.data && !imageListQuery.data.ok) ? (
          <div className="charts-image-panel__error" role="alert" aria-live="assertive">
            画像一覧の取得に失敗しました。再取得してください。
          </div>
        ) : listItems.length === 0 ? (
          <p className="charts-image-panel__empty" role="status" aria-live={infoLive}>
            画像が登録されていません。
          </p>
        ) : (
          <ul className="charts-image-panel__grid" data-test-id="image-thumbnail-list">
            {listItems.map((item: KarteImageListItem) => (
              <li key={item.id} className="charts-image-panel__card">
                <div className="charts-image-panel__thumb">
                  {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title ?? item.fileName ?? 'image'} /> : null}
                </div>
                <div className="charts-image-panel__card-body">
                  <strong>{item.title ?? item.fileName ?? '画像'}</strong>
                  <span>{formatBytes(item.contentSize)}</span>
                  <span>{formatRecordedAt(item.recordedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
