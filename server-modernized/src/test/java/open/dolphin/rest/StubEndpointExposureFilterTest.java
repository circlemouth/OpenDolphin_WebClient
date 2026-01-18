package open.dolphin.rest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class StubEndpointExposureFilterTest {

    @AfterEach
    void tearDown() {
        System.clearProperty(StubEndpointExposureFilter.PROP_MODE);
        System.clearProperty(StubEndpointExposureFilter.PROP_ALLOW);
        System.clearProperty(StubEndpointExposureFilter.PROP_ENVIRONMENT);
    }

    @Test
    void stubPathDetectionWorks() {
        StubEndpointExposureFilter filter = new StubEndpointExposureFilter();
        filter.init(null);
        assertTrue(filter.isStubPath("/orca/medical-sets"));
        assertTrue(filter.isStubPath("/resources/orca/tensu/sync"));
        assertFalse(filter.isStubPath("/orca/patient"));
    }

    @Test
    void allowsByDefaultWhenEnvUnset() {
        StubEndpointExposureFilter filter = new StubEndpointExposureFilter();
        filter.init(null);
        assertTrue(filter.isStubExposureAllowed(), "Default (no env) should allow for dev/local");
    }

    @Test
    void blocksInProductionLikeEnvironmentByDefault() {
        System.setProperty(StubEndpointExposureFilter.PROP_ENVIRONMENT, "production");
        StubEndpointExposureFilter filter = new StubEndpointExposureFilter();
        filter.init(null);
        assertFalse(filter.isStubExposureAllowed());
    }

    @Test
    void allowsWhenExplicitlyEnabled() {
        System.setProperty(StubEndpointExposureFilter.PROP_ALLOW, "true");
        System.setProperty(StubEndpointExposureFilter.PROP_ENVIRONMENT, "production");
        StubEndpointExposureFilter filter = new StubEndpointExposureFilter();
        filter.init(null);
        assertTrue(filter.isStubExposureAllowed());
    }

    @Test
    void allowsWhenModeIsAllow() {
        System.setProperty(StubEndpointExposureFilter.PROP_MODE, "allow");
        System.setProperty(StubEndpointExposureFilter.PROP_ENVIRONMENT, "production");
        StubEndpointExposureFilter filter = new StubEndpointExposureFilter();
        filter.init(null);
        assertTrue(filter.isStubExposureAllowed());
    }
}
