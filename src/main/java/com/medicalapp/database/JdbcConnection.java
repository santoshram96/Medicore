package com.medicalapp.database;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/** Creates JDBC connections using environment variables or src/main/resources/db.properties. */
public final class JdbcConnection {
    private static final Properties CONFIG = loadConfig();
    private JdbcConnection() {}

    private static Properties loadConfig() {
        Properties p = new Properties();
        try (InputStream in = JdbcConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) p.load(in);
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
        return p;
    }

    public static Connection getConnection() throws SQLException {
        String url = value("MEDICARE_DB_URL", "db.url",
                "jdbc:mysql://localhost:3306/medicare_hub?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        String user = value("MEDICARE_DB_USER", "db.username", "root");
        String password = value("MEDICARE_DB_PASSWORD", "db.password", "");

        try {
            // Instantiate Connector/J directly so this app does not depend on
            // DriverManager's class-loader-based driver discovery.
            com.mysql.cj.jdbc.Driver driver = new com.mysql.cj.jdbc.Driver();
            Properties credentials = new Properties();
            credentials.setProperty("user", user);
            credentials.setProperty("password", password);

            System.out.println("[MediCare JDBC] Driver loaded: " + driver.getClass().getName());
            System.out.println("[MediCare JDBC] JDBC URL: " + url);

            Connection connection = driver.connect(url, credentials);
            if (connection == null) {
                throw new SQLException("MySQL Connector/J rejected the JDBC URL: " + url);
            }
            System.out.println("[MediCare JDBC] Connection successful.");
            return connection;
        } catch (SQLException e) {
            System.err.println("[MediCare JDBC] Connection failed (" + e.getClass().getSimpleName()
                    + "): " + e.getMessage());
            throw e;
        }
    }

    private static String value(String env, String key, String fallback) {
        String v = System.getenv(env);
        if (v != null && !v.isBlank()) return v;
        v = System.getProperty(key);
        if (v != null && !v.isBlank()) return v;
        v = CONFIG.getProperty(key);
        return v == null || v.isBlank() ? fallback : v.trim();
    }
}
