package open.dolphin.orca.converter;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.util.Collections;
import java.util.Iterator;
import java.util.Objects;
import open.dolphin.orca.OrcaGatewayException;
import open.dolphin.rest.dto.orca.AbstractPatientListResponse;
import open.dolphin.rest.dto.orca.AppointmentMutationResponse;
import open.dolphin.rest.dto.orca.BillingSimulationResponse;
import open.dolphin.rest.dto.orca.BillingSimulationResponse.BillingPointBreakdown;
import open.dolphin.rest.dto.orca.FormerNameHistoryResponse;
import open.dolphin.rest.dto.orca.FormerNameHistoryResponse.FormerNameRecord;
import open.dolphin.rest.dto.orca.InsuranceCombination;
import open.dolphin.rest.dto.orca.InsuranceCombinationResponse;
import open.dolphin.rest.dto.orca.OrcaApiResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse.AppointmentSlot;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse.PatientAppointment;
import open.dolphin.rest.dto.orca.PatientBatchResponse;
import open.dolphin.rest.dto.orca.PatientDetail;
import open.dolphin.rest.dto.orca.PatientIdListResponse;
import open.dolphin.rest.dto.orca.PatientIdListResponse.PatientSyncEntry;
import open.dolphin.rest.dto.orca.PatientSearchResponse;
import open.dolphin.rest.dto.orca.PatientSummary;
import open.dolphin.rest.dto.orca.VisitMutationResponse;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;
import open.dolphin.rest.dto.orca.VisitPatientListResponse.VisitEntry;

/**
 * Converts ORCA XML payloads into DTOs understood by the REST wrappers.
 */
@ApplicationScoped
public class OrcaXmlMapper {

    private final XmlMapper xmlMapper;

    public OrcaXmlMapper() {
        xmlMapper = new XmlMapper();
        xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        xmlMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
    }

    public OrcaAppointmentListResponse toAppointmentList(String xml) {
        JsonNode body = read(xml).path("appointlstres");
        OrcaAppointmentListResponse response = new OrcaAppointmentListResponse();
        populateCommon(body, response);
        response.setAppointmentDate(body.path("Appointment_Date").asText(null));
        for (JsonNode slotNode : iterable(body.path("Appointlst_Information"))) {
            AppointmentSlot slot = new AppointmentSlot();
            slot.setAppointmentTime(slotNode.path("Appointment_Time").asText(null));
            slot.setMedicalInformation(slotNode.path("Medical_Information").asText(null));
            slot.setDepartmentCode(slotNode.path("Department_Code").asText(null));
            slot.setDepartmentName(slotNode.path("Department_WholeName").asText(null));
            slot.setPhysicianCode(slotNode.path("Physician_Code").asText(null));
            slot.setPhysicianName(slotNode.path("Physician_WholeName").asText(null));
            slot.setVisitInformation(slotNode.path("Visit_Information").asText(null));
            slot.setAppointmentId(slotNode.path("Appointment_Id").asText(null));
            slot.setPatient(toPatientSummary(slotNode.path("Patient_Information")));
            response.getSlots().add(slot);
        }
        return response;
    }

    public PatientAppointmentListResponse toPatientAppointments(String xml) {
        JsonNode body = read(xml).path("appointlst2res");
        PatientAppointmentListResponse response = new PatientAppointmentListResponse();
        populateCommon(body, response);
        response.setBaseDate(body.path("Base_Date").asText(null));
        response.setPatient(toPatientSummary(body.path("Patient_Information")));
        for (JsonNode node : iterable(body.path("Appointlst_Information"))) {
            PatientAppointment appointment = new PatientAppointment();
            appointment.setAppointmentDate(node.path("Appointment_Date").asText(null));
            appointment.setAppointmentTime(node.path("Appointment_Time").asText(null));
            appointment.setMedicalInformation(node.path("Medical_Information").asText(null));
            appointment.setDepartmentCode(node.path("Department_Code").asText(null));
            appointment.setDepartmentName(node.path("Department_WholeName").asText(null));
            appointment.setPhysicianCode(node.path("Physician_Code").asText(null));
            appointment.setPhysicianName(node.path("Physician_WholeName").asText(null));
            appointment.setVisitInformation(node.path("Visit_Information").asText(null));
            appointment.setAppointmentId(node.path("Appointment_Id").asText(null));
            appointment.setAppointmentNote(node.path("Appointment_Note").asText(null));
            response.getReservations().add(appointment);
        }
        return response;
    }

