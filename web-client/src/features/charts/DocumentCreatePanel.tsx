import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAuditActor } from '../../libs/auth/storedAuth';
import { hasStoredAuth } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import { recordChartsAuditEvent, type ChartsOperationPhase } from './audit';
import type { DataSourceTransition } from './authService';
import { DOCUMENT_TEMPLATES, DOCUMENT_TYPE_LABELS, getTemplateById, type DocumentType } from './documentTemplates';
import {
  clearDocumentOutputResult,
  loadDocumentOutputResult,
  saveDocumentPrintPreview,
  type DocumentOutputMode,
} from './print/documentPrintPreviewStorage';
import { useOptionalSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';

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

type ReferralFormState = {
  issuedAt: string;
  templateId: string;
  hospital: string;
  doctor: string;
  purpose: string;
  diagnosis: string;
  body: string;
};

type CertificateFormState = {
  issuedAt: string;
  templateId: string;
  submitTo: string;
  diagnosis: string;
  purpose: string;
  body: string;
};

type ReplyFormState = {
  issuedAt: string;
  templateId: string;
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
  templateId: string;
  templateLabel: string;
  form: DocumentFormState[DocumentType];
  patientId: string;
  outputAudit?: {
    status: 'success' | 'failed' | 'blocked' | 'started';
    mode?: DocumentOutputMode;
    at: string;
    detail?: string;
    runId?: string;
    traceId?: string;
    endpoint?: string;
    httpStatus?: number;
  };
};

const DOCUMENT_HISTORY_STORAGE_KEY = 'opendolphin:web-client:charts:document-history';
const PRINT_HELP_URL = 'https://support.google.com/chrome/answer/1069693?hl=ja';

const DOCUMENT_TYPES: { type: DocumentType; label: string; hint: string }[] = [
  { type: 'referral', label: DOCUMENT_TYPE_LABELS.referral, hint: '宛先・目的・診断名を入力して保存します。' },
  { type: 'certificate', label: DOCUMENT_TYPE_LABELS.certificate, hint: '提出先と診断内容を記録します。' },
  { type: 'reply', label: DOCUMENT_TYPE_LABELS.reply, hint: '紹介元への返信内容を簡潔にまとめます。' },
];

const buildEmptyForms = (today: string): DocumentFormState => ({
  referral: {
    issuedAt: today,
    templateId: '',
    hospital: '',
    doctor: '',
    purpose: '',
    diagnosis: '',
    body: '',
  },
  certificate: {
    issuedAt: today,
    templateId: '',
    submitTo: '',
    diagnosis: '',
    purpose: '',
    body: '',
  },
  reply: {
    issuedAt: today,
    templateId: '',
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
      { key: 'templateId', label: 'テンプレート' },
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
      { key: 'templateId', label: 'テンプレート' },
      { key: 'submitTo', label: '提出先' },
      { key: 'diagnosis', label: '診断名' },
      { key: 'purpose', label: '用途' },
      { key: 'body', label: '所見' },
    ];
  }
  return [
    { key: 'issuedAt', label: '発行日' },
    { key: 'templateId', label: 'テンプレート' },
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

const loadDocumentHistory = (): SavedDocument[] => {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(DOCUMENT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version: number; documents: SavedDocument[] } | null;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1 || !Array.isArray(parsed.documents)) return [];
    return parsed.documents;
  } catch {
    return [];
  }
};

const saveDocumentHistory = (documents: SavedDocument[]) => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      DOCUMENT_HISTORY_STORAGE_KEY,
      JSON.stringify({ version: 1, documents }),
    );
  } catch {
    // ignore
  }
};

