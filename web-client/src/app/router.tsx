import { Suspense } from 'react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

export const createAppRouter = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<div>ロード中...</div>}>
              <DashboardPage />
            </Suspense>
          }
        />
      </Route>,
    ),
  );
