package open.dolphin.touch.module;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * DTO collection for Touch module related responses.
 */
public final class TouchModuleDtos {

    private TouchModuleDtos() {
    }

    public record Page<T>(Long totalRecords, int firstResult, int maxResult, List<T> items) {
        public Page {
            items = immutableList(items);
        }

        @Override
        public List<T> items() {
            return defensiveList(this.items);
        }
    }

    public record Module(String entity,
                         String entityName,
                         String startDate,
                         List<ModuleItem> items) {
        public Module {
            items = immutableList(items);
        }

        @Override
        public List<ModuleItem> items() {
            return defensiveList(this.items);
        }
    }

    public record ModuleItem(String name,
                             String quantity,
                             String unit,
                             String numDays,
                             String administration) {
    }

    public record RpModule(String rpDate,
                           List<ModuleItem> items) {
        public RpModule {
            items = immutableList(items);
        }

        @Override
        public List<ModuleItem> items() {
            return defensiveList(this.items);
        }
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
        public LaboModule {
            items = immutableList(items);
        }

        @Override
        public List<LaboItem> items() {
            return defensiveList(this.items);
        }
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
        public LaboGraph {
            results = immutableList(results);
        }

        @Override
        public List<LaboGraphResult> results() {
            return defensiveList(this.results);
        }
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

    private static <T> List<T> immutableList(List<T> source) {
        return source == null ? null : Collections.unmodifiableList(new ArrayList<>(source));
    }

    private static <T> List<T> defensiveList(List<T> source) {
        return immutableList(source);
    }
}
