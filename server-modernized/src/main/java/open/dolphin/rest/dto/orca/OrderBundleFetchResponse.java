package open.dolphin.rest.dto.orca;

import java.util.List;

/**
 * Response payload for order bundle fetch API.
 */
public class OrderBundleFetchResponse {

    private String apiResult;
    private String apiResultMessage;
    private String runId;
    private String patientId;
    private int recordsReturned;
    private List<OrderBundleEntry> bundles;

    public String getApiResult() {
        return apiResult;
    }

    public void setApiResult(String apiResult) {
        this.apiResult = apiResult;
    }

    public String getApiResultMessage() {
        return apiResultMessage;
    }

    public void setApiResultMessage(String apiResultMessage) {
        this.apiResultMessage = apiResultMessage;
    }

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public int getRecordsReturned() {
        return recordsReturned;
    }

    public void setRecordsReturned(int recordsReturned) {
        this.recordsReturned = recordsReturned;
    }

    public List<OrderBundleEntry> getBundles() {
        return bundles;
    }

    public void setBundles(List<OrderBundleEntry> bundles) {
        this.bundles = bundles;
    }

    public static class OrderBundleEntry {
        private Long documentId;
        private Long moduleId;
        private String entity;
        private String bundleName;
        private String bundleNumber;
        private String admin;
        private String adminMemo;
        private String memo;
        private String started;
        private List<OrderBundleItem> items;

        public Long getDocumentId() {
            return documentId;
        }

        public void setDocumentId(Long documentId) {
            this.documentId = documentId;
        }

        public Long getModuleId() {
            return moduleId;
        }

        public void setModuleId(Long moduleId) {
            this.moduleId = moduleId;
        }

        public String getEntity() {
            return entity;
        }

        public void setEntity(String entity) {
            this.entity = entity;
        }

        public String getBundleName() {
            return bundleName;
        }

        public void setBundleName(String bundleName) {
            this.bundleName = bundleName;
        }

        public String getBundleNumber() {
            return bundleNumber;
        }

        public void setBundleNumber(String bundleNumber) {
            this.bundleNumber = bundleNumber;
        }

        public String getAdmin() {
            return admin;
        }

        public void setAdmin(String admin) {
            this.admin = admin;
        }

        public String getAdminMemo() {
            return adminMemo;
        }

        public void setAdminMemo(String adminMemo) {
            this.adminMemo = adminMemo;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String memo) {
            this.memo = memo;
        }

        public String getStarted() {
            return started;
        }

        public void setStarted(String started) {
            this.started = started;
        }

        public List<OrderBundleItem> getItems() {
            return items;
        }

        public void setItems(List<OrderBundleItem> items) {
            this.items = items;
        }
    }

    public static class OrderBundleItem {
        private String code;
        private String name;
        private String quantity;
        private String unit;
        private String memo;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getQuantity() {
            return quantity;
        }

        public void setQuantity(String quantity) {
            this.quantity = quantity;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String memo) {
            this.memo = memo;
        }
    }
}
