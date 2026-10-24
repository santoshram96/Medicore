package com.medicalapp.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalapp.database.JdbcConnection;

import java.sql.*;
import java.util.*;

/** JDBC repository for the collections consumed by app.js. Table and field names are allow-listed. */
public class JdbcPatientDataRepository {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String,Object>> MAP = new TypeReference<>() {};
    private static final Map<String, String> TABLES = Map.of(
        "depts", "departments", "doctors", "doctors", "patients", "patients", "users", "app_users",
        "appts", "appointments", "rx", "prescriptions", "recs", "medical_records", "labs", "lab_tests", "equip", "lab_equipment"
    );

    public Map<String,Object> getAll() throws SQLException {
        Map<String,Object> result = new LinkedHashMap<>();
        for (String collection : TABLES.keySet()) result.put(collection, getCollection(collection));
        return result;
    }

    public List<Map<String,Object>> getCollection(String collection) throws SQLException {
        String table = table(collection);
        List<Map<String,Object>> rows = new ArrayList<>();
        try (Connection c = JdbcConnection.getConnection(); Statement st = c.createStatement(); ResultSet rs = st.executeQuery("SELECT * FROM " + table + orderBy(collection))) {
            ResultSetMetaData md = rs.getMetaData();
            while (rs.next()) {
                Map<String,Object> row = new LinkedHashMap<>();
                for (int i=1; i<=md.getColumnCount(); i++) {
                    String key = md.getColumnLabel(i);
                    Object value = rs.getObject(i);
                    if (value instanceof java.sql.Date || value instanceof java.sql.Time || value instanceof java.sql.Timestamp) value = value.toString();
                    if ("meds_json".equals(key)) {
                        try { row.put("meds", value == null ? List.of() : JSON.readValue(value.toString(), new TypeReference<List<Map<String,Object>>>() {})); }
                        catch (Exception ex) { row.put("meds", List.of()); }
                    } else if ("active".equals(key)) row.put("on", toInt(value));
                    else if ("id".equals(key) && "patients".equals(collection)) row.put(key, "P" + value);
                    else if ("id".equals(key) && "doctors".equals(collection)) row.put(key, "D" + value);
                    else if ("p_id".equals(key)) row.put("p", prefixId("patients", value));
                    else if ("d_id".equals(key)) row.put("d", prefixId("doctors", value));
                    else if ("dept_id".equals(key)) row.put("dept", value == null ? null : toInt(value));
                    else if ("diagnosis".equals(key)) row.put("dx", value);
                    else if ("specialization".equals(key)) row.put("spec", value);
                    else if ("experience_years".equals(key)) row.put("exp", value);
                    else if ("appointment_date".equals(key)) row.put("date", value);
                    else if ("appointment_time".equals(key)) row.put("time", value);
                    else if ("prescription_date".equals(key)) row.put("date", value);
                    else if ("record_date".equals(key)) row.put("date", value);
                    else if ("test_name".equals(key)) row.put("test", value);
                    else if ("file_name".equals(key)) row.put("file", value);
                    else if ("description".equals(key)) row.put(key, value);
                    else row.put(key, value);
                }
                rows.add(row);
            }
        }
        return rows;
    }

    public Map<String,Object> create(String collection, Map<String,Object> data) throws Exception {
        String table = table(collection);
        Map<String,Object> row = normalize(collection, data);
        List<String> columns = new ArrayList<>(row.keySet());
        if (columns.isEmpty()) throw new IllegalArgumentException("No fields supplied");
        String sql = "INSERT INTO " + table + " (" + String.join(",", columns) + ") VALUES (" + String.join(",", Collections.nCopies(columns.size(), "?")) + ")";
        try (Connection c=JdbcConnection.getConnection(); PreparedStatement ps=c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            int i=1; for (String col: columns) ps.setObject(i++, serializeValue(col, row.get(col)));
            ps.executeUpdate();
            try (ResultSet keys=ps.getGeneratedKeys()) { if (keys.next()) row.put("id", keys.getLong(1)); }
        }
        return findById(collection, String.valueOf(row.get("id"))).orElse(row);
    }

    public Optional<Map<String,Object>> update(String collection, String id, Map<String,Object> changes) throws Exception {
        table(collection);
        Map<String,Object> row = normalize(collection, changes);
        row.remove("id");
        if (row.isEmpty()) return findById(collection,id);
        List<String> cols = new ArrayList<>(row.keySet());
        String sql = "UPDATE " + table(collection) + " SET " + String.join(",", cols.stream().map(c -> c + "=?").toList()) + " WHERE id=?";
        try (Connection c=JdbcConnection.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            int i=1; for (String col: cols) ps.setObject(i++, serializeValue(col,row.get(col)));
            ps.setLong(i, numericId(collection,id));
            if (ps.executeUpdate()==0) return Optional.empty();
        }
        return findById(collection,id);
    }

