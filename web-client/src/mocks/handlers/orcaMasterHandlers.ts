import { HttpResponse, http } from 'msw';

import {
  addressMasterResponse,
  addressMasterFixture,
  dosageInstructionMasterResponse,
  drugClassificationMasterResponse,
  etensuMasterResponse,
  insurerMasterResponse,
  labClassificationMasterResponse,
  minimumDrugPriceResponse,
  specialEquipmentMasterResponse,
  buildTensuByPointResponse,
} from '@/mocks/fixtures/orcaMaster';

const buildAddressFallback = () => ({
  ...addressMasterResponse,
  list: [],
  totalCount: 0,
  missingMaster: true,
  fallbackUsed: true,
});

const buildInsurerFallback = () => ({
  ...insurerMasterResponse,
  list: [],
  totalCount: 0,
  missingMaster: true,
  fallbackUsed: true,
});

export const orcaMasterHandlers = [
  http.get('/orca/master/address', ({ request }) => {
    const url = new URL(request.url);
    const zip = url.searchParams.get('zip');

    if (!zip || zip !== addressMasterFixture.zipCode) {
      return HttpResponse.json(buildAddressFallback());
    }

    return HttpResponse.json(addressMasterResponse);
  }),
  http.get('/orca/master/generic-class', () => HttpResponse.json(drugClassificationMasterResponse)),
  http.get('/orca/master/generic-price', () => HttpResponse.json(minimumDrugPriceResponse)),
  http.get('/orca/master/youhou', () => HttpResponse.json(dosageInstructionMasterResponse)),
  http.get('/orca/master/material', () => HttpResponse.json(specialEquipmentMasterResponse)),
  http.get('/orca/master/kensa-sort', () => HttpResponse.json(labClassificationMasterResponse)),
  http.get('/orca/master/hokenja', ({ request }) => {
    const url = new URL(request.url);
    const pref = url.searchParams.get('pref');
    const keyword = url.searchParams.get('keyword');
    const [first] = insurerMasterResponse.list;

    if (!first) {
      return HttpResponse.json(buildInsurerFallback());
    }

    if ((pref && pref !== first.prefectureCode) || (keyword && !first.insurerName.includes(keyword))) {
      return HttpResponse.json(buildInsurerFallback());
    }

    return HttpResponse.json(insurerMasterResponse);
  }),
  http.get('/orca/master/etensu', () => HttpResponse.json(etensuMasterResponse)),
  http.get('/orca/tensu/ten/:param/', ({ params }) => {
    const rawParam = params.param as string;
    const decoded = decodeURIComponent(rawParam);
    const [rangeToken] = decoded.split(',');
    const [minRaw, maxRaw] = rangeToken.split('-');
    const minValue = Number.parseFloat(minRaw);
    const maxValue = maxRaw !== undefined ? Number.parseFloat(maxRaw) : Number.parseFloat(minRaw);

    const min = Number.isFinite(minValue) ? minValue : null;
    const max = Number.isFinite(maxValue) ? maxValue : null;

    return HttpResponse.json(buildTensuByPointResponse(min, max));
  }),
];
