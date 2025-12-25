package open.dolphin.rest.dto.outpatient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Outpatient medical summary response for charts.
 */
public class MedicalOutpatientResponse {

    private String runId;
    private String traceId;
    private String requestId;
    private String dataSource;
    private String dataSourceTransition;
    private boolean cacheHit;
    private boolean missingMaster;
    private boolean fallbackUsed;
    private String fetchedAt;
    private Integer recordsReturned;
    private String outcome;
    private List<MedicalOutpatientEntry> outpatientList = new ArrayList<>();
    private OutpatientFlagResponse.AuditEvent auditEvent;

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getDataSourceTransition() {
        return dataSourceTransition;
    }

    public void setDataSourceTransition(String dataSourceTransition) {
        this.dataSourceTransition = dataSourceTransition;
    }

    public boolean isCacheHit() {
        return cacheHit;
    }

    public void setCacheHit(boolean cacheHit) {
        this.cacheHit = cacheHit;
    }

    public boolean isMissingMaster() {
        return missingMaster;
    }

    public void setMissingMaster(boolean missingMaster) {
        this.missingMaster = missingMaster;
    }

    public boolean isFallbackUsed() {
        return fallbackUsed;
    }

    public void setFallbackUsed(boolean fallbackUsed) {
        this.fallbackUsed = fallbackUsed;
    }

    public String getFetchedAt() {
        return fetchedAt;
    }

    public void setFetchedAt(String fetchedAt) {
        this.fetchedAt = fetchedAt;
    }

    public Integer getRecordsReturned() {
        return recordsReturned;
    }

    public void setRecordsReturned(Integer recordsReturned) {
        this.recordsReturned = recordsReturned;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public List<MedicalOutpatientEntry> getOutpatientList() {
        return outpatientList;
    }

    public void setOutpatientList(List<MedicalOutpatientEntry> outpatientList) {
        this.outpatientList = outpatientList != null ? outpatientList : new ArrayList<>();
    }

    public OutpatientFlagResponse.AuditEvent getAuditEvent() {
        return auditEvent;
    }

    public void setAuditEvent(OutpatientFlagResponse.AuditEvent auditEvent) {
        this.auditEvent = auditEvent;
    }

    public static class MedicalOutpatientEntry {
        private String voucherNumber;
        private String appointmentId;
        private String department;
        private String physician;
        private String outcome;
        private Integer recordsReturned;
        private PatientSummary patient;
        private Map<String, MedicalSection> sections = new LinkedHashMap<>();

        public String getVoucherNumber() {
            return voucherNumber;
        }

        public void setVoucherNumber(String voucherNumber) {
            this.voucherNumber = voucherNumber;
        }

        public String getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(String appointmentId) {
            this.appointmentId = appointmentId;
        }

        public String getDepartment() {
            return department;
        }

        public void setDepartment(String department) {
            this.department = department;
        }

        public String getPhysician() {
            return physician;
        }

        public void setPhysician(String physician) {
            this.physician = physician;
        }

        public String getOutcome() {
            return outcome;
        }

        public void setOutcome(String outcome) {
            this.outcome = outcome;
        }

        public Integer getRecordsReturned() {
            return recordsReturned;
        }

        public void setRecordsReturned(Integer recordsReturned) {
            this.recordsReturned = recordsReturned;
        }

        public PatientSummary getPatient() {
            return patient;
        }

        public void setPatient(PatientSummary patient) {
            this.patient = patient;
        }

        public Map<String, MedicalSection> getSections() {
            return sections;
        }

        public void setSections(Map<String, MedicalSection> sections) {
            this.sections = sections != null ? sections : new LinkedHashMap<>();
        }
    }

    public static class PatientSummary {
        private String patientId;
        private String wholeName;
        private String wholeNameKana;
        private String birthDate;
        private String sex;

        public String getPatientId() {
            return patientId;
        }

        public void setPatientId(String patientId) {
            this.patientId = patientId;
        }

        public String getWholeName() {
            return wholeName;
        }

        public void setWholeName(String wholeName) {
            this.wholeName = wholeName;
        }

        public String getWholeNameKana() {
            return wholeNameKana;
        }

        public void setWholeNameKana(String wholeNameKana) {
            this.wholeNameKana = wholeNameKana;
        }

        public String getBirthDate() {
            return birthDate;
        }

        public void setBirthDate(String birthDate) {
            this.birthDate = birthDate;
        }

        public String getSex() {
            return sex;
        }

        public void setSex(String sex) {
            this.sex = sex;
        }
    }

    public static class MedicalSection {
        private String outcome;
        private Integer recordsReturned;
        private String message;
        private List<MedicalSectionItem> items = new ArrayList<>();

        public String getOutcome() {
            return outcome;
        }

        public void setOutcome(String outcome) {
            this.outcome = outcome;
        }

        public Integer getRecordsReturned() {
            return recordsReturned;
        }

        public void setRecordsReturned(Integer recordsReturned) {
            this.recordsReturned = recordsReturned;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public List<MedicalSectionItem> getItems() {
            return items;
        }

        public void setItems(List<MedicalSectionItem> items) {
            this.items = items != null ? items : new ArrayList<>();
        }
    }

    public static class MedicalSectionItem {
        private String name;
        private String code;
        private String date;
        private String status;
        private String dose;
        private String frequency;
        private String days;
        private String result;
        private String value;
        private String unit;
        private String text;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getDose() {
            return dose;
        }

        public void setDose(String dose) {
            this.dose = dose;
        }

        public String getFrequency() {
            return frequency;
        }

        public void setFrequency(String frequency) {
            this.frequency = frequency;
        }

        public String getDays() {
            return days;
        }

        public void setDays(String days) {
            this.days = days;
        }

        public String getResult() {
            return result;
        }

        public void setResult(String result) {
            this.result = result;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}
