package open.orca.rest;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Objects;

/**
 * Shared Basic認可ロジックをaliasリソースからも使えるように切り出したヘルパー。
 */
final class OrcaMasterAuthSupport {

    static final String DEFAULT_USERNAME = "1.3.6.1.4.1.9414.70.1:admin";
    static final String DEFAULT_PASSWORD = "21232f297a57a5a743894a0e4a801fc3";

    private OrcaMasterAuthSupport() {
    }

    static boolean isAuthorized(HttpServletRequest request, String userName, String password) {
        String resolvedUser = firstNonBlank(userName);
        String resolvedPassword = firstNonBlank(password);
        if (resolvedUser == null || resolvedPassword == null) {
            BasicAuth basicAuth = resolveBasicAuth(request);
            if (basicAuth != null) {
                if (resolvedUser == null) {
                    resolvedUser = basicAuth.user;
                }
                if (resolvedPassword == null) {
                    resolvedPassword = basicAuth.password;
                }
            }
        }
        if (resolvedUser == null || resolvedPassword == null) {
            return false;
        }
        String expectedUser = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_USER"),
                System.getProperty("ORCA_MASTER_BASIC_USER"),
                DEFAULT_USERNAME
        );
        String expectedPassword = firstNonBlank(
                System.getenv("ORCA_MASTER_BASIC_PASSWORD"),
                System.getProperty("ORCA_MASTER_BASIC_PASSWORD"),
                DEFAULT_PASSWORD
        );
        return Objects.equals(expectedUser, resolvedUser) && Objects.equals(expectedPassword, resolvedPassword);
    }

    private static BasicAuth resolveBasicAuth(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String header = request.getHeader("Authorization");
        if (header == null || header.isBlank()) {
            return null;
        }
        String trimmed = header.trim();
        if (!trimmed.regionMatches(true, 0, "Basic ", 0, 6)) {
            return null;
        }
        String encoded = trimmed.substring(6).trim();
        if (encoded.isEmpty()) {
            return null;
        }
        String decoded;
        try {
            decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return null;
        }
        int sep = decoded.lastIndexOf(':');
        if (sep < 0) {
            return null;
        }
        String user = decoded.substring(0, sep).trim();
        String pass = decoded.substring(sep + 1);
        if (user.isBlank() || pass == null) {
            return null;
        }
        return new BasicAuth(user, pass);
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    private static final class BasicAuth {
        private final String user;
        private final String password;

        private BasicAuth(String user, String password) {
            this.user = user;
            this.password = password;
        }
    }
}

