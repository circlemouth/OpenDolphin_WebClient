import { createContext, useContext } from 'react';

export type AppToastTone = 'info' | 'success' | 'warning' | 'error';

export type AppToast = {
  id: string;
  message: string;
  detail?: string;
  tone: AppToastTone;
  durationMs?: number;
};

export type AppToastInput = Omit<AppToast, 'id'> & { id?: string };

export type AppToastController = {
  enqueue: (toast: AppToastInput) => void;
  dismiss: (id: string) => void;
};

const AppToastContext = createContext<AppToastController | null>(null);

export const AppToastProvider = AppToastContext.Provider;

export const useAppToast = () => {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within AppToastProvider');
  }
  return context;
};
