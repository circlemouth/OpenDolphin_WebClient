import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, Stack, TextField } from '@/components';
import { useAuth } from '@/libs/auth';
import { hashPasswordMd5 } from '@/libs/auth/auth-headers';
import {
  composeUserId,
  prepareUserForSave,
  splitCompositeUserId,
  useUserMutations,
  useUsersQuery,
} from '@/features/administration/hooks/useUsers';
import type { RoleModel, UserModel } from '@/features/administration/types/user';

type FormMode = 'create' | 'edit';

interface RoleSelection {
  user: boolean;
  admin: boolean;
}

interface UserFormValues {
  compositeUserId?: string;
  localUserId: string;
  sirName: string;
  givenName: string;
  email: string;
  licenseCode: string;
  licenseName: string;
  departmentCode: string;
  departmentName: string;
  orcaId: string;
  useDrugId: string;
  roles: RoleSelection;
  password: string;
  passwordConfirm: string;
}

interface FeedbackState {
  tone: 'info' | 'danger';
  message: string;
}

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 20px;
  width: 100%;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 0.95rem;
`;

const TableHeadCell = styled.th`
  text-align: left;
  padding: 8px 12px;
  color: ${({ theme }) => theme.palette.textMuted};
  font-weight: 600;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const TableRow = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  background: ${({ theme, $selected }) => ($selected ? theme.palette.surfaceMuted : 'transparent')};

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const TableCell = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  vertical-align: middle;
`;

const EmptyState = styled.div`
  padding: 48px 0;
  text-align: center;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.95rem;
`;

const TagList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FeedbackBanner = styled.div<{ tone: 'info' | 'danger' }>`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, tone }) =>
    tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2'};
  color: ${({ theme, tone }) => (tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#991b1b')};
  font-size: 0.9rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 64px 16px;
  z-index: 1200;
  overflow-y: auto;
`;

const ModalShell = styled.div`
  width: min(720px, 100%);
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};

  input {
    width: 18px;
    height: 18px;
  }
`;

const DetailList = styled.dl`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px 24px;
  margin: 0;

  dt {
    margin: 0;
    font-weight: 600;
    color: ${({ theme }) => theme.palette.textMuted};
  }

  dd {
    margin: 0;
    color: ${({ theme }) => theme.palette.text};
    word-break: break-word;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);

    dt {
      font-size: 0.85rem;
    }
  }
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger ?? '#b91c1c'};
  font-size: 0.85rem;
