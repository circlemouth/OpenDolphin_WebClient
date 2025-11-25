package open.dolphin.msg.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Summary of an MML dispatch attempt, including metadata required by CLI parity
 * tests (trace correlation, payload hash, preview, etc.).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MmlDispatchResult(
        String traceId,
        String documentId,
        Long documentPk,
        boolean sendMmlRequested,
        boolean sendClaimRequested,
        boolean sendLabtestRequested,
        String patientId,
        int moduleCount,
        int schemaCount,
        int attachmentCount,
        int charLength,
        int byteLength,
        String encoding,
        String sha256,
        String preview,
        String payload
) {}
