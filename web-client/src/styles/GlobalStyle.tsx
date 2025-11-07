import { Global, css, useTheme } from '@emotion/react';
import { useMemo } from 'react';

export const GlobalStyle = () => {
  const theme = useTheme();

  const styles = useMemo(
    () => css`
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      :root {
        color-scheme: only light;
      }

      html,
      body,
      #root {
        height: 100%;
        margin: 0;
      }

      body {
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.baseSize};
        line-height: 1.6;
        color: ${theme.palette.text};
        background: radial-gradient(120% 120% at 50% 0%, #ffffff 0%, ${theme.palette.background} 100%);
        -webkit-font-smoothing: antialiased;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      p {
        margin: 0;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      ul[role='list'],
      ol[role='list'] {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      button {
        font: inherit;
      }

      ::selection {
        background: ${theme.palette.primary};
        color: ${theme.palette.surface};
      }
    `,
    [theme],
  );

  return <Global styles={styles} />;
};
