import styled from '@emotion/styled';

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
  padding: 16px;
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  max-width: 80vw;
  max-height: 80vh;
  display: grid;
  gap: 12px;
`;

export const ImageViewerOverlay = ({ open, media, onClose }: ImageViewerOverlayProps) => {
  if (!open || !media) {
    return null;
  }

  return (
    <Backdrop onClick={onClose} role="dialog" aria-modal="true">
      <Viewer onClick={(event) => event.stopPropagation()}>
        <img
          src={media.thumbnailUrl}
          alt={media.title}
          style={{ maxWidth: '70vw', maxHeight: '60vh', objectFit: 'contain', borderRadius: '12px' }}
        />
        <div style={{ fontWeight: 600 }}>{media.title}</div>
        {media.description ? <div style={{ fontSize: '0.9rem', color: '#4f5a6b' }}>{media.description}</div> : null}
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', alignSelf: 'end', background: '#1d3d5e', color: '#fff', padding: '6px 12px', borderRadius: '8px' }}
        >
          閉じる (Esc)
        </button>
      </Viewer>
    </Backdrop>
  );
};
