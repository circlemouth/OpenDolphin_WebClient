import styled from '@emotion/styled';

import { useAttachmentContent } from '@/features/charts/hooks/useAttachmentContent';
import type { MediaItem } from '@/features/charts/types/media';

interface ImageViewerOverlayProps {
  open: boolean;
  media: MediaItem | null;
  onClose: () => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 210;
`;

const Viewer = styled.div`
  background: ${({ theme }) => theme.palette.surface};
  padding: 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  max-width: 80vw;
  max-height: 80vh;
  display: grid;
  gap: 12px;
  min-width: 360px;
`;

const ViewerTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text};
`;

const ViewerDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ViewerContent = styled.div`
  max-width: 70vw;
  max-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  overflow: auto;
`;

const ViewerMessage = styled.p<{ $tone?: 'muted' | 'danger' }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.textMuted)};
  text-align: center;
`;

const ViewerActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ViewerButton = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px 12px;
  cursor: pointer;
  border: ${({ theme, $variant }) => ($variant === 'ghost' ? `1px solid ${theme.palette.border}` : 'none')};
  background: ${({ theme, $variant }) => ($variant === 'primary' ? theme.palette.primary : theme.palette.surface)};
  color: ${({ theme, $variant }) => ($variant === 'primary' ? theme.palette.surface : theme.palette.text)};
  font-size: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ theme, $variant }) =>
      $variant === 'primary' ? theme.palette.primaryStrong : theme.palette.surfaceStrong};
    color: ${({ theme, $variant }) => ($variant === 'primary' ? theme.palette.surface : theme.palette.text)};
  }
`;

const formatFileSize = (size?: number): string | null => {
  if (!size || size <= 0) {
    return null;
  }
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = size;
  let index = -1;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  if (index < 0) {
    index = 0;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const triggerDownload = (href: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const ImageViewerOverlay = ({ open, media, onClose }: ImageViewerOverlayProps) => {
  const attachmentId = media?.attachmentId ?? null;
  const { data, isLoading, error } = useAttachmentContent(attachmentId, {
    enabled: Boolean(open && attachmentId),
  });

  if (!open || !media) {
    return null;
  }

  const dataUrl = data?.dataUrl ?? '';
  const downloadHref = dataUrl || media.uri || '';
  const downloadName = media.fileName || data?.fileName || media.title || 'attachment';
  const sizeLabel = formatFileSize(media.size);
  const isImage = media.kind === 'image';
  const isPdf = media.kind === 'pdf';

  return (
    <Backdrop onClick={onClose} role="dialog" aria-modal="true">
      <Viewer onClick={(event) => event.stopPropagation()}>
        <ViewerTitle>{media.title}</ViewerTitle>
        {media.description ? <ViewerDescription>{media.description}</ViewerDescription> : null}
        {sizeLabel ? <ViewerMessage>ファイルサイズ：{sizeLabel}</ViewerMessage> : null}
        <ViewerContent>
          {isLoading ? (
            <ViewerMessage>添付を読み込んでいます…</ViewerMessage>
          ) : error ? (
            <ViewerMessage $tone="danger">添付の取得に失敗しました。再試行してください。</ViewerMessage>
          ) : isImage && dataUrl ? (
            <img
              src={dataUrl}
              alt={media.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }}
            />
          ) : isPdf && dataUrl ? (
            <iframe
              src={dataUrl}
              title={`${media.title} プレビュー`}
              style={{ width: '100%', height: '60vh', border: 'none' }}
            />
          ) : downloadHref ? (
            <ViewerMessage>
              この添付はプレビュー表示に対応していません。ダウンロードしてご確認ください。
            </ViewerMessage>
          ) : (
            <ViewerMessage $tone="danger">添付データが見つかりません。</ViewerMessage>
          )}
        </ViewerContent>
        <ViewerActions>
          {downloadHref ? (
            <ViewerButton
              type="button"
              $variant="primary"
              onClick={() => triggerDownload(downloadHref, downloadName)}
            >
              ダウンロード
            </ViewerButton>
          ) : null}
          <ViewerButton type="button" $variant="ghost" onClick={onClose}>
            閉じる (Esc)
          </ViewerButton>
        </ViewerActions>
      </Viewer>
    </Backdrop>
  );
};
