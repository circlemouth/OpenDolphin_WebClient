export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  onPrimary: string;
  primary: string;
  primaryStrong: string;
  accent: string;
  border: string;
  text: string;
  textPrimary: string;
  textMuted: string;
  success: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  dangerSubtle: string;
}

export type PaletteToken = keyof Palette;

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

export interface RadiusScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

export interface AppTheme {
  palette: Palette;
  typography: TypographyScale;
  layout: LayoutScale;
  elevation: ElevationScale;
  radius: RadiusScale;
}

const palette: Palette = {
  background: '#f9f9f9',
  surface: '#ffffff',
  surfaceMuted: '#f3f5f8',
  surfaceStrong: '#e5ebf4',
  onPrimary: '#ffffff',
  primary: '#1d3d5e',
  primaryStrong: '#142a42',
  accent: '#b8d0ed',
  border: '#c5d1df',
  text: '#1c1c1c',
  textPrimary: '#142a42',
  textMuted: '#4f5a6b',
  success: '#1a8f6a',
  warning: '#f0b429',
  warningMuted: '#fef3c7',
  danger: '#d64550',
  dangerMuted: '#f9d0d5',
  dangerSubtle: '#fdebed',
};

const typography: TypographyScale = {
  fontFamily: '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
  baseSize: '16px',
  headingLg: '1.75rem',
  headingMd: '1.375rem',
  headingSm: '1.125rem',
  body: '1rem',
  caption: '0.875rem',
};

const layout: LayoutScale = {
  headerHeight: '64px',
  footerHeight: '40px',
  navWidth: '260px',
  sidebarWidth: '340px',
  contentMaxWidth: '1280px',
  gutter: '16px',
};

const elevation: ElevationScale = {
  level0: 'none',
  level1: '0 8px 24px rgba(17, 24, 39, 0.08)',
  level2: '0 12px 32px rgba(15, 23, 42, 0.16)',
};

const radius: RadiusScale = {
  xs: '4px',
  sm: '6px',
  md: '12px',
  lg: '20px',
};

export const appTheme: AppTheme = {
  palette,
  typography,
  layout,
  elevation,
  radius,
};

declare module '@emotion/react' {
  // Extend Emotion theme with the app-specific token structure
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Theme extends AppTheme {}
}
