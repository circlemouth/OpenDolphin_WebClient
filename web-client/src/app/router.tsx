import { Suspense } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { PatientsPage } from '@/features/patients/pages/PatientsPage';
import { ReceptionPage } from '@/features/reception/pages/ReceptionPage';
import { ChartsPage } from '@/features/charts/pages/ChartsPage';
import { FacilitySchedulePage } from '@/features/schedule/pages/FacilitySchedulePage';
import { UserAdministrationPage } from '@/features/administration/pages/UserAdministrationPage';
import { SystemPreferencesPage } from '@/features/administration/pages/SystemPreferencesPage';
import { StampManagementPage } from '@/features/administration/pages/StampManagementPage';
import { PatientDataExportPage } from '@/features/administration/pages/PatientDataExportPage';
import { RequireAuth, RequireRole } from '@/libs/auth';

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
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <PatientsPage />
              </Suspense>
            }
          />
          <Route
            path="reception"
            element={
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <ReceptionPage />
              </Suspense>
            }
          />
          <Route
            path="facility-schedule"
            element={
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <FacilitySchedulePage />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="charts"
            element={
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <ChartsPage />
              </Suspense>
            }
          />
          <Route
            path="charts/:visitId"
            element={
              <Suspense fallback={<div>繝ｭ繝ｼ繝我ｸｭ...</div>}>
                <ChartsPage />
              </Suspense>
            }
          />
          <Route
            path="administration/users"
            element={
              <RequireRole roles={['admin']}>
                <Suspense fallback={<div>読込中...</div>}>
                  <UserAdministrationPage />
                </Suspense>
              </RequireRole>
            }
          />
          <Route
            path="administration/patients"
            element={
              <RequireRole roles={['admin']}>
                <Suspense fallback={<div>読込中...</div>}>
                  <PatientDataExportPage />
                </Suspense>
              </RequireRole>
            }
          />
          <Route
            path="administration/system"
            element={
              <RequireRole roles={['admin']}>
                <Suspense fallback={<div>読込中...</div>}>
                  <SystemPreferencesPage />
                </Suspense>
              </RequireRole>
            }
          />
          <Route
            path="administration/stamps"
            element={
              <RequireRole roles={['admin']}>
                <Suspense fallback={<div>隱ｭ霎ｼ荳ｭ...</div>}>
                  <StampManagementPage />
                </Suspense>
              </RequireRole>
            }
          />
        </Route>
      </Route>,
    ),
  );
