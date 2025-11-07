package open.dolphin.testsupport;

import jakarta.ws.rs.SeBootstrap;
import jakarta.ws.rs.core.Application;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.EntityPart;
import jakarta.ws.rs.core.EntityTag;
import jakarta.ws.rs.core.GenericType;
import jakarta.ws.rs.core.Link;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.Response.StatusType;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.core.Variant;
import jakarta.ws.rs.ext.RuntimeDelegate;
import java.lang.annotation.Annotation;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.StringJoiner;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * {@link RuntimeDelegate} 互換のテスト用スタブ。
 * JAX-RS 実装がクラスパス上にない状態でも {@link Response} を生成できるようにする。
 */
public final class TestRuntimeDelegate extends RuntimeDelegate {

    private static final AtomicBoolean REGISTERED = new AtomicBoolean(false);

    public static void ensureRegistered() {
        if (REGISTERED.compareAndSet(false, true)) {
            RuntimeDelegate.setInstance(new TestRuntimeDelegate());
        }
    }

    private TestRuntimeDelegate() {
    }

    @Override
    public Response.ResponseBuilder createResponseBuilder() {
        return new SimpleResponseBuilder();
    }

    @Override
    public UriBuilder createUriBuilder() {
        throw new UnsupportedOperationException("UriBuilder is not supported in test RuntimeDelegate.");
    }

    @Override
    public Variant.VariantListBuilder createVariantListBuilder() {
        return new VariantListBuilderStub();
    }

    @Override
    public Link.Builder createLinkBuilder() {
        return Link.fromUri("about:blank");
    }

    @Override
    public <T> T createEndpoint(Application application, Class<T> endpointType) {
        throw new UnsupportedOperationException("Endpoint creation is not supported in test RuntimeDelegate.");
    }

