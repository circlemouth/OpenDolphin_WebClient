import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createUser,
  deleteUser,
  fetchUsers,
  updateFacility,
  updateUser,
} from '@/features/administration/api/user-api';
import type { FacilityUpdatePayload } from '@/features/administration/api/user-api';
import type { UserModel } from '@/features/administration/types/user';

export const usersQueryKey = ['administration', 'users'] as const;

export const useUsersQuery = () =>
  useQuery({
    queryKey: usersQueryKey,
    queryFn: fetchUsers,
    staleTime: 1000 * 30,
  });

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: usersQueryKey });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: invalidateUsers,
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: invalidateUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidateUsers,
  });

  const facilityMutation = useMutation({
    mutationFn: (payload: FacilityUpdatePayload) => updateFacility(payload),
    onSuccess: invalidateUsers,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    facilityMutation,
  };
};

export const composeUserId = (facilityId: string, localUserId: string) =>
  `${facilityId}:${localUserId}`;

export const splitCompositeUserId = (userId: string): { facilityId: string; localId: string } => {
  const index = userId.indexOf(':');
  if (index === -1) {
    return { facilityId: '', localId: userId };
  }
  return {
    facilityId: userId.slice(0, index),
    localId: userId.slice(index + 1),
  };
};

export const prepareUserForSave = (user: UserModel): UserModel => ({
  ...user,
  roles: (user.roles ?? []).map((role) => ({
    ...role,
    userId: role.userId ?? user.userId,
  })),
});
