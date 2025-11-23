import { HttpResponse, http } from 'msw';

import {
  addressMasterResponse,
  dosageInstructionMasterResponse,
  drugClassificationMasterResponse,
  etensuMasterResponse,
  insurerMasterResponse,
  labClassificationMasterResponse,
  minimumDrugPriceResponse,
  specialEquipmentMasterResponse,
  buildTensuByPointResponse,
} from '@/mocks/fixtures/orcaMaster';

export const orcaMasterHandlers = [
  http.get('/orca/master/address', () => HttpResponse.json(addressMasterResponse)),
  http.get('/orca/master/generic-class', () => HttpResponse.json(drugClassificationMasterResponse)),
  http.get('/orca/master/generic-price', () => HttpResponse.json(minimumDrugPriceResponse)),
  http.get('/orca/master/youhou', () => HttpResponse.json(dosageInstructionMasterResponse)),
  http.get('/orca/master/material', () => HttpResponse.json(specialEquipmentMasterResponse)),
  http.get('/orca/master/kensa-sort', () => HttpResponse.json(labClassificationMasterResponse)),
  http.get('/orca/master/hokenja', () => HttpResponse.json(insurerMasterResponse)),
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
