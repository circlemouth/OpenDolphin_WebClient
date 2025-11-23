export interface OrcaMasterListResponse<T> {
  list: T[];
  totalCount: number;
  fetchedAt: string;
}

export interface DrugClassificationMaster {
  classCode: string;
  className: string;
  kanaName?: string;
  categoryCode?: string;
  parentClassCode?: string;
  isLeaf?: boolean;
  startDate?: string;
  endDate?: string;
}

export type DrugClassificationMasterResponse = OrcaMasterListResponse<DrugClassificationMaster>;

export interface MinimumDrugPriceReference {
  yukostymd?: string;
  yukoedymd?: string;
  source?: string;
}

export interface MinimumDrugPriceEntry {
  srycd: string;
  drugName: string;
  kanaName?: string;
  price: number | null;
  unit?: string;
  priceType?: string;
  startDate?: string;
  endDate?: string;
  reference?: MinimumDrugPriceReference;
}

export type MinimumDrugPriceResponse = OrcaMasterListResponse<MinimumDrugPriceEntry>;

export interface DosageInstructionMaster {
  youhouCode: string;
  youhouName: string;
  timingCode?: string;
  routeCode?: string;
  daysLimit?: number;
  dosePerDay?: number;
  comment?: string;
}

export type DosageInstructionMasterResponse = OrcaMasterListResponse<DosageInstructionMaster>;

export interface SpecialEquipmentMaster {
  materialCode: string;
  materialName: string;
  category?: string;
  insuranceType?: string;
  unit?: string;
  price?: number | null;
  startDate?: string;
  endDate?: string;
  maker?: string;
}

export type SpecialEquipmentMasterResponse = OrcaMasterListResponse<SpecialEquipmentMaster>;

export interface LabClassificationMaster {
  kensaCode: string;
  kensaName: string;
  sampleType?: string;
  departmentCode?: string;
  classification?: string;
  insuranceCategory?: string;
}

export type LabClassificationMasterResponse = OrcaMasterListResponse<LabClassificationMaster>;

export interface InsurerMaster {
  insurerNumber: string;
  insurerName: string;
  insurerKana?: string;
  prefectureCode?: string;
  address?: string;
  phone?: string;
  insurerType?: string;
  validFrom?: string;
  validTo?: string;
}

export type InsurerMasterResponse = OrcaMasterListResponse<InsurerMaster>;

export interface AddressMasterEntry {
  zipCode?: string;
  prefectureCode?: string;
  city?: string;
  town?: string;
  kana?: string;
  roman?: string;
  fullAddress?: string;
}

export type AddressMasterResponse = OrcaMasterListResponse<AddressMasterEntry>;

export interface EtensuMasterEntry {
  etensuCategory: string;
  medicalFeeCode: string;
  name: string;
  points: number;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export type EtensuMasterResponse = OrcaMasterListResponse<EtensuMasterEntry>;
