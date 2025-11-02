package open.dolphin.infrastructure.concurrent;

/**
 * 共通で利用する Jakarta Concurrency リソースの JNDI 名を集中管理する定数クラス。
 */
public final class ConcurrencyResourceNames {

    public static final String DEFAULT_CONTEXT = "java:jboss/ee/concurrency/context/default";
    public static final String DEFAULT_EXECUTOR = "java:jboss/ee/concurrency/executor/default";
    public static final String DEFAULT_SCHEDULER = "java:jboss/ee/concurrency/scheduler/default";
    public static final String DEFAULT_THREAD_FACTORY = "java:jboss/ee/concurrency/factory/default";

    private ConcurrencyResourceNames() {
    }
}
