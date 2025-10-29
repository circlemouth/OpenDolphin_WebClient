export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  primary: string;
  primaryStrong: string;
  accent: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
}

export interface TypographyScale {
  fontFamily: string;
  baseSize: string;
  headingLg: string;
  headingMd: string;
  headingSm: string;
  body: string;
  caption: string;
}

export interface LayoutScale {
  headerHeight: string;
  footerHeight: string;
  navWidth: string;
  sidebarWidth: string;
  contentMaxWidth: string;
  gutter: string;
}

export interface ElevationScale {
  level0: string;
  level1: string;
  level2: string;
}

export interface AppTheme {
  palette: Palette;
  typography: TypographyScale;
  layout: LayoutScale;
  elevation: ElevationScale;
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const appTheme: AppTheme = {
  palette: {
    background: '#f4f7fb',
    surface: '#ffffff',
    surfaceMuted: '#f0f2f7',
    surfaceStrong: '#e0e7ff',
    primary: '#3a7afe',
    primaryStrong: '#2459c9',
    accent: '#05c3a7',
    border: '#d0d7e4',
    text: '#1b2a4a',
    textMuted: '#5a6785',
    success: '#17a398',
    warning: '#ffb547',
    danger: '#e45865',
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
    baseSize: '16px',
    headingLg: '1.75rem',
    headingMd: '1.375rem',
    headingSm: '1.125rem',
    body: '1rem',
    caption: '0.875rem',
  },
  layout: {
    headerHeight: '64px',
    footerHeight: '40px',
    navWidth: '260px',
    sidebarWidth: '340px',
    contentMaxWidth: '1280px',
    gutter: '16px',
  },
  elevation: {
    level0: 'none',
    level1: '0 8px 24px rgba(17, 24, 39, 0.08)',
    level2: '0 12px 32px rgba(15, 23, 42, 0.16)',
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
  },
};

declare module '@emotion/react' {
  // Emotion の Theme をアプリ独自のトークン構造で拡張するための宣言
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Theme extends AppTheme {}
}
