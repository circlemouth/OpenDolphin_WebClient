import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logUiState } from '../../libs/audit/auditLogger';
import { readStoredAuth, resolveAuditActor } from '../../libs/auth/storedAuth';
import { hasStoredAuth } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import {
  buildAttachmentReferencePayload,
  sendKarteDocumentWithAttachments,
  IMAGE_ATTACHMENT_MAX_SIZE_BYTES,
  type KarteAttachmentReference,
} from '../images/api';
import type { StorageScope } from '../../libs/session/storageScope';
import { recordChartsAuditEvent, type ChartsOperationPhase } from './audit';
import type { DataSourceTransition } from './authService';
import {
  DOCUMENT_TEMPLATES,
  DOCUMENT_TYPE_LABELS,
  getTemplateById,
  type DocumentType,
} from './documentTemplates';
import {
  clearDocumentOutputResult,
  loadDocumentOutputResult,
  saveDocumentPrintPreview,
  type DocumentOutputMode,
} from './print/documentPrintPreviewStorage';
import { useOptionalSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { fetchUserProfile } from './stampApi';
import {
  deleteLetter,
  fetchKarteIdByPatientId,
  fetchLetterDetail,
  fetchLetterList,
  saveLetterModule,
  type LetterItemPayload,
  type LetterModulePayload,
  type LetterTextPayload,
} from './letterApi';

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

export type DocumentOpenIntent = 'edit' | 'preview' | DocumentOutputMode;

export type DocumentOpenRequest = {
  requestId?: string;
  intent?: DocumentOpenIntent;
  documentId?: number;
  letterId?: number;
  query?: string;
  source?: string;
};

export type DocumentCreatePanelProps = {
  patientId?: string;
  meta: DocumentCreatePanelMeta;
  onClose?: () => void;
  imageAttachments?: KarteAttachmentReference[];
  onImageAttachmentsChange?: (next: KarteAttachmentReference[]) => void;
  onImageAttachmentsClear?: () => void;
  openRequest?: DocumentOpenRequest | null;
};

type ReferralFormState = {
  issuedAt: string;
  templateId: string;
  hospital: string;
  department: string;
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
  department: string;
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
  letterId?: number;
  type: DocumentType;
  issuedAt: string;
  title: string;
  savedAt: string;
  templateId: string;
  templateLabel: string;
  form: DocumentFormState[DocumentType];
  patientId: string;
  documentId?: number;
  attachmentIds?: number[];
  detailLoaded?: boolean;
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

const PRINT_HELP_URL = 'https://support.google.com/chrome/answer/1069693?hl=ja';
const LETTER_ITEM_TEMPLATE_ID = 'webTemplateId';
const LETTER_ITEM_TEMPLATE_LABEL = 'webTemplateLabel';
const LETTER_ITEM_DOCUMENT_ID = 'webDocumentId';
const LETTER_ITEM_ATTACHMENT_IDS = 'webAttachmentIds';
const LETTER_ITEM_SUBMIT_TO = 'webSubmitTo';
const LETTER_ITEM_PURPOSE = 'purpose';
const LETTER_ITEM_DISEASE = 'disease';
const LETTER_ITEM_VISITED_DATE = 'visitedDate';
const LETTER_ITEM_VISITED = 'visited';
const LETTER_TEXT_PAST_FAMILY = 'pastFamily';
const LETTER_TEXT_CLINICAL_COURSE = 'clinicalCourse';
const LETTER_TEXT_MEDICATION = 'medication';
const LETTER_TEXT_INFORMED_CONTENT = 'informedContent';
const HANDLE_CLASS_REFERRAL = 'open.dolphin.letter.LetterViewer';
const HANDLE_CLASS_REPLY1 = 'open.dolphin.letter.Reply1Viewer';
const HANDLE_CLASS_REPLY2 = 'open.dolphin.letter.Reply2Viewer';
const HANDLE_CLASS_CERTIFICATE = 'open.dolphin.letter.MedicalCertificateViewer';
const LETTER_TYPE_REFERRAL = 'client';
const LETTER_TYPE_REPLY = 'consultant';
const LETTER_TYPE_CERTIFICATE = 'medicalCertificate';

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
    department: '',
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
    department: '',
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

const resolveIsoDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const toIsoDateTime = (value?: string): string => {
  if (value) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
};

const buildItemMap = (items?: LetterItemPayload[] | null): Map<string, string> => {
  const map = new Map<string, string>();
  if (!items) return map;
  items.forEach((item) => {
    if (!item?.name) return;
    map.set(item.name, item.value ?? '');
  });
  return map;
};

const buildTextMap = (texts?: LetterTextPayload[] | null): Map<string, string> => {
  const map = new Map<string, string>();
  if (!texts) return map;
  texts.forEach((text) => {
    if (!text?.name) return;
    map.set(text.name, text.textValue ?? '');
  });
  return map;
};

const parseAttachmentIds = (raw?: string): number[] | undefined => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    }
  } catch {
    // ignore parse error
  }
  const fallback = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  return fallback.length > 0 ? fallback : undefined;
};

const resolveDocumentType = (letterType?: string): DocumentType => {
  if (letterType === LETTER_TYPE_CERTIFICATE) return 'certificate';
  if (letterType === LETTER_TYPE_REPLY) return 'reply';
  return 'referral';
};

