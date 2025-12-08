package open.dolphin.rest.dto.outpatient;

import java.time.Instant;
import java.util.Map;

/**
 * 外来 API の telemetry/audit 用レスポンス共通 DTO。
 */
public class OutpatientFlagResponse {

    private String runId;
    private String dataSource;
    private String dataSourceTransition;
    private boolean cacheHit;
    private boolean missingMaster;
    private boolean fallbackUsed;
    private String fetchedAt;
    private Integer recordsReturned;
    private AuditEvent auditEvent;

    public static OutpatientFlagResponse withDefaults(String runId) {
        OutpatientFlagResponse response = new OutpatientFlagResponse();
        response.setRunId(runId);
        response.setDataSource("server");
        response.setDataSourceTransition("server");
        response.setCacheHit(false);
        response.setMissingMaster(false);
        response.setFallbackUsed(false);
        response.setFetchedAt(Instant.now().toString());
        return response;
    }

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
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

    public AuditEvent getAuditEvent() {
        return auditEvent;
    }

    public void setAuditEvent(AuditEvent auditEvent) {
        this.auditEvent = auditEvent;
    }

    public static class AuditEvent {

        private String action;
        private String resource;
        private String outcome;
        private Map<String, Object> details;
        private String traceId;
        private String requestId;

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getResource() {
            return resource;
        }

        public void setResource(String resource) {
            this.resource = resource;
        }

        public String getOutcome() {
            return outcome;
        }

        public void setOutcome(String outcome) {
            this.outcome = outcome;
        }

        public Map<String, Object> getDetails() {
            return details;
        }

        public void setDetails(Map<String, Object> details) {
            this.details = details;
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
    }
}
