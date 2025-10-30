import { createContext, useContext } from 'react';

export interface SidebarController {
  setSidebar: (content: React.ReactNode | null) => void;
  clearSidebar: () => void;
}

export const SidebarContext = createContext<SidebarController | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('SidebarContext が見つかりません。AppShell 内で使用してください。');
  }
  return context;
};
