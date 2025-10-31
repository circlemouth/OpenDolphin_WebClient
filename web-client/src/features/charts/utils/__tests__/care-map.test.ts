import { buildCareMapEvents, groupCareMapEventsByDate, parseCareMapDate } from '../care-map';
import type { DocInfoSummary } from '@/features/charts/types/doc';
import type { AppointmentSummary } from '@/features/reception/api/appointment-api';
import type { LaboModule } from '@/features/charts/types/labo';
import type { MediaItem } from '@/features/charts/types/media';

describe('care-map utilities', () => {
  const baseDoc: DocInfoSummary = {
    docPk: 1,
    parentPk: null,
    docId: 'doc-1',
    docType: 'karte',
    title: '初診カルテ',
    purpose: null,
    purposeDesc: null,
    confirmDate: '2026-05-01 09:00:00',
    firstConfirmDate: null,
    department: null,
    departmentDesc: '内科',
    healthInsurance: null,
    healthInsuranceDesc: null,
    healthInsuranceGUID: null,
    patientName: '患者 太郎',
    patientId: '0001',
    patientGender: null,
    facilityName: 'OpenDolphin Clinic',
    creatorLicense: null,
    status: 'F',
    hasMark: false,
    hasImage: false,
    hasRp: false,
    hasTreatment: false,
    hasLaboTest: false,
    sendClaim: false,
    sendLabtest: false,
    sendMml: false,
    claimDate: null,
    versionNumber: '1',
    versionNotes: null,
    parentId: null,
    parentIdRelation: null,
    pVTHealthInsuranceModel: null,
  };

  const baseAppointment: AppointmentSummary = {
    id: 10,
    dateTime: '2026-05-02T10:00:00.000Z',
    name: '再診予約',
    memo: '採血後に診察',
    patientId: '0001',
    karteId: 500,
    state: 1,
  };

  const baseLaboModule: LaboModule = {
    id: 20,
    sampleDate: '2026-05-03T07:30:00',
    itemCount: 2,
    centerCode: undefined,
    moduleKey: undefined,
    reportFormat: undefined,
    items: [
      {
        id: 100,
        itemCode: 'HBA1C',
        itemName: 'HbA1c',
        valueText: '6.2',
        unit: '%',
        abnormalFlag: 'H',
        normalRange: '4.6-6.0',
        sampleDate: '2026-05-03T07:30:00',
        comments: [],
        specimenName: '血液',
        raw: {},
      },
      {
        id: 101,
        itemCode: 'GLU',
        itemName: '血糖',
        valueText: '110',
        unit: 'mg/dL',
        abnormalFlag: null,
        normalRange: '70-109',
        sampleDate: '2026-05-03T07:30:00',
        comments: [],
        specimenName: '血液',
        raw: {},
      },
    ],
    raw: {},
  };

  const baseMedia: MediaItem = {
    id: 'media-1',
    title: '胸部X線',
    capturedAt: '2026-05-04T08:15:00',
    description: '正面像',
    attachmentId: 300,
    documentId: 1,
    fileName: 'chest-xray.png',
    size: 512 * 1024,
    contentType: 'image/png',
    kind: 'image',
    documentTitle: '初診カルテ',
    documentDepartment: '内科',
  };

  const pdfMedia: MediaItem = {
    ...baseMedia,
    id: 'media-2',
    title: '造影検査レポート',
    capturedAt: '2026-05-05 09:30:00',
    fileName: 'contrast-report.pdf',
    size: 2 * 1024 * 1024,
    contentType: 'application/pdf',
    kind: 'pdf',
    attachmentId: 301,
  };

  it('parses various date formats for care map events', () => {
    const dateTime = parseCareMapDate('2026-05-01 09:00:00');
    expect(dateTime).not.toBeNull();
    expect(dateTime?.getFullYear()).toBe(2026);
    expect(dateTime?.getMonth()).toBe(4);
    expect(dateTime?.getDate()).toBe(1);
    expect(dateTime?.getHours()).toBe(9);

    const dateOnly = parseCareMapDate('2026-05-01');
    expect(dateOnly).not.toBeNull();
    expect(dateOnly?.getHours()).toBe(0);

    const isoDate = parseCareMapDate('2026-05-01T12:00:00');
    expect(isoDate).not.toBeNull();
    expect(isoDate?.getHours()).toBe(12);
  });

  it('builds chronologically sorted care map events from multiple sources', () => {
    const events = buildCareMapEvents({
      documents: [baseDoc],
      appointments: [baseAppointment],
      laboModules: [baseLaboModule],
      mediaItems: [baseMedia, pdfMedia],
    });

    expect(events.map((event) => event.type)).toEqual([
      'document',
      'appointment',
      'lab',
      'image',
      'attachment',
    ]);

    expect(events[2].description).toContain('2件の検査結果');
    expect(events[2].details).toContain('HbA1c');
    expect(events[0].meta).toMatchObject({ docPk: 1 });
    expect(events[4].details).toContain('PDF 添付');
  });

  it('groups events by date key', () => {
    const events = buildCareMapEvents({
      documents: [
        baseDoc,
        { ...baseDoc, docPk: 2, confirmDate: '2026-05-01 14:00:00', title: '経過観察' },
      ],
      appointments: [baseAppointment],
      laboModules: [baseLaboModule],
      mediaItems: [baseMedia],
    });

    const grouped = groupCareMapEventsByDate(events);
    expect(Object.keys(grouped)).toEqual([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
    ]);
    expect(grouped['2026-05-01']).toHaveLength(2);
    expect(grouped['2026-05-02']?.[0].type).toBe('appointment');
  });

  it('skips resources without date information', () => {
    const events = buildCareMapEvents({
      documents: [{ ...baseDoc, docPk: 3, confirmDate: null }],
      appointments: [{ ...baseAppointment, dateTime: '' }],
      laboModules: [{ ...baseLaboModule, sampleDate: undefined, items: [] }],
      mediaItems: [{ ...baseMedia, capturedAt: undefined }],
    });

    expect(events).toHaveLength(0);
  });
});
