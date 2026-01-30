export type DraftDirtySource = 'soap' | 'patient_memo';

export const draftSourceLabels: Record<DraftDirtySource, string> = {
  soap: 'SOAPドラフトが未保存',
  patient_memo: '患者メモの下書きが未保存',
};