export function DocumentCreatePanel({ patientId, meta, onClose }: DocumentCreatePanelProps) {
  const session = useOptionalSession();
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeType, setActiveType] = useState<DocumentType>('referral');
  const [forms, setForms] = useState<DocumentFormState>(() => buildEmptyForms(today));
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>(() => loadDocumentHistory());
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterOutput, setFilterOutput] = useState<'all' | 'available' | 'blocked'>('all');
  const [filterAudit, setFilterAudit] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const observability = useMemo(() => ensureObservabilityMeta({ runId: meta.runId }), [meta.runId]);
  const resolvedRunId = observability.runId ?? meta.runId;
  const hasPermission = useMemo(() => hasStoredAuth(), []);
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

  useEffect(() => {
    saveDocumentHistory(savedDocs);
  }, [savedDocs]);

  useEffect(() => {
    const outputResult = loadDocumentOutputResult();
    if (!outputResult) return;
    clearDocumentOutputResult();
    const outcomeTone = outputResult.outcome === 'success' ? 'success' : 'error';
    const outcomeLabel = outputResult.outcome === 'success' ? '成功' : '失敗';
    setNotice({
      tone: outcomeTone,
      message: `文書出力${outcomeLabel}: ${outputResult.detail ?? outputResult.mode ?? '出力処理'}`,
    });
    setSavedDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== outputResult.documentId) return doc;
        return {
          ...doc,
          outputAudit: {
            status: outputResult.outcome === 'success' ? 'success' : outputResult.outcome === 'blocked' ? 'blocked' : 'failed',
            mode: outputResult.mode,
            at: outputResult.at,
            detail: outputResult.detail,
            runId: outputResult.runId,
            traceId: outputResult.traceId,
            endpoint: outputResult.endpoint,
            httpStatus: outputResult.httpStatus,
          },
        };
      }),
    );
    recordChartsAuditEvent({
      action: 'PRINT_DOCUMENT',
      outcome: outputResult.outcome === 'success' ? 'success' : 'error',
      subject: 'charts-document-output-result',
      note: outputResult.detail,
      runId: outputResult.runId ?? resolvedRunId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      patientId: meta.patientId,
      appointmentId: meta.appointmentId,
      details: {
        operationPhase: 'do',
        documentId: outputResult.documentId,
        outputMode: outputResult.mode,
        endpoint: outputResult.endpoint,
        httpStatus: outputResult.httpStatus,
        outcome: outputResult.outcome,
        traceId: outputResult.traceId,
      },
    });
  }, [
    meta.appointmentId,
    meta.cacheHit,
    meta.dataSourceTransition,
    meta.fallbackUsed,
    meta.missingMaster,
    meta.patientId,
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

  const templateOptions = useMemo(() => DOCUMENT_TEMPLATES[activeType], [activeType]);
  const activeTemplate = useMemo(() => getTemplateById(activeType, forms[activeType].templateId), [activeType, forms]);

  const updateOutputAudit = useCallback((docId: string, audit: SavedDocument['outputAudit']) => {
    setSavedDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, outputAudit: audit ?? doc.outputAudit } : doc)),
    );
  }, []);

  const applyTemplate = () => {
    const template = activeTemplate;
    if (!template) {
      setNotice({ tone: 'error', message: 'テンプレートを選択してください。' });
      return;
    }
    setForms((prev) => {
      const current = prev[activeType];
      const nextValues: Record<string, string> = {};
      Object.entries(template.defaults).forEach(([key, value]) => {
        const currentValue = (current as Record<string, string>)[key];
        if (!currentValue || currentValue.trim().length === 0) {
          nextValues[key] = value;
        }
      });
      return {
        ...prev,
        [activeType]: {
          ...current,
          ...nextValues,
        },
      };
    });
    setNotice({ tone: 'success', message: `テンプレート「${template.label}」を差し込みました。` });
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
    const templateLabel = activeTemplate?.label ?? '未選択';
    setSavedDocs((prev) => [
      {
        id: `doc-${Date.now()}`,
        type: activeType,
        issuedAt,
        title: summary,
        savedAt,
        templateId: forms[activeType].templateId,
        templateLabel,
        form: forms[activeType],
        patientId: patientId ?? '',
      },
      ...prev,
    ]);
    setNotice({
      tone: 'success',
      message: '文書を保存しました。テンプレ/印刷導線を利用できます。',
    });
    setForms((prev) => ({
      ...prev,
      [activeType]: buildEmptyForms(today)[activeType],
    }));

    logDocumentAudit('CHARTS_DOCUMENT_CREATE', 'save', {
      documentTitle: summary,
      documentIssuedAt: issuedAt,
      templateId: forms[activeType].templateId,
    });
  };

  const handleCancel = () => {
    setForms(buildEmptyForms(today));
    setNotice({ tone: 'info', message: '入力を中断しました。' });
    logDocumentAudit('CHARTS_DOCUMENT_CANCEL', 'do', {
      documentTitle: buildDocumentSummary(activeType, forms),
      documentIssuedAt: forms[activeType].issuedAt,
      templateId: forms[activeType].templateId,
    });
    if (onClose) onClose();
  };

  const resolveOutputGuardReasons = useCallback((doc: SavedDocument) => {
    const reasons: Array<{ key: string; summary: string; detail: string }> = [];
    if (meta.missingMaster) {
      reasons.push({
        key: 'missing_master',
        summary: 'missingMaster=true',
        detail: 'マスタ欠損を検知したため出力を停止します。',
      });
    }
    if (meta.fallbackUsed) {
      reasons.push({
        key: 'fallback_used',
        summary: 'fallbackUsed=true',
        detail: 'フォールバック経路のため出力を停止します。',
      });
    }
    if (!doc.patientId) {
      reasons.push({
        key: 'patient_not_selected',
        summary: '患者未選択',
        detail: '患者IDが未確定のため出力できません。',
      });
    }
    if (!doc.templateId) {
      reasons.push({
        key: 'template_missing',
        summary: 'テンプレ未選択',
        detail: 'テンプレートを選択してから出力してください。',
      });
    }
    if (!hasPermission) {
      reasons.push({
        key: 'permission_denied',
        summary: '権限不足/認証不備',
        detail: '認証情報が揃っていないため出力を停止します。',
      });
    }
    return reasons;
  }, [hasPermission, meta.fallbackUsed, meta.missingMaster]);

  const resolveAuditOutcome = useCallback((doc: SavedDocument) => {
    if (!doc.outputAudit) return 'pending';
    if (doc.outputAudit.status === 'success') return 'success';
    if (doc.outputAudit.status === 'blocked') return 'failed';
    if (doc.outputAudit.status === 'failed') return 'failed';
    if (doc.outputAudit.status === 'started') return 'pending';
    return 'pending';
  }, []);

  const filteredDocs = useMemo(() => {
    if (savedDocs.length === 0) return [];
    const keyword = filterText.trim().toLowerCase();
    return savedDocs.filter((doc) => {
      if (filterType !== 'all' && doc.type !== filterType) return false;
      if (keyword) {
        const haystack = [
          doc.title,
          doc.templateLabel,
          doc.issuedAt,
          DOCUMENT_TYPE_LABELS[doc.type],
        ]
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (filterOutput !== 'all') {
        const blocked = resolveOutputGuardReasons(doc).length > 0;
        if (filterOutput === 'available' && blocked) return false;
        if (filterOutput === 'blocked' && !blocked) return false;
      }
      if (filterAudit !== 'all') {
        const outcome = resolveAuditOutcome(doc);
        if (filterAudit === 'success' && outcome !== 'success') return false;
        if (filterAudit === 'failed' && outcome !== 'failed') return false;
        if (filterAudit === 'pending' && outcome !== 'pending') return false;
      }
      return true;
    });
  }, [filterAudit, filterOutput, filterText, filterType, resolveAuditOutcome, resolveOutputGuardReasons, savedDocs]);

  const handleOpenDocumentPreview = (doc: SavedDocument, initialOutputMode?: DocumentOutputMode) => {
    const { actor, facilityId } = resolveAuditActor();
    const blockedReasons = resolveOutputGuardReasons(doc);
    if (blockedReasons.length > 0) {
      setNotice({ tone: 'error', message: `出力できません: ${blockedReasons[0].detail}` });
      updateOutputAudit(doc.id, {
        status: 'blocked',
        mode: initialOutputMode,
        at: new Date().toISOString(),
        detail: blockedReasons[0].detail,
        runId: resolvedRunId,
      });
      recordChartsAuditEvent({
        action: 'PRINT_DOCUMENT',
        outcome: 'blocked',
        subject: 'charts-document-preview',
        note: blockedReasons[0].detail,
        patientId: doc.patientId,
        actor,
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        details: {
          operationPhase: 'lock',
          blockedReasons: blockedReasons.map((reason) => reason.key),
          documentType: doc.type,
          documentTitle: doc.title,
          documentIssuedAt: doc.issuedAt,
          templateId: doc.templateId,
          documentId: doc.id,
        },
      });
      return;
    }

    const outputLabel =
      initialOutputMode === 'print' ? '印刷' : initialOutputMode === 'pdf' ? 'PDF出力' : 'プレビュー';
    const detail = `文書${outputLabel}プレビューを開きました (actor=${actor})`;
    setNotice({ tone: 'success', message: `文書${outputLabel}プレビューを開きました。` });
    updateOutputAudit(doc.id, {
      status: 'started',
      mode: initialOutputMode,
      at: new Date().toISOString(),
      detail,
      runId: resolvedRunId,
    });
    recordChartsAuditEvent({
      action: 'PRINT_DOCUMENT',
      outcome: 'started',
      subject: 'charts-document-preview',
      note: detail,
      actor,
      patientId: doc.patientId,
      runId: resolvedRunId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      details: {
        operationPhase: 'do',
        documentType: doc.type,
        documentTitle: doc.title,
        documentIssuedAt: doc.issuedAt,
        templateId: doc.templateId,
        documentId: doc.id,
        endpoint: '/charts/print/document',
      },
    });

    const previewState = {
      document: { ...doc, form: doc.form as Record<string, string> },
      meta: {
        runId: resolvedRunId ?? meta.runId ?? '',
        cacheHit: meta.cacheHit ?? false,
        missingMaster: meta.missingMaster ?? false,
        fallbackUsed: meta.fallbackUsed ?? false,
        dataSourceTransition: meta.dataSourceTransition ?? 'snapshot',
      },
      actor,
      facilityId,
      initialOutputMode,
    };
    navigate(buildFacilityPath(session?.facilityId, '/charts/print/document'), { state: previewState });
    saveDocumentPrintPreview(previewState);
  };

  if (!patientId) {
    return <p className="charts-side-panel__empty">患者IDが未選択のため文書作成を開始できません。</p>;
  }

  return (
    <section className="charts-side-panel__section" data-test-id="document-create-panel">
      <header className="charts-side-panel__section-header">
        <div>
          <h4>文書作成メニュー</h4>
          <p>文書別テンプレを差し込み、保存後に印刷/プレビューできます。</p>
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
        <div className="charts-side-panel__field">
          <label htmlFor="document-template">テンプレート *</label>
          <select
            id="document-template"
            value={forms[activeType].templateId}
            onChange={(event) => {
              const templateId = event.target.value;
              const template = getTemplateById(activeType, templateId);
              updateForm(activeType, { templateId });
              logUiState({
                action: 'scenario_change',
                screen: 'charts/document-create',
                controlId: 'document-template',
                runId: resolvedRunId,
                cacheHit: meta.cacheHit,
                missingMaster: meta.missingMaster,
                fallbackUsed: meta.fallbackUsed,
                dataSourceTransition: meta.dataSourceTransition,
                details: {
                  documentType: activeType,
                  templateId,
                  templateLabel: template?.label ?? '未選択',
                },
              });
            }}
            disabled={isBlocked}
          >
            <option value="">テンプレートを選択</option>
            {templateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
          <p className="charts-side-panel__help">
            {activeTemplate?.description ?? '選択したテンプレの説明がここに表示されます。'}
          </p>
          <div className="charts-side-panel__template-actions">
            <button type="button" onClick={applyTemplate} disabled={isBlocked || !forms[activeType].templateId}>
              テンプレ挿入
            </button>
          </div>
        </div>
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
      <div className="charts-document-list" aria-live={resolveAriaLive('info')}>
        <div className="charts-document-list__header">
          <strong>保存済み文書</strong>
          <span>
            {filteredDocs.length}/{savedDocs.length} 件
          </span>
        </div>
        {savedDocs.length === 0 ? (
          <p className="charts-side-panel__empty">保存履歴はまだありません。</p>
        ) : (
          <>
            <div className="charts-document-list__filters" role="group" aria-label="文書履歴の検索フィルタ">
              <input
                type="search"
                placeholder="検索（タイトル/テンプレ/発行日）"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                aria-label="文書履歴の検索"
              />
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value as DocumentType | 'all')}
                aria-label="文書種別フィルタ"
              >
                <option value="all">すべての文書</option>
                {DOCUMENT_TYPES.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={filterOutput}
                onChange={(event) => setFilterOutput(event.target.value as 'all' | 'available' | 'blocked')}
                aria-label="出力可否フィルタ"
              >
                <option value="all">出力可否: すべて</option>
                <option value="available">出力可能のみ</option>
                <option value="blocked">出力停止のみ</option>
              </select>
              <select
                value={filterAudit}
                onChange={(event) => setFilterAudit(event.target.value as 'all' | 'success' | 'failed' | 'pending')}
                aria-label="監査結果フィルタ"
              >
                <option value="all">監査結果: すべて</option>
                <option value="success">監査結果: 成功</option>
                <option value="failed">監査結果: 失敗</option>
                <option value="pending">監査結果: 処理中/未実行</option>
              </select>
              {(filterText.trim().length > 0 ||
                filterType !== 'all' ||
                filterOutput !== 'all' ||
                filterAudit !== 'all') && (
                <button
                  type="button"
                  className="charts-document-list__clear"
                  onClick={() => {
                    setFilterText('');
                    setFilterType('all');
                    setFilterOutput('all');
                    setFilterAudit('all');
                  }}
                >
                  フィルタをクリア
                </button>
              )}
            </div>
            {filteredDocs.length === 0 ? (
              <p className="charts-side-panel__empty">検索条件に該当する文書がありません。</p>
            ) : (
              <ul className="charts-document-list__items">
                {filteredDocs.map((doc) => (
              <li key={doc.id}>
                {(() => {
                  const guards = resolveOutputGuardReasons(doc);
                  const auditOutcome = resolveAuditOutcome(doc);
                  const outputStatusLabel =
                    doc.outputAudit?.status === 'success'
                      ? '成功'
                      : doc.outputAudit?.status === 'failed' || doc.outputAudit?.status === 'blocked'
                        ? '失敗'
                        : doc.outputAudit?.status === 'started'
                          ? '処理中'
                          : '未実行';
                  const lastMode = doc.outputAudit?.mode ?? 'print';
                  return (
                    <>
                      <div className="charts-document-list__row">
                        <strong>{DOCUMENT_TYPE_LABELS[doc.type] ?? '文書'}</strong>
                        <span>{doc.title}</span>
                      </div>
                      <div className="charts-document-list__meta">
                        <small>
                          発行日: {doc.issuedAt} / テンプレ: {doc.templateLabel} / 保存: {new Date(doc.savedAt).toLocaleString()}
                        </small>
                        <span className={`charts-document-list__status charts-document-list__status--${auditOutcome}`}>
                          監査結果: {outputStatusLabel}
                        </span>
                      </div>
                      <div className="charts-document-list__actions" role="group" aria-label="文書出力操作">
                        <button type="button" onClick={() => handleOpenDocumentPreview(doc)} disabled={guards.length > 0}>
                          プレビュー
                        </button>
                        <button type="button" onClick={() => handleOpenDocumentPreview(doc, 'print')} disabled={guards.length > 0}>
                          印刷
                        </button>
                        <button type="button" onClick={() => handleOpenDocumentPreview(doc, 'pdf')} disabled={guards.length > 0}>
                          PDF出力
                        </button>
                      </div>
                      {guards.length > 0 && <div className="charts-document-list__guard">出力停止: {guards[0]?.summary}</div>}
                      {auditOutcome === 'failed' && (
                        <div className="charts-document-list__recovery" role="group" aria-label="出力失敗時の復旧導線">
                          <button type="button" onClick={() => handleOpenDocumentPreview(doc, lastMode)}>
                            再試行
                          </button>
                          <button type="button" onClick={() => handleOpenDocumentPreview(doc, 'print')}>
                            再出力（印刷）
                          </button>
                          <button type="button" onClick={() => navigate(buildFacilityPath(session?.facilityId, '/reception'))}>
                            再取得（Reception）
                          </button>
                          <a href={PRINT_HELP_URL} target="_blank" rel="noreferrer">
                            印刷ヘルプ
                          </a>
                        </div>
                      )}
                    </>
                  );
                })()}
              </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
