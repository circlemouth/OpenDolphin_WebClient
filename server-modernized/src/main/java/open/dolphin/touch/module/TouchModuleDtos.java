package open.dolphin.touch.module;

import java.util.List;

/**
 * DTO collection for Touch module related responses.
 */
public final class TouchModuleDtos {

    private TouchModuleDtos() {
    }

    public record Page<T>(Long totalRecords, int firstResult, int maxResult, List<T> items) {
    }

    public record Module(String entity,
                         String entityName,
                         String startDate,
                         List<ModuleItem> items) {
    }

    public record ModuleItem(String name,
                             String quantity,
                             String unit,
                             String numDays,
                             String administration) {
    }

    public record RpModule(String rpDate,
                           List<ModuleItem> items) {
    }

    public record Diagnosis(String diagnosis,
                            String category,
                            String outcome,
                            String startDate,
                            String endDate) {
    }

    public record LaboModule(String laboCenterCode,
                             String sampleDate,
                             String patientId,
                             List<LaboItem> items) {
    }

    public record LaboItem(String groupCode,
                           String groupName,
                           String parentCode,
                           String itemCode,
                           String medisCode,
                           String itemName,
                           String normalValue,
                           String unit,
                           String value,
                           String abnormalFlag,
                           String comment1,
                           String comment2) {
    }

    public record LaboGraph(String itemCode,
                            String itemName,
                            String normalValue,
                            String unit,
                            List<LaboGraphResult> results) {
    }

    public record LaboGraphResult(String sampleDate,
                                  String value,
                                  String comment1,
                                  String comment2) {
    }

    public record Schema(String bucket,
                         String sop,
                         String base64) {
    }
}
