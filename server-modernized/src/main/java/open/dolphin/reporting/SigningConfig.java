package open.dolphin.reporting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;

/**
 * Configuration required to apply a digital signature and timestamp to generated PDFs.
 */
public final class SigningConfig {

    private final Path keystorePath;
    private final char[] keystorePassword;
    private final String keyAlias;
    private final String tsaUrl;
    private final String tsaUsername;
    private final char[] tsaPassword;
    private final String reason;
    private final String location;

    private SigningConfig(Builder builder) {
        this.keystorePath = builder.keystorePath;
        this.keystorePassword = builder.keystorePassword != null ? builder.keystorePassword.clone() : null;
        this.keyAlias = builder.keyAlias;
        this.tsaUrl = builder.tsaUrl;
        this.tsaUsername = builder.tsaUsername;
        this.tsaPassword = builder.tsaPassword != null ? builder.tsaPassword.clone() : null;
        this.reason = builder.reason;
        this.location = builder.location;
    }

    public Path getKeystorePath() {
        return keystorePath;
    }

    public char[] getKeystorePassword() {
        return keystorePassword.clone();
    }

    public String getKeyAlias() {
        return keyAlias;
    }

    public String getTsaUrl() {
        return tsaUrl;
    }

    public String getTsaUsername() {
        return tsaUsername;
    }

    public char[] getTsaPassword() {
        return tsaPassword != null ? tsaPassword.clone() : null;
    }

    public String getReason() {
        return reason;
    }

    public String getLocation() {
        return location;
    }

    public static SigningConfig fromJson(Path configPath) throws IOException {
        Objects.requireNonNull(configPath, "configPath must not be null");
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream inputStream = Files.newInputStream(configPath)) {
            JsonNode root = mapper.readTree(inputStream);
            Builder builder = new Builder();
            Path keystore = resolvePath(configPath, text(root, "keystorePath"));
            builder.keystorePath(keystore)
                    .keystorePassword(text(root, "keystorePassword").toCharArray())
                    .keyAlias(text(root, "keyAlias"))
                    .reason(text(root, "reason"))
                    .location(text(root, "location"));
            if (root.hasNonNull("tsaUrl")) {
                builder.tsaUrl(text(root, "tsaUrl"));
            }
            if (root.hasNonNull("tsaUsername")) {
                builder.tsaUsername(text(root, "tsaUsername"));
            }
            if (root.hasNonNull("tsaPassword")) {
                builder.tsaPassword(text(root, "tsaPassword").toCharArray());
            }
            return builder.build();
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            throw new IllegalArgumentException("Missing field '" + field + "' in signing config");
        }
        return value.asText();
    }

    private static Path resolvePath(Path configPath, String raw) {
        Path path = Paths.get(raw);
        if (path.isAbsolute()) {
            return path;
        }
        Path parent = configPath.getParent();
        if (parent == null) {
            return path.toAbsolutePath();
        }
        return parent.resolve(path).normalize();
    }

    public static final class Builder {

        private Path keystorePath;
        private char[] keystorePassword;
        private String keyAlias;
        private String tsaUrl;
        private String tsaUsername;
        private char[] tsaPassword;
        private String reason;
        private String location;

        public Builder keystorePath(Path keystorePath) {
            this.keystorePath = Objects.requireNonNull(keystorePath, "keystorePath must not be null");
            return this;
        }

        public Builder keystorePassword(char[] keystorePassword) {
            this.keystorePassword = Objects.requireNonNull(keystorePassword, "keystorePassword must not be null").clone();
            return this;
        }

        public Builder keyAlias(String keyAlias) {
            this.keyAlias = Objects.requireNonNull(keyAlias, "keyAlias must not be null");
            return this;
        }

        public Builder tsaUrl(String tsaUrl) {
            this.tsaUrl = tsaUrl;
            return this;
        }

        public Builder tsaUsername(String tsaUsername) {
            this.tsaUsername = tsaUsername;
            return this;
        }

        public Builder tsaPassword(char[] tsaPassword) {
            this.tsaPassword = tsaPassword == null ? null : tsaPassword.clone();
            return this;
        }

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder location(String location) {
            this.location = location;
            return this;
        }

        public SigningConfig build() {
            Objects.requireNonNull(keystorePath, "keystorePath must not be null");
            Objects.requireNonNull(keystorePassword, "keystorePassword must not be null");
            Objects.requireNonNull(keyAlias, "keyAlias must not be null");
            return new SigningConfig(this);
        }
    }
}
