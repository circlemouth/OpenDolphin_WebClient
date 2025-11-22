import React from 'react';
import styled from '@emotion/styled';

import { getLatestTraceContext } from '@/observability/traceContext';

const FallbackSurface = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  margin: 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.palette.danger};
  background: ${({ theme }) => theme.palette.dangerMuted};
  color: ${({ theme }) => theme.palette.text};
`;

const TraceBadge = styled.code`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.surface};
  border: 1px dashed ${({ theme }) => theme.palette.border};
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

interface TraceErrorBoundaryState {
  error: Error | null;
}

interface TraceErrorBoundaryProps {
  children: React.ReactNode;
}

export class TraceErrorBoundary extends React.Component<TraceErrorBoundaryProps, TraceErrorBoundaryState> {
  constructor(props: TraceErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopyTraceInfo = (traceId: string, requestId: string) => {
    const payload = `TraceId: ${traceId}\nRequestId: ${requestId}`;
    if (!navigator.clipboard?.writeText) {
      return;
    }

    void navigator.clipboard.writeText(payload).catch((error) => {
      console.warn('[TraceErrorBoundary] クリップボードへのコピーに失敗しました。', error);
    });
  };

  render() {
    if (this.state.error) {
      const snapshot = getLatestTraceContext();
      const traceId = snapshot.traceId ?? 'N/A';
      const requestId = snapshot.requestId ?? 'N/A';

      return (
        <FallbackSurface role="alert">
          <div>
            <strong>アプリケーションでエラーが発生しました。</strong>
            <div>再読み込みをお試しください。サポートへ連絡する際は TraceId と RequestId を添えてください。</div>
          </div>
          <TraceBadge aria-label="TraceId">TraceId: {traceId}</TraceBadge>
          <TraceBadge aria-label="RequestId">RequestId: {requestId}</TraceBadge>
          <Actions>
            <button type="button" onClick={this.handleReload}>
              アプリを再読み込み
            </button>
            <button type="button" onClick={() => this.handleCopyTraceInfo(traceId, requestId)} aria-label="TraceId と RequestId をコピー">
              TraceId/RequestId をコピー
            </button>
          </Actions>
        </FallbackSurface>
      );
    }

    return this.props.children;
  }
}
