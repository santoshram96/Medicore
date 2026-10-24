package com.medicalapp.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalapp.repository.JdbcPatientDataRepository;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;

/** JDBC-backed JSON API consumed by app.js using XMLHttpRequest AJAX. */
@WebServlet("/api/patient-data/*")
public class PatientDataServlet extends HttpServlet {
    private final ObjectMapper json = new ObjectMapper();
    private final JdbcPatientDataRepository repository = new JdbcPatientDataRepository();
    private static final TypeReference<Map<String,Object>> MAP = new TypeReference<>() {};

    @Override protected void doGet(HttpServletRequest req,HttpServletResponse resp) throws IOException {
        try {
            String collection=collection(req);
            Object result=collection==null?repository.getAll():repository.getCollection(collection);
            write(resp,200,result);
        } catch (SQLException e) { serverError(resp,e); }
          catch (IllegalArgumentException e) { write(resp,400,Map.of("error",e.getMessage())); }
    }
    @Override protected void doPost(HttpServletRequest req,HttpServletResponse resp) throws IOException {
        try {
            String c=collection(req); if(c==null) { write(resp,400,Map.of("error","Collection is required")); return; }
            Map<String,Object> body=json.readValue(req.getInputStream(),MAP);
            write(resp,201,repository.create(c,body));
        } catch(SQLException e) { serverError(resp,e); }
          catch(IllegalArgumentException e) { write(resp,400,Map.of("error",e.getMessage())); }
          catch(Exception e) { write(resp,400,Map.of("error","Could not create record: "+e.getMessage())); }
    }
    @Override protected void doPut(HttpServletRequest req,HttpServletResponse resp) throws IOException {
        try {
            String c=collection(req), id=itemId(req);
            if(c==null||id==null) { write(resp,400,Map.of("error","Use /api/patient-data/{collection}/{id}")); return; }
            Map<String,Object> body=json.readValue(req.getInputStream(),MAP);
            Optional<Map<String,Object>> updated=repository.update(c,id,body);
            if(updated.isEmpty()) write(resp,404,Map.of("error","Record not found")); else write(resp,200,updated.get());
        } catch(SQLException e) { serverError(resp,e); }
          catch(IllegalArgumentException e) { write(resp,400,Map.of("error",e.getMessage())); }
          catch(Exception e) { write(resp,400,Map.of("error","Could not update record: "+e.getMessage())); }
    }
    @Override protected void doDelete(HttpServletRequest req,HttpServletResponse resp) throws IOException {
        try {
            String c=collection(req), id=itemId(req);
            if(c==null||id==null) { write(resp,400,Map.of("error","Use /api/patient-data/{collection}/{id}")); return; }
            if(!repository.delete(c,id)) { write(resp,404,Map.of("error","Record not found")); return; }
            resp.setStatus(204);
        } catch(SQLException e) { serverError(resp,e); }
          catch(IllegalArgumentException e) { write(resp,400,Map.of("error",e.getMessage())); }
    }
    private String collection(HttpServletRequest req) { String p=req.getPathInfo(); return p==null||p.equals("/")||p.isBlank()?null:p.substring(1).split("/",2)[0]; }
    private String itemId(HttpServletRequest req) { String p=req.getPathInfo(); if(p==null)return null; String[] a=p.substring(1).split("/",2); return a.length>1?a[1]:null; }
    private void write(HttpServletResponse resp,int status,Object data)throws IOException { resp.setCharacterEncoding("UTF-8");resp.setContentType("application/json");resp.setHeader("Cache-Control","no-store");resp.setStatus(status);json.writeValue(resp.getWriter(),data); }
    private void serverError(HttpServletResponse resp,Exception e)throws IOException { getServletContext().log("JDBC API error",e);write(resp,500,Map.of("error","Database request failed. Check MySQL, db.properties, and table schema.")); }
}
