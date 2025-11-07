import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchPatientById, searchPatients } from '@/features/patients/api/patient-api';
import type { PatientDetail, PatientSummary } from '@/features/patients/types/patient';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';
import { registerVisit, type VisitRegistrationOptions } from '@/features/reception/api/visit-api';

export interface BarcodeCheckInArgs extends VisitRegistrationOptions {
  code: string;
}

export interface BarcodeCheckInResult {
  patient: PatientDetail;
  patientId: string;
}

export class BarcodeCheckInNotFoundError extends Error {
  readonly patientId: string;

  constructor(patientId: string, message?: string) {
    super(message ?? `患者ID ${patientId} の情報が見つかりませんでした。`);
    this.name = 'BarcodeCheckInNotFoundError';
    this.patientId = patientId;
  }
}

export class BarcodeCheckInMultipleMatchesError extends Error {
  readonly patientId: string;
  readonly matches: PatientSummary[];

  constructor(patientId: string, matches: PatientSummary[], message?: string) {
    super(message ?? `患者ID ${patientId} に該当する患者が複数見つかりました。詳細を確認してください。`);
    this.name = 'BarcodeCheckInMultipleMatchesError';
    this.patientId = patientId;
    this.matches = matches;
  }
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
      const extracted = extractPatientIdFromScan(code);
      if (!extracted) {
        throw buildError('バーコードから患者IDを判読できませんでした。フォーマットを確認してください。');
      }

      const directPatient = await fetchPatientById(extracted);
      if (directPatient) {
        await registerVisit(directPatient, { ...options, source: 'barcode' });
        return { patient: directPatient, patientId: directPatient.patientId } satisfies BarcodeCheckInResult;
      }

      const searchCandidates = await searchPatients({ digitKeyword: extracted });

      if (searchCandidates.length === 0) {
        throw new BarcodeCheckInNotFoundError(extracted);
      }

      if (searchCandidates.length > 1) {
        throw new BarcodeCheckInMultipleMatchesError(extracted, searchCandidates);
      }

      const [{ patientId }] = searchCandidates;
      const patient = await fetchPatientById(patientId);

      if (!patient) {
        throw new BarcodeCheckInNotFoundError(extracted);
      }

      await registerVisit(patient, { ...options, source: 'barcode' });

      return { patient, patientId: patient.patientId } satisfies BarcodeCheckInResult;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientVisitsQueryKey });
    },
  });
};
