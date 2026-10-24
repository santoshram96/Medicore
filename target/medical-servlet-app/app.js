const db = {
    depts: [],
    doctors: [],
    patients: [],
    users: [],
    appts: [],
    rx: [],
    recs: [],
    labs: [],
    equip: []
};            const ROLES = {
                patient: ["Patient", "Book visits, view records", "#2563eb"],
                doctor: ["Doctor", "Appointments and prescriptions", "#0f766e"],
                admin: ["Admin", "Users, departments, records", "#7c3aed"],
                lab: ["Lab Staff", "Tests and reports", "#0891b2"],
                pharm: ["Pharmacist", "Dispense medication", "#ea580c"],
            };
            const ME = { patient: "P1", doctor: "D1" };
            let role = null,
                tab = 0,
                nid = 100,
                draft = [],
                sel = null;
            const $ = (s) => document.querySelector(s),
                v = (id) => document.getElementById(id).value;
            const N = (l, id) => (db[l].find((x) => x.id === id) || {}).name || id;
            const B = (s) => {
                const k = s.toLowerCase().replace(/ /g, "");
                const c =
                    {
                        completed: "g",
                        dispensed: "g",
                        operational: "g",
                        cancelled: "r",
                        unavailable: "r",
                        maintenance: "r",
                        scheduled: "bl",
                        inprogress: "bl",
                        processing: "bl",
                    }[k] || "";
                return `<span class="b ${c}">${s}</span>`;
            };
            const T = (h, r) =>
                `<div class="tw"><table><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr>${r.length ? r.map((c) => `<tr>${c.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${h.length}" class="mut">Nothing here yet.</td></tr>`}</table></div>`;
            const O = (l, f = (x) => x.name) => db[l].map((x) => `<option value="${x.id}">${f(x)}</option>`).join("");
            const toast = (m) => {
                const t = $("#toast");
                t.textContent = m;
                t.className = "on";
                setTimeout(() => (t.className = ""), 2000);
            };
            const go = (i) => {
                tab = i;
                draft = [];
                sel = null;
                render();
            };
            const medsTxt = (m) => m.map((x) => `${x.n} ${x.dose}, ${x.f}, ${x.dur}`).join("<br>");
            const pid = () => ME.patient,
                did = () => ME.doctor;
            const today = () => new Date().toISOString().slice(0, 10);

            /* ---------- Backend AJAX API (XMLHttpRequest) ---------- */
const PATIENT_API = "api/patient-data";
let backendReady = false;
let backendError = "";

function ajaxRequest(method, path = "", body = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, `${PATIENT_API}${path}`, true);
        xhr.setRequestHeader("Accept", "application/json");
        if (body !== null) xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;
            if (xhr.status >= 200 && xhr.status < 300) {
                if (xhr.status === 204 || !xhr.responseText) return resolve(null);
                try { resolve(JSON.parse(xhr.responseText)); }
                catch (e) { reject(new Error("Backend returned invalid JSON")); }
            } else {
                let message = `HTTP ${xhr.status}`;
                try {
                    const errorBody = JSON.parse(xhr.responseText);
                    message = errorBody.error || errorBody.message || message;
                } catch (_) {
                    if (xhr.responseText) message = xhr.responseText;
                }
                reject(new Error(message));
            }
        };
        xhr.onerror = () => reject(new Error("Network error while contacting Java backend"));
        xhr.ontimeout = () => reject(new Error("Request to Java backend timed out"));
        xhr.timeout = 15000;
        xhr.send(body === null ? null : JSON.stringify(body));
    });
}

