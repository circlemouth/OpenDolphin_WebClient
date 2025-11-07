package open.dolphin.rest.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.ArrayList;
import java.util.List;
import open.dolphin.rest.dto.DemoAspResponses.AllergyDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimBundleDto;
import open.dolphin.rest.dto.DemoAspResponses.ClaimItemDto;
import open.dolphin.rest.dto.DemoAspResponses.HealthInsuranceDto;
import open.dolphin.rest.dto.DemoAspResponses.PatientPackageResponse;
import open.dolphin.rest.dto.DemoAspResponses.ProgressCourseDocument;
import open.dolphin.rest.dto.DemoAspResponses.PublicInsuranceDto;
import open.dolphin.touch.converter.ISchemaModel;
import org.junit.jupiter.api.Test;

class DemoAspResponsesDefensiveCopyTest {

    @Test
    void claimBundleDtoProtectsItems() {
        List<ClaimItemDto> items = new ArrayList<>();
        items.add(new ClaimItemDto("name", "1", "unit", "3", "admin"));

        ClaimBundleDto dto = new ClaimBundleDto("entity", "entityName", "2024-06-14", "bundle", "admin", items);

        items.add(new ClaimItemDto("intruder", "2", "unit", "1", "admin"));

        assertEquals(1, dto.getItems().size());
        assertThrows(UnsupportedOperationException.class, () -> dto.getItems().add(items.get(1)));
    }

    @Test
    void progressCourseDocumentProtectsCollections() {
        List<String> soaTexts = new ArrayList<>();
        soaTexts.add("note");
        List<ClaimBundleDto> orders = new ArrayList<>();
        orders.add(new ClaimBundleDto("entity", "entityName", "2024-06-14", "bundle", "admin", new ArrayList<>()));
        List<ISchemaModel> schemas = new ArrayList<>();

        ProgressCourseDocument doc = new ProgressCourseDocument("2024-06-14", "doctor", soaTexts, orders, schemas);

        soaTexts.add("mutated");
        orders.add(new ClaimBundleDto("entity2", "entityName2", "2024-06-15", "bundle2", "admin", new ArrayList<>()));

        assertEquals(1, doc.getSoaTexts().size());
        assertEquals(1, doc.getOrders().size());
        assertThrows(UnsupportedOperationException.class, () -> doc.getSoaTexts().add("attempt"));
        assertThrows(UnsupportedOperationException.class, () -> doc.getOrders().add(orders.get(0)));
        assertThrows(UnsupportedOperationException.class, () -> doc.getSchemas().add(null));
    }

    @Test
    void patientPackageResponseProtectsLists() {
        List<PublicInsuranceDto> publicInsurances = new ArrayList<>();
        publicInsurances.add(new PublicInsuranceDto("1", "provider", "code", "recipient", "2024-01-01", "2024-12-31", "90", "ratio"));
        HealthInsuranceDto healthDto = new HealthInsuranceDto(
                "class", "code", "sys", "number", "group", "client", "family", "2024-01-01", "2024-12-31",
                "100", "80", publicInsurances);
        List<HealthInsuranceDto> healths = new ArrayList<>();
        healths.add(healthDto);
        List<AllergyDto> allergies = new ArrayList<>();
        allergies.add(new AllergyDto("pollen", "low", "2024-06-01"));

        PatientPackageResponse response = new PatientPackageResponse(null, healths, allergies);

        healths.add(healthDto);
        allergies.add(new AllergyDto("dust", "high", "2024-06-02"));

        assertEquals(1, response.getHealthInsurances().size());
        assertEquals(1, response.getAllergies().size());
        assertThrows(UnsupportedOperationException.class, () -> response.getHealthInsurances().add(healthDto));
        assertThrows(UnsupportedOperationException.class, () -> response.getAllergies().clear());
    }
}
