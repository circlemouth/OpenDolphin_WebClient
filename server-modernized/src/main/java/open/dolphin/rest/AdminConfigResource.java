package open.dolphin.rest;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import open.dolphin.rest.admin.AdminConfigSnapshot;
import open.dolphin.rest.admin.AdminConfigStore;

@Path("/api/admin")
public class AdminConfigResource extends AbstractResource {

    private static final DateTimeFormatter RUN_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    @Inject
    private AdminConfigStore adminConfigStore;

    @GET
    @Path("/config")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConfig(@Context HttpServletRequest request) {
        AdminConfigSnapshot snapshot = resolveSnapshot(request);
        String runId = resolveRunId(request);
        return buildResponse(snapshot, runId);
    }

    @PUT
    @Path("/config")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response putConfig(@Context HttpServletRequest request, Map<String, Object> payload) {
        String runId = resolveRunId(request);
        AdminConfigSnapshot incoming = toSnapshot(payload);
        AdminConfigSnapshot updated = adminConfigStore.updateFromPayload(incoming, runId);
        AdminConfigSnapshot resolved = applyHeaderOverrides(request, updated);
        return buildResponse(resolved, runId);
    }

    @GET
    @Path("/delivery")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDelivery(@Context HttpServletRequest request) {
        AdminConfigSnapshot snapshot = resolveSnapshot(request);
        String runId = resolveRunId(request);
        return buildResponse(snapshot, runId);
    }

    private AdminConfigSnapshot resolveSnapshot(HttpServletRequest request) {
        AdminConfigSnapshot snapshot = adminConfigStore.getSnapshot();
        return applyHeaderOverrides(request, snapshot);
    }

    private Response buildResponse(AdminConfigSnapshot snapshot, String runId) {
        Map<String, Object> body = toResponse(snapshot, runId);
        Response.ResponseBuilder builder = Response.ok(body);
        builder.header("x-run-id", runId);
        builder.header("x-admin-delivery-verification", Boolean.TRUE.equals(snapshot.getVerified()) ? "enabled" : "disabled");
        builder.header("x-orca-queue-mode", Boolean.TRUE.equals(snapshot.getUseMockOrcaQueue()) ? "mock" : "live");
        if (snapshot.getEnvironment() != null) {
            builder.header("x-environment", snapshot.getEnvironment());
        }
        if (snapshot.getDeliveryMode() != null) {
            builder.header("x-delivery-mode", snapshot.getDeliveryMode());
            builder.header("x-admin-delivery-mode", snapshot.getDeliveryMode());
        }
        if (snapshot.getDeliveryEtag() != null && !snapshot.getDeliveryEtag().isBlank()) {
            builder.header("etag", snapshot.getDeliveryEtag());
            builder.header("x-delivery-etag", snapshot.getDeliveryEtag());
        }
        return builder.build();
    }

    private Map<String, Object> toResponse(AdminConfigSnapshot snapshot, String runId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", runId);
        body.put("orcaEndpoint", snapshot.getOrcaEndpoint());
        body.put("mswEnabled", snapshot.getMswEnabled());
        body.put("useMockOrcaQueue", snapshot.getUseMockOrcaQueue());
        body.put("verifyAdminDelivery", snapshot.getVerifyAdminDelivery());
        body.put("chartsDisplayEnabled", snapshot.getChartsDisplayEnabled());
        body.put("chartsSendEnabled", snapshot.getChartsSendEnabled());
        body.put("chartsMasterSource", snapshot.getChartsMasterSource());
        Map<String, Object> charts = new LinkedHashMap<>();
        charts.put("displayEnabled", snapshot.getChartsDisplayEnabled());
        charts.put("sendEnabled", snapshot.getChartsSendEnabled());
        charts.put("masterSource", snapshot.getChartsMasterSource());
        body.put("charts", charts);
        body.put("deliveryId", snapshot.getDeliveryId());
        body.put("deliveryVersion", snapshot.getDeliveryVersion());
        body.put("deliveryEtag", snapshot.getDeliveryEtag());
        body.put("deliveredAt", snapshot.getDeliveredAt());
        body.put("note", snapshot.getNote());
        body.put("environment", snapshot.getEnvironment());
        body.put("deliveryMode", snapshot.getDeliveryMode());
        body.put("source", snapshot.getSource());
        body.put("verified", snapshot.getVerified());
        return body;
    }