    public AppointmentMutationResponse toAppointmentMutation(String xml) {
        JsonNode body = read(xml).path("appointres");
        AppointmentMutationResponse response = new AppointmentMutationResponse();
        populateCommon(body, response);
        response.setResKey(body.path("Reskey").asText(null));
        response.setAppointmentDate(body.path("Appointment_Date").asText(null));
        response.setAppointmentTime(body.path("Appointment_Time").asText(null));
        response.setAppointmentId(body.path("Appointment_Id").asText(null));
        response.setDepartmentCode(body.path("Department_Code").asText(null));
        response.setDepartmentName(body.path("Department_WholeName").asText(null));
        response.setPhysicianCode(body.path("Physician_Code").asText(null));
        response.setPhysicianName(body.path("Physician_WholeName").asText(null));
        response.setMedicalInformation(body.path("Medical_Information").asText(null));
        response.setAppointmentInformation(body.path("Appointment_Information").asText(null));
        response.setAppointmentNote(body.path("Appointment_Note").asText(null));
        response.setVisitInformation(body.path("Visit_Information").asText(null));
        response.setPatient(toPatientSummary(body.path("Patient_Information")));
        for (JsonNode warning : iterable(body.path("Api_Warning_Message_Information"))) {
            String message = warning.path("Api_Warning_Message").asText(null);
            if (message != null && !message.isBlank()) {
                response.getWarnings().add(message);
            }
        }
        return response;
    }

    public BillingSimulationResponse toBillingSimulation(String xml) {
        JsonNode body = read(xml).path("acsimulateres");
        BillingSimulationResponse response = new BillingSimulationResponse();
        populateCommon(body, response);
        response.setPerformDate(body.path("Perform_Date").asText(null));
        response.setDepartmentCode(body.path("Department_Code").asText(null));
        response.setDepartmentName(body.path("Department_Name").asText(null));
        JsonNode patientNode = body.path("Patient_Information");
        response.setPatient(toPatientSummary(patientNode));
        JsonNode pointInfo = patientNode.path("Ac_Point_Information");
        response.setTotalPoint(pointInfo.path("Ac_Ttl_Point").asInt(0));
        for (JsonNode detail : iterable(pointInfo.path("Ac_Point_Detail"))) {
            BillingPointBreakdown breakdown = new BillingPointBreakdown();
            breakdown.setName(detail.path("AC_Point_Name").asText(null));
            breakdown.setPoint(detail.path("AC_Point").asInt(0));
            response.getBreakdown().add(breakdown);
        }
        return response;
    }

    public VisitPatientListResponse toVisitList(String xml) {
        JsonNode body = read(xml).path("visitptlst01res");
        VisitPatientListResponse response = new VisitPatientListResponse();
        populateCommon(body, response);
        response.setVisitDate(body.path("Visit_Date").asText(null));
        for (JsonNode node : iterable(body.path("Visit_List_Information"))) {
            VisitEntry entry = new VisitEntry();
            entry.setDepartmentCode(node.path("Department_Code").asText(null));
            entry.setDepartmentName(node.path("Department_Name").asText(null));
            entry.setPhysicianCode(node.path("Physician_Code").asText(null));
            entry.setPhysicianName(node.path("Physician_WholeName").asText(null));
            entry.setVoucherNumber(node.path("Voucher_Number").asText(null));
            entry.setSequentialNumber(node.path("Sequential_Number").asText(null));
            entry.setInsuranceCombinationNumber(node.path("Insurance_Combination_Number").asText(null));
            entry.setUpdateDate(node.path("Update_Date").asText(null));
            entry.setUpdateTime(node.path("Update_Time").asText(null));
            entry.setPatient(toPatientSummary(node.path("Patient_Information")));
            response.getVisits().add(entry);
        }
        return response;
    }

