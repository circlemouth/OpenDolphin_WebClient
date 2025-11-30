import { useCallback, useMemo } from 'react';

import { Stack } from '@/components';
import type { FacilityScheduleEntry } from '@/features/schedule/api/facility-schedule-api';
import { ScheduleReservationDialog } from '@/features/schedule/components/ScheduleReservationDialog';
import { PatientDataExportPage } from '@/features/administration/pages/PatientDataExportPage';

const testEntry: FacilityScheduleEntry = {
  visitId: 12345,
  patientPk: 67890,
  patientId: '0000001',
  patientName: '山田 太郎',
  patientKana: 'ヤマダ タロウ',
  scheduledAt: '2025-11-29T15:40:00+09:00',
  appointment: '外来',
  departmentName: '内科',
  doctorName: '田中 医師',
  memo: 'E2E テスト予約',
  facilityId: '1.3.6.1.4.1.9414.72.101',
  jmariNumber: '12345',
  state: 0,
  firstInsurance: '協会けんぽ',
  raw: {
    id: 12345,
    facilityId: '1.3.6.1.4.1.9414.72.101',
    pvtDate: '2025-11-29T15:40:00+09:00',
    department: '内科',
    state: 0,
    doctorId: 'doctor1',
    doctorName: '田中 医師',
    deptName: '内科',
    patientModel: {
      id: 67890,
      patientId: '0000001',
      fullName: '山田 太郎',
      kanaName: 'ヤマダ タロウ',
      gender: 'M',
      birthday: '1982-04-01',
      ownerUUID: 'e2e-device',
      firstInsurance: '協会けんぽ',
    },
  },
};

const selectedDate = '2025-11-29';
const runId = '20251129T163000Z';

export const E2eFacilitySchedulePage = () => {
  const onClose = useCallback(() => {
    // noop
  }, []);
  const onCreateDocument = useCallback(() => {
    // noop
  }, []);
  const onDeleteReservation = useCallback(() => {
    // noop
  }, []);
  const onOpenChart = useCallback(() => {
    // noop
  }, []);

  const entry = useMemo(() => testEntry, []);

  return (
    <Stack gap={24} style={{ padding: 32, background: '#f6f7fb', minHeight: '100vh' }}>
      <div>
        <h1>e2e FacilitySchedule Playground</h1>
        <p>予約ダイアログ + 患者データ出力を単独で表示し、runId/ARIA を確認します。</p>
      </div>
      <ScheduleReservationDialog
        entry={entry}
        selectedDate={selectedDate}
        onClose={onClose}
        onCreateDocument={onCreateDocument}
        onDeleteReservation={onDeleteReservation}
        onOpenChart={onOpenChart}
        isCreating={false}
        isDeleting={false}
        isCreateDisabled={false}
        runId={runId}
        statusLabel="予約確認"
        statusTone="info"
      />
      <div>
        <h2>PatientDataExport (e2e)</h2>
        <p>実コンポーネントで runId/ARIA/ボタン属性を確認します。</p>
      </div>
      <PatientDataExportPage />
    </Stack>
  );
};
