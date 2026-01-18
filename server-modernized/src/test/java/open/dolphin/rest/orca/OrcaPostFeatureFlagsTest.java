package open.dolphin.rest.orca;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class OrcaPostFeatureFlagsTest {

    @AfterEach
    void tearDown() {
        System.clearProperty("orca.post.subjectives.mode");
        System.clearProperty("orca.post.subjectives.useStub");
        System.clearProperty("orca.post.subjectives.real");
        System.clearProperty("orca.post.mode");
    }

    @Test
    void defaultsToRealWhenUnset() {
        assertTrue(OrcaPostFeatureFlags.useRealSubjectives(),
                "No env/props -> REAL by default");
    }

    @Test
    void useStubFlagDisablesReal() {
        System.setProperty("orca.post.subjectives.useStub", "true");

        assertFalse(OrcaPostFeatureFlags.useRealSubjectives(),
                "useStub=true should force stub");
    }

    @Test
    void modeStubOverridesDefault() {
        System.setProperty("orca.post.subjectives.mode", "stub");

        assertFalse(OrcaPostFeatureFlags.useRealSubjectives(),
                "mode=stub should force stub");
    }

    @Test
    void modeRealKeepsReal() {
        System.setProperty("orca.post.subjectives.mode", "real");

        assertTrue(OrcaPostFeatureFlags.useRealSubjectives(),
                "mode=real should force real even if default changes");
    }
}
