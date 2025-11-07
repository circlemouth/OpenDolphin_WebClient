package open.dolphin.msg;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.logging.Logger;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.Velocity;
import org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader;

/**
 *
 * @author kazushi
 */
public class VelocityHelper {
    
    static {
        
        try {
            // Velocity を初期化する
            Properties p = new Properties();
            p.setProperty("resource.loader", "file, classpath");
            p.setProperty("input.encoding", "UTF-8");
            p.setProperty("output.encoding", "UTF-8");
            p.setProperty("runtime.log.logsystem.class", "org.apache.velocity.runtime.log.NullLogChute");

            List<String> templatePaths = new ArrayList<>();
            String configuredDir = System.getProperty("open.dolphin.templates.dir");
            if (configuredDir != null && !configuredDir.isBlank()) {
                templatePaths.add(configuredDir);
            }

            String jbossHome = System.getProperty("jboss.home.dir");
            if (jbossHome != null && !jbossHome.isBlank()) {
                templatePaths.add(Paths.get(jbossHome, "templates").toString());
            }

            Path repoTemplates = Paths.get("").toAbsolutePath()
                    .resolve("server-modernized")
                    .resolve("reporting")
                    .resolve("templates");
            if (Files.isDirectory(repoTemplates)) {
                templatePaths.add(repoTemplates.toString());
            }

            if (templatePaths.isEmpty()) {
                templatePaths.add(Paths.get("templates").toAbsolutePath().toString());
            }

            p.setProperty("file.resource.loader.path", String.join(File.pathSeparator, templatePaths));
            p.setProperty("file.resource.loader.cache", "false");
            p.setProperty("classpath.resource.loader.class", ClasspathResourceLoader.class.getName());

            Velocity.init(p);

        } catch (Exception e) {
            Logger.getLogger("open.dolphin").warning(e.getMessage());
        }
    }
    
    public static VelocityContext getContext() {
        return new VelocityContext();
    }
}
