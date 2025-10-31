export interface PhrKeyResource {
  id?: number | null;
  facilityId?: string | null;
  patientId?: string | null;
  accessKey?: string | null;
  secretKey?: string | null;
  registered?: string | null;
  registeredString?: string | null;
}

export interface PhrBundleSummary {
  entity?: string | null;
  group?: string | null;
  title?: string | null;
  code?: string | null;
}

export interface PhrCatch {
  catchId?: string | null;
  started?: string | null;
  confirmed?: string | null;
  status?: string | null;
  patientName?: string | null;
  physicianName?: string | null;
  department?: string | null;
  bundles?: PhrBundleSummary[] | null;
}

export interface PhrLabItem {
  itemCode?: string | null;
  itemName?: string | null;
  value?: string | null;
  unit?: string | null;
  abnormalFlg?: string | null;
  normalValue?: string | null;
}

export interface PhrLabModule {
  catchId?: string | null;
  facilityName?: string | null;
  sampleDate?: string | null;
  numOfItems?: string | null;
  reportFormat?: string | null;
  testItems?: PhrLabItem[] | null;
}

export interface PhrContainer {
  docList?: PhrCatch[] | null;
  labList?: PhrLabModule[] | null;
}
