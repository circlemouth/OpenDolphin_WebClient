import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';

import type { ReceptionEntry } from '../outpatient/types';
import type { OutpatientEncounterContext } from './encounterContext';
import { normalizeVisitDate } from './encounterContext';
import { fetchKarteIdByPatientId, fetchLetterList, type LetterModulePayload } from './letterApi';
import { fetchOrderBundles, type OrderBundle } from './orderBundleApi';
import { SOAP_SECTION_LABELS, formatSoapAuthoredAt, getLatestSoapEntries, type SoapEntry, type SoapSectionKey } from './soapNote';

type PastHubTab = 'encounters' | 'documents' | 'orders' | 'notes';

const ORDER_ENTITIES = [
  { entity: 'medOrder', label: '処方' },
  { entity: 'generalOrder', label: 'オーダー' },
] as const;

const DO_COPY_SECTIONS: SoapSectionKey[] = ['subjective', 'objective', 'assessment', 'plan'];

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const resolveEntryId = (entry: ReceptionEntry) => entry.receptionId ?? entry.appointmentId ?? entry.patientId ?? entry.id;

const resolveVisitDate = (entry: ReceptionEntry): string => {
  const date = normalizeVisitDate(entry.visitDate) ?? '';
  return date;
};

const formatEntryLabel = (entry: ReceptionEntry): string => {
  const date = resolveVisitDate(entry);
  const dept = entry.department ?? '診療科不明';
  const phys = entry.physician ?? '医師不明';
  const parts = [date, dept, phys].filter(Boolean);
  return parts.join(' / ') || '受診情報不明';
};

const resolveLetterIssuedAt = (letter: LetterModulePayload): string => {
  const raw = letter.confirmed ?? letter.recorded ?? letter.started ?? '';
  if (!raw) return '';
  // Server payload sometimes contains timestamp or datetime-ish strings; show the date portion when possible.
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return raw;
};

const formatOrderBundleLabel = (bundle: OrderBundle): string => {
  const started = bundle.started?.slice(0, 10);
  const items = bundle.items?.length ?? 0;
  const name = bundle.bundleName?.trim() || '名称未設定';
  const meta = [started ? `開始:${started}` : null, items ? `項目:${items}` : null].filter(Boolean).join(' / ');
  return meta ? `${name} (${meta})` : name;
};

const makeFromDate = (todayIso: string, days: number): string => {
  const base = new Date(`${todayIso}T00:00:00.000Z`);
  if (!Number.isFinite(base.getTime())) return todayIso;
  base.setUTCDate(base.getUTCDate() - days);
  return toIsoDate(base);
};

export type PastHubPanelProps = {
  patientId?: string;
  entries: ReceptionEntry[];
  soapHistory?: SoapEntry[];
  doCopyEnabled?: boolean;
  onRequestDoCopy?: (payload: { section: SoapSectionKey; entry: SoapEntry }) => void;
  selectedContext: OutpatientEncounterContext;
  switchLocked: boolean;
  switchLockedReason?: string;
  todayIso: string; // YYYY-MM-DD
  onSelectEncounter: (next: Partial<OutpatientEncounterContext>) => void;
};

