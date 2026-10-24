package com.medicalapp.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalapp.model.User;
import com.medicalapp.repository.InMemoryRepository;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        List<User> users = InMemoryRepository.findUsers();

        resp.setContentType("application/json");
        resp.getWriter().write(mapper.writeValueAsString(users));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        Map<String, String> body =
                mapper.readValue(req.getInputStream(), Map.class);

        User user = new User(
                0,
                body.get("name"),
                body.get("email"),
                body.getOrDefault("role", "PATIENT")
        );

        User saved = InMemoryRepository.saveUser(user);

        resp.setStatus(HttpServletResponse.SC_CREATED);
        resp.setContentType("application/json");
        resp.getWriter().write(mapper.writeValueAsString(saved));
    }
}
