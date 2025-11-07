package open.dolphin.touch.support;

/**
 * Touch API 向け統一エラーレスポンス。
 */
public record TouchErrorResponse(String type, String message, String traceId) {
}

