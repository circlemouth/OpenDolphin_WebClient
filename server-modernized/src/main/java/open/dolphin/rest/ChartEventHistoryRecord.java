package open.dolphin.rest;

public record ChartEventHistoryRecord(long eventId, String issuerUuid, String payloadJson) {
}
