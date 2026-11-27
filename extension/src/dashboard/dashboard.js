// ==========================================
// STUDENT HUB DASHBOARD
// ==========================================


// ==========================================
// NAVIGATION
// ==========================================

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(".page-section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const target =
        document.getElementById(sectionId);

    if (target) {
        target.classList.add("active");
    }


    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );

    navItems.forEach(item => {
        item.classList.remove("active");
    });


    const activeNav =
        document.querySelector(
            `.nav-item[data-section="${sectionId}"]`
        );

    if (activeNav) {
        activeNav.classList.add("active");
    }
}


// ==========================================
// NAVIGATION EVENTS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-section]"
        );


    navItems.forEach(item => {

        item.addEventListener("click", () => {

            showSection(
                item.dataset.section
            );

        });

    });


    const sectionLinks =
        document.querySelectorAll(
            "[data-section-link]"
        );


    sectionLinks.forEach(link => {

        link.addEventListener("click", () => {

            showSection(
                link.dataset.sectionLink
            );

        });

    });


    // Theme

    initThemeSwitcher();


    // Initial page

    showSection("overview");


    setCurrentDate();

    loadLiveAttendance();

    renderTimetable();

    renderTodayClasses();

});


// ==========================================
// THEME
// ==========================================

function initThemeSwitcher() {

    const button = document.getElementById("themeButton");
    const menu = document.getElementById("themeMenu");
    const options = document.querySelectorAll(".theme-option[data-theme-choice]");

    if (!button || !menu) return;

    const savedTheme = localStorage.getItem("studentHubTheme") || "dark";
    applyTheme(savedTheme);

    button.addEventListener("click", event => {
        event.stopPropagation();
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!open));
        menu.hidden = open;
    });

    options.forEach(option => {
        option.addEventListener("click", event => {
            event.stopPropagation();
            const theme = option.dataset.themeChoice;
            applyTheme(theme);
            localStorage.setItem("studentHubTheme", theme);
            button.setAttribute("aria-expanded", "false");
            menu.hidden = true;
        });
    });

    document.addEventListener("click", () => {
        button.setAttribute("aria-expanded", "false");
        menu.hidden = true;
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            button.setAttribute("aria-expanded", "false");
            menu.hidden = true;
        }
    });

    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener?.("change", () => {
        if ((localStorage.getItem("studentHubTheme") || "dark") === "system") {
            updateThemeButton("system");
        }
    });
}

function applyTheme(theme) {
    const validThemes = ["light", "dark", "system"];
    const selected = validThemes.includes(theme) ? theme : "dark";

    document.documentElement.dataset.theme = selected;
    updateThemeButton(selected);
}

function updateThemeButton(theme) {
    const icon = document.getElementById("themeButtonIcon");
    const options = document.querySelectorAll(".theme-option[data-theme-choice]");

    const icons = { light: "☀", dark: "☾", system: "◐" };

    if (icon) {
        icon.textContent = icons[theme] || icons.dark;
    }

    options.forEach(option => {
        option.classList.toggle(
            "active",
            option.dataset.themeChoice === theme
        );
    });
}


// ==========================================
// DATE
// ==========================================

function setCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) return;


    const now = new Date();


    element.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


// ==========================================
// LOAD LIVE ATTENDANCE
// ==========================================

function loadLiveAttendance() {

    if (
        typeof chrome === "undefined" ||
        !chrome.storage
    ) {

        console.error(
            "[Student Hub] Chrome storage unavailable."
        );

        return;

    }


    chrome.storage.local.get(
        "studentHubAttendance",
        result => {

            const attendance =
                result.studentHubAttendance;


            if (!attendance) {

                console.warn(
                    "[Student Hub] No attendance data found."
                );

                return;

            }


            console.log(
                "[Student Hub] Live attendance loaded:",
                attendance
            );


            renderAttendance(
                attendance
            );

        }
    );

}


// ==========================================
// GET ALL SUBJECTS
// ==========================================

function getAllSubjects(attendance) {

    return [

        ...(attendance.theory || []),

        ...(attendance.laboratory || []),

        ...(attendance.electives || [])

    ];

}


// ==========================================
// CALCULATE OVERALL ATTENDANCE
// ==========================================

