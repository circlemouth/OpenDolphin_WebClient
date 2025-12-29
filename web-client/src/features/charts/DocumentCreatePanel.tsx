import { useEffect, useMemo, useState } from 'react';

import { logUiState } from '../../libs/audit/auditLogger';
import { ensureObservabilityMeta } from '../../libs/observability/observability';
import { recordChartsAuditEvent, type ChartsOperationPhase } from './audit';
import type { DataSourceTransition } from './authService';

export type DocumentCreatePanelMeta = {
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string;
  actorRole?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
};

export type DocumentCreatePanelProps = {
  patientId?: string;
  meta: DocumentCreatePanelMeta;
  onClose?: () => void;
};

type DocumentType = 'referral' | 'certificate' | 'reply';

type ReferralFormState = {
  issuedAt: string;
  hospital: string;
  doctor: string;
  purpose: string;
  diagnosis: string;
  body: string;
};

type CertificateFormState = {
  issuedAt: string;
  submitTo: string;
  diagnosis: string;
  purpose: string;
  body: string;
};

type ReplyFormState = {
  issuedAt: string;
  hospital: string;
  doctor: string;
  summary: string;
};

type DocumentFormState = {
  referral: ReferralFormState;
  certificate: CertificateFormState;
  reply: ReplyFormState;
};

type SavedDocument = {
  id: string;
  type: DocumentType;
  issuedAt: string;
  title: string;
  savedAt: string;
};

const DOCUMENT_TYPES: { type: DocumentType; label: string; hint: string }[] = [
  { type: 'referral', label: '紹介状', hint: '宛先・目的・診断名を入力して保存します。' },
  { type: 'certificate', label: '診断書', hint: '提出先と診断内容を記録します。' },
  { type: 'reply', label: '返信書', hint: '紹介元への返信内容を簡潔にまとめます。' },
];

const buildEmptyForms = (today: string): DocumentFormState => ({
  referral: {
    issuedAt: today,
    hospital: '',
    doctor: '',
    purpose: '',
    diagnosis: '',
    body: '',
  },
  certificate: {
    issuedAt: today,
    submitTo: '',
    diagnosis: '',
    purpose: '',
    body: '',
  },
  reply: {
    issuedAt: today,
    hospital: '',
    doctor: '',
    summary: '',
  },
});

const buildDocumentSummary = (type: DocumentType, form: DocumentFormState): string => {
  if (type === 'referral') {
    return form.referral.hospital || '宛先未設定の紹介状';
  }
  if (type === 'certificate') {
    return form.certificate.submitTo || '提出先未設定の診断書';
  }
  return form.reply.hospital || '返信先未設定の返信書';
};

const resolveRequiredFields = (type: DocumentType): { key: string; label: string }[] => {
  if (type === 'referral') {
    return [
      { key: 'issuedAt', label: '発行日' },
      { key: 'hospital', label: '宛先医療機関' },
      { key: 'doctor', label: '宛先医師' },
      { key: 'purpose', label: '紹介目的' },
      { key: 'diagnosis', label: '主病名' },
      { key: 'body', label: '紹介内容' },
    ];
  }
  if (type === 'certificate') {
    return [
      { key: 'issuedAt', label: '発行日' },
      { key: 'submitTo', label: '提出先' },
      { key: 'diagnosis', label: '診断名' },
      { key: 'purpose', label: '用途' },
      { key: 'body', label: '所見' },
    ];
  }
  return [
    { key: 'issuedAt', label: '発行日' },
    { key: 'hospital', label: '返信先医療機関' },
    { key: 'doctor', label: '返信先医師' },
    { key: 'summary', label: '返信内容' },
  ];
};

const resolveMissingFields = (type: DocumentType, form: DocumentFormState): string[] => {
  const required = resolveRequiredFields(type);
  const payload = form[type];
  return required
    .filter((field) => {
      const value = (payload as Record<string, string>)[field.key];
      return !value || value.trim().length === 0;
    })
    .map((field) => field.label);
};

