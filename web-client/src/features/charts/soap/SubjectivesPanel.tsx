import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { resolveAriaLive } from '../../../libs/observability/observability';
import { ToneBanner } from '../../reception/components/ToneBanner';
import { recordChartsAuditEvent } from '../audit';
import {
  buildSubjectivesListRequestXml,
  buildSubjectivesModRequestXml,
  fetchSubjectivesListXml,
  postSubjectivesModXml,
  type SubjectivesListResponse,
  type SubjectivesModResponse,
} from './subjectivesApi';

type SubjectivesPanelProps = {
  patientId?: string;
  visitDate?: string;
  runId?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  suggestedText?: string;
};

type NoticeState = {
  tone: 'info' | 'warning' | 'error';
  message: string;
};

const isApiResultOk = (apiResult?: string) => Boolean(apiResult && /^0+$/.test(apiResult));

const formatListItemLabel = (item: SubjectivesListResponse['items'][number]) => {
  const parts = [
    item.detailRecordName ?? item.detailRecord,
    item.departmentName ?? item.departmentCode,
    item.subjectivesNumber ? `#${item.subjectivesNumber}` : undefined,
  ].filter((part): part is string => Boolean(part));
  return parts.join(' / ');
};

export function SubjectivesPanel({
  patientId,
  visitDate,
  runId,
  readOnly = false,
  readOnlyReason,
  suggestedText,
}: SubjectivesPanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const performDate = visitDate ?? today;
  const performMonth = performDate.slice(0, 7);
  const [detailRecord, setDetailRecord] = useState('07');
  const [departmentCode, setDepartmentCode] = useState('01');
  const [insuranceCombinationNumber, setInsuranceCombinationNumber] = useState('');
  const [subjectivesCode, setSubjectivesCode] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const listAuditRef = useRef<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['charts-subjectives-list', patientId, performMonth, detailRecord, departmentCode, insuranceCombinationNumber],
    queryFn: () => {
      if (!patientId) throw new Error('patientId is required');
      const requestXml = buildSubjectivesListRequestXml({
        patientId,
        performMonth,
        performDay: performDate,
        departmentCode,
        insuranceCombinationNumber,
        subjectivesDetailRecord: detailRecord,
      });
      return fetchSubjectivesListXml(requestXml);
    },
    enabled: Boolean(patientId),
    staleTime: 60_000,
  });

  const modMutation = useMutation({
    mutationFn: () => {
      if (!patientId) throw new Error('patientId is required');
      const requestXml = buildSubjectivesModRequestXml({
        patientId,
        performDate,
        departmentCode,
        insuranceCombinationNumber,
        detailRecord,
        subjectivesCode: subjectivesCode.trim(),
      });
      return postSubjectivesModXml(requestXml, '01');
    },
    onSuccess: (result: SubjectivesModResponse) => {
      const hasMissing = (result.missingTags ?? []).length > 0;
      const apiOk = isApiResultOk(result.apiResult);
      const outcome = result.ok && apiOk && !hasMissing ? 'success' : result.ok ? 'warning' : 'error';
      recordChartsAuditEvent({
        action: 'ORCA_SUBJECTIVES_MOD',
        outcome,
        subject: 'chart-soap-subjectives',
        patientId,
        note: result.ok ? undefined : result.error ?? result.apiResultMessage ?? 'subjectives_mod_failed',
        details: {
          runId,
          patientId,
          performMonth,
          detailRecord,
          departmentCode,
          insuranceCombinationNumber,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
          missingTags: result.missingTags,
        },
      });
      if (result.ok && apiOk && !hasMissing) {
        setNotice({ tone: 'info', message: `症状詳記を登録しました。Api_Result=${result.apiResult ?? '—'}` });
        setSubjectivesCode('');
        void listQuery.refetch();
        return;
      }
      const missingLabel = hasMissing ? `missingTags=${result.missingTags?.join(',')}` : undefined;
      const message = result.apiResultMessage ?? result.error ?? '症状詳記の登録に失敗しました。';
      setNotice({
        tone: result.ok ? 'warning' : 'error',
        message: `症状詳記の登録で${result.ok ? '警告' : '失敗'}: ${[message, missingLabel].filter(Boolean).join(' / ')}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      recordChartsAuditEvent({
        action: 'ORCA_SUBJECTIVES_MOD',
        outcome: 'error',
        subject: 'chart-soap-subjectives',
        patientId,
        note: message,
        details: {
          runId,
          patientId,
          performMonth,
          detailRecord,
          departmentCode,
          insuranceCombinationNumber,
          apiResult: undefined,
          apiResultMessage: undefined,
          missingTags: [],
        },
      });
      setNotice({ tone: 'error', message: `症状詳記の登録に失敗しました: ${message}` });
    },
  });

  useEffect(() => {
    if (!patientId) return;
    if (listQuery.isLoading) return;
    const signature = `${listQuery.dataUpdatedAt}-${listQuery.status}`;
    if (listAuditRef.current === signature) return;
    listAuditRef.current = signature;
    const data = listQuery.data;
    const hasMissing = (data?.missingTags ?? []).length > 0;
    const apiOk = isApiResultOk(data?.apiResult);
    const isEmpty = data?.items?.length === 0;
    const outcome = listQuery.isError || (data && !data.ok) ? 'error' : hasMissing || !apiOk || isEmpty ? 'warning' : 'success';
    const note =
      listQuery.isError
        ? 'subjectives_list_fetch_failed'
        : data?.ok
          ? undefined
          : data?.error ?? data?.apiResultMessage ?? 'subjectives_list_failed';
    recordChartsAuditEvent({
      action: 'ORCA_SUBJECTIVES_LIST',
      outcome,
      subject: 'chart-soap-subjectives',
      patientId,
      note,
      details: {
        runId,
        patientId,
        performMonth,
        detailRecord,
        departmentCode,
        insuranceCombinationNumber,
        apiResult: data?.apiResult,
        apiResultMessage: data?.apiResultMessage,
        missingTags: data?.missingTags ?? [],
      },
    });
  }, [
    departmentCode,
    detailRecord,
    insuranceCombinationNumber,
    listQuery.data,
    listQuery.dataUpdatedAt,
    listQuery.isError,
    listQuery.isLoading,
    listQuery.status,
    patientId,
    performMonth,
    runId,
  ]);

  const listNotice = useMemo(() => {
    if (!patientId) {
      return { tone: 'warning', message: '患者が選択されていないため症状詳記を取得できません。' } satisfies NoticeState;
    }
    if (listQuery.isError) {
      return { tone: 'error', message: '症状詳記の取得に失敗しました。' } satisfies NoticeState;
    }
    if (!listQuery.data) return null;
    if (!listQuery.data.ok) {
      return {
        tone: 'error',
        message: listQuery.data.error ?? listQuery.data.apiResultMessage ?? '症状詳記の取得に失敗しました。',
      } satisfies NoticeState;
    }
    const missingTags = listQuery.data.missingTags ?? [];
    if (missingTags.length > 0) {
      return {
        tone: 'warning',
        message: `症状詳記の取得に警告: missingTags=${missingTags.join(',')}`,
      } satisfies NoticeState;
    }
    if (!isApiResultOk(listQuery.data.apiResult)) {
      return {
        tone: 'warning',
        message: `症状詳記の取得に警告: Api_Result=${listQuery.data.apiResult ?? '—'} / ${listQuery.data.apiResultMessage ?? 'メッセージなし'}`,
      } satisfies NoticeState;
    }
    if (listQuery.data.items.length === 0) {
      return { tone: 'info', message: '症状詳記が登録されていません。' } satisfies NoticeState;
    }
    return null;
  }, [listQuery.data, listQuery.isError, patientId]);

  const listMeta = listQuery.data;
  const listItems = listMeta?.items ?? [];

  return (
    <div className="soap-note__subjectives" data-run-id={runId}>
      <header className="soap-note__subjectives-header">
        <div>
          <strong>症状詳記（ORCA）</strong>
          <p>
            取得月: {performMonth} ／ Api_Result: {listMeta?.apiResult ?? '—'} ／ 件数: {listItems.length}
          </p>
        </div>
        <button type="button" onClick={() => listQuery.refetch()} disabled={!patientId || listQuery.isFetching}>
          {listQuery.isFetching ? '取得中…' : '再取得'}
        </button>
      </header>

      {listNotice ? (
        <ToneBanner tone={listNotice.tone} message={listNotice.message} runId={runId} ariaLive={resolveAriaLive(listNotice.tone)} />
      ) : null}

      {listQuery.data?.ok && listItems.length > 0 ? (
        <div className="soap-note__subjectives-list">
          {listItems.map((item, index) => (
            <div key={`${item.detailRecord ?? 'detail'}-${item.subjectivesNumber ?? index}`} className="soap-note__subjectives-row">
              <div>
                <strong>{formatListItemLabel(item) || '詳細不明'}</strong>
                <span>
                  診療科: {item.departmentCode ?? '—'} ／ 保険組合せ: {item.insuranceCombinationNumber ?? '—'}
                </span>
              </div>
              <span className="soap-note__subjectives-tag">{item.inOut ?? '—'}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="soap-note__subjectives-form">
        {notice ? (
          <ToneBanner tone={notice.tone} message={notice.message} runId={runId} ariaLive={resolveAriaLive(notice.tone)} />
        ) : null}
        <div className="soap-note__subjectives-grid">
          <label>
            詳記区分
            <input
              value={detailRecord}
              onChange={(event) => setDetailRecord(event.target.value)}
              placeholder="例: 07"
              disabled={readOnly}
              title={readOnly ? readOnlyReason ?? '読み取り専用のため編集できません。' : undefined}
            />
          </label>
          <label>
            診療科コード
            <input
              value={departmentCode}
              onChange={(event) => setDepartmentCode(event.target.value)}
              placeholder="例: 01"
              disabled={readOnly}
              title={readOnly ? readOnlyReason ?? '読み取り専用のため編集できません。' : undefined}
            />
          </label>
          <label>
            保険組合せ番号
            <input
              value={insuranceCombinationNumber}
              onChange={(event) => setInsuranceCombinationNumber(event.target.value)}
              placeholder="例: 0001"
              disabled={readOnly}
              title={readOnly ? readOnlyReason ?? '読み取り専用のため編集できません。' : undefined}
            />
          </label>
        </div>
        <label className="soap-note__subjectives-textarea">
          症状詳記内容
          <textarea
            value={subjectivesCode}
            onChange={(event) => setSubjectivesCode(event.target.value)}
            placeholder="症状詳記を入力してください。"
            rows={4}
            disabled={readOnly}
          />
        </label>
        <div className="soap-note__subjectives-actions">
          <button
            type="button"
            onClick={() => setSubjectivesCode(suggestedText ?? '')}
            disabled={readOnly || !suggestedText}
            title={suggestedText ? 'SOAP S の内容をコピー' : 'SOAP S の記載がありません。'}
          >
            SOAP S をコピー
          </button>
          <button
            type="button"
            onClick={() => modMutation.mutate()}
            disabled={readOnly || modMutation.isPending || subjectivesCode.trim().length === 0}
            title={readOnly ? readOnlyReason ?? '読み取り専用のため登録できません。' : undefined}
          >
            {modMutation.isPending ? '送信中…' : '症状詳記を登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
