package open.dolphin.touch.dto;

import java.util.List;

/**
 * DTOs for DolphinResource document endpoints.
 */
public final class DolphinDocumentResponses {

    private DolphinDocumentResponses() {
    }

    public static final class PageInfo {
        private final int numRecords;

        public PageInfo(int numRecords) {
            this.numRecords = numRecords;
        }

        public int getNumRecords() {
            return numRecords;
        }
    }

    public static final class ClaimItemDto {
        private final String name;
        private final String quantity;
        private final String unit;
        private final String numDays;
        private final String administration;

        public ClaimItemDto(String name, String quantity, String unit, String numDays, String administration) {
            this.name = name;
            this.quantity = quantity;
            this.unit = unit;
            this.numDays = numDays;
            this.administration = administration;
        }

        public String getName() {
            return name;
        }

        public String getQuantity() {
            return quantity;
        }

        public String getUnit() {
            return unit;
        }

        public String getNumDays() {
            return numDays;
        }

        public String getAdministration() {
            return administration;
        }
    }

    public static final class ClaimBundleDto {
        private final String entity;
        private final String entityName;
        private final List<ClaimItemDto> claimItems;

        public ClaimBundleDto(String entity, String entityName, List<ClaimItemDto> claimItems) {
            this.entity = entity;
            this.entityName = entityName;
            this.claimItems = claimItems;
        }

        public String getEntity() {
            return entity;
        }

        public String getEntityName() {
            return entityName;
        }

        public List<ClaimItemDto> getClaimItems() {
            return claimItems;
        }
    }

    public static final class SchemaDto {
        private final String bucket;
        private final String sop;
        private final String base64;

        public SchemaDto(String bucket, String sop, String base64) {
            this.bucket = bucket;
            this.sop = sop;
            this.base64 = base64;
        }

        public String getBucket() {
            return bucket;
        }

        public String getSop() {
            return sop;
        }

        public String getBase64() {
            return base64;
        }
    }

    public static final class ProgressCourseDocument {
        private final long documentPk;
        private final String started;
        private final String responsibility;
        private final List<String> soaTexts;
        private final List<ClaimBundleDto> orders;
        private final List<SchemaDto> schemas;

        public ProgressCourseDocument(long documentPk,
                                      String started,
                                      String responsibility,
                                      List<String> soaTexts,
                                      List<ClaimBundleDto> orders,
                                      List<SchemaDto> schemas) {
            this.documentPk = documentPk;
            this.started = started;
            this.responsibility = responsibility;
            this.soaTexts = soaTexts;
            this.orders = orders;
            this.schemas = schemas;
        }

        public long getDocumentPk() {
            return documentPk;
        }

        public String getStarted() {
            return started;
        }

        public String getResponsibility() {
            return responsibility;
        }

        public List<String> getSoaTexts() {
            return soaTexts;
        }

        public List<ClaimBundleDto> getOrders() {
            return orders;
        }

        public List<SchemaDto> getSchemas() {
            return schemas;
        }
    }

    public static final class ProgressCourseResponse {
        private final PageInfo pageInfo;
        private final List<ProgressCourseDocument> documents;

        public ProgressCourseResponse(PageInfo pageInfo, List<ProgressCourseDocument> documents) {
            this.pageInfo = pageInfo;
            this.documents = documents;
        }

        public PageInfo getPageInfo() {
            return pageInfo;
        }

        public List<ProgressCourseDocument> getDocuments() {
            return documents;
        }
    }
}
