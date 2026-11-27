// ==========================================
// ATRIA EDU ATTENDANCE PARSER
// ==========================================

(function () {

    console.log("[Student Hub] Atria attendance parser started.");


    // ------------------------------------------
    // Find attendance tables
    // ------------------------------------------

    const tables = document.querySelectorAll("table");

    if (!tables.length) {

        console.log(
            "[Student Hub] No tables found."
        );

        return;
    }


    const attendance = {
        theory: [],
        laboratory: [],
        electives: [],
        extractedAt: new Date().toISOString()
    };


    // ------------------------------------------
    // Determine section from table position/content
    // ------------------------------------------

    function getSection(table, index) {

        const previousText =
            table.parentElement?.innerText || "";

        const tableText =
            table.innerText || "";

        const combined =
            (previousText + " " + tableText)
                .toLowerCase();


        if (
            combined.includes(
                "laboratory ia/attendance"
            )
        ) {
            return "laboratory";
        }


        if (
            combined.includes(
                "electives ia/attendance"
            )
        ) {
            return "electives";
        }


        if (
            combined.includes(
                "theory ia/attendance"
            )
        ) {
            return "theory";
        }


        // Fallback based on order
        if (index === 0) {
            return "theory";
        }

        if (index === 1) {
            return "laboratory";
        }

        if (index === 2) {
            return "electives";
        }


        return null;
    }


    // ------------------------------------------
    // Find column indexes
    // ------------------------------------------

    function getColumnIndexes(table) {

        const headerRow =
            table.querySelector("thead tr") ||
            table.querySelector("tr");

        if (!headerRow) {
            return null;
        }


        const headers =
            Array.from(
                headerRow.querySelectorAll("th, td")
            ).map(cell =>
                cell.innerText
                    .trim()
                    .toLowerCase()
            );


        const findColumn = (...names) => {

            return headers.findIndex(
                header =>
                    names.includes(header)
            );

        };


        return {

            name: findColumn(
                "subject name"
            ),

            code: findColumn(
                "subject code"
            ),

            conducted: findColumn(
                "conducted"
            ),

            present: findColumn(
                "present"
            ),

            absent: findColumn(
                "absent"
            ),

            percentage: findColumn(
                "%"
            )

        };

    }


    // ------------------------------------------
    // Parse one table
    // ------------------------------------------

    function parseTable(table, section) {

        const indexes =
            getColumnIndexes(table);


        if (!indexes) {
            return [];
        }


        if (
            indexes.name === -1 ||
            indexes.code === -1
        ) {
            return [];
        }


        const rows =
            Array.from(
                table.querySelectorAll("tr")
            );


        const results = [];


        rows.forEach((row, rowIndex) => {

            // Skip header
            if (rowIndex === 0) {
                return;
            }


            const cells =
                Array.from(
                    row.querySelectorAll("td")
                );


            if (!cells.length) {
                return;
            }


            function getValue(index) {

                if (
                    index === -1 ||
                    !cells[index]
                ) {
                    return "";
                }

                return cells[index]
                    .innerText
                    .trim();

            }


            const name =
                getValue(indexes.name);

            const code =
                getValue(indexes.code);


            // Ignore empty rows
            if (!name || !code) {
                return;
            }


            const conductedText =
                getValue(indexes.conducted);

            const presentText =
                getValue(indexes.present);

            const absentText =
                getValue(indexes.absent);

            const percentageText =
                getValue(indexes.percentage);


            const conducted =
                Number(conductedText) || 0;

            const present =
                Number(presentText) || 0;

            const absent =
                Number(absentText) || 0;


            let percentage = null;


            if (percentageText) {

                const parsed =
                    Number(
                        percentageText
                            .replace("%", "")
                            .trim()
                    );

                if (!Number.isNaN(parsed)) {
                    percentage = parsed;
                }

            }


            // If portal doesn't provide percentage,
            // calculate it ourselves.
            if (
                percentage === null &&
                conducted > 0
            ) {

                percentage =
                    Number(
                        (
                            present /
                            conducted *
                            100
                        ).toFixed(2)
                    );

            }


            results.push({

                name,

                code,

                conducted,

                present,

                absent,

                percentage,

                section

            });

        });


        return results;

    }


    // ------------------------------------------
    // Parse every table
    // ------------------------------------------

    tables.forEach((table, index) => {

        const section =
            getSection(table, index);


        if (!section) {
            return;
        }


        const rows =
            parseTable(
                table,
                section
            );


        attendance[section].push(
            ...rows
        );

    });


    // ------------------------------------------
    // Save data
    // ------------------------------------------

    chrome.storage.local.set({

        studentHubAttendance:
            attendance

    }, () => {

        if (chrome.runtime.lastError) {

            console.error(
                "[Student Hub] Storage error:",
                chrome.runtime.lastError
            );

            return;
        }
        console.log(
    "[Student Hub] Attendance successfully extracted:",
    attendance
);

console.table(attendance.theory);
console.table(attendance.laboratory);
console.table(attendance.electives);


        console.log(
            "[Student Hub] Attendance saved:",
            attendance
        );

        // Inject CampusCircle Floating Sync HUD on the Atria Portal
        try {
            if (!document.getElementById("campuscircle-sync-hud")) {
                const hud = document.createElement("div");
                hud.id = "campuscircle-sync-hud";
                hud.style.cssText = `
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999999;
                    background: #1e1b4b;
                    color: #ffffff;
                    padding: 16px 20px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
                    border: 1px solid #4338ca;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 320px;
                    animation: ccSlideUp 0.3s ease-out;
                `;

                const totalTheory = attendance.theory?.length || 0;
                const totalLab = attendance.laboratory?.length || 0;

                hud.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                            <span style="font-weight: 700; font-size: 13px; color: #e0e7ff; letter-spacing: -0.2px;">CampusCircle Sync</span>
                        </div>
                        <button id="cc-close-hud" style="background: transparent; border: none; color: #a5b4fc; cursor: pointer; font-size: 16px; line-height: 1;">&times;</button>
                    </div>
                    <p style="font-size: 11px; color: #c7d2fe; margin: 0 0 12px; line-height: 1.4;">
                        Captured <strong>${totalTheory}</strong> Theory & <strong>${totalLab}</strong> Lab courses directly from Atria Portal.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button id="cc-copy-json" style="flex: 1; padding: 7px 10px; background: #312e81; hover:background: #3730a3; color: #e0e7ff; border: 1px solid #4f46e5; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                            📋 Copy JSON
                        </button>
                        <a href="http://localhost:5188/attendance" target="_blank" style="flex: 1; padding: 7px 10px; background: #4f46e5; color: #ffffff; text-decoration: none; text-align: center; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-block;">
                            🚀 Open App
                        </a>
                    </div>
                `;

                document.body.appendChild(hud);

                document.getElementById("cc-close-hud")?.addEventListener("click", () => {
                    hud.remove();
                });

                document.getElementById("cc-copy-json")?.addEventListener("click", () => {
                    navigator.clipboard.writeText(JSON.stringify(attendance, null, 2));
                    const btn = document.getElementById("cc-copy-json");
                    if (btn) btn.innerText = "✓ Copied!";
                    setTimeout(() => { if (btn) btn.innerText = "📋 Copy JSON"; }, 2000);
                });
            }
        } catch (e) {
            console.error("[Student Hub] Failed to inject HUD:", e);
        }

    });


})();