    public boolean delete(String collection, String id) throws SQLException {
        String sql="DELETE FROM " + table(collection) + " WHERE id=?";
        try(Connection c=JdbcConnection.getConnection(); PreparedStatement ps=c.prepareStatement(sql)) {
            ps.setLong(1,numericId(collection,id)); return ps.executeUpdate()>0;
        }
    }

    private Optional<Map<String,Object>> findById(String collection, String id) throws SQLException {
        long numeric = numericId(collection,id);
        for (Map<String,Object> r : getCollection(collection)) if (String.valueOf(r.get("id")).equals(id) || String.valueOf(r.get("id")).equals(String.valueOf(numeric))) return Optional.of(r);
        return Optional.empty();
    }

    private static String table(String collection) {
        String t=TABLES.get(collection); if(t==null) throw new IllegalArgumentException("Unknown collection: "+collection); return t;
    }
    private static String orderBy(String c) { return " ORDER BY id"; }
    private static long numericId(String collection,String id) {
        String s=id;
        if ("patients".equals(collection) && s.startsWith("P")) s=s.substring(1);
        if ("doctors".equals(collection) && s.startsWith("D")) s=s.substring(1);
        try { return Long.parseLong(s); } catch(NumberFormatException e) { throw new IllegalArgumentException("Invalid id: "+id); }
    }
    /** MySQL TINYINT(1) may be returned by Connector/J as Boolean rather than Number. */
    private static int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Boolean b) return b ? 1 : 0;
        if (value instanceof Number n) return n.intValue();
        String s = String.valueOf(value).trim();
        if ("true".equalsIgnoreCase(s)) return 1;
        if ("false".equalsIgnoreCase(s)) return 0;
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Expected a numeric/boolean database value but got: " + s, e);
        }
    }

    private static Object prefixId(String type,Object value) {
        if(value==null) return null;
        String s=String.valueOf(value); if("patients".equals(type)) return s.startsWith("P")?s:"P"+s;
        return s.startsWith("D")?s:"D"+s;
    }

    /** Translate frontend field names into allow-listed SQL column names. */
    private static Map<String,Object> normalize(String collection, Map<String,Object> input) throws Exception {
        Map<String,Object> out=new LinkedHashMap<>();
        for (Map.Entry<String,Object> e:input.entrySet()) {
            String k=e.getKey(); Object v=e.getValue(); String col=null;
            switch(collection) {
                case "depts" -> { if(Set.of("id","name","description").contains(k)) col=k; }
                case "doctors" -> { col=switch(k){case "id"->"id";case "name"->"name";case "spec","specialization"->"specialization";case "exp","experience_years"->"experience_years";case "dept","dept_id"->"dept_id";default->null;}; }
                case "patients" -> { if(Set.of("id","name","dob","gender","blood","phone","emergency").contains(k)) col=k; }
                case "users" -> { col=switch(k){case "id"->"id";case "name"->"name";case "email"->"email";case "role"->"role";case "on"->"active";default->null;}; }
                case "appts" -> { col=switch(k){case "id"->"id";case "p","patient_id"->"p_id";case "d","doctor_id"->"d_id";case "date"->"appointment_date";case "time"->"appointment_time";case "status"->"status";case "reason"->"reason";default->null;}; }
                case "rx" -> { col=switch(k){case "id"->"id";case "p","patient_id"->"p_id";case "d","doctor_id"->"d_id";case "date"->"prescription_date";case "notes"->"notes";case "meds"->"meds_json";case "status"->"status";default->null;}; }
                case "recs" -> { col=switch(k){case "id"->"id";case "p","patient_id"->"p_id";case "d","doctor_id"->"d_id";case "date"->"record_date";case "dx","diagnosis"->"diagnosis";case "notes"->"notes";default->null;}; }
                case "labs" -> { col=switch(k){case "id"->"id";case "p","patient_id"->"p_id";case "d","doctor_id"->"d_id";case "test"->"test_name";case "status"->"status";case "file"->"file_name";default->null;}; }
                case "equip" -> { if(Set.of("id","name","status").contains(k)) col=k; }
            }
            if(col!=null) out.put(col,v);
        }
        // SQL dates/times are stored as strings by MySQL; bind them through setObject.
        if(out.containsKey("meds_json") && !(out.get("meds_json") instanceof String)) out.put("meds_json",JSON.writeValueAsString(out.get("meds_json")));
        if(out.containsKey("p_id")) out.put("p_id",numericId("patients",String.valueOf(out.get("p_id"))));
        if(out.containsKey("d_id")) out.put("d_id",numericId("doctors",String.valueOf(out.get("d_id"))));
        if(out.containsKey("id") && ("patients".equals(collection)||"doctors".equals(collection))) out.put("id",numericId(collection,String.valueOf(out.get("id"))));
        return out;
    }
    private static Object serializeValue(String column,Object value) { return value; }
}
