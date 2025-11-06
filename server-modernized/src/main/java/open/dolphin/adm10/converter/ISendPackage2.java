package open.dolphin.adm10.converter;

import java.util.List;
import open.dolphin.infomodel.ChartEventModel;
import open.dolphin.infomodel.DiagnosisSendWrapper;
import open.dolphin.infomodel.DocumentModel;

/**
 * VisitTouch / EHR Touch 送信パッケージ (FreeText 対応版)。
 */
public class ISendPackage2 {

    private IChartEvent chartEvent;
    private IDocument2 document;
    private IDiagnosisSendWrapper diagnosisSendWrapper;
    private List<String> deletedDiagnosis;

    public IChartEvent getChartEvent() {
        return chartEvent;
    }

    public void setChartEvent(IChartEvent chartEventModel) {
        this.chartEvent = chartEventModel;
    }

    public IDocument2 getDocument() {
        return document;
    }

    public void setDocument(IDocument2 document) {
        this.document = document;
    }

    public IDiagnosisSendWrapper getDiagnosisSendWrapper() {
        return diagnosisSendWrapper;
    }

    public void setDiagnosisSendWrapper(IDiagnosisSendWrapper diagnosisSendWrapper) {
        this.diagnosisSendWrapper = diagnosisSendWrapper;
    }

    public List<String> getDeletedDiagnosis() {
        return deletedDiagnosis;
    }

    public void setDeletedDiagnosis(List<String> deletedDiagnosis) {
        this.deletedDiagnosis = deletedDiagnosis;
    }

    public ChartEventModel chartEventModel() {
        return chartEvent != null ? chartEvent.toModel() : null;
    }

    public DocumentModel documentModel() {
        return document != null ? document.toModel() : null;
    }

    public DiagnosisSendWrapper diagnosisSendWrapperModel() {
        return diagnosisSendWrapper != null ? diagnosisSendWrapper.toModel() : null;
    }

    public List<String> deletedDiagnsis() {
        return (deletedDiagnosis != null && !deletedDiagnosis.isEmpty()) ? deletedDiagnosis : null;
    }
}

