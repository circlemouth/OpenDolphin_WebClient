package open.dolphin.msg;

import open.dolphin.infomodel.DocInfoModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import org.apache.commons.lang3.SerializationUtils;

/**
 *
 * @author Kazushi Minagawa.
 */
public class DiagnosisModuleItem {
    
    // DocInfo
    private DocInfoModel docInfo;
    
    // RegisteredDiagnosisModel
    private RegisteredDiagnosisModel registeredDiagnosisModule;
    
    /** Creates a new instance of DiagnosisModuleItem */
    public DiagnosisModuleItem() {
    }

    public DocInfoModel getDocInfo() {
        return docInfo == null ? null : SerializationUtils.clone(docInfo);
    }

    public void setDocInfo(DocInfoModel docInfo) {
        this.docInfo = docInfo == null ? null : SerializationUtils.clone(docInfo);
    }

    public RegisteredDiagnosisModel getRegisteredDiagnosisModule() {
        return registeredDiagnosisModule == null ? null : SerializationUtils.clone(registeredDiagnosisModule);
    }

    public void setRegisteredDiagnosisModule(RegisteredDiagnosisModel registeredDiagnosisModule) {
        this.registeredDiagnosisModule = registeredDiagnosisModule == null
                ? null
                : SerializationUtils.clone(registeredDiagnosisModule);
    }
}
