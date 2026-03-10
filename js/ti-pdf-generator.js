// =============================================================================
// ti-pdf-generator.js — Standalone PDF generator for T&I Report
// New RA-style: dark navy header bar + footer bar on every inner page
// Cover page: colour logo centred, dark navy info card, building photo
// Structure & System Details: RA-style bordered tables
// =============================================================================

const COMPANY_LOGO_URL  = './assets/Color logo - no background (px reduction).png';
const FOOTER_IMAGE_URL  = './assets/es12nobackground.png';
const NAVY              = [13, 27, 42];         // #0d1b2a
const BLUE_ACCENT       = [8, 119, 195];        // #0877c3
const AMBER             = [230, 126, 34];       // cover page title accent
const COMPANY_FOOTER    = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852, Registered in England and Wales  |  info@strikepoint.uk  |  Tel: 01159903220';

const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 14;
const COL_L    = MARGIN;
const COL_R    = PAGE_W / 2 + 3;
const COL_W    = PAGE_W / 2 - MARGIN - 3;
const PAGE_BOT = 268; // above footer bar

// ===================== HELPERS =====================

function formatDate(dateString) {
    if (!dateString) return '-';
    const [y, m, d] = dateString.split('-');
    if (!y) return '-';
    return `${d}/${m}/${y}`;
}

function formatDateShort(dateString) {
    if (!dateString) return 'undated';
    const [y, m, d] = dateString.split('-');
    if (!y) return 'undated';
    return `${d}-${m}-${y.slice(2)}`;
}

/**
 * Add an image to the PDF respecting aspect ratio.
 * Returns actual height used.
 */
function addImageToPDF(pdf, imageData, x, y, maxWidth, maxHeight, centerAlign = false) {
    if (!imageData) return 0;
    try {
        const format = imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        const props = pdf.getImageProperties(imageData);
        const ar = props.width / props.height;
        let fw, fh;
        if (ar > maxWidth / maxHeight) { fw = maxWidth; fh = maxWidth / ar; }
        else { fh = maxHeight; fw = maxHeight * ar; }
        const fx = centerAlign ? x + (maxWidth - fw) / 2 : x;
        pdf.addImage(imageData, format, fx, y, fw, fh);
        return fh;
    } catch (e) {
        console.error('addImageToPDF error:', e);
        return 0;
    }
}

/**
 * Draw the inner page header: full-width navy bar with logo left, title centred.
 * Returns Y position after header.
 */
function addPageHeader(pdf, title, subtitle) {
    const barH = 18;
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, PAGE_W, barH, 'F');

    // Logo on left — use pre-loaded base64
    try {
        if (_logoBase64) pdf.addImage(_logoBase64, 'PNG', 4, 1, 28, 16);
    } catch (e) { /* */ }

    // Title centred
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, PAGE_W / 2, 10, { align: 'center' });

    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 235);
        pdf.text(subtitle, PAGE_W / 2, 15, { align: 'center' });
    }

    pdf.setTextColor(0, 0, 0);
    return barH + 6;
}

/**
 * Draw the footer bar: navy bar with footer logos image + company text.
 */
