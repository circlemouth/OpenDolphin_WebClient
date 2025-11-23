import type {
  AddressMasterEntry,
  DosageInstructionMasterResponse,
  DrugClassificationMasterResponse,
  EtensuMasterResponse,
  InsurerMasterResponse,
  LabClassificationMasterResponse,
  MinimumDrugPriceEntry,
  MinimumDrugPriceResponse,
  OrcaMasterListResponse,
  SpecialEquipmentMasterResponse,
} from '@/types/orca';

type TensuMasterFixture = {
  srycd: string;
  name: string;
  kananame?: string;
  taniname?: string;
  ten: string;
  ykzkbn?: string;
  nyugaitekkbn?: string;
  routekkbn?: string;
  srysyukbn?: string;
  yukostymd?: string;
  yukoedymd?: string;
};

export const addressMasterFixture: AddressMasterEntry = {
  zipCode: '1000001',
  prefectureCode: '13',
  city: '千代田区',
  town: '千代田',
  kana: 'ﾁﾖﾀﾞｸ ﾁﾖﾀﾞ',
  roman: 'Chiyoda-ku Chiyoda',
  fullAddress: '東京都千代田区千代田',
};

export const drugClassificationMasterResponse: DrugClassificationMasterResponse = {
  list: [
    {
      classCode: '1101',
      className: '中枢神経作用薬',
      kanaName: 'ﾁｭｳｽｳｼﾝｹｲｻﾖｳﾔｸ',
      categoryCode: '11',
      parentClassCode: '1100',
      isLeaf: true,
      startDate: '20240401',
      endDate: '99999999',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const minimumDrugPriceFixture: MinimumDrugPriceEntry = {
  srycd: '110001110',
  drugName: 'プロパネコール注',
  kanaName: 'ﾌﾟﾛﾊﾟﾈｺｰﾙ',
  price: 120.0,
  unit: 'mL',
  priceType: 'NHI',
  startDate: '20240401',
  endDate: '99999999',
  reference: {
    yukostymd: '20240401',
    yukoedymd: '99999999',
    source: 'TBL_GENERIC_PRICE',
  },
};

export const minimumDrugPriceResponse: MinimumDrugPriceResponse = {
  list: [minimumDrugPriceFixture],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const dosageInstructionMasterResponse: DosageInstructionMasterResponse = {
  list: [
    {
      youhouCode: '0101',
      youhouName: '内用 1日3回 毎食後',
      timingCode: '03',
      routeCode: 'PO',
      daysLimit: 14,
      dosePerDay: 3,
      comment: 'TBL_YOUHOU 標準コードを採用',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const specialEquipmentMasterResponse: SpecialEquipmentMasterResponse = {
  list: [
    {
      materialCode: '900000001',
      materialName: '動脈血採取キット',
      category: '特定器材',
      insuranceType: 'SYOKAN',
      unit: 'セット',
      price: 850,
      startDate: '20240401',
      endDate: '99999999',
      maker: 'ExampleMed',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const labClassificationMasterResponse: LabClassificationMasterResponse = {
  list: [
    {
      kensaCode: 'B100',
      kensaName: '血液一般',
      sampleType: 'WB',
      departmentCode: '01',
      classification: '検体検査',
      insuranceCategory: 'SYOKAN',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const insurerMasterResponse: InsurerMasterResponse = {
  list: [
    {
      insurerNumber: '06123456',
      insurerName: '医療共済組合東京',
      insurerKana: 'ｲﾘｮｳｷｮｳｻｲｸﾐｱｲﾄｳｷｮｳ',
      prefectureCode: '13',
      address: '東京都新宿区西新宿1-1-1',
      phone: '03-0000-0000',
      insurerType: '組合健保',
      validFrom: '20240401',
      validTo: '99999999',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const addressMasterResponse: OrcaMasterListResponse<AddressMasterEntry> = {
  list: [
    {
      zipCode: addressMasterFixture.zipCode,
      prefectureCode: addressMasterFixture.prefectureCode,
      city: addressMasterFixture.city,
      town: addressMasterFixture.town,
      kana: addressMasterFixture.kana,
      roman: addressMasterFixture.roman,
      fullAddress: addressMasterFixture.fullAddress,
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const etensuMasterResponse: EtensuMasterResponse = {
  list: [
    {
      etensuCategory: '1',
      medicalFeeCode: 'D001',
      name: '初診料（電子点数表）',
      points: 288,
      startDate: '20240401',
      endDate: '99999999',
      note: 'TBL_ETENSU_1 を前提にしたダミー',
    },
  ],
  totalCount: 1,
  fetchedAt: '2025-11-23T13:57:09Z',
};

export const tensuMasterFixtureList: TensuMasterFixture[] = [
  {
    srycd: '1100001',
    name: '初診料（外来）',
    kananame: 'ｼｮｼﾝﾘｮｳ',
    taniname: '回',
    ten: '288',
    ykzkbn: '1',
    nyugaitekkbn: '0',
    routekkbn: 'I',
    srysyukbn: 'SY',
    yukostymd: '20240401',
    yukoedymd: '99999999',
  },
  {
    srycd: '1120002',
    name: '再診料（外来）',
    ten: '73',
    ykzkbn: '1',
    nyugaitekkbn: '0',
    routekkbn: 'I',
    srysyukbn: 'SY',
    yukostymd: '20240401',
    yukoedymd: '99999999',
  },
  {
    srycd: '6200001',
    name: 'アセトアミノフェン錠200mg',
    kananame: 'ｱｾﾄｱﾐﾉﾌｪﾝ',
    taniname: '錠',
    ten: '52',
    ykzkbn: '2',
    nyugaitekkbn: '0',
    routekkbn: 'O',
    srysyukbn: 'YK',
    yukoedymd: '99999999',
  },
  {
    srycd: '9200005',
    name: '注射薬 500mg',
    taniname: '本',
    ten: '310',
    ykzkbn: '2',
    nyugaitekkbn: '1',
    routekkbn: 'I',
    srysyukbn: 'YK',
    yukostymd: '20240401',
    yukoedymd: '20261231',
  },
];

export const buildTensuByPointResponse = (min?: number | null, max?: number | null) => {
  const resolvedMin = typeof min === 'number' ? min : Number.NEGATIVE_INFINITY;
  const resolvedMax = typeof max === 'number' ? max : Number.POSITIVE_INFINITY;

  const list = tensuMasterFixtureList
    .filter((entry) => {
      const point = Number.parseFloat(entry.ten);
      if (!Number.isFinite(point)) {
        return false;
      }
      return point >= resolvedMin && point <= resolvedMax;
    })
    .map((entry) => ({
      srycd: entry.srycd,
      name: entry.name,
      kananame: entry.kananame,
      taniname: entry.taniname,
      ten: entry.ten,
      ykzkbn: entry.ykzkbn,
      nyugaitekkbn: entry.nyugaitekkbn,
      routekkbn: entry.routekkbn,
      srysyukbn: entry.srysyukbn,
      yukostymd: entry.yukostymd,
      yukoedymd: entry.yukoedymd,
    }));

  return {
    list,
    totalCount: list.length,
    fetchedAt: '2025-11-23T13:57:09Z',
  };
};
