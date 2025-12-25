package open.dolphin.rest.dto.outpatient;

import java.util.ArrayList;
import java.util.List;

/**
 * Outpatient claim bundle response with audit/telemetry metadata.
 */
public class ClaimOutpatientResponse {

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
    private String claimStatus;
    private String claimStatusText;
    private List<ClaimBundleEntry> claimBundles = new ArrayList<>();
    private List<ClaimQueueEntry> queueEntries = new ArrayList<>();
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

    public String getClaimStatus() {
        return claimStatus;
    }

    public void setClaimStatus(String claimStatus) {
        this.claimStatus = claimStatus;
    }

    public String getClaimStatusText() {
        return claimStatusText;
    }

    public void setClaimStatusText(String claimStatusText) {
        this.claimStatusText = claimStatusText;
    }

    public List<ClaimBundleEntry> getClaimBundles() {
        return claimBundles;
    }

    public void setClaimBundles(List<ClaimBundleEntry> claimBundles) {
        this.claimBundles = claimBundles != null ? claimBundles : new ArrayList<>();
    }

    public List<ClaimQueueEntry> getQueueEntries() {
        return queueEntries;
    }

    public void setQueueEntries(List<ClaimQueueEntry> queueEntries) {
        this.queueEntries = queueEntries != null ? queueEntries : new ArrayList<>();
    }

    public OutpatientFlagResponse.AuditEvent getAuditEvent() {
        return auditEvent;
    }

    public void setAuditEvent(OutpatientFlagResponse.AuditEvent auditEvent) {
        this.auditEvent = auditEvent;
    }

    public static class ClaimBundleEntry {
        private String bundleNumber;
        private String classCode;
        private String patientId;
        private String appointmentId;
        private String performTime;
        private String claimStatus;
        private String claimStatusText;
        private Integer totalClaimAmount;
        private List<ClaimBundleItem> items = new ArrayList<>();

        public String getBundleNumber() {
            return bundleNumber;
        }

        public void setBundleNumber(String bundleNumber) {
            this.bundleNumber = bundleNumber;
        }

        public String getClassCode() {
            return classCode;
        }

        public void setClassCode(String classCode) {
            this.classCode = classCode;
        }

        public String getPatientId() {
            return patientId;
        }

        public void setPatientId(String patientId) {
            this.patientId = patientId;
        }

        public String getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(String appointmentId) {
            this.appointmentId = appointmentId;
        }

        public String getPerformTime() {
            return performTime;
        }

        public void setPerformTime(String performTime) {
            this.performTime = performTime;
        }

        public String getClaimStatus() {
            return claimStatus;
        }

        public void setClaimStatus(String claimStatus) {
            this.claimStatus = claimStatus;
        }

        public String getClaimStatusText() {
            return claimStatusText;
        }

        public void setClaimStatusText(String claimStatusText) {
            this.claimStatusText = claimStatusText;
        }

        public Integer getTotalClaimAmount() {
            return totalClaimAmount;
        }

        public void setTotalClaimAmount(Integer totalClaimAmount) {
            this.totalClaimAmount = totalClaimAmount;
        }

        public List<ClaimBundleItem> getItems() {
            return items;
        }

        public void setItems(List<ClaimBundleItem> items) {
            this.items = items != null ? items : new ArrayList<>();
        }
    }

    public static class ClaimBundleItem {
        private String code;
        private String tableId;
        private String name;
        private Number number;
        private String unit;
        private Number claimRate;
        private Number amount;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getTableId() {
            return tableId;
        }

        public void setTableId(String tableId) {
            this.tableId = tableId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Number getNumber() {
            return number;
        }

        public void setNumber(Number number) {
            this.number = number;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public Number getClaimRate() {
            return claimRate;
        }

        public void setClaimRate(Number claimRate) {
            this.claimRate = claimRate;
        }

        public Number getAmount() {
            return amount;
        }

        public void setAmount(Number amount) {
            this.amount = amount;
        }
    }

    public static class ClaimQueueEntry {
        private String id;
        private String phase;
        private Integer retryCount;
        private String nextRetryAt;
        private String errorMessage;
        private String holdReason;
        private String requestId;
        private String patientId;
        private String appointmentId;
        private Boolean fallbackUsed;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getPhase() {
            return phase;
        }

        public void setPhase(String phase) {
            this.phase = phase;
        }

        public Integer getRetryCount() {
            return retryCount;
        }

        public void setRetryCount(Integer retryCount) {
            this.retryCount = retryCount;
        }

        public String getNextRetryAt() {
            return nextRetryAt;
        }

        public void setNextRetryAt(String nextRetryAt) {
            this.nextRetryAt = nextRetryAt;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public String getHoldReason() {
            return holdReason;
        }

        public void setHoldReason(String holdReason) {
            this.holdReason = holdReason;
        }

        public String getRequestId() {
            return requestId;
        }

        public void setRequestId(String requestId) {
            this.requestId = requestId;
        }

        public String getPatientId() {
            return patientId;
        }

        public void setPatientId(String patientId) {
            this.patientId = patientId;
        }

        public String getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(String appointmentId) {
            this.appointmentId = appointmentId;
        }

        public Boolean getFallbackUsed() {
            return fallbackUsed;
        }

        public void setFallbackUsed(Boolean fallbackUsed) {
            this.fallbackUsed = fallbackUsed;
        }
    }
}
