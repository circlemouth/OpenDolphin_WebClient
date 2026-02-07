import { useMemo, useState } from 'react';

import { httpFetch } from '../../libs/http/httpClient';
import { getAuditEventLog, logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { getObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import { AuditSummaryInline } from '../shared/AuditSummaryInline';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument } from '../../libs/xml/xmlUtils';
import './orcaApiConsole.css';

type OrcaApiDefinition = {
  id: string;
  label: string;
  method: 'GET' | 'POST';
  path: string;
  defaultQuery?: string;
  defaultBody?: string;
  description: string;
};

const buildDefaultRequests = (today: string): OrcaApiDefinition[] => {
  const baseMonth = today.slice(0, 7);
  return [
    {
      id: 'patientgetv2',
      label: 'patientgetv2',
      method: 'GET',
      path: '/api01rv2/patientgetv2',
      defaultQuery: 'id=00002',
      description: '患者基本情報の取得（GET）。',
    },
    {
      id: 'patientgetv2-json',
      label: 'patientgetv2 (JSON)',
      method: 'GET',
      path: '/api01rv2/patientgetv2',
      defaultQuery: 'id=00002&format=json',
      description: '患者基本情報の取得（JSON）。',
    },
    {
      id: 'patientlst7v2',
      label: 'patientlst7v2',
      method: 'POST',
      path: '/api01rv2/patientlst7v2',
      defaultBody: [
        '<data>',
        '  <patientlst7req type="record">',
        '    <Request_Number type="string">01</Request_Number>',
        '    <Patient_ID type="string">00002</Patient_ID>',
        `    <Base_Date type="string">${today}</Base_Date>`,
        '    <Department_Code type="string"></Department_Code>',
        '    <Memo_Class type="string"></Memo_Class>',
        '  </patientlst7req>',
        '</data>',
      ].join('\n'),
      description: '患者メモ取得（XML2）。',
    },
    {
      id: 'patientmemomodv2',
      label: 'patientmemomodv2',
      method: 'POST',
      path: '/orca06/patientmemomodv2',
      defaultBody: [
        '<data>',
        '  <patient_memomodreq type="record">',
        '    <Request_Number type="string">01</Request_Number>',
        '    <Patient_ID type="string">00002</Patient_ID>',
        `    <Perform_Date type="string">${today}</Perform_Date>`,
        '    <Department_Code type="string">01</Department_Code>',
        '    <Memo_Class type="string">2</Memo_Class>',
        '    <Patient_Memo type="string">テストメモ</Patient_Memo>',
        '  </patient_memomodreq>',
        '</data>',
      ].join('\n'),
      description: '患者メモ更新（XML2）。',
    },
    {
      id: 'insuranceinf1v2',
      label: 'insuranceinf1v2',
      method: 'POST',
      path: '/api/api01rv2/insuranceinf1v2',
      defaultBody: [
        '<data>',
        '  <insuranceinfreq type="record">',
        '    <Request_Number type="string">01</Request_Number>',
        `    <Base_Date type="string">${today}</Base_Date>`,
        '  </insuranceinfreq>',
        '</data>',
      ].join('\n'),
      description: '保険者一覧取得（XML2）。',
    },
    {
      id: 'diseasegetv2',
      label: 'diseasegetv2',
      method: 'POST',
      path: '/api01rv2/diseasegetv2?class=01',
      defaultBody: [
        '<data>',
        '  <disease_inforeq type="record">',
        '    <Patient_ID type="string">00002</Patient_ID>',
        `    <Base_Date type="string">${baseMonth}</Base_Date>`,
        '  </disease_inforeq>',
        '</data>',
      ].join('\n'),
      description: '病名取得（XML2）。',
    },
    {
      id: 'diseasev3',
      label: 'diseasev3',
      method: 'POST',
      path: '/orca22/diseasev3?class=01',
      defaultBody: [
        '<data>',
        '  <diseasereq type="record">',
        '    <Patient_ID type="string">00002</Patient_ID>',
        '    <Base_Month type="string"></Base_Month>',
        `    <Perform_Date type="string">${today}</Perform_Date>`,
        '    <Perform_Time type="string"></Perform_Time>',
        '    <Diagnosis_Information type="record">',
        '      <Department_Code type="string">01</Department_Code>',
        '    </Diagnosis_Information>',
        '    <Disease_Information type="array">',
        '      <Disease_Information_child type="record">',
        '        <Disease_Code type="string">0000999</Disease_Code>',
        '        <Disease_Name type="string">テスト病名</Disease_Name>',
        `        <Disease_StartDate type="string">${today}</Disease_StartDate>`,
        '        <Disease_EndDate type="string"></Disease_EndDate>',
        '      </Disease_Information_child>',
        '    </Disease_Information>',
        '  </diseasereq>',
        '</data>',
      ].join('\n'),
      description: '病名登録 v3（XML2）。',
    },
    {
      id: 'medicalgetv2',
      label: 'medicalgetv2',
      method: 'POST',
      path: '/api01rv2/medicalgetv2?class=01',
      defaultBody: [
        '<data>',
        '  <medicalgetreq type="record">',
        '    <InOut type="string">O</InOut>',
        '    <Patient_ID type="string">00002</Patient_ID>',
        `    <Perform_Date type="string">${today}</Perform_Date>`,
        '    <For_Months type="string">12</For_Months>',
        '    <Medical_Information type="record">',
        '      <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>',
        '      <Department_Code type="string">01</Department_Code>',
        '      <Sequential_Number type="string"></Sequential_Number>',
        '    </Medical_Information>',
        '  </medicalgetreq>',
        '</data>',
      ].join('\n'),
      description: '診療情報取得（XML2）。',
    },
    {
      id: 'medicalmodv2',
      label: 'medicalmodv2',
      method: 'POST',
      path: '/api21/medicalmodv2?class=01',
      defaultBody: [
        '<data>',
        '  <medicalreq type="record">',
        '    <Patient_ID type="string">00002</Patient_ID>',
        `    <Perform_Date type="string">${today}</Perform_Date>`,
        '    <Diagnosis_Information type="record">',
        '      <Department_Code type="string">01</Department_Code>',
        '      <Physician_Code type="string">10001</Physician_Code>',
        '      <HealthInsurance_Information type="record">',
        '        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>',
        '      </HealthInsurance_Information>',
        '      <Medical_Information type="array">',
        '        <Medical_Information_child type="record">',
        '          <Medical_Class type="string">120</Medical_Class>',
        '          <Medical_Class_Name type="string">再診</Medical_Class_Name>',
        '          <Medical_Class_Number type="string">1</Medical_Class_Number>',
        '          <Medication_info type="array">',
        '            <Medication_info_child type="record">',
        '              <Medication_Code type="string">112007410</Medication_Code>',
        '              <Medication_Number type="string">1</Medication_Number>',
        '            </Medication_info_child>',
        '          </Medication_info>',
        '        </Medical_Information_child>',
        '      </Medical_Information>',
        '    </Diagnosis_Information>',
        '  </medicalreq>',
        '</data>',
      ].join('\n'),
      description: '診療登録（XML2）。',
    },
  ];
};

type OrcaConsoleResponse = {
  status: number;
  ok: boolean;
  raw: string;
  apiResult?: string;
  apiResultMessage?: string;
  infoDate?: string;
  infoTime?: string;
  error?: string;
  missingTags?: string[];
  headers?: Record<string, string>;
};

const buildQuery = (path: string, query: string) => {
  if (!query) return path;
  if (path.includes('?')) {
    return `${path}&${query}`;
  }
  return `${path}?${query}`;
};

const extractTagValue = (xml: string, tag: string): string | undefined => {
  const matcher = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'i');
  const match = xml.match(matcher);
  return match?.[1]?.trim() || undefined;
};

