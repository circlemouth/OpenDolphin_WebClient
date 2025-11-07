export interface RawLetterItemResource {
  name?: string;
  value?: string | null;
}

export interface RawLetterTextResource {
  name?: string;
  textValue?: string | null;
}

export interface RawLetterDateResource {
  name?: string;
  value?: string | null;
}

export interface RawLetterModuleResource {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  recorded?: string | null;
  ended?: string | null;
  linkId?: number;
  linkRelation?: string | null;
  status?: string | null;
  title?: string | null;
  letterType?: string | null;
  handleClass?: string | null;
  consultantHospital?: string | null;
  consultantDept?: string | null;
  consultantDoctor?: string | null;
  consultantZipCode?: string | null;
  consultantAddress?: string | null;
  consultantTelephone?: string | null;
  consultantFax?: string | null;
  clientHospital?: string | null;
  clientDept?: string | null;
  clientDoctor?: string | null;
  clientZipCode?: string | null;
  clientAddress?: string | null;
  clientTelephone?: string | null;
  clientFax?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  patientKana?: string | null;
  patientGender?: string | null;
  patientBirthday?: string | null;
  patientAge?: string | null;
  patientOccupation?: string | null;
  patientZipCode?: string | null;
  patientAddress?: string | null;
  patientTelephone?: string | null;
  patientMobilePhone?: string | null;
  patientFaxNumber?: string | null;
  letterItems?: RawLetterItemResource[] | null;
  letterTexts?: RawLetterTextResource[] | null;
  letterDates?: RawLetterDateResource[] | null;
  karteBean?: { id?: number } | null;
  userModel?: { id?: number; userId?: string | null; commonName?: string | null } | null;
}

export interface RawLetterModuleListResource {
  list?: RawLetterModuleResource[] | null;
}

export interface LetterSummary {
  id: number;
  title: string;
  confirmedAt: string | null;
  status: string;
  letterType: string | null;
}

export interface MedicalCertificateDetail {
  id: number | null;
  linkId: number | null;
  confirmedAt: string | null;
  title: string;
  disease: string;
  informedContent: string;
  consultantHospital: string;
  consultantDept: string;
  consultantDoctor: string;
  consultantZipCode: string;
  consultantAddress: string;
  consultantTelephone: string;
  consultantFax: string;
  patientId: string;
  patientName: string;
  patientKana: string;
  patientGender: string;
  patientBirthday: string;
  patientAge: string;
  patientAddress: string;
  patientZipCode: string;
  patientTelephone: string;
  patientMobilePhone: string;
}

export interface MedicalCertificateDraft extends Omit<MedicalCertificateDetail, 'id' | 'linkId' | 'confirmedAt'> {
  id: number | null;
  linkId: number | null;
  confirmedAt: string | null;
}
