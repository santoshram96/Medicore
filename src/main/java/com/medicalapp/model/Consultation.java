package com.medicalapp.model;

public class Consultation {
    private long id;
    private long patientId;
    private long doctorId;
    private String type;
    private String status;
    private String reason;

    public Consultation() {}

    public Consultation(long id, long patientId, long doctorId,
                        String type, String status, String reason) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.type = type;
        this.status = status;
        this.reason = reason;
    }

    public long getId() { return id; }
    public long getPatientId() { return patientId; }
    public long getDoctorId() { return doctorId; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
}
