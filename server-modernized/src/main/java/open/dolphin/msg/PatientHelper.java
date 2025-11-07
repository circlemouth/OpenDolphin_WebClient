package open.dolphin.msg;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import open.dolphin.infomodel.PVTHealthInsuranceModel;
import open.dolphin.infomodel.PatientModel;
import open.dolphin.infomodel.RegisteredDiagnosisModel;
import org.apache.commons.lang3.SerializationUtils;

/**
 *
 * @author kazushi
 */
public class PatientHelper {
    
    private PatientModel patient;
    private List<RegisteredDiagnosisModel> diagnosisList;
    private String confirmDate;
    private String facility;
    
    public String getPatientId() {
        return getPatient().getPatientId();
    }
    
    public String getPatientFamily(){
        return getPatient().getFamilyName();
    }
    
    public String getPatientGiven(){
        return getPatient().getGivenName();
    }
    
    public String getPatientName(){
        return getPatient().getFullName();
    }
    
    public String getPatientKanaFamily(){
        return getPatient().getKanaFamilyName();
    }
    
    public String getPatientKanaGiven(){
        return getPatient().getKanaGivenName();
    }
    
    public String getPatientKanaName(){
        return getPatient().getKanaName();
    }
    
    public String getPatientBirthday(){
        return getPatient().getBirthday();
    }
    
    public String getPatientGender(){
        return getPatient().getGender();
    }
    
    public String getPatientAddress(){
        return getPatient().getSimpleAddressModel()!=null ? getPatient().getSimpleAddressModel().getAddress() : null;
    }
    
    public String getPatientZip(){
        return getPatient().getSimpleAddressModel()!=null ? getPatient().getSimpleAddressModel().getZipCode() : null;
    }
    
    public String getPatientTelephone(){
        return getPatient().getTelephone();
    }
    
    public List<PVTHealthInsuranceModel> getInsurances() {
        PatientModel snapshot = getPatient();
        if (snapshot == null) {
            return null;
        }
        return immutableInsuranceList(snapshot.getPvtHealthInsurances());
    }
    
    public List<RegisteredDiagnosisModel> getDiagnosisModuleItems() {
        return getDiagnosisList();
    }

    public PatientModel getPatient() {
        return patient == null ? null : SerializationUtils.clone(patient);
    }

    public void setPatient(PatientModel patient) {
        this.patient = patient == null ? null : SerializationUtils.clone(patient);
    }

    public List<RegisteredDiagnosisModel> getDiagnosisList() {
        return immutableDiagnosisList(diagnosisList);
    }

    public void setDiagnosisList(List<RegisteredDiagnosisModel> diagnosisList) {
        this.diagnosisList = immutableDiagnosisList(diagnosisList);
    }
    
    public void setFacility(String f) {
        this.facility = f;
    }
    
    public String getCreatorId() {
        return facility;
    }
    
    public String getCreatorName() {
        return facility;
    }
    
    public String getGenerationPurpose() {
        return "PHR Project";
    }
    
    public String getConfirmDate() {
        if (confirmDate==null) {
            confirmDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(new Date());
        }
        return confirmDate;
    }
    
    public String getDocId() {
        String uuid = UUID.randomUUID().toString();
        return uuid.replaceAll("-", "");
    }

    private static List<RegisteredDiagnosisModel> immutableDiagnosisList(List<RegisteredDiagnosisModel> source) {
        if (source == null) {
            return null;
        }
        List<RegisteredDiagnosisModel> copy = new ArrayList<>(source.size());
        for (RegisteredDiagnosisModel model : source) {
            copy.add(model == null ? null : SerializationUtils.clone(model));
        }
        return Collections.unmodifiableList(copy);
    }

    private static List<PVTHealthInsuranceModel> immutableInsuranceList(List<PVTHealthInsuranceModel> source) {
        if (source == null) {
            return null;
        }
        List<PVTHealthInsuranceModel> copy = new ArrayList<>(source.size());
        for (PVTHealthInsuranceModel model : source) {
            copy.add(model == null ? null : SerializationUtils.clone(model));
        }
        return Collections.unmodifiableList(copy);
    }
}
