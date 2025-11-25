package open.dolphin.msg.gateway;

/**
 * JMS メッセージで利用するカスタムヘッダー名を集中管理するユーティリティ。
 * JMS 仕様の「Java 識別子」制限や予約語（JMSX/JMS_）を避けた名称を保持する。
 */
public final class MessagingHeaders {

    /**
     * セッション層 Trace-ID を伝搬するヘッダー名。
     * Java の識別子要件を満たすため camelCase を採用する。
     */
    public static final String TRACE_ID = "openDolphinTraceId";

    /**
     * PAYLOAD の種類 (CLAIM/DIAGNOSIS など) を伝搬するヘッダー名。
     */
    public static final String PAYLOAD_TYPE = "openDolphinPayloadType";

    private MessagingHeaders() {
        // util class
    }
}
