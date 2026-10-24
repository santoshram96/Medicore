# Medical Servlet Application

Basic Java Servlet implementation of the medical application requirements.

## Architecture

Browser / Mobile App
        |
        v
   Apache Tomcat
        |
        +-- UserServlet
        |      +-- Patient
        |      +-- Doctor
        |      +-- Hospital
        |
        +-- ConsultationServlet
        |
        +-- HealthServlet
        |
        +-- Repository
               |
               +-- In-memory data

## Requirements represented

- Patient/user
- Hospital
- Doctor
- Basic user creation
- Consultation request
- Online consultation type
- Consultation status
- REST-style JSON APIs
- Health endpoint

## Technology

- Java 17
- Jakarta Servlet 6
- Maven
- WAR
- Apache Tomcat 10.1+
- Jackson JSON

## Build

From the project root:

mvn clean package

The WAR is created at:

target/medical-servlet-app.war

## Deploy

Copy the WAR into Tomcat's webapps directory.

Example:

C:\apache-tomcat-10.1.x\webapps\medical-servlet-app.war

Start Tomcat.

Application:

http://localhost:8080/medical-servlet-app/

## APIs

GET /api/health

GET /api/users

POST /api/users

Example:

{
  "name": "John",
  "email": "john@example.com",
  "role": "PATIENT"
}

GET /api/consultations

POST /api/consultations

Example:

{
  "patientId": 1,
  "doctorId": 2,
  "type": "ONLINE",
  "reason": "General consultation"
}

This is intentionally a basic Servlet project. The next layer can replace the in-memory repository with JDBC/MySQL and add authentication, file upload, hospital/doctor workflows, appointments, ratings and WebSocket/WebRTC signaling.
