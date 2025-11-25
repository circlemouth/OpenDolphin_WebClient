package open.dolphin.rest.dto;

import java.util.List;
import open.dolphin.converter.ModuleModelConverter;

/**
 * Routine medication entry for REST responses.
 */
public class RoutineMedicationResponse {

    private final Long id;
    private final String name;
    private final String memo;
    private final String category;
    private final String lastUpdated;
    private final List<ModuleModelConverter> moduleList;

    public RoutineMedicationResponse(Long id,
                                     String name,
                                     String memo,
                                     String category,
                                     String lastUpdated,
                                     List<ModuleModelConverter> moduleList) {
        this.id = id;
        this.name = name;
        this.memo = memo;
        this.category = category;
        this.lastUpdated = lastUpdated;
        this.moduleList = moduleList;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getMemo() {
        return memo;
    }

    public String getCategory() {
        return category;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public List<ModuleModelConverter> getModuleList() {
        return moduleList;
    }
}
