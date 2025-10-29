import type { PropsWithChildren } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@emotion/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '@/libs/auth/AuthProvider';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { appTheme } from '@/styles/theme';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface ProvidersOptions {
  withRouter: boolean;
  route: string;
}

const createProviders = (options: ProvidersOptions) => {
  const { withRouter, route } = options;

  const Providers = ({ children }: PropsWithChildren) => {
    const queryClient = createTestQueryClient();

    const content = withRouter ? <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> : children;

    return (
      <ThemeProvider theme={appTheme}>
        <GlobalStyle />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{content}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  };

  return Providers;
};

interface ExtendedRenderOptions extends RenderOptions {
  route?: string;
  withRouter?: boolean;
}

const customRender = (ui: React.ReactElement, options?: ExtendedRenderOptions) => {
  const { withRouter = true, route = '/', ...renderOptions } = options ?? {};
  const Wrapper = createProviders({ withRouter, route });

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