const resolveTemplateMeta = (type: DocumentType, templateId: string, fallbackLabel?: string) => {
  const template = getTemplateById(type, templateId);
  return {
    templateId,
    templateLabel: template?.label ?? fallbackLabel ?? '未選択',
  };
};

const normalizeUserName = (facilityId?: string | null, userId?: string | null) => {
  if (!facilityId || !userId) return null;
  const prefix = `${facilityId}:`;
  return userId.startsWith(prefix) ? userId : `${facilityId}:${userId}`;
};

const mapLetterToDocument = (letter: LetterModulePayload, fallbackIssuedAt: string): SavedDocument => {
  const type = resolveDocumentType(letter.letterType);
  const itemMap = buildItemMap(letter.letterItems);
  const textMap = buildTextMap(letter.letterTexts);
  const issuedAt =
    resolveIsoDate(letter.started) ??
    resolveIsoDate(letter.confirmed) ??
    resolveIsoDate(letter.recorded) ??
    fallbackIssuedAt;
  const templateId =
    itemMap.get(LETTER_ITEM_TEMPLATE_ID) ??
    itemMap.get('templateId') ??
    '';
  const templateLabelFallback =
    itemMap.get(LETTER_ITEM_TEMPLATE_LABEL) ??
    itemMap.get('templateLabel') ??
    undefined;
  const { templateLabel } = resolveTemplateMeta(type, templateId, templateLabelFallback);
  const form: DocumentFormState[DocumentType] =
    type === 'referral'
      ? {
          issuedAt,
          templateId,
          hospital: letter.consultantHospital ?? '',
          department: letter.consultantDept ?? '',
          doctor: letter.consultantDoctor ?? '',
          purpose: itemMap.get(LETTER_ITEM_PURPOSE) ?? '',
          diagnosis: itemMap.get(LETTER_ITEM_DISEASE) ?? '',
          body:
            textMap.get(LETTER_TEXT_CLINICAL_COURSE) ??
            textMap.get(LETTER_TEXT_PAST_FAMILY) ??
            textMap.get(LETTER_TEXT_MEDICATION) ??
            '',
        }
      : type === 'certificate'
        ? {
            issuedAt,
            templateId,
            submitTo: itemMap.get(LETTER_ITEM_SUBMIT_TO) ?? '',
            diagnosis: itemMap.get(LETTER_ITEM_DISEASE) ?? '',
            purpose: itemMap.get(LETTER_ITEM_PURPOSE) ?? '',
            body: textMap.get(LETTER_TEXT_INFORMED_CONTENT) ?? '',
          }
        : {
            issuedAt,
            templateId,
            hospital: letter.clientHospital ?? '',
            department: letter.clientDept ?? '',
            doctor: letter.clientDoctor ?? '',
            summary: textMap.get(LETTER_TEXT_INFORMED_CONTENT) ?? '',
          };
  const title = letter.title ?? buildDocumentSummary(type, { ...buildEmptyForms(issuedAt), [type]: form } as DocumentFormState);
  const savedAt = letter.recorded ?? letter.confirmed ?? letter.started ?? new Date().toISOString();
  const documentIdRaw = itemMap.get(LETTER_ITEM_DOCUMENT_ID);
  const attachmentIds = parseAttachmentIds(itemMap.get(LETTER_ITEM_ATTACHMENT_IDS));
  const documentId = documentIdRaw ? Number(documentIdRaw) : undefined;
  return {
    id: `letter-${letter.id ?? letter.linkId ?? Date.now()}`,
    letterId: letter.id,
    type,
    issuedAt,
    title,
    savedAt,
    templateId,
    templateLabel,
    form,
    patientId: letter.patientId ?? '',
    documentId: Number.isFinite(documentId ?? NaN) ? documentId : undefined,
    attachmentIds,
    detailLoaded: Boolean(letter.letterItems || letter.letterTexts || letter.letterDates),
  };
};