export function PastHubPanel({
  patientId,
  entries,
  soapHistory = [],
  doCopyEnabled = false,
  onRequestDoCopy,
  selectedContext,
  switchLocked,
  switchLockedReason,
  todayIso,
  onSelectEncounter,
}: PastHubPanelProps) {
  const [tab, setTab] = useState<PastHubTab>('encounters');
  const historyEntries = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => (resolveVisitDate(b) || '').localeCompare(resolveVisitDate(a) || ''));
    return copy;
  }, [entries]);

  const from90Days = useMemo(() => makeFromDate(todayIso, 90), [todayIso]);

  const karteIdQuery = useQuery({
    queryKey: ['charts-past-hub-karte', patientId],
    queryFn: async () => {
      if (!patientId) return { ok: false as const, karteId: null as number | null, error: 'patientId is required' };
      const result = await fetchKarteIdByPatientId({ patientId });
      return { ok: result.ok, karteId: result.karteId ?? null, error: result.error };
    },
    enabled: Boolean(patientId) && tab === 'documents',
    staleTime: 30 * 1000,
  });

  const lettersQuery = useQuery({
    queryKey: ['charts-past-hub-letters', karteIdQuery.data?.karteId],
    queryFn: async () => {
      const karteId = karteIdQuery.data?.karteId;
      if (!karteId) return { ok: false as const, letters: [] as LetterModulePayload[], error: 'karteId is missing' };
      const result = await fetchLetterList({ karteId });
      return { ok: result.ok, letters: result.letters ?? [], error: result.error };
    },
    enabled: tab === 'documents' && Boolean(karteIdQuery.data?.karteId),
    staleTime: 30 * 1000,
  });

  const orderQueries = useQueries({
    queries: ORDER_ENTITIES.map((spec) => ({
      queryKey: ['charts-past-hub-order-bundles', patientId, spec.entity, from90Days],
      queryFn: () => {
        if (!patientId) return Promise.resolve({ ok: false, bundles: [] as OrderBundle[] });
        return fetchOrderBundles({ patientId, entity: spec.entity, from: from90Days });
      },
      enabled: Boolean(patientId) && tab === 'orders',
      staleTime: 30 * 1000,
    })),
  });

  const selectedEncounterKey = useMemo(() => {
    return [
      selectedContext.patientId ?? 'none',
      selectedContext.appointmentId ?? 'none',
      selectedContext.receptionId ?? 'none',
      selectedContext.visitDate ?? 'none',
    ].join('::');
  }, [selectedContext.appointmentId, selectedContext.patientId, selectedContext.receptionId, selectedContext.visitDate]);

  const handleSelect = (entry: ReceptionEntry) => {
    const next = {
      patientId: entry.patientId ?? entry.id,
      appointmentId: entry.appointmentId,
      receptionId: entry.receptionId,
      visitDate: normalizeVisitDate(entry.visitDate),
    };
    onSelectEncounter(next);
  };

  const letters = (lettersQuery.data?.letters ?? []).slice().sort((a, b) => resolveLetterIssuedAt(b).localeCompare(resolveLetterIssuedAt(a)));
  const soapLatestBySection = useMemo(() => getLatestSoapEntries(soapHistory), [soapHistory]);

  return (
    <section className="charts-past-hub" aria-label="Past Hub（過去参照集約）" data-tab={tab}>
      <header className="charts-past-hub__header">
        <div>
          <strong>Past Hub</strong>
          <p className="charts-past-hub__desc">過去参照（受診/記載/文書/オーダー）を集約して表示します。</p>
        </div>
        <div className="charts-past-hub__tabs" role="tablist" aria-label="Past Hub タブ">
          <button
            type="button"
            role="tab"
            className={`patients-tab__tab${tab === 'encounters' ? ' is-active' : ''}`}
            aria-selected={tab === 'encounters'}
            onClick={() => setTab('encounters')}
          >
            受診
          </button>
          <button
            type="button"
            role="tab"
            className={`patients-tab__tab${tab === 'notes' ? ' is-active' : ''}`}
            aria-selected={tab === 'notes'}
            onClick={() => setTab('notes')}
          >
            記載
          </button>
          <button
            type="button"
            role="tab"
            className={`patients-tab__tab${tab === 'documents' ? ' is-active' : ''}`}
            aria-selected={tab === 'documents'}
            onClick={() => setTab('documents')}
            disabled={!patientId}
            title={!patientId ? '患者未選択' : undefined}
          >
            文書
          </button>
          <button
            type="button"
            role="tab"
            className={`patients-tab__tab${tab === 'orders' ? ' is-active' : ''}`}
            aria-selected={tab === 'orders'}
            onClick={() => setTab('orders')}
            disabled={!patientId}
            title={!patientId ? '患者未選択' : undefined}
          >
            オーダー
          </button>
        </div>
      </header>

      {tab === 'encounters' && (
        <div className="charts-past-hub__content" aria-label="過去受診">
          {switchLocked ? (
            <p className="charts-past-hub__guard" role="status">
              患者切替はロック中です: {switchLockedReason ?? '処理中/閲覧専用'}
            </p>
          ) : null}
          <div className="charts-past-hub__list">
            {historyEntries.length === 0 ? (
              <p className="patients-tab__detail-empty" role="status">
                受診履歴がありません。
              </p>
            ) : (
              <ul className="charts-past-hub__items" aria-label="受診履歴一覧">
                {historyEntries.slice(0, 12).map((entry) => {
                  const id = resolveEntryId(entry);
                  const key = [
                    entry.patientId ?? entry.id,
                    entry.appointmentId ?? 'none',
                    entry.receptionId ?? 'none',
                    resolveVisitDate(entry) || 'none',
                  ].join('::');
                  const active = key === selectedEncounterKey;
                  return (
                    <li key={id} className="charts-past-hub__item">
                      <button
                        type="button"
                        className={`patients-tab__history-row${active ? ' is-active' : ''}`}
                        onClick={() => handleSelect(entry)}
                        disabled={switchLocked}
                        aria-current={active ? 'true' : undefined}
                      >
                        <div className="patients-tab__history-main">
                          <strong>{formatEntryLabel(entry)}</strong>
                          <span className="patients-tab__history-badge">{entry.status}</span>
                        </div>
                        <div className="patients-tab__history-sub">
                          <span>{entry.insurance ?? '保険不明'}</span>
                          {entry.receptionId ? <span>受付ID:{entry.receptionId}</span> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <small className="charts-past-hub__hint">上限12件のみ表示（Phase1）。</small>
        </div>
      )}

      {tab === 'notes' && (
        <div className="charts-past-hub__content" aria-label="過去記載（SOAP履歴）">
          {soapHistory.length === 0 ? (
            <p className="patients-tab__detail-empty" role="status">
              SOAP履歴がありません。中央の SOAP パネルで「保存/更新」を実行すると履歴が作成されます。
            </p>
          ) : (
            <div className="charts-past-hub__list">
              <ul className="charts-past-hub__items" aria-label="SOAP履歴（最新）">
                {DO_COPY_SECTIONS.map((section) => {
                  const entry = soapLatestBySection.get(section);
                  const body = entry?.body?.trim() ?? '';
                  const snippet = body.length > 140 ? `${body.slice(0, 140)}...` : body;
                  const meta = entry ? `${formatSoapAuthoredAt(entry.authoredAt)} ／ ${entry.authorRole}` : '記載履歴なし';
                  const disabled = !doCopyEnabled || !entry || !body;
                  return (
                    <li key={section} className="charts-past-hub__item">
                      <div className="charts-past-hub__headline">{SOAP_SECTION_LABELS[section]}</div>
                      <div className="charts-past-hub__sub">{meta}</div>
                      <div className="charts-past-hub__sub">{snippet ? `「${snippet}」` : '—'}</div>
                      <div className="charts-past-hub__actions" role="group" aria-label={`${SOAP_SECTION_LABELS[section]} 操作`}>
                        <button
                          type="button"
                          className="charts-past-hub__do"
                          disabled={disabled}
                          title={!doCopyEnabled ? 'flag off（VITE_CHARTS_DO_COPY=0）' : !entry ? '履歴なし' : undefined}
                          onClick={() => {
                            if (!entry) return;
                            onRequestDoCopy?.({ section, entry });
                          }}
                        >
                          Do転記
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <small className="charts-past-hub__hint">
            Phase1: Do転記はローカルドラフトへ反映（プレビュー/Undoあり）。server保存/監査整合は後続で拡張。
          </small>
        </div>
      )}

      {tab === 'documents' && (
        <div className="charts-past-hub__content" aria-label="過去文書">
          {!patientId ? <p className="patients-tab__detail-empty">患者未選択のため文書履歴は表示できません。</p> : null}
          {karteIdQuery.isFetching || lettersQuery.isFetching ? (
            <p className="patients-tab__detail-empty" role="status">
              文書履歴を取得しています...
            </p>
          ) : null}
          {lettersQuery.isError ? (
            <p className="patients-tab__detail-empty">文書履歴の取得に失敗しました。</p>
          ) : null}
          {lettersQuery.data && letters.length === 0 && !lettersQuery.isFetching ? (
            <p className="patients-tab__detail-empty">文書履歴はまだありません。</p>
          ) : null}
          {letters.length > 0 ? (
            <div className="charts-past-hub__list">
              <ul className="charts-past-hub__items" aria-label="文書履歴一覧">
                {letters.slice(0, 12).map((letter, index) => {
                  const issuedAt = resolveLetterIssuedAt(letter);
                  const title = letter.title?.trim() || '文書';
                  const type = letter.letterType?.trim() || 'type不明';
                  const handleClass = letter.handleClass?.trim();
                  const meta = [issuedAt ? `発行:${issuedAt}` : null, `種別:${type}`, handleClass ? `class:${handleClass}` : null]
                    .filter(Boolean)
                    .join(' / ');
                  return (
                    <li key={letter.id ?? `${title}-${issuedAt}-${index}`} className="charts-past-hub__item">
                      <div className="charts-past-hub__headline">{title}</div>
                      <div className="charts-past-hub__sub">{meta}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          <small className="charts-past-hub__hint">取得API: `fetchLetterList/fetchLetterDetail` 相当（Phase1は read-only）。</small>
        </div>
      )}

      {tab === 'orders' && (
        <div className="charts-past-hub__content" aria-label="過去オーダー">
          {!patientId ? <p className="patients-tab__detail-empty">患者未選択のためオーダー履歴は表示できません。</p> : null}
          <div className="charts-past-hub__list">
            {ORDER_ENTITIES.map((spec, index) => {
              const q = orderQueries[index];
              const bundles = (q.data?.bundles ?? []).slice().sort((a, b) => (b.started ?? '').localeCompare(a.started ?? ''));
              return (
                <section key={spec.entity} className="charts-past-hub__group" aria-label={`過去${spec.label}`}>
                  <header className="charts-past-hub__group-header">
                    <strong>{spec.label}</strong>
                    <span className="charts-past-hub__group-meta">
                      {q.isFetching ? '取得中' : `${bundles.length}件`} / from={from90Days}
                    </span>
                  </header>
                  {q.isError ? <p className="patients-tab__detail-empty">取得に失敗しました。</p> : null}
                  {!q.isFetching && bundles.length === 0 ? <p className="patients-tab__detail-empty">履歴はまだありません。</p> : null}
                  {bundles.length > 0 ? (
                    <ul className="charts-past-hub__items" aria-label={`${spec.label}履歴一覧`}>
                      {bundles.slice(0, 8).map((bundle) => (
                        <li key={bundle.documentId ?? `${bundle.bundleName}-${bundle.started}`} className="charts-past-hub__item">
                          <div className="charts-past-hub__headline">{formatOrderBundleLabel(bundle)}</div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>
          <small className="charts-past-hub__hint">Phase1は read-only（Do適用/転記は Phase2 で扱う）。</small>
        </div>
      )}
    </section>
  );
}
