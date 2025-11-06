package open.dolphin.adm20.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.NoResultException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import open.dolphin.adm20.dto.FidoAssertionFinishRequest;
import open.dolphin.adm20.dto.FidoAssertionOptionsRequest;
import open.dolphin.adm20.dto.FidoAssertionOptionsResponse;
import open.dolphin.adm20.dto.FidoAssertionResponse;
import open.dolphin.adm20.dto.FidoRegistrationFinishRequest;
import open.dolphin.adm20.dto.FidoRegistrationOptionsRequest;
import open.dolphin.adm20.dto.FidoRegistrationOptionsResponse;
import open.dolphin.adm20.dto.TotpRegistrationRequest;
import open.dolphin.adm20.dto.TotpRegistrationResponse;
import open.dolphin.adm20.dto.TotpVerificationRequest;
import open.dolphin.adm20.dto.TotpVerificationResponse;
import open.dolphin.adm20.session.ADM20_EHTServiceBean;
import open.dolphin.infomodel.Factor2Challenge;
import open.dolphin.infomodel.Factor2Credential;
import open.dolphin.security.SecondFactorSecurityConfig;
import open.dolphin.infomodel.AuditEvent;
import open.dolphin.security.audit.AuditEventPayload;
import open.dolphin.security.audit.AuditTrailService;
import open.dolphin.security.fido.Fido2Config;
import open.dolphin.security.totp.TotpRegistrationResult;
import open.dolphin.security.totp.TotpSecretProtector;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdmissionResourceFactor2Test extends RuntimeDelegateTestSupport {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ADM20_EHTServiceBean ehtService;

    @Mock
    private SecondFactorSecurityConfig secondFactorSecurityConfig;

    @Mock
    private AuditTrailService auditTrailService;

    @Mock
    private HttpServletRequest httpRequest;

    @Captor
    private ArgumentCaptor<AuditEventPayload> auditPayloadCaptor;

    private AdmissionResource resource;

    @BeforeEach
    void setUp() throws Exception {
        resource = new AdmissionResource();
        setField(resource, "ehtService", ehtService);
        setField(resource, "secondFactorSecurityConfig", secondFactorSecurityConfig);
        setField(resource, "auditTrailService", auditTrailService);
        setField(resource, "httpRequest", httpRequest);

        when(httpRequest.getRemoteUser()).thenReturn("legacy-user");
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("User-Agent")).thenReturn("JUnit");
        when(httpRequest.getHeader("X-Request-Id")).thenReturn("trace-001");
        when(httpRequest.isUserInRole("ADMIN")).thenReturn(false);
        when(auditTrailService.record(any())).thenReturn(new AuditEvent());
    }

    @Test
    void startTotpRegistrationRecordsAuditOnSuccess() throws Exception {
        TotpRegistrationRequest request = new TotpRegistrationRequest();
        request.setUserPk(101L);
        request.setLabel("Primary");
        request.setAccountName("account");
        request.setIssuer("OpenDolphin");

        TotpRegistrationResult result = new TotpRegistrationResult(501L, "SECRET", "URI");
        when(secondFactorSecurityConfig.getTotpSecretProtector()).thenReturn(new TotpSecretProtector(new byte[32]));
        when(ehtService.startTotpRegistration(anyLong(), any(), any(), any(), any()))
                .thenReturn(result);

        Response response = resource.startTotpRegistration(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(TotpRegistrationResponse.class);

        TotpRegistrationResponse payload = (TotpRegistrationResponse) response.getEntity();
        assertThat(payload.getCredentialId()).isEqualTo(501L);
        assertThat(payload.getSecret()).isEqualTo("SECRET");
        assertThat(payload.getProvisioningUri()).isEqualTo("URI");

        verify(auditTrailService, times(1)).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("TOTP_REGISTER_INIT");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("credentialId", 501L)
                .containsEntry("label", "Primary");
    }

    @Test
    void startTotpRegistrationRecordsAuditOnNotFound() throws Exception {
        TotpRegistrationRequest request = new TotpRegistrationRequest();
        request.setUserPk(303L);
        request.setLabel("Secondary");

        when(secondFactorSecurityConfig.getTotpSecretProtector()).thenReturn(new TotpSecretProtector(new byte[32]));
        when(ehtService.startTotpRegistration(eq(303L), any(), any(), any(), any()))
                .thenThrow(new NoResultException("user not found"));

        assertThatThrownBy(() -> resource.startTotpRegistration(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.NOT_FOUND.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("TOTP_REGISTER_INIT_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "user_not_found");
    }

    @Test
    void verifyTotpRegistrationRecordsAuditOnSuccess() throws Exception {
        TotpVerificationRequest request = new TotpVerificationRequest();
        request.setUserPk(202L);
        request.setCredentialId(88L);
        request.setCode("654321");

        when(secondFactorSecurityConfig.getTotpSecretProtector()).thenReturn(new TotpSecretProtector(new byte[32]));
        when(ehtService.completeTotpRegistration(eq(202L), eq(88L), eq("654321"), any()))
                .thenReturn(List.of("BACKUP-1", "BACKUP-2"));

        Response response = resource.verifyTotpRegistration(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(TotpVerificationResponse.class);
        TotpVerificationResponse payload = (TotpVerificationResponse) response.getEntity();
        assertThat(payload.isVerified()).isTrue();
        assertThat(payload.getBackupCodes()).containsExactlyInAnyOrder("BACKUP-1", "BACKUP-2");

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("TOTP_REGISTER_COMPLETE");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("credentialId", 88L)
                .containsEntry("backupCodes", 2);
    }

    @Test
    void startFidoRegistrationRecordsAuditOnSuccess() throws Exception {
        FidoRegistrationOptionsRequest request = new FidoRegistrationOptionsRequest();
        request.setUserPk(222L);
        request.setAuthenticatorAttachment("platform");

        Factor2Challenge challenge = new Factor2Challenge();
        challenge.setRequestId("req-222");
        challenge.setChallengePayload("{\"publicKey\":\"options\"}");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.startFidoRegistration(eq(222L), any(Fido2Config.class), eq("platform")))
                .thenReturn(challenge);

        Response response = resource.startFidoRegistration(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(FidoRegistrationOptionsResponse.class);
        FidoRegistrationOptionsResponse payload = (FidoRegistrationOptionsResponse) response.getEntity();
        assertThat(payload.getRequestId()).isEqualTo("req-222");
        assertThat(payload.getPublicKeyCredentialCreationOptions()).isEqualTo("{\"publicKey\":\"options\"}");

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_REGISTER_INIT");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("requestId", "req-222")
                .containsEntry("authenticatorAttachment", "platform");
    }

    @Test
    void finishFidoRegistrationRecordsAuditOnSuccess() throws Exception {
        FidoRegistrationFinishRequest request = new FidoRegistrationFinishRequest();
        request.setUserPk(303L);
        request.setRequestId("req-303");
        request.setCredentialResponse("{\"id\":\"cred\"}");
        request.setLabel("Desktop");

        Factor2Credential credential = new Factor2Credential();
        credential.setCredentialId("cred-303");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoRegistration(eq(303L), eq("req-303"), eq("{\"id\":\"cred\"}"), eq("Desktop"), any(Fido2Config.class)))
                .thenReturn(credential);

        Response response = resource.finishFidoRegistration(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) response.getEntity();
        assertThat(payload).containsEntry("credentialId", "cred-303");

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_REGISTER_COMPLETE");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("credentialId", "cred-303");
    }

    @Test
    void finishFidoRegistrationRecordsAuditOnNotFound() throws Exception {
        FidoRegistrationFinishRequest request = new FidoRegistrationFinishRequest();
        request.setUserPk(404L);
        request.setRequestId("req-404");
        request.setCredentialResponse("{}");
        request.setLabel("Key");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoRegistration(eq(404L), eq("req-404"), eq("{}"), eq("Key"), any(Fido2Config.class)))
                .thenThrow(new NoResultException("challenge_not_found"));

        assertThatThrownBy(() -> resource.finishFidoRegistration(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.NOT_FOUND.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_REGISTER_COMPLETE_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "challenge_not_found")
                .containsEntry("requestId", "req-404");
    }

    @Test
    void finishFidoRegistrationRecordsAuditOnSecurityViolation() throws Exception {
        FidoRegistrationFinishRequest request = new FidoRegistrationFinishRequest();
        request.setUserPk(405L);
        request.setRequestId("req-405");
        request.setCredentialResponse("{\"id\":\"cred\"}");
        request.setLabel("Key");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoRegistration(eq(405L), eq("req-405"), eq("{\"id\":\"cred\"}"), eq("Key"), any(Fido2Config.class)))
                .thenThrow(new SecurityException("attestation_invalid"));

        assertThatThrownBy(() -> resource.finishFidoRegistration(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.BAD_REQUEST.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_REGISTER_COMPLETE_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "attestation_invalid")
                .containsEntry("requestId", "req-405");
    }

    @Test
    void startFidoAssertionRecordsAuditOnSuccess() throws Exception {
        FidoAssertionOptionsRequest request = new FidoAssertionOptionsRequest();
        request.setUserPk(506L);
        request.setUserId("user-506");

        Factor2Challenge challenge = new Factor2Challenge();
        challenge.setRequestId("req-assert-506");
        challenge.setChallengePayload("{\"challenge\":\"value\"}");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.startFidoAssertion(eq(506L), eq("user-506"), any(Fido2Config.class)))
                .thenReturn(challenge);

        Response response = resource.startFidoAssertion(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(FidoAssertionOptionsResponse.class);
        FidoAssertionOptionsResponse payload = (FidoAssertionOptionsResponse) response.getEntity();
        assertThat(payload.getRequestId()).isEqualTo("req-assert-506");
        assertThat(payload.getPublicKeyCredentialRequestOptions()).isEqualTo("{\"challenge\":\"value\"}");

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_ASSERT_INIT");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("requestId", "req-assert-506");
    }

    @Test
    void finishFidoAssertionRecordsAuditOnSuccess() throws Exception {
        FidoAssertionFinishRequest request = new FidoAssertionFinishRequest();
        request.setUserPk(507L);
        request.setRequestId("req-assert-507");
        request.setCredentialResponse("{\"id\":\"cred\"}");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoAssertion(eq(507L), eq("req-assert-507"), eq("{\"id\":\"cred\"}"), any(Fido2Config.class)))
                .thenReturn(true);

        Response response = resource.finishFidoAssertion(objectMapper.writeValueAsString(request));
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        assertThat(response.getEntity()).isInstanceOf(FidoAssertionResponse.class);
        FidoAssertionResponse payload = (FidoAssertionResponse) response.getEntity();
        assertThat(payload.isAuthenticated()).isTrue();

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_ASSERT_COMPLETE");
        assertThat(audit.getDetails())
                .containsEntry("status", "success")
                .containsEntry("requestId", "req-assert-507")
                .containsEntry("authenticated", true);
    }

    @Test
    void finishFidoAssertionRecordsAuditOnChallengeNotFound() throws Exception {
        FidoAssertionFinishRequest request = new FidoAssertionFinishRequest();
        request.setUserPk(508L);
        request.setRequestId("req-assert-508");
        request.setCredentialResponse("{\"id\":\"cred\"}");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoAssertion(eq(508L), eq("req-assert-508"), eq("{\"id\":\"cred\"}"), any(Fido2Config.class)))
                .thenThrow(new NoResultException("challenge_not_found"));

        assertThatThrownBy(() -> resource.finishFidoAssertion(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.NOT_FOUND.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_ASSERT_COMPLETE_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "challenge_not_found")
                .containsEntry("requestId", "req-assert-508");
    }

    @Test
    void finishFidoAssertionRecordsAuditOnSecurityViolation() throws Exception {
        FidoAssertionFinishRequest request = new FidoAssertionFinishRequest();
        request.setUserPk(509L);
        request.setRequestId("req-assert-509");
        request.setCredentialResponse("{\"id\":\"cred\"}");

        Fido2Config config = new Fido2Config("rp-id", "RP", List.of("https://example.com"));
        when(secondFactorSecurityConfig.getFido2Config()).thenReturn(config);
        when(ehtService.finishFidoAssertion(eq(509L), eq("req-assert-509"), eq("{\"id\":\"cred\"}"), any(Fido2Config.class)))
                .thenThrow(new SecurityException("assertion_failed"));

        assertThatThrownBy(() -> resource.finishFidoAssertion(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.BAD_REQUEST.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_ASSERT_COMPLETE_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "assertion_failed")
                .containsEntry("requestId", "req-assert-509");
    }

    @Test
    void startFidoAssertionRecordsAuditOnSecurityViolation() throws Exception {
        FidoAssertionOptionsRequest request = new FidoAssertionOptionsRequest();
        request.setUserPk(808L);
        request.setUserId("user-808");

        when(ehtService.startFidoAssertion(eq(808L), eq("user-808"), any()))
                .thenThrow(new SecurityException("credential revoked"));

        assertThatThrownBy(() -> resource.startFidoAssertion(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.BAD_REQUEST.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("FIDO2_ASSERT_INIT_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "credential revoked")
                .containsEntry("userId", "user-808");
    }

    @Test
    void verifyTotpRegistrationFailureRecordsAudit() throws Exception {
        TotpVerificationRequest request = new TotpVerificationRequest();
        request.setUserPk(909L);
        request.setCredentialId(44L);
        request.setCode("123456");

        when(ehtService.completeTotpRegistration(eq(909L), eq(44L), eq("123456"), any()))
                .thenThrow(new SecurityException("invalid_code"));

        assertThatThrownBy(() -> resource.verifyTotpRegistration(objectMapper.writeValueAsString(request)))
                .isInstanceOf(WebApplicationException.class)
                .extracting(ex -> ((WebApplicationException) ex).getResponse().getStatus())
                .isEqualTo(Response.Status.BAD_REQUEST.getStatusCode());

        verify(auditTrailService).record(auditPayloadCaptor.capture());
        AuditEventPayload audit = auditPayloadCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("TOTP_REGISTER_COMPLETE_FAILED");
        assertThat(audit.getDetails())
                .containsEntry("status", "failed")
                .containsEntry("reason", "invalid_code")
                .containsEntry("credentialId", 44L);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
