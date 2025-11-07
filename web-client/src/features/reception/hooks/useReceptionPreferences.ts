import { useCallback, useEffect, useMemo, useState } from 'react';

export type ReceptionViewMode = 'card' | 'table';

export type ReceptionColumnKey =
  | 'status'
  | 'patientId'
  | 'kanaName'
  | 'visitDate'
  | 'memo'
  | 'safetyNotes'
  | 'insurance'
  | 'doctor'
  | 'owner';

export interface ReceptionPreferences {
  viewMode: ReceptionViewMode;
  visibleColumns: ReceptionColumnKey[];
  defaultDepartmentCode?: string;
  defaultDepartmentName?: string;
  defaultDoctorId?: string;
  defaultDoctorName?: string;
  defaultInsuranceUid?: string;
}

const STORAGE_KEY = 'opendolphin.reception.preferences.v1';

const DEFAULT_PREFERENCES: ReceptionPreferences = {
  viewMode: 'card',
  visibleColumns: ['status', 'patientId', 'visitDate', 'memo', 'safetyNotes'],
};

const parseStoredPreferences = (value: string | null): ReceptionPreferences | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const { viewMode, visibleColumns, ...rest } = parsed as Partial<ReceptionPreferences>;
    const normalizedViewMode: ReceptionViewMode = viewMode === 'table' ? 'table' : 'card';
    const normalizedColumns = Array.isArray(visibleColumns)
      ? (visibleColumns.filter((column): column is ReceptionColumnKey =>
          typeof column === 'string' &&
          [
            'status',
            'patientId',
            'kanaName',
            'visitDate',
            'memo',
            'safetyNotes',
            'insurance',
            'doctor',
            'owner',
          ].includes(column),
        ) as ReceptionColumnKey[])
      : DEFAULT_PREFERENCES.visibleColumns;
    return {
      viewMode: normalizedViewMode,
      visibleColumns: normalizedColumns.length > 0 ? normalizedColumns : DEFAULT_PREFERENCES.visibleColumns,
      defaultDepartmentCode: rest.defaultDepartmentCode,
      defaultDepartmentName: rest.defaultDepartmentName,
      defaultDoctorId: rest.defaultDoctorId,
      defaultDoctorName: rest.defaultDoctorName,
      defaultInsuranceUid: rest.defaultInsuranceUid,
    } satisfies ReceptionPreferences;
  } catch (error) {
    console.error('受付設定の読み込みに失敗しました', error);
    return null;
  }
};

const serializePreferences = (preferences: ReceptionPreferences) => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('受付設定の保存に失敗しました', error);
  }
};

export const useReceptionPreferences = () => {
  const [preferences, setPreferences] = useState<ReceptionPreferences>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_PREFERENCES;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredPreferences(stored) ?? DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    serializePreferences(preferences);
  }, [preferences]);

  const updatePreferences = useCallback((updater: (prev: ReceptionPreferences) => ReceptionPreferences) => {
    setPreferences((prev) => updater(prev));
  }, []);

  const setViewMode = useCallback(
    (mode: ReceptionViewMode) => {
      setPreferences((prev) => ({ ...prev, viewMode: mode }));
    },
    [],
  );

  const setVisibleColumns = useCallback((columns: ReceptionColumnKey[]) => {
    setPreferences((prev) => ({ ...prev, visibleColumns: columns }));
  }, []);

  const setDefaults = useCallback(
    (defaults: Partial<Omit<ReceptionPreferences, 'viewMode' | 'visibleColumns'>>) => {
      setPreferences((prev) => ({ ...prev, ...defaults }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      preferences,
      setViewMode,
      setVisibleColumns,
      setDefaults,
      updatePreferences,
    }),
    [preferences, setDefaults, setViewMode, setVisibleColumns, updatePreferences],
  );

  return value;
};
