import { Suspense } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { PatientsPage } from '@/features/patients/pages/PatientsPage';
import { RequireAuth } from '@/libs/auth';

export const createAppRouter = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Navigate to="/patients" replace />} />
          <Route
            path="patients"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <PatientsPage />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <DashboardPage />
              </Suspense>
            }
          />
        </Route>
      </Route>,
    ),
  );
