package open.dolphin.orca.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import open.dolphin.orca.service.OrcaWrapperService;
import open.dolphin.rest.AbstractResource;
import open.dolphin.rest.dto.orca.AppointmentMutationRequest;
import open.dolphin.rest.dto.orca.AppointmentMutationResponse;
import open.dolphin.rest.dto.orca.BillingSimulationRequest;
import open.dolphin.rest.dto.orca.BillingSimulationResponse;
import open.dolphin.rest.dto.orca.OrcaAppointmentListRequest;
import open.dolphin.rest.dto.orca.OrcaAppointmentListResponse;
import open.dolphin.rest.dto.orca.PatientAppointmentListRequest;
import open.dolphin.rest.dto.orca.PatientAppointmentListResponse;
import open.dolphin.rest.dto.orca.VisitPatientListRequest;
import open.dolphin.rest.dto.orca.VisitPatientListResponse;

/**
 * REST wrapper for appointment, billing simulation, and visit helper endpoints.
 */
@Path("/orca")
public class OrcaAppointmentResource extends AbstractResource {

    private OrcaWrapperService wrapperService;

    public OrcaAppointmentResource() {
    }

    @Inject
    public OrcaAppointmentResource(OrcaWrapperService wrapperService) {
        this.wrapperService = wrapperService;
    }

    @POST
    @Path("/appointments/list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public OrcaAppointmentListResponse listAppointments(@Context HttpServletRequest request,
            OrcaAppointmentListRequest body) {
        if (body == null || body.getAppointmentDate() == null) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.invalid",
                    "appointmentDate is required");
        }
        return wrapperService.getAppointmentList(body);
    }

    @POST
    @Path("/appointments/patient")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public PatientAppointmentListResponse patientAppointments(@Context HttpServletRequest request,
            PatientAppointmentListRequest body) {
        if (body == null || body.getPatientId() == null || body.getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.patient.invalid",
                    "patientId is required");
        }
        return wrapperService.getPatientAppointments(body);
    }

    @POST
    @Path("/billing/estimate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public BillingSimulationResponse estimateBilling(@Context HttpServletRequest request,
            BillingSimulationRequest body) {
        if (body == null || body.getPatientId() == null || body.getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.billing.invalid",
                    "patientId is required");
        }
        if (body.getItems().isEmpty()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.billing.invalid",
                    "At least one billing item is required");
        }
        return wrapperService.simulateBilling(body);
    }

    @POST
    @Path("/visits/list")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public VisitPatientListResponse visitList(@Context HttpServletRequest request,
            VisitPatientListRequest body) {
        if (body == null || body.getVisitDate() == null) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.visit.invalid",
                    "visitDate is required");
        }
        return wrapperService.getVisitList(body);
    }

    @POST
    @Path("/appointments/mutation")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public AppointmentMutationResponse mutateAppointment(@Context HttpServletRequest request,
            AppointmentMutationRequest body) {
        if (request == null || request.getRemoteUser() == null || request.getRemoteUser().isBlank()) {
            throw restError(request, Response.Status.UNAUTHORIZED, "remote_user_missing",
                    "Authenticated user is required");
        }
        if (body == null) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.mutation.invalid",
                    "Request payload is required");
        }
        if (body.getRequestNumber() == null || body.getRequestNumber().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.mutation.invalid",
                    "requestNumber is required");
        }
        if (body.getPatient() == null || body.getPatient().getPatientId() == null
                || body.getPatient().getPatientId().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.mutation.invalid",
                    "patient.patientId is required");
        }
        if (body.getAppointmentDate() == null || body.getAppointmentDate().isBlank()
                || body.getAppointmentTime() == null || body.getAppointmentTime().isBlank()) {
            throw restError(request, Response.Status.BAD_REQUEST, "orca.appointment.mutation.invalid",
                    "appointmentDate and appointmentTime are required");
        }
        return wrapperService.mutateAppointment(body);
    }

    void setWrapperService(OrcaWrapperService wrapperService) {
        this.wrapperService = wrapperService;
    }
}
