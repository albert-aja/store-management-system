package com.sms.infrastructure;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Flyway Migration Chain Infrastructure Validation")
class FlywayMigrationValidationTest {

    private static final String MIGRATION_PATH = "src/main/resources/db/migration";

    @Test
    @DisplayName("Verify that all Flyway migrations exist and form a contiguous sequence through V32")
    void testContiguousMigrationSequence() {
        File dir = new File(MIGRATION_PATH);
        assertTrue(dir.exists() && dir.isDirectory(), "Migration directory must exist at " + MIGRATION_PATH);

        File[] files = dir.listFiles((d, name) -> name.startsWith("V") && name.endsWith(".sql"));
        assertNotNull(files, "Migration files array cannot be null");
        assertTrue(files.length >= 32, "Expected at least 32 Flyway migration files, but found " + files.length);

        Pattern versionPattern = Pattern.compile("^V(\\d+)__(.+)\\.sql$");
        Map<Integer, File> versionMap = new TreeMap<>();

        for (File f : files) {
            Matcher m = versionPattern.matcher(f.getName());
            assertTrue(m.matches(), "File name must match standard Flyway pattern V<N>__<name>.sql: " + f.getName());
            int version = Integer.parseInt(m.group(1));
            assertFalse(versionMap.containsKey(version), "Duplicate Flyway migration version detected: " + version);
            versionMap.put(version, f);
        }

        // Verify sequence is strictly contiguous starting from 1
        for (int i = 1; i <= versionMap.size(); i++) {
            assertTrue(versionMap.containsKey(i), "Missing migration sequence number: V" + i);
        }
    }

    @Test
    @DisplayName("Verify that SQL migration files contain valid DDL without illegal drop commands")
    void testMigrationFileIntegrity() throws IOException {
        File dir = new File(MIGRATION_PATH);
        File[] files = dir.listFiles((d, name) -> name.startsWith("V") && name.endsWith(".sql"));
        assertNotNull(files);

        Pattern createTablePattern = Pattern.compile("CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([a-zA-Z0-9_]+)", Pattern.CASE_INSENSITIVE);
        Set<String> declaredTables = new HashSet<>();

        for (File f : files) {
            String content = Files.readString(f.toPath());
            assertFalse(content.isBlank(), "Migration file cannot be empty: " + f.getName());

            // Check for unsafe DROP DATABASE or unconditional TRUNCATE
            assertFalse(content.toUpperCase().contains("DROP DATABASE"), "Migration must not drop databases: " + f.getName());

            Matcher matcher = createTablePattern.matcher(content);
            while (matcher.find()) {
                String tableName = matcher.group(1).toLowerCase();
                declaredTables.add(tableName);
            }
        }

        // Crucial enterprise tables must all be declared
        assertTrue(declaredTables.contains("store"));
        assertTrue(declaredTables.contains("employee"));
        assertTrue(declaredTables.contains("customer"));
        assertTrue(declaredTables.contains("sales_order"));
        assertTrue(declaredTables.contains("sales_order_item"));
        assertTrue(declaredTables.contains("purchase_order"));
        assertTrue(declaredTables.contains("delivery_trip"));
        assertTrue(declaredTables.contains("receivable"));
        assertTrue(declaredTables.contains("vehicle"));
        assertTrue(declaredTables.contains("tracking_location"));
        assertTrue(declaredTables.contains("fulfillment_group"));
        assertTrue(declaredTables.contains("customer_device_token"));
    }
}