    private AdminConfigSnapshot applyHeaderOverrides(HttpServletRequest request, AdminConfigSnapshot snapshot) {
        AdminConfigSnapshot copy = snapshot.copy();
        Boolean useMock = readBooleanHeader(request, "x-use-mock-orca-queue");
        if (useMock != null) {
            copy.setUseMockOrcaQueue(useMock);
            copy.setSource(useMock ? "mock" : "live");
        }
        Boolean verify = readBooleanHeader(request, "x-verify-admin-delivery");
        if (verify != null) {
            copy.setVerifyAdminDelivery(verify);
            copy.setVerified(verify);
        }
        return copy;
    }

    private Boolean readBooleanHeader(HttpServletRequest request, String headerName) {
        if (request == null || headerName == null) {
            return null;
        }
        String value = request.getHeader(headerName);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if ("1".equals(trimmed) || "true".equalsIgnoreCase(trimmed)) {
            return Boolean.TRUE;
        }
        if ("0".equals(trimmed) || "false".equalsIgnoreCase(trimmed)) {
            return Boolean.FALSE;
        }
        return null;
    }

    private AdminConfigSnapshot toSnapshot(Map<String, Object> payload) {
        AdminConfigSnapshot snapshot = new AdminConfigSnapshot();
        if (payload == null) {
            return snapshot;
        }
        snapshot.setOrcaEndpoint(getString(payload, "orcaEndpoint", "endpoint"));
        snapshot.setMswEnabled(getBoolean(payload.get("mswEnabled"), payload.get("msw")));
        snapshot.setUseMockOrcaQueue(getBoolean(payload.get("useMockOrcaQueue")));
        snapshot.setVerifyAdminDelivery(getBoolean(payload.get("verifyAdminDelivery")));
        snapshot.setChartsDisplayEnabled(getBoolean(payload.get("chartsDisplayEnabled")));
        snapshot.setChartsSendEnabled(getBoolean(payload.get("chartsSendEnabled")));
        snapshot.setChartsMasterSource(getString(payload, "chartsMasterSource"));
        snapshot.setNote(getString(payload, "note"));
        snapshot.setEnvironment(getString(payload, "environment", "env", "stage"));
        snapshot.setDeliveryMode(getString(payload, "deliveryMode", "deliveryState", "deliveryStatus"));

        Object charts = payload.get("charts");
        if (charts instanceof Map<?, ?> map) {
            Object display = map.get("displayEnabled");
            Object send = map.get("sendEnabled");
            Object master = map.get("masterSource");
            if (snapshot.getChartsDisplayEnabled() == null) snapshot.setChartsDisplayEnabled(getBoolean(display));
            if (snapshot.getChartsSendEnabled() == null) snapshot.setChartsSendEnabled(getBoolean(send));
            if (snapshot.getChartsMasterSource() == null) snapshot.setChartsMasterSource(getString(master));
        }
        return snapshot;
    }

    private String getString(Map<String, Object> payload, String... keys) {
        if (payload == null || keys == null) return null;
        for (String key : keys) {
            Object value = payload.get(key);
            if (value instanceof String text && !text.isBlank()) {
                return text;
            }
        }
        return null;
    }

    private String getString(Object value) {
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        return null;
    }

    private Boolean getBoolean(Object... values) {
        if (values == null) return null;
        for (Object value : values) {
            Boolean parsed = getBoolean(value);
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private Boolean getBoolean(Object value) {
        if (value instanceof Boolean bool) return bool;
        if (value instanceof String text) {
            if ("true".equalsIgnoreCase(text) || "1".equals(text)) return Boolean.TRUE;
            if ("false".equalsIgnoreCase(text) || "0".equals(text)) return Boolean.FALSE;
        }
        return null;
    }

    private String resolveRunId(HttpServletRequest request) {
        if (request != null) {
            String header = request.getHeader("X-Run-Id");
            if (header != null && !header.isBlank()) {
                return header.trim();
            }
        }
        return RUN_ID_FORMAT.format(Instant.now());
    }
}