    public PatientIdListResponse toPatientIdList(String xml) {
        JsonNode body = read(xml).path("patientlst1res");
        PatientIdListResponse response = new PatientIdListResponse();
        populateCommon(body, response);
        response.setTargetPatientCount(body.path("Target_Patient_Count").asInt(0));
        for (JsonNode node : iterable(body.path("Patient_Information"))) {
            PatientSyncEntry entry = new PatientSyncEntry();
            entry.setSummary(toPatientSummary(node));
            entry.setCreateDate(node.path("CreateDate").asText(null));
            entry.setUpdateDate(node.path("UpdateDate").asText(null));
            entry.setUpdateTime(node.path("UpdateTime").asText(null));
            response.getPatients().add(entry);
        }
        return response;
    }

    public PatientBatchResponse toPatientBatch(String xml) {
        JsonNode body = read(xml).path("patientlst2res");
        PatientBatchResponse response = new PatientBatchResponse();
        populateCommon(body, response);
        populatePatientList(body, response);
        return response;
    }

    public PatientSearchResponse toPatientSearch(String xml, String searchTerm) {
        JsonNode body = read(xml).path("patientlst2res");
        PatientSearchResponse response = new PatientSearchResponse();
        populateCommon(body, response);
        populatePatientList(body, response);
        response.setSearchTerm(searchTerm);
        return response;
    }

    public InsuranceCombinationResponse toInsuranceCombination(String xml) {
        JsonNode body = read(xml).path("patientlst2res");
        InsuranceCombinationResponse response = new InsuranceCombinationResponse();
        populateCommon(body, response);
        response.setPatient(toPatientSummary(body.path("Patient_Information")));
        for (JsonNode node : iterable(body.path("HealthInsurance_Information"))) {
            response.getCombinations().add(toInsuranceCombination(node));
        }
        return response;
    }

    public FormerNameHistoryResponse toFormerNames(String xml) {
        JsonNode body = read(xml).path("patientlst8res");
        FormerNameHistoryResponse response = new FormerNameHistoryResponse();
        populateCommon(body, response);
        response.setPatient(toPatientSummary(body.path("Patient_Information")));
        for (JsonNode node : iterable(body.path("Former_Name_Information"))) {
            FormerNameRecord record = new FormerNameRecord();
            record.setChangeDate(node.path("ChangeDate").asText(null));
            record.setWholeName(node.path("WholeName").asText(null));
            record.setWholeNameKana(node.path("WholeName_inKana").asText(null));
            record.setNickName(node.path("NickName").asText(null));
            response.getFormerNames().add(record);
        }
        return response;
    }

    public VisitMutationResponse toVisitMutation(String xml) {
        JsonNode body = read(xml).path("acceptres");
        VisitMutationResponse response = new VisitMutationResponse();
        populateCommon(body, response);
        response.setResKey(body.path("Reskey").asText(null));
        response.setAcceptanceId(body.path("Acceptance_Id").asText(null));
        response.setAcceptanceDate(body.path("Acceptance_Date").asText(null));
        response.setAcceptanceTime(body.path("Acceptance_Time").asText(null));
        response.setDepartmentCode(body.path("Department_Code").asText(null));
        response.setDepartmentName(body.path("Department_WholeName").asText(null));
        response.setPhysicianCode(body.path("Physician_Code").asText(null));
        response.setPhysicianName(body.path("Physician_WholeName").asText(null));
        response.setMedicalInformation(body.path("Medical_Information").asText(null));
        JsonNode medicalInfo = body.path("Medical_Info");
        response.setAppointmentDate(medicalInfo.path("Appointment_Date").asText(null));
        response.setVisitNumber(medicalInfo.path("Visit_Number").asText(null));
        response.setPatient(toPatientSummary(body.path("Patient_Information")));
        for (JsonNode warning : iterable(body.path("Api_Warning_Message_Information"))) {
            String message = warning.path("Api_Warning_Message").asText(null);
            if (message != null && !message.isBlank()) {
                response.getWarnings().add(message);
            }
        }
        return response;
    }

