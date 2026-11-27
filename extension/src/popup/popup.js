// ==========================================
// STUDENT HUB POPUP
// ==========================================

const TARGET_ATTENDANCE = 75;

const dashboardButton = document.getElementById("dashboardButton");
const plannerButton = document.getElementById("plannerButton");


// ==========================================
// INITIALISE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadStudentHub();
});


// ==========================================
// LOAD DATA
// ==========================================

function loadStudentHub() {
    chrome.storage.local.get("studentHubAttendance", result => {
        const attendance = result.studentHubAttendance;

        if (!attendance) {
            renderNoData();
            return;
        }

        renderProfile();
        renderDate();
        renderOverallAttendance(attendance);
        renderTodayClasses(attendance);
        renderAttention(attendance);
    });
}


// ==========================================
// PROFILE / DATE
// ==========================================

function renderProfile() {
    const student =
        typeof studentData !== "undefined"
            ? studentData.student
            : null;

    const name = student?.name || "Student";
    const firstName = name.split(" ")[0];

    document.getElementById("greeting").textContent =
        `Hello, ${firstName}`;

    document.getElementById("profileInitial").textContent =
        firstName.charAt(0).toUpperCase();
}

function renderDate() {
    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });
}


// ==========================================
// ATTENDANCE HELPERS
// ==========================================

function getAllSubjects(attendance) {
    return [
        ...(attendance.theory || []),
        ...(attendance.laboratory || []),
        ...(attendance.electives || [])
    ];
}

function calculatePercentage(subject) {
    const conducted = Number(subject.conducted) || 0;
    const present = Number(subject.present) || 0;

    if (conducted === 0) {
        return null;
    }

    return (present / conducted) * 100;
}

function getAttendanceClass(value) {
    if (value === null) return "none";
    if (value >= 75) return "good";
    if (value >= 65) return "warning";
    return "danger";
}

function getDisplayName(subject) {
    const name = (subject.name || "").toLowerCase();

    if (name.includes("artificial intelligence")) {
        return subject.section === "laboratory"
            ? "AI (Lab)"
            : "AI (Theory)";
    }

    if (name.includes("computer networks")) {
        return subject.section === "laboratory"
            ? "Computer Networks (Lab)"
            : "Computer Networks (Theory)";
    }

    if (name.includes("intelligent data analytics")) {
        return subject.section === "laboratory"
            ? "Intelligent Data Analytics (Lab)"
            : "Intelligent Data Analytics (Theory)";
    }

    if (
        name.includes("react") &&
        name.includes("lab")
    ) {
        return "React (Lab)";
    }

    return subject.name;
}


// ==========================================
// OVERALL ATTENDANCE
// ==========================================

function renderOverallAttendance(attendance) {
    const subjects = getAllSubjects(attendance);

    let conducted = 0;
    let present = 0;

    subjects.forEach(subject => {
        conducted += Number(subject.conducted) || 0;
        present += Number(subject.present) || 0;
    });

    const overall =
        conducted > 0
            ? (present / conducted) * 100
            : null;

    const value =
        overall === null
            ? "--"
            : `${overall.toFixed(1)}%`;

    document.getElementById("overallAttendance").textContent = value;

    const progress =
        document.getElementById("overallProgress");

    progress.style.width =
        overall === null
            ? "0%"
            : `${Math.min(overall, 100)}%`;

    const status =
        document.getElementById("overallStatus");

    if (overall === null) {
        status.textContent = "No attendance data";
        return;
    }

    if (overall >= TARGET_ATTENDANCE) {
        status.textContent = "Above your 75% target";
        status.className = "good-text";
    } else {
        status.textContent = "Below your 75% target";
        status.className = "danger-text";
    }
}


// ==========================================
// TODAY'S CLASSES
// ==========================================

function renderTodayClasses(attendance) {
    const container =
        document.getElementById("todayClasses");

    const countElement =
        document.getElementById("todayClassCount");

    if (
        typeof timetable === "undefined" ||
        !Array.isArray(timetable.classes)
    ) {
        container.innerHTML =
            `<div class="empty-state">Timetable unavailable.</div>`;
        return;
    }

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    const today = days[new Date().getDay()];

    const classes = timetable.classes
        .filter(item => item.day === today)
        .sort(
            (a, b) =>
                timeToMinutes(a.start) -
                timeToMinutes(b.start)
        );

    countElement.textContent =
        `${classes.length} ${classes.length === 1 ? "class" : "classes"}`;

    if (!classes.length) {
        container.innerHTML =
            `<div class="empty-state">No classes scheduled today.</div>`;
        return;
    }

    container.innerHTML = "";

    classes.forEach(classItem => {
        const item = document.createElement("div");
        item.className = "class-card";

        const subject =
            getTimetableAttendance(classItem, attendance);

        const attendanceValue =
            subject ? calculatePercentage(subject) : null;

        const attendanceClass =
            getAttendanceClass(attendanceValue);

        const attendanceText =
            attendanceValue === null
                ? ""
                : `${Math.round(attendanceValue)}%`;

        const subjectName =
            getTimetableDisplayName(classItem);

        const meta = [
            classItem.faculty,
            classItem.room ? `Room ${classItem.room}` : null,
            classItem.batch ? `Batch ${classItem.batch}` : null
        ]
            .filter(Boolean)
            .join(" • ");

        item.innerHTML = `
            <div class="time">
                <strong>${classItem.start}</strong>
                <span>${classItem.end}</span>
            </div>

            <div class="class-info">
                <strong>${escapeHtml(subjectName)}</strong>
                <span>${escapeHtml(meta || classItem.type || "")}</span>
            </div>

            ${
                attendanceText
                    ? `<div class="attendance ${attendanceClass}">
                        ${attendanceText}
                       </div>`
                    : ""
            }
        `;

        container.appendChild(item);
    });
}

