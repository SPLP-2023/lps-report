// =============================================================================
// sd-pdf.js — Separation Distance Calculator PDF Generator
// Follows exact T&I / Remedial pattern:
//   - window._logoBase64 / window._footerBase64 preloaded by HTML page
//   - Navy header bar + footer bar on every inner page
//   - Cover: larger logo (no building image), site info card, title card
//   - One calculation block per entry
// BS EN 62305-3 (Cl. 6.3) — formula: s = (ki / km) × kc × l
// =============================================================================

const SD_NAVY        = [13, 27, 42];
const SD_BLUE        = [8, 119, 195];
const SD_AMBER       = [230, 160, 40];
const SD_GREEN       = [34, 139, 34];
const SD_RED         = [200, 40, 40];
const SD_PAGE_W      = 210;
const SD_PAGE_H      = 297;
const SD_MARGIN      = 14;
const SD_PAGE_BOT    = 262;
const SD_FOOTER_TEXT = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852, Registered in England and Wales  |  info@strikepoint.uk  |  Tel: 01159903220';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sdSafe(str) {
    return (str || '').replace(/[^\x20-\x7E]/g, '');
}

function sdFormatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}/${m}/${y}` : '-';
}

function sdFormatDateShort(dateStr) {
    if (!dateStr) return 'undated';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}-${m}-${y.slice(2)}` : 'undated';
}

function sdAddImage(pdf, imageData, x, y, maxW, maxH, centre) {
    if (!imageData) return 0;
    try {
        const fmt   = (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) ? 'JPEG' : 'PNG';
        const props = pdf.getImageProperties(imageData);
        const ar    = props.width / props.height;
        let fw, fh;
        if (ar > maxW / maxH) { fw = maxW; fh = maxW / ar; }
        else                  { fh = maxH; fw = maxH * ar; }
        const fx = centre ? x + (maxW - fw) / 2 : x;
        pdf.addImage(imageData, fmt, fx, y, fw, fh);
        return fh;
    } catch(e) {
        console.error('sdAddImage error:', e);
        return 0;
    }
}

// ── Page header (navy bar, logo right, title centred) ────────────────────────

function sdAddHeader(pdf, title, subtitle) {
    const barH = 18;
    pdf.setFillColor(...SD_NAVY);
    pdf.rect(0, 0, SD_PAGE_W, barH, 'F');
    try {
        if (window._logoBase64) sdAddImage(pdf, window._logoBase64, SD_PAGE_W - 32, 1, 30, 16, false);
    } catch(e) {}
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, SD_PAGE_W / 2, 11, { align: 'center' });
    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 235);
        pdf.text(sdSafe(subtitle), SD_PAGE_W / 2, 16, { align: 'center' });
    }
    pdf.setTextColor(0, 0, 0);
    return barH + 6;
}

// ── Page footer (navy bar, footer logos, company text) ───────────────────────

