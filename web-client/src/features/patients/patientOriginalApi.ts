import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument } from '../../libs/xml/xmlUtils';

export type PatientOriginalFormat = 'xml' | 'json';

export type PatientOriginalResponse = {
  ok: boolean;
  status: number;
  format: PatientOriginalFormat;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  rawText: string;
  rawXml?: string;
  rawJson?: unknown;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const REQUIRED_TAGS = ['Api_Result', 'Api_Result_Message'];

const pickJsonSection = (json: unknown, key: string): unknown => {
  if (!json || typeof json !== 'object') return undefined;
  const record = json as Record<string, unknown>;
  if (key in record) return record[key];
  const xmlio2 = record.xmlio2;
  if (xmlio2 && typeof xmlio2 === 'object' && key in (xmlio2 as Record<string, unknown>)) {
    return (xmlio2 as Record<string, unknown>)[key];
  }
  return undefined;
};

const findValue = (node: unknown, key: string, visited = new WeakSet<object>()): string | undefined => {
  if (!node || typeof node !== 'object') return undefined;
  if (visited.has(node)) return undefined;
  visited.add(node);
  if (key in (node as Record<string, unknown>)) {
    const value = (node as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findValue(entry, key, visited);
      if (found) return found;
    }
    return undefined;
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findValue(value, key, visited);
    if (found) return found;
  }
  return undefined;
};

const extractJsonMeta = (json: unknown) => {
  const candidates = [
    json,
    pickJsonSection(json, 'patientinfores'),
    pickJsonSection(json, 'patientgetv2res'),
    pickJsonSection(json, 'Patient_Information'),
  ].filter(Boolean);
  const readFromCandidates = (key: string) => {
    for (const candidate of candidates) {
      const found = findValue(candidate, key);
      if (found) return found;
    }
    return undefined;
  };
  return {
    apiResult: readFromCandidates('Api_Result'),
    apiResultMessage: readFromCandidates('Api_Result_Message'),
    informationDate: readFromCandidates('Information_Date'),
    informationTime: readFromCandidates('Information_Time'),
  };
};

const extractJsonMissingTags = (json: unknown) => {
  const candidates = [
    json,
    pickJsonSection(json, 'patientinfores'),
    pickJsonSection(json, 'patientgetv2res'),
    pickJsonSection(json, 'Patient_Information'),
  ].filter(Boolean);
  const hasValue = (tag: string) => candidates.some((candidate) => findValue(candidate, tag));
  return REQUIRED_TAGS.filter((tag) => !hasValue(tag));
};

export async function fetchPatientOriginal(params: {
  patientId: string;
  format?: PatientOriginalFormat;
  classCode?: string;
}): Promise<PatientOriginalResponse> {
  const format: PatientOriginalFormat = params.format ?? 'xml';
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });

  const query = new URLSearchParams({ id: params.patientId });
  if (params.classCode) query.set('class', params.classCode);
  if (format === 'json') query.set('format', 'json');

  const response = await httpFetch(`/api01rv2/patientgetv2?${query.toString()}`, {
    method: 'GET',
    headers: {
      Accept: format === 'json' ? 'application/json' : 'application/xml',
    },
  });

  const rawText = await response.text();
  if (format === 'json') {
    let rawJson: unknown;
    let error: string | undefined;
    try {
      rawJson = rawText ? JSON.parse(rawText) : undefined;
    } catch (parseError) {
      error = parseError instanceof Error ? parseError.message : String(parseError);
    }
    const meta: ReturnType<typeof extractJsonMeta> = rawJson ? extractJsonMeta(rawJson) : {
      apiResult: undefined,
      apiResultMessage: undefined,
      informationDate: undefined,
      informationTime: undefined,
    };
    const missingTags = rawJson ? extractJsonMissingTags(rawJson) : [...REQUIRED_TAGS];

    return {
      ok: response.ok && !error,
      status: response.status,
      format,
      apiResult: meta.apiResult,
      apiResultMessage: meta.apiResultMessage,
      informationDate: meta.informationDate,
      informationTime: meta.informationTime,
      rawText,
      rawJson,
      missingTags,
      runId: getObservabilityMeta().runId ?? runId,
      traceId: getObservabilityMeta().traceId,
      error,
    };
  }

  const rawXml = rawText;
  const { doc, error } = parseXmlDocument(rawXml);
  const meta = extractOrcaXmlMeta(doc);
  const requiredCheck = checkRequiredTags(doc, REQUIRED_TAGS);

  return {
    ok: response.ok && !error,
    status: response.status,
    format,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    rawText,
    rawXml,
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