function timeToMinutes(time) {
    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}


// ==========================================
// TIMETABLE ↔ ATTENDANCE MATCHING
// ==========================================

function getTimetableAttendance(classItem, attendance) {
    const all = getAllSubjects(attendance);

    const timetableCode =
        (classItem.code || "").toUpperCase();

    const isLikelyLab =
        timetableCode.endsWith("L") ||
        classItem.type === "lab" ||
        (
            Boolean(classItem.batch) &&
            ["BAICB501", "BCNSB502", "BIDAB503", "BRALB507"]
                .includes(timetableCode)
        );

    // Known portal/timetable code alias for AI theory.
    if (timetableCode === "BAICB501") {
        const code =
            isLikelyLab ? "BAICB501L" : "BAINB501";

        const exact = all.find(
            subject =>
                subject.code?.toUpperCase() === code
        );

        if (exact) return exact;
    }

    // Prefer lab record when the timetable entry is a lab.
    if (isLikelyLab) {
        const lab = all.find(subject => {
            const code =
                (subject.code || "").toUpperCase();

            return (
                code === `${timetableCode}L` ||
                code === timetableCode
            ) && subject.section === "laboratory";
        });

        if (lab) return lab;
    }

    const exact = all.find(
        subject =>
            (subject.code || "").toUpperCase() ===
            timetableCode
    );

    if (exact) return exact;

    // Subject-name fallback.
    const timetableName =
        normaliseName(classItem.subject);

    return all.find(subject => {
        const subjectName =
            normaliseName(subject.name);

        return (
            subjectName === timetableName ||
            subjectName.includes(timetableName) ||
            timetableName.includes(subjectName)
        );
    }) || null;
}

function normaliseName(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\blab(oratory)?\b/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function getTimetableDisplayName(classItem) {
    const code =
        (classItem.code || "").toUpperCase();

    if (code === "BAICB501") {
        return classItem.batch
            ? "AI (Lab)"
            : "AI (Theory)";
    }

    if (code === "BCNSB502") {
        return classItem.batch
            ? "Computer Networks (Lab)"
            : "Computer Networks (Theory)";
    }

    if (code === "BIDAB503") {
        return classItem.batch
            ? "Intelligent Data Analytics (Lab)"
            : "Intelligent Data Analytics (Theory)";
    }

    if (code === "BRALB507") {
        return "React (Lab)";
    }

    return classItem.subject;
}


// ==========================================
// ATTENTION
// ==========================================

function renderAttention(attendance) {
    const subjects = getAllSubjects(attendance);

    const belowTarget = subjects
        .map(subject => ({
            subject,
            percentage: calculatePercentage(subject)
        }))
        .filter(
            item =>
                item.percentage !== null &&
                item.percentage < TARGET_ATTENDANCE
        )
        .sort(
            (a, b) =>
                a.percentage - b.percentage
        );

    document.getElementById("attentionCount").textContent =
        belowTarget.length;

    const subjectElement =
        document.getElementById("attentionSubject");

    const textElement =
        document.getElementById("attentionText");

    const button =
        document.getElementById("plannerButton");

    if (!belowTarget.length) {
        subjectElement.textContent = "All clear";
        textElement.textContent =
            "No subject is currently below the 75% target.";
        button.textContent = "View Attendance →";
        return;
    }

    const first = belowTarget[0];

    subjectElement.textContent =
        getDisplayName(first.subject);

    textElement.textContent =
        `${first.percentage.toFixed(1)}% attendance. ` +
        `Check the planner to see how many upcoming classes you need to attend.`;

    button.textContent = "Open Attendance →";
}


// ==========================================
// NO DATA
// ==========================================

function renderNoData() {
    document.getElementById("overallAttendance").textContent = "--";
    document.getElementById("overallStatus").textContent =
        "Open Atria EDU attendance page first.";

    document.getElementById("todayClasses").innerHTML =
        `<div class="empty-state">
            No live attendance data yet.
         </div>`;

    document.getElementById("attentionSubject").textContent =
        "Attendance not synced";

    document.getElementById("attentionText").textContent =
        "Open the Atria EDU attendance page while logged in, then reopen Student Hub.";
}


// ==========================================
// EVENTS
// ==========================================

dashboardButton.addEventListener("click", () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL(
            "src/dashboard/dashboard.html"
        )
    });
});

plannerButton.addEventListener("click", () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL(
            "src/dashboard/dashboard.html"
        )
    });
});


// ==========================================
// BASIC HTML ESCAPE
// ==========================================

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