function sdAddFooter(pdf) {
    const barH = 16;
    const barY = SD_PAGE_H - barH;
    pdf.setFillColor(...SD_NAVY);
    pdf.rect(0, barY, SD_PAGE_W, barH, 'F');
    try {
        if (window._footerBase64) sdAddImage(pdf, window._footerBase64, SD_PAGE_W / 2 - 36, 259, 72, 18, false);
    } catch(e) {}
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(160, 190, 210);
    const lines   = pdf.splitTextToSize(SD_FOOTER_TEXT, 180);
    const lineH   = 3.5;
    const blockH  = lines.length * lineH;
    const textY   = barY + (barH / 2) - (blockH / 2) + lineH;
    pdf.text(lines, SD_PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
    pdf.setTextColor(0, 0, 0);
}

// ── New page helper ──────────────────────────────────────────────────────────

function sdNewPage(pdf, title, subtitle) {
    pdf.addPage();
    sdAddFooter(pdf);
    return sdAddHeader(pdf, title, subtitle);
}

// ── Section header bar (blue) ────────────────────────────────────────────────

function sdSectionBar(pdf, label, x, y, w) {
    pdf.setFillColor(...SD_BLUE);
    pdf.rect(x, y, w, 9, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(sdSafe(label.toUpperCase()), x + 4, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + 9;
}

// ── Two-column info field helper ─────────────────────────────────────────────

function sdInfoField(pdf, label, value, x, y, colW, labelColor, valueColor) {
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...labelColor);
    pdf.text(label.toUpperCase(), x, y + 4);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...valueColor);
    const lines = pdf.splitTextToSize(sdSafe(value) || '-', colW);
    pdf.text(lines[0], x, y + 12);
}

// ── COVER PAGE ───────────────────────────────────────────────────────────────

function sdBuildCoverPage(pdf, data) {
    const { siteName, siteAddress, calcDate, engineerName } = data;

    // Thin top navy bar
    pdf.setFillColor(...SD_NAVY);
    pdf.rect(0, 0, SD_PAGE_W, 10, 'F');

    // Logo — larger than other reports to fill space left by absent building image
    // maxH = 80 (vs 50 in T&I) — centred
    let y = 14;
    try {
        if (window._logoBase64) {
            const logoH = sdAddImage(pdf, window._logoBase64, SD_MARGIN, y, SD_PAGE_W - SD_MARGIN * 2, 80, true);
            y += logoH + 10;
        } else {
            y += 90;
        }
    } catch(e) { y += 90; }

    const cardX = SD_MARGIN;
    const cardW = SD_PAGE_W - SD_MARGIN * 2;

    // Site name
    y += 4;
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SD_NAVY);
    pdf.text(sdSafe(siteName || '-'), SD_PAGE_W / 2, y + 6, { align: 'center' });
    y += 12;

    // Site address
    if (siteAddress) {
        const addrLines = pdf.splitTextToSize(sdSafe(siteAddress), cardW - 10);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrLines, SD_PAGE_W / 2, y, { align: 'center', lineHeightFactor: 1.5 });
        y += addrLines.length * 6;
    }
    y += 8;

    // Title card
    const titleCardH = 24;
    pdf.setFillColor(25, 45, 65);
    pdf.rect(cardX, y, cardW, titleCardH, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIGHTNING PROTECTION', SD_PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SD_AMBER);
    pdf.text('SEPARATION DISTANCE CALCULATION', SD_PAGE_W / 2, y + 18, { align: 'center' });
    y += titleCardH + 6;

    // Standard badge
    const badgeW = 130;
    const badgeX = (SD_PAGE_W - badgeW) / 2;
    pdf.setFillColor(240, 246, 252);
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(badgeX, y, badgeW, 9, 'FD');
    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...SD_BLUE);
    pdf.text('BS EN IEC 62305-3  |  Clause 6.3', SD_PAGE_W / 2, y + 6.2, { align: 'center' });
    y += 9 + 6;

    // Info card — Date / Engineer
    const rowH  = 18;
    const infoH = rowH * 2;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, y, cardW, infoH, 'F');
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, y, cardW, infoH);

    // Centre divider
    const divX = cardX + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, y + 1, divX, y + infoH - 1);

    // Mid row divider
    pdf.line(cardX + 1, y + rowH, cardX + cardW - 1, y + rowH);

    const col1X     = cardX + 5;
    const col2X     = cardX + cardW / 2 + 5;
    const colW      = cardW / 2 - 10;
    const labelCol  = [100, 130, 160];
    const valueCol  = [20, 20, 20];

    sdInfoField(pdf, 'Date',     sdFormatDate(calcDate), col1X, y,          colW, labelCol, valueCol);
    sdInfoField(pdf, 'Engineer', engineerName,            col2X, y,          colW, labelCol, valueCol);
    sdInfoField(pdf, 'Standard', 'BS EN IEC 62305-3',    col1X, y + rowH,   colW, labelCol, valueCol);
    sdInfoField(pdf, 'Clause',   '6.3 — Electrical Insulation of External LPS', col2X, y + rowH, colW, labelCol, valueCol);

    sdAddFooter(pdf);
}

// ── CALCULATIONS PAGE(S) ─────────────────────────────────────────────────────