`;

const isAdminRole = (role: string | null | undefined) => role?.toLowerCase() === 'admin';

const ensureRoleModels = (currentRoles: RoleModel[] | undefined, selectedRoles: string[], userId: string) => {
  const existing = new Map<string, RoleModel>();
  (currentRoles ?? []).forEach((role) => {
    if (role.role) {
      existing.set(role.role, role);
    }
  });

  return selectedRoles.map((roleName) => {
    const normalized = roleName.trim();
    const candidate = existing.get(normalized);
    if (candidate) {
      return { ...candidate, role: normalized, userId };
    }
    return { role: normalized, userId } as RoleModel;
  });
};

const createEmptyFormValues = (): UserFormValues => ({
  localUserId: '',
  sirName: '',
  givenName: '',
  email: '',
  licenseCode: '',
  licenseName: '',
  departmentCode: '',
  departmentName: '',
  orcaId: '',
  useDrugId: '',
  roles: {
    user: true,
    admin: false,
  },
  password: '',
  passwordConfirm: '',
});

const formValuesFromUser = (user: UserModel): UserFormValues => {
  const { facilityId, localId } = splitCompositeUserId(user.userId);
  const hasAdminRole = (user.roles ?? []).some((role) => isAdminRole(role.role));
  const compositeUserId = user.userId ?? composeUserId(facilityId, localId);
  return {
    compositeUserId,
    localUserId: localId || user.userId,
    sirName: user.sirName ?? '',
    givenName: user.givenName ?? '',
    email: user.email ?? '',
    licenseCode: user.licenseModel?.license ?? '',
    licenseName: user.licenseModel?.licenseDesc ?? '',
    departmentCode: user.departmentModel?.department ?? '',
    departmentName: user.departmentModel?.departmentDesc ?? '',
    orcaId: user.orcaId ?? '',
    useDrugId: user.useDrugId ?? '',
    roles: {
      user: true,
      admin: hasAdminRole,
    },
    password: '',
    passwordConfirm: '',
  };
};

export const UserAdministrationPage = () => {
  const { session } = useAuth();
  const facilityId = session?.credentials.facilityId ?? '';
  const currentUserCompositeId = session
    ? composeUserId(session.credentials.facilityId, session.credentials.userId)
    : '';

  const usersQuery = useUsersQuery();
  const { createMutation, updateMutation, deleteMutation } = useUserMutations();

  const users = usersQuery.data ?? [];

  const [filter, setFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(createEmptyFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const filteredUsers = useMemo(() => {
    if (!filter) {
      return users;
    }
    const keyword = filter.trim().toLowerCase();
    return users.filter((user) => {
      const haystack = [
        user.userId,
        user.commonName,
        user.sirName,
        user.givenName,
        user.licenseModel?.license,
        user.licenseModel?.licenseDesc,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [filter, users]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }
    if (selectedUserId && filteredUsers.some((user) => user.userId === selectedUserId)) {
      return;
    }
    setSelectedUserId(filteredUsers[0]?.userId ?? null);
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const baselineUser = users[0] ?? selectedUser ?? null;

  const handleOpenCreate = useCallback(() => {
    setFormMode('create');
    setFormValues(createEmptyFormValues());
    setFormError(null);
  }, []);

  const handleOpenEdit = useCallback(() => {
    if (!selectedUser) {
      return;
    }
    setFormMode('edit');
    setFormValues(formValuesFromUser(selectedUser));
    setFormError(null);
  }, [selectedUser]);

  const closeModal = useCallback(() => {
    setFormMode(null);
    setFormError(null);
    setFormValues(createEmptyFormValues());
  }, []);

  const handleRoleToggle = useCallback((role: keyof RoleSelection, value: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      roles: {
        ...prev.roles,
        [role]: role === 'user' ? true : value,
      },
    }));
  }, []);

  const handleInputChange = useCallback(
    (field: keyof UserFormValues, value: string) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const buildRoles = useCallback(
    (targetUserId: string, existingRoles?: RoleModel[]) => {
      const selectedRoles = new Set<string>(['user']);
      if (formValues.roles.admin) {
        selectedRoles.add('admin');
      }
      return ensureRoleModels(existingRoles, Array.from(selectedRoles), targetUserId);
    },
    [formValues.roles.admin],
  );

  const ensureFacilityModel = (user: UserModel): UserModel => {
    if (user.facilityModel) {
      return user;
    }
    if (baselineUser?.facilityModel) {
      return {
        ...user,
        facilityModel: baselineUser.facilityModel,
      };
    }
    return user;
  };

  const handleSubmit = useCallback(async () => {
    if (!formMode) {
      return;
    }
    const trimmedLocalId = formValues.localUserId.trim();
    if (formMode === 'create' && trimmedLocalId.length === 0) {
      setFormError('ユーザーIDを入力してください。');
      return;
    }
    if (formValues.sirName.trim().length === 0 || formValues.givenName.trim().length === 0) {
      setFormError('氏名（姓・名）を入力してください。');
      return;
    }
    if (formMode === 'create') {
      if (!formValues.password || formValues.passwordConfirm !== formValues.password) {
        setFormError('パスワードを確認してください。');
        return;
      }
    } else {
      if (formValues.password || formValues.passwordConfirm) {
        if (formValues.password !== formValues.passwordConfirm) {
          setFormError('新しいパスワードが一致していません。');
          return;
        }
      }
    }

    try {
      setFormError(null);
      const rolesPayload =
        formMode === 'edit'
          ? buildRoles(formValues.compositeUserId ?? '', selectedUser?.roles)
          : buildRoles(
              composeUserId(facilityId, trimmedLocalId),
              baselineUser?.roles,
            );

      const licenseModel =
        formValues.licenseCode || formValues.licenseName
          ? {
              license: formValues.licenseCode || undefined,
              licenseDesc: formValues.licenseName || undefined,
              licenseCodeSys: selectedUser?.licenseModel?.licenseCodeSys ?? 'MML0026',
            }
          : null;

      const departmentModel =
        formValues.departmentCode || formValues.departmentName
          ? {
              department: formValues.departmentCode || undefined,
              departmentDesc: formValues.departmentName || undefined,
              departmentCodeSys: selectedUser?.departmentModel?.departmentCodeSys ?? 'MML0028',
            }
          : null;

      if (formMode === 'create') {
        const compositeUserId = composeUserId(facilityId, trimmedLocalId);
        const hashedPassword = await hashPasswordMd5(formValues.password);
        const payload: UserModel = ensureFacilityModel(
          prepareUserForSave({
            userId: compositeUserId,
            password: hashedPassword,
            sirName: formValues.sirName.trim(),
            givenName: formValues.givenName.trim(),
            commonName: `${formValues.sirName.trim()} ${formValues.givenName.trim()}`,
            email: formValues.email.trim(),
            memberType: baselineUser?.memberType ?? 'FACILITY_USER',
            registeredDate: new Date().toISOString().slice(0, 10),
            licenseModel,
            departmentModel,
            facilityModel: baselineUser?.facilityModel,
            roles: rolesPayload,
            orcaId: formValues.orcaId.trim() || undefined,
            useDrugId: formValues.useDrugId.trim() || undefined,
          }),
        );
        await createMutation.mutateAsync(payload);
        setFeedback({
          tone: 'info',
          message: `ユーザー「${payload.commonName}」を登録しました。`,
        });
        setSelectedUserId(payload.userId);
      } else if (selectedUser) {
        const hashedPassword = formValues.password
          ? await hashPasswordMd5(formValues.password)
          : selectedUser.password;
        const payload: UserModel = ensureFacilityModel(
          prepareUserForSave({
            ...selectedUser,
            password: hashedPassword ?? selectedUser.password,
            sirName: formValues.sirName.trim(),
            givenName: formValues.givenName.trim(),
            commonName: `${formValues.sirName.trim()} ${formValues.givenName.trim()}`,
            email: formValues.email.trim(),
            licenseModel,
            departmentModel,
            roles: rolesPayload,
            orcaId: formValues.orcaId.trim() || undefined,
            useDrugId: formValues.useDrugId.trim() || undefined,
          }),
        );
        await updateMutation.mutateAsync(payload);
        setFeedback({
          tone: 'info',
          message: `ユーザー「${payload.commonName}」を更新しました。`,
        });
      }

      closeModal();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '更新に失敗しました。';
      setFormError(message);
    }
  }, [
    baselineUser,
    buildRoles,
    closeModal,
    createMutation,
    facilityId,
    formMode,
    formValues,
    selectedUser,
    updateMutation,
  ]);

  const handleDelete = useCallback(async () => {
    if (!selectedUser) {
      return;
    }
    if (selectedUser.userId === currentUserCompositeId) {
      setFeedback({
        tone: 'danger',
        message: '自身のアカウントは削除できません。',
      });
      return;
    }
    const confirmed = window.confirm(
      `ユーザー「${selectedUser.commonName ?? selectedUser.userId}」を削除しますか？`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(selectedUser.userId);
      setFeedback({
        tone: 'info',
        message: `ユーザー「${selectedUser.commonName ?? selectedUser.userId}」を削除しました。`,
      });
      setSelectedUserId(null);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : '削除に失敗しました。';
      setFeedback({
        tone: 'danger',
        message,
      });
    }
  }, [currentUserCompositeId, deleteMutation, selectedUser]);

  return (
    <>
      <PageGrid>
        <SurfaceCard>
          <Stack gap={16}>
            <SectionHeader>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>院内ユーザー</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  施設に所属するユーザーを一覧・管理します。
                </p>
              </div>
              <Button onClick={handleOpenCreate} isLoading={createMutation.isPending}>
                ユーザー追加
              </Button>
            </SectionHeader>
            <TextField
              label="検索"
              placeholder="氏名、ユーザーID、職種などで検索"
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
            />
            {usersQuery.isPending ? (
              <EmptyState>読み込み中です…</EmptyState>
            ) : filteredUsers.length === 0 ? (
              <EmptyState>一致するユーザーが見つかりません。</EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <thead>
                    <tr>
                      <TableHeadCell>表示名</TableHeadCell>
                      <TableHeadCell>ユーザーID</TableHeadCell>
                      <TableHeadCell>職種</TableHeadCell>
                      <TableHeadCell>権限</TableHeadCell>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const { localId } = splitCompositeUserId(user.userId);
                      const isSelected = user.userId === selectedUserId;
                      const isAdmin = (user.roles ?? []).some((role) => isAdminRole(role.role));
                      return (
                        <TableRow
                          key={user.userId}
                          $selected={isSelected}
                          onClick={() => setSelectedUserId(user.userId)}
                        >
                          <TableCell>{user.commonName ?? `${user.sirName ?? ''} ${user.givenName ?? ''}`}</TableCell>
                          <TableCell>{localId}</TableCell>
                          <TableCell>{user.licenseModel?.licenseDesc ?? user.licenseModel?.license ?? '—'}</TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <StatusBadge tone="warning">admin</StatusBadge>
                            ) : (
                              <StatusBadge tone="info">user</StatusBadge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Stack>
        </SurfaceCard>

        <SurfaceCard>
          <Stack gap={16}>
            <SectionHeader>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>詳細</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  選択したユーザーの情報と操作を表示します。
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => usersQuery.refetch()}
                  isLoading={usersQuery.isFetching}
                >
                  再読込
                </Button>
              </div>
            </SectionHeader>

            {feedback ? (
              <FeedbackBanner tone={feedback.tone}>{feedback.message}</FeedbackBanner>
            ) : null}

            {selectedUser ? (
              <>
                <DetailList>
                  <dt>表示名</dt>
                  <dd>{selectedUser.commonName ?? '—'}</dd>
                  <dt>ユーザーID</dt>
                  <dd>{selectedUser.userId}</dd>
                  <dt>氏名（漢字）</dt>
                  <dd>
                    {selectedUser.sirName ?? '—'} {selectedUser.givenName ?? ''}
                  </dd>
                  <dt>氏名（かな）</dt>
                  <dd>{selectedUser.commonName ?? '—'}</dd>
                  <dt>メール</dt>
                  <dd>{selectedUser.email ?? '—'}</dd>
                  <dt>職種</dt>
                  <dd>
                    {selectedUser.licenseModel?.licenseDesc ?? selectedUser.licenseModel?.license ?? '—'}
                  </dd>
                  <dt>診療科</dt>
                  <dd>{selectedUser.departmentModel?.departmentDesc ?? selectedUser.departmentModel?.department ?? '—'}</dd>
                  <dt>権限</dt>
                  <dd>
                    <TagList>
                      {(selectedUser.roles ?? []).map((role) => (
                        <StatusBadge
                          key={`${selectedUser.userId}-${role.role}`}
                          tone={isAdminRole(role.role) ? 'warning' : 'info'}
                        >
                          {role.role}
                        </StatusBadge>
                      ))}
                    </TagList>
                  </dd>
                  <dt>ORCA ID</dt>
                  <dd>{selectedUser.orcaId ?? '—'}</dd>
                  <dt>麻薬登録番号</dt>
                  <dd>{selectedUser.useDrugId ?? '—'}</dd>
                  <dt>登録日</dt>
                  <dd>{selectedUser.registeredDate ?? '—'}</dd>
                </DetailList>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="secondary" onClick={handleOpenEdit} fullWidth isLoading={updateMutation.isPending}>
                    編集
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    fullWidth
                    isLoading={deleteMutation.isPending}
                    disabled={selectedUser.userId === currentUserCompositeId}
                  >
                    削除
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState>ユーザーを選択してください。</EmptyState>
            )}
          </Stack>
        </SurfaceCard>
      </PageGrid>

      {formMode ? (
        <ModalOverlay onClick={closeModal}>
          <ModalShell onClick={(event) => event.stopPropagation()}>
            <SurfaceCard>
              <Stack gap={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    {formMode === 'create' ? 'ユーザーを追加' : 'ユーザーを編集'}
                  </h3>
                  <Button variant='ghost' onClick={closeModal}>
                    閉じる
                  </Button>
                </div>

                {formError ? <ErrorText>{formError}</ErrorText> : null}

                <Stack gap={12}>
                  <TextField
                    label="ユーザーID"
                    placeholder="例: doctor01"
                    value={formValues.localUserId}
                    onChange={(event) => handleInputChange('localUserId', event.currentTarget.value)}
                    disabled={formMode === 'edit'}
                  />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TextField
                      label="姓"
                      value={formValues.sirName}
                      onChange={(event) => handleInputChange('sirName', event.currentTarget.value)}
                    />
                    <TextField
                      label="名"
                      value={formValues.givenName}
                      onChange={(event) => handleInputChange('givenName', event.currentTarget.value)}
                    />
                  </div>
                  <TextField
                    label="メールアドレス"
                    value={formValues.email}
                    onChange={(event) => handleInputChange('email', event.currentTarget.value)}
                  />
                </Stack>

                <Stack gap={12}>
                  <h4 style={{ margin: '8px 0 0', fontSize: '1rem' }}>職種・診療科</h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TextField
                      label="ライセンスコード"
                      placeholder="例: doctor"
                      value={formValues.licenseCode}
                      onChange={(event) => handleInputChange('licenseCode', event.currentTarget.value)}
                    />
                    <TextField
                      label="ライセンス名"
                      placeholder="例: 医師"
                      value={formValues.licenseName}
                      onChange={(event) => handleInputChange('licenseName', event.currentTarget.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TextField
                      label="診療科コード"
                      value={formValues.departmentCode}
                      onChange={(event) => handleInputChange('departmentCode', event.currentTarget.value)}
                    />
                    <TextField
                      label="診療科名"
                      value={formValues.departmentName}
                      onChange={(event) => handleInputChange('departmentName', event.currentTarget.value)}
                    />
                  </div>
                </Stack>

                <Stack gap={12}>
                  <h4 style={{ margin: '8px 0 0', fontSize: '1rem' }}>その他</h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <TextField
                      label="ORCA ユーザーID"
                      value={formValues.orcaId}
                      onChange={(event) => handleInputChange('orcaId', event.currentTarget.value)}
                    />
                    <TextField
                      label="麻薬登録番号"
                      value={formValues.useDrugId}
                      onChange={(event) => handleInputChange('useDrugId', event.currentTarget.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <CheckboxRow>
                      <input type="checkbox" checked readOnly />
                      <span>標準ユーザー権限</span>
                    </CheckboxRow>
                    <CheckboxRow>
                      <input
                        type="checkbox"
                        checked={formValues.roles.admin}
                        onChange={(event) => handleRoleToggle('admin', event.currentTarget.checked)}
                      />
                      <span>管理者権限（admin）</span>
                    </CheckboxRow>
                  </div>
                </Stack>

                <Stack gap={12}>
                  <h4 style={{ margin: '8px 0 0', fontSize: '1rem' }}>
                    {formMode === 'create' ? 'パスワード' : 'パスワード（変更する場合）'}
                  </h4>
                  <TextField
                    label="パスワード"
                    type="password"
                    value={formValues.password}
                    onChange={(event) => handleInputChange('password', event.currentTarget.value)}
                  />
                  <TextField
                    label="パスワード（確認）"
                    type="password"
                    value={formValues.passwordConfirm}
                    onChange={(event) => handleInputChange('passwordConfirm', event.currentTarget.value)}
                  />
                </Stack>

                <ModalFooter>
                  <Button variant="ghost" onClick={closeModal}>
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {formMode === 'create' ? '登録する' : '更新する'}
                  </Button>
                </ModalFooter>
              </Stack>
            </SurfaceCard>
          </ModalShell>
        </ModalOverlay>
      ) : null}
    </>
  );
};
