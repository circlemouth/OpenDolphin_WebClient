export type OrcaMasterSource = 'server' | 'snapshot' | 'mock' | 'fallback';

export interface OrcaMasterAuditMeta {
  dataSource?: OrcaMasterSource;
  dataSourceTransition?: {
    from?: OrcaMasterSource;
    to?: OrcaMasterSource;
    reason?: string;
  };
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  runId?: string;
  snapshotVersion?: string;
  validationError?: boolean;
}

export interface OrcaMasterListResponse<T> extends OrcaMasterAuditMeta {
  list: T[];
  totalCount: number;
  fetchedAt: string;
  version?: string;
}

export interface DrugClassificationMaster extends OrcaMasterAuditMeta {
  classCode: string;
  className: string;
  kanaName?: string;
  categoryCode?: string;
  parentClassCode?: string;
  isLeaf?: boolean;
  validFrom?: string;
  validTo?: string;
  startDate?: string; // legacy alias
  endDate?: string; // legacy alias
  version?: string;
}

export type DrugClassificationMasterResponse = OrcaMasterListResponse<DrugClassificationMaster>;

export interface MinimumDrugPriceReference {
  yukostymd?: string;
  yukoedymd?: string;
  source?: string;
}

export interface MinimumDrugPriceEntry extends OrcaMasterAuditMeta {
  srycd: string;
  drugName: string;
  kanaName?: string;
  price: number | null;
  unit?: string;
  priceType?: string;
  startDate?: string;
  endDate?: string;
  reference?: MinimumDrugPriceReference;
  validFrom?: string;
  validTo?: string;
  version?: string;
}

export type MinimumDrugPriceResponse = OrcaMasterListResponse<MinimumDrugPriceEntry>;

export interface DosageInstructionMaster extends OrcaMasterAuditMeta {
  youhouCode: string;
  youhouName: string;
  timingCode?: string;
  routeCode?: string;
  daysLimit?: number;
  dosePerDay?: number;
  comment?: string;
  validFrom?: string;
  validTo?: string;
  version?: string;
}

export type DosageInstructionMasterResponse = OrcaMasterListResponse<DosageInstructionMaster>;

export interface SpecialEquipmentMaster extends OrcaMasterAuditMeta {
  materialCode: string;
  materialName: string;
  category?: string;
  materialCategory?: string;
  insuranceType?: string;
  unit?: string;
  price?: number | null;
  startDate?: string;
  endDate?: string;
  maker?: string;
  validFrom?: string;
  validTo?: string;
  version?: string;
}

export type SpecialEquipmentMasterResponse = OrcaMasterListResponse<SpecialEquipmentMaster>;

export interface LabClassificationMaster extends OrcaMasterAuditMeta {
  kensaCode: string;
  kensaName: string;
  sampleType?: string;
  departmentCode?: string;
  classification?: string;
  insuranceCategory?: string;
  validFrom?: string;
  validTo?: string;
  version?: string;
}

export type LabClassificationMasterResponse = OrcaMasterListResponse<LabClassificationMaster>;

export interface InsurerMaster extends OrcaMasterAuditMeta {
  insurerNumber: string;
  insurerName: string;
  insurerKana?: string;
  payerRatio?: number | null;
  payerType?: string;
  prefectureCode?: string;
  prefCode?: string;
  cityCode?: string;
  zip?: string;
  addressLine?: string;
  address?: string;
  phone?: string;
  insurerType?: string;
  validFrom?: string;
  validTo?: string;
  version?: string;
}

export type InsurerMasterResponse = OrcaMasterListResponse<InsurerMaster>;

export interface AddressMasterEntry extends OrcaMasterAuditMeta {
  zipCode?: string;
  zip?: string;
  prefectureCode?: string;
  prefCode?: string;
  city?: string;
  cityCode?: string;
  town?: string;
  kana?: string;
  roman?: string;
  fullAddress?: string;
  version?: string;
}

export type AddressMasterResponse = OrcaMasterListResponse<AddressMasterEntry>;

export interface EtensuMasterEntry extends OrcaMasterAuditMeta {
  etensuCategory: string;
  category?: string;
  medicalFeeCode: string;
  tensuCode?: string;
  name: string;
  points: number;
  tanka?: number;
  unit?: string;
  kubun?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  tensuVersion?: string;
  version?: string;
}

export type EtensuMasterResponse = OrcaMasterListResponse<EtensuMasterEntry>;

// ORCA-05 集約 DTO（薬剤分類・最低薬価・用法・特定器材・検査分類）
export interface Orca05MasterRecord extends OrcaMasterAuditMeta {
  masterType:
    | 'drugClassification'
    | 'minimumDrugPrice'
    | 'dosageInstruction'
    | 'specialEquipment'
    | 'labClassification';
  code: string;
  name: string;
  category?: string;
  unit?: string;
  minPrice?: number | null;
  youhouCode?: string;
  materialCategory?: string;
  kensaSort?: string;
  validFrom?: string;
  validTo?: string;
  version?: string;
  kanaName?: string;
  priceType?: string;
  reference?: MinimumDrugPriceEntry['reference'];
  timingCode?: string;
  routeCode?: string;
  daysLimit?: number | null;
  dosePerDay?: number | null;
  comment?: string;
  insuranceType?: string;
  maker?: string;
  sampleType?: string;
  departmentCode?: string;
}

// ORCA-06（保険者・住所）統合 DTO
export interface Orca06InsurerAddressRecord extends OrcaMasterAuditMeta {
  recordType: 'insurer' | 'address';
  payerCode: string;
  payerName: string;
  payerType?: string;
  payerRatio?: number | null;
  prefCode?: string;
  cityCode?: string;
  zip?: string;
  addressLine?: string;
  city?: string;
  town?: string;
  kana?: string;
  roman?: string;
  version?: string;
}

// ORCA-08 電子点数表 DTO（REST 提供予定スキーマ）
export interface Orca08EtensuRecord extends OrcaMasterAuditMeta {
  tensuCode: string;
  name: string;
  kubun?: string;
  tanka?: number | null;
  unit?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  tensuVersion?: string;
  version?: string;
}
