import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useReplayGapController } from '@/features/replay-gap/useReplayGapController';

describe('useReplayGapController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions from detection to recovery with auto reload', () => {
    const { result } = renderHook(() => useReplayGapController(500));

    act(() => {
      result.current.markGapDetected();
    });
    expect(result.current.state.phase).toBe('detected');
    expect(result.current.state.isBannerVisible).toBe(true);

    act(() => {
      result.current.startReload('auto');
    });
    expect(result.current.state.phase).toBe('reloading');
    expect(result.current.state.attempts).toBe(1);

    act(() => {
      result.current.completeReload();
    });
    expect(result.current.state.phase).toBe('recovered');
    expect(result.current.state.lastSuccessfulReloadAt).toBeDefined();
  });

  it('marks failure and escalates after three attempts', () => {
    const { result } = renderHook(() => useReplayGapController());

    act(() => {
      result.current.markGapDetected();
    });

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        result.current.startReload('manual');
      });
      act(() => {
        result.current.failReload(503);
      });
    }

    expect(result.current.state.phase).toBe('escalated');
    expect(result.current.state.attempts).toBe(3);
    expect(result.current.state.lastErrorCode).toBe(503);
  });

  it('auto-dismisses the banner after recovery', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useReplayGapController(200));

    act(() => {
      result.current.markGapDetected();
      result.current.startReload('auto');
      result.current.completeReload();
    });
    expect(result.current.state.phase).toBe('recovered');

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.isBannerVisible).toBe(false);
  });
});
