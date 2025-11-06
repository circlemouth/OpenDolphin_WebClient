export interface DiagnosisCategory {
  diagnosisCategory?: string | null;
  diagnosisCategoryDesc?: string | null;
  diagnosisCategoryCodeSys?: string | null;
}

export interface DiagnosisOutcome {
  diagnosisOutcome?: string | null;
  diagnosisOutcomeDesc?: string | null;
  diagnosisOutcomeCodeSys?: string | null;
}

export interface RegisteredDiagnosis {
  id?: number;
  diagnosis?: string | null;
  diagnosisCode?: string | null;
  diagnosisCodeSystem?: string | null;
  category?: string | null;
  outcome?: string | null;
  firstEncounterDate?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  confirmed?: string | null;
  status?: string | null;
  relatedHealthInsurance?: string | null;
  department?: string | null;
  departmentDesc?: string | null;
  diagnosisCategoryModel?: DiagnosisCategory | null;
  diagnosisOutcomeModel?: DiagnosisOutcome | null;
  karteBean?: {
    id: number;
  } | null;
  userModel?: {
    id: number;
    commonName?: string | null;
  } | null;
  karteId?: number;
  userId?: number;
}

export interface RegisteredDiagnosisListResponse {
  list?: RegisteredDiagnosis[] | null;
}
