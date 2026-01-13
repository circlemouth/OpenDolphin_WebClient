import { FocusTrapDialog } from '../../../components/modals/FocusTrapDialog';
import { ORCA_REPORT_LABELS, type OrcaReportType } from '../orcaReportApi';
import type { PrintDestination, ReportFormState } from './useOrcaReportPrint';

const PRINT_DESTINATIONS: Array<{ value: PrintDestination; label: string; detail: string }> = [
  { value: 'outpatient', label: '診療記録（外来サマリ）', detail: 'ブラウザ印刷/エクスポート' },
  { value: 'prescription', label: ORCA_REPORT_LABELS.prescription, detail: 'ORCA帳票' },
  { value: 'medicinenotebook', label: ORCA_REPORT_LABELS.medicinenotebook, detail: 'ORCA帳票' },
  { value: 'karteno1', label: ORCA_REPORT_LABELS.karteno1, detail: 'ORCA帳票' },
  { value: 'karteno3', label: ORCA_REPORT_LABELS.karteno3, detail: 'ORCA帳票' },
  { value: 'invoicereceipt', label: ORCA_REPORT_LABELS.invoicereceipt, detail: 'ORCA帳票' },
  { value: 'statement', label: ORCA_REPORT_LABELS.statement, detail: 'ORCA帳票' },
];

type ReportPrintDialogProps = {
  open: boolean;
  runId: string;
  isRunning: boolean;
  onClose: () => void;
  onConfirmOutpatient: () => void;
  onConfirmReport: () => void;
  printDestination: PrintDestination;
  onDestinationChange: (value: PrintDestination) => void;
  reportForm: ReportFormState;
  onReportFieldChange: <T extends keyof ReportFormState>(key: T, value: ReportFormState[T]) => void;
  reportFieldErrors: string[];
  reportReady: boolean;
  reportIncomeStatus: 'idle' | 'loading' | 'success' | 'error';
  reportIncomeError: string | null;
  reportIncomeLatest?: { performDate?: string; invoiceNumber?: string };
  reportInvoiceOptions: string[];
  reportInsuranceOptions: string[];
  reportNeedsInvoice: boolean;
  reportNeedsOutsideClass: boolean;
  reportNeedsDepartment: boolean;
  reportNeedsInsurance: boolean;
  reportNeedsPerformMonth: boolean;
  resolvedReportType: OrcaReportType;
};

