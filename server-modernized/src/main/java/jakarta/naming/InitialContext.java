package jakarta.naming;

import java.util.Hashtable;

/**
 * Lightweight Jakarta InitialContext facade delegating to the JDK javax.naming implementation.
 */
public class InitialContext implements AutoCloseable {

    private final javax.naming.InitialContext delegate;

    public InitialContext() throws NamingException {
        this.delegate = createDelegate(null);
    }

    public InitialContext(Hashtable<?, ?> environment) throws NamingException {
        this.delegate = createDelegate(environment);
    }

    private static javax.naming.InitialContext createDelegate(Hashtable<?, ?> environment) throws NamingException {
        try {
            return environment == null
                    ? new javax.naming.InitialContext()
                    : new javax.naming.InitialContext(environment);
        } catch (javax.naming.NamingException ex) {
            throw wrap(ex);
        }
    }

    public Object lookup(String name) throws NamingException {
        try {
            return delegate.lookup(name);
        } catch (javax.naming.NamingException ex) {
            throw wrap(ex);
        }
    }

    public static Object doLookup(String name) throws NamingException {
        try {
            return javax.naming.InitialContext.doLookup(name);
        } catch (javax.naming.NamingException ex) {
            throw wrap(ex);
        }
    }

    @Override
    public void close() throws NamingException {
        try {
            delegate.close();
        } catch (javax.naming.NamingException ex) {
            throw wrap(ex);
        }
    }

    private static NamingException wrap(javax.naming.NamingException ex) {
        NamingException ne = new NamingException(ex.getMessage());
        ne.initCause(ex);
        return ne;
    }
}
