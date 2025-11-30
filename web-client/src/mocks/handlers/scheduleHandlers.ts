import { HttpResponse, http } from 'msw';

const samplePatientList = [
  {
    id: 1,
    patientId: '0000001',
    fullName: '山田 太郎',
    kanaName: 'ヤマダ タロウ',
    gender: 'M',
    genderDesc: '男性',
    birthday: '1982-04-01',
    pvtDate: '2025-11-26',
    telephone: '03-0000-0001',
    simpleAddressModel: {
      zipCode: '1000001',
      address: '東京都千代田区千代田1-1',
    },
  },
  {
    id: 2,
    patientId: '0000002',
    fullName: '鈴木 花子',
    kanaName: 'スズキ ハナコ',
    gender: 'F',
    genderDesc: '女性',
    birthday: '1990-02-14',
    pvtDate: '2025-11-26',
    telephone: '03-0000-0002',
    simpleAddressModel: {
      zipCode: '1500001',
      address: '東京都渋谷区神南1-19-11',
    },
  },
];

const scheduleVisit = {
  id: 100,
  facilityId: '1.3.6.1.4.1.9414.72.101',
  pvtDate: '2025-11-29T15:40:00+09:00',
  appointment: '外来',
  department: '内科',
  departmentName: '内科',
  state: 0,
  memo: '定期診察',
  doctorId: 'doctor1',
  doctorName: '山田 医師',
  jmariNumber: '0',
  patientModel: {
    id: 1,
    patientId: '0000001',
    fullName: '山田 太郎',
    kanaName: 'ヤマダ タロウ',
    gender: 'M',
    birthday: '1982-04-01',
    ownerUUID: 'admin-device',
    pvtDate: '2025-11-29T15:40:00+09:00',
    firstInsurance: '保険1',
    simpleAddressModel: {
      zipCode: '1000001',
      address: '東京都千代田区千代田1-1',
    },
  },
};

const scheduleResponse = { list: [scheduleVisit] };

export const scheduleHandlers = [
  http.get('*/schedule/pvt/:date', () => HttpResponse.json(scheduleResponse)),
  http.get('*/patient/all', () =>
    HttpResponse.json({
      list: samplePatientList,
    }),
  ),
  http.get('*/patient/custom/:condition', ({ params }) => {
    const condition = String(params?.condition ?? '').toLowerCase();
    return HttpResponse.json({
      list: samplePatientList.filter((patient) =>
        (patient.fullName ?? '').toLowerCase().includes(condition),
      ),
    });
  }),
  http.get('*/patient/count/:prefix', ({ params }) => {
    const prefix = String(params?.prefix ?? '').trim();
    const count = samplePatientList.filter((patient) =>
      (patient.patientId ?? '').startsWith(prefix),
    ).length;
    return HttpResponse.text(`${count}`);
  }),
];
