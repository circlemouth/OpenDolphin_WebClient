import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@/test/test-utils';
import { PatientDocumentsPanel, type PatientDocumentPreviewPayload } from '@/features/charts/components/PatientDocumentsPanel';
import {
  buildInstructionHtml,
  buildReferralHtml,
  buildVaccinationConsentHtml,
} from '@/features/charts/components/patientDocumentTemplates';

const patient = {
  id: 'P001',
  name: '患者 太郎',
  gender: 'M',
  birthday: '1980-05-01',
};

describe('PatientDocumentsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('generates html templates with patient metadata', () => {
    const context = { patient };

    const instruction = buildInstructionHtml(context);
    const referral = buildReferralHtml(context);
    const consent = buildVaccinationConsentHtml(context);

    expect(instruction).toContain('生活指導文');
    expect(instruction).toContain(patient.name);
    expect(referral).toContain('診療情報提供書');
    expect(consent).toContain('予防接種同意書');
    expect(consent).toContain(patient.id);
  });

  it('opens preview window and notifies callback when available', async () => {
    const user = userEvent.setup();
    const previewWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      focus: vi.fn(),
      print: vi.fn(),
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(previewWindow);
    const onPreviewGenerated = vi.fn<(payload: PatientDocumentPreviewPayload) => void>();

    render(
      <PatientDocumentsPanel
        patient={patient}
        facilityName="OpenDolphin Clinic"
        doctorName="医師 太郎"
        onPreviewGenerated={onPreviewGenerated}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'プレビュー / PDF 保存' }));

    expect(onPreviewGenerated).toHaveBeenCalledTimes(1);
    expect(onPreviewGenerated.mock.calls[0][0].html).toContain(patient.name);
    expect(window.open).toHaveBeenCalledOnce();
    expect(previewWindow.document.write).toHaveBeenCalled();
    expect(previewWindow.print).toHaveBeenCalled();
    expect(screen.getByText('プレビュー用ウィンドウを開きました。印刷ダイアログから PDF 保存ができます。')).toBeInTheDocument();
  });

  it('falls back to blob download when pop-up is blocked', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'open').mockReturnValue(null);
    const createObjectURL = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:preview');
    const revokeObjectURL = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, 'click');
    const onPreviewGenerated = vi.fn<(payload: PatientDocumentPreviewPayload) => void>();

    render(
      <PatientDocumentsPanel
        patient={patient}
        facilityName="OpenDolphin Clinic"
        doctorName="医師 太郎"
        onPreviewGenerated={onPreviewGenerated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'プレビュー / PDF 保存' }));

    expect(onPreviewGenerated).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalled();
    expect(screen.getByText('プレビューウィンドウを開けないため、HTMLファイルをダウンロードしました。開いて印刷してください。')).toBeInTheDocument();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
