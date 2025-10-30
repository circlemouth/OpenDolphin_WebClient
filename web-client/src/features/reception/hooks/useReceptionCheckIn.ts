import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchPatientById } from '@/features/patients/api/patient-api';
import type { PatientDetail } from '@/features/patients/types/patient';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';
import { registerVisit, type VisitRegistrationOptions } from '@/features/reception/api/visit-api';

export interface BarcodeCheckInArgs extends VisitRegistrationOptions {
  code: string;
}

export interface BarcodeCheckInResult {
  patient: PatientDetail;
  patientId: string;
}

const PATIENT_ID_PATTERN = /(\d{4,})/g;

export const extractPatientIdFromScan = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // 一般的な診察券バーコード（CODE39/CODE128）では患者IDのみ、または "*00012345*" のような形式になる
  const matches = Array.from(trimmed.matchAll(PATIENT_ID_PATTERN)).map((match) => match[1]);
  if (matches.length === 0) {
    return null;
  }

  // 末尾 8 桁など運用によって異なるため最長候補を採用し、先頭の 0 を保持したまま返却する
  const candidate = matches.reduce((longest, current) =>
    current.length >= longest.length ? current : longest,
  );
  return candidate ?? null;
};

const buildError = (message: string) => new Error(message);

export const useReceptionCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation<BarcodeCheckInResult, Error, BarcodeCheckInArgs>({
    mutationFn: async ({ code, ...options }) => {
      const patientId = extractPatientIdFromScan(code);
      if (!patientId) {
        throw buildError('バーコードから患者IDを判読できませんでした。フォーマットを確認してください。');
      }

      const patient = await fetchPatientById(patientId);
      if (!patient) {
        throw buildError(`患者ID ${patientId} の情報が見つかりませんでした。`);
      }

      await registerVisit(patient, { ...options, source: 'barcode' });

      return { patient, patientId } satisfies BarcodeCheckInResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientVisitsQueryKey });
    },
  });
};
