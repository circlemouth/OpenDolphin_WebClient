package open.dolphin.testsupport;

/**
 * テストで Jakarta REST の {@link jakarta.ws.rs.ext.RuntimeDelegate} を利用可能にする基底クラス。
 */
public abstract class RuntimeDelegateTestSupport {

    static {
        TestRuntimeDelegate.ensureRegistered();
    }
}