function calculateOverallAttendance(attendance) {

    const subjects =
        getAllSubjects(attendance);


    let conducted = 0;

    let present = 0;


    subjects.forEach(subject => {

        conducted +=
            Number(subject.conducted) || 0;

        present +=
            Number(subject.present) || 0;

    });


    if (conducted === 0) {
        return null;
    }


    return Number(
        (
            present /
            conducted *
            100
        ).toFixed(1)
    );

}


// ==========================================
// ATTENDANCE STATUS
// ==========================================

function getAttendanceClass(value) {

    if (value === null) {
        return "attendance-none";
    }


    if (value >= 75) {
        return "attendance-good";
    }


    if (value >= 65) {
        return "attendance-warning";
    }


    return "attendance-danger";

}


// ==========================================
// RENDER ATTENDANCE
// ==========================================

function renderAttendance(attendance) {

    storeDashboardAttendance(attendance);

    const subjects =
        getAllSubjects(attendance);


    const overall =
        calculateOverallAttendance(
            attendance
        );


    // --------------------------------------
    // OVERALL ATTENDANCE
    // --------------------------------------

    const overallElement =
        document.getElementById(
            "overallAttendance"
        );


    if (overallElement) {

        overallElement.textContent =
            overall !== null
                ? `${overall}%`
                : "--";

    }


    const overallBar =
        document.getElementById(
            "overallAttendanceBar"
        );


    if (overallBar && overall !== null) {

        overallBar.style.width =
            `${Math.min(overall, 100)}%`;

    }


    const overallStatus =
        document.getElementById(
            "overallAttendanceStatus"
        );


    if (overallStatus) {

        if (overall === null) {

            overallStatus.textContent =
                "No attendance data";

        } else if (overall >= 75) {

            overallStatus.textContent =
                "Above your target";

        } else {

            overallStatus.textContent =
                "Below your 75% target";

        }

    }


    // --------------------------------------
    // ATTENTION COUNT
    // --------------------------------------

    const belowTarget =
        subjects.filter(
            subject =>
                subject.percentage !== null &&
                subject.percentage < 75
        ).length;


    const attentionElement =
        document.getElementById(
            "attentionCount"
        );


    if (attentionElement) {

        attentionElement.textContent =
            belowTarget;

    }


    // --------------------------------------
    // MAIN ATTENDANCE LIST
    // --------------------------------------

    renderAttendanceList(
        subjects,
        "attendanceList"
    );


    renderAttendanceList(
        subjects,
        "fullAttendanceList"
    );

    // Attendance is loaded asynchronously, so refresh the weekly
    // timetable after live data arrives to apply attendance colors.
    renderTimetable();


    // --------------------------------------
    // ATTENDANCE PAGE SUMMARY
    // --------------------------------------

    const pageOverall =
        document.getElementById(
            "attendancePageOverall"
        );


    if (pageOverall) {

        pageOverall.textContent =
            overall !== null
                ? `${overall}%`
                : "--";

    }


    const riskCount =
        document.getElementById(
            "attendanceRiskCount"
        );


    if (riskCount) {

        riskCount.textContent =
            belowTarget;

    }


    const updated =
        attendance.extractedAt;


    const lastUpdated =
        document.getElementById(
            "attendanceLastUpdated"
        );


    if (
        lastUpdated &&
        updated
    ) {

        const date =
            new Date(updated);


        lastUpdated.textContent =
            date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }

}


// ==========================================
// ATTENDANCE LIST
// ==========================================