    private void populatePatientList(JsonNode body, AbstractPatientListResponse response) {
        response.setTargetPatientCount(body.path("Target_Patient_Count").asInt(0));
        for (JsonNode node : iterable(body.path("Patient_Information"))) {
            PatientDetail detail = new PatientDetail();
            detail.setSummary(toPatientSummary(node));
            JsonNode address = node.path("Home_Address_Information");
            detail.setZipCode(address.path("Address_ZipCode").asText(null));
            detail.setAddress(address.path("WholeAddress1").asText(null));
            detail.setOutpatientClass(node.path("Outpatient_Class").asText(null));
            for (JsonNode insurance : iterable(node.path("HealthInsurance_Information"))) {
                detail.getInsurances().add(toInsuranceCombination(insurance));
            }
            response.getPatients().add(detail);
        }
    }

    private void populateCommon(JsonNode body, OrcaApiResponse response) {
        if (body == null || body.isMissingNode()) {
            throw new OrcaGatewayException("ORCA payload is missing expected body");
        }
        response.setApiResult(body.path("Api_Result").asText(null));
        response.setApiResultMessage(body.path("Api_Result_Message").asText(null));
    }

    private PatientSummary toPatientSummary(JsonNode node) {
        if (node == null || node.isMissingNode()) {
            return null;
        }
        PatientSummary summary = new PatientSummary();
        summary.setPatientId(node.path("Patient_ID").asText(null));
        summary.setWholeName(node.path("WholeName").asText(null));
        summary.setWholeNameKana(node.path("WholeName_inKana").asText(null));
        summary.setBirthDate(node.path("BirthDate").asText(null));
        summary.setSex(node.path("Sex").asText(null));
        return summary;
    }

    private InsuranceCombination toInsuranceCombination(JsonNode node) {
        InsuranceCombination combination = new InsuranceCombination();
        combination.setCombinationNumber(node.path("Insurance_Combination_Number").asText(null));
        combination.setInsuranceProviderClass(node.path("InsuranceProvider_Class").asText(null));
        combination.setInsuranceProviderNumber(node.path("InsuranceProvider_Number").asText(null));
        combination.setInsuranceProviderName(node.path("InsuranceProvider_WholeName").asText(null));
        combination.setInsuredPersonSymbol(node.path("HealthInsuredPerson_Symbol").asText(null));
        combination.setInsuredPersonNumber(node.path("HealthInsuredPerson_Number").asText(null));
        combination.setRateAdmission(node.path("InsuranceCombination_Rate_Admission").asText(node.path("Rate_Admission").asText(null)));
        combination.setRateOutpatient(node.path("InsuranceCombination_Rate_Outpatient").asText(node.path("Rate_Outpatient").asText(null)));
        combination.setCertificateStartDate(node.path("Certificate_StartDate").asText(null));
        combination.setCertificateExpiredDate(node.path("Certificate_ExpiredDate").asText(null));
        return combination;
    }

    private JsonNode read(String xml) {
        Objects.requireNonNull(xml, "xml");
        try {
            return xmlMapper.readTree(xml);
        } catch (IOException ex) {
            throw new OrcaGatewayException("Failed to parse ORCA payload", ex);
        }
    }

    private Iterable<JsonNode> iterable(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return Collections.emptyList();
        }
        if (node.isArray()) {
            return node;
        }
        return () -> new Iterator<>() {
            private boolean hasNext = true;

            @Override
            public boolean hasNext() {
                return hasNext;
            }

            @Override
            public JsonNode next() {
                hasNext = false;
                return node;
            }
        };
    }
}
