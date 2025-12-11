import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { logAuditEvent, logUiState } from '../../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../../libs/observability/observability';
import type { DataSourceTransition } from '../../../libs/observability/types';
import { OrderConsole } from '../components/OrderConsole';
import { fetchAppointmentOutpatients, fetchClaimFlags, type ReceptionEntry, type ReceptionStatus } from '../api';
import { receptionStyles } from '../styles';
import { useAuthService } from '../../charts/authService';
import { getChartToneDetails } from '../../../ux/charts/tones';
import type { ResolveMasterSource } from '../components/ResolveMasterBadge';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';

type SortKey = 'time' | 'name' | 'department';

const SECTION_ORDER: ReceptionStatus[] = ['受付中', '診療中', '会計待ち', '会計済み', '予約'];
const SECTION_LABEL: Record<ReceptionStatus, string> = {
  受付中: '受付中',
  診療中: '診療中',
  会計待ち: '会計待ち',
  会計済み: '会計済み',
  予約: '予約',
};

const COLLAPSE_STORAGE_KEY = 'reception-section-collapses';
const FILTER_STORAGE_KEY = 'reception-filter-state';

const todayString = () => new Date().toISOString().slice(0, 10);

const loadCollapseState = (): Record<ReceptionStatus, boolean> => {
  if (typeof localStorage === 'undefined') return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false };
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored) {
      return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false, ...(JSON.parse(stored) as Record<ReceptionStatus, boolean>) };
    }
  } catch {
    // ignore broken localStorage value
  }
  return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false };
};

const persistCollapseState = (state: Record<ReceptionStatus, boolean>) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const toMasterSource = (transition?: DataSourceTransition): ResolveMasterSource => {
  if (!transition) return 'snapshot';
  if (transition === 'fallback') return 'fallback';
  if (transition === 'server') return 'server';
  if (transition === 'mock') return 'mock';
  return 'snapshot';
};

const filterEntries = (
  entries: ReceptionEntry[],
  keyword: string,
  department: string,
  physician: string,
): ReceptionEntry[] => {
  const kw = keyword.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesKeyword =
      kw.length === 0 ||
      [entry.name, entry.kana, entry.patientId, entry.appointmentId].some((value) =>
        value?.toLowerCase().includes(kw),
      );
    const matchesDept = department ? entry.department === department : true;
    const matchesPhysician = physician ? entry.physician === physician : true;
    return matchesKeyword && matchesDept && matchesPhysician;
  });
};

const sortEntries = (entries: ReceptionEntry[], sortKey: SortKey) => {
  const toMinutes = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;
    const [h, m] = time.split(':').map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return Number.MAX_SAFE_INTEGER;
    return h * 60 + m;
  };

  return [...entries].sort((a, b) => {
    if (sortKey === 'time') {
      return toMinutes(a.appointmentTime) - toMinutes(b.appointmentTime);
    }
    if (sortKey === 'department') {
      return (a.department ?? '').localeCompare(b.department ?? '', 'ja');
    }
    return (a.name ?? '').localeCompare(b.name ?? '', 'ja');
  });
};

const groupByStatus = (entries: ReceptionEntry[]) =>
  SECTION_ORDER.map((status) => ({
    status,
    items: entries.filter((entry) => entry.status === status),
  }));

type ReceptionPageProps = {
  runId?: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  title?: string;
  description?: string;
};

