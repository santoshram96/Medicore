package com.medicalapp.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalapp.model.Consultation;
import com.medicalapp.repository.InMemoryRepository;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/consultations/*")
public class ConsultationServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        List<Consultation> consultations =
                InMemoryRepository.findConsultations();

        resp.setContentType("application/json");
        resp.getWriter().write(
                mapper.writeValueAsString(consultations)
        );
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        Map<String, Object> body =
                mapper.readValue(req.getInputStream(), Map.class);

        Consultation consultation = new Consultation(
                0,
                ((Number) body.get("patientId")).longValue(),
                ((Number) body.get("doctorId")).longValue(),
                (String) body.getOrDefault("type", "ONLINE"),
                "REQUESTED",
                (String) body.get("reason")
        );

        Consultation saved =
                InMemoryRepository.saveConsultation(consultation);

        resp.setStatus(HttpServletResponse.SC_CREATED);
        resp.setContentType("application/json");
        resp.getWriter().write(
                mapper.writeValueAsString(saved)
        );
    }
}
