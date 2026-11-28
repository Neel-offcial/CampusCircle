// ==========================================
// ATRIA EDU ATTENDANCE & IA MARKS PARSER
// ==========================================

(function () {
    console.log("[CampusCircle] Atria attendance & IA parser started on atriadigitalcampus.com.");

    const tables = document.querySelectorAll("table");
    if (!tables.length) {
        console.log("[CampusCircle] No tables found on page.");
        return;
    }

    const attendance = {
        theory: [],
        laboratory: [],
        minorProject: [],
        electives: [],
        extractedAt: new Date().toISOString()
    };

    function getSection(table, index) {
        const previousText = table.parentElement?.innerText || "";
        const tableText = table.innerText || "";
        const combined = (previousText + " " + tableText).toLowerCase();

        if (combined.includes("laboratory ia/attendance")) {
            return "laboratory";
        }
        if (combined.includes("minorproject ia/attendance") || combined.includes("minor project")) {
            return "minorProject";
        }
        if (combined.includes("electives ia/attendance")) {
            return "electives";
        }
        if (combined.includes("theory ia/attendance")) {
            return "theory";
        }

        // Fallbacks
        if (index === 0) return "theory";
        if (index === 1) return "laboratory";
        if (index === 2) return "minorProject";
        return null;
    }

    function getColumnIndexes(table) {
        const headerRow = table.querySelector("thead tr") || table.querySelector("tr");
        if (!headerRow) return null;

        const headers = Array.from(headerRow.querySelectorAll("th, td")).map(cell =>
            cell.innerText.trim().toLowerCase()
        );

        const findColumn = (...names) => {
            return headers.findIndex(header => names.includes(header));
        };

        return {
            name: findColumn("subject name"),
            code: findColumn("subject code"),
            conducted: findColumn("conducted"),
            present: findColumn("present"),
            absent: findColumn("absent"),
            percentage: findColumn("%"),
            maxIa: findColumn("max ia"),
            ia1: findColumn("ia1"),
            ia2: findColumn("ia2"),
            finalIa: findColumn("final ia", "ia"),
            assignment: findColumn("assignment", "performance marks"),
            total: findColumn("total")
        };
    }

    function parseTable(table, section) {
        const indexes = getColumnIndexes(table);
        if (!indexes || indexes.name === -1 || indexes.code === -1) {
            return [];
        }

        const rows = Array.from(table.querySelectorAll("tr"));
        const results = [];

        rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) return; // Skip header

            const cells = Array.from(row.querySelectorAll("td"));
            if (!cells.length) return;

            function getValue(index) {
                if (index === -1 || !cells[index]) return "";
                return cells[index].innerText.trim();
            }

            const name = getValue(indexes.name);
            const code = getValue(indexes.code);

            if (!name || !code) return;

            const conducted = Number(getValue(indexes.conducted)) || 0;
            const present = Number(getValue(indexes.present)) || 0;
            const absent = Number(getValue(indexes.absent)) || 0;

            const percentageText = getValue(indexes.percentage);
            let percentage = null;
            if (percentageText) {
                const parsed = Number(percentageText.replace("%", "").trim());
                if (!Number.isNaN(parsed)) percentage = parsed;
            }
            if (percentage === null && conducted > 0) {
                percentage = Number(((present / conducted) * 100).toFixed(2));
            }

            // Extract Internal Assessment (IA) Marks
            const maxIa = Number(getValue(indexes.maxIa)) || 60;
            const ia1Raw = getValue(indexes.ia1);
            const ia2Raw = getValue(indexes.ia2);
            const finalIaRaw = getValue(indexes.finalIa);
            const assignmentRaw = getValue(indexes.assignment);
            const totalRaw = getValue(indexes.total);

            const ia1 = ia1Raw !== "" ? Number(ia1Raw) : null;
            const ia2 = ia2Raw !== "" ? Number(ia2Raw) : null;
            const finalIa = finalIaRaw !== "" ? Number(finalIaRaw) : null;
            const assignment = assignmentRaw !== "" ? Number(assignmentRaw) : null;
            const totalCie = totalRaw !== "" ? Number(totalRaw) : null;

            results.push({
                name,
                code,
                conducted,
                present,
                absent,
                percentage,
                section,
                maxIa,
                ia1,
                ia2,
                finalIa,
                assignment,
                totalCie,
                isSyncedFromPortal: true
            });
        });

        return results;
    }

    tables.forEach((table, index) => {
        const section = getSection(table, index);
        if (!section || !attendance[section]) return;
        const rows = parseTable(table, section);
        attendance[section].push(...rows);
    });

    console.log("[CampusCircle] Extracted live portal data:", attendance);

    // Save in Chrome Storage
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ studentHubAttendance: attendance }, () => {
            console.log("[CampusCircle] Portal attendance & IA data saved to chrome.storage.local.");
        });
    }

    // Broadcast event to web page if CampusCircle tab is listening
    window.postMessage({
        type: "CAMPUSCIRCLE_PORTAL_SYNC",
        data: attendance
    }, "*");

    // Inject visual feedback pill on Atria Digital Campus page
    const syncBadge = document.createElement("div");
    syncBadge.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:99999;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:12px;font-size:12px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;font-family:sans-serif;";
    syncBadge.innerHTML = "<span>✓ CampusCircle: Synced " + (attendance.theory.length + attendance.laboratory.length + attendance.minorProject.length) + " courses</span>";
    document.body.appendChild(syncBadge);
    setTimeout(() => syncBadge.remove(), 6000);
})();
