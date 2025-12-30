import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { FacilityLoginResolver } from '../FacilityLoginResolver';

const buildRouter = (initialEntry?: { pathname: string; state?: unknown }) =>
  createMemoryRouter(
    [
      { path: '/login', element: <FacilityLoginResolver /> },
      { path: '/f/:facilityId/login', element: <div>facility login</div> },
    ],
    { initialEntries: [initialEntry ?? { pathname: '/login' }] },
  );

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('FacilityLoginResolver', () => {
  it('recentFacilities が1件なら facility ログインへ自動遷移する', async () => {
    localStorage.setItem('opendolphin:web-client:recentFacilities', JSON.stringify(['0001']));
    const router = buildRouter();

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/0001/login');
    });
  });

  it('from state に施設ID付きパスがある場合は最優先で自動補完する', async () => {
    localStorage.setItem('opendolphin:web-client:recentFacilities', JSON.stringify(['0001', '0002']));
    const router = buildRouter({ pathname: '/login', state: { from: '/f/ABC-01/reception' } });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/ABC-01/login');
    });
  });

  it('from state を forwardState として維持する', async () => {
    const fromState = { pathname: '/f/XYZ-02/charts', search: '?mode=print' };
    localStorage.setItem('opendolphin:web-client:recentFacilities', JSON.stringify(['0001', '0002']));
    const router = buildRouter({ pathname: '/login', state: { from: fromState } });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/XYZ-02/login');
    });
    expect(router.state.location.state).toEqual({ from: fromState });
  });

  it('recentFacilities が複数なら施設選択を表示する', async () => {
    localStorage.setItem('opendolphin:web-client:recentFacilities', JSON.stringify(['0001', '0002']));
    const router = buildRouter();

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText('OpenDolphin Web 施設選択')).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/login');
  });

  it('recentFacilities が空で devFacilityId がある場合は自動補完する', async () => {
    localStorage.setItem('devFacilityId', 'DEV-01');
    const router = buildRouter();

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/DEV-01/login');
    });
  });
});
