package open.dolphin.rest.dto.orca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Request payload for POST /orca/order/bundles.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderBundleMutationRequest {

    private String patientId;
    private List<BundleOperation> operations;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public List<BundleOperation> getOperations() {
        return operations;
    }

    public void setOperations(List<BundleOperation> operations) {
        this.operations = operations;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BundleOperation {
        private String operation; // create/update/delete
        private Long documentId;
        private Long moduleId;
        private String entity;
        private String bundleName;
        private String bundleNumber;
        private String admin;
        private String adminMemo;
        private String memo;
        private String startDate;
        private String endDate;
        private List<BundleItem> items;

        public String getOperation() {
            return operation;
        }

        public void setOperation(String operation) {
            this.operation = operation;
        }

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

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }

        public List<BundleItem> getItems() {
            return items;
        }

        public void setItems(List<BundleItem> items) {
            this.items = items;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BundleItem {
        private String name;
        private String code;
        private String quantity;
        private String unit;
        private String memo;

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
