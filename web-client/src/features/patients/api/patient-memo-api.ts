import { httpClient } from '@/libs/http';
import type { AuthSession } from '@/libs/auth';

export interface UpdatePatientMemoParams {
  memoId?: number | null;
  karteId: number;
  memo: string;
  session: AuthSession;
}

const formatTimestamp = (date: Date) => date.toISOString().slice(0, 19);

const buildPatientMemoPayload = ({ memoId, karteId, memo, session }: UpdatePatientMemoParams) => {
  const sanitizedMemo = memo.trim();
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const userProfile = session.userProfile;
  const userModelId = userProfile?.userModelId ?? 0;
  const displayName = userProfile?.displayName ?? userProfile?.commonName ?? session.credentials.userId;

  return {
    id: memoId ?? 0,
    confirmed: timestamp,
    started: timestamp,
    recorded: timestamp,
    ended: null,
    linkId: 0,
    linkRelation: null,
    status: 'F',
    memo: sanitizedMemo,
    userModel: {
      id: userModelId,
      userId: `${session.credentials.facilityId}:${session.credentials.userId}`,
      commonName: displayName,
    },
    karteBean: {
      id: karteId,
    },
  };
};

export const updatePatientMemo = async (params: UpdatePatientMemoParams) => {
  const payload = buildPatientMemoPayload(params);
  const response = await httpClient.put<string>('/karte/memo', payload);
  return response.data;
};

export type PatientMemoPayload = ReturnType<typeof buildPatientMemoPayload>;