function apiCreate(collection, item) {
    return ajaxRequest("POST", `/${encodeURIComponent(collection)}`, item);
}
function apiUpdate(collection, id, changes) {
    return ajaxRequest("PUT", `/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, changes);
}
function apiDelete(collection, id) {
    return ajaxRequest("DELETE", `/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
}

// Compatibility names used by the original patient screens.
function createPatientData(collection, item) { return apiCreate(collection, item); }
function updatePatientData(collection, id, changes) { return apiUpdate(collection, id, changes); }

async function loadBackendData(showToast = false) {
    backendReady = false;
    try {
        const data = await ajaxRequest("GET");
        const collections = ["depts", "doctors", "patients", "users", "appts", "rx", "recs", "labs", "equip"];
        collections.forEach((key) => {
            if (Array.isArray(data[key])) db[key].splice(0, db[key].length, ...data[key]);
        });
        backendReady = true;
        backendError = "";
        if (showToast) toast("Data refreshed from Java backend");
        render();
        return true;
    } catch (error) {
        backendReady = false;
        backendError = error.message;
        console.error("AJAX GET failed:", error);
        render();
        toast("Backend data could not be loaded");
        return false;
    }
}
/* ---------- Patient ---------- */
            const book = () => `<h2>Book an appointment</h2><div class="card"><div class="g">
<label>Doctor<select id="bdoc">${O("doctors", (d) => `${d.name} (${d.spec})`)}</select></label>
<label>Date<input type="date" id="bdate" min="${today()}"></label>
<label>Time<input type="time" id="btime"></label>
<label>Reason<input id="brs" placeholder="e.g. Fever for 3 days"></label></div><p><button class="btn" onclick="doBook()">Book appointment</button></p></div>`;
            const doBook = async () => {
                if (!v("bdate") || !v("btime")) return toast("Choose a date and time");
                const appointment = {
                    p: pid(),
                    d: v("bdoc"),
                    date: v("bdate"),
                    time: v("btime"),
                    status: "Scheduled",
                    reason: v("brs") || "General visit",
                };
                try {
                    const saved = await createPatientData("appts", appointment);
                    db.appts.push(saved);
                    toast("Appointment booked");
                    go(1);
                } catch (error) {
                    console.error(error);
                    toast("Could not book appointment");
                }
            };
            const myAppts = () =>
                `<h2>My appointments</h2><div class="card">${T(
                    ["Doctor", "Date", "Time", "Reason", "Status", "Actions"],
                    db.appts
                        .filter((a) => a.p === pid())
                        .map((a) => [
                            N("doctors", a.d),
                            a.date,
                            a.time,
                            a.reason,
                            B(a.status),
                            a.status === "Scheduled"
                                ? `<div class="row"><input type="date" id="rs${a.id}" style="width:140px;margin:0"><button class="btn s o" onclick="resch(${a.id})">Reschedule</button><button class="btn s d" onclick="setA(${a.id},'Cancelled')">Cancel</button></div>`
                                : "",
                        ])
                )}</div>`;
            const resch = async (id) => {
                const d = v("rs" + id);
                if (!d) return toast("Pick a new date");
                try {
                    const updated = await updatePatientData("appts", id, { date: d });
                    const index = db.appts.findIndex((a) => String(a.id) === String(id));
                    if (index >= 0) db.appts[index] = updated;
                    toast("Rescheduled");
                    render();
                } catch (error) {
                    console.error(error);
                    toast("Could not reschedule appointment");
                }
            };
            const setA = async (id, s) => {
                try {
                    const updated = await updatePatientData("appts", id, { status: s });
                    const index = db.appts.findIndex((a) => String(a.id) === String(id));
                    if (index >= 0) db.appts[index] = updated;
                    toast("Appointment " + s.toLowerCase());
                    render();
                } catch (error) {
                    console.error(error);
                    toast("Could not update appointment");
                }
            };
            const pRx = () =>
                `<h2>My prescriptions</h2><div class="card">${T(
                    ["Date", "Doctor", "Medicines", "Notes", "Status"],
                    db.rx
                        .filter((r) => r.p === pid())
                        .map((r) => [r.date, N("doctors", r.d), medsTxt(r.meds), r.notes, B(r.status)])
                )}</div>`;
            const pRecs = () =>
                `<h2>Medical records</h2><div class="card">${T(
                    ["Date", "Doctor", "Diagnosis", "Notes"],
                    db.recs.filter((r) => r.p === pid()).map((r) => [r.date, N("doctors", r.d), r.dx, r.notes])
                )}</div>`;
            const pLabs = () =>
                `<h2>Lab reports</h2><div class="card">${T(
                    ["Test", "Requested by", "Status", "Report"],
                    db.labs
                        .filter((l) => l.p === pid())
                        .map((l) => [
                            l.test,
                            N("doctors", l.d),
                            B(l.status),
                            l.file
                                ? `<button class="btn s o" onclick="toast('Opening ${l.file}')">View report</button>`
                                : '<span class="mut">Not ready</span>',
                        ])
                )}</div>`;
            const prof = () => {
                const p = db.patients.find((x) => x.id === pid());
                return `<h2>My profile</h2><div class="card"><div class="g"><label>Name<input id="pn" value="${p.name}"></label><label>Phone<input id="pp" value="${p.phone}"></label><label>Emergency contact<input id="pe" value="${p.emergency}"></label></div><p class="mut">Born ${p.dob} · ${p.gender} · Blood group ${p.blood}</p><button class="btn" onclick="saveP()">Save changes</button></div>`;
            };
            const saveP = async () => {
                const p = db.patients.find((x) => x.id === pid());
                if (!p) return toast("Patient profile not found");
                const changes = {
                    name: v("pn"),
                    phone: v("pp"),
                    emergency: v("pe")
                };
                try {
                    const updated = await updatePatientData("patients", p.id, changes);
                    Object.assign(p, updated);
                    toast("Profile saved");
                    render();
                } catch (error) {
                    console.error(error);
                    toast("Could not save profile");
                }
            };

            /* ---------- Doctor ---------- */
            const dAppts = () =>
                `<h2>My appointments</h2><div class="card">${T(
                    ["Patient", "Date", "Time", "Reason", "Status", "Actions"],
                    db.appts
                        .filter((a) => a.d === did())
                        .map((a) => [
                            N("patients", a.p),
                            a.date,
                            a.time,
                            a.reason,
                            B(a.status),
                            a.status === "Scheduled"
                                ? `<div class="row"><button class="btn s" onclick="setA(${a.id},'Completed')">Complete</button><button class="btn s d" onclick="setA(${a.id},'Cancelled')">Cancel</button></div>`
                                : "",
                        ])
                )}</div>`;
            const dPat = () => {
                let x = "";
                if (sel) {
                    const p = db.patients.find((q) => q.id === sel);
                    x = `<div class="card"><h3>${p.name}</h3><p class="mut">Born ${p.dob} · ${p.gender} · ${p.blood} · ${p.phone}</p><b>Records</b>${T(
                        ["Date", "Diagnosis", "Notes"],
                        db.recs.filter((r) => r.p === sel).map((r) => [r.date, r.dx, r.notes])
                    )}<br><b>Prescriptions</b>${T(
                        ["Date", "Medicines", "Status"],
                        db.rx.filter((r) => r.p === sel).map((r) => [r.date, medsTxt(r.meds), B(r.status)])
                    )}</div>`;
                }
                return `<h2>Patients</h2><div class="card">${T(
                    ["Name", "Gender", "Blood", "Phone", ""],
                    db.patients.map((p) => [
                        p.name,
                        p.gender,
                        p.blood,
                        p.phone,
                        `<button class="btn s o" onclick="sel='${p.id}';render()">View details</button>`,
                    ])
                )}</div>${x}`;
            };
            const dRx =
                () => `<h2>Create prescription</h2><div class="card"><div class="g"><label>Patient<select id="xp">${O("patients")}</select></label><label>Notes<input id="xn"></label></div><h3 style="margin-top:14px">Add medicine</h3><div class="g"><label>Name<input id="mn"></label><label>Dosage<input id="md" placeholder="500 mg"></label><label>Frequency<input id="mf" placeholder="2x daily"></label><label>Duration<input id="mu" placeholder="5 days"></label></div><p class="row"><button class="btn o" onclick="addMed()">Add medicine</button><button class="btn" onclick="saveRx()">Save prescription</button></p>${draft.length ? `<p><b>On this prescription</b><br>${medsTxt(draft)}</p>` : ""}</div>
<div class="card"><h3>Issued by me</h3>${T(
                    ["Date", "Patient", "Medicines", "Status"],
                    db.rx
                        .filter((r) => r.d === did())
                        .map((r) => [r.date, N("patients", r.p), medsTxt(r.meds), B(r.status)])
                )}</div>`;
            const addMed = () => {
                if (!v("mn")) return toast("Enter a medicine name");
                draft.push({ n: v("mn"), dose: v("md"), f: v("mf"), dur: v("mu") });
                const k = v("xp"),
                    n = v("xn");
                render();
                $("#xp").value = k;
                $("#xn").value = n;
            };
            const saveRx = async () => {
                if (!draft.length) return toast("Add at least one medicine");
                const item = { p: v("xp"), d: did(), date: today(), notes: v("xn"), meds: draft, status: "Pending" };
                try { await apiCreate("rx", item); draft = []; await loadBackendData(); toast("Prescription saved to backend"); }
                catch (e) { console.error(e); toast("Could not save prescription: " + e.message); }
            };
            const dRecs = () =>
                `<h2>Medical records</h2><div class="card"><div class="g"><label>Patient<select id="rp">${O("patients")}</select></label><label>Diagnosis<input id="rd"></label><label>Notes<input id="rn"></label></div><p><button class="btn" onclick="addRec()">Save record</button></p></div><div class="card">${T(
                    ["Date", "Patient", "Diagnosis", "Notes"],
                    db.recs.filter((r) => r.d === did()).map((r) => [r.date, N("patients", r.p), r.dx, r.notes])
                )}</div>`;
            const addRec = async () => {
                if (!v("rd")) return toast("Enter a diagnosis");
                try { await apiCreate("recs", { p: v("rp"), d: did(), date: today(), dx: v("rd"), notes: v("rn") }); await loadBackendData(); toast("Record saved to backend"); }
                catch (e) { console.error(e); toast("Could not save record: " + e.message); }
            };
            const dLabs = () =>
                `<h2>Lab requests</h2><div class="card"><div class="g"><label>Patient<select id="lp">${O("patients")}</select></label><label>Test<input id="lt" placeholder="e.g. Blood sugar"></label></div><p><button class="btn" onclick="reqLab()">Request test</button></p></div><div class="card">${T(
                    ["Patient", "Test", "Status", "Report"],
                    db.labs
                        .filter((l) => l.d === did())
                        .map((l) => [
                            N("patients", l.p),
                            l.test,
                            B(l.status),
                            l.file
                                ? `<button class="btn s o" onclick="toast('Opening ${l.file}')">View report</button>`
                                : "—",
                        ])
                )}</div>`;
            const reqLab = async () => {
                if (!v("lt")) return toast("Enter a test name");
                try { await apiCreate("labs", { p: v("lp"), d: did(), test: v("lt"), status: "Requested", file: "" }); await loadBackendData(); toast("Lab request saved to backend"); }
                catch (e) { console.error(e); toast("Could not save lab request: " + e.message); }
            };

            /* ---------- Admin ---------- */
            const aOver = () =>
                `<h2>Overview</h2><div class="stats">${[
                    ["Users", db.users.length],
                    ["Doctors", db.doctors.length],
                    ["Departments", db.depts.length],
                    ["Appointments", db.appts.length],
                    ["Records", db.recs.length],
                ]
                    .map((s) => `<div class="stat"><b>${s[1]}</b>${s[0]}</div>`)
                    .join("")}</div><div class="card"><h3>Upcoming appointments</h3>${T(
                    ["Patient", "Doctor", "Date"],
                    db.appts
                        .filter((a) => a.status === "Scheduled")
                        .map((a) => [N("patients", a.p), N("doctors", a.d), a.date])
                )}</div>`;
            const aUsers = () =>
                `<h2>Manage users</h2><div class="card"><div class="g"><label>Name<input id="un"></label><label>Email<input id="ue" type="email"></label><label>Role<select id="ur"><option>Patient</option><option>Doctor</option><option>Admin</option><option>Lab Staff</option><option>Pharmacist</option></select></label></div><p><button class="btn" onclick="addU()">Add user</button></p></div><div class="card">${T(
                    ["Name", "Email", "Role", "Status", ""],
                    db.users.map((u) => [
                        u.name,
                        u.email,
                        u.role,
                        B(u.on ? "Active" : "Inactive"),
                        `<button class="btn s o" onclick="togU(${u.id})">${u.on ? "Deactivate" : "Activate"}</button>`,
                    ])
                )}</div>`;
            const addU = async () => {
                if (!v("un") || !v("ue")) return toast("Enter name and email");
                try { await apiCreate("users", { name: v("un"), email: v("ue"), role: v("ur"), on: 1 }); await loadBackendData(); toast("User saved to backend"); }
                catch (e) { console.error(e); toast("Could not save user: " + e.message); }
            };
            const togU = async (id) => {
                const u = db.users.find((x) => String(x.id) === String(id));
                if (!u) return;
                try { await apiUpdate("users", id, { on: u.on ? 0 : 1 }); await loadBackendData(); }
                catch (e) { console.error(e); toast("Could not update user: " + e.message); }
            };
            const aDocs = () =>
                `<h2>Manage doctors</h2><div class="card"><div class="g"><label>Name<input id="dn"></label><label>Specialization<input id="ds"></label><label>Department<select id="dd">${O("depts")}</select></label><label>Experience (years)<input id="de" type="number" min="0"></label></div><p><button class="btn" onclick="addD()">Add doctor</button></p></div><div class="card">${T(
                    ["Name", "Specialization", "Department", "Experience", ""],
                    db.doctors.map((d) => [
                        d.name,
                        d.spec,
                        N("depts", +d.dept),
                        d.exp + " yrs",
                        `<button class="btn s d" onclick="delD('${d.id}')">Remove</button>`,
                    ])
                )}</div>`;
            const addD = async () => {
                if (!v("dn")) return toast("Enter a name");
                try { await apiCreate("doctors", { name: v("dn"), spec: v("ds"), exp: Number(v("de") || 0), dept: Number(v("dd")) }); await loadBackendData(); toast("Doctor saved to backend"); }
                catch (e) { console.error(e); toast("Could not save doctor: " + e.message); }
            };
            const delD = async (id) => {
                try { await apiDelete("doctors", id); await loadBackendData(); toast("Doctor removed from backend"); }
                catch (e) { console.error(e); toast("Could not remove doctor: " + e.message); }
            };
            const aDeps = () =>
                `<h2>Departments</h2><div class="card"><div class="g"><label>Name<input id="pn1"></label><label>Description<input id="pd1"></label></div><p><button class="btn" onclick="addDep()">Add department</button></p></div><div class="card">${T(
                    ["Name", "Description", "Doctors"],
                    db.depts.map((d) => [d.name, d.description, db.doctors.filter((x) => x.dept === d.id).length])
                )}</div>`;
            const addDep = async () => {
                if (!v("pn1")) return toast("Enter a name");
                try { await apiCreate("depts", { name: v("pn1"), description: v("pd1") }); await loadBackendData(); toast("Department saved to backend"); }
                catch (e) { console.error(e); toast("Could not save department: " + e.message); }
            };
            const aAppts = () =>
                `<h2>All appointments</h2><div class="card">${T(
                    ["Patient", "Doctor", "Date", "Time", "Status", ""],
                    db.appts.map((a) => [
                        N("patients", a.p),
                        N("doctors", a.d),
                        a.date,
                        a.time,
                        B(a.status),
                        a.status === "Scheduled"
                            ? `<button class="btn s d" onclick="setA(${a.id},'Cancelled')">Cancel</button>`
                            : "",
                    ])
                )}</div>`;
            const aRecs = () =>
                `<h2>Records</h2><div class="card"><h3>Medical records</h3>${T(
                    ["Date", "Patient", "Doctor", "Diagnosis"],
                    db.recs.map((r) => [r.date, N("patients", r.p), N("doctors", r.d), r.dx])
                )}</div><div class="card"><h3>Lab reports</h3>${T(
                    ["Patient", "Test", "Status"],
                    db.labs.map((l) => [N("patients", l.p), l.test, B(l.status)])
                )}</div>`;

            /* ---------- Lab staff ---------- */
            const labQ = () =>
                `<h2>Test requests</h2><div class="card">${T(
                    ["Patient", "Test", "Requested by", "Status", "Action"],
                    db.labs
                        .filter((l) => l.status !== "Completed")
                        .map((l) => [
                            N("patients", l.p),
                            l.test,
                            N("doctors", l.d),
                            B(l.status),
                            l.status === "Requested"
                                ? `<button class="btn s" onclick="labSet(${l.id},'In Progress')">Start test</button>`
                                : `<div class="row"><input type="file" id="f${l.id}" style="width:170px;margin:0"><button class="btn s" onclick="labUp(${l.id})">Upload report</button></div>`,
                        ])
                )}</div>`;
            const labSet = async (id, s) => {
                try { await apiUpdate("labs", id, { status: s }); await loadBackendData(); toast("Lab status saved"); }
                catch (e) { console.error(e); toast("Could not update lab status: " + e.message); }
            };
            const labUp = async (id) => {
                const f = $("#f" + id).files[0];
                if (!f) return toast("Choose a report file");
                try {
                    await apiUpdate("labs", id, { file: f.name, status: "Completed" });
                    await loadBackendData();
                    toast("Report details saved to backend (filename only)");
                } catch (e) {
                    console.error(e);
                    toast("Could not save report details: " + e.message);
                }
            };
            const labRep = () =>
                `<h2>Completed reports</h2><div class="card">${T(
                    ["Patient", "Test", "Report"],
                    db.labs.filter((l) => l.status === "Completed").map((l) => [N("patients", l.p), l.test, l.file])
                )}</div>`;
            const labEq = () =>
                `<h2>Lab equipment</h2><div class="card"><div class="g"><label>Equipment name<input id="en"></label></div><p><button class="btn" onclick="addEq()">Add equipment</button></p>${T(
                    ["Equipment", "Status"],
                    db.equip.map((e) => [
                        e.name,
                        `<select onchange="setEq(${e.id},this.value)" style="width:160px;margin:0">${["Operational", "Maintenance"].map((s) => `<option${s === e.status ? " selected" : ""}>${s}</option>`).join("")}</select>`,
                    ])
                )}</div>`;
            const addEq = async () => {
                if (!v("en")) return toast("Enter a name");
                try { await apiCreate("equip", { name: v("en"), status: "Operational" }); await loadBackendData(); toast("Equipment saved to backend"); }
                catch (e) { console.error(e); toast("Could not save equipment: " + e.message); }
            };
            const setEq = async (id, s) => {
                try { await apiUpdate("equip", id, { status: s }); await loadBackendData(); toast("Equipment status saved"); }
                catch (e) { console.error(e); toast("Could not update equipment: " + e.message); }
            };

            /* ---------- Pharmacist ---------- */
            const phRows = (a) =>
                T(
                    ["Date", "Patient", "Doctor", "Medicines", "Status"],
                    a.map((r) => [
                        r.date,
                        N("patients", r.p),
                        N("doctors", r.d),
                        medsTxt(r.meds),
                        `<select onchange="setRx(${r.id},this.value)" style="width:140px;margin:0">${["Pending", "Processing", "Dispensed", "Unavailable"].map((s) => `<option${s === r.status ? " selected" : ""}>${s}</option>`).join("")}</select>`,
                    ])
                );
            const phQ = () =>
                `<h2>Dispensing queue</h2><div class="card">${phRows(db.rx.filter((r) => r.status !== "Dispensed"))}</div>`;
            const phAll = () => `<h2>All prescriptions</h2><div class="card">${phRows(db.rx)}</div>`;
            const setRx = async (id, s) => {
                try { await apiUpdate("rx", id, { status: s }); await loadBackendData(); toast("Prescription status saved"); }
                catch (e) { console.error(e); toast("Could not update prescription: " + e.message); }
            };

            const NAV = {
                patient: [
                    ["Book appointment", book],
                    ["My appointments", myAppts],
                    ["Prescriptions", pRx],
                    ["Medical records", pRecs],
                    ["Lab reports", pLabs],
                    ["Profile", prof],
                ],
                doctor: [
                    ["Appointments", dAppts],
                    ["Patients", dPat],
                    ["Prescribe", dRx],
                    ["Records", dRecs],
                    ["Lab requests", dLabs],
                ],
                admin: [
                    ["Overview", aOver],
                    ["Users", aUsers],
                    ["Doctors", aDocs],
                    ["Departments", aDeps],
                    ["Appointments", aAppts],
                    ["Records", aRecs],
                ],
                lab: [
                    ["Test requests", labQ],
                    ["Reports", labRep],
                    ["Equipment", labEq],
                ],
                pharm: [
                    ["Queue", phQ],
                    ["All prescriptions", phAll],
                ],
            };

            function login(r) {
                if (!backendReady) return toast("Backend data is not loaded yet");
                role = r;
                tab = 0;
                render();
            }
            function logout() {
                role = null;
                render();
            }
            function render() {
                if (!backendReady && !backendError) {
                    $("#app").innerHTML = `<div class="wrap"><div class="hero"><h1>MediCare Hub</h1><p>Connecting to Java backend…</p></div><div class="card">Loading all data through AJAX. The role screens will appear after the backend response is received.</div></div>`;
                    return;
                }
                if (!backendReady && backendError) {
                    $("#app").innerHTML = `<div class="wrap"><div class="hero"><h1>MediCare Hub</h1><p>Backend connection failed.</p></div><div class="card"><p><b>Error:</b> ${backendError}</p><p>Check Tomcat and open this page through localhost.</p><button class="btn" onclick="loadBackendData(true)">Retry</button></div></div>`;
                    return;
                }
                if (!role) {
                    document.documentElement.style.setProperty("--ac", "#0f766e");
                    $("#app").innerHTML =
                        `<div class="wrap"><div class="hero"><h1>MediCare Hub</h1><p>Healthcare management for patients, doctors, administrators, lab staff and pharmacists. Choose a role to sign in to the demo.</p></div><div class="roles">${Object.entries(
                            ROLES
                        )
                            .map(
                                ([k, r]) =>
                                    `<button class="role" style="--c:${r[2]}" onclick="login('${k}')"><b>${r[0]}</b><span>${r[1]}</span></button>`
                            )
                            .join(
                                ""
                            )}</div><p class="mut" style="margin-top:24px">Demo data lives in the page and resets on reload. Hook the actions up to /api/users and /api/consultations when the servlet backend is ready.</p></div>`;
                    return;
                }
                const r = ROLES[role];
                document.documentElement.style.setProperty("--ac", r[2]);
                const who = role === "patient" ? N("patients", pid()) : role === "doctor" ? N("doctors", did()) : r[0];
                $("#app").innerHTML =
                    `<div class="top"><b>MediCare Hub · ${r[0]}</b><span class="row">${who}<button class="btn s o" onclick="loadBackendData(true)">Refresh data</button><button class="btn s" onclick="logout()">Log out</button></span></div><div class="tabs">${NAV[role].map((n, i) => `<button class="tab${i === tab ? " on" : ""}" onclick="go(${i})">${n[0]}</button>`).join("")}</div><div class="wrap">${NAV[role][tab][1]()}</div>`;
            }
            loadBackendData();