const extractQueryParam = (query: string, key: string): string | undefined => {
  if (!query) return undefined;
  const params = new URLSearchParams(query);
  const value = params.get(key);
  return value?.trim() || undefined;
};

const HISTORY_KEY = 'opendolphin:orca-api-console:history:v1';

type OrcaConsoleHistory = {
  id: string;
  createdAt: string;
  method: 'GET' | 'POST';
  path: string;
  query: string;
  body: string;
  apiResult?: string;
  apiResultMessage?: string;
};

const loadHistory = (): OrcaConsoleHistory[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrcaConsoleHistory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (entries: OrcaConsoleHistory[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 3)));
  } catch {
    // ignore storage errors
  }
};

export function OrcaApiConsolePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultRequests = useMemo(() => buildDefaultRequests(today), [today]);
  const [selectedId, setSelectedId] = useState<string>(defaultRequests[0].id);
  const selected = useMemo(
    () => defaultRequests.find((entry) => entry.id === selectedId) ?? defaultRequests[0],
    [defaultRequests, selectedId],
  );
  const [path, setPath] = useState<string>(selected.path);
  const [query, setQuery] = useState<string>(selected.defaultQuery ?? '');
  const [body, setBody] = useState<string>(selected.defaultBody ?? '');
  const [response, setResponse] = useState<OrcaConsoleResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<OrcaConsoleHistory[]>(() => loadHistory());
  const latestAuditEvent = useMemo(() => {
    const snapshot = getAuditEventLog();
    const latest = snapshot[snapshot.length - 1];
    return (latest?.payload as Record<string, unknown> | undefined) ?? undefined;
  }, [isSending, response?.status]);

  const handleSelect = (id: string) => {
    const next = defaultRequests.find((entry) => entry.id === id);
    if (!next) return;
    setSelectedId(id);
    setPath(next.path);
    setQuery(next.defaultQuery ?? '');
    setBody(next.defaultBody ?? '');
    setDirty(false);
    setResponse(null);
  };

  const defaultBaseDate = selected.method === 'POST' ? extractTagValue(body, 'Base_Date') : undefined;
  const defaultPerformDate = selected.method === 'POST' ? extractTagValue(body, 'Perform_Date') : undefined;
  const requestPatientId =
    selected.method === 'GET' ? extractQueryParam(query, 'id') : extractTagValue(body, 'Patient_ID');
  const validationErrors: string[] = [];
  if (!requestPatientId) {
    validationErrors.push('Patient_ID が未入力です。');
  }
  if (selected.method === 'POST' && body.trim().length === 0) {
    validationErrors.push('XMLが空です。');
  }

  const isBlocked = validationErrors.length > 0;

  const handleSend = async () => {
    if (isBlocked) {
      setResponse({
        status: 0,
        ok: false,
        raw: '',
        error: validationErrors.join(' '),
      });
      return;
    }
    setIsSending(true);
    const startedAt = Date.now();
    try {
      const requestPath = buildQuery(path, query);
      const requestInit: RequestInit = {
        method: selected.method,
        headers: {
          Accept: 'application/xml',
        },
      };
      if (selected.method === 'POST') {
        requestInit.headers = {
          ...requestInit.headers,
          'Content-Type': 'application/xml; charset=UTF-8',
        };
        requestInit.body = body;
      }
      const res = await httpFetch(requestPath, requestInit);
      const raw = await res.text();
      const { doc, error } = parseXmlDocument(raw);
      const meta = extractOrcaXmlMeta(doc);
      const requiredCheck = checkRequiredTags(doc, ['Api_Result']);
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const nextHistory: OrcaConsoleHistory = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        method: selected.method,
        path,
        query,
        body,
        apiResult: meta.apiResult,
        apiResultMessage: meta.apiResultMessage,
      };
      const mergedHistory = [nextHistory, ...history].slice(0, 3);
      setHistory(mergedHistory);
      saveHistory(mergedHistory);
      setResponse({
        status: res.status,
        ok: res.ok && !error,
        raw,
        apiResult: meta.apiResult,
        apiResultMessage: meta.apiResultMessage,
        infoDate: meta.informationDate,
        infoTime: meta.informationTime,
        error,
        missingTags: requiredCheck.missingTags,
        headers,
      });
      logUiState({
        action: 'orca_api_console_send',
        screen: 'debug/orca-api',
        runId: getObservabilityMeta().runId,
        details: {
          endpoint: requestPath,
          method: selected.method,
          status: res.status,
          durationMs: Date.now() - startedAt,
          apiResult: meta.apiResult,
          apiResultMessage: meta.apiResultMessage,
          inputSource: 'console',
          hasRawXml: Boolean(raw),
        },
      });
      logAuditEvent({
        runId: getObservabilityMeta().runId,
        source: 'orca-api-console',
        payload: {
          action: 'ORCA_API_CONSOLE_SEND',
          outcome: res.ok && !error ? 'success' : 'error',
          details: {
            endpoint: requestPath,
            method: selected.method,
            status: res.status,
            apiResult: meta.apiResult,
            apiResultMessage: meta.apiResultMessage,
            inputSource: 'console',
            hasRawXml: Boolean(raw),
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResponse({
        status: 0,
        ok: false,
        raw: '',
        error: message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="orca-api-console">
      <header className="orca-api-console__header">
        <div>
          <p className="orca-api-console__kicker">Debug / ORCA API Console</p>
          <h1>ORCA 追加API コンソール</h1>
          <p className="orca-api-console__sub">
            XML2 を直接送信し、応答を確認します（QA/検証専用）。
          </p>
          <AuditSummaryInline
            auditEvent={latestAuditEvent}
            className="orca-api-console__summary"
            variant="inline"
            runId={getObservabilityMeta().runId}
          />
        </div>
        <button type="button" onClick={handleSend} disabled={isSending}>
          {isSending ? '送信中…' : '送信'}
        </button>
      </header>

      <section className="orca-api-console__grid">
        <div className="orca-api-console__panel">
          <label>
            <span>API 選択</span>
            <select
              id="orca-api-select"
              name="orcaApiSelect"
              value={selectedId}
              onChange={(event) => handleSelect(event.target.value)}
            >
              {defaultRequests.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label} ({entry.method})
                </option>
              ))}
            </select>
          </label>
          <p className="orca-api-console__hint">{selected.description}</p>
          <div className="orca-api-console__defaults">
            <span>Base_Date デフォルト: {defaultBaseDate ?? '—'}</span>
            <span>Perform_Date デフォルト: {defaultPerformDate ?? '—'}</span>
          </div>
          <label>
            <span>Path</span>
            <input
              id="orca-api-path"
              name="orcaApiPath"
              value={path}
              onChange={(event) => {
                setPath(event.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label>
            <span>Query</span>
            <input
              id="orca-api-query"
              name="orcaApiQuery"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setDirty(true);
              }}
              placeholder="id=00002"
            />
          </label>
          {selected.method === 'POST' && (
            <label className="orca-api-console__textarea">
              <span>XML Body</span>
              <textarea
                id="orca-api-body"
                name="orcaApiBody"
                value={body}
                rows={16}
                onChange={(event) => {
                  setBody(event.target.value);
                  setDirty(true);
                }}
              />
            </label>
          )}
          {validationErrors.length > 0 ? (
            <div className="orca-api-console__warning" role="alert">
              {validationErrors.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          ) : null}
          <div className="orca-api-console__actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setPath(selected.path);
                setQuery(selected.defaultQuery ?? '');
                setBody(selected.defaultBody ?? '');
                setDirty(false);
              }}
              disabled={!dirty}
            >
              テンプレへ戻す
            </button>
            <button type="button" onClick={handleSend} disabled={isSending || isBlocked}>
              {isSending ? '送信中…' : '送信'}
            </button>
          </div>
        </div>

        <div className="orca-api-console__panel">
          <header className="orca-api-console__panel-header">
            <h2>レスポンス</h2>
            <span className="orca-api-console__meta">
              {response ? `HTTP ${response.status}` : '未送信'}
            </span>
          </header>
          {response ? (
            <>
              <div className="orca-api-console__status" aria-live={resolveAriaLive(response.ok ? 'info' : 'warning')}>
                <p>
                  Api_Result: {response.apiResult ?? '—'} / Api_Result_Message: {response.apiResultMessage ?? '—'}
                </p>
                <p>
                  Information_Date: {response.infoDate ?? '—'} / Information_Time: {response.infoTime ?? '—'}
                </p>
                {response.error ? <p className="orca-api-console__error">XML parse error: {response.error}</p> : null}
                {response.missingTags?.length ? (
                  <p className="orca-api-console__warning">必須タグ不足: {response.missingTags.join(', ')}</p>
                ) : null}
              </div>
              {response.headers && Object.keys(response.headers).length > 0 ? (
                <details className="orca-api-console__headers">
                  <summary>レスポンスヘッダー</summary>
                  <ul>
                    {Object.entries(response.headers).map(([key, value]) => (
                      <li key={key}>
                        {key}: {value}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              <pre className="orca-api-console__response">{response.raw || '—'}</pre>
            </>
          ) : (
            <p className="orca-api-console__empty">送信結果がここに表示されます。</p>
          )}
          {history.length > 0 ? (
            <div className="orca-api-console__history">
              <h3>送信履歴</h3>
              <ul>
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPath(item.path);
                        setQuery(item.query);
                        setBody(item.body);
                        setDirty(true);
                        setResponse(null);
                      }}
                    >
                      <strong>{item.method}</strong> {item.path}
                      {item.query ? `?${item.query}` : ''}
                    </button>
                    <small>
                      {item.createdAt} / Api_Result={item.apiResult ?? '—'}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
