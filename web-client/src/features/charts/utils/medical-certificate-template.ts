import type { MedicalCertificateDetail } from '@/features/charts/types/letter';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateLabel = (iso: string | null) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
};

export interface MedicalCertificatePrintContext {
  certificate: MedicalCertificateDetail;
  facilityName?: string;
  doctorName?: string | null;
}

export const buildMedicalCertificateHtml = ({
  certificate,
  facilityName,
  doctorName,
}: MedicalCertificatePrintContext) => {
  const issued = formatDateLabel(certificate.confirmedAt);
  const fields = [
    ['患者氏名', certificate.patientName],
    ['生年月日', certificate.patientBirthday],
    ['性別', certificate.patientGender],
    ['住所', certificate.patientAddress],
    ['電話', certificate.patientTelephone],
    ['疾患名', certificate.disease],
    ['記載事項', certificate.informedContent],
  ];

  const facility = [
    facilityName ? escapeHtml(facilityName) : '',
    certificate.consultantDept ? `診療科: ${escapeHtml(certificate.consultantDept)}` : '',
    certificate.consultantDoctor ? `担当医: ${escapeHtml(certificate.consultantDoctor)}` : '',
    certificate.consultantTelephone ? `電話: ${escapeHtml(certificate.consultantTelephone)}` : '',
    certificate.consultantAddress ? `住所: ${escapeHtml(certificate.consultantAddress)}` : '',
  ]
    .filter((line) => line.length > 0)
    .join('<br />');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(certificate.title)}</title>
  <style>
    body { font-family: 'Noto Sans JP', system-ui, sans-serif; margin: 40px; color: #111827; }
    h1 { font-size: 24px; margin-bottom: 24px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #d1d5db; padding: 12px; font-size: 15px; vertical-align: top; }
    th { width: 20%; background: #f3f4f6; text-align: left; }
    .footer { margin-top: 40px; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${escapeHtml(certificate.title || '診断書')}</h1>
  <p style="text-align:right; font-size:14px;">発行日: ${escapeHtml(issued)}</p>
  <table>
    ${fields
      .map(
        ([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value ?? '') || '&nbsp;'}</td></tr>`,
      )
      .join('\n')}
  </table>
  <div class="footer">
    ${facility}
    ${doctorName ? `<br />記載者: ${escapeHtml(doctorName)}` : ''}
  </div>
</body>
</html>`;
};
