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
const PAGE_BOT = 262; // above footer image zone

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
 * Draw the inner page header: full-width navy bar with logo right, title centred.
 * Returns Y position after header.
 */
function addPageHeader(pdf, title, subtitle) {
    const barH = 18;
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, PAGE_W, barH, 'F');

    // Logo on right — preloaded via fetch() as base64, no canvas so transparency preserved
    try {
        if (window._logoBase64) addImageToPDF(pdf, window._logoBase64, PAGE_W - 32, 1, 30, 16, false);
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

    // Footer logos — preloaded via fetch() as base64
    try {
        if (window._footerBase64) addImageToPDF(pdf, window._footerBase64, PAGE_W/2 - 36, 259, 72, 18, false);
    } catch (e) { /* */ }

    // Footer text — centred vertically in the navy bar
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(160, 190, 210);
    const lines = pdf.splitTextToSize(COMPANY_FOOTER, 180);
    const lineH = 3.5;
    const textBlockH = lines.length * lineH;
    const textY = barY + (barH / 2) - (textBlockH / 2) + lineH;
    pdf.text(lines, PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
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
    const h = 9;
    pdf.setFillColor(...BLUE_ACCENT);
    pdf.rect(x, y, w, h, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(label, x + 3, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + h;
}

/**
 * Draw a bordered table of label/value rows.
 * Returns Y after table.
 */
function drawTable(pdf, rows, x, y, w) {
    const minRowH = 11;
    const lineH   = 5;
    const labelW  = w * 0.44;
    const valW    = w - labelW;
    const tableStartY = y;

    // Pre-calculate each row height based on wrapped content
    const rowMeta = rows.map(row => {
        pdf.setFontSize(8.5);
        const labelLines = pdf.splitTextToSize(row[0], labelW - 4);
        const valLines   = pdf.splitTextToSize(row[1] || '-', valW - 4);
        const numLines   = Math.max(labelLines.length, valLines.length);
        const rowH       = Math.max(minRowH, numLines * lineH + 4);
        return { labelLines, valLines, rowH };
    });

    rowMeta.forEach((meta, i) => {
        const { labelLines, valLines, rowH } = meta;
        const bg = i % 2 === 0 ? [255, 255, 255] : [244, 248, 252];
        pdf.setFillColor(...bg);
        pdf.rect(x, y, w, rowH, 'F');

        const textY = y + lineH + 1;

        // Label
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text(labelLines, x + 2, textY, { lineHeightFactor: 1.3 });

        // Value
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(20, 20, 20);
        pdf.text(valLines, x + labelW + 2, textY, { lineHeightFactor: 1.3 });

        y += rowH;
    });

    // Outer border
    pdf.setDrawColor(...BLUE_ACCENT);
    pdf.setLineWidth(0.3);
    pdf.rect(x, tableStartY, w, y - tableStartY);

    // Divider line between label and value columns
    pdf.line(x + labelW, tableStartY, x + labelW, y);

    return y + 2;
}


// ===================== COVER PAGE =====================

function buildCoverPage(pdf, data) {
    const { siteAddress, testDate, engineerName, testKitRef, jobReference, siteStaffName, siteStaffSignature, standard } = data;

    // Top navy bar
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, PAGE_W, 10, 'F');

    // Company logo centred — preloaded via fetch() as base64
    let logoY = 14;
    try {
        if (window._logoBase64) {
            const logoH = addImageToPDF(pdf, window._logoBase64, MARGIN, logoY, PAGE_W - MARGIN * 2, 50, true);
            logoY += logoH + 6;
        } else { logoY += 56; }
    } catch (e) { logoY += 56; }

    // Building image
    if (data.buildingImage) {
        try {
            const imgH = addImageToPDF(pdf, data.buildingImage, MARGIN, logoY, PAGE_W - MARGIN * 2, 65, true);
            logoY += imgH + 6;
        } catch (e) { logoY += 6; }
    }

    // Job Reference + Address block
    const cardX = MARGIN;
    const cardW = PAGE_W - MARGIN * 2;
    const addrBlock = siteAddress ? pdf.splitTextToSize(siteAddress, cardW - 10) : [];

    logoY += 4;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...NAVY);
    pdf.text(jobReference || '-', PAGE_W / 2, logoY + 6, { align: 'center' });
    logoY += 10;

    if (addrBlock.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrBlock, PAGE_W / 2, logoY, { align: 'center', lineHeightFactor: 1.5 });
        logoY += addrBlock.length * 5;
    }
    logoY += 6;

    // Title card
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
    logoY += cardH + 6;

    // Info card — 3 rows: Site Name/Date, Engineer/Kit Ref, Site Staff/Signature
    const rowH = 18;
    const infoH = rowH * 3;

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
    const colW  = cardW / 2 - 10;
    const labelColor = [100, 130, 160];
    const valueColor = [20, 20, 20];

    function infoField(label, value, x, fy) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...labelColor);
        pdf.text(label.toUpperCase(), x, fy + 4);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...valueColor);
        const lines = pdf.splitTextToSize(value || '-', colW);
        pdf.text(lines[0], x, fy + 12);
    }

    const tableRows = [
        [['Site Name',  jobReference], ['Date', formatDate(testDate)]],
        [['Engineer',   engineerName], ['Test Kit Ref', testKitRef]],
        [['Site Staff', siteStaffName], null],
    ];

    let iy = logoY;
    tableRows.forEach((row, i) => {
        if (i > 0) {
            pdf.setDrawColor(210, 225, 240);
            pdf.setLineWidth(0.3);
            pdf.line(cardX + 1, iy, cardX + cardW - 1, iy);
        }
        infoField(row[0][0], row[0][1], col1X, iy);

        // Right column: signature on row 2, otherwise standard field
        if (i === 2) {
            pdf.setFontSize(7);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...labelColor);
            pdf.text('SITE STAFF SIGNATURE', col2X, iy + 4);
            if (siteStaffSignature) {
                try { pdf.addImage(siteStaffSignature, 'PNG', col2X, iy + 5, 50, 11); } catch(e) {}
            }
        } else {
            infoField(row[1][0], row[1][1], col2X, iy);
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

    // Compliance Result label — much bigger
    y += 4;
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Compliance Certification Result', PAGE_W / 2, y, { align: 'center' });
    y += 8;

    // PASS/FAIL — bigger text, tight pill (small padding)
    const bannerLabel = hasFaults ? 'FAIL — Action Required' : 'PASS';
    pdf.setFontSize(26);
    pdf.setFont(undefined, 'bold');
    const labelW = pdf.getTextWidth(bannerLabel) + 10;
    const bannerH = 14;
    const bannerX = (PAGE_W - labelW) / 2;
    pdf.setFillColor(...(hasFaults ? [200, 40, 40] : [34, 139, 34]));
    pdf.rect(bannerX, y, labelW, bannerH, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(bannerLabel, PAGE_W / 2, y + 10.5, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    y += bannerH + 7;

    // Standard Applied — slightly bigger than lines below
    if (standard) {
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(40, 40, 40);
        pdf.text('Standard Applied: ' + standard, PAGE_W / 2, y, { align: 'center' });
        y += 8;
    }

    // Certificate validity / action required line — 11pt (same as Standard Applied was)
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(80, 80, 80);
    if (hasFaults) {
        pdf.text('Action is required for this system to comply with ' + (standard || 'the applicable standard') + '.', PAGE_W / 2, y, { align: 'center' });
    } else {
        pdf.text('This certificate is valid for 12 months from the date of issue.', PAGE_W / 2, y, { align: 'center' });
        if (generalComments) {
            y += 7;
            pdf.text('(with recommendations)', PAGE_W / 2, y, { align: 'center' });
        }
    }
    pdf.setTextColor(0, 0, 0);
    y += 9;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(120, 120, 120);
    pdf.text('All tests are in accordance with BS EN 62305, BS6651, NF C 17-102:2011 and BS7430.', PAGE_W / 2, y, { align: 'center' });
    y += 6;
    pdf.text('Lightning protection systems should be tested annually under The Electricity At Work Act 1989.', PAGE_W / 2, y, { align: 'center' });
    y += 12;
    pdf.setTextColor(0, 0, 0);

    // Defects — header always shown
    y = drawSectionHeader(pdf, 'DEFECTS', MARGIN, y, PAGE_W - MARGIN * 2) + 3;

    if (hasFaults) {
        const rowW     = PAGE_W - MARGIN * 2;
        const imgW     = 65;
        const imgH     = 50;
        const dataW    = rowW - imgW - 6;
        const dataX    = MARGIN;
        const imgX     = MARGIN + dataW + 6;

        selectedFailures.forEach((failure, idx) => {

            // Pre-calculate text lines to estimate row height
            pdf.setFontSize(9);
            const titleLines = pdf.splitTextToSize(`${idx + 1}. ${failure.failure}`, dataW);
            pdf.setFontSize(7);
            const refLines = pdf.splitTextToSize('Ref: ' + (failure.reference || ''), dataW);
            pdf.setFontSize(8);
            const reqLines = pdf.splitTextToSize('Requirement: ' + (failure.requirement || ''), dataW);
            const commentLines = failure.comment ? pdf.splitTextToSize('Comment: ' + failure.comment, dataW) : [];

            const textH = (titleLines.length * 5)
                        + (refLines.length * 4)
                        + (reqLines.length * 4)
                        + (commentLines.length * 4)
                        + 14;
            const rowH = failure.imageData ? Math.max(textH, imgH + 4) : textH;

            // New page if row won't fit
            if (y + rowH > PAGE_BOT) {
                pdf.addPage();
                addFooterToPage(pdf);
                y = addPageHeader(pdf, 'INSPECTION SUMMARY (CONTINUED)', 'BS EN 62305 | Test & Inspection');
                y = drawSectionHeader(pdf, 'DEFECTS (CONTINUED)', MARGIN, y, PAGE_W - MARGIN * 2) + 3;
            }

            // Light background for row
            pdf.setFillColor(248, 250, 253);
            pdf.rect(MARGIN, y, rowW, rowH, 'F');
            pdf.setDrawColor(220, 230, 240);
            pdf.setLineWidth(0.2);
            pdf.rect(MARGIN, y, rowW, rowH);

            // --- Data (left) ---
            let dy = y + 5;

            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(titleLines, dataX + 2, dy);
            dy += titleLines.length * 5 + 2;

            pdf.setFontSize(7);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text(refLines, dataX + 2, dy);
            dy += refLines.length * 4 + 2;

            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...BLUE_ACCENT);
            pdf.text(reqLines, dataX + 2, dy);
            dy += reqLines.length * 4 + 2;
            pdf.setTextColor(0, 0, 0);

            if (failure.comment) {
                pdf.setFont(undefined, 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(60, 60, 60);
                pdf.text(commentLines, dataX + 2, dy);
            }

            // --- Image (right) ---
            if (failure.imageData) {
                try {
                    addImageToPDF(pdf, failure.imageData, imgX, y + 2, imgW, imgH, false);
                } catch (e) { /* */ }
            }

            y += rowH + 3;
        });

        y += 4;
    } else {
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(34, 139, 34);
        pdf.text('No faults identified during this inspection.', PAGE_W / 2, y + 6, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        y += 16;
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

        // Overall resistance — plain text, reading in bold red/green
        if (overall > 0) {
            const pass = overall <= 10;
            const readingStr = overall.toFixed(2);

            // "Overall System Resistance: " in normal black
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
            const labelStr = 'Overall System Resistance: ';
            const labelW = pdf.getTextWidth(labelStr);
            const lineX = (PAGE_W - labelW - pdf.getStringUnitWidth(readingStr) * 11 / pdf.internal.scaleFactor) / 2;
            pdf.text(labelStr, PAGE_W / 2, y + 6, { align: 'right' });

            // Reading in bold red or green
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...(pass ? [34, 139, 34] : [200, 40, 40]));
            pdf.text(readingStr + ' ohms' + (suffix ? '  ' + suffix : ''), PAGE_W / 2, y + 6, { align: 'left' });

            pdf.setTextColor(0, 0, 0);
            y += 14;
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
    const rowsPerPage = 25;
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

// Module-level cache no longer needed — using URL strings directly like pdf-generator-shared.js

async function generatePDF() {
    // Rebuild system details from DOM to catch any missed selections
    rebuildSystemDetailsFromDOM();

    // Images loaded directly from URL by jsPDF (same pattern as pdf-generator-shared.js)

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
