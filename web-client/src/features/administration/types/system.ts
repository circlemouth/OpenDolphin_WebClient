export interface ActivityModel {
  flag?: string | null;
  year?: number | null;
  month?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
  facilityId?: string | null;
  facilityName?: string | null;
  facilityZip?: string | null;
  facilityAddress?: string | null;
  facilityTelephone?: string | null;
  facilityFacimile?: string | null;
  numOfUsers?: number | null;
  numOfPatients?: number | null;
  numOfPatientVisits?: number | null;
  numOfKarte?: number | null;
  numOfImages?: number | null;
  numOfAttachments?: number | null;
  numOfDiagnosis?: number | null;
  numOfLetters?: number | null;
  numOfLabTests?: number | null;
  dbSize?: string | null;
  bindAddress?: string | null;
}

export type ActivityListResponse = ActivityModel[];

export interface ServerInfoSnapshot {
  jamriCode: string;
  claimConnection: string;
  cloudZeroStatus: string;
}

export interface LicenseResult {
  status: 'success' | 'limit_reached' | 'write_failed' | 'unknown';
  raw: string;
}
