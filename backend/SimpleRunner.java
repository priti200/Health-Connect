import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class SimpleRunner {
    public static void main(String[] args) {
        try {
            System.out.println("Starting HealthConnect Backend...");
            
            // Build classpath
            List<String> classpath = new ArrayList<>();
            classpath.add("target/classes");
            
            // Add Maven dependencies
            String userHome = System.getProperty("user.home");
            String m2Repo = userHome + "/.m2/repository";
            
            // Essential Spring Boot dependencies
            classpath.add(m2Repo + "/org/springframework/boot/spring-boot-starter-web/3.4.5/spring-boot-starter-web-3.4.5.jar");
            classpath.add(m2Repo + "/org/springframework/boot/spring-boot-starter/3.4.5/spring-boot-starter-3.4.5.jar");
            classpath.add(m2Repo + "/org/springframework/boot/spring-boot/3.4.5/spring-boot-3.4.5.jar");
            classpath.add(m2Repo + "/org/springframework/boot/spring-boot-autoconfigure/3.4.5/spring-boot-autoconfigure-3.4.5.jar");
            classpath.add(m2Repo + "/org/springframework/spring-core/6.2.1/spring-core-6.2.1.jar");
            classpath.add(m2Repo + "/org/springframework/spring-context/6.2.1/spring-context-6.2.1.jar");
            classpath.add(m2Repo + "/org/springframework/spring-web/6.2.1/spring-web-6.2.1.jar");
            classpath.add(m2Repo + "/org/springframework/spring-webmvc/6.2.1/spring-webmvc-6.2.1.jar");
            
            String classpathStr = String.join(System.getProperty("path.separator"), classpath);
            
            ProcessBuilder pb = new ProcessBuilder(
                "java",
                "-cp", classpathStr,
                "-Dspring.profiles.active=default",
                "com.healthconnect.HealthConnectApplication"
            );
            
            pb.inheritIO();
            Process process = pb.start();
            
            System.out.println("Backend started. Press Ctrl+C to stop.");
            process.waitFor();
            
        } catch (Exception e) {
            System.err.println("Failed to start backend: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