function sdBuildCalculations(pdf, calculations) {
    const subtitle = 'BS EN IEC 62305-3 | Separation Distance Calculator';
    let y = sdNewPage(pdf, 'SEPARATION DISTANCE CALCULATIONS', subtitle);

    const cw = SD_PAGE_W - SD_MARGIN * 2;  // content width

    calculations.forEach((calc, idx) => {
        // Estimate height this block needs (title bar + rows + result bar + gap)
        const rowH       = 8;
        const numRows    = 7; // fixed number of data rows
        const blockH     = 9 + (numRows * rowH) + 14 + 8; // sectionBar + rows + result + gap

        if (y + blockH > SD_PAGE_BOT) {
            y = sdNewPage(pdf, 'SEPARATION DISTANCE CALCULATIONS (CONTINUED)', subtitle);
        }

        // Section bar: "Calculation N — description"
        const label = `Calculation ${calc.index}${calc.desc ? ' — ' + calc.desc : ''}`;
        y = sdSectionBar(pdf, label, SD_MARGIN, y, cw);

        // Data rows
        const rows = [
            ['LPS Class',              calc.lpsClassLabel || '-'],
            ['Insulation Material',    calc.materialLabel || '-'],
            ['Approach',               calc.approachLabel || '-'],
            ['kc Source',              calc.kcSource || '-'],
            ['ki (LPS class factor)',  calc.ki != null ? calc.ki.toFixed(2) : '-'],
            ['km (material factor)',   calc.km != null ? calc.km.toFixed(1) : '-'],
            ['kc (current partition)', calc.kc != null ? calc.kc.toFixed(2) : '-'],
        ];

        const labelW = cw * 0.5;
        const valW   = cw - labelW;

        rows.forEach((row, i) => {
            const bg = i % 2 === 0 ? [255, 255, 255] : [244, 248, 252];
            pdf.setFillColor(...bg);
            pdf.rect(SD_MARGIN, y, cw, rowH, 'F');

            pdf.setFontSize(8.5);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(60, 60, 60);
            pdf.text(sdSafe(row[0]), SD_MARGIN + 3, y + 5.5);

            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(20, 20, 20);
            pdf.text(sdSafe(row[1]), SD_MARGIN + labelW + 3, y + 5.5);

            y += rowH;
        });

        // Length row — highlighted slightly
        pdf.setFillColor(240, 246, 252);
        pdf.rect(SD_MARGIN, y, cw, rowH, 'F');
        pdf.setFontSize(8.5);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Length l (along conductor to nearest bond point)', SD_MARGIN + 3, y + 5.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(20, 20, 20);
        pdf.text(calc.l != null ? `${calc.l.toFixed(1)} m` : '-', SD_MARGIN + labelW + 3, y + 5.5);
        y += rowH;

        // Outer border around all rows
        pdf.setDrawColor(...SD_BLUE);
        pdf.setLineWidth(0.3);
        pdf.rect(SD_MARGIN, y - (rowH * (numRows + 1)), cw, rowH * (numRows + 1));
        // Divider between label and value columns
        pdf.line(SD_MARGIN + labelW, y - (rowH * (numRows + 1)), SD_MARGIN + labelW, y);

        y += 3;

        // Formula line
        if (calc.ki != null && calc.km != null && calc.kc != null && calc.l != null) {
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(80, 80, 80);
            const formula = `s = (ki / km) x kc x l = (${calc.ki.toFixed(2)} / ${calc.km.toFixed(1)}) x ${calc.kc.toFixed(2)} x ${calc.l.toFixed(1)} m`;
            pdf.text(sdSafe(formula), SD_MARGIN, y + 4);
            y += 8;
        }

        // Result bar
        if (calc.s_mm != null) {
            const resultH = 13;
            pdf.setFillColor(...SD_NAVY);
            pdf.rect(SD_MARGIN, y, cw, resultH, 'F');

            // Required distance
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Required Separation Distance:', SD_MARGIN + 4, y + 8.5);

            const resultText = `${calc.s_mm} mm`;
            pdf.setFontSize(13);
            pdf.setTextColor(...SD_AMBER);
            pdf.text(resultText, SD_PAGE_W / 2, y + 8.5, { align: 'center' });

            // Compliance badge (right side)
            if (calc.compliance) {
                const isPass  = calc.compliance === 'PASS';
                const badgeW  = 24;
                const badgeX  = SD_PAGE_W - SD_MARGIN - badgeW;
                pdf.setFillColor(...(isPass ? SD_GREEN : SD_RED));
                pdf.rect(badgeX, y + 2, badgeW, 9, 'F');
                pdf.setFontSize(8);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(255, 255, 255);
                pdf.text(calc.compliance, badgeX + badgeW / 2, y + 7.8, { align: 'center' });
            }

            y += resultH;

            // Actual distance note if entered
            if (calc.actualMm != null) {
                pdf.setFontSize(7.5);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(80, 80, 80);
                const note = `Actual distance available: ${calc.actualMm} mm — ${calc.compliance === 'PASS' ? 'Compliant (actual >= required)' : 'Non-compliant (actual < required)'}`;
                pdf.text(sdSafe(note), SD_MARGIN, y + 5);
                y += 8;
            }
        } else {
            // Incomplete data
            const resultH = 13;
            pdf.setFillColor(180, 180, 180);
            pdf.rect(SD_MARGIN, y, cw, resultH, 'F');
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Incomplete data — result not available', SD_PAGE_W / 2, y + 8.5, { align: 'center' });
            y += resultH;
        }

        y += 10; // gap between calculations
    });

    return y;
}

