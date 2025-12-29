import type { ChartsPrintMeta } from './outpatientClinicalDocument';
import type { DocumentPrintEntry } from './documentPrintPreviewStorage';
import { DOCUMENT_TYPE_LABELS } from '../documentTemplates';

type DocumentClinicalDocumentProps = {
  document: DocumentPrintEntry;
  printedAtIso: string;
  actor: string;
  facilityId: string;
  meta: ChartsPrintMeta;
};

const formatPrintedAt = (iso: string) => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return `${date.toLocaleDateString('ja-JP')} ${date.toLocaleTimeString('ja-JP')}`;
  } catch {
    return iso;
  }
};

const buildRows = (document: DocumentPrintEntry) => {
  const rows: Array<{ key: string; value: string }> = [];
  const form = document.form ?? {};
  if (document.type === 'referral') {
    rows.push(
      { key: '発行日', value: form.issuedAt ?? document.issuedAt },
      { key: '宛先医療機関', value: form.hospital ?? '-' },
      { key: '宛先医師', value: form.doctor ?? '-' },
      { key: '紹介目的', value: form.purpose ?? '-' },
      { key: '主病名', value: form.diagnosis ?? '-' },
      { key: '紹介内容', value: form.body ?? '-' },
    );
  } else if (document.type === 'certificate') {
    rows.push(
      { key: '発行日', value: form.issuedAt ?? document.issuedAt },
      { key: '提出先', value: form.submitTo ?? '-' },
      { key: '診断名', value: form.diagnosis ?? '-' },
      { key: '用途', value: form.purpose ?? '-' },
      { key: '所見', value: form.body ?? '-' },
    );
  } else {
    rows.push(
      { key: '発行日', value: form.issuedAt ?? document.issuedAt },
      { key: '返信先医療機関', value: form.hospital ?? '-' },
      { key: '返信先医師', value: form.doctor ?? '-' },
      { key: '返信内容', value: form.summary ?? '-' },
    );
  }
  return rows;
};

export function DocumentClinicalDocument({
  document,
  printedAtIso,
  actor,
  facilityId,
  meta,
}: DocumentClinicalDocumentProps) {
  const printedAt = formatPrintedAt(printedAtIso);
  const documentLabel = DOCUMENT_TYPE_LABELS[document.type] ?? '文書';
  const rows = buildRows(document);

  return (
    <div className="charts-print__paper" aria-label="文書印刷プレビュー（A4）">
      <article className="charts-print__page">
        <header className="charts-print__header">
          <div>
            <h1 className="charts-print__title">文書出力（{documentLabel}）</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
              テンプレ差し込み後のプレビューです。内容・出力先を必ず確認してください。
            </p>
          </div>
          <div className="charts-print__meta" aria-label="出力メタ情報">
            <div>施設: {facilityId}</div>
            <div>出力者: {actor}</div>
            <div>出力日時: {printedAt}</div>
            <div>RUN_ID: {meta.runId}</div>
          </div>
        </header>

        <section className="charts-print__section" aria-label="文書メタ">
          <h2>Document</h2>
          <div className="charts-print__grid">
            <div className="charts-print__row">
              <div className="charts-print__key">患者ID</div>
              <div className="charts-print__value">{document.patientId || '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">文書種別</div>
              <div className="charts-print__value">{documentLabel}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">文書タイトル</div>
              <div className="charts-print__value">{document.title}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">テンプレ</div>
              <div className="charts-print__value">{document.templateLabel}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">テンプレID</div>
              <div className="charts-print__value">{document.templateId || '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">保存日時</div>
              <div className="charts-print__value">{new Date(document.savedAt).toLocaleString('ja-JP')}</div>
            </div>
          </div>
        </section>

        <section className="charts-print__section" aria-label="文書内容">
          <h2>Content</h2>
          <div className="charts-print__grid">
            {rows.map((row) => (
              <div key={row.key} className="charts-print__row">
                <div className="charts-print__key">{row.key}</div>
                <div className="charts-print__value">{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="charts-print__section" aria-label="データソース情報">
          <h2>Source</h2>
          <div className="charts-print__grid">
            <div className="charts-print__row">
              <div className="charts-print__key">dataSourceTransition</div>
              <div className="charts-print__value">{meta.dataSourceTransition}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">cacheHit</div>
              <div className="charts-print__value">{String(meta.cacheHit)}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">missingMaster</div>
              <div className="charts-print__value">{String(meta.missingMaster)}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">fallbackUsed</div>
              <div className="charts-print__value">{String(meta.fallbackUsed)}</div>
            </div>
          </div>
        </section>

        <footer className="charts-print__footer" aria-label="フッター">
          <span>出力ID: {meta.runId}</span>
          <span>注意: 個人情報を含みます。取り扱いは施設規定に従ってください。</span>
        </footer>
      </article>
    </div>
  );
}
