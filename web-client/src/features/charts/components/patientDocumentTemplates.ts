export interface PatientSummaryInfo {
  id: string;
  name: string;
  gender?: string;
  birthday?: string;
}

interface TemplateContext {
  patient: PatientSummaryInfo;
  facilityName?: string;
  doctorName?: string;
  memo?: string;
  extraNote?: string;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  buildHtml: (context: TemplateContext) => string;
}

export interface PatientDocumentPreviewPayload {
  templateId: string;
  templateLabel: string;
  html: string;
  patient: PatientSummaryInfo;
  facilityName?: string;
  doctorName?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toJaDate = (date: Date) =>
  date
    .toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    .replace('年', '年 ')
    .replace('月', '月 ')
    .replace('日', '日');

export const buildInstructionHtml = ({ patient, facilityName, doctorName, memo, extraNote }: TemplateContext) => {
  const today = toJaDate(new Date());
  const memoHtml = memo ? `<p>個別指示: ${escapeHtml(memo)}</p>` : '';
  const extraHtml = extraNote ? `<p>備考: ${escapeHtml(extraNote)}</p>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>生活指導文 - ${escapeHtml(patient.name)}</title>
  <style>
    body { font-family: 'Noto Sans JP', system-ui, sans-serif; margin: 32px; line-height: 1.6; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    h2 { font-size: 18px; margin: 24px 0 12px; }
    .meta { margin-bottom: 24px; font-size: 14px; }
    footer { margin-top: 48px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>生活指導文</h1>
  <div class="meta">
    <p>患者氏名: ${escapeHtml(patient.name)}（ID: ${escapeHtml(patient.id)}）</p>
    ${patient.gender ? `<p>性別: ${escapeHtml(patient.gender)}</p>` : ''}
    ${patient.birthday ? `<p>生年月日: ${escapeHtml(patient.birthday)}</p>` : ''}
    <p>作成日: ${escapeHtml(today)}</p>
  </div>
  <section>
    <h2>指導内容</h2>
    <p>1. 栄養バランスを意識し、減塩・減糖を心掛けてください。</p>
    <p>2. 1日30分程度の有酸素運動（散歩・ストレッチなど）を継続してください。</p>
    <p>3. 内服薬の飲み忘れを防ぐため、服薬記録やピルケースの活用を推奨します。</p>
    <p>4. 体調変化（息切れ、むくみ、胸痛など）があれば早めにご相談ください。</p>
    ${memoHtml}
    ${extraHtml}
  </section>
  <footer>
    <p>${facilityName ? escapeHtml(facilityName) : ''}</p>
    <p>${doctorName ? `担当: ${escapeHtml(doctorName)}` : ''}</p>
  </footer>
</body>
</html>`;
};

export const buildReferralHtml = ({ patient, facilityName, doctorName, memo, extraNote }: TemplateContext) => {
  const today = toJaDate(new Date());
  const memoHtml = memo ? `<p>現病歴要約: ${escapeHtml(memo)}</p>` : '';
  const extraHtml = extraNote ? `<p>特記事項: ${escapeHtml(extraNote)}</p>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>紹介状 - ${escapeHtml(patient.name)}</title>
  <style>
    body { font-family: 'Noto Sans JP', system-ui, sans-serif; margin: 32px; line-height: 1.6; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    h2 { font-size: 18px; margin: 24px 0 12px; }
    .meta { margin-bottom: 24px; font-size: 14px; }
    footer { margin-top: 48px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>診療情報提供書（紹介状）</h1>
  <div class="meta">
    <p>患者氏名: ${escapeHtml(patient.name)}（ID: ${escapeHtml(patient.id)}）</p>
    ${patient.gender ? `<p>性別: ${escapeHtml(patient.gender)}</p>` : ''}
    ${patient.birthday ? `<p>生年月日: ${escapeHtml(patient.birthday)}</p>` : ''}
    <p>作成日: ${escapeHtml(today)}</p>
  </div>
  <section>
    <h2>主訴・経過</h2>
    <p>貴院への紹介目的は、精査加療の継続および専門的評価です。</p>
    ${memoHtml || '<p>診察所見・検査結果はカルテ参照。</p>'}
  </section>
  <section>
    <h2>処方・指示</h2>
    <p>現在の処方内容とアレルギー歴はカルテに記載の通りです。</p>
    ${extraHtml}
  </section>
  <footer>
    <p>${facilityName ? escapeHtml(facilityName) : ''}</p>
    <p>${doctorName ? `担当医: ${escapeHtml(doctorName)}` : ''}</p>
  </footer>
</body>
</html>`;
};

export const buildVaccinationConsentHtml = ({ patient, facilityName, doctorName, memo, extraNote }: TemplateContext) => {
  const today = toJaDate(new Date());
  const memoHtml = memo ? `<p>接種に関する確認事項: ${escapeHtml(memo)}</p>` : '';
  const extraHtml = extraNote ? `<p>備考: ${escapeHtml(extraNote)}</p>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>予防接種同意書 - ${escapeHtml(patient.name)}</title>
  <style>
    body { font-family: 'Noto Sans JP', system-ui, sans-serif; margin: 32px; line-height: 1.6; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    h2 { font-size: 18px; margin: 24px 0 12px; }
    .meta { margin-bottom: 24px; font-size: 14px; }
    .consent { margin-top: 24px; font-size: 15px; }
  </style>
</head>
<body>
  <h1>予防接種同意書</h1>
  <div class="meta">
    <p>患者氏名: ${escapeHtml(patient.name)}（ID: ${escapeHtml(patient.id)}）</p>
    ${patient.gender ? `<p>性別: ${escapeHtml(patient.gender)}</p>` : ''}
    ${patient.birthday ? `<p>生年月日: ${escapeHtml(patient.birthday)}</p>` : ''}
    <p>作成日: ${escapeHtml(today)}</p>
  </div>
  <section>
    <h2>接種予定ワクチン</h2>
    <p>種類: _____________________________</p>
    <p>接種予定日: ______________________</p>
    ${memoHtml}
  </section>
  <section>
    <h2>確認事項</h2>
    <ol>
      <li>説明を受け、効果と副反応について理解しました。</li>
      <li>体調は良好であり、医師と相談した上で接種に同意します。</li>
      <li>副反応が疑われる症状が出現した場合、速やかに医療機関へ連絡します。</li>
    </ol>
    ${extraHtml}
  </section>
  <section class="consent">
    <p>上記内容を理解した上で、予防接種に同意します。</p>
    <p>署名: ______________________________</p>
  </section>
  <footer>
    <p>${facilityName ? escapeHtml(facilityName) : ''}</p>
    <p>${doctorName ? `担当医: ${escapeHtml(doctorName)}` : ''}</p>
  </footer>
</body>
</html>`;
};

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'instruction',
    label: '生活指導文（慢性疾患）',
    description: '生活習慣病患者への汎用指導文テンプレート',
    buildHtml: buildInstructionHtml,
  },
  {
    id: 'referral',
    label: '診療情報提供書（紹介状）',
    description: '紹介状ひな形。精査依頼や治療継続を想定。',
    buildHtml: buildReferralHtml,
  },
  {
    id: 'vaccination-consent',
    label: '予防接種同意書',
    description: 'ワクチン接種時の同意確認と説明内容の控え。',
    buildHtml: buildVaccinationConsentHtml,
  },
];
