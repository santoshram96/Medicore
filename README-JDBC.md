# MediCare Hub — JDBC backend

This revision replaces the in-memory `PatientDataServlet` with a JDBC-backed API. The frontend uses `XMLHttpRequest` AJAX at `api/patient-data`.

## Files added/changed
- `src/main/java/com/medicalapp/database/JdbcConnection.java` — JDBC connection factory.
- `src/main/java/com/medicalapp/repository/JdbcPatientDataRepository.java` — SQL reads and CRUD operations for all nine frontend collections.
- `src/main/java/com/medicalapp/servlet/PatientDataServlet.java` — JSON servlet API backed by JDBC.
- `src/main/resources/db.properties` — local database connection settings.
- `database/medicare_hub_sample.sql` — schema and sample INSERT statements.
- `pom.xml` — MySQL Connector/J dependency.
- `src/main/webapp/app.js` — AJAX frontend.

## Setup
1. Start MySQL Server.
2. Open `database/medicare_hub_sample.sql` in MySQL Workbench and execute it. It creates the database/tables and inserts sample rows if matching rows are absent. Review the script before running it against an existing database.
3. Edit `src/main/resources/db.properties` and set `db.username` and `db.password` to your MySQL credentials. Environment variables can override them: `MEDICARE_DB_URL`, `MEDICARE_DB_USER`, `MEDICARE_DB_PASSWORD`.
4. From the directory containing `pom.xml`, run `mvn clean package`.
5. Deploy `target/medical-servlet-app.war` to Tomcat 10.1.
6. Open `http://localhost:8080/medical-servlet-app/home.html`.
7. Test `http://localhost:8080/medical-servlet-app/api/patient-data`. It should return JSON read from MySQL.

## API
- `GET /api/patient-data` — returns `depts`, `doctors`, `patients`, `users`, `appts`, `rx`, `recs`, `labs`, `equip`.
- `GET /api/patient-data/{collection}` — one collection.
- `POST /api/patient-data/{collection}` — insert a row.
- `PUT /api/patient-data/{collection}/{id}` — update a row.
- `DELETE /api/patient-data/{collection}/{id}` — delete a row.

## Notes
- This is a database-backed demo API, not production-ready authentication. The frontend still uses demo role switching and fixed current IDs (`P1`, `D1`); implement authentication/session handling and authorization before using real patient data.
- Patient/doctor IDs are exposed to the frontend as `P1`, `D1`, etc.; the repository converts these to numeric SQL IDs.
- Lab report actions save filename/status only, not the binary contents of the file.
- If MySQL is unavailable or credentials/schema are wrong, the API returns HTTP 500 and logs details in Tomcat. Never put database passwords in JavaScript.
