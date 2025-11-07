package open.dolphin.session.support;

/**
 * ChartEvent セッション連携で使用する属性名やイベント定数を集約するユーティリティ。
 * REST 層・セッション層双方から参照され、相互依存を避けるために session.support 配下へ配置する。
 */
public final class ChartEventSessionKeys {

    private ChartEventSessionKeys() {
        // utility class
    }

    public static final String CLIENT_UUID = "clientUUID";
    public static final String FACILITY_ID = "fid";
    public static final String DISPATCH_URL = "/resources/chartEvent/dispatch";
    public static final String EVENT_ATTRIBUTE = "chartEvent";
    public static final String SSE_EVENT_NAME = "chart-event";
    public static final String SSE_REPLAY_GAP_EVENT_NAME = "chart-events.replay-gap";
    public static final String HISTORY_GAP_ATTRIBUTE = "chartEventHistoryGapDetected";
}
