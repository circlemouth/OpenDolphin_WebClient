import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchAppointments,
  saveAppointments,
  type AppointmentCommand,
  type AppointmentSummary,
} from '@/features/reception/api/appointment-api';

export const appointmentQueryKey = ['reception', 'appointments'] as const;

interface UseAppointmentsOptions {
  from: Date;
  to: Date;
  enabled?: boolean;
}

export const useAppointments = (
  karteId: number | null,
  options: UseAppointmentsOptions,
) => {
  const { from, to, enabled = true } = options;
  return useQuery<AppointmentSummary[]>({
    queryKey: [...appointmentQueryKey, karteId, from.toISOString(), to.toISOString()] as const,
    queryFn: () => {
      if (!karteId) {
        return Promise.resolve([]);
      }
      return fetchAppointments({ karteId, from, to });
    },
    enabled: Boolean(enabled && karteId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60,
  });
};

export const useSaveAppointments = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, AppointmentCommand[]>({
    mutationFn: (commands) => saveAppointments(commands),
    onSuccess: (_, variables) => {
      const first = variables[0];
      const karteId = first?.karteId;
      if (karteId) {
        queryClient.invalidateQueries({ queryKey: [...appointmentQueryKey, karteId] });
      } else {
        queryClient.invalidateQueries({ queryKey: appointmentQueryKey });
      }
    },
  });
};
