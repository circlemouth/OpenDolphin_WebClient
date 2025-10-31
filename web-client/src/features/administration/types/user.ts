export interface RoleModel {
  id?: number | null;
  role: string;
  userId?: string | null;
}

export interface LicenseModel {
  license?: string | null;
  licenseDesc?: string | null;
  licenseCodeSys?: string | null;
}

export interface DepartmentModel {
  department?: string | null;
  departmentDesc?: string | null;
  departmentCodeSys?: string | null;
}

export interface FacilityModel {
  id?: number | null;
  facilityId?: string | null;
  facilityName?: string | null;
  zipCode?: string | null;
  address?: string | null;
  telephone?: string | null;
  facsimile?: string | null;
  url?: string | null;
  memberType?: string | null;
  registeredDate?: string | null;
}

export interface UserModel {
  id?: number;
  userId: string;
  password?: string | null;
  sirName?: string | null;
  givenName?: string | null;
  commonName?: string | null;
  licenseModel?: LicenseModel | null;
  departmentModel?: DepartmentModel | null;
  facilityModel?: FacilityModel | null;
  roles: RoleModel[];
  memberType?: string | null;
  memo?: string | null;
  registeredDate?: string | null;
  email?: string | null;
  orcaId?: string | null;
  useDrugId?: string | null;
  factor2Auth?: string | null;
  mainMobile?: string | null;
  subMobile?: string | null;
}

export interface UserListResponse {
  list?: UserModel[] | null;
}

export interface UserNameResponse {
  name: string;
}
