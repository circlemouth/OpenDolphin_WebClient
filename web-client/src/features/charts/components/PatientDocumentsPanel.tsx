import { useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, SelectField, Stack, SurfaceCard, TextArea, TextField } from '@/components';
import { PatientDocumentPreviewPayload, PatientSummaryInfo, TEMPLATE_DEFINITIONS } from './patientDocumentTemplates';

interface PatientDocumentsPanelProps {
  patient?: PatientSummaryInfo | null;
  facilityName?: string;
  doctorName?: string;
  disabled?: boolean;
  onPreviewGenerated?: (payload: PatientDocumentPreviewPayload) => void;
}

const InlineMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const buildDownloadFileName = (templateId: string, patientId: string) => `${templateId}_${patientId}.html`;

export const PatientDocumentsPanel = ({
  patient,
  facilityName,
  doctorName,
  disabled,
  onPreviewGenerated,
}: PatientDocumentsPanelProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_DEFINITIONS[0].id);
  const [memo, setMemo] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const options = useMemo(
    () => TEMPLATE_DEFINITIONS.map((template) => ({ value: template.id, label: template.label })),
    [],
  );

  const currentTemplate = useMemo(
    () => TEMPLATE_DEFINITIONS.find((template) => template.id === selectedTemplate) ?? TEMPLATE_DEFINITIONS[0],
    [selectedTemplate],
  );

  const handlePreview = () => {
    setInfo(null);

    if (!patient) {
      setError('患者を選択してから文書テンプレートを利用してください。');
      return;
    }

    if (typeof window === 'undefined') {
      setError('ブラウザ環境でのみ利用できます。');
      return;
    }

    try {
      const html = currentTemplate.buildHtml({ patient, facilityName, doctorName, memo, extraNote });
      onPreviewGenerated?.({
        templateId: currentTemplate.id,
        templateLabel: currentTemplate.label,
        html,
        patient,
        facilityName,
        doctorName,
      });

      const preview = window.open('', '_blank');
      if (!preview) {
        if (window.URL?.createObjectURL) {
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const anchor = window.document.createElement('a');
          anchor.href = url;
          anchor.download = buildDownloadFileName(currentTemplate.id, patient.id);
          anchor.rel = 'noopener';
          anchor.click();
          window.setTimeout(() => {
            if (window.URL?.revokeObjectURL) {
              window.URL.revokeObjectURL(url);
            }
          }, 1000);
          setError(null);
          setInfo('プレビューウィンドウを開けないため、HTMLファイルをダウンロードしました。開いて印刷してください。');
          return;
        }
        setError('プレビューウィンドウを開けませんでした。ブラウザ設定をご確認ください。');
        return;
      }
      preview.document.open();
      preview.document.write(html);
      preview.document.close();
      preview.focus();
      preview.print();
      setError(null);
      setInfo('プレビュー用ウィンドウを開きました。印刷ダイアログから PDF 保存ができます。');
    } catch (previewError) {
      console.error('テンプレートのプレビューに失敗しました', previewError);
      setError('テンプレートのプレビューでエラーが発生しました。');
      setInfo(null);
    }
  };

  return (
    <SurfaceCard tone="muted">
      <Stack gap={12}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>患者向け文書テンプレート</h2>
          <InlineMessage>
            指導文や紹介状の雛形を呼び出し、ブラウザの印刷ダイアログから PDF として保存できます。
          </InlineMessage>
        </div>

        <SelectField
          label="テンプレート"
          options={options}
          value={selectedTemplate}
          onChange={(event) => setSelectedTemplate(event.currentTarget.value)}
          disabled={disabled}
          description={currentTemplate.description}
        />

        <TextArea
          label="本文追記"
          placeholder="診療の所見や依頼事項などを追記"
          value={memo}
          onChange={(event) => setMemo(event.currentTarget.value)}
          rows={4}
          disabled={disabled}
        />

        <TextField
          label="備考"
          placeholder="必要に応じて特記事項を入力"
          value={extraNote}
          onChange={(event) => setExtraNote(event.currentTarget.value)}
          disabled={disabled}
        />

        <Button type="button" variant="secondary" onClick={handlePreview} disabled={disabled}>
          プレビュー / PDF 保存
        </Button>

        {error ? <InlineError>{error}</InlineError> : null}
        {info ? <InlineMessage>{info}</InlineMessage> : null}
        {!patient ? <InlineMessage>カルテを開くと患者情報が自動で差し込まれます。</InlineMessage> : null}
      </Stack>
    </SurfaceCard>
  );
};

