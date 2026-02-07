import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DataSourceTransition } from './authService';
import { recordChartsAuditEvent } from './audit';
import type { DraftDirtySource } from './draftSources';
import {
  SOAP_SECTIONS,
  SOAP_SECTION_LABELS,
  SOAP_TEMPLATES,
  buildSoapDraftFromHistory,
  buildSoapEntryId,
  formatSoapAuthoredAt,
  getLatestSoapEntries,
  type SoapDraft,
  type SoapEntry,
  type SoapSectionKey,
} from './soapNote';
import { SubjectivesPanel } from './soap/SubjectivesPanel';
import { appendImageAttachmentPlaceholders, type ChartImageAttachment } from './documentImageAttach';
import { postChartSubjectiveEntry } from './soap/subjectiveChartApi';
import { RevisionHistoryDrawer } from './revisions/RevisionHistoryDrawer';

export type SoapNoteMeta = {
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string;
};

export type SoapNoteAuthor = {
  role: string;
  displayName?: string;
  userId: string;
};

type SoapNotePanelProps = {
  history: SoapEntry[];
  meta: SoapNoteMeta;
  author: SoapNoteAuthor;
  readOnly?: boolean;
  readOnlyReason?: string;
  onDraftSnapshot?: (draft: SoapDraft) => void;
  applyDraftPatch?: { token: string; section: SoapSectionKey; body: string; note?: string } | null;
  attachmentInsert?: { attachment: ChartImageAttachment; section: SoapSectionKey; token: string } | null;
  onAttachmentInserted?: () => void;
  onAppendHistory?: (entries: SoapEntry[]) => void;
  onDraftDirtyChange?: (next: {
    dirty: boolean;
    patientId?: string;
    appointmentId?: string;
    receptionId?: string;
    visitDate?: string;
    dirtySources?: DraftDirtySource[];
  }) => void;
  onClearHistory?: () => void;
  onAuditLogged?: () => void;
};

const resolveAuthorLabel = (author: SoapNoteAuthor) => {
  return author.displayName ?? author.userId ?? author.role;
};

const filterTemplatesForSection = (section: SoapSectionKey) =>
  SOAP_TEMPLATES.filter((template) => Boolean(template.sections[section]));

const resolveSoapCategory = (section: SoapSectionKey): 'S' | 'O' | 'A' | 'P' | null => {
  switch (section) {
    case 'subjective':
      return 'S';
    case 'objective':
      return 'O';
    case 'assessment':
      return 'A';
    case 'plan':
      return 'P';
    case 'free':
      return 'S';
    default:
      return null;
  }
};

