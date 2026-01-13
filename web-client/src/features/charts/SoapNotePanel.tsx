import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DataSourceTransition } from './authService';
import { recordChartsAuditEvent } from './audit';
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
  onAppendHistory?: (entries: SoapEntry[]) => void;
  onDraftDirtyChange?: (next: {
    dirty: boolean;
    patientId?: string;
    appointmentId?: string;
    receptionId?: string;
    visitDate?: string;
  }) => void;
  onClearHistory?: () => void;
  onAuditLogged?: () => void;
};

const resolveAuthorLabel = (author: SoapNoteAuthor) => {
  return author.displayName ?? author.userId ?? author.role;
};

const filterTemplatesForSection = (section: SoapSectionKey) =>
  SOAP_TEMPLATES.filter((template) => Boolean(template.sections[section]));

export function SoapNotePanel({
  history,
  meta,
  author,
  readOnly,
  readOnlyReason,
  onAppendHistory,
  onDraftDirtyChange,
  onClearHistory,
  onAuditLogged,
}: SoapNotePanelProps) {
  const [draft, setDraft] = useState<SoapDraft>(() => buildSoapDraftFromHistory(history));
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Record<SoapSectionKey, string>>>({});
  const [pendingTemplate, setPendingTemplate] = useState<Partial<Record<SoapSectionKey, string>>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subjectiveTab, setSubjectiveTab] = useState<'soap' | 'subjectives'>('soap');

  const latestBySection = useMemo(() => getLatestSoapEntries(history), [history]);

  useEffect(() => {
    setDraft(buildSoapDraftFromHistory(history));
    setSelectedTemplate({});
    setPendingTemplate({});
    setFeedback(null);
    setSubjectiveTab('soap');
  }, [history]);

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
      });
    },
    [author, meta.appointmentId, meta.cacheHit, meta.dataSourceTransition, meta.fallbackUsed, meta.missingMaster, meta.patientId, meta.receptionId, meta.runId, meta.visitDate, onDraftDirtyChange, selectedTemplate],
  );

  const handleSave = useCallback(() => {
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
    });
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
