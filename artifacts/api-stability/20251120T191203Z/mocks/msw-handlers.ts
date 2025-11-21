import { HttpResponse, http } from 'msw';

const insuranceModel = {
  uuid: 'c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c',
  insuranceClass: '社保本人',
  insuranceClassCode: '01',
  insuranceNumber: '1234567',
  clientGroup: '12',
  clientNumber: '3456',
  startDate: '2024-04-01',
  expiredDate: null,
};

const docInfoList = [
  {
    docPk: 88001,
    parentPk: null,
    docId: 'DOC-20251101-001',
    docType: 'karte',
    title: '2025/11/01 診察記録',
    purpose: '再診',
    purposeDesc: '胸部違和感の経過観察',
    confirmDate: '2025-11-01T10:05:00+09:00',
    firstConfirmDate: '2025-11-01T10:05:00+09:00',
    recordedAt: '2025-11-01T10:05:00+09:00',
    createdAt: '2025-11-01T09:30:00+09:00',
    updatedAt: '2025-11-01T10:10:00+09:00',
    department: '01',
    departmentDesc: '内科',
    healthInsurance: '社保本人',
    healthInsuranceDesc: '社会保険本人 (01)',
    healthInsuranceGUID: insuranceModel.uuid,
    patientName: '佐藤 花子',
    patientId: '000001',
    patientGender: 'F',
    facilityName: 'オープンドルフィン診療所',
    creatorLicense: '医師',
    status: 'F',
    hasMark: true,
    hasImage: false,
    hasRp: true,
    hasTreatment: false,
    hasLaboTest: true,
    sendClaim: true,
    sendLabtest: false,
    sendMml: false,
    claimDate: '2025-11-01T11:00:00+09:00',
    versionNumber: '1',
    versionNotes: '初回確定',
    parentId: null,
    parentIdRelation: null,
    labtestOrderNumber: 'LB-20251101-01',
    issuanceDate: null,
    institutionNumber: 'OPD-DEMO-01',
    admFlag: null,
    useGeneralName: false,
    priscriptionOutput: true,
    chkPatientInfo: false,
    chkUseDrugInfo: false,
    chkHomeMedical: false,
    pVTHealthInsuranceModel: insuranceModel,
  },
];

const patientVisit = {
  id: 72001,
  facilityId: 'OPD-DEMO-01',
  pvtDate: '2025-11-01T09:15:00+09:00',
  state: 2,
  memo: '胸部違和感を訴え。バイタル確認済み。',
  insuranceUid: 'INS-0000001',
  deptCode: '01',
  deptName: '内科',
  doctorId: 'dr001',
  doctorName: '山田 太郎',
  jmariNumber: '2A1234567',
  patientModel: {
    id: 50001,
    patientId: '000001',
    fullName: '佐藤 花子',
    kanaName: 'サトウ ハナコ',
    gender: 'F',
    birthday: '1983-02-14',
    appMemo: 'MRI 禁忌。造影剤アレルギーあり。',
    reserve1: '緊急連絡先: 090-1234-5678',
    reserve2: '薬剤アレルギー: ペニシリン',
    memo: '定期的に胸部圧迫感あり。',
    ownerUUID: 'pat-uuid-50001',
    healthInsurances: [
      {
        id: 93001,
        beanBytes:
          '<PVTHealthInsuranceModel><uuid>c3af0491-8e3e-4a01-aacf-4bc29d0a1d9c</uuid><insuranceClass>社保本人</insuranceClass><insuranceClassCode>01</insuranceClassCode><insuranceNumber>1234567</insuranceNumber><clientGroup>12</clientGroup><clientNumber>3456</clientNumber><startDate>2024-04-01</startDate></PVTHealthInsuranceModel>',
      },
    ],
  },
};

const baseUserProfile = {
  id: 101,
  userId: '9001:doctor1',
  sirName: 'Doctor',
  givenName: 'One',
  commonName: 'Doctor One',
  email: 'doctor1@example.test',
  memberType: 'internal',
  licenseModel: { license: 'MED', licenseDesc: 'Physician' },
  departmentModel: { department: '01', departmentDesc: '内科' },
  facilityModel: {
    id: 9001,
    facilityId: '9001',
    facilityName: 'オープンドルフィン診療所',
    zipCode: '1000001',
    address: '東京都千代田区1-1-1',
    telephone: '03-1234-5678',
    url: 'https://example.test',
  },
  roles: [
    { id: 1, role: 'ADMIN', userId: '9001:doctor1' },
    { id: 2, role: 'USER', userId: '9001:doctor1' },
  ],
  registeredDate: '2024-01-01',
  memo: 'Administration/MSW bootstrap payload',
};

const tensuList = [
  {
    srycd: '110001110',
    name: 'プロパネコール注',
    kananame: 'ﾌﾟﾛﾊﾟﾈｺｰﾙ',
    taniname: 'mL',
    ten: '120',
    ykzkbn: '1',
    nyugaitekkbn: '0',
    routekkbn: '21',
    srysyukbn: 'GA',
    yukostymd: '20240401',
    yukoedymd: '99999999',
  },
];

// MSW handlers to mimic Modernized/Legacy compatible responses for Web クライアント API.
export const apiStabilityHandlers = [
  http.get('/api/karte/docinfo/:params', () => HttpResponse.json({ list: docInfoList })),
  http.get('/api/pvt2/pvtList', () => HttpResponse.json({ list: [patientVisit] })),
  http.get('/api/user/:userId', ({ params }) =>
    HttpResponse.json({
      ...baseUserProfile,
      userId: typeof params.userId === 'string' ? params.userId : baseUserProfile.userId,
      roles: baseUserProfile.roles.map((role) => ({
        ...role,
        userId: typeof params.userId === 'string' ? params.userId : role.userId,
      })),
    }),
  ),
  http.get('/api/orca/tensu/name/:query/', () => HttpResponse.json({ list: tensuList })),
];
