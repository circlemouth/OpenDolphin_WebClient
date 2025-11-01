import { HttpResponse, http } from 'msw';

import { chartEventFixture, docInfoListFixture, patientVisitListFixture } from '@/mocks/fixtures/charts';

export const chartHandlers = [
  http.get('/api/pvt2/pvtList', () => HttpResponse.json(patientVisitListFixture)),
  http.get('/api/chartEvent/subscribe', () => HttpResponse.json(chartEventFixture)),
  http.put('/api/chartEvent/event', () => HttpResponse.text('1')),
  http.get('/api/karte/docinfo/:params', () => HttpResponse.json(docInfoListFixture)),
];
