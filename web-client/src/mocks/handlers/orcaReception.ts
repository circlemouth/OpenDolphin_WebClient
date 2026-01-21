import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const buildResponse = (body: Record<string, unknown>, status = 200, runId?: string, traceId?: string) =>
  HttpResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(runId ? { 'x-run-id': runId } : {}),
      ...(traceId ? { 'x-trace-id': traceId } : {}),
    },
  });

const buildPayload = async (request: Request) => {
  const fault = parseFaultSpec(request);
  await applyFaultDelay(fault);
  const headers = request.headers;
  const now = new Date();
  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  const toTime = (d: Date) => d.toISOString().slice(11, 19);
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const patientId = (body.patientId as string | undefined) ?? '000001';
  const requestNumber = (body.requestNumber as string | undefined) ?? '01';
  const runId = headers.get('x-run-id') ?? 'MSW-ACCEPT-RUN';
  const traceId = headers.get('x-trace-id') ?? `trace-${now.getTime()}`;

  const shouldWarn = fault.tokens.has('api-21') || patientId === '00021';
  const shouldError = fault.tokens.has('api-error');
  const http500 = fault.tokens.has('http-500') || fault.tokens.has('500');

  const apiResult = shouldError ? 'E99' : shouldWarn ? '21' : '00';
  const apiResultMessage = shouldError
    ? 'mocked error'
    : shouldWarn
      ? '受付が存在しません (Api_Result=21)'
      : '正常終了';

  const acceptanceId = shouldWarn ? undefined : (body.acceptanceId as string | undefined) ?? `A-${patientId}-MSW`;

  const payload: Record<string, unknown> = {
    apiResult,
    apiResultMessage,
    runId,
    traceId,
    requestId: `msw-${now.getTime()}`,
    dataSourceTransition: 'mock',
    cacheHit: false,
    missingMaster: false,
    fetchedAt: now.toISOString(),
    acceptanceId,
    acceptanceDate: body.acceptanceDate ?? toDate(now),
    acceptanceTime: body.acceptanceTime ?? toTime(now),
    departmentCode: body.departmentCode ?? '01',
    physicianCode: body.physicianCode ?? '1001',
    medicalInformation: body.medicalInformation ?? '外来受付',
    requestNumber,
    patient: {
      patientId,
      name: (body.patientName as string | undefined) ?? 'MSW 患者',
      kana: (body.patientKana as string | undefined) ?? 'エムエスダブリュ',
      birthDate: '1990-01-01',
      sex: 'F',
    },
    warnings: shouldWarn ? ['受付が見つかりません'] : [],
  };

  if (http500) {
    return buildResponse(payload, 500, runId, traceId);
  }
  return buildResponse(payload, 200, runId, traceId);
};

export const orcaReceptionHandlers = [
  http.post('/orca/visits/mutation', async ({ request }) => buildPayload(request)),
  http.post('/orca/visits/mutation/mock', async ({ request }) => buildPayload(request)),
];
