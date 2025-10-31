import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';
import { measureApiPerformance } from '@/libs/monitoring';

import type { ActivityListResponse, ActivityModel, LicenseResult, ServerInfoSnapshot } from '@/features/administration/types/system';
import type { RoleModel } from '@/features/administration/types/user';

const fetchServerInfoText = async (path: string, metric: string): Promise<string> => {
  const response = await measureApiPerformance(
    `administration.serverinfo.${metric}`,
    `GET ${path}`,
    async () => httpClient.get<string>(path),
    { endpoint: path },
  );
  return (response.data ?? '').trim();
};

export const fetchServerInfoSnapshot = async (): Promise<ServerInfoSnapshot> => {
  const [jamriCode, claimConnection, cloudZeroStatus] = await Promise.all([
    fetchServerInfoText('/serverinfo/jamri', 'jamri'),
    fetchServerInfoText('/serverinfo/claim/conn', 'claim'),
    fetchServerInfoText('/serverinfo/cloud/zero', 'cloud'),
  ]);
  return {
    jamriCode,
    claimConnection,
    cloudZeroStatus,
  };
};

export interface ActivityQueryOptions {
  year: number;
  month: number;
  count: number;
}

export const fetchActivities = async ({ year, month, count }: ActivityQueryOptions): Promise<ActivityModel[]> => {
  const endpoint = `/dolphin/activity/${year},${month},${count}`;
  const response = await measureApiPerformance(
    'administration.activities.fetch',
    `GET ${endpoint}`,
    async () => httpClient.get<ActivityListResponse>(endpoint),
    { year, month, count },
  );
  return response.data ?? [];
};

const mapLicenseResponse = (code: string): LicenseResult => {
  const normalized = code.trim();
  switch (normalized) {
    case '0':
      return { status: 'success', raw: normalized };
    case '3':
      return { status: 'write_failed', raw: normalized };
    case '4':
      return { status: 'limit_reached', raw: normalized };
    default:
      return { status: 'unknown', raw: normalized };
  }
};

export const submitLicenseToken = async (token: string): Promise<LicenseResult> => {
  const response = await measureApiPerformance(
    'administration.license.submit',
    'POST /dolphin/license',
    async () =>
      httpClient.post<string>('/dolphin/license', token, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
    { tokenLength: token.length },
  );
  const result = mapLicenseResponse(response.data ?? '');
  recordOperationEvent(
    'administration',
    result.status === 'success' ? 'info' : 'warning',
    'license_update',
    'ライセンス認証を実行しました',
    { status: result.status },
  );
  return result;
};

export const triggerCloudZeroReport = async (): Promise<void> => {
  await measureApiPerformance(
    'administration.cloudzero.mail',
    'GET /dolphin/cloudzero/sendmail',
    async () => httpClient.get<void>('/dolphin/cloudzero/sendmail'),
  );
  recordOperationEvent('administration', 'info', 'cloud_zero_report', 'Cloud Zero 連携メール送信を要求しました');
};

export interface FacilityAdminRegistrationPayload {
  userId: string;
  password: string;
  sirName: string;
  givenName: string;
  email?: string;
  roles?: string[];
  facilityName: string;
  facilityZipCode?: string;
  facilityAddress?: string;
  facilityTelephone?: string;
  facilityFacsimile?: string;
  facilityUrl?: string;
}

const mapRoles = (userId: string, roles?: string[]): RoleModel[] => {
  const assigned = roles && roles.length > 0 ? roles : ['admin'];
  return assigned.map((role) => ({
    role,
    userId,
  }));
};

export interface FacilityAdminRegistrationResult {
  facilityId: string;
  userId: string;
}

export const registerFacilityAdmin = async (
  payload: FacilityAdminRegistrationPayload,
): Promise<FacilityAdminRegistrationResult> => {
  const trimmedUserId = payload.userId.trim();
  const requestBody = {
    userId: trimmedUserId,
    password: payload.password,
    sirName: payload.sirName.trim(),
    givenName: payload.givenName.trim(),
    commonName: `${payload.sirName.trim()} ${payload.givenName.trim()}`.trim(),
    email: payload.email?.trim() || undefined,
    facilityModel: {
      facilityName: payload.facilityName.trim(),
      zipCode: payload.facilityZipCode?.trim() || undefined,
      address: payload.facilityAddress?.trim() || undefined,
      telephone: payload.facilityTelephone?.trim() || undefined,
      facsimile: payload.facilityFacsimile?.trim() || undefined,
      url: payload.facilityUrl?.trim() || undefined,
    },
    roles: mapRoles(trimmedUserId, payload.roles),
  };

  const response = await measureApiPerformance(
    'administration.facilityAdmin.register',
    'POST /dolphin',
    async () => httpClient.post<string>('/dolphin', requestBody),
    { userId: trimmedUserId },
  );

  const rawResult = (response.data ?? '').trim();
  const [facilityId, compositeUserId] = rawResult.split(':', 2);
  recordOperationEvent('administration', 'info', 'facility_admin_register', '施設管理者を登録しました', {
    facilityId,
    userId: compositeUserId ?? trimmedUserId,
  });
  return {
    facilityId: facilityId ?? '',
    userId: compositeUserId ?? rawResult,
  };
};
