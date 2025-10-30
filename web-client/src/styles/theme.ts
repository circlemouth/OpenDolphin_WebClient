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
    background: '#f9f9f9',
    surface: '#ffffff',
    surfaceMuted: '#f3f5f8',
    surfaceStrong: '#e5ebf4',
    primary: '#1d3d5e',
    primaryStrong: '#142a42',
    accent: '#b8d0ed',
    border: '#c5d1df',
    text: '#1c1c1c',
    textMuted: '#4f5a6b',
    success: '#1a8f6a',
    warning: '#f0b429',
    danger: '#d64550',
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
