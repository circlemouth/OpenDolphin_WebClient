import { useCallback, useEffect, useReducer, useRef } from 'react';

export type ReplayGapPhase = 'idle' | 'detected' | 'reloading' | 'recovered' | 'retry' | 'escalated';
export type ReplayGapReloadMode = 'auto' | 'manual';

export interface ReplayGapState {
  phase: ReplayGapPhase;
  attempts: number;
  isBannerVisible: boolean;
  isToastVisible: boolean;
  detectedAt?: string;
  lastErrorCode?: number;
  lastSuccessfulReloadAt?: string;
  lastReloadMode?: ReplayGapReloadMode;
}

const INITIAL_STATE: ReplayGapState = {
  phase: 'idle',
  attempts: 0,
  isBannerVisible: false,
  isToastVisible: false,
};

type ReplayGapAction =
  | { type: 'GAP_DETECTED'; detectedAt: string }
  | { type: 'RELOAD_STARTED'; mode: ReplayGapReloadMode }
  | { type: 'RELOAD_SUCCEEDED'; completedAt: string }
  | { type: 'RELOAD_FAILED'; statusCode?: number }
  | { type: 'DISMISS' };

export const replayGapReducer = (state: ReplayGapState, action: ReplayGapAction): ReplayGapState => {
  switch (action.type) {
    case 'GAP_DETECTED': {
      return {
        ...INITIAL_STATE,
        phase: 'detected',
        isBannerVisible: true,
        isToastVisible: true,
        detectedAt: action.detectedAt,
        lastSuccessfulReloadAt: state.lastSuccessfulReloadAt,
      };
    }
    case 'RELOAD_STARTED': {
      const nextAttempts = state.phase === 'reloading' ? state.attempts : Math.max(state.attempts + 1, 1);
      return {
        ...state,
        phase: 'reloading',
        attempts: nextAttempts,
        isBannerVisible: true,
        isToastVisible: true,
        lastReloadMode: action.mode,
        lastErrorCode: undefined,
      };
    }
    case 'RELOAD_SUCCEEDED': {
      return {
        ...state,
        phase: 'recovered',
        isBannerVisible: true,
        isToastVisible: true,
        lastSuccessfulReloadAt: action.completedAt,
      };
    }
    case 'RELOAD_FAILED': {
      const failurePhase: ReplayGapPhase = state.attempts >= 3 ? 'escalated' : 'retry';
      return {
        ...state,
        phase: failurePhase,
        isBannerVisible: true,
        isToastVisible: true,
        lastErrorCode: action.statusCode,
      };
    }
    case 'DISMISS': {
      return {
        ...INITIAL_STATE,
        lastSuccessfulReloadAt: state.lastSuccessfulReloadAt,
      };
    }
    default:
      return state;
  }
};

export const replayGapInitialState: ReplayGapState = INITIAL_STATE;

export const useReplayGapController = (autoCloseMs = 15000) => {
  const [state, dispatch] = useReducer(replayGapReducer, INITIAL_STATE);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const markGapDetected = useCallback(() => {
    dispatch({ type: 'GAP_DETECTED', detectedAt: new Date().toISOString() });
  }, []);

  const startReload = useCallback(
    (mode: ReplayGapReloadMode) => {
      dispatch({ type: 'RELOAD_STARTED', mode });
    },
    [dispatch],
  );

  const completeReload = useCallback(() => {
    dispatch({ type: 'RELOAD_SUCCEEDED', completedAt: new Date().toISOString() });
  }, []);

  const failReload = useCallback((statusCode?: number) => {
    dispatch({ type: 'RELOAD_FAILED', statusCode });
  }, []);

  const dismiss = useCallback(() => {
    dispatch({ type: 'DISMISS' });
  }, []);

  useEffect(() => {
    clearDismissTimer();
    if (state.phase !== 'recovered') {
      return;
    }
    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, autoCloseMs);
    return () => {
      clearDismissTimer();
    };
  }, [state.phase, autoCloseMs, dismiss, clearDismissTimer]);

  useEffect(() => {
    return () => {
      clearDismissTimer();
    };
  }, [clearDismissTimer]);

  return {
    state,
    markGapDetected,
    startReload,
    completeReload,
    failReload,
    dismiss,
  };
};