export function DocumentCreatePanel({ patientId, meta, onClose }: DocumentCreatePanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeType, setActiveType] = useState<DocumentType>('referral');
  const [forms, setForms] = useState<DocumentFormState>(() => buildEmptyForms(today));
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const observability = useMemo(() => ensureObservabilityMeta({ runId: meta.runId }), [meta.runId]);
  const resolvedRunId = observability.runId ?? meta.runId;
  const blockReasons = useMemo(() => {
    const reasons: string[] = [];
    if (meta.readOnly) {
      reasons.push(meta.readOnlyReason ?? '閲覧専用のため文書作成はできません。');
    }
    if (meta.missingMaster) {
      reasons.push('マスター未同期のため文書作成はできません。');
    }
    if (meta.fallbackUsed) {
      reasons.push('フォールバックデータのため文書作成はできません。');
    }
    return reasons;
  }, [meta.fallbackUsed, meta.missingMaster, meta.readOnly, meta.readOnlyReason]);
  const isBlocked = blockReasons.length > 0;

  useEffect(() => {
    logUiState({
      action: 'navigate',
      screen: 'charts/document-create',
      runId: resolvedRunId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      details: {
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
        documentType: activeType,
      },
    });
  }, [
    activeType,
    meta.appointmentId,
    meta.cacheHit,
    meta.dataSourceTransition,
    meta.fallbackUsed,
    meta.missingMaster,
    meta.patientId,
    meta.receptionId,
    meta.visitDate,
    resolvedRunId,
  ]);

  const updateForm = <T extends DocumentType>(type: T, next: Partial<DocumentFormState[T]>) => {
    setForms((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...next,
      },
    }));
  };

  const logDocumentAudit = (action: 'CHARTS_DOCUMENT_CREATE' | 'CHARTS_DOCUMENT_CANCEL', phase: ChartsOperationPhase, details: Record<string, unknown>) => {
    recordChartsAuditEvent({
      action,
      outcome: action === 'CHARTS_DOCUMENT_CREATE' ? 'success' : 'resolved',
      runId: resolvedRunId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      subject: 'charts',
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      details: {
        operationPhase: phase,
        documentType: activeType,
        ...details,
      },
    });
  };

  const handleSave = () => {
    if (!patientId) {
      setNotice({ tone: 'error', message: '患者IDが未選択のため文書を保存できません。' });
      recordChartsAuditEvent({
        action: 'CHARTS_DOCUMENT_CREATE',
        outcome: 'blocked',
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        subject: 'charts',
        details: {
          operationPhase: 'save',
          documentType: activeType,
          blockedReasons: ['patient_not_selected'],
        },
      });
      return;
    }
    if (isBlocked) {
      setNotice({ tone: 'error', message: '編集制限のため文書を保存できません。' });
      recordChartsAuditEvent({
        action: 'CHARTS_DOCUMENT_CREATE',
        outcome: 'blocked',
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        subject: 'charts',
        details: {
          operationPhase: 'save',
          documentType: activeType,
          blockedReasons: blockReasons,
        },
      });
      return;
    }

    const missing = resolveMissingFields(activeType, forms);
    if (missing.length > 0) {
      setNotice({ tone: 'error', message: `必須項目が未入力です: ${missing.join('、')}` });
      recordChartsAuditEvent({
        action: 'CHARTS_DOCUMENT_CREATE',
        outcome: 'warning',
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        subject: 'charts',
        details: {
          operationPhase: 'save',
          documentType: activeType,
          missingFields: missing,
        },
      });
      return;
    }

    const summary = buildDocumentSummary(activeType, forms);
    const issuedAt = forms[activeType].issuedAt;
    const savedAt = new Date().toISOString();
    setSavedDocs((prev) => [
      {
        id: `doc-${Date.now()}`,
        type: activeType,
        issuedAt,
        title: summary,
        savedAt,
      },
      ...prev,
    ]);
    setNotice({
      tone: 'success',
      message: '文書を保存しました（P0: テンプレ/印刷は未対応）。',
    });
    setForms((prev) => ({
      ...prev,
      [activeType]: buildEmptyForms(today)[activeType],
    }));

    logDocumentAudit('CHARTS_DOCUMENT_CREATE', 'save', {
      documentTitle: summary,
      documentIssuedAt: issuedAt,
    });
  };

  const handleCancel = () => {
    setForms(buildEmptyForms(today));
    setNotice({ tone: 'info', message: '入力を中断しました。' });
    logDocumentAudit('CHARTS_DOCUMENT_CANCEL', 'do', {
      documentTitle: buildDocumentSummary(activeType, forms),
      documentIssuedAt: forms[activeType].issuedAt,
    });
    if (onClose) onClose();
  };

  if (!patientId) {
    return <p className="charts-side-panel__empty">患者IDが未選択のため文書作成を開始できません。</p>;
  }

  return (
    <section className="charts-side-panel__section" data-test-id="document-create-panel">
      <header className="charts-side-panel__section-header">
        <div>
          <h4>文書作成メニュー</h4>
          <p>紹介状/診断書/返信書の必須項目のみ入力できます（テンプレ/印刷は P1 以降）。</p>
        </div>
        <button type="button" className="charts-side-panel__ghost" onClick={handleCancel}>
          中断して閉じる
        </button>
      </header>
      {notice && <div className={`charts-side-panel__notice charts-side-panel__notice--${notice.tone}`}>{notice.message}</div>}
      {blockReasons.length > 0 && (
        <div className="charts-side-panel__notice charts-side-panel__notice--info">
          {blockReasons.map((reason) => (
            <p key={reason} className="charts-side-panel__message">
              {reason}
            </p>
          ))}
        </div>
      )}
      <div className="charts-document-menu" role="tablist" aria-label="文書種類">
        {DOCUMENT_TYPES.map((entry) => (
          <button
            key={entry.type}
            type="button"
            role="tab"
            aria-selected={activeType === entry.type}
            className={`charts-document-menu__button${activeType === entry.type ? ' charts-document-menu__button--active' : ''}`}
            onClick={() => setActiveType(entry.type)}
            disabled={isBlocked}
          >
            <span>{entry.label}</span>
            <small>{entry.hint}</small>
          </button>
        ))}
      </div>
      <form className="charts-side-panel__form" onSubmit={(event) => event.preventDefault()}>
        {activeType === 'referral' && (
          <>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-issued">発行日 *</label>
              <input
                id="referral-issued"
                type="date"
                value={forms.referral.issuedAt}
                onChange={(event) => updateForm('referral', { issuedAt: event.target.value })}
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-hospital">宛先医療機関 *</label>
              <input
                id="referral-hospital"
                type="text"
                value={forms.referral.hospital}
                onChange={(event) => updateForm('referral', { hospital: event.target.value })}
                placeholder="○○病院/クリニック"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-doctor">宛先医師 *</label>
              <input
                id="referral-doctor"
                type="text"
                value={forms.referral.doctor}
                onChange={(event) => updateForm('referral', { doctor: event.target.value })}
                placeholder="担当医師名"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-purpose">紹介目的 *</label>
              <input
                id="referral-purpose"
                type="text"
                value={forms.referral.purpose}
                onChange={(event) => updateForm('referral', { purpose: event.target.value })}
                placeholder="精査依頼/治療依頼など"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-diagnosis">主病名 *</label>
              <input
                id="referral-diagnosis"
                type="text"
                value={forms.referral.diagnosis}
                onChange={(event) => updateForm('referral', { diagnosis: event.target.value })}
                placeholder="例: 高血圧症"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="referral-body">紹介内容 *</label>
              <textarea
                id="referral-body"
                value={forms.referral.body}
                onChange={(event) => updateForm('referral', { body: event.target.value })}
                placeholder="既往歴/検査結果/依頼内容を要約"
                disabled={isBlocked}
              />
            </div>
          </>
        )}
        {activeType === 'certificate' && (
          <>
            <div className="charts-side-panel__field">
              <label htmlFor="certificate-issued">発行日 *</label>
              <input
                id="certificate-issued"
                type="date"
                value={forms.certificate.issuedAt}
                onChange={(event) => updateForm('certificate', { issuedAt: event.target.value })}
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="certificate-submit">提出先 *</label>
              <input
                id="certificate-submit"
                type="text"
                value={forms.certificate.submitTo}
                onChange={(event) => updateForm('certificate', { submitTo: event.target.value })}
                placeholder="提出先/提出目的"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="certificate-diagnosis">診断名 *</label>
              <input
                id="certificate-diagnosis"
                type="text"
                value={forms.certificate.diagnosis}
                onChange={(event) => updateForm('certificate', { diagnosis: event.target.value })}
                placeholder="診断名"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="certificate-purpose">用途 *</label>
              <input
                id="certificate-purpose"
                type="text"
                value={forms.certificate.purpose}
                onChange={(event) => updateForm('certificate', { purpose: event.target.value })}
                placeholder="保険/学校/勤務先など"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="certificate-body">所見 *</label>
              <textarea
                id="certificate-body"
                value={forms.certificate.body}
                onChange={(event) => updateForm('certificate', { body: event.target.value })}
                placeholder="所見/経過を簡潔に記載"
                disabled={isBlocked}
              />
            </div>
          </>
        )}
        {activeType === 'reply' && (
          <>
            <div className="charts-side-panel__field">
              <label htmlFor="reply-issued">発行日 *</label>
              <input
                id="reply-issued"
                type="date"
                value={forms.reply.issuedAt}
                onChange={(event) => updateForm('reply', { issuedAt: event.target.value })}
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="reply-hospital">返信先医療機関 *</label>
              <input
                id="reply-hospital"
                type="text"
                value={forms.reply.hospital}
                onChange={(event) => updateForm('reply', { hospital: event.target.value })}
                placeholder="紹介元医療機関"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="reply-doctor">返信先医師 *</label>
              <input
                id="reply-doctor"
                type="text"
                value={forms.reply.doctor}
                onChange={(event) => updateForm('reply', { doctor: event.target.value })}
                placeholder="担当医師名"
                disabled={isBlocked}
              />
            </div>
            <div className="charts-side-panel__field">
              <label htmlFor="reply-summary">返信内容 *</label>
              <textarea
                id="reply-summary"
                value={forms.reply.summary}
                onChange={(event) => updateForm('reply', { summary: event.target.value })}
                placeholder="診断結果/今後の方針を記載"
                disabled={isBlocked}
              />
            </div>
          </>
        )}
        <div className="charts-side-panel__actions">
          <button type="button" onClick={handleSave} disabled={isBlocked}>
            保存
          </button>
          <button type="button" onClick={handleCancel}>
            中断
          </button>
        </div>
      </form>
      <div className="charts-document-list" aria-live="polite">
        <div className="charts-document-list__header">
          <strong>保存済み文書</strong>
          <span>{savedDocs.length} 件</span>
        </div>
        {savedDocs.length === 0 ? (
          <p className="charts-side-panel__empty">保存履歴はまだありません。</p>
        ) : (
          <ul className="charts-document-list__items">
            {savedDocs.map((doc) => (
              <li key={doc.id}>
                <div>
                  <strong>{DOCUMENT_TYPES.find((entry) => entry.type === doc.type)?.label ?? '文書'}</strong>
                  <span>{doc.title}</span>
                </div>
                <small>
                  発行日: {doc.issuedAt} / 保存: {new Date(doc.savedAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