    @Override
    public <T> HeaderDelegate<T> createHeaderDelegate(Class<T> type) {
        if (CacheControl.class.equals(type)) {
            return (HeaderDelegate<T>) new HeaderDelegate<CacheControl>() {
                @Override
                public CacheControl fromString(String value) {
                    throw new UnsupportedOperationException("CacheControl parsing not supported in test RuntimeDelegate.");
                }

                @Override
                public String toString(CacheControl value) {
                    if (value == null) {
                        return null;
                    }
                    List<String> directives = new ArrayList<>();
                    if (value.isNoCache()) {
                        if (!value.getNoCacheFields().isEmpty()) {
                            directives.add("no-cache=\"" + String.join(", ", value.getNoCacheFields()) + "\"");
                        } else {
                            directives.add("no-cache");
                        }
                    }
                    if (value.isNoStore()) {
                        directives.add("no-store");
                    }
                    if (value.isMustRevalidate()) {
                        directives.add("must-revalidate");
                    }
                    if (value.isProxyRevalidate()) {
                        directives.add("proxy-revalidate");
                    }
                    if (value.isNoTransform()) {
                        directives.add("no-transform");
                    }
                    if (value.getMaxAge() >= 0) {
                        directives.add("max-age=" + value.getMaxAge());
                    }
                    if (value.getSMaxAge() >= 0) {
                        directives.add("s-maxage=" + value.getSMaxAge());
                    }
                    if (!value.getPrivateFields().isEmpty()) {
                        directives.add("private=\"" + String.join(", ", value.getPrivateFields()) + "\"");
                    }
                    value.getCacheExtension().forEach((k, v) -> directives.add(v != null ? k + '=' + v : k));
                    return String.join(", ", directives);
                }
            };
        }
        if (MediaType.class.equals(type)) {
            return (HeaderDelegate<T>) new HeaderDelegate<MediaType>() {
                @Override
                public MediaType fromString(String value) {
                    if (value == null) {
                        return null;
                    }
                    String trimmed = value.trim();
                    if (trimmed.isEmpty()) {
                        return null;
                    }
                    String[] parts = trimmed.split(";");
                    String typePart = parts[0].trim();
                    String[] typeSegments = typePart.split("/", 2);
                    String type = typeSegments.length > 0 && !typeSegments[0].isEmpty() ? typeSegments[0].trim() : "*";
                    String subtype = typeSegments.length > 1 && !typeSegments[1].isEmpty() ? typeSegments[1].trim() : "*";
                    Map<String, String> parameters = new LinkedHashMap<>();
                    for (int i = 1; i < parts.length; i++) {
                        String segment = parts[i].trim();
                        if (segment.isEmpty()) {
                            continue;
                        }
                        int eq = segment.indexOf('=');
                        if (eq > 0) {
                            String name = segment.substring(0, eq).trim();
                            String val = segment.substring(eq + 1).trim();
                            if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                                val = val.substring(1, val.length() - 1);
                            }
                            parameters.put(name, val);
                        } else {
                            parameters.put(segment, "");
                        }
                    }
                    return new MediaType(type, subtype, parameters);
                }

                @Override
                public String toString(MediaType value) {
                    if (value == null) {
                        return null;
                    }
                    StringBuilder builder = new StringBuilder();
                    builder.append(value.getType()).append('/').append(value.getSubtype());
                    value.getParameters().forEach((key, val) -> {
                        builder.append(';').append(key).append('=');
                        if (val != null && !val.isEmpty()) {
                            builder.append(val);
                        }
                    });
                    return builder.toString();
                }
            };
        }
        return new HeaderDelegate<>() {
            @Override
            public T fromString(String value) {
                throw new UnsupportedOperationException("Header parsing not supported for " + type);
            }

            @Override
            public String toString(T value) {
                return value == null ? null : value.toString();
            }
        };
    }

    @Override
    public SeBootstrap.Configuration.Builder createConfigurationBuilder() {
        throw new UnsupportedOperationException("SeBootstrap not supported in test RuntimeDelegate.");
    }

    @Override
    public CompletionStage<SeBootstrap.Instance> bootstrap(Application application, SeBootstrap.Configuration configuration) {
        CompletableFuture<SeBootstrap.Instance> future = new CompletableFuture<>();
        future.completeExceptionally(new UnsupportedOperationException("SeBootstrap bootstrap not supported in tests."));
        return future;
    }

    @Override
    public CompletionStage<SeBootstrap.Instance> bootstrap(Class<? extends Application> applicationClass, SeBootstrap.Configuration configuration) {
        CompletableFuture<SeBootstrap.Instance> future = new CompletableFuture<>();
        future.completeExceptionally(new UnsupportedOperationException("SeBootstrap bootstrap not supported in tests."));
        return future;
    }

    @Override
    public EntityPart.Builder createEntityPartBuilder(String name) {
        throw new UnsupportedOperationException("EntityPart builder not supported in test RuntimeDelegate.");
    }

    /**
     * {@link Response.ResponseBuilder} の簡易実装。
     */
    private static final class SimpleResponseBuilder extends Response.ResponseBuilder {

        private int status = Status.OK.getStatusCode();
        private String reasonPhrase = Status.OK.getReasonPhrase();
        private Object entity;
        private Annotation[] entityAnnotations = new Annotation[0];
        private MediaType mediaType;
        private Locale language;
        private URI location;
        private URI contentLocation;
        private Date lastModified;
        private Date expires;
        private CacheControl cacheControl;
        private EntityTag entityTag;
        private String encoding;
        private final Set<String> allowedMethods = new LinkedHashSet<>();
        private final Map<String, NewCookie> cookies = new LinkedHashMap<>();
        private final Set<Link> links = new LinkedHashSet<>();
        private final MultivaluedMap<String, Object> headers = new MultivaluedHashMap<>();

        @Override
        public Response build() {
            return new SimpleResponse(
                    status,
                    reasonPhrase,
                    entity,
                    entityAnnotations,
                    mediaType,
                    language,
                    location,
                    contentLocation,
                    lastModified,
                    expires,
                    cacheControl,
                    entityTag,
                    encoding,
                    allowedMethods,
                    cookies,
                    links,
                    headers
            );
        }

        @Override
        public Response.ResponseBuilder clone() {
            SimpleResponseBuilder copy = new SimpleResponseBuilder();
            copy.status = status;
            copy.reasonPhrase = reasonPhrase;
            copy.entity = entity;
            copy.entityAnnotations = entityAnnotations.clone();
            copy.mediaType = mediaType;
            copy.language = language;
            copy.location = location;
            copy.contentLocation = contentLocation;
            copy.lastModified = lastModified != null ? new Date(lastModified.getTime()) : null;
            copy.expires = expires != null ? new Date(expires.getTime()) : null;
            copy.cacheControl = cacheControl;
            copy.entityTag = entityTag;
            copy.encoding = encoding;
            copy.allowedMethods.addAll(allowedMethods);
            copy.cookies.putAll(cookies);
            copy.links.addAll(links);
            headers.forEach((key, value) -> copy.headers.put(key, new ArrayList<>(value)));
            return copy;
        }

        @Override
        public Response.ResponseBuilder status(int status) {
            this.status = status;
            this.reasonPhrase = Status.fromStatusCode(status) != null
                    ? Status.fromStatusCode(status).getReasonPhrase()
                    : Integer.toString(status);
            return this;
        }

        @Override
        public Response.ResponseBuilder status(Status status) {
            if (status != null) {
                this.status = status.getStatusCode();
                this.reasonPhrase = status.getReasonPhrase();
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder status(StatusType status) {
            if (status != null) {
                this.status = status.getStatusCode();
                this.reasonPhrase = status.getReasonPhrase();
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder status(int status, String reasonPhrase) {
            this.status = status;
            this.reasonPhrase = reasonPhrase;
            return this;
        }

        @Override
        public Response.ResponseBuilder entity(Object entity) {
            this.entity = entity;
            return this;
        }

        @Override
        public Response.ResponseBuilder entity(Object entity, Annotation[] annotations) {
            this.entity = entity;
            this.entityAnnotations = annotations != null ? annotations.clone() : new Annotation[0];
            return this;
        }

        @Override
        public Response.ResponseBuilder allow(String... methods) {
            if (methods != null) {
                Collections.addAll(allowedMethods, methods);
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder allow(Set<String> methods) {
            if (methods != null) {
                allowedMethods.addAll(methods);
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder cacheControl(CacheControl cacheControl) {
            this.cacheControl = cacheControl;
            return this;
        }

        @Override
        public Response.ResponseBuilder encoding(String encoding) {
            this.encoding = encoding;
            return this;
        }

        @Override
        public Response.ResponseBuilder header(String name, Object value) {
            if (name != null && value != null) {
                headers.add(name, value);
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder replaceAll(MultivaluedMap<String, Object> headers) {
            this.headers.clear();
            if (headers != null) {
                headers.forEach((key, values) -> this.headers.put(key, new ArrayList<>(values)));
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder language(String language) {
            this.language = language != null ? Locale.forLanguageTag(language) : null;
            return this;
        }

        @Override
        public Response.ResponseBuilder language(Locale language) {
            this.language = language;
            return this;
        }

        @Override
        public Response.ResponseBuilder location(URI location) {
            this.location = location;
            return this;
        }

        @Override
        public Response.ResponseBuilder contentLocation(URI location) {
            this.contentLocation = location;
            return this;
        }

        @Override
        public Response.ResponseBuilder tag(EntityTag tag) {
            this.entityTag = tag;
            return this;
        }

        @Override
        public Response.ResponseBuilder tag(String tag) {
            this.entityTag = tag != null ? new EntityTag(tag) : null;
            return this;
        }

        @Override
        public Response.ResponseBuilder variant(Variant variant) {
            if (variant != null) {
                this.mediaType = variant.getMediaType();
                this.language = variant.getLanguage();
                this.encoding = variant.getEncoding();
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder variants(List<Variant> variants) {
            if (variants != null && !variants.isEmpty()) {
                variant(variants.get(0));
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder variants(Variant... variants) {
            if (variants != null && variants.length > 0) {
                variant(variants[0]);
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder type(MediaType type) {
            this.mediaType = type;
            return this;
        }

        @Override
        public Response.ResponseBuilder type(String type) {
            this.mediaType = type != null ? MediaType.valueOf(type) : null;
            return this;
        }

        @Override
        public Response.ResponseBuilder cookie(NewCookie... cookies) {
            if (cookies != null) {
                for (NewCookie cookie : cookies) {
                    if (cookie != null) {
                        this.cookies.put(cookie.getName(), cookie);
                    }
                }
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder expires(Date expires) {
            this.expires = expires != null ? new Date(expires.getTime()) : null;
            return this;
        }

        @Override
        public Response.ResponseBuilder lastModified(Date lastModified) {
            this.lastModified = lastModified != null ? new Date(lastModified.getTime()) : null;
            return this;
        }

        @Override
        public Response.ResponseBuilder links(Link... links) {
            if (links != null) {
                Collections.addAll(this.links, links);
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder link(URI uri, String rel) {
            if (uri != null && rel != null) {
                links.add(Link.fromUri(uri).rel(rel).build());
            }
            return this;
        }

        @Override
        public Response.ResponseBuilder link(String uri, String rel) {
            if (uri != null && rel != null) {
                links.add(Link.fromUri(uri).rel(rel).build());
            }
            return this;
        }
    }

    /**
     * {@link Response} の簡易実装。
     */
    private static final class SimpleResponse extends Response {

        private final int status;
        private final StatusType statusInfo;
        private final Object entity;
        private final Annotation[] entityAnnotations;
        private final MediaType mediaType;
        private final Locale language;
        private final URI location;
        private final URI contentLocation;
        private final Date lastModified;
        private final Date expires;
        private final CacheControl cacheControl;
        private final EntityTag entityTag;
        private final String encoding;
        private final Set<String> allowedMethods;
        private final Map<String, NewCookie> cookies;
        private final Set<Link> links;
        private final MultivaluedMap<String, Object> headers;
        private boolean closed;

        SimpleResponse(
                int status,
                String reason,
                Object entity,
                Annotation[] entityAnnotations,
                MediaType mediaType,
                Locale language,
                URI location,
                URI contentLocation,
                Date lastModified,
                Date expires,
                CacheControl cacheControl,
                EntityTag entityTag,
                String encoding,
                Set<String> allowedMethods,
                Map<String, NewCookie> cookies,
                Set<Link> links,
                MultivaluedMap<String, Object> headers
        ) {
            this.status = status;
            Status canonical = Status.fromStatusCode(status);
            this.statusInfo = canonical != null ? canonical : new StatusType() {
                @Override
                public int getStatusCode() {
                    return status;
                }

                @Override
                public Status.Family getFamily() {
                    return Status.Family.familyOf(status);
                }

                @Override
                public String getReasonPhrase() {
                    return reason != null ? reason : Integer.toString(status);
                }
            };
            this.entity = entity;
            this.entityAnnotations = entityAnnotations != null ? entityAnnotations.clone() : new Annotation[0];
            this.mediaType = mediaType;
            this.language = language;
            this.location = location;
            this.contentLocation = contentLocation;
            this.lastModified = lastModified != null ? new Date(lastModified.getTime()) : null;
            this.expires = expires != null ? new Date(expires.getTime()) : null;
            this.cacheControl = cacheControl;
            this.entityTag = entityTag;
            this.encoding = encoding;
            this.allowedMethods = Collections.unmodifiableSet(new LinkedHashSet<>(allowedMethods));
            this.cookies = Collections.unmodifiableMap(new LinkedHashMap<>(cookies));
            this.links = Collections.unmodifiableSet(new LinkedHashSet<>(links));
            this.headers = new MultivaluedHashMap<>();
            headers.forEach((key, value) -> this.headers.put(key, new ArrayList<>(value)));
            if (this.cacheControl != null) {
                this.headers.putSingle("Cache-Control", this.cacheControl);
            }
        }

        @Override
        public int getStatus() {
            return status;
        }

        @Override
        public StatusType getStatusInfo() {
            return statusInfo;
        }

        @Override
        public Object getEntity() {
            return entity;
        }

        @Override
        public <T> T readEntity(Class<T> entityType) {
            return entity == null ? null : entityType.cast(entity);
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> T readEntity(GenericType<T> entityType) {
            return (T) entity;
        }

        @Override
        public <T> T readEntity(Class<T> entityType, Annotation[] annotations) {
            return readEntity(entityType);
        }

        @Override
        @SuppressWarnings("unchecked")
        public <T> T readEntity(GenericType<T> entityType, Annotation[] annotations) {
            return (T) entity;
        }

        @Override
        public boolean hasEntity() {
            return entity != null;
        }

        @Override
        public boolean bufferEntity() {
            return false;
        }

        @Override
        public void close() {
            closed = true;
        }

        @Override
        public MediaType getMediaType() {
            return mediaType;
        }

        @Override
        public Locale getLanguage() {
            return language;
        }

        @Override
        public int getLength() {
            return -1;
        }

        @Override
        public Set<String> getAllowedMethods() {
            return allowedMethods;
        }

        @Override
        public Map<String, NewCookie> getCookies() {
            return cookies;
        }

        @Override
        public EntityTag getEntityTag() {
            return entityTag;
        }

        @Override
        public Date getDate() {
            return null;
        }

        @Override
        public Date getLastModified() {
            return lastModified != null ? new Date(lastModified.getTime()) : null;
        }

        @Override
        public URI getLocation() {
            return location;
        }

        @Override
        public Set<Link> getLinks() {
            return links;
        }

        @Override
        public boolean hasLink(String relation) {
            return getLink(relation) != null;
        }

        @Override
        public Link getLink(String relation) {
            if (relation == null) {
                return null;
            }
            return links.stream()
                    .filter(link -> relation.equals(link.getRel()))
                    .findFirst()
                    .orElse(null);
        }

        @Override
        public Link.Builder getLinkBuilder(String relation) {
            Link link = getLink(relation);
            if (link == null) {
                return Link.fromUri("about:blank");
            }
            return Link.fromLink(link);
        }

        @Override
        public MultivaluedMap<String, Object> getMetadata() {
            return headers;
        }

        @Override
        public MultivaluedMap<String, Object> getHeaders() {
            return headers;
        }

        @Override
        public MultivaluedMap<String, String> getStringHeaders() {
            MultivaluedMap<String, String> result = new MultivaluedHashMap<>();
            headers.forEach((key, values) -> {
                List<String> strValues = new ArrayList<>(values.size());
                for (Object value : values) {
                    strValues.add(Objects.toString(value, null));
                }
                result.put(key, strValues);
            });
            return result;
        }

        @Override
        public String getHeaderString(String name) {
            List<Object> values = headers.get(name);
            if (values == null || values.isEmpty()) {
                return null;
            }
            StringJoiner joiner = new StringJoiner(", ");
            for (Object value : values) {
                joiner.add(Objects.toString(value, ""));
            }
            return joiner.toString();
        }

        @Override
        public boolean isClosed() {
            return closed;
        }

        public URI getContentLocation() {
            return contentLocation;
        }

        public Date getExpires() {
            return expires != null ? new Date(expires.getTime()) : null;
        }

        public CacheControl getCacheControl() {
            return cacheControl;
        }

        public String getEncoding() {
            return encoding;
        }
    }

    private static final class VariantListBuilderStub extends Variant.VariantListBuilder {

        private final List<Variant> variants = new ArrayList<>();
        private MediaType[] mediaTypes = new MediaType[0];
        private Locale[] languages = new Locale[0];
        private String[] encodings = new String[0];

        @Override
        public Variant.VariantListBuilder mediaTypes(MediaType... mediaTypes) {
            this.mediaTypes = mediaTypes != null ? mediaTypes.clone() : new MediaType[0];
            return this;
        }

        @Override
        public Variant.VariantListBuilder languages(Locale... languages) {
            this.languages = languages != null ? languages.clone() : new Locale[0];
            return this;
        }

        @Override
        public Variant.VariantListBuilder encodings(String... encodings) {
            this.encodings = encodings != null ? encodings.clone() : new String[0];
            return this;
        }

        @Override
        public Variant.VariantListBuilder add() {
            MediaType[] mt = mediaTypes.length == 0 ? new MediaType[]{null} : mediaTypes;
            Locale[] lg = languages.length == 0 ? new Locale[]{null} : languages;
            String[] enc = encodings.length == 0 ? new String[]{null} : encodings;
            for (MediaType media : mt) {
                for (Locale locale : lg) {
                    for (String encoding : enc) {
                        variants.add(new Variant(media, locale, encoding));
                    }
                }
            }
            return this;
        }

        @Override
        public List<Variant> build() {
            if (variants.isEmpty()) {
                add();
            }
            return List.copyOf(variants);
        }
    }
}
