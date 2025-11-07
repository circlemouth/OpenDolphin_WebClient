package open.dolphin.touch.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.List;
import open.dolphin.touch.module.TouchModuleDtos;
import open.dolphin.touch.module.TouchModuleDtos.LaboItem;
import open.dolphin.touch.module.TouchModuleDtos.Module;
import open.dolphin.touch.module.TouchModuleDtos.ModuleItem;
import open.dolphin.touch.module.TouchModuleDtos.Page;
import open.dolphin.touch.module.TouchModuleDtos.RpModule;
import open.dolphin.touch.patient.dto.TouchPatientDtos.AllergyDto;
import open.dolphin.touch.patient.dto.TouchPatientDtos.HealthInsuranceDto;
import open.dolphin.touch.patient.dto.TouchPatientDtos.PatientPackageResponse;
import open.dolphin.touch.patient.dto.TouchPatientDtos.PublicInsuranceDto;
import org.junit.jupiter.api.Test;

class TouchDtosDefensiveCopyTest {

    @Test
    void moduleRecordsProtectCollections() {
        List<ModuleItem> items = new ArrayList<>();
        items.add(new ModuleItem("drug", "1", "mg", "3", "oral"));

        Module module = new Module("entity", "entityName", "2024-06-14", items);
        RpModule rpModule = new RpModule("2024-06-14", items);
        Page<ModuleItem> page = new Page<>(1L, 0, 10, items);

        items.add(new ModuleItem("mutated", "2", "mg", "1", "oral"));

        assertEquals(1, module.items().size());
        assertEquals(1, rpModule.items().size());
        assertEquals(1, page.items().size());

        assertThrows(UnsupportedOperationException.class, () -> module.items().add(items.get(1)));
    }

    @Test
    void patientPackageResponseProtectsLists() {
        List<PublicInsuranceDto> publicInsurances = new ArrayList<>();
        publicInsurances.add(new PublicInsuranceDto("1", "provider", "code", "recipient", "2024-01-01", "2024-12-31", "90", "ratio"));
        HealthInsuranceDto health = new HealthInsuranceDto(
                "class", "code", "sys", "number", "group", "client", "family", "2024-01-01", "2024-12-31",
                "100", "80", publicInsurances);
        List<HealthInsuranceDto> healths = new ArrayList<>();
        healths.add(health);
        List<AllergyDto> allergies = new ArrayList<>();
        allergies.add(new AllergyDto("pollen", "low", "2024-06-01"));

        PatientPackageResponse response = new PatientPackageResponse(null, healths, allergies);

        healths.add(health);
        allergies.add(new AllergyDto("dust", "high", "2024-06-02"));

        assertEquals(1, response.getHealthInsurances().size());
        assertEquals(1, response.getAllergies().size());
        assertThrows(UnsupportedOperationException.class, () -> response.getHealthInsurances().clear());
        assertThrows(UnsupportedOperationException.class, () -> response.getAllergies().add(new AllergyDto("late", "mid", "2024-06-14")));
    }

    @Test
    void laboModuleProtectsItems() {
        List<LaboItem> items = new ArrayList<>();
        items.add(new LaboItem("group", "groupName", "parent", "code", "medis", "item", "normal", "unit", "value", "N", "c1", "c2"));

        TouchModuleDtos.LaboModule module = new TouchModuleDtos.LaboModule("center", "2024-06-14", "patient", items);

        items.clear();

        assertEquals(1, module.items().size());
        assertThrows(UnsupportedOperationException.class, () -> module.items().remove(0));
    }
}