function addFooterToPage(pdf) {
    const barH = 16;
    const barY = PAGE_H - barH;

    pdf.setFillColor(...NAVY);
    pdf.rect(0, barY, PAGE_W, barH, 'F');

    // Footer logos image centred — 600x150px source = 4:1 ratio, so 72mm wide x 18mm tall
    try {
        if (_footerBase64) pdf.addImage(_footerBase64, 'PNG', PAGE_W/2 - 36, barY - 1, 72, 18);
    } catch (e) { /* */ }

    // Footer text
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(160, 190, 210);
    const lines = pdf.splitTextToSize(COMPANY_FOOTER, 180);
    pdf.text(lines, PAGE_W / 2, barY + 11, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
}

/**
 * Add a new page with header and footer, return Y start.
 */
function newPage(pdf, title, subtitle) {
    pdf.addPage();
    addFooterToPage(pdf);
    return addPageHeader(pdf, title, subtitle);
}

// ===================== RA-STYLE TABLE HELPERS =====================

/**
 * Draw a section header bar (blue).
 */
function drawSectionHeader(pdf, label, x, y, w) {
    const h = 7;
    pdf.setFillColor(...BLUE_ACCENT);
    pdf.rect(x, y, w, h, 'F');
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(label, x + 3, y + 4.8);
    pdf.setTextColor(0, 0, 0);
    return y + h;
}

/**
 * Draw a bordered table of label/value rows.
 * Returns Y after table.
 */
function drawTable(pdf, rows, x, y, w) {
    const rowH = 8;
    const labelW = w * 0.44;
    const valW   = w - labelW;

    rows.forEach((row, i) => {
        const bg = i % 2 === 0 ? [255, 255, 255] : [244, 248, 252];
        pdf.setFillColor(...bg);
        pdf.rect(x, y, w, rowH, 'F');

        // Label
        pdf.setFontSize(7.5);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(60, 60, 60);
        const labelLines = pdf.splitTextToSize(row[0], labelW - 4);
        pdf.text(labelLines[0], x + 2, y + 5.5);

        // Value
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(20, 20, 20);
        const valText = row[1] || '-';
        const valLines = pdf.splitTextToSize(valText, valW - 4);
        pdf.text(valLines[0], x + labelW + 2, y + 5.5);

        y += rowH;
    });

    // Outer border
    pdf.setDrawColor(...BLUE_ACCENT);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y - (rows.length * rowH), w, rows.length * rowH);

    // Divider line between label and value columns
    const divX = x + labelW;
    const tableTop = y - rows.length * rowH;
    pdf.line(divX, tableTop, divX, y);

    return y + 2;
}

// ===================== COVER PAGE =====================

function buildCoverPage(pdf, data) {
    const { siteAddress, testDate, engineerName, testKitRef, jobReference, siteStaffName, siteStaffSignature, standard } = data;

    // Top navy bar
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, PAGE_W, 10, 'F');

    // Company logo centred — use pre-loaded base64
    let logoY = 14;
    try {
        if (_logoBase64) {
            const logoH = addImageToPDF(pdf, _logoBase64, MARGIN, logoY, PAGE_W - MARGIN * 2, 50, true);
            logoY += logoH + 6;
        } else { logoY += 56; }
    } catch (e) { logoY += 56; }

    // Building image
    if (data.buildingImage) {
        try {
            const imgH = addImageToPDF(pdf, data.buildingImage, MARGIN, logoY, PAGE_W - MARGIN * 2, 65, true);
            logoY += imgH + 8;
        } catch (e) { logoY += 8; }
    }

    // Title card
    const cardX = MARGIN;
    const cardW = PAGE_W - MARGIN * 2;
    const cardH = 24;
    pdf.setFillColor(25, 45, 65);
    pdf.rect(cardX, logoY, cardW, cardH, 'F');

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIGHTNING PROTECTION', PAGE_W / 2, logoY + 9, { align: 'center' });

    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(230, 160, 40);
    pdf.text('TEST & INSPECTION REPORT', PAGE_W / 2, logoY + 18, { align: 'center' });
    logoY += cardH + 4;

    // Standard bar
    if (standard) {
        pdf.setFillColor(...BLUE_ACCENT);
        pdf.rect(cardX, logoY, cardW, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(standard, PAGE_W / 2, logoY + 5.5, { align: 'center' });
        logoY += 8 + 6;
    } else {
        logoY += 6;
    }

    // Info card
    const rowH = 16;
    const numRows = 4; // Job Ref/Date, Engineer/Kit, Site Staff/Sig, Site Address
    const infoH = siteStaffSignature ? (numRows * rowH) + 6 : (numRows * rowH) + 2;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, logoY, cardW, infoH, 'F');
    pdf.setDrawColor(...BLUE_ACCENT);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, logoY, cardW, infoH);

    // Vertical centre divider
    const divX = cardX + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, logoY + 1, divX, logoY + infoH - 1);

    const col1X = cardX + 5;
    const col2X = cardX + cardW / 2 + 5;
    const labelColor = [100, 130, 160];
    const valueColor = [20, 20, 20];

    function infoField(label, value, x, y) {
        pdf.setFontSize(6.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...labelColor);
        pdf.text(label.toUpperCase(), x, y + 3);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...valueColor);
        const lines = pdf.splitTextToSize(value || '-', (cardW / 2) - 10);
        pdf.text(lines[0], x, y + 10);
    }

    // Draw rows with dividers between them
    let iy = logoY;
    const rows = [
        [['Job Reference', jobReference], ['Date', formatDate(testDate)]],
        [['Engineer', engineerName],      ['Test Kit Ref', testKitRef]],
        [['Site Staff', siteStaffName],   siteStaffSignature ? null : ['', '']],
        [['Site Address', siteAddress],   ['', '']],
    ];

    rows.forEach((row, i) => {
        // Horizontal divider above each row (except first)
        if (i > 0) {
            pdf.setDrawColor(210, 225, 240);
            pdf.setLineWidth(0.3);
            pdf.line(cardX + 1, iy, cardX + cardW - 1, iy);
        }
        infoField(row[0][0], row[0][1], col1X, iy);
        if (row[1] && row[1][0]) infoField(row[1][0], row[1][1], col2X, iy);

        // Signature on row 2 right column
        if (i === 2 && siteStaffSignature) {
            pdf.setFontSize(6.5);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...labelColor);
            pdf.text('SITE STAFF SIGNATURE', col2X, iy + 3);
            try { pdf.addImage(siteStaffSignature, 'PNG', col2X, iy + 4, 50, 10); } catch(e) {}
        }
        iy += rowH;
    });

    // Footer
    addFooterToPage(pdf);
}

