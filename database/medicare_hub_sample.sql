-- MediCare Hub MySQL schema + sample rows
-- Run this file in MySQL Workbench or the MySQL command line.
-- WARNING: DROP TABLE statements are intentionally NOT included so existing data is not deleted.

CREATE DATABASE IF NOT EXISTS medicare_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medicare_hub;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS doctors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  specialization VARCHAR(120) NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  dept_id BIGINT,
  CONSTRAINT fk_doctor_department FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  dob DATE,
  gender VARCHAR(30),
  blood VARCHAR(8),
  phone VARCHAR(40),
  emergency VARCHAR(40)
);

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  role VARCHAR(40) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  p_id BIGINT NOT NULL,
  d_id BIGINT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Scheduled',
  reason VARCHAR(500),
  CONSTRAINT fk_appointment_patient FOREIGN KEY (p_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_doctor FOREIGN KEY (d_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  p_id BIGINT NOT NULL,
  d_id BIGINT NOT NULL,
  prescription_date DATE NOT NULL,
  notes VARCHAR(1000),
  meds_json LONGTEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_rx_patient FOREIGN KEY (p_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_rx_doctor FOREIGN KEY (d_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medical_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  p_id BIGINT NOT NULL,
  d_id BIGINT NOT NULL,
  record_date DATE NOT NULL,
  diagnosis VARCHAR(500) NOT NULL,
  notes VARCHAR(1500),
  CONSTRAINT fk_record_patient FOREIGN KEY (p_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_record_doctor FOREIGN KEY (d_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  p_id BIGINT NOT NULL,
  d_id BIGINT NOT NULL,
  test_name VARCHAR(160) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Requested',
  file_name VARCHAR(255),
  CONSTRAINT fk_lab_patient FOREIGN KEY (p_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_lab_doctor FOREIGN KEY (d_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lab_equipment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Operational'
);

-- Sample rows are inserted only if the corresponding table is empty.
INSERT INTO departments (name, description)
SELECT 'Cardiology', 'Heart and vascular care' WHERE NOT EXISTS (SELECT 1 FROM departments);
INSERT INTO departments (name, description)
SELECT 'Dermatology', 'Skin conditions' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name='Dermatology');
INSERT INTO departments (name, description)
SELECT 'General Medicine', 'Primary care' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name='General Medicine');

INSERT INTO doctors (name, specialization, experience_years, dept_id)
SELECT 'Dr. Meera Rao', 'Cardiology', 12, (SELECT id FROM departments WHERE name='Cardiology' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Meera Rao');
INSERT INTO doctors (name, specialization, experience_years, dept_id)
SELECT 'Dr. Arun Nair', 'Dermatology', 8, (SELECT id FROM departments WHERE name='Dermatology' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Arun Nair');
INSERT INTO doctors (name, specialization, experience_years, dept_id)
SELECT 'Dr. Sana Iqbal', 'General Medicine', 5, (SELECT id FROM departments WHERE name='General Medicine' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE name='Dr. Sana Iqbal');

INSERT INTO patients (name, dob, gender, blood, phone, emergency)
SELECT 'Ravi Kumar', '1998-04-12', 'Male', 'B+', '98450 11122', '98450 33344'
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE name='Ravi Kumar');
INSERT INTO patients (name, dob, gender, blood, phone, emergency)
SELECT 'Anita Joseph', '1985-09-30', 'Female', 'O+', '98450 55566', '98450 77788'
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE name='Anita Joseph');

INSERT INTO app_users (name,email,role,active)
SELECT 'Ravi Kumar','ravi@mail.com','Patient',1 WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email='ravi@mail.com');
INSERT INTO app_users (name,email,role,active)
SELECT 'Dr. Meera Rao','meera@hosp.org','Doctor',1 WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email='meera@hosp.org');
INSERT INTO app_users (name,email,role,active)
SELECT 'Site Admin','admin@hosp.org','Admin',1 WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email='admin@hosp.org');
INSERT INTO app_users (name,email,role,active)
SELECT 'Leo Fernandes','leo@hosp.org','Lab Staff',1 WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email='leo@hosp.org');
INSERT INTO app_users (name,email,role,active)
SELECT 'Priya Shah','priya@hosp.org','Pharmacist',1 WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE email='priya@hosp.org');

INSERT INTO appointments (p_id,d_id,appointment_date,appointment_time,status,reason)
SELECT (SELECT id FROM patients WHERE name='Ravi Kumar' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Meera Rao' LIMIT 1),'2026-10-21','10:30:00','Scheduled','Chest discomfort'
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reason='Chest discomfort');
INSERT INTO appointments (p_id,d_id,appointment_date,appointment_time,status,reason)
SELECT (SELECT id FROM patients WHERE name='Anita Joseph' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Meera Rao' LIMIT 1),'2026-10-22','11:00:00','Scheduled','Follow-up'
WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reason='Follow-up');

INSERT INTO prescriptions (p_id,d_id,prescription_date,notes,meds_json,status)
SELECT (SELECT id FROM patients WHERE name='Ravi Kumar' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Arun Nair' LIMIT 1),'2026-09-02','Apply twice daily','[{"n":"Hydrocortisone cream","dose":"1%","f":"2x daily","dur":"7 days"}]','Pending'
WHERE NOT EXISTS (SELECT 1 FROM prescriptions WHERE notes='Apply twice daily');

INSERT INTO medical_records (p_id,d_id,record_date,diagnosis,notes)
SELECT (SELECT id FROM patients WHERE name='Ravi Kumar' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Arun Nair' LIMIT 1),'2026-09-02','Contact dermatitis','Avoid irritants'
WHERE NOT EXISTS (SELECT 1 FROM medical_records WHERE diagnosis='Contact dermatitis');

INSERT INTO lab_tests (p_id,d_id,test_name,status,file_name)
SELECT (SELECT id FROM patients WHERE name='Ravi Kumar' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Meera Rao' LIMIT 1),'ECG','Requested',NULL
WHERE NOT EXISTS (SELECT 1 FROM lab_tests WHERE test_name='ECG');
INSERT INTO lab_tests (p_id,d_id,test_name,status,file_name)
SELECT (SELECT id FROM patients WHERE name='Anita Joseph' LIMIT 1),(SELECT id FROM doctors WHERE name='Dr. Meera Rao' LIMIT 1),'Lipid profile','Completed','lipid-p2.pdf'
WHERE NOT EXISTS (SELECT 1 FROM lab_tests WHERE test_name='Lipid profile');

INSERT INTO lab_equipment (name,status)
SELECT 'Centrifuge','Operational' WHERE NOT EXISTS (SELECT 1 FROM lab_equipment WHERE name='Centrifuge');
INSERT INTO lab_equipment (name,status)
SELECT 'Hematology analyzer','Maintenance' WHERE NOT EXISTS (SELECT 1 FROM lab_equipment WHERE name='Hematology analyzer');

-- Quick verification queries:
SELECT * FROM departments;
SELECT * FROM doctors;
SELECT * FROM patients;
SELECT * FROM appointments;