export function ReportPrintDialog({
  open,
  runId,
  isRunning,
  onClose,
  onConfirmOutpatient,
  onConfirmReport,
  printDestination,
  onDestinationChange,
  reportForm,
  onReportFieldChange,
  reportFieldErrors,
  reportReady,
  reportIncomeStatus,
  reportIncomeError,
  reportIncomeLatest,
  reportInvoiceOptions,
  reportInsuranceOptions,
  reportNeedsInvoice,
  reportNeedsOutsideClass,
  reportNeedsDepartment,
  reportNeedsInsurance,
  reportNeedsPerformMonth,
  resolvedReportType,
}: ReportPrintDialogProps) {
  return (
    <FocusTrapDialog
      open={open}
      role="dialog"
      title="印刷/帳票出力の確認"
      description={`個人情報を含む帳票を表示します。画面共有/第三者の閲覧に注意してください。（runId=${runId}）`}
      onClose={onClose}
      testId="charts-print-dialog"
    >
      <div className="charts-actions__print-dialog" role="group" aria-label="印刷/帳票出力の確認">
        <div className="charts-actions__print-field">
          <label htmlFor="charts-print-destination">帳票種別</label>
          <select
            id="charts-print-destination"
            value={printDestination}
            onChange={(event) => {
              onDestinationChange(event.target.value as PrintDestination);
            }}
          >
            {PRINT_DESTINATIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}（{entry.detail}）
              </option>
            ))}
          </select>
        </div>

        {printDestination !== 'outpatient' && (
          <>
            {reportIncomeStatus === 'loading' && <p className="charts-actions__print-note">収納情報を取得中…</p>}
            {reportIncomeStatus === 'error' && reportIncomeError && (
              <p className="charts-actions__print-note charts-actions__print-note--error">収納情報の取得に失敗: {reportIncomeError}</p>
            )}
            {reportIncomeLatest?.performDate && (
              <p className="charts-actions__print-note">
                参考: 最新収納 {reportIncomeLatest.performDate} / 伝票番号 {reportIncomeLatest.invoiceNumber ?? '—'}
              </p>
            )}

            {reportNeedsInvoice && (
              <div className="charts-actions__print-field">
                <label htmlFor="charts-print-invoice">伝票番号（Invoice_Number）*</label>
                <input
                  id="charts-print-invoice"
                  list="charts-print-invoice-options"
                  value={reportForm.invoiceNumber}
                  onChange={(event) => {
                    onReportFieldChange('invoiceNumber', event.target.value);
                  }}
                  placeholder="例: 0002375"
                />
                {reportInvoiceOptions.length > 0 && (
                  <datalist id="charts-print-invoice-options">
                    {reportInvoiceOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                )}
              </div>
            )}

            {reportNeedsOutsideClass && (
              <div className="charts-actions__print-field">
                <label htmlFor="charts-print-outside">院外処方区分（Outside_Class）</label>
                <select
                  id="charts-print-outside"
                  value={reportForm.outsideClass}
                  onChange={(event) => {
                    onReportFieldChange('outsideClass', event.target.value as ReportFormState['outsideClass']);
                  }}
                >
                  <option value="False">院内</option>
                  <option value="True">院外</option>
                </select>
              </div>
            )}

            {reportNeedsDepartment && (
              <div className="charts-actions__print-field">
                <label htmlFor="charts-print-department">
                  診療科コード（Department_Code）{resolvedReportType === 'karteno1' ? '*' : ''}
                </label>
                <input
                  id="charts-print-department"
                  value={reportForm.departmentCode}
                  onChange={(event) => {
                    onReportFieldChange('departmentCode', event.target.value);
                  }}
                  placeholder="例: 01"
                />
              </div>
            )}

            {reportNeedsInsurance && (
              <div className="charts-actions__print-field">
                <label htmlFor="charts-print-insurance">保険組合せ番号{resolvedReportType === 'karteno1' ? '*' : ''}</label>
                <input
                  id="charts-print-insurance"
                  list="charts-print-insurance-options"
                  value={reportForm.insuranceCombinationNumber}
                  onChange={(event) => {
                    onReportFieldChange('insuranceCombinationNumber', event.target.value);
                  }}
                  placeholder="例: 0001"
                />
                {reportInsuranceOptions.length > 0 && (
                  <datalist id="charts-print-insurance-options">
                    {reportInsuranceOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                )}
              </div>
            )}

            {reportNeedsPerformMonth && (
              <div className="charts-actions__print-field">
                <label htmlFor="charts-print-perform-month">対象月（Perform_Month）*</label>
                <input
                  id="charts-print-perform-month"
                  type="month"
                  value={reportForm.performMonth}
                  onChange={(event) => {
                    onReportFieldChange('performMonth', event.target.value);
                  }}
                />
              </div>
            )}
          </>
        )}

        {reportFieldErrors.length > 0 && printDestination !== 'outpatient' && (
          <div className="charts-actions__print-errors" role="alert">
            {reportFieldErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="charts-actions__print-actions" role="group" aria-label="印刷/帳票出力の確認">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            disabled={printDestination !== 'outpatient' && (!reportReady || isRunning)}
            onClick={() => {
              if (printDestination === 'outpatient') {
                onConfirmOutpatient();
              } else {
                onConfirmReport();
              }
            }}
          >
            開く
          </button>
        </div>
      </div>
    </FocusTrapDialog>
  );
}
