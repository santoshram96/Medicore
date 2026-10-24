package com.medicalapp.repository;

import com.medicalapp.model.Consultation;
import com.medicalapp.model.User;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public class InMemoryRepository {

    private static final Map<Long, User> users = new LinkedHashMap<>();
    private static final Map<Long, Consultation> consultations = new LinkedHashMap<>();

    private static final AtomicLong userId = new AtomicLong(1);
    private static final AtomicLong consultationId = new AtomicLong(1);

    static {
        User patient = new User(userId.getAndIncrement(),
                "Demo Patient", "patient@example.com", "PATIENT");

        User doctor = new User(userId.getAndIncrement(),
                "Dr. Demo", "doctor@example.com", "DOCTOR");

        User hospital = new User(userId.getAndIncrement(),
                "Demo Hospital", "hospital@example.com", "HOSPITAL");

        users.put(patient.getId(), patient);
        users.put(doctor.getId(), doctor);
        users.put(hospital.getId(), hospital);
    }

    public static List<User> findUsers() {
        return new ArrayList<>(users.values());
    }

    public static User saveUser(User user) {
        user.setId(userId.getAndIncrement());
        users.put(user.getId(), user);
        return user;
    }

    public static List<Consultation> findConsultations() {
        return new ArrayList<>(consultations.values());
    }

    public static Consultation saveConsultation(Consultation consultation) {
        consultations.put(consultationId.getAndIncrement(), consultation);
        return consultation;
    }
}
