# OpenDolphin Agent Guide

## Purpose
- Summarize repository structure and responsibilities for quick onboarding of automation or maintenance agents.
- Highlight build, run, and configuration requirements specific to OpenDolphin 2.7.1.
- Capture notable quirks, risks, and recurring tasks.

## Quick Facts
- **Tech stack**: Java 8, Maven, Java EE 7, WildFly 9.
- **Modules**: `common` (shared models), `server` (REST + EJB), `client` (Swing desktop).
- **Manual deps**: `ext_lib/AppleJavaExtensions.jar`, `ext_lib/iTextAsian.jar` must live in local Maven repo.

## Repository Layout
- Root `pom.xml` orchestrates the three modules and enforces Java 1.8 compilation.
- `common/`: shared models, converters, and utilities.
- `server/`: Java EE WAR exposing REST endpoints and session beans.
- `client/`: Swing UI packaged as fat JAR with plugin mechanism.
- `ext_lib/`: proprietary jars to install via `mvn install:install-file`.

## Build & Toolchain
- Requires `jdk 1.8.0_60`, Maven ≥ 3.3.3 per `README.md`.
- Typical workflow:
  1. Install manual jars (`iTextAsian`, `AppleJavaExtensions`).
  2. `mvn clean package` at repo root (produces `server/target/opendolphin-server.war` & `client/target/OpenDolphin.jar`).
- WildFly plugin config in `server/pom.xml:126` contains hard-coded credentials; externalize before production.
- Manual install commands:
  ```bash
  mvn install:install-file -Dfile=ext_lib/iTextAsian.jar -DgroupId=opendolphin -DartifactId=itext-font -Dversion=1.0 -Dpackaging=jar
  mvn install:install-file -Dfile=ext_lib/AppleJavaExtensions.jar -DgroupId=com.apple -DartifactId=AppleJavaExtensions -Dversion=1.6 -Dpackaging=jar
  ```

## Module Deep Dive

### common
- Houses JPA entities (`open.dolphin.infomodel.*`) shared between tiers.
- Depends on Hibernate 4.3.8 (`provided`) and Java EE APIs (`provided`).
- Key files: `PatientModel.java`, `DocumentModel`, converters under `open.dolphin.converter`.

### server
- Packaging: WAR, deploys to WildFly.
- Major packages:
  - `open.dolphin.rest`: REST endpoints (e.g., `PatientResource`).
  - `open.dolphin.session`: `@Stateless` beans performing database work via JPA.
  - `open.orca.rest`: ORCA integration, reads WildFly `custom.properties`.
  - `open.dolphin.msg`: CLAIM/MML messaging with Velocity templates.
- Data source, security, and environment settings expected via WildFly; not embedded here.

### client
- Swing application launched via `open.dolphin.client.Dolphin`.
- Uses `ClientContextStub` to bootstrap directories under user home and configure UI/profile.
- REST communication via `open.dolphin.delegater.*`, wrapping RESTEasy client.
- Plugin loader reads `META-INF/plugins/open.dolphin.*` resource files for dynamic component discovery.
- `StubFactory` selects `ProjectStub` implementation (`dolphin` / `asp` / `i18n`) to apply environment-specific defaults.

## Configuration & Properties
- Defaults in `client/src/main/java/open/dolphin/resources/Defaults.properties`.
- User overrides stored under `~/OpenDolphin/setting/user-defaults.properties`.
- `Project` class enumerates all configuration keys for claim sending, PDF output, schedule handling, etc., and `ProjectStub` persists the merged result.
- Server side references `custom.properties` under WildFly for ORCA connectivity and JMS toggles.

## Data & Interaction Flow
1. Client boots via `Dolphin.start()`, loads login dialog plugin, authenticates against server REST.
2. Delegater classes call server REST endpoints (`BusinessDelegater` handles auth/cookies).
3. Server REST resources (`PatientResource`, etc.) invoke session beans that query PostgreSQL.
4. Shared models serialized via Jackson; `DocumentDelegater` rehydrates icons/attachments post-response.
5. CLAIM/MML jobs optionally dispatched via messaging helpers; ORCA bridge available through `/orca` endpoint.

## Manual Tasks For Agents
- Verify manual jars installed when build failures mention missing `itext-font` or `AppleJavaExtensions`.
- Keep WildFly credentials out of source before distribution.
- For localization, copy resource `.properties` under `resources` packages using ISO 3166 suffix.
- Monitor `ProjectStub` when altering config keys; UI panels load strings from `project/resources/*.properties`.
- When adding new plugins or dialogs, append class names under `client/src/main/java/META-INF/plugins/` to keep PluginLoader discovery intact.

## Known Pitfalls
- Legacy dependencies (Log4j 1.2.17, Java EE 7) mean upgrading toolchain requires compatibility audit.
- WildFly plugin uses hard-coded IP; ensure it matches target deployment.
- Swing UI assumes Nimbus Look & Feel; cross-platform drift can appear if defaults changed.
- Database queries rely on PostgreSQL-specific syntax; switching vendors requires rewrite.

## Useful File References
- Root POM: `pom.xml`
- Client POM & manifest config: `client/pom.xml`
- Server REST example: `server/src/main/java/open/dolphin/rest/PatientResource.java`
- Client bootstrap: `client/src/main/java/open/dolphin/client/Dolphin.java`
- Shared patient entity: `common/src/main/java/open/dolphin/infomodel/PatientModel.java`

## Next Steps / TODO Ideas
- Script Maven install of manual jars for CI.
- Externalize WildFly credentials into profile-specific settings.
- Consider upgrading RESTEasy / Java EE stack (requires thorough regression).
- Document database schema expectations (tables like `d_patient`, etc.) if schema is available.