function renderAttendanceList(
    subjects,
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (subjects.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No attendance data available.
            </div>
        `;

        return;

    }


    subjects.forEach(subject => {

        const item =
            document.createElement("div");


        item.className =
            "attendance-item";


        const value =
            subject.percentage;


        const statusClass =
            getAttendanceClass(value);


        item.innerHTML = `

            <div class="attendance-subject">

                <div class="attendance-subject-code">
                    ${subject.code}
                </div>

                <div class="attendance-subject-name">
                    ${subject.name}
                </div>

            </div>


            <div class="attendance-numbers">

                <span>
                    ${subject.present}/${subject.conducted}
                </span>

                <strong class="${statusClass}">
                    ${
                        value !== null
                            ? `${value}%`
                            : "--"
                    }
                </strong>

            </div>

        `;


        item.addEventListener(
            "click",
            () => {

                openAttendancePlanner(
                    subject
                );

            }
        );


        container.appendChild(item);

    });

}


// ==========================================
// ATTENDANCE PLANNER
// ==========================================

// ==========================================
// ATTENDANCE PLANNER
// ==========================================

function openAttendancePlanner(subject) {

    const attendance =
        window.studentHubAttendance;


    if (!attendance) {

        alert("Attendance data is not available yet.");

        return;

    }


    const subjects =
        getAllSubjects(attendance);


    const relatedSubjects =
        findRelatedSubjects(
            subject,
            subjects
        );


    const timetableClasses =
        findTimetableClasses(
            subject,
            relatedSubjects
        );


    const nextWeekClasses =
        getNextWeekClasses(
            timetableClasses
        );


    const planner =
        document.createElement("div");


    planner.className =
        "planner-overlay";


    planner.innerHTML =
        buildPlannerHTML(
            subject,
            relatedSubjects,
            nextWeekClasses
        );


    document.body.appendChild(planner);


    const closeButton =
        planner.querySelector(
            ".planner-close"
        );


    closeButton.addEventListener(
        "click",
        () => planner.remove()
    );


    planner.addEventListener(
        "click",
        event => {

            if (
                event.target === planner
            ) {

                planner.remove();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function escapeHandler(event) {

            if (event.key === "Escape") {

                planner.remove();

                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );

            }

        }
    );

}


// ==========================================
// STORE LIVE ATTENDANCE
// ==========================================

function storeDashboardAttendance(attendance) {

    window.studentHubAttendance =
        attendance;

}


// ==========================================
// FIND RELATED THEORY / LAB SUBJECTS
// ==========================================

function findRelatedSubjects(
    selectedSubject,
    subjects
) {

    const selectedName =
        normalizeSubjectName(
            selectedSubject.name
        );


    const selectedCode =
        normalizeCode(
            selectedSubject.code
        );


    return subjects.filter(subject => {

        const name =
            normalizeSubjectName(
                subject.name
            );


        const code =
            normalizeCode(
                subject.code
            );


        // Same exact attendance subject
        if (
            name === selectedName ||
            code === selectedCode
        ) {

            return true;

        }


        // Same subject with "Lab"
        if (
            removeLabWord(name) ===
            removeLabWord(selectedName)
        ) {

            return true;

        }


        // Explicit course aliases
        return sameCourseAlias(
            code,
            selectedCode
        );

    });

}


// ==========================================
// NORMALIZE SUBJECT NAME
// ==========================================

function normalizeSubjectName(name) {

    return String(name || "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\blab\b/g, "")
        .replace(/\btheory\b/g, "")
        .replace(/\bpractical\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

}


function removeLabWord(name) {

    return String(name || "")
        .toLowerCase()
        .replace(/\blab\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

}


function normalizeCode(code) {

    return String(code || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .replace(/L$/, "");

}


// ==========================================
// COURSE ALIASES
// ==========================================

function sameCourseAlias(
    codeA,
    codeB
) {

    const aliases = [

        ["BAINB501", "BAICB501"],

        ["BCNSB502", "BCNSB502"],

        ["BIDAB503", "BIDAB503"],

        ["BSTQB515", "BSTQAB515A"],

        ["BRMIK504", "BRMIK504"],

        ["BEFMK506", "BEFMK506"],

        ["BRALB507", "BRALB507"]

    ];


    return aliases.some(
        pair => {

            return (
                pair.includes(codeA) &&
                pair.includes(codeB)
            );

        }
    );

}


// ==========================================
// FIND TIMETABLE CLASSES
// ==========================================

function findTimetableClasses(
    selectedSubject,
    relatedSubjects
) {

    if (
        typeof timetable === "undefined" ||
        !Array.isArray(timetable.classes)
    ) {

        return [];

    }


    const attendanceCodes =
        relatedSubjects.map(
            subject =>
                normalizeCode(
                    subject.code
                )
        );


    const selectedName =
        normalizeSubjectName(
            selectedSubject.name
        );


    return timetable.classes.filter(
        classItem => {

            const classCode =
                normalizeCode(
                    classItem.code
                );


            const className =
                normalizeSubjectName(
                    classItem.subject
                );


            // Match by normalized code
            if (
                attendanceCodes.includes(
                    classCode
                )
            ) {

                return true;

            }


            // Match using aliases
            if (
                relatedSubjects.some(
                    subject =>
                        sameCourseAlias(
                            normalizeCode(
                                subject.code
                            ),
                            classCode
                        )
                )
            ) {

                return true;

            }


            // Match subject name
            if (
                className &&
                (
                    className.includes(
                        selectedName
                    ) ||
                    selectedName.includes(
                        className
                    )
                )
            ) {

                return true;

            }


            return false;

        }
    );

}


// ==========================================
// NEXT WEEK
// ==========================================

function getNextWeekClasses(
    classes
) {

    const now =
        new Date();


    const currentDay =
        now.getDay();


    // Sunday = 0
    // Monday = 1

    const daysUntilMonday =
        currentDay === 0
            ? 1
            : 8 - currentDay;


    const nextMonday =
        new Date(now);


    nextMonday.setDate(
        now.getDate() +
        daysUntilMonday
    );


    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];


    const allowedDays = new Set([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ]);


    return classes
        .filter(
            item =>
                allowedDays.has(
                    item.day
                )
        )
        .map(item => {

            const dayIndex =
                dayNames.indexOf(
                    item.day
                );


            const date =
                new Date(nextMonday);


            date.setDate(
                nextMonday.getDate() +
                (
                    dayIndex - 1
                )
            );


            return {
                ...item,
                date
            };

        })
        .sort(
            (a, b) => {

                if (
                    a.date.getTime() !==
                    b.date.getTime()
                ) {

                    return (
                        a.date -
                        b.date
                    );

                }


                return (
                    timeToMinutes(a.start) -
                    timeToMinutes(b.start)
                );

            }
        );

}


// ==========================================
// TIME CONVERSION
// ==========================================

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }


    const parts =
        time.split(":");


    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );

}


// ==========================================
// ATTENDANCE CALCULATIONS
// ==========================================

function calculateProjectedAttendance(
    present,
    conducted,
    futureClasses
) {

    if (
        conducted <= 0
    ) {

        return null;

    }


    return Number(
        (
            (
                present +
                futureClasses
            ) /
            (
                conducted +
                futureClasses
            ) *
            100
        ).toFixed(1)
    );

}


function classesNeededForTarget(
    present,
    conducted,
    target = 75
) {

    if (
        conducted <= 0
    ) {

        return null;

    }


    const current =
        (
            present /
            conducted *
            100
        );


    if (
        current >= target
    ) {

        return 0;

    }


    let needed = 0;


    while (
        (
            (
                present +
                needed
            ) /
            (
                conducted +
                needed
            )
        ) *
        100 < target
    ) {

        needed++;


        // Safety
        if (needed > 1000) {
            return null;
        }

    }


    return needed;

}


function classesCanMiss(
    present,
    conducted,
    target = 75
) {

    if (
        conducted <= 0
    ) {

        return 0;

    }


    const current =
        (
            present /
            conducted *
            100
        );


    if (
        current < target
    ) {

        return 0;

    }


    let misses = 0;


    while (
        (
            present /
            (
                conducted +
                misses +
                1
            )
        ) *
        100 >= target
    ) {

        misses++;


        if (misses > 1000) {
            break;
        }

    }


    return misses;

}


// ==========================================
// BUILD PLANNER HTML
// ==========================================

function buildPlannerHTML(
    selectedSubject,
    relatedSubjects,
    nextWeekClasses
) {

    const theory =
        relatedSubjects.find(
            subject =>
                !String(subject.code)
                    .toUpperCase()
                    .endsWith("L")
        );


    const lab =
        relatedSubjects.find(
            subject =>
                String(subject.code)
                    .toUpperCase()
                    .endsWith("L")
        );


    const primary =
        selectedSubject;


    const present =
        Number(primary.present) || 0;


    const conducted =
        Number(primary.conducted) || 0;


    const percentage =
        primary.percentage !== null &&
        primary.percentage !== undefined
            ? Number(primary.percentage)
            : (
                conducted > 0
                    ? Number(
                        (
                            present /
                            conducted *
                            100
                        ).toFixed(1)
                    )
                    : null
            );


    const needed =
        classesNeededForTarget(
            present,
            conducted
        );


    const missable =
        classesCanMiss(
            present,
            conducted
        );


    const statusClass =
        getAttendanceClass(
            percentage
        );


    const statusText =
        percentage === null
            ? "Attendance data unavailable."
            : percentage >= 75
                ? `You are above the 75% target. You can miss approximately ${missable} more class${missable === 1 ? "" : "es"} before dropping below 75%.`
                : `You are below the 75% target. You need to attend ${needed} consecutive classes to reach 75%.`;


    const projections =
        buildProjectionRows(
            present,
            conducted
        );


    const nextWeekHTML =
        buildNextWeekHTML(
            nextWeekClasses
        );


    return `

        <div class="planner-panel">

            <div class="planner-header">

                <div class="planner-title-area">

                    <div class="planner-code">
                        ${primary.code}
                    </div>

                    <div class="planner-title">
                        ${primary.name}
                    </div>

                </div>


                <button
                    class="planner-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="planner-body">

                <div class="planner-status ${statusClass
                    .replace("attendance-", "")}">

                    ${statusText}

                </div>


                <div class="planner-attendance-hero">

                    <div>

                        <div
                            class="planner-percentage ${statusClass}"
                        >
                            ${
                                percentage !== null
                                    ? percentage + "%"
                                    : "--"
                            }
                        </div>

                        <div class="planner-fraction">
                            ${present} present / ${conducted} conducted
                        </div>

                    </div>


                    <div>

                        <div class="planner-progress">

                            <div
                                class="planner-progress-fill ${statusClass}"
                                style="
                                    width:
                                    ${Math.min(
                                        percentage || 0,
                                        100
                                    )}%;
                                    background:
                                    ${getAttendanceColor(
                                        percentage
                                    )};
                                "
                            ></div>

                        </div>


                        <div class="planner-target">

                            <span>
                                Current
                            </span>

                            <span>
                                Target: 75%
                            </span>

                        </div>

                    </div>

                </div>


                ${
                    theory || lab
                        ? `
                            <div class="planner-section">

                                <div class="planner-section-title">
                                    Subject Components
                                </div>

                                <div class="component-grid">

                                    ${
                                        theory
                                            ? buildComponentCard(
                                                "Theory",
                                                theory
                                            )
                                            : ""
                                    }

                                    ${
                                        lab
                                            ? buildComponentCard(
                                                "Laboratory",
                                                lab
                                            )
                                            : ""
                                    }

                                </div>

                            </div>
                        `
                        : ""
                }


                <div class="planner-section">

                    <div class="planner-section-title">
                        Attendance Projection
                    </div>

                    <div class="projection-list">

                        ${projections}

                    </div>

                </div>


                <div class="planner-section">

                    <div class="planner-section-title">
                        Next Week
                    </div>

                    ${
                        nextWeekHTML
                    }

                </div>


                <div class="planner-meta">

                    ${
                        primary.faculty
                            ? `
                                <div class="planner-meta-item">
                                    Faculty: ${primary.faculty}
                                </div>
                            `
                            : ""
                    }

                    ${
                        nextWeekClasses.length
                            ? `
                                <div class="planner-meta-item">
                                    ${nextWeekClasses.length}
                                    scheduled next week
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>

        </div>

    `;

}


// ==========================================
// PROJECTION ROWS
// ==========================================

function buildProjectionRows(
    present,
    conducted
) {

    const rows = [];


    for (
        let i = 0;
        i <= 5;
        i++
    ) {

        const projected =
            calculateProjectedAttendance(
                present,
                conducted,
                i
            );


        rows.push(`

            <div class="projection-row">

                <span>
                    ${
                        i === 0
                            ? "Current"
                            : `Attend next ${i}`
                    }
                </span>

                <span>
                    ${
                        i === 0
                            ? `${present}/${conducted}`
                            : `${present + i}/${conducted + i}`
                    }
                </span>

                <strong class="${
                    getAttendanceClass(
                        projected
                    )
                }">

                    ${
                        projected !== null
                            ? projected + "%"
                            : "--"
                    }

                </strong>

            </div>

        `);

    }


    return rows.join("");

}


// ==========================================
// COMPONENT CARD
// ==========================================

function buildComponentCard(
    label,
    subject
) {

    const percentage =
        subject.percentage;


    return `

        <div class="component-card">

            <div class="component-label">
                ${label}
            </div>

            <div class="component-subject-name">
                ${getBaseSubjectName(subject.name)}
            </div>

            <strong
                class="${getAttendanceClass(
                    percentage
                )}"
            >
                ${
                    percentage !== null &&
                    percentage !== undefined
                        ? percentage + "%"
                        : "--"
                }
            </strong>

            <span>
                ${
                    Number(subject.present) || 0
                }
                /
                ${
                    Number(subject.conducted) || 0
                }
                classes attended
            </span>

        </div>

    `;

}


// ==========================================
// NEXT WEEK HTML
// ==========================================

function buildNextWeekHTML(
    classes
) {

    if (!classes.length) {

        return `

            <div class="empty-state">

                No matching classes found
                in the fixed timetable.

            </div>

        `;

    }


    return `

        <div class="next-week-list">

            ${
                classes.map(
                    item => `

                        <div class="next-week-class">

                            <div class="next-week-day">
                                ${item.day}
                            </div>

                            <div class="next-week-time">
                                ${item.start}
                                -
                                ${item.end}
                            </div>

                            <div class="next-week-info">

                                <strong>
                                    ${item.subject}
                                </strong>

                                <span>

                                    ${
                                        item.faculty ||
                                        ""
                                    }

                                    ${
                                        item.room
                                            ? ` · Room ${item.room}`
                                            : ""
                                    }

                                    ${
                                        item.batch
                                            ? ` · Batch ${item.batch}`
                                            : ""
                                    }

                                </span>

                            </div>

                        </div>

                    `
                ).join("")
            }

        </div>

    `;

}


// ==========================================
// ATTENDANCE COLOR
// ==========================================

function getAttendanceColor(
    percentage
) {

    if (
        percentage === null ||
        percentage === undefined
    ) {

        return "#8b95a7";

    }


    if (percentage >= 75) {

        return "#55d889";

    }


    if (percentage >= 65) {

        return "#e8bd55";

    }


    return "#ef6262";

}

// ==========================================
// TIMETABLE
// ==========================================

function renderTimetable() {

    const container = document.getElementById("timetableContent");

    if (!container) return;

    if (typeof timetable === "undefined" || !Array.isArray(timetable.classes)) {
        container.innerHTML = `
            <div class="empty-state">Timetable data unavailable.</div>
        `;
        return;
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const attendance = window.studentHubAttendance || null;
    const subjects = attendance ? getAllSubjects(attendance) : [];

    container.innerHTML = "";

    days.forEach(day => {

        const classes = timetable.classes
            .filter(item => item.day === day)
            .sort((a, b) => a.start.localeCompare(b.start));

        if (!classes.length) return;

        const dayContainer = document.createElement("div");
        dayContainer.className = "timetable-day";

        dayContainer.innerHTML = `
            <div class="timetable-day-header">
                <div>
                    <span class="day-label">${day.substring(0, 3).toUpperCase()}</span>
                    <h2>${day}</h2>
                </div>
                <span class="class-count">${classes.length} classes</span>
            </div>
            <div class="timetable-grid"></div>
        `;

        const grid = dayContainer.querySelector(".timetable-grid");

        classes.forEach(classItem => {

            const related = subjects.length
                ? findRelatedSubjects(classItem, subjects)
                : [];

            const attendanceSubject = related[0] || null;
            const percentage = attendanceSubject
                ? calculatePercentage(attendanceSubject)
                : null;

            const statusClass = getAttendanceClass(percentage);
            const isActivity = classItem.type === "activity";
            const isLab = attendanceSubject
                ? isLabAttendanceSubject(attendanceSubject)
                : /lab/i.test(classItem.subject || "") || /lab$/i.test(classItem.code || "");

            const displayName = getTimetableDisplayName(classItem, attendanceSubject, isLab);

            const card = document.createElement("div");
            card.className = "timetable-card-block";

            if (isActivity) card.classList.add("activity");
            else card.classList.add(statusClass);
            if (isLab) card.classList.add("lab");

            const attendanceHTML = isActivity
                ? `<span class="class-type-badge activity-badge">Activity</span>`
                : attendanceSubject
                    ? `
                        <div class="class-attendance-row">
                            <span class="attendance-pill ${statusClass}">
                                ${percentage}%
                            </span>
                            <span class="attendance-mini-text">
                                ${Number(attendanceSubject.present) || 0}/${Number(attendanceSubject.conducted) || 0} attended
                            </span>
                        </div>
                        <div class="attendance-mini-bar">
                            <span style="width:${Math.min(Math.max(percentage || 0, 0), 100)}%"></span>
                        </div>
                    `
                    : `<span class="class-type-badge no-data-badge">No attendance data</span>`;

            let meta = [];
            if (classItem.faculty) meta.push(classItem.faculty);
            if (classItem.room) meta.push(`Room ${classItem.room}`);
            if (classItem.batch) meta.push(`Batch ${classItem.batch}`);

            card.innerHTML = `
                <div class="class-block-top">
                    <div class="class-time-block">
                        <strong>${classItem.start}</strong>
                        <span>${classItem.end}</span>
                    </div>
                    <span class="class-code">${classItem.code}</span>
                </div>

                <div class="class-block-title-row">
                    <div>
                        <h3>${displayName}</h3>
                        ${isLab ? `<span class="component-label-chip">Lab</span>` : (!isActivity ? `<span class="component-label-chip">Theory</span>` : "")}
                    </div>
                    <span class="class-arrow">›</span>
                </div>

                <div class="class-block-meta">
                    ${meta.map(item => `<span>${item}</span>`).join("")}
                </div>

                <div class="class-attendance">
                    ${attendanceHTML}
                </div>
            `;

            card.addEventListener("click", () => {
                if (attendanceSubject) {
                    openAttendancePlanner(attendanceSubject);
                } else {
                    openClassDetails(classItem);
                }
            });

            grid.appendChild(card);
        });

        container.appendChild(dayContainer);
    });
}

function calculatePercentage(subject) {
    const conducted = Number(subject?.conducted) || 0;
    const present = Number(subject?.present) || 0;

    if (conducted === 0) return null;

    return Number(((present / conducted) * 100).toFixed(1));
}

function isLabAttendanceSubject(subject) {
    if (!subject) return false;

    return /lab|laboratory/i.test(subject.name || "") ||
        /L$/i.test(subject.code || "");
}

function getTimetableDisplayName(classItem, attendanceSubject, isLab) {
    const code = String(classItem?.code || "").toUpperCase();

    const names = {
        "BAICB501": "AI",
        "BAINB501": "AI",
        "BCNSB502": "Computer Networks",
        "BIDAB503": "Intelligent Data Analytics",
        "BSTQAB515A": "Software Testing & Quality Assurance",
        "BSTQB515": "Software Testing & Quality Assurance",
        "BRMIK504": "Research Methodology & IPR",
        "BEFMK506": "Economics & Financial Management",
        "BRALB507": "React & Node JS"
    };

    const base = names[code] || getBaseSubjectName(attendanceSubject?.name || classItem?.subject);

    if (!base) return classItem?.subject || "Class";
    if (isLab) return `${base} (Lab)`;

    return classItem?.type === "activity" ? base : `${base} (Theory)`;
}

// ==========================================
// TODAY'S CLASSES
// ==========================================

function renderTodayClasses() {

    const container =
        document.getElementById(
            "todayClasses"
        );


    if (!container) {
        return;
    }


    if (
        typeof timetable === "undefined"
    ) {

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


    const today =
        days[new Date().getDay()];


    const classes =
        timetable.classes.filter(
            item =>
                item.day === today
        );


    const count =
        document.getElementById(
            "todayClassCount"
        );


    if (count) {

        count.textContent =
            classes.length;

    }


    const status =
        document.getElementById(
            "todayClassStatus"
        );


    if (status) {

        status.textContent =
            `${classes.length} scheduled today`;

    }


    container.innerHTML = "";


    if (!classes.length) {

        container.innerHTML = `
            <div class="empty-state">
                No classes scheduled today.
            </div>
        `;

        return;

    }


    classes.forEach(classItem => {

        const item =
            document.createElement("div");


        item.className =
            "today-class";


        item.innerHTML = `

            <div class="today-class-time">

                <strong>
                    ${classItem.start}
                </strong>

                <span>
                    ${classItem.end}
                </span>

            </div>


            <div>

                <strong>
                    ${classItem.subject}
                </strong>

                <span>
                    ${
                        classItem.faculty ||
                        classItem.type ||
                        ""
                    }
                </span>

            </div>

        `;


        container.appendChild(item);

    });

}


// ==========================================
// CLASS DETAILS
// ==========================================

function openClassDetails(classItem) {

    let details =
        `${classItem.subject}\n\n` +

        `Code: ${classItem.code}\n` +

        `Time: ${classItem.start} - ${classItem.end}`;


    if (classItem.faculty) {

        details +=
            `\nFaculty: ${classItem.faculty}`;

    }


    if (classItem.batch) {

        details +=
            `\nBatch: ${classItem.batch}`;

    }


    if (classItem.room) {

        details +=
            `\nRoom: ${classItem.room}`;

    }


    alert(details);

}

function getBaseSubjectName(name) {

    return String(name || "")
        .replace(/\s*-\s*Lab\b/gi, "")
        .replace(/\s+Lab\b/gi, "")
        .replace(/\s+Laboratory\b/gi, "")
        .trim();

}