export function SoapNotePanel({
  history,
  meta,
  author,
  readOnly,
  readOnlyReason,
  onDraftSnapshot,
  applyDraftPatch,
  attachmentInsert,
  onAttachmentInserted,
  onAppendHistory,
  onDraftDirtyChange,
  onClearHistory,
  onAuditLogged,
}: SoapNotePanelProps) {
  const isRevisionHistoryEnabled = import.meta.env.VITE_CHARTS_REVISION_HISTORY === '1';
  const [draft, setDraft] = useState<SoapDraft>(() => buildSoapDraftFromHistory(history));
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Record<SoapSectionKey, string>>>({});
  const [pendingTemplate, setPendingTemplate] = useState<Partial<Record<SoapSectionKey, string>>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subjectiveTab, setSubjectiveTab] = useState<'soap' | 'subjectives'>('soap');
  const [revisionDrawerOpen, setRevisionDrawerOpen] = useState(false);

  const latestBySection = useMemo(() => getLatestSoapEntries(history), [history]);

  const historySignature = useMemo(
    () => history.map((entry) => entry.id ?? entry.authoredAt ?? '').join('|'),
    [history],
  );

  useEffect(() => {
    setDraft(buildSoapDraftFromHistory(history));
    setSelectedTemplate({});
    setPendingTemplate({});
    setFeedback(null);
    setSubjectiveTab('soap');
  }, [historySignature]);

  useEffect(() => {
    onDraftSnapshot?.(draft);
  }, [draft, onDraftSnapshot]);

  useEffect(() => {
    if (!applyDraftPatch) return;
    if (readOnly) {
      setFeedback(readOnlyReason ?? '読み取り専用のため転記できません。');
      return;
    }
    setDraft((prev) => ({ ...prev, [applyDraftPatch.section]: applyDraftPatch.body }));
    setFeedback(applyDraftPatch.note ?? `${SOAP_SECTION_LABELS[applyDraftPatch.section]} を転記しました。`);
    onDraftDirtyChange?.({
      dirty: true,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      receptionId: meta.receptionId,
      visitDate: meta.visitDate,
      dirtySources: ['soap'],
    });
  }, [applyDraftPatch?.token, readOnly, readOnlyReason, onDraftDirtyChange, meta.patientId, meta.appointmentId, meta.receptionId, meta.visitDate]);

  useEffect(() => {
    if (!isRevisionHistoryEnabled) setRevisionDrawerOpen(false);
  }, [isRevisionHistoryEnabled]);

  useEffect(() => {
    if (!attachmentInsert) return;
    if (readOnly) {
      setFeedback(readOnlyReason ?? '読み取り専用のため挿入できません。');
      onAttachmentInserted?.();
      return;
    }
    const targetSection = attachmentInsert.section ?? 'free';
    setDraft((prev) => ({
      ...prev,
      [targetSection]: appendImageAttachmentPlaceholders(prev[targetSection], attachmentInsert.attachment),
    }));
    setFeedback(`画像リンクを ${SOAP_SECTION_LABELS[targetSection]} に挿入しました。`);
    onDraftDirtyChange?.({
      dirty: true,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      receptionId: meta.receptionId,
      visitDate: meta.visitDate,
      dirtySources: ['soap'],
    });
    onAttachmentInserted?.();
  }, [
    attachmentInsert?.token,
    attachmentInsert,
    meta.appointmentId,
    meta.patientId,
    meta.receptionId,
    meta.visitDate,
    onAttachmentInserted,
    onDraftDirtyChange,
    readOnly,
    readOnlyReason,
  ]);

  const updateDraft = useCallback(
    (section: SoapSectionKey, value: string) => {
      setDraft((prev) => ({ ...prev, [section]: value }));
      setFeedback(null);
      onDraftDirtyChange?.({
        dirty: true,
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
        dirtySources: ['soap'],
      });
    },
    [meta.appointmentId, meta.patientId, meta.receptionId, meta.visitDate, onDraftDirtyChange],
  );

  const handleTemplateInsert = useCallback(
    (section: SoapSectionKey) => {
      const templateId = selectedTemplate[section];
      if (!templateId) {
        setFeedback('テンプレートを選択してください。');
        return;
      }
      const template = SOAP_TEMPLATES.find((item) => item.id === templateId);
      const snippet = template?.sections?.[section];
      if (!snippet) {
        setFeedback('テンプレート本文が見つかりません。');
        return;
      }
      setDraft((prev) => {
        const current = prev[section];
        const next = current ? `${current}\n${snippet}` : snippet;
        return { ...prev, [section]: next };
      });
      setPendingTemplate((prev) => ({ ...prev, [section]: templateId }));
      setSelectedTemplate((prev) => ({ ...prev, [section]: '' }));
      const authoredAt = new Date().toISOString();
      recordChartsAuditEvent({
        action: 'SOAP_TEMPLATE_APPLY',
        outcome: 'success',
        subject: 'chart-soap-template',
        actor: resolveAuthorLabel(author),
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        note: `${SOAP_SECTION_LABELS[section]} テンプレ挿入`,
        details: {
          soapSection: section,
          templateId,
          authoredAt,
          authorRole: author.role,
          authorName: resolveAuthorLabel(author),
          receptionId: meta.receptionId,
          visitDate: meta.visitDate,
          soapLength: snippet.length,
        },
      });
      setFeedback(`テンプレート「${template?.label ?? templateId}」を挿入しました。`);
      onDraftDirtyChange?.({
        dirty: true,
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
        dirtySources: ['soap'],
      });
    },
    [author, meta.appointmentId, meta.cacheHit, meta.dataSourceTransition, meta.fallbackUsed, meta.missingMaster, meta.patientId, meta.receptionId, meta.runId, meta.visitDate, onDraftDirtyChange, selectedTemplate],
  );

  const handleSave = useCallback(async () => {
    const authoredAt = new Date().toISOString();
    const entries: SoapEntry[] = [];
    SOAP_SECTIONS.forEach((section) => {
      const body = draft[section]?.trim();
      if (!body) return;
      const prior = latestBySection.get(section);
      const action = prior ? 'update' : 'save';
      const templateId = pendingTemplate[section] ?? prior?.templateId ?? null;
      const authorLabel = resolveAuthorLabel(author);
      const soapLength = body.length;
      const entry: SoapEntry = {
        id: buildSoapEntryId(section, authoredAt),
        section,
        body,
        templateId: templateId ?? undefined,
        authoredAt,
        authorRole: author.role,
        authorName: authorLabel,
        action,
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
      };
      entries.push(entry);

      recordChartsAuditEvent({
        action: action === 'save' ? 'SOAP_NOTE_SAVE' : 'SOAP_NOTE_UPDATE',
        outcome: 'success',
        subject: 'chart-soap-note',
        actor: authorLabel,
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        note: `${SOAP_SECTION_LABELS[section]} 記載`,
        details: {
          soapSection: section,
          authoredAt,
          authorRole: author.role,
          authorName: authorLabel,
          templateId,
          soapLength,
          receptionId: meta.receptionId,
          visitDate: meta.visitDate,
        },
      });
    });

    if (entries.length === 0) {
      setFeedback('記載内容が空のため保存できません。');
      return;
    }

    onAppendHistory?.(entries);
    onAuditLogged?.();
    setPendingTemplate({});
    setFeedback(`${entries.length} セクションを保存しました。`);
    onDraftDirtyChange?.({
      dirty: false,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      receptionId: meta.receptionId,
      visitDate: meta.visitDate,
      dirtySources: [],
    });

    if (!meta.patientId) {
      setFeedback('患者未選択のため server 保存をスキップしました。');
      return;
    }

    const performDate = meta.visitDate ?? new Date().toISOString().slice(0, 10);
    const requests = entries
      .map((entry) => {
        const soapCategory = resolveSoapCategory(entry.section);
        if (!soapCategory) return null;
        return {
          patientId: meta.patientId as string,
          performDate,
          soapCategory,
          physicianCode: undefined,
          body: entry.body,
        };
      })
      .filter((entry): entry is { patientId: string; performDate: string; soapCategory: 'S' | 'O' | 'A' | 'P'; physicianCode?: string; body: string } =>
        Boolean(entry),
      );

    if (requests.length === 0) {
      setFeedback('SOAP server 保存対象がありません。');
      return;
    }

    const results = await Promise.all(
      requests.map(async (payload) => {
        try {
          return await postChartSubjectiveEntry(payload);
        } catch (error) {
          return { ok: false, status: 0, apiResultMessage: String(error) };
        }
      }),
    );
    const failures = results.filter((result) => !result.ok || (result.apiResult && result.apiResult !== '00'));
    if (failures.length > 0) {
      const detail = failures[0]?.apiResultMessage ?? failures[0]?.apiResult ?? 'unknown';
      setFeedback(`SOAP server 保存に失敗/警告: ${detail}`);
      return;
    }
    setFeedback(`SOAP server 保存 OK（${results.length} 件）`);
  }, [
    author,
    draft,
    latestBySection,
    meta.appointmentId,
    meta.cacheHit,
    meta.dataSourceTransition,
    meta.fallbackUsed,
    meta.missingMaster,
    meta.patientId,
    meta.receptionId,
    meta.runId,
    meta.visitDate,
    onAppendHistory,
    onAuditLogged,
    onDraftDirtyChange,
    pendingTemplate,
  ]);

  const handleClear = useCallback(() => {
    setDraft({
      free: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    });
    setPendingTemplate({});
    setFeedback('入力内容をクリアしました。');
    onDraftDirtyChange?.({
      dirty: true,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      receptionId: meta.receptionId,
      visitDate: meta.visitDate,
      dirtySources: ['soap'],
    });
  }, [meta.appointmentId, meta.patientId, meta.receptionId, meta.visitDate, onDraftDirtyChange]);

  const handleClearHistory = useCallback(() => {
    if (!onClearHistory) return;
    const confirmed = typeof window === 'undefined' ? true : window.confirm('SOAP履歴をクリアしますか？');
    if (!confirmed) return;
    onClearHistory();
    setDraft({
      free: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    });
    setPendingTemplate({});
    setSelectedTemplate({});
    setFeedback('SOAP履歴をクリアしました。');
  }, [onClearHistory]);

  return (
    <section className="soap-note" aria-label="SOAP 記載" data-run-id={meta.runId}>
      <header className="soap-note__header">
        <div>
          <h2>SOAP 記載</h2>
          <p className="soap-note__subtitle">
            記載者: {resolveAuthorLabel(author)} ／ role: {author.role} ／ 受付: {meta.receptionId ?? '—'}
          </p>
        </div>
        <div className="soap-note__actions">
          {isRevisionHistoryEnabled ? (
            <button
              type="button"
              onClick={() => setRevisionDrawerOpen(true)}
              className="soap-note__ghost"
              aria-haspopup="dialog"
              aria-expanded={String(revisionDrawerOpen)}
            >
              版履歴
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={readOnly}
            className="soap-note__primary"
            title={readOnly ? readOnlyReason ?? '読み取り専用のため保存できません。' : undefined}
          >
            {history.length === 0 ? '保存' : '更新'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={readOnly}
            className="soap-note__ghost"
            title={readOnly ? readOnlyReason ?? '読み取り専用のためクリアできません。' : undefined}
          >
            クリア
          </button>
          {onClearHistory ? (
            <button type="button" onClick={handleClearHistory} className="soap-note__ghost">
              履歴クリア
            </button>
          ) : null}
        </div>
      </header>
      {isRevisionHistoryEnabled ? (
        <RevisionHistoryDrawer
          open={revisionDrawerOpen}
          onClose={() => setRevisionDrawerOpen(false)}
          meta={{
            patientId: meta.patientId,
            appointmentId: meta.appointmentId,
            receptionId: meta.receptionId,
            visitDate: meta.visitDate,
          }}
          soapHistory={history}
        />
      ) : null}
      {readOnly ? (
        <p className="soap-note__guard">読み取り専用: {readOnlyReason ?? '編集はロック中です。'}</p>
      ) : null}
      {feedback ? <p className="soap-note__feedback" role="status">{feedback}</p> : null}
      <div className="soap-note__grid">
        {SOAP_SECTIONS.map((section) => {
          const latest = latestBySection.get(section);
          const templateOptions = filterTemplatesForSection(section);
          const templateLabel = latest?.templateId ? `template=${latest.templateId}` : 'templateなし';
          const isSubjective = section === 'subjective';
          const showSoapEditor = !isSubjective || subjectiveTab === 'soap';
          return (
            <article key={section} className="soap-note__section" data-section={section}>
              <div className="soap-note__section-header">
                <strong>{SOAP_SECTION_LABELS[section]}</strong>
                <span>
                  {latest
                    ? `${formatSoapAuthoredAt(latest.authoredAt)} ／ ${latest.authorRole} ／ ${templateLabel}`
                    : '記載履歴なし'}
                </span>
              </div>
              {isSubjective ? (
                <div className="soap-note__tabs" role="tablist" aria-label="Subjective タブ">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={subjectiveTab === 'soap'}
                    className={`soap-note__tab${subjectiveTab === 'soap' ? ' soap-note__tab--active' : ''}`}
                    onClick={() => setSubjectiveTab('soap')}
                  >
                    SOAP 記載
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={subjectiveTab === 'subjectives'}
                    className={`soap-note__tab${subjectiveTab === 'subjectives' ? ' soap-note__tab--active' : ''}`}
                    onClick={() => setSubjectiveTab('subjectives')}
                  >
                    症状詳記
                  </button>
                </div>
              ) : null}
              {showSoapEditor ? (
                <>
                  <textarea
                    id={`soap-note-${section}`}
                    name={`soapNote-${section}`}
                    value={draft[section]}
                    onChange={(event) => updateDraft(section, event.target.value)}
                    rows={section === 'free' ? 4 : 3}
                    placeholder={`${SOAP_SECTION_LABELS[section]} を記載してください。`}
                    readOnly={readOnly}
                    aria-readonly={readOnly}
                  />
                  <div className="soap-note__section-actions">
                    <label>
                      テンプレ
                      <select
                        id={`soap-note-template-${section}`}
                        name={`soapNoteTemplate-${section}`}
                        value={selectedTemplate[section] ?? ''}
                        onChange={(event) =>
                          setSelectedTemplate((prev) => ({ ...prev, [section]: event.target.value }))
                        }
                        disabled={readOnly}
                        title={readOnly ? readOnlyReason ?? '読み取り専用のため選択できません。' : undefined}
                      >
                        <option value="">選択してください</option>
                        {templateOptions.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTemplateInsert(section)}
                      className="soap-note__ghost"
                      disabled={readOnly}
                      title={readOnly ? readOnlyReason ?? '読み取り専用のため挿入できません。' : undefined}
                    >
                      テンプレ挿入
                    </button>
                    {pendingTemplate[section] ? (
                      <span className="soap-note__template-tag">挿入中: {pendingTemplate[section]}</span>
                    ) : null}
                  </div>
                </>
              ) : (
                <SubjectivesPanel
                  patientId={meta.patientId}
                  visitDate={meta.visitDate}
                  runId={meta.runId}
                  readOnly={readOnly}
                  readOnlyReason={readOnlyReason}
                  suggestedText={draft.subjective}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
