import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';
import { measureApiPerformance } from '@/libs/monitoring';

import type {
  FacilityModel,
  RoleModel,
  UserListResponse,
  UserModel,
} from '@/features/administration/types/user';

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const withRoleUserIds = (user: UserModel): UserModel => {
  const roles: RoleModel[] = (user.roles ?? []).map((role) => ({
    ...role,
    userId: role.userId ?? user.userId,
  }));
  return { ...user, roles };
};

const sanitizeUserPayload = (user: UserModel): UserModel => {
  const payload = deepClone(withRoleUserIds(user));
  // 空文字を null に経路
  if (payload.licenseModel && Object.keys(payload.licenseModel).length === 0) {
    payload.licenseModel = null;
  }
  if (payload.departmentModel && Object.keys(payload.departmentModel).length === 0) {
    payload.departmentModel = null;
  }
  return payload;
};

export const fetchUsers = async (): Promise<UserModel[]> => {
  const response = await measureApiPerformance(
    'administration.users.fetchAll',
    'GET /user',
    async () => httpClient.get<UserListResponse>('/user'),
  );
  return response.data?.list ?? [];
};

export const fetchUserDetail = async (userId: string): Promise<UserModel | null> => {
  const endpoint = `/user/${encodeURIComponent(userId)}`;
  const response = await measureApiPerformance(
    'administration.users.fetchOne',
    `GET ${endpoint}`,
    async () => httpClient.get<UserModel>(endpoint),
    { userId },
  );
  return response.data ?? null;
};

export const createUser = async (user: UserModel): Promise<number> => {
  const payload = sanitizeUserPayload(user);
  const response = await measureApiPerformance(
    'administration.users.create',
    'POST /user',
    async () => httpClient.post<string>('/user', payload),
    { userId: user.userId, roles: user.roles?.map((role) => role.role) ?? [] },
  );
  recordOperationEvent('administration', 'info', 'user_create', 'ユーザーを登録しました', {
    userId: user.userId,
    roles: user.roles?.map((role) => role.role) ?? [],
  });
  return Number.parseInt(response.data ?? '0', 10);
};

export const updateUser = async (user: UserModel): Promise<number> => {
  const payload = sanitizeUserPayload(user);
  const response = await measureApiPerformance(
    'administration.users.update',
    'PUT /user',
    async () => httpClient.put<string>('/user', payload),
    { userId: user.userId, roles: user.roles?.map((role) => role.role) ?? [] },
  );
  recordOperationEvent('administration', 'info', 'user_update', 'ユーザー情報を更新しました', {
    userId: user.userId,
    roles: user.roles?.map((role) => role.role) ?? [],
  });
  return Number.parseInt(response.data ?? '0', 10);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const endpoint = `/user/${encodeURIComponent(userId)}`;
  await measureApiPerformance(
    'administration.users.delete',
    `DELETE ${endpoint}`,
    async () => httpClient.delete<void>(endpoint),
    { userId },
  );
  recordOperationEvent('administration', 'warning', 'user_delete', 'ユーザーを削除しました', {
    userId,
  });
};

export interface FacilityUpdatePayload {
  facilityModel: Pick<FacilityModel, 'id' | 'facilityId' | 'facilityName' | 'zipCode' | 'address' | 'telephone' | 'facsimile' | 'url'>;
}

export const updateFacility = async (payload: FacilityUpdatePayload): Promise<number> => {
  const cleaned = deepClone(payload);
  const response = await measureApiPerformance(
    'administration.facility.update',
    'PUT /user/facility',
    async () => httpClient.put<string>('/user/facility', cleaned),
    { facilityId: payload.facilityModel.facilityId },
  );
  recordOperationEvent('administration', 'info', 'facility_update', '施設情報を更新しました', {
    facilityId: payload.facilityModel.facilityId,
  });
  return Number.parseInt(response.data ?? '0', 10);
};

export const fetchUserDisplayName = async (userId: string): Promise<string> => {
  const endpoint = `/user/name/${encodeURIComponent(userId)}`;
  const response = await measureApiPerformance(
    'administration.users.resolveName',
    `GET ${endpoint}`,
    async () => httpClient.get<string>(endpoint),
    { userId },
  );
  return (response.data ?? '').trim();
};
