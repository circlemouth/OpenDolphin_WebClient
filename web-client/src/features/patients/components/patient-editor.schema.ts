import { z } from 'zod';

import type { PatientDetail, PatientGender } from '@/features/patients/types/patient';
import { normalizeGender } from '@/features/patients/utils/normalize-gender';

export const genderOptions = [
  { value: 'M', label: '男性' },
  { value: 'F', label: '女性' },
  { value: 'U', label: '不明' },
  { value: 'O', label: 'その他' },
] satisfies ReadonlyArray<{ value: PatientGender; label: string }>;

export const defaultInsuranceOrder = [
  'GUID',
  'insuranceClass',
  'insuranceClassCode',
  'insuranceNumber',
  'clientGroup',
  'clientNumber',
  'startDate',
  'expiredDate',
] as const;

const optionalFormString = z.string().optional().default('');

const optionalDateString = z
  .string()
  .optional()
  .default('')
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'YYYY-MM-DD 形式で入力してください',
  });

const insuranceSchema = z.object({
  id: z.number().optional(),
  guid: optionalFormString,
  className: optionalFormString,
  classCode: optionalFormString,
  insuranceNumber: optionalFormString,
  clientGroup: optionalFormString,
  clientNumber: optionalFormString,
  startDate: optionalFormString,
  expiredDate: optionalFormString,
});

export const patientEditorSchema = z.object({
  id: z.number().optional(),
  patientId: z.string().min(1, '患者IDを入力してください'),
  fullName: z.string().min(1, '氏名を入力してください'),
  kanaName: optionalFormString,
  gender: z.enum(['M', 'F', 'U', 'O']).default('U'),
  birthday: optionalDateString,
  telephone: optionalFormString,
  mobilePhone: optionalFormString,
  email: optionalFormString,
  memo: optionalFormString,
  appMemo: optionalFormString,
  relations: optionalFormString,
  zipCode: optionalFormString,
  address: optionalFormString,
  reserve1: optionalFormString,
  reserve2: optionalFormString,
  reserve3: optionalFormString,
  reserve4: optionalFormString,
  reserve5: optionalFormString,
  reserve6: optionalFormString,
  healthInsurances: z.array(insuranceSchema),
});

export type PatientEditorFormValues = z.infer<typeof patientEditorSchema>;
export type PatientEditorFormInput = z.input<typeof patientEditorSchema>;

export const defaultPatientEditorValues: PatientEditorFormInput = {
  patientId: '',
  fullName: '',
  kanaName: '',
  gender: 'U',
  birthday: '',
  telephone: '',
  mobilePhone: '',
  email: '',
  memo: '',
  appMemo: '',
  relations: '',
  zipCode: '',
  address: '',
  reserve1: '',
  reserve2: '',
  reserve3: '',
  reserve4: '',
  reserve5: '',
  reserve6: '',
  healthInsurances: [],
};

export const mapDetailToFormValues = (
  detail: PatientDetail,
  healthInsurances: PatientEditorFormInput['healthInsurances'],
): PatientEditorFormInput => ({
  id: detail.id,
  patientId: detail.patientId,
  fullName: detail.fullName,
  kanaName: detail.kanaName ?? '',
  gender: normalizeGender(detail.gender),
  birthday: detail.birthday ?? '',
  telephone: detail.telephone ?? '',
  mobilePhone: detail.mobilePhone ?? '',
  email: detail.email ?? '',
  memo: detail.memo ?? '',
  appMemo: detail.appMemo ?? '',
  relations: detail.relations ?? '',
  zipCode: detail.address?.zipCode ?? '',
  address: detail.address?.address ?? '',
  reserve1: detail.reserve1 ?? '',
  reserve2: detail.reserve2 ?? '',
  reserve3: detail.reserve3 ?? '',
  reserve4: detail.reserve4 ?? '',
  reserve5: detail.reserve5 ?? '',
  reserve6: detail.reserve6 ?? '',
  healthInsurances,
});