const buildLetterModulePayload = (params: {
  type: DocumentType;
  form: DocumentFormState[DocumentType];
  issuedAt: string;
  patientId: string;
  userPk: number;
  userName?: string | null;
  karteId: number;
  templateLabel: string;
  documentId?: number;
  attachmentIds?: number[];
  linkId?: number;
}): LetterModulePayload => {
  const items: LetterItemPayload[] = [];
  const texts: LetterTextPayload[] = [];

  const pushItem = (name: string, value?: string | number | null) => {
    if (value === undefined || value === null) return;
    items.push({ name, value: String(value) });
  };
  const pushText = (name: string, value?: string | null) => {
    if (value === undefined || value === null) return;
    texts.push({ name, textValue: String(value) });
  };

  pushItem(LETTER_ITEM_TEMPLATE_ID, params.form.templateId);
  pushItem(LETTER_ITEM_TEMPLATE_LABEL, params.templateLabel);
  if (params.documentId !== undefined) {
    pushItem(LETTER_ITEM_DOCUMENT_ID, params.documentId);
  }
  if (params.attachmentIds && params.attachmentIds.length > 0) {
    pushItem(LETTER_ITEM_ATTACHMENT_IDS, JSON.stringify(params.attachmentIds));
  }

  let letterType = LETTER_TYPE_REFERRAL;
  let handleClass = HANDLE_CLASS_REFERRAL;
  let consultantHospital: string | undefined;
  let consultantDept: string | undefined;
  let consultantDoctor: string | undefined;
  let clientHospital: string | undefined;
  let clientDept: string | undefined;
  let clientDoctor: string | undefined;

  if (params.type === 'referral') {
    letterType = LETTER_TYPE_REFERRAL;
    handleClass = HANDLE_CLASS_REFERRAL;
    consultantHospital = params.form.hospital;
    consultantDept = params.form.department;
    consultantDoctor = params.form.doctor;
    pushItem(LETTER_ITEM_PURPOSE, params.form.purpose);
    pushItem(LETTER_ITEM_DISEASE, params.form.diagnosis);
    pushText(LETTER_TEXT_CLINICAL_COURSE, params.form.body);
  } else if (params.type === 'certificate') {
    letterType = LETTER_TYPE_CERTIFICATE;
    handleClass = HANDLE_CLASS_CERTIFICATE;
    pushItem(LETTER_ITEM_SUBMIT_TO, params.form.submitTo);
    pushItem(LETTER_ITEM_DISEASE, params.form.diagnosis);
    pushItem(LETTER_ITEM_PURPOSE, params.form.purpose);
    pushText(LETTER_TEXT_INFORMED_CONTENT, params.form.body);
  } else {
    letterType = LETTER_TYPE_REPLY;
    handleClass = params.form.templateId === 'REPLY-ODT-FU' ? HANDLE_CLASS_REPLY1 : HANDLE_CLASS_REPLY2;
    clientHospital = params.form.hospital;
    clientDept = params.form.department;
    clientDoctor = params.form.doctor;
    pushText(LETTER_TEXT_INFORMED_CONTENT, params.form.summary);
    const visitedName = params.form.templateId === 'REPLY-ODT-FU' ? LETTER_ITEM_VISITED_DATE : LETTER_ITEM_VISITED;
    pushItem(visitedName, params.issuedAt);
  }

  const issuedAtIso = toIsoDateTime(params.issuedAt);
  const payload: LetterModulePayload = {
    id: params.linkId ? 0 : undefined,
    linkId: params.linkId ?? 0,
    confirmed: issuedAtIso,
    started: issuedAtIso,
    recorded: issuedAtIso,
    status: 'F',
    title: buildDocumentSummary(params.type, { ...buildEmptyForms(params.issuedAt), [params.type]: params.form } as DocumentFormState),
    letterType,
    handleClass,
    clientHospital,
    clientDept,
    clientDoctor,
    consultantHospital,
    consultantDept,
    consultantDoctor,
    patientId: params.patientId,
    userModel: {
      id: params.userPk,
      userId: params.userName ?? undefined,
    },
    karteBean: {
      id: params.karteId,
    },
    letterItems: items,
    letterTexts: texts,
  };

  return payload;
};