// ── SUMMARY TABLE PAGE ────────────────────────────────────────────────────────

function sdBuildSummary(pdf, calculations) {
    const subtitle = 'BS EN IEC 62305-3 | Separation Distance Calculator';
    let y = sdNewPage(pdf, 'CALCULATION SUMMARY', subtitle);

    const cw = SD_PAGE_W - SD_MARGIN * 2;

    // Summary table header
    const colWidths = [8, 50, 20, 20, 20, 20, 30, 24];
    // No., Description, ki, km, kc, l(m), s(mm), Compliance
    const headers = ['No.', 'Description', 'ki', 'km', 'kc', 'l (m)', 's (mm)', 'Status'];
    const headerH = 9;

    pdf.setFillColor(...SD_BLUE);
    pdf.rect(SD_MARGIN, y, cw, headerH, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);

    let cx = SD_MARGIN;
    headers.forEach((h, i) => {
        pdf.text(h, cx + colWidths[i] / 2, y + 6.2, { align: 'center' });
        cx += colWidths[i];
    });
    y += headerH;

    const rowH = 9;
    calculations.forEach((calc, idx) => {
        const bg = idx % 2 === 0 ? [255, 255, 255] : [244, 248, 252];
        pdf.setFillColor(...bg);
        pdf.rect(SD_MARGIN, y, cw, rowH, 'F');

        pdf.setFontSize(7.5);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(20, 20, 20);

        const cells = [
            String(calc.index),
            calc.desc || '-',
            calc.ki != null ? calc.ki.toFixed(2) : '-',
            calc.km != null ? calc.km.toFixed(1) : '-',
            calc.kc != null ? calc.kc.toFixed(2) : '-',
            calc.l  != null ? calc.l.toFixed(1)  : '-',
            calc.s_mm != null ? String(calc.s_mm) : '-',
            calc.compliance || '-'
        ];

        cx = SD_MARGIN;
        cells.forEach((cell, i) => {
            if (i === 7 && calc.compliance) {
                // Colour the compliance cell
                const isPass = calc.compliance === 'PASS';
                pdf.setTextColor(...(isPass ? SD_GREEN : SD_RED));
                pdf.setFont(undefined, 'bold');
                pdf.text(sdSafe(cell), cx + colWidths[i] / 2, y + 6.2, { align: 'center' });
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(20, 20, 20);
            } else {
                const truncated = pdf.splitTextToSize(sdSafe(cell), colWidths[i] - 2)[0] || '';
                pdf.text(truncated, cx + colWidths[i] / 2, y + 6.2, { align: 'center' });
            }
            cx += colWidths[i];
        });

        y += rowH;
    });

    // Table border
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.3);
    pdf.rect(SD_MARGIN, y - rowH * calculations.length - headerH, cw, rowH * calculations.length + headerH);

    // Column dividers
    cx = SD_MARGIN;
    const tableTop    = y - rowH * calculations.length - headerH;
    const tableBottom = y;
    colWidths.slice(0, -1).forEach(w => {
        cx += w;
        pdf.line(cx, tableTop, cx, tableBottom);
    });

    y += 8;

    // Formula reference note
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Formula: s = (ki / km) x kc x l   (BS EN IEC 62305-3, Equation 4)', SD_MARGIN, y);
    y += 5;
    pdf.text('ki: LPS class factor | km: insulation material factor | kc: current partition coefficient | l: conductor length (m) | s: separation distance', SD_MARGIN, y);
    pdf.setTextColor(0, 0, 0);
}

// ── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

function sdGeneratePDF(data) {
    const { siteName, siteAddress, calcDate, engineerName, calculations } = data;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Page 1: Cover
    sdBuildCoverPage(pdf, { siteName, siteAddress, calcDate, engineerName });

    // Page 2+: Individual calculations
    sdBuildCalculations(pdf, calculations);

    // Final page: Summary table (only if more than 1 calculation)
    if (calculations.length > 1) {
        sdBuildSummary(pdf, calculations);
    }

    // Filename: SD Calc - [SiteName] [dd-mm-yy].pdf
    const datePart  = sdFormatDateShort(calcDate);
    const namePart  = (siteName || 'Report').replace(/[^a-zA-Z0-9 \-_]/g, '').trim().substring(0, 40);
    pdf.save(`SD Calc - ${namePart} ${datePart}.pdf`);
}
