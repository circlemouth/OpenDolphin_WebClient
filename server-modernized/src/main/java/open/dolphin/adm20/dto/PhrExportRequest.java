package open.dolphin.adm20.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Request payload for asynchronous PHR export.
 */
public class PhrExportRequest {

    private List<String> patientIds;
    private String documentSince;
    private String labSince;
    private Integer rpRequest;
    private String replyTo;
    private String format;

    public List<String> getPatientIds() {
        return immutableList(patientIds);
    }

    public void setPatientIds(List<String> patientIds) {
        this.patientIds = immutableList(patientIds);
    }

    public String getDocumentSince() {
        return documentSince;
    }

    public void setDocumentSince(String documentSince) {
        this.documentSince = documentSince;
    }

    public String getLabSince() {
        return labSince;
    }

    public void setLabSince(String labSince) {
        this.labSince = labSince;
    }

    public Integer getRpRequest() {
        return rpRequest;
    }

    public void setRpRequest(Integer rpRequest) {
        this.rpRequest = rpRequest;
    }

    public String getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(String replyTo) {
        this.replyTo = replyTo;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public boolean isEmpty() {
        return patientIds == null || patientIds.isEmpty();
    }

    private static List<String> immutableList(List<String> source) {
        return source == null ? null : Collections.unmodifiableList(new ArrayList<>(source));
    }
}
