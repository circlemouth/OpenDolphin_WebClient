import type { Preview } from '@storybook/react';
import { ThemeProvider } from '@emotion/react';

import { GlobalStyle } from '../src/styles/GlobalStyle';
import { appTheme } from '../src/styles/theme';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app background',
      values: [
        { name: 'app background', value: appTheme.palette.background },
        { name: 'surface', value: appTheme.palette.surface },
      ],
    },
    options: {
      storySort: {
        order: ['Design System', 'Features'],
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={appTheme}>
        <GlobalStyle />
        <div style={{ minHeight: '100vh', padding: '32px' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
