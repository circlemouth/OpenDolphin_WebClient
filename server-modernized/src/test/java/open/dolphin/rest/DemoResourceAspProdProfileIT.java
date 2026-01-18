package open.dolphin.rest;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import jakarta.ws.rs.WebApplicationException;
import open.dolphin.rest.config.DemoApiSettingsLoader;
import open.dolphin.testsupport.RuntimeDelegateTestSupport;
import org.junit.jupiter.api.Test;

/**
 * prod プロファイルで Demo API が無効化されることのスモーク IT。
 * dev プロファイルでは設定が有効なため、本テストはスキップされる。
 */
class DemoResourceAspProdProfileIT extends RuntimeDelegateTestSupport {

    @Test
    void demoEndpointsReturn404WhenDisabled() {
        boolean enabled = new DemoApiSettingsLoader().load().enabled();
        assumeTrue(!enabled, "demo.api.enabled is true (dev profile); skip prod-only test");

        DemoResourceAsp resource = new DemoResourceAsp();

        assertThatThrownBy(() -> resource.getUser("ehrTouch,2.100,098f6bcd4621d373cade4e832627b4f6"))
                .isInstanceOf(WebApplicationException.class)
                .satisfies(ex -> org.assertj.core.api.Assertions
                        .assertThat(((WebApplicationException) ex).getResponse().getStatus())
                        .isEqualTo(404));
    }
}
