package open.dolphin.session.audit;

/**
 * Stamp API のスレッドローカル監査コンテキスト。
 */
public final class StampAuditContextHolder {

    private static final ThreadLocal<StampAuditContext> CONTEXT = new ThreadLocal<>();

    private StampAuditContextHolder() {
    }

    public static void set(StampAuditContext context) {
        if (context == null) {
            CONTEXT.remove();
        } else {
            CONTEXT.set(context);
        }
    }

    public static StampAuditContext get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