export function ReceptionPage({
  runId: initialRunId,
  patientId,
  receptionId,
  destination = 'ORCA queue',
  title = 'Reception 検索と外来API接続',
  description = '外来請求/予約 API を React Query で取得し、missingMaster・cacheHit・dataSourceTransition をトーンバナーとリストへ反映します。行をダブルクリックすると同じ RUN_ID で Charts へ遷移します。',
}: ReceptionPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { broadcast } = useAdminBroadcast();
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, bumpRunId } = useAuthService();
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [keyword, setKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [submittedKeyword, setSubmittedKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('dept') ?? '');
  const [physicianFilter, setPhysicianFilter] = useState(() => searchParams.get('phys') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [collapsed, setCollapsed] = useState<Record<ReceptionStatus, boolean>>(loadCollapseState);
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const summaryRef = useRef<HTMLParagraphElement | null>(null);
  const appliedMeta = useRef<{
    runId?: string;
    cacheHit?: boolean;
    missingMaster?: boolean;
    dataSourceTransition?: DataSourceTransition;
  }>({});
  const lastAuditEventHash = useRef<string>();

  const claimQuery = useQuery({
    queryKey: ['outpatient-claim-flags'],
    queryFn: fetchClaimFlags,
    refetchInterval: 90_000,
  });

  const appointmentQuery = useQuery({
    queryKey: ['outpatient-appointments', selectedDate, submittedKeyword, departmentFilter, physicianFilter],
    queryFn: () =>
      fetchAppointmentOutpatients({
        date: selectedDate,
        keyword: submittedKeyword,
        departmentCode: departmentFilter || undefined,
        physicianCode: physicianFilter || undefined,
      }),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    persistCollapseState(collapsed);
  }, [collapsed]);

  useEffect(() => {
    const stored = (() => {
      if (typeof localStorage === 'undefined') return null;
      try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Partial<Record<'kw' | 'dept' | 'phys', string>>) : null;
      } catch {
        return null;
      }
    })();
    const fromUrl = {
      kw: searchParams.get('kw') ?? undefined,
      dept: searchParams.get('dept') ?? undefined,
      phys: searchParams.get('phys') ?? undefined,
    };
    const merged = { ...(stored ?? {}), ...Object.fromEntries(Object.entries(fromUrl).filter(([, v]) => v !== undefined)) };
    if (merged.kw !== undefined) {
      setKeyword(merged.kw);
      setSubmittedKeyword(merged.kw);
    }
    if (merged.dept !== undefined) setDepartmentFilter(merged.dept);
    if (merged.phys !== undefined) setPhysicianFilter(merged.phys);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('kw', keyword);
    if (departmentFilter) params.set('dept', departmentFilter);
    if (physicianFilter) params.set('phys', physicianFilter);
    setSearchParams(params, { replace: true });
    if (typeof localStorage !== 'undefined') {
      const snapshot = {
        kw: keyword,
        dept: departmentFilter,
        phys: physicianFilter,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(snapshot));
    }
  }, [departmentFilter, keyword, physicianFilter, setSearchParams]);

  const mergedMeta = useMemo(() => {
    const claim = claimQuery.data;
    const appointment = appointmentQuery.data;
    const run = claim?.runId ?? appointment?.runId ?? initialRunId ?? flags.runId;
    const missing = claim?.missingMaster ?? appointment?.missingMaster ?? flags.missingMaster;
    const cache = claim?.cacheHit ?? appointment?.cacheHit ?? flags.cacheHit;
    const transition = claim?.dataSourceTransition ?? appointment?.dataSourceTransition ?? flags.dataSourceTransition;
    return {
      runId: run,
      missingMaster: missing,
      cacheHit: cache,
      dataSourceTransition: transition,
      fetchedAt: claim?.fetchedAt ?? appointment?.fetchedAt,
    };
  }, [appointmentQuery.data, claimQuery.data, flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId, initialRunId]);

  useEffect(() => {
    const { runId, cacheHit, missingMaster, dataSourceTransition } = mergedMeta;
    const prev = appliedMeta.current;
    const isChanged =
      runId !== prev.runId ||
      cacheHit !== prev.cacheHit ||
      missingMaster !== prev.missingMaster ||
      dataSourceTransition !== prev.dataSourceTransition;
    if (!isChanged) return;

    if (runId) {
      bumpRunId(runId);
      updateObservabilityMeta({ runId });
    }
    if (cacheHit !== undefined) setCacheHit(cacheHit);
    if (missingMaster !== undefined) setMissingMaster(missingMaster);
    if (dataSourceTransition) setDataSourceTransition(dataSourceTransition);

    appliedMeta.current = { runId, cacheHit, missingMaster, dataSourceTransition };
  }, [bumpRunId, mergedMeta, setCacheHit, setDataSourceTransition, setMissingMaster]);

  useEffect(() => {
    const apiAudit = claimQuery.data?.auditEvent as Record<string, unknown> | undefined;
    const serialized = apiAudit ? JSON.stringify(apiAudit) : undefined;
    if (serialized && serialized !== lastAuditEventHash.current) {
      lastAuditEventHash.current = serialized;
      const noteFromApi = typeof (apiAudit as Record<string, unknown>)?.missingMasterNote === 'string'
        ? String((apiAudit as Record<string, unknown>).missingMasterNote)
        : typeof (apiAudit as Record<string, unknown>)?.note === 'string'
          ? String((apiAudit as Record<string, unknown>).note)
          : undefined;
      if (noteFromApi) {
        setMissingMasterNote(noteFromApi);
      }
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'claim-flags',
        cacheHit: mergedMeta.cacheHit,
        missingMaster: mergedMeta.missingMaster,
        dataSourceTransition: mergedMeta.dataSourceTransition,
        payload: apiAudit,
      });
    }
  }, [claimQuery.data?.auditEvent, mergedMeta.cacheHit, mergedMeta.dataSourceTransition, mergedMeta.missingMaster, mergedMeta.runId]);

  const entries = appointmentQuery.data?.entries ?? [];
  const filteredEntries = useMemo(
    () => filterEntries(entries, keyword, departmentFilter, physicianFilter),
    [entries, keyword, departmentFilter, physicianFilter],
  );
  const sortedEntries = useMemo(() => sortEntries(filteredEntries, sortKey), [filteredEntries, sortKey]);
  const grouped = useMemo(() => groupByStatus(sortedEntries), [sortedEntries]);

  const uniqueDepartments = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.department).filter(Boolean))) as string[],
    [entries],
  );
  const uniquePhysicians = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.physician).filter(Boolean))) as string[],
    [entries],
  );

  const summaryText = useMemo(() => {
    const counts = grouped.map(({ status, items }) => `${status}: ${items.length}件`).join(' / ');
    return `検索結果 ${sortedEntries.length}件（${counts}）`;
  }, [grouped, sortedEntries.length]);

  useEffect(() => {
    summaryRef.current?.focus?.();
  }, [summaryText]);

  const tonePayload = useMemo(
    () => ({
      missingMaster: mergedMeta.missingMaster ?? true,
      cacheHit: mergedMeta.cacheHit ?? false,
      dataSourceTransition: mergedMeta.dataSourceTransition ?? 'snapshot',
    }),
    [mergedMeta.cacheHit, mergedMeta.dataSourceTransition, mergedMeta.missingMaster],
  );
  const toneDetails = useMemo(() => getChartToneDetails(tonePayload), [tonePayload]);
  const { tone, message: toneMessage, transitionMeta } = toneDetails;
  const masterSource = toMasterSource(tonePayload.dataSourceTransition);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittedKeyword(keyword.trim());
      appointmentQuery.refetch();
      logUiState({
        action: 'search',
        screen: 'reception/list',
        controlId: 'search-form',
        runId: mergedMeta.runId,
        dataSourceTransition: mergedMeta.dataSourceTransition,
      });
    },
    [appointmentQuery, keyword, mergedMeta.dataSourceTransition, mergedMeta.runId],
  );

  const handleClear = useCallback(() => {
    setKeyword('');
    setSubmittedKeyword('');
    setDepartmentFilter('');
    setPhysicianFilter('');
    setSortKey('time');
  }, []);

  const handleMasterSourceChange = useCallback(
    (value: ResolveMasterSource) => {
      const transition = value as DataSourceTransition;
      setDataSourceTransition(transition);
      logUiState({
        action: 'config_delivery',
        screen: 'reception/order-console',
        controlId: 'resolve-master-source',
        dataSourceTransition: transition,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        runId: mergedMeta.runId,
      });
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'order-console',
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        dataSourceTransition: transition,
        payload: { resolveMasterSource: value },
      });
    },
    [mergedMeta.runId, setDataSourceTransition, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  const handleToggleMissingMaster = useCallback(() => {
    const next = !tonePayload.missingMaster;
    setMissingMaster(next);
    logUiState({
      action: 'tone_change',
      screen: 'reception/order-console',
      controlId: 'toggle-missing-master',
      dataSourceTransition: tonePayload.dataSourceTransition,
      cacheHit: tonePayload.cacheHit,
      missingMaster: next,
      runId: mergedMeta.runId,
    });
    logAuditEvent({
      runId: mergedMeta.runId,
      source: 'order-console',
      note: missingMasterNote,
      cacheHit: tonePayload.cacheHit,
      missingMaster: next,
      dataSourceTransition: tonePayload.dataSourceTransition,
    });
  }, [mergedMeta.runId, missingMasterNote, setMissingMaster, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster]);

  const handleToggleCacheHit = useCallback(() => {
    const next = !tonePayload.cacheHit;
    setCacheHit(next);
    logUiState({
      action: 'tone_change',
      screen: 'reception/order-console',
      controlId: 'toggle-cache-hit',
      dataSourceTransition: tonePayload.dataSourceTransition,
      cacheHit: next,
      missingMaster: tonePayload.missingMaster,
      runId: mergedMeta.runId,
    });
    logAuditEvent({
      runId: mergedMeta.runId,
      source: 'order-console',
      note: missingMasterNote,
      cacheHit: next,
      missingMaster: tonePayload.missingMaster,
      dataSourceTransition: tonePayload.dataSourceTransition,
    });
  }, [mergedMeta.runId, missingMasterNote, setCacheHit, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster]);

  const handleMissingMasterNoteChange = useCallback(
    (value: string) => {
      setMissingMasterNote(value);
      logUiState({
        action: 'save',
        screen: 'reception/order-console',
        controlId: 'missing-master-note',
        runId: mergedMeta.runId,
        dataSourceTransition: tonePayload.dataSourceTransition,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        details: { missingMasterNote: value },
      });
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'order-console-note',
        note: value,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        dataSourceTransition: tonePayload.dataSourceTransition,
        payload: { missingMasterNote: value },
      });
    },
    [mergedMeta.runId, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  const handleRowDoubleClick = useCallback(
    (entry: ReceptionEntry) => {
      const nextRunId = mergedMeta.runId ?? initialRunId ?? flags.runId;
      if (nextRunId) {
        bumpRunId(nextRunId);
        updateObservabilityMeta({ runId: nextRunId });
      }
      logUiState({
        action: 'navigate',
        screen: 'reception/list',
        controlId: entry.id,
        runId: nextRunId,
        dataSourceTransition: mergedMeta.dataSourceTransition,
        cacheHit: mergedMeta.cacheHit,
        missingMaster: mergedMeta.missingMaster,
        patientId: entry.patientId,
      });
      navigate('/charts', { state: { patientId: entry.patientId, appointmentId: entry.appointmentId } });
    },
    [bumpRunId, flags.runId, initialRunId, mergedMeta.cacheHit, mergedMeta.dataSourceTransition, mergedMeta.missingMaster, mergedMeta.runId, navigate],
  );

  const toggleSection = (status: ReceptionStatus) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-run-id={mergedMeta.runId}>
        <AdminBroadcastBanner broadcast={broadcast} surface="reception" />
        <section className="reception-page__header">
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="reception-page__meta-bar" role="status" aria-live="polite" data-run-id={mergedMeta.runId}>
            <span className="reception-pill">RUN_ID: {mergedMeta.runId ?? '未取得'}</span>
            <span className="reception-pill">dataSourceTransition: {mergedMeta.dataSourceTransition ?? 'snapshot'}</span>
            <span className="reception-pill">missingMaster: {String(mergedMeta.missingMaster ?? true)}</span>
            <span className="reception-pill">cacheHit: {String(mergedMeta.cacheHit ?? false)}</span>
            {mergedMeta.fetchedAt && <span className="reception-pill">fetchedAt: {mergedMeta.fetchedAt}</span>}
          </div>
        </section>

        <OrderConsole
          masterSource={masterSource}
          missingMaster={tonePayload.missingMaster ?? true}
          cacheHit={tonePayload.cacheHit ?? false}
          missingMasterNote={missingMasterNote}
          runId={mergedMeta.runId ?? initialRunId ?? flags.runId}
          tone={tone}
          toneMessage={`${toneMessage} ｜ transition=${transitionMeta.label}`}
          patientId={patientId ?? ''}
          receptionId={receptionId ?? ''}
          destination={destination}
          nextAction={tone === 'error' || mergedMeta.missingMaster ? 'マスタ再取得' : 'ORCA再送'}
          transitionDescription={transitionMeta.description}
          onMasterSourceChange={handleMasterSourceChange}
          onToggleMissingMaster={handleToggleMissingMaster}
          onToggleCacheHit={handleToggleCacheHit}
          onMissingMasterNoteChange={handleMissingMasterNoteChange}
        />

        <section className="reception-search" aria-label="検索とフィルタ">
          <form className="reception-search__form" onSubmit={handleSearchSubmit}>
            <div className="reception-search__row">
              <label className="reception-search__field">
                <span>日付</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  required
                />
              </label>
              <label className="reception-search__field">
                <span>検索（患者ID/氏名/カナ）</span>
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="PX-0001 / 山田 / ヤマダ"
                />
              </label>
              <label className="reception-search__field">
                <span>診療科</span>
                <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                  <option value="">すべて</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>
              <label className="reception-search__field">
                <span>担当医</span>
                <select value={physicianFilter} onChange={(event) => setPhysicianFilter(event.target.value)}>
                  <option value="">すべて</option>
                  {uniquePhysicians.map((physician) => (
                    <option key={physician} value={physician}>
                      {physician}
                    </option>
                  ))}
                </select>
              </label>
              <label className="reception-search__field">
                <span>ソート</span>
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                  <option value="time">受付/予約時間</option>
                  <option value="name">氏名</option>
                  <option value="department">診療科</option>
                </select>
              </label>
            </div>
            <div className="reception-search__actions">
              <button type="submit" className="reception-search__button primary">
                検索
              </button>
              <button type="button" className="reception-search__button ghost" onClick={() => appointmentQuery.refetch()}>
                再取得
              </button>
              <button type="button" className="reception-search__button ghost" onClick={handleClear}>
                クリア
              </button>
            </div>
          </form>
          <p className="reception-summary" aria-live="polite" ref={summaryRef} tabIndex={-1}>
            {summaryText}
          </p>
          {appointmentQuery.isLoading && (
            <p role="status" aria-live="polite" className="reception-status">
              外来リストを読み込み中…
            </p>
          )}
          {appointmentQuery.isError && (
            <p role="alert" className="reception-status reception-status--error">
              外来リストの取得に失敗しました。再取得を試してください。
            </p>
          )}
        </section>

        {grouped.map(({ status, items }) => (
          <section key={status} className="reception-section" aria-label={`${SECTION_LABEL[status]}リスト`}>
            <header className="reception-section__header">
              <div>
                <h2>{SECTION_LABEL[status]}</h2>
                <span className="reception-section__count" aria-live="polite">
                  {items.length} 件
                </span>
              </div>
              <button
                type="button"
                className="reception-section__toggle"
                aria-expanded={!collapsed[status]}
                onClick={() => toggleSection(status)}
              >
                {collapsed[status] ? '開く' : '折りたたむ'}
              </button>
            </header>
            {!collapsed[status] && (
              <div className="reception-table__wrapper">
                <table className="reception-table">
                  <thead>
                    <tr>
                      <th scope="col">時間</th>
                      <th scope="col">患者</th>
                      <th scope="col">診療科</th>
                      <th scope="col">担当医</th>
                      <th scope="col">状態</th>
                      <th scope="col">メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="reception-table__empty">
                          該当なし
                        </td>
                      </tr>
                    )}
                    {items.map((entry) => (
                      <tr
                        key={entry.id}
                        tabIndex={0}
                        onDoubleClick={() => handleRowDoubleClick(entry)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleRowDoubleClick(entry);
                          }
                        }}
                        aria-label={`${entry.name ?? '患者'} ${entry.appointmentTime ?? ''} ${entry.department ?? ''}`}
                      >
                        <td>
                          <div className="reception-table__time">{entry.appointmentTime ?? '-'}</div>
                          <small className="reception-table__id">{entry.appointmentId ?? entry.id}</small>
                        </td>
                        <td>
                          <div className="reception-table__patient">
                            <strong>{entry.name ?? '未登録'}</strong>
                            {entry.kana && <small>{entry.kana}</small>}
                          </div>
                          {entry.patientId && <small className="reception-table__id">ID: {entry.patientId}</small>}
                        </td>
                        <td>{entry.department ?? '-'}</td>
                        <td>{entry.physician ?? '-'}</td>
                        <td>
                          <span className={`reception-badge reception-badge--${status}`}>
                            {SECTION_LABEL[status]}
                          </span>
                          {entry.insurance && <small className="reception-badge reception-badge--muted">{entry.insurance}</small>}
                        </td>
                        <td className="reception-table__note">
                          {entry.note ?? '-'}
                          <div className="reception-table__source">source: {entry.source}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </main>
    </>
  );
}