// ===================== INSPECTION SUMMARY =====================

function buildInspectionSummary(pdf, data, pageTitle) {
    let y = addPageHeader(pdf, pageTitle, 'BS EN 62305 | Test & Inspection');

    const { selectedFailures, generalComments, standard } = data;
    const hasFaults = selectedFailures && selectedFailures.length > 0;

    // Compliance Result label
    y += 4;
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Compliance Result', PAGE_W / 2, y, { align: 'center' });
    y += 5;

    // PASS/FAIL pill-sized banner
    const bannerLabel = hasFaults ? 'FAIL — Action Required' : 'PASS';
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    const labelW = pdf.getTextWidth(bannerLabel) + 18;
    const bannerH = 13;
    const bannerX = (PAGE_W - labelW) / 2;
    pdf.setFillColor(...(hasFaults ? [200, 40, 40] : [34, 139, 34]));
    pdf.rect(bannerX, y, labelW, bannerH, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(bannerLabel, PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    y += bannerH + 6;

    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(80, 80, 80);
    if (hasFaults) {
        pdf.text('Action is required for this system to comply with ' + (standard || 'the applicable standard') + '.', PAGE_W / 2, y, { align: 'center' });
    } else {
        pdf.text('This certificate is valid for 12 months from the date of issue.', PAGE_W / 2, y, { align: 'center' });
        if (generalComments) {
            y += 4;
            pdf.text('(with recommendations)', PAGE_W / 2, y, { align: 'center' });
        }
    }
    pdf.setTextColor(0, 0, 0);
    y += 6;

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(120, 120, 120);
    pdf.text('All tests are in accordance with BS EN 62305, BS6651, NF C 17-102:2011 and BS7430.', PAGE_W / 2, y, { align: 'center' });
    y += 3;
    pdf.text('Lightning protection systems should be tested annually under The Electricity At Work Act 1989.', PAGE_W / 2, y, { align: 'center' });
    y += 8;
    pdf.setTextColor(0, 0, 0);

    // Defects
    if (hasFaults) {
        y = drawSectionHeader(pdf, 'DEFECTS', MARGIN, y, PAGE_W - MARGIN * 2) + 3;

        let leftY = y, rightY = y;
        let col = 'left';
        let imagesOnPage = 0;

        selectedFailures.forEach((failure, idx) => {
            const x = col === 'left' ? COL_L : COL_R;
            let cy = col === 'left' ? leftY : rightY;

            const commentLines = failure.comment ? pdf.splitTextToSize('Comment: ' + failure.comment, COL_W) : [];
            const estimated = 30 + (commentLines.length * 4) + (failure.imageData ? 55 : 0);

            if (cy + estimated > PAGE_BOT) {
                pdf.addPage();
                addFooterToPage(pdf);
                y = addPageHeader(pdf, 'INSPECTION SUMMARY (CONTINUED)', 'BS EN 62305 | Test & Inspection');
                leftY = y; rightY = y; col = 'left'; imagesOnPage = 0;
                cy = y;
            }

            // Failure number + name
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(0, 0, 0);
            const titleLines = pdf.splitTextToSize(`${idx + 1}. ${failure.failure}`, COL_W);
            pdf.text(titleLines, x, cy);
            cy += titleLines.length * 4.5 + 2;

            // Reference
            pdf.setFontSize(7);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(100, 100, 100);
            const refLines = pdf.splitTextToSize('Ref: ' + failure.reference, COL_W);
            pdf.text(refLines, x, cy);
            cy += refLines.length * 3.5 + 2;

            // Requirement
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(...BLUE_ACCENT);
            const reqLines = pdf.splitTextToSize('Requirement: ' + failure.requirement, COL_W);
            pdf.text(reqLines, x, cy);
            cy += reqLines.length * 3.5 + 3;
            pdf.setTextColor(0, 0, 0);

            // Comment
            if (failure.comment) {
                pdf.setFont(undefined, 'normal');
                pdf.setFontSize(8);
                pdf.text(commentLines, x, cy);
                cy += commentLines.length * 4 + 3;
            }

            // Image
            if (failure.imageData && imagesOnPage < 6) {
                try {
                    const imgH = addImageToPDF(pdf, failure.imageData, x, cy, 60, 45);
                    cy += imgH + 3;
                    imagesOnPage++;
                } catch (e) { /* */ }
            }

            cy += 6;
            // Divider line between defects
            pdf.setDrawColor(220, 230, 240);
            pdf.setLineWidth(0.2);
            pdf.line(x, cy - 3, x + COL_W, cy - 3);
            pdf.setDrawColor(0, 0, 0);

            if (col === 'left') { leftY = cy; col = 'right'; }
            else { rightY = cy; col = 'left'; }
        });

        y = Math.max(leftY, rightY) + 4;
    } else {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(34, 139, 34);
        pdf.text('No faults identified during this inspection.', PAGE_W / 2, y, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        y += 12;
    }

    // Recommendations
    if (generalComments) {
        if (y + 30 > PAGE_BOT) {
            pdf.addPage();
            addFooterToPage(pdf);
            y = addPageHeader(pdf, 'INSPECTION SUMMARY (CONTINUED)', 'BS EN 62305 | Test & Inspection');
        }
        y = drawSectionHeader(pdf, 'RECOMMENDATIONS', MARGIN, y, PAGE_W - MARGIN * 2) + 3;
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(generalComments, PAGE_W - MARGIN * 2);
        pdf.text(lines, MARGIN, y);
        y += lines.length * 4.5 + 6;
    }

    return y;
}

// ===================== STRUCTURE & SYSTEM DETAILS =====================

function buildStructureSystemDetails(pdf, data) {
    let y = newPage(pdf, 'STRUCTURE & SYSTEM DETAILS', 'BS EN 62305 | Test & Inspection');

    const {
        structureHeight, structurePerimeter, structureUse, structureOccupancy,
        structureAge, previousInspections, systemDetails,
        earthArrangement, mainEquipotentialBond, surgeInstalled, surgeType, surgeSafe,
        generalComments
    } = data;

    const sd = systemDetails || {};
    const joinVal = (arr) => (arr && arr.length > 0) ? arr.join(', ') : '-';

    const halfW = (PAGE_W - MARGIN * 2 - 4) / 2;
    const leftX = MARGIN;
    const rightX = MARGIN + halfW + 4;

    // --- STRUCTURE DETAILS (left) ---
    let ly = drawSectionHeader(pdf, 'STRUCTURE DETAILS', leftX, y, halfW) + 1;
    ly = drawTable(pdf, [
        ['Ground Type',           joinVal(sd.groundType)],
        ['Boundary Type',         joinVal(sd.boundaryType)],
        ['Roof Type',             joinVal(sd.roofType)],
        ['Roof Layout',           joinVal(sd.roofLayout)],
        ['Structure Use',         structureUse || '-'],
        ['Max Occupancy',         structureOccupancy ? structureOccupancy + ' people' : '-'],
        ['Age of Structure',      structureAge ? structureAge + ' years' : '-'],
        ['Height',                structureHeight ? structureHeight + ' m' : '-'],
        ['Perimeter',             structurePerimeter ? structurePerimeter + ' m' : '-'],
        ['Previous Inspections',  previousInspections || '-'],
    ], leftX, ly, halfW);

    // --- SYSTEM DETAILS (right) ---
    let ry = drawSectionHeader(pdf, 'SYSTEM DETAILS', rightX, y, halfW) + 1;
    ry = drawTable(pdf, [
        ['Air Termination',       joinVal(sd.airTermination)],
        ['AT Conductors & Fixings', joinVal(sd.airConductors)],
        ['Down Conductor Network', joinVal(sd.downConductorNetwork)],
        ['DC Conductors & Fixings', joinVal(sd.downConductors)],
        ['Earth Termination',     joinVal(sd.earthTermination)],
        ['Earth Arrangement',     earthArrangement || '-'],
        ['Main Equipotential Bond', mainEquipotentialBond || '-'],
        ['Surge Protection',      surgeInstalled || '-'],
        ['SPD Type',              surgeType || '-'],
        ['SPD Status',            surgeSafe || '-'],
    ], rightX, ry, halfW);

    // Tables sit side by side — no general comments section here
    y = Math.max(ly, ry) + 4;
}

// ===================== EARTH RESISTANCE TESTING =====================

function buildEarthResistance(pdf, data) {
    let y = newPage(pdf, 'EARTH RESISTANCE TESTING', 'BS EN 62305 | Test & Inspection');

    const { earthData: ed, partOfLargerSystem, finalComments } = data;
    const suffix = partOfLargerSystem ? ' — Part of a larger system' : '';

    if (!ed || !ed.earthData || !ed.earthData.length) {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        pdf.text('No earth resistance testing performed.', PAGE_W / 2, y, { align: 'center' });
        y += 12;
    } else {
        const overall = ed.overallResistance;

        // Overall resistance summary box
        if (overall > 0) {
            const boxH = 14;
            const pass = overall <= 10;
            pdf.setFillColor(...(pass ? [34, 139, 34] : [200, 40, 40]));
            pdf.rect(MARGIN, y, PAGE_W - MARGIN * 2, boxH, 'F');
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            const overallLabel = `Overall System Resistance: ${overall.toFixed(3)} ohms  --  ${pass ? 'BELOW 10 ohms' : 'EXCEEDS 10 ohms'}${suffix}`;
            const overallLines = pdf.splitTextToSize(overallLabel, PAGE_W - MARGIN * 2 - 6);
            const lineH = 4.5;
            const textY = y + (boxH / 2) - ((overallLines.length - 1) * lineH / 2);
            pdf.text(overallLines, PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
            pdf.setTextColor(0, 0, 0);
            y += boxH + 6;
        }

        // Earth table
        y = renderEarthTable(pdf, ed.earthData, y);
    }

    // Final comments
    if (finalComments) {
        if (y + 30 > PAGE_BOT) {
            pdf.addPage();
            addFooterToPage(pdf);
            y = addPageHeader(pdf, 'EARTH RESISTANCE TESTING (CONTINUED)', 'BS EN 62305 | Test & Inspection');
        }
        y = drawSectionHeader(pdf, 'GENERAL COMMENTS', MARGIN, y, PAGE_W - MARGIN * 2) + 3;
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(finalComments, PAGE_W - MARGIN * 2);
        pdf.text(lines, MARGIN, y);
    }
}

function renderEarthTable(pdf, rows, y) {
    const leftMargin  = MARGIN;
    const tableWidth  = PAGE_W - MARGIN * 2;
    const colWidths   = [10, 18, 22, 18, 22, 22, 22, 36]; // sum = 170
    const headers     = ['E', 'Ohms', 'Test Clamp', 'Pit', 'Test Type', 'Ground', 'Earth Type', 'Comment'];
    const rowH        = 8;
    const headerH     = 10;
    const rowsPerPage = 18;
    let rowsOnPage    = 0;
    let tableStartY   = y;

    function drawHeader(yy) {
        pdf.setFillColor(...BLUE_ACCENT);
        pdf.rect(leftMargin, yy, tableWidth, headerH, 'F');
        pdf.setFontSize(7.5);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 255, 255);
        let cx = leftMargin;
        headers.forEach((h, i) => {
            pdf.text(h, cx + colWidths[i] / 2, yy + 7, { align: 'center' });
            cx += colWidths[i];
        });
        pdf.setTextColor(0, 0, 0);
        return yy + headerH;
    }

    function drawBorder(startY, endY) {
        pdf.setDrawColor(...BLUE_ACCENT);
        pdf.setLineWidth(0.4);
        pdf.rect(leftMargin, startY, tableWidth, endY - startY);
    }

    // Kick off with header
    if (y + headerH + rowH * 3 > PAGE_BOT) {
        pdf.addPage();
        addFooterToPage(pdf);
        y = addPageHeader(pdf, 'EARTH RESISTANCE TESTING', 'BS EN 62305 | Test & Inspection');
    }
    tableStartY = y;
    y = drawHeader(y);

    rows.forEach((earth, idx) => {
        if (rowsOnPage >= rowsPerPage) {
            drawBorder(tableStartY, y);
            pdf.addPage();
            addFooterToPage(pdf);
            y = addPageHeader(pdf, 'EARTH RESISTANCE TESTING (CONTINUED)', 'BS EN 62305 | Test & Inspection');
            tableStartY = y;
            y = drawHeader(y);
            rowsOnPage = 0;
        }

        // Alternating row fill
        if (idx % 2 === 0) {
            pdf.setFillColor(240, 246, 252);
            pdf.rect(leftMargin, y, tableWidth, rowH, 'F');
        }

        const rawR = earth.resistance;
        const displayR = rawR > 0 ? (Number.isInteger(rawR) ? String(rawR) : parseFloat(rawR.toPrecision(6)).toString()) : '-';
        const rowData = [
            `E${earth.earthNumber}`,
            displayR,
            earth.testClamp || '-',
            earth.pitType || '-',
            earth.testType || '-',
            earth.groundType || '-',
            earth.earthType || '-',
            earth.comment || '-'
        ];

        pdf.setFontSize(7.5);
        pdf.setFont(undefined, 'normal');
        let cx = leftMargin;
        rowData.forEach((val, ci) => {
            const text = pdf.splitTextToSize(val, colWidths[ci] - 3);
            pdf.text(text[0], cx + colWidths[ci] / 2, y + 5.5, { align: 'center' });
            cx += colWidths[ci];
        });

        y += rowH;
        rowsOnPage++;
    });

    drawBorder(tableStartY, y);
    return y + 10;
}

// ===================== INSPECTION IMAGES =====================

function buildInspectionImages(pdf, images) {
    if (!images || !images.length) return;

    let y = newPage(pdf, 'INSPECTION IMAGES', 'BS EN 62305 | Test & Inspection');

    const imgW = 82;
    const imgH = 60;
    const gap  = 6;
    let count  = 0;

    images.forEach((imgData, i) => {
        if (!imgData) return;

        if (count > 0 && count % 6 === 0) {
            pdf.addPage();
            addFooterToPage(pdf);
            y = addPageHeader(pdf, 'INSPECTION IMAGES (CONTINUED)', 'BS EN 62305 | Test & Inspection');
        }

        const row = Math.floor(count % 6 / 2);
        const col = count % 2;
        const x = col === 0 ? COL_L : COL_R;
        const iy = y + row * (imgH + gap);

        try {
            addImageToPDF(pdf, imgData, x, iy, imgW, imgH);
        } catch (e) { /* */ }

        count++;
    });
}

// ===================== MAIN PDF GENERATOR =====================

/**
 * Pre-load an image URL as base64 data URI for use in jsPDF.
 * keepTransparency=true uses RGBA canvas (for footer logos on dark bg).
 * keepTransparency=false fills white behind the image (for logos on white bg).
 */
function loadImageAsBase64(url, keepTransparency = false) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!keepTransparency) {
                // White background so transparent PNGs don't go black in PDF
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

// Module-level cache for pre-loaded images
let _logoBase64   = null;
let _footerBase64 = null;

async function generatePDF() {
    // Rebuild system details from DOM to catch any missed selections
    rebuildSystemDetailsFromDOM();

    // Pre-load static images as base64 so jsPDF can embed them
    // Logo: white background (transparent PNG would go black in jsPDF)
    // Footer: keep transparency so logos sit on navy bar
    if (!_logoBase64)   _logoBase64   = await loadImageAsBase64(COMPANY_LOGO_URL, false);
    if (!_footerBase64) _footerBase64 = await loadImageAsBase64(FOOTER_IMAGE_URL, true);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // --- Collect all form data ---
    const siteAddress        = document.getElementById('siteAddress')?.value || '';
    const testDate           = document.getElementById('testDate')?.value || '';
    const engineerName       = document.getElementById('engineerName')?.value || '';
    const testKitRef         = document.getElementById('testKitRef')?.value || '';
    const jobReference       = document.getElementById('jobReference')?.value || '';
    const siteStaffName      = document.getElementById('siteStaffName')?.value || '';
    const siteStaffSignature = window.siteStaffSignature?.signatureData || null;
    const standard           = document.getElementById('standard')?.value || '';
    const generalComments    = document.getElementById('generalComments')?.value || '';
    const finalComments      = document.getElementById('finalComments')?.value || '';
    const structureHeight    = document.getElementById('structureHeight')?.value || '';
    const structurePerimeter = document.getElementById('structurePerimeter')?.value || '';
    const structureUse       = document.getElementById('structureUse')?.value || '';
    const structureOccupancy = document.getElementById('structureOccupancy')?.value || '';
    const structureAge       = document.getElementById('structureAge')?.value || '';
    const previousInspections= document.getElementById('previousInspections')?.value || '';
    const earthArrangement   = document.getElementById('earthArrangement')?.value || '';
    const mainEquipotentialBond = document.getElementById('mainEquipotentialBond')?.value || '';
    const surgeInstalled     = document.getElementById('surgeInstalled')?.value || '';
    const surgeType          = document.getElementById('surgeType')?.value || '';
    const surgeSafe          = document.getElementById('surgeSafe')?.value || '';
    const partOfLargerSystem = document.getElementById('partOfLargerSystem')?.checked || false;
    const buildingImage      = uploadedImages['buildingImagePreview_data'] || null;
    const earthImages        = uploadedImages['earthImagesPreview_data'] || [];
    const earthData          = getEarthTableData();

    const coverData = {
        siteAddress, testDate, engineerName, testKitRef, jobReference,
        siteStaffName, siteStaffSignature, standard, buildingImage
    };

    const summaryData = {
        selectedFailures: selectedFailuresList,
        generalComments,
        standard
    };

    const structData = {
        structureHeight, structurePerimeter, structureUse, structureOccupancy,
        structureAge, previousInspections,
        systemDetails: window.systemDetails,
        earthArrangement, mainEquipotentialBond, surgeInstalled, surgeType, surgeSafe
    };

    const earthResData = {
        earthData,
        partOfLargerSystem,
        finalComments
    };

    // --- Build PDF pages ---
    // Page 1: Cover
    buildCoverPage(pdf, coverData);

    // Page 2+: Inspection Summary
    pdf.addPage();
    addFooterToPage(pdf);
    buildInspectionSummary(pdf, summaryData, 'INSPECTION SUMMARY');

    // Structure & System Details
    buildStructureSystemDetails(pdf, structData);

    // Earth Resistance Testing
    buildEarthResistance(pdf, earthResData);

    // Inspection Images
    const allImages = Array.isArray(earthImages) ? earthImages : (earthImages ? [earthImages] : []);
    if (allImages.length > 0) {
        buildInspectionImages(pdf, allImages);
    }

    // --- Filename: Lightning Protection T&I Report - [JobRef] [dd-mm-yy].pdf ---
    const datePart = formatDateShort(testDate);
    const refPart = jobReference ? jobReference.replace(/[^a-zA-Z0-9 \-_]/g, '').trim() : 'Report';
    const filename = `Lightning Protection T&I Report - ${refPart} ${datePart}.pdf`;

    pdf.save(filename);
}
