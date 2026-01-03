import type { ReceptionEntry } from '../../reception/api';
import type { DataSourceTransition } from '../authService';

export type ChartsPrintMeta = {
  runId: string;
  cacheHit: boolean;
  missingMaster: boolean;
  fallbackUsed: boolean;
  dataSourceTransition: DataSourceTransition;
};

type OutpatientClinicalDocumentProps = {
  entry: ReceptionEntry;
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

export function OutpatientClinicalDocument({
  entry,
  printedAtIso,
  actor,
  facilityId,
  meta,
}: OutpatientClinicalDocumentProps) {
  const printedAt = formatPrintedAt(printedAtIso);
  return (
    <div className="charts-print__paper" aria-label="印刷プレビュー（A4）">
      <article className="charts-print__page">
        <header className="charts-print__header">
          <div>
            <h1 className="charts-print__title">診療記録（外来サマリ）</h1>
            <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
              本出力は Web クライアントの診療文書出力です。実運用では施設規定・監査要件に従ってください。
            </p>
          </div>
          <div className="charts-print__meta" aria-label="出力メタ情報">
            <div>施設: {facilityId}</div>
            <div>出力者: {actor}</div>
            <div>出力日時: {printedAt}</div>
            <div>RUN_ID: {meta.runId}</div>
          </div>
        </header>

        <section className="charts-print__section" aria-label="患者情報">
          <h2>Patient</h2>
          <div className="charts-print__grid">
            <div className="charts-print__row">
              <div className="charts-print__key">患者ID</div>
              <div className="charts-print__value">{entry.patientId ?? entry.id}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">氏名</div>
              <div className="charts-print__value">{entry.name}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">カナ</div>
              <div className="charts-print__value">{entry.kana ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">生年月日</div>
              <div className="charts-print__value">{entry.birthDate ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">性別</div>
              <div className="charts-print__value">{entry.sex ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">保険</div>
              <div className="charts-print__value">{entry.insurance ?? '-'}</div>
            </div>
          </div>
        </section>

        <section className="charts-print__section" aria-label="受付・診療情報">
          <h2>Encounter</h2>
          <div className="charts-print__grid">
            <div className="charts-print__row">
              <div className="charts-print__key">受付ID/予約ID</div>
              <div className="charts-print__value">{entry.appointmentId ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">受付状態</div>
              <div className="charts-print__value">{entry.status ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">診療科</div>
              <div className="charts-print__value">{entry.department ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">担当医</div>
              <div className="charts-print__value">{entry.physician ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">来院時刻</div>
              <div className="charts-print__value">{entry.appointmentTime ?? '-'}</div>
            </div>
            <div className="charts-print__row">
              <div className="charts-print__key">メモ</div>
              <div className="charts-print__value">{entry.note ?? '-'}</div>
            </div>
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
