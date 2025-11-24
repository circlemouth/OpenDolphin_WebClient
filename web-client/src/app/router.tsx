import { Suspense, lazy } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { RequireAuth, RequireRole } from '@/libs/auth';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((mod) => ({ default: mod.LoginPage })));
const PatientsPage = lazy(() => import('@/features/patients/pages/PatientsPage').then((mod) => ({ default: mod.PatientsPage })));
const ReceptionPage = lazy(() => import('@/features/reception/pages/ReceptionPage').then((mod) => ({ default: mod.ReceptionPage })));
const ChartsPage = lazy(() => import('@/features/charts/pages/ChartsPage').then((mod) => ({ default: mod.ChartsPage })));
const FacilitySchedulePage = lazy(() => import('@/features/schedule/pages/FacilitySchedulePage').then((mod) => ({ default: mod.FacilitySchedulePage })));
const UserAdministrationPage = lazy(() => import('@/features/administration/pages/UserAdministrationPage').then((mod) => ({ default: mod.UserAdministrationPage })));
const SystemPreferencesPage = lazy(() => import('@/features/administration/pages/SystemPreferencesPage').then((mod) => ({ default: mod.SystemPreferencesPage })));
const StampManagementPage = lazy(() => import('@/features/administration/pages/StampManagementPage').then((mod) => ({ default: mod.StampManagementPage })));
const PatientDataExportPage = lazy(() => import('@/features/administration/pages/PatientDataExportPage').then((mod) => ({ default: mod.PatientDataExportPage })));

export const createAppRouter = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route
          path="/login"
          element={
            <Suspense fallback={<div>ロード中...</div>}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Navigate to="/reception" replace />} />
          <Route
            path="patients"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <PatientsPage />
              </Suspense>
            }
          />
          <Route
            path="reception"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <ReceptionPage />
              </Suspense>
            }
          />
          <Route
            path="facility-schedule"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <FacilitySchedulePage />
              </Suspense>
            }
          />
          <Route
            path="charts"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
                <ChartsPage />
              </Suspense>
            }
          />
          <Route
            path="charts/:visitId"
            element={
              <Suspense fallback={<div>ロード中...</div>}>
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
                <Suspense fallback={<div>読込中...</div>}>
                  <StampManagementPage />
                </Suspense>
              </RequireRole>
            }
          />
        </Route>
      </Route>,
    ),
  );
