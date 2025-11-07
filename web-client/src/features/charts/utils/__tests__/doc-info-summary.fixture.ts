import type { DocInfoSummary } from '@/features/charts/types/doc';

const DEFAULT_TIMESTAMP = '2026-05-01T09:00:00Z';

const pick = <T>(value: T | undefined, fallback: T): T => (value === undefined ? fallback : value);

export const createDocInfoSummary = (overrides: Partial<DocInfoSummary> = {}): DocInfoSummary => {
  const docPk = pick(overrides.docPk, 1);
  const confirmDate = pick(overrides.confirmDate, DEFAULT_TIMESTAMP);
  const firstConfirmDate = pick(overrides.firstConfirmDate, confirmDate);
  const recordedAt = pick(overrides.recordedAt, confirmDate);
  const createdAt = pick(overrides.createdAt, firstConfirmDate ?? confirmDate);
  const updatedAt = pick(overrides.updatedAt, confirmDate ?? recordedAt);

  return {
    docPk,
    parentPk: pick(overrides.parentPk, null),
    docId: pick(overrides.docId, `DOC-${docPk}`),
    docType: pick(overrides.docType, 'karte'),
    title: pick(overrides.title, 'テストカルテ'),
    purpose: pick(overrides.purpose, ''),
    purposeDesc: pick(overrides.purposeDesc, null),
    confirmDate,
    firstConfirmDate,
    department: pick(overrides.department, null),
    departmentDesc: pick(overrides.departmentDesc, null),
    healthInsurance: pick(overrides.healthInsurance, null),
    healthInsuranceDesc: pick(overrides.healthInsuranceDesc, null),
    healthInsuranceGUID: pick(overrides.healthInsuranceGUID, null),
    patientName: pick(overrides.patientName, null),
    patientId: pick(overrides.patientId, null),
    patientGender: pick(overrides.patientGender, null),
    facilityName: pick(overrides.facilityName, null),
    creatorLicense: pick(overrides.creatorLicense, null),
    createrLisence: pick(
      overrides.createrLisence,
      overrides.creatorLicense !== undefined ? overrides.creatorLicense : null,
    ),
    status: pick(overrides.status, 'F'),
    hasMark: pick(overrides.hasMark, false),
    hasImage: pick(overrides.hasImage, false),
    hasRp: pick(overrides.hasRp, false),
    hasTreatment: pick(overrides.hasTreatment, false),
    hasLaboTest: pick(overrides.hasLaboTest, false),
    sendClaim: pick(overrides.sendClaim, false),
    sendLabtest: pick(overrides.sendLabtest, false),
    sendMml: pick(overrides.sendMml, false),
    claimDate: pick(overrides.claimDate, null),
    recordedAt,
    createdAt,
    updatedAt,
    versionNumber: pick(overrides.versionNumber, '1'),
    versionNotes: pick(overrides.versionNotes, null),
    parentId: pick(overrides.parentId, null),
    parentIdRelation: pick(overrides.parentIdRelation, null),
    labtestOrderNumber: pick(overrides.labtestOrderNumber, null),
    issuanceDate: pick(overrides.issuanceDate, null),
    institutionNumber: pick(overrides.institutionNumber, null),
    admFlag: pick(overrides.admFlag, null),
    useGeneralName: pick(overrides.useGeneralName, false),
    priscriptionOutput: pick(overrides.priscriptionOutput, false),
    chkPatientInfo: pick(overrides.chkPatientInfo, false),
    chkUseDrugInfo: pick(overrides.chkUseDrugInfo, false),
    chkHomeMedical: pick(overrides.chkHomeMedical, false),
    pVTHealthInsuranceModel: pick(overrides.pVTHealthInsuranceModel, null),
  };
};
