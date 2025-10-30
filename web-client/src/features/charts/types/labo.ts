export interface RawLaboItem {
  id?: number;
  patientId?: string;
  laboCode?: string;
  sampleDate?: string;
  lipemia?: string;
  hemolysis?: string;
  dialysis?: string;
  reportStatus?: string;
  groupCode?: string;
  groupName?: string;
  parentCode?: string;
  itemCode?: string;
  medisCode?: string;
  itemName?: string;
  abnormalFlg?: string;
  normalValue?: string;
  value?: string;
  unit?: string;
  specimenCode?: string;
  specimenName?: string;
  commentCode1?: string;
  comment1?: string;
  commentCode2?: string;
  comment2?: string;
  sortKey?: string;
}

export interface RawLaboModule {
  id?: number;
  patientId?: string;
  laboCenterCode?: string;
  patientName?: string;
  patientSex?: string;
  sampleDate?: string;
  numOfItems?: string;
  moduleKey?: string;
  reportFormat?: string;
  items?: RawLaboItem[] | null;
  progressState?: boolean;
  facilityId?: string;
  facilityName?: string;
  jmariCode?: string;
}

export interface RawLaboModuleListResponse {
  list?: RawLaboModule[] | null;
}

export interface RawLaboItemListResponse {
  list?: RawLaboItem[] | null;
}

export interface LaboItem {
  id: number;
  itemCode: string;
  itemName: string;
  valueText: string;
  unit?: string;
  abnormalFlag?: string | null;
  normalRange?: string | null;
  sampleDate?: string | null;
  comments: string[];
  specimenName?: string;
  raw: RawLaboItem;
}

export interface LaboModule {
  id: number;
  sampleDate?: string | null;
  itemCount: number;
  centerCode?: string;
  moduleKey?: string;
  reportFormat?: string;
  items: LaboItem[];
  raw: RawLaboModule;
}

export interface LaboTrendEntry {
  sampleDate: string;
  numericValue: number | null;
  valueText: string;
  unit?: string;
  abnormalFlag?: string | null;
  normalRange?: string | null;
}