export function DocumentCreatePanel({
  patientId,
  meta,
  onClose,
  imageAttachments,
  onImageAttachmentsChange,
  onImageAttachmentsClear,
  openRequest,
}: DocumentCreatePanelProps) {
  const session = useOptionalSession();
  const storageScope = useMemo<StorageScope | undefined>(() => {
    if (session?.facilityId && session?.userId) {
      return { facilityId: session.facilityId, userId: session.userId };
    }
    const stored = readStoredAuth();
    if (stored) return { facilityId: stored.facilityId, userId: stored.userId };
    return undefined;
  }, [session?.facilityId, session?.userId]);
  const userName = useMemo(() => {
    const sessionName = normalizeUserName(session?.facilityId, session?.userId);
    if (sessionName) return sessionName;
    const stored = readStoredAuth();
    return stored ? normalizeUserName(stored.facilityId, stored.userId) : null;
  }, [session?.facilityId, session?.userId]);
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeType, setActiveType] = useState<DocumentType>('referral');
  const [forms, setForms] = useState<DocumentFormState>(() => buildEmptyForms(today));
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveRetryable, setSaveRetryable] = useState(false);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [karteId, setKarteId] = useState<number | null>(null);
  const [userPk, setUserPk] = useState<number | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterOutput, setFilterOutput] = useState<'all' | 'available' | 'blocked'>('all');
  const [filterAudit, setFilterAudit] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [filterPatient, setFilterPatient] = useState<'current' | 'all'>('current');
  const lastOpenRequestRef = useRef<string | null>(null);
  const observability = useMemo(() => ensureObservabilityMeta({ runId: meta.runId }), [meta.runId]);
  const resolvedRunId = observability.runId ?? meta.runId;
  const hasPermission = useMemo(() => hasStoredAuth(), []);
  const attachmentsForDocument = useMemo(() => imageAttachments ?? [], [imageAttachments]);
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
  // 再送は「添付付き保存がサーバーエラーになった場合のみ」有効にする。
  const canRetrySave = saveRetryable && !isBlocked && !isSaving;
  const noticeLive = notice
    ? resolveAriaLive(notice.tone === 'info' ? 'info' : notice.tone === 'error' ? 'error' : 'success')
    : resolveAriaLive('info');
  const noticeRole = notice?.tone === 'error' ? 'alert' : 'status';

  const handleRemoveAttachment = useCallback(
    (attachmentId: number) => {
      if (!onImageAttachmentsChange) return;
      onImageAttachmentsChange(attachmentsForDocument.filter((attachment) => attachment.id !== attachmentId));
    },
    [attachmentsForDocument, onImageAttachmentsChange],
  );

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
    let active = true;
    if (!userName) {
      setUserPk(null);
      return;
    }
    fetchUserProfile(userName).then((result) => {
      if (!active) return;
      setUserPk(result.ok ? result.id ?? null : null);
    });
    return () => {
      active = false;
    };
  }, [userName]);

  useEffect(() => {
    let active = true;
    if (!patientId) {
      setKarteId(null);
      return;
    }
    fetchKarteIdByPatientId({ patientId }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setKarteId(null);
        setHistoryError(result.error ?? 'カルテ情報の取得に失敗しました。');
        return;
      }
      setKarteId(result.karteId ?? null);
    });
    return () => {
      active = false;
    };
  }, [patientId]);

  useEffect(() => {
    const outputResult = loadDocumentOutputResult(storageScope);
    if (!outputResult) return;
    clearDocumentOutputResult(storageScope);
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

  const refreshDocumentHistory = useCallback(async () => {
    if (!karteId) {
      setSavedDocs([]);
      setHistoryLoaded(true);
      return;
    }
    setIsHistoryLoading(true);
    setHistoryLoaded(false);
    setHistoryError(null);
    const listResult = await fetchLetterList({ karteId });
    if (!listResult.ok) {
      setHistoryError(listResult.error ?? `文書履歴の取得に失敗しました (HTTP ${listResult.status})`);
      setIsHistoryLoading(false);
      setHistoryLoaded(true);
      return;
    }

    const summaryDocs = listResult.letters.map((letter) => mapLetterToDocument(letter, today));
    const detailedDocs = await Promise.all(
      summaryDocs.map(async (doc) => {
        if (!doc.letterId) return doc;
        const detail = await fetchLetterDetail({ letterId: doc.letterId });
        if (!detail.ok || !detail.letter) return doc;
        return mapLetterToDocument(detail.letter, doc.issuedAt || today);
      }),
    );

    setSavedDocs((prev) => {
      const prevMap = new Map(prev.map((doc) => [doc.id, doc]));
      return detailedDocs.map((doc) => {
        const existing = prevMap.get(doc.id);
        if (!existing) return doc;
        const useExistingForm = !doc.detailLoaded && Boolean(existing.detailLoaded);
        return {
          ...doc,
          form: useExistingForm ? existing.form : doc.form,
          detailLoaded: doc.detailLoaded || existing.detailLoaded,
          documentId: doc.documentId ?? existing.documentId,
          attachmentIds: doc.attachmentIds ?? existing.attachmentIds,
          outputAudit: doc.outputAudit ?? existing.outputAudit,
        };
      });
    });
    setIsHistoryLoading(false);
    setHistoryLoaded(true);
  }, [karteId, today]);

  useEffect(() => {
    refreshDocumentHistory();
  }, [refreshDocumentHistory]);

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
  const editingDoc = useMemo(
    () => savedDocs.find((doc) => doc.id === editingDocId) ?? null,
    [editingDocId, savedDocs],
  );

  useEffect(() => {
    if (editingDocId && !editingDoc) {
      setEditingDocId(null);
    }
  }, [editingDoc, editingDocId]);

  const upsertSavedDocument = useCallback((doc: SavedDocument) => {
    setSavedDocs((prev) => {
      const existing = prev.find((item) => item.id === doc.id);
      if (!existing) return [...prev, doc];
      return prev.map((item) =>
        item.id === doc.id
          ? {
              ...doc,
              outputAudit: doc.outputAudit ?? existing.outputAudit,
              attachmentIds: doc.attachmentIds ?? existing.attachmentIds,
              detailLoaded: doc.detailLoaded || existing.detailLoaded,
            }
          : item,
      );
    });
  }, []);

  const updateOutputAudit = useCallback((docId: string, audit: SavedDocument['outputAudit']) => {
    setSavedDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, outputAudit: audit ?? doc.outputAudit } : doc)),
    );
  }, []);

  const ensureDocumentDetail = useCallback(
    async (doc: SavedDocument) => {
      if (doc.detailLoaded || !doc.letterId) return doc;
      const detail = await fetchLetterDetail({ letterId: doc.letterId });
      if (!detail.ok || !detail.letter) return doc;
      const mapped = mapLetterToDocument(detail.letter, doc.issuedAt || today);
      setSavedDocs((prev) =>
        prev.map((item) => (item.id === doc.id ? { ...mapped, outputAudit: item.outputAudit ?? mapped.outputAudit } : item)),
      );
      return mapped;
    },
    [today],
  );

  const handleReuseDocument = useCallback(
    async (doc: SavedDocument) => {
      if (doc.patientId !== patientId) {
        setNotice({ tone: 'error', message: '患者が一致しないため文書を再適用できません。' });
        recordChartsAuditEvent({
          action: 'document_template_reuse',
          outcome: 'blocked',
          subject: 'charts-document-history',
          runId: resolvedRunId,
          cacheHit: meta.cacheHit,
          missingMaster: meta.missingMaster,
          fallbackUsed: meta.fallbackUsed,
          dataSourceTransition: meta.dataSourceTransition,
          patientId: patientId,
          appointmentId: meta.appointmentId,
          details: {
            operationPhase: 'do',
            documentId: doc.id,
            documentType: doc.type,
            documentTitle: doc.title,
            documentIssuedAt: doc.issuedAt,
            templateId: doc.templateId,
            inputSource: 'history_copy',
            blockedReasons: ['patient_mismatch'],
          },
        });
        return;
      }
      const resolvedDoc = await ensureDocumentDetail(doc);
      setActiveType(resolvedDoc.type);
      setForms((prev) => ({
        ...prev,
        [resolvedDoc.type]: {
          ...resolvedDoc.form,
          templateId: resolvedDoc.templateId,
          issuedAt: resolvedDoc.issuedAt,
        },
      }));
      setEditingDocId(null);
      setNotice({ tone: 'success', message: '履歴からコピーして編集フォームに反映しました。' });
      recordChartsAuditEvent({
        action: 'document_template_reuse',
        outcome: 'success',
        subject: 'charts-document-history',
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        patientId: patientId,
        appointmentId: meta.appointmentId,
        details: {
          operationPhase: 'do',
          documentId: resolvedDoc.id,
          documentType: resolvedDoc.type,
          documentTitle: resolvedDoc.title,
          documentIssuedAt: resolvedDoc.issuedAt,
          templateId: resolvedDoc.templateId,
          inputSource: 'history_copy',
        },
      });
    },
    [
      ensureDocumentDetail,
      meta.appointmentId,
      meta.cacheHit,
      meta.dataSourceTransition,
      meta.fallbackUsed,
      meta.missingMaster,
      patientId,
      resolvedRunId,
    ],
  );

  const handleEditDocument = useCallback(
    async (doc: SavedDocument) => {
      if (doc.patientId !== patientId) {
        setNotice({ tone: 'error', message: '患者が一致しないため文書を編集できません。' });
        return;
      }
      const resolvedDoc = await ensureDocumentDetail(doc);
      if (!resolvedDoc.letterId) {
        setNotice({ tone: 'error', message: '文書IDが取得できないため編集を開始できません。' });
        return;
      }
      setActiveType(resolvedDoc.type);
      setForms((prev) => ({
        ...prev,
        [resolvedDoc.type]: {
          ...resolvedDoc.form,
          templateId: resolvedDoc.templateId,
          issuedAt: resolvedDoc.issuedAt,
        },
      }));
      setEditingDocId(resolvedDoc.id);
      setNotice({ tone: 'info', message: '文書を編集モードで読み込みました。' });
    },
    [ensureDocumentDetail, patientId],
  );

  const handleDeleteDocument = useCallback(
    async (doc: SavedDocument) => {
      if (!doc.letterId) {
        setNotice({ tone: 'error', message: '文書IDが取得できないため削除できません。' });
        return;
      }
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(`「${doc.title}」を削除しますか？`)
        : true;
      if (!confirmed) return;
      const result = await deleteLetter({ letterId: doc.letterId });
      if (!result.ok) {
        setNotice({
          tone: 'error',
          message: `文書削除に失敗しました: ${result.error ?? `HTTP ${result.status}`}`,
        });
        return;
      }
      setNotice({ tone: 'success', message: '文書を削除しました。' });
      await refreshDocumentHistory();
    },
    [refreshDocumentHistory],
  );

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

  const handleSave = async () => {
    if (!patientId) {
      setNotice({ tone: 'error', message: '患者IDが未選択のため文書を保存できません。' });
      setSaveRetryable(false);
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
      setSaveRetryable(false);
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
      setSaveRetryable(false);
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
    const templateLabel = activeTemplate?.label ?? '未選択';
    if (!userPk) {
      setNotice({ tone: 'error', message: 'ユーザー情報が取得できないため文書を保存できません。' });
      setSaveRetryable(false);
      return;
    }
    if (!karteId) {
      setNotice({ tone: 'error', message: 'カルテ情報が取得できないため文書を保存できません。' });
      setSaveRetryable(false);
      return;
    }
    const oversized = attachmentsForDocument.filter(
      (attachment) =>
        typeof attachment.contentSize === 'number' && attachment.contentSize > IMAGE_ATTACHMENT_MAX_SIZE_BYTES,
    );
    if (oversized.length > 0) {
      setNotice({
        tone: 'error',
        message: `添付サイズ超過のため保存できません: ${oversized.map((item) => item.fileName ?? item.id).join('、')}`,
      });
      setSaveRetryable(false);
      oversized.forEach((attachment) => {
        recordChartsAuditEvent({
          action: 'chart_image_attach',
          outcome: 'blocked',
          subject: 'charts-document-attachment',
          runId: resolvedRunId,
          cacheHit: meta.cacheHit,
          missingMaster: meta.missingMaster,
          fallbackUsed: meta.fallbackUsed,
          dataSourceTransition: meta.dataSourceTransition,
          patientId,
          appointmentId: meta.appointmentId,
          details: {
            operationPhase: 'save',
            documentType: activeType,
            documentTitle: summary,
            documentIssuedAt: issuedAt,
            attachmentId: attachment.id,
            blockedReasons: ['attachment_size_exceeded'],
          },
        });
      });
      recordChartsAuditEvent({
        action: 'CHARTS_DOCUMENT_CREATE',
        outcome: 'blocked',
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        subject: 'charts',
        patientId,
        appointmentId: meta.appointmentId,
        details: {
          operationPhase: 'save',
          documentType: activeType,
          blockedReasons: ['attachment_size_exceeded'],
          attachmentIds: oversized.map((item) => item.id),
        },
      });
      return;
    }

    const hasAttachments = attachmentsForDocument.length > 0;
    let documentId: number | undefined;
    let documentEndpoint: string | undefined;
    let documentStatus: number | undefined;
    let documentError: string | undefined;
    let documentDurationMs: number | undefined;
    setIsSaving(true);
    setNotice({ tone: 'info', message: '文書を保存しています。' });
    setSaveRetryable(false);
    if (hasAttachments) {
      const payload = buildAttachmentReferencePayload({
        attachments: attachmentsForDocument,
        patientId,
        title: summary,
        documentType: activeType,
      });
      const startedAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const result = await sendKarteDocumentWithAttachments(payload, { method: 'POST', validate: true });
      const finishedAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      documentDurationMs = Math.max(0, finishedAt - startedAt);
      documentEndpoint = result.endpoint;
      documentStatus = result.status;
      documentError = result.error;
      documentId = typeof result.payload?.docPk === 'number' ? (result.payload?.docPk as number) : undefined;
      if (!result.ok) {
        setIsSaving(false);
        setNotice({
          tone: 'error',
          message: `文書保存に失敗しました: ${result.error ?? `HTTP ${result.status}`}`,
        });
        setSaveRetryable(true);
        attachmentsForDocument.forEach((attachment) => {
          recordChartsAuditEvent({
            action: 'chart_image_attach',
            outcome: 'error',
            subject: 'charts-document-attachment',
            runId: resolvedRunId,
            cacheHit: meta.cacheHit,
            missingMaster: meta.missingMaster,
            fallbackUsed: meta.fallbackUsed,
            dataSourceTransition: meta.dataSourceTransition,
            patientId,
            appointmentId: meta.appointmentId,
            details: {
              operationPhase: 'save',
              documentType: activeType,
              documentTitle: summary,
              documentIssuedAt: issuedAt,
              documentId,
              attachmentId: attachment.id,
              endpoint: result.endpoint,
              httpStatus: result.status,
              error: result.error,
            },
          });
        });
        return;
      }
    }

    if (editingDocId && !editingDoc?.letterId) {
      setIsSaving(false);
      setNotice({ tone: 'error', message: '編集中の文書IDが取得できないため更新できません。' });
      return;
    }

    const letterPayload = buildLetterModulePayload({
      type: activeType,
      form: forms[activeType],
      issuedAt,
      patientId,
      userPk,
      userName,
      karteId,
      templateLabel,
      documentId,
      attachmentIds: attachmentsForDocument.map((attachment) => attachment.id),
      linkId: editingDoc?.letterId,
    });
    const letterResult = await saveLetterModule({ payload: letterPayload });
    setIsSaving(false);
    if (!letterResult.ok) {
      setNotice({
        tone: 'error',
        message: `文書保存に失敗しました: ${letterResult.error ?? `HTTP ${letterResult.status}`}`,
      });
      return;
    }

    await refreshDocumentHistory();
    setNotice({
      tone: 'success',
      message: hasAttachments
        ? `文書を${editingDoc ? '更新' : '保存'}しました。添付 ${attachmentsForDocument.length} 件を送信しました。`
        : `文書を${editingDoc ? '更新' : '保存'}しました。テンプレ/印刷導線を利用できます。`,
    });
    setSaveRetryable(false);
    setForms((prev) => ({
      ...prev,
      [activeType]: buildEmptyForms(today)[activeType],
    }));
    setEditingDocId(null);
    if (hasAttachments) {
      onImageAttachmentsClear?.();
      attachmentsForDocument.forEach((attachment) => {
        recordChartsAuditEvent({
          action: 'chart_image_attach',
          outcome: 'success',
          subject: 'charts-document-attachment',
          runId: resolvedRunId,
          cacheHit: meta.cacheHit,
          missingMaster: meta.missingMaster,
          fallbackUsed: meta.fallbackUsed,
          dataSourceTransition: meta.dataSourceTransition,
          patientId,
          appointmentId: meta.appointmentId,
          details: {
            operationPhase: 'save',
            documentType: activeType,
            documentTitle: summary,
            documentIssuedAt: issuedAt,
            documentId,
            attachmentId: attachment.id,
            endpoint: documentEndpoint,
            httpStatus: documentStatus,
            durationMs: documentDurationMs,
          },
        });
      });
    }

    logDocumentAudit('CHARTS_DOCUMENT_CREATE', 'save', {
      documentTitle: summary,
      documentIssuedAt: issuedAt,
      templateId: forms[activeType].templateId,
      documentId,
      letterId: letterResult.letterId,
      linkId: editingDoc?.letterId,
      attachmentIds: attachmentsForDocument.map((attachment) => attachment.id),
      endpoint: letterResult.endpoint ?? documentEndpoint,
      httpStatus: letterResult.status ?? documentStatus,
      durationMs: documentDurationMs,
      error: letterResult.error ?? documentError,
    });
  };

  const handleCancel = () => {
    setForms(buildEmptyForms(today));
    setEditingDocId(null);
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
      if (filterPatient === 'current' && patientId && doc.patientId !== patientId) return false;
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
  }, [
    filterAudit,
    filterOutput,
    filterPatient,
    filterText,
    filterType,
    patientId,
    resolveAuditOutcome,
    resolveOutputGuardReasons,
    savedDocs,
  ]);

  const handleOpenDocumentPreview = async (doc: SavedDocument, initialOutputMode?: DocumentOutputMode) => {
    const resolvedDoc = await ensureDocumentDetail(doc);
    const { actor, facilityId } = resolveAuditActor();
    const blockedReasons = resolveOutputGuardReasons(resolvedDoc);
    if (blockedReasons.length > 0) {
      setNotice({ tone: 'error', message: `出力できません: ${blockedReasons[0].detail}` });
      updateOutputAudit(resolvedDoc.id, {
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
        patientId: resolvedDoc.patientId,
        actor,
        runId: resolvedRunId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        details: {
          operationPhase: 'lock',
          blockedReasons: blockedReasons.map((reason) => reason.key),
          documentType: resolvedDoc.type,
          documentTitle: resolvedDoc.title,
          documentIssuedAt: resolvedDoc.issuedAt,
          templateId: resolvedDoc.templateId,
          documentId: resolvedDoc.id,
        },
      });
      return;
    }

    const outputLabel =
      initialOutputMode === 'print' ? '印刷' : initialOutputMode === 'pdf' ? 'PDF出力' : 'プレビュー';
    const detail = `文書${outputLabel}プレビューを開きました (actor=${actor})`;
    setNotice({ tone: 'success', message: `文書${outputLabel}プレビューを開きました。` });
    updateOutputAudit(resolvedDoc.id, {
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
      patientId: resolvedDoc.patientId,
      runId: resolvedRunId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      details: {
        operationPhase: 'do',
        documentType: resolvedDoc.type,
        documentTitle: resolvedDoc.title,
        documentIssuedAt: resolvedDoc.issuedAt,
        templateId: resolvedDoc.templateId,
        documentId: resolvedDoc.id,
        endpoint: '/charts/print/document',
      },
    });

    const previewState = {
      document: { ...resolvedDoc, form: resolvedDoc.form as Record<string, string> },
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
    saveDocumentPrintPreview(previewState, storageScope);
  };

  useEffect(() => {
    if (!openRequest) return;
    const requestKey = openRequest.requestId ?? JSON.stringify(openRequest);
    const requiresHistory = !openRequest.letterId && Boolean(openRequest.documentId);
    if (requiresHistory && !historyLoaded) return;
    if (lastOpenRequestRef.current === requestKey) return;
    lastOpenRequestRef.current = requestKey;
    let active = true;

    const applyRequest = async () => {
      if (!active) return;
      if (openRequest.query) {
        setFilterText(openRequest.query);
      }

      let resolvedDoc: SavedDocument | null = null;
      if (openRequest.letterId) {
        resolvedDoc = savedDocs.find((doc) => doc.letterId === openRequest.letterId) ?? null;
        if (!resolvedDoc) {
          const detail = await fetchLetterDetail({ letterId: openRequest.letterId });
          if (!active) return;
          if (detail.ok && detail.letter) {
            resolvedDoc = mapLetterToDocument(detail.letter, today);
            upsertSavedDocument(resolvedDoc);
          }
        }
      } else if (openRequest.documentId) {
        resolvedDoc = savedDocs.find((doc) => doc.documentId === openRequest.documentId) ?? null;
      }

      if (!active) return;
      if (!resolvedDoc) {
        const shouldNotifyMissing = Boolean(openRequest.letterId || (openRequest.documentId && !openRequest.query));
        if (shouldNotifyMissing) {
          setNotice({ tone: 'error', message: '指定された文書が見つかりませんでした。' });
        }
        return;
      }

      if (openRequest.intent === 'print' || openRequest.intent === 'pdf') {
        await handleOpenDocumentPreview(resolvedDoc, openRequest.intent);
        return;
      }
      if (openRequest.intent === 'preview') {
        await handleOpenDocumentPreview(resolvedDoc);
        return;
      }
      await handleEditDocument(resolvedDoc);
    };

    applyRequest();
    return () => {
      active = false;
    };
  }, [
    handleEditDocument,
    handleOpenDocumentPreview,
    historyLoaded,
    openRequest,
    savedDocs,
    today,
    upsertSavedDocument,
  ]);

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
      {notice && (
        <div
          className={`charts-side-panel__notice charts-side-panel__notice--${notice.tone}`}
          role={noticeRole}
          aria-live={noticeLive}
          aria-atomic="true"
        >
          {notice.message}
        </div>
      )}
      {blockReasons.length > 0 && (
        <div className="charts-side-panel__notice charts-side-panel__notice--info">
          {blockReasons.map((reason) => (
            <p key={reason} className="charts-side-panel__message">
              {reason}
            </p>
          ))}
        </div>
      )}
      {attachmentsForDocument.length > 0 && (
        <div className="charts-side-panel__notice charts-side-panel__notice--info" data-test-id="document-attachment-summary">
          <div className="charts-document-attachment__header">
            <strong>文書へ貼付予定の画像</strong>
            <span>{attachmentsForDocument.length} 件</span>
            {onImageAttachmentsClear ? (
              <button type="button" onClick={onImageAttachmentsClear} disabled={isSaving}>
                すべて解除
              </button>
            ) : null}
          </div>
          <ul className="charts-document-attachment__list">
            {attachmentsForDocument.map((attachment) => (
              <li key={attachment.id} className="charts-document-attachment__item">
                <span>
                  {attachment.title ?? attachment.fileName ?? `attachment-${attachment.id}`} (ID:{attachment.id})
                </span>
                {onImageAttachmentsChange ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    disabled={isSaving}
                  >
                    解除
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
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
              <label htmlFor="referral-department">宛先診療科</label>
              <input
                id="referral-department"
                type="text"
                value={forms.referral.department}
                onChange={(event) => updateForm('referral', { department: event.target.value })}
                placeholder="診療科/部署"
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
              <label htmlFor="reply-department">返信先診療科</label>
              <input
                id="reply-department"
                type="text"
                value={forms.reply.department}
                onChange={(event) => updateForm('reply', { department: event.target.value })}
                placeholder="診療科/部署"
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
        {editingDoc ? (
          <div className="charts-side-panel__notice charts-side-panel__notice--info">
            <div className="charts-side-panel__message">編集中: {editingDoc.title}</div>
            <button
              type="button"
              onClick={() => {
                setEditingDocId(null);
                setNotice({ tone: 'info', message: '編集モードを解除しました。' });
              }}
            >
              編集解除
            </button>
          </div>
        ) : null}
        <div className="charts-side-panel__actions">
          <button type="button" onClick={handleSave} disabled={isBlocked || isSaving}>
            {editingDoc ? '更新' : '保存'}
          </button>
          {canRetrySave ? (
            <button type="button" onClick={handleSave} disabled={!canRetrySave}>
              再送
            </button>
          ) : null}
          <button type="button" onClick={handleCancel}>
            中断
          </button>
        </div>
        {canRetrySave ? <p className="charts-side-panel__message">添付付き保存が失敗した場合のみ再送できます。</p> : null}
      </form>
      <div className="charts-document-list" aria-live={resolveAriaLive('info')}>
        <div className="charts-document-list__header">
          <strong>保存済み文書</strong>
          <span>
            {isHistoryLoading ? '取得中...' : `${filteredDocs.length}/${savedDocs.length} 件`}
          </span>
        </div>
        {historyError && (
          <div className="charts-side-panel__notice charts-side-panel__notice--error">
            <div className="charts-side-panel__message">{historyError}</div>
            <button type="button" onClick={refreshDocumentHistory} disabled={isHistoryLoading}>
              再読み込み
            </button>
          </div>
        )}
        {isHistoryLoading ? (
          <p className="charts-side-panel__empty">文書履歴を取得しています...</p>
        ) : savedDocs.length === 0 ? (
          <>
            <div className="charts-side-panel__notice charts-side-panel__notice--info">
              文書履歴はサーバー側に保存されます。保存後に一覧へ反映されます。
            </div>
            <p className="charts-side-panel__empty">保存履歴はまだありません。</p>
          </>
        ) : (
          <>
            <div className="charts-document-list__filters" role="group" aria-label="文書履歴の検索フィルタ">
              <input
                id="document-filter-text"
                name="documentFilterText"
                type="search"
                placeholder="検索（タイトル/テンプレ/発行日）"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
                aria-label="文書履歴の検索"
              />
              <select
                id="document-filter-patient"
                name="documentFilterPatient"
                value={filterPatient}
                onChange={(event) => setFilterPatient(event.target.value as 'current' | 'all')}
                aria-label="患者フィルタ"
              >
                <option value="current">選択患者のみ</option>
                <option value="all">全患者</option>
              </select>
              <select
                id="document-filter-type"
                name="documentFilterType"
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
                id="document-filter-output"
                name="documentFilterOutput"
                value={filterOutput}
                onChange={(event) => setFilterOutput(event.target.value as 'all' | 'available' | 'blocked')}
                aria-label="出力可否フィルタ"
              >
                <option value="all">出力可否: すべて</option>
                <option value="available">出力可能のみ</option>
                <option value="blocked">出力停止のみ</option>
              </select>
              <select
                id="document-filter-audit"
                name="documentFilterAudit"
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
                filterPatient !== 'current' ||
                filterType !== 'all' ||
                filterOutput !== 'all' ||
                filterAudit !== 'all') && (
                <button
                  type="button"
                  className="charts-document-list__clear"
                  onClick={() => {
                    setFilterText('');
                    setFilterPatient('current');
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
                {filteredDocs.map((doc) => {
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
                    <li key={doc.id}>
                      <div className="charts-document-list__row">
                        <strong>{DOCUMENT_TYPE_LABELS[doc.type] ?? '文書'}</strong>
                        <span>{doc.title}</span>
                      </div>
                      <div className="charts-document-list__meta">
                        <small>
                          発行日: {doc.issuedAt} / テンプレ: {doc.templateLabel} / 添付: {doc.attachmentIds?.length ?? 0} /
                          保存: {new Date(doc.savedAt).toLocaleString()}
                        </small>
                        <span className={`charts-document-list__status charts-document-list__status--${auditOutcome}`}>
                          監査結果: {outputStatusLabel}
                        </span>
                      </div>
                      <div className="charts-document-list__actions" role="group" aria-label="文書編集操作">
                        <button
                          type="button"
                          onClick={() => handleReuseDocument(doc)}
                          disabled={doc.patientId !== patientId}
                        >
                          コピーして編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditDocument(doc)}
                          disabled={doc.patientId !== patientId}
                        >
                          編集
                        </button>
                        <button type="button" onClick={() => handleDeleteDocument(doc)}>
                          削除
                        </button>
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
                      {doc.patientId !== patientId && (
                        <div className="charts-document-list__guard">患者が異なるためコピー編集はできません。</div>
                      )}
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
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
