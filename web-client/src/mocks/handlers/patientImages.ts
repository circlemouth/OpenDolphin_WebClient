import { http, HttpResponse } from 'msw';

type PatientImageItem = {
  imageId: number;
  fileName?: string;
  contentType?: string;
  size?: number;
  createdAt?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
};

const FEATURE_HEADER = 'x-feature-images';
const FORCE_STATUS_HEADER = 'x-force-images-status';
const FORCE_NETWORK_ERROR_HEADER = 'x-force-images-network-error';

const requireFeature = (request: Request) => {
  const enabled = (request.headers.get(FEATURE_HEADER) ?? '').trim() === '1';
  return enabled;
};

const respondJson = (body: Record<string, unknown>, status = 200) => HttpResponse.json(body, { status });
const respondAnyJson = (body: unknown, status = 200) => HttpResponse.json(body as any, { status });

const store = new Map<string, PatientImageItem[]>();
let nextId = 2000;

const ensureSeeded = (patientId: string) => {
  if (store.has(patientId)) return;
  store.set(patientId, []);
};

const toItem = (patientId: string, file?: File): PatientImageItem => {
  const imageId = nextId++;
  const createdAt = new Date().toISOString();
  const fileName = file?.name ?? `upload-${imageId}.png`;
  const contentType = file?.type ?? 'image/png';
  const size = typeof file?.size === 'number' ? file.size : undefined;
  return {
    imageId,
    fileName,
    contentType,
    size,
    createdAt,
    thumbnailUrl: `/mock/thumbnail/${encodeURIComponent(String(imageId))}`,
    downloadUrl: `/openDolphin/resources/patients/${encodeURIComponent(patientId)}/images/${encodeURIComponent(String(imageId))}`,
  };
};

export const patientImagesHandlers = [
  http.get('/patients/:patientId/images', ({ request, params }) => {
    const patientId = String(params.patientId ?? '');
    if (!requireFeature(request)) {
      return respondJson({ error: 'feature_disabled', code: 'FEATURE_DISABLED', status: 404 }, 404);
    }
    ensureSeeded(patientId);
    const list = store.get(patientId) ?? [];
    return respondAnyJson(list, 200);
  }),

  http.post('/patients/:patientId/images', async ({ request, params }) => {
    const patientId = String(params.patientId ?? '');
    if (!requireFeature(request)) {
      return respondJson({ error: 'feature_disabled', code: 'FEATURE_DISABLED', status: 404 }, 404);
    }
    ensureSeeded(patientId);

    const forcedStatus = (request.headers.get(FORCE_STATUS_HEADER) ?? '').trim();
    if (forcedStatus === '404') return respondJson({ error: 'feature_disabled', code: 'FEATURE_DISABLED', status: 404 }, 404);
    if (forcedStatus === '413')
      return respondJson({ error: 'payload_too_large', code: 'PAYLOAD_TOO_LARGE', status: 413 }, 413);
    if (forcedStatus === '415')
      return respondJson({ error: 'unsupported_media_type', code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 }, 415);

    const forcedNetwork = (request.headers.get(FORCE_NETWORK_ERROR_HEADER) ?? '').trim();
    if (forcedNetwork === '1' || forcedNetwork.toLowerCase() === 'true') {
      return HttpResponse.error();
    }

    let file: File | null = null;
    try {
      const form = await request.formData();
      const value = form.get('file');
      file = value instanceof File ? value : null;
    } catch {
      file = null;
    }

    if (file && typeof file.size === 'number' && file.size > 5 * 1024 * 1024) {
      return respondJson({ error: 'payload_too_large', code: 'PAYLOAD_TOO_LARGE', status: 413 }, 413);
    }
    if (file && file.type && !file.type.startsWith('image/')) {
      return respondJson({ error: 'unsupported_media_type', code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 }, 415);
    }

    const list = store.get(patientId) ?? [];
    const item = toItem(patientId, file ?? undefined);
    list.unshift(item);
    store.set(patientId, list);
    return respondJson({
      imageId: item.imageId,
      documentId: 9000 + item.imageId,
      fileName: item.fileName,
      contentType: item.contentType,
      size: item.size,
      createdAt: item.createdAt,
    });
  }),
];
