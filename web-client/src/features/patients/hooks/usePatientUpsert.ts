import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createPatient, updatePatient } from '@/features/patients/api/patient-api';
import type { PatientUpsertPayload } from '@/features/patients/types/patient';
import { patientDetailQueryKey } from '@/features/patients/hooks/usePatientDetail';
import { patientKarteQueryKey } from '@/features/patients/hooks/usePatientKarte';
import { patientSearchQueryKey } from '@/features/patients/hooks/usePatientSearch';

export type PatientUpsertMode = 'create' | 'update';

interface UpsertVariables {
  mode: PatientUpsertMode;
  payload: PatientUpsertPayload;
}

export const usePatientUpsert = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, UpsertVariables>({
    mutationFn: async ({ mode, payload }) => {
      if (mode === 'create') {
        return createPatient(payload);
      }
      return updatePatient(payload);
    },
    onSuccess: (_, variables) => {
      const patientId = variables.payload.patientId.trim();
      queryClient.invalidateQueries({ queryKey: patientSearchQueryKey });
      queryClient.invalidateQueries({ queryKey: patientDetailQueryKey });
      queryClient.invalidateQueries({ queryKey: [...patientDetailQueryKey, patientId] });
      queryClient.invalidateQueries({ queryKey: [...patientKarteQueryKey, patientId] });
    },
  });
};
