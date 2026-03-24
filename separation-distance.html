// =============================================================================
// sd-pdf.js — Separation Distance Calculator PDF Generator
// BS EN IEC 62305-3:2024 — Clause 6.3 / Annex B
// Follows exact T&I / Remedial pattern:
//   window._logoBase64 / window._footerBase64 preloaded by HTML page
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

// ── Page header ───────────────────────────────────────────────────────────────

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
    pdf.text(sdSafe(title), SD_PAGE_W / 2, 11, { align: 'center' });
    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 235);
        pdf.text(sdSafe(subtitle), SD_PAGE_W / 2, 16, { align: 'center' });
    }
    pdf.setTextColor(0, 0, 0);
    return barH + 6;
}

// ── Page footer ───────────────────────────────────────────────────────────────

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
    const lines  = pdf.splitTextToSize(SD_FOOTER_TEXT, 180);
    const lineH  = 3.5;
    const blockH = lines.length * lineH;
    const textY  = barY + (barH / 2) - (blockH / 2) + lineH;
    pdf.text(lines, SD_PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
    pdf.setTextColor(0, 0, 0);
}

function sdNewPage(pdf, title, subtitle) {
    pdf.addPage();
    sdAddFooter(pdf);
    return sdAddHeader(pdf, title, subtitle);
}

// ── Blue section header bar ───────────────────────────────────────────────────

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

// ── Two-column info field ─────────────────────────────────────────────────────

function sdInfoField(pdf, label, value, x, y, colW) {
    const labelColor = [100, 130, 160];
    const valueColor = [20, 20, 20];
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

// ── COVER PAGE ────────────────────────────────────────────────────────────────

function sdBuildCoverPage(pdf, data) {
    const { siteName, siteAddress, calcDate, engineerName } = data;

    // Thin top navy bar
    pdf.setFillColor(...SD_NAVY);
    pdf.rect(0, 0, SD_PAGE_W, 10, 'F');

    // Logo — larger than other reports (maxH=80 vs 50 in T&I, no building image)
    let y = 14;
    try {
        if (window._logoBase64) {
            const logoH = sdAddImage(pdf, window._logoBase64, SD_MARGIN, y, SD_PAGE_W - SD_MARGIN * 2, 80, true);
            y += logoH + 12;
        } else {
            y += 92;
        }
    } catch(e) { y += 92; }

    const cardX = SD_MARGIN;
    const cardW = SD_PAGE_W - SD_MARGIN * 2;

    // Site name
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
    pdf.setTextColor(...SD_AMBER);
    pdf.text('SEPARATION DISTANCE CALCULATION', SD_PAGE_W / 2, y + 18, { align: 'center' });
    y += titleCardH + 6;

    // Standard badge
    const badgeW = 140;
    const badgeX = (SD_PAGE_W - badgeW) / 2;
    pdf.setFillColor(240, 246, 252);
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(badgeX, y, badgeW, 9, 'FD');
    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...SD_BLUE);
    pdf.text('BS EN IEC 62305-3:2024  |  Clause 6.3 & Annex B', SD_PAGE_W / 2, y + 6.2, { align: 'center' });
    y += 9 + 6;

    // Info card
    const rowH  = 18;
    const infoH = rowH * 2;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, y, cardW, infoH, 'F');
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, y, cardW, infoH);

    const divX = cardX + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, y + 1, divX, y + infoH - 1);
    pdf.line(cardX + 1, y + rowH, cardX + cardW - 1, y + rowH);

    const col1X = cardX + 5;
    const col2X = cardX + cardW / 2 + 5;
    const colW  = cardW / 2 - 10;

    sdInfoField(pdf, 'Date',     sdFormatDate(calcDate), col1X, y,          colW);
    sdInfoField(pdf, 'Engineer', engineerName,            col2X, y,          colW);
    sdInfoField(pdf, 'Standard', 'BS EN IEC 62305-3:2024', col1X, y + rowH, colW);
    sdInfoField(pdf, 'Reference', 'Clause 6.3 & Annex B',  col2X, y + rowH, colW);

    sdAddFooter(pdf);
}

// ── CALCULATIONS PAGES ────────────────────────────────────────────────────────

function sdBuildCalculations(pdf, calculations) {
    const HDR     = 'SEPARATION DISTANCE CALCULATIONS';
    const HDR_CON = 'SEPARATION DISTANCE CALCULATIONS (CONTINUED)';
    const SUB     = 'BS EN IEC 62305-3:2024 | Cl. 6.3';

    let y = sdNewPage(pdf, HDR, SUB);
    const cw      = SD_PAGE_W - SD_MARGIN * 2;
    const labelW  = cw * 0.50;
    const rowH    = 8;

    calculations.forEach(calc => {
        // Rows — actual distance included only if entered
        const dataRows = [
            ['LPS Class',               calc.lpsClassLabel || '-'],
            ['Insulation Material',     calc.materialLabel || '-'],
            ['kc Approach',             calc.approachLabel || '-'],
            ['kc Source',               calc.kcSource      || '-'],
            ['ki (LPS class factor)',    calc.ki != null ? calc.ki.toFixed(2) : '-'],
            ['km (material factor)',     calc.km != null ? calc.km.toFixed(1) : '-'],
            ['kc (current partition)',   calc.kcLabel || '-'],
            ['l  (conductor length)',    calc.l != null ? `${calc.l.toFixed(1)} m` : '-'],
            ...(calc.actualMm != null ? [['Actual distance available', `${calc.actualMm} mm`]] : []),
        ];

        const formulaLine  = calc.kcFormula ? 1 : 0;
        const blockH = 9 + (dataRows.length * rowH) + 4 + (formulaLine * 6) + 14 + 10;

        if (y + blockH > SD_PAGE_BOT) {
            y = sdNewPage(pdf, HDR_CON, SUB);
        }

        // Section bar with calc index and description
        const barLabel = `Calculation ${calc.index}${calc.desc ? ' — ' + calc.desc : ''}`;
        y = sdSectionBar(pdf, barLabel, SD_MARGIN, y, cw);

        // Data rows
        const tableTopY = y;
        dataRows.forEach((row, i) => {
            const bg = i % 2 === 0 ? [255,255,255] : [244,248,252];
            pdf.setFillColor(...bg);
            pdf.rect(SD_MARGIN, y, cw, rowH, 'F');
            pdf.setFontSize(8.5);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(60, 60, 60);
            pdf.text(sdSafe(row[0]), SD_MARGIN + 3, y + 5.5);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(20, 20, 20);
            const val = pdf.splitTextToSize(sdSafe(row[1]), labelW - 4)[0] || '';
            pdf.text(val, SD_MARGIN + labelW + 3, y + 5.5);
            y += rowH;
        });

        // Table border + column divider
        pdf.setDrawColor(...SD_BLUE);
        pdf.setLineWidth(0.3);
        pdf.rect(SD_MARGIN, tableTopY, cw, y - tableTopY);
        pdf.line(SD_MARGIN + labelW, tableTopY, SD_MARGIN + labelW, y);

        y += 3;

        // Formula line
        if (calc.kcFormula) {
            pdf.setFontSize(7.5);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(80, 80, 80);
            pdf.text(sdSafe('kc formula: ' + calc.kcFormula), SD_MARGIN, y + 4);
            y += 7;
        }

        // s formula line
        if (calc.ki != null && calc.km != null && calc.kc != null && calc.l != null) {
            pdf.setFontSize(7.5);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(80, 80, 80);
            const sFormula = `s = (ki/km) x kc x l = (${calc.ki.toFixed(2)}/${calc.km.toFixed(1)}) x ${calc.kcLabel} x ${calc.l.toFixed(1)} m`;
            pdf.text(sdSafe(sFormula), SD_MARGIN, y + 4);
            y += 7;
        }

        // Result bar
        const resultH = 14;
        if (calc.s_mm != null) {
            pdf.setFillColor(...SD_NAVY);
            pdf.rect(SD_MARGIN, y, cw, resultH, 'F');

            // Label — left
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Required Separation Distance:', SD_MARGIN + 4, y + 9);

            // Result value — centred, large amber
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...SD_AMBER);
            pdf.text(`${calc.s_mm} mm`, SD_PAGE_W / 2, y + 9.5, { align: 'center' });

            // PASS/FAIL badge — right, smaller box
            if (calc.compliance) {
                const isPass = calc.compliance === 'PASS';
                const bW     = 20;
                const bH     = 7;
                const bX     = SD_PAGE_W - SD_MARGIN - bW;
                const bY     = y + (resultH - bH) / 2;
                pdf.setFillColor(...(isPass ? SD_GREEN : SD_RED));
                pdf.rect(bX, bY, bW, bH, 'F');
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(255, 255, 255);
                pdf.text(calc.compliance, bX + bW / 2, bY + 5.2, { align: 'center' });
            }
            y += resultH;
        } else {
            pdf.setFillColor(180, 180, 180);
            pdf.rect(SD_MARGIN, y, cw, resultH, 'F');
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'italic');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Incomplete data — result not available', SD_PAGE_W / 2, y + 9, { align: 'center' });
            y += resultH;
        }

        y += 10;
    });
}

// ── SUMMARY TABLE ─────────────────────────────────────────────────────────────

function sdBuildSummary(pdf, calculations) {
    const SUB = 'BS EN IEC 62305-3:2024 | Cl. 6.3';
    let y = sdNewPage(pdf, 'CALCULATION SUMMARY', SUB);
    const cw = SD_PAGE_W - SD_MARGIN * 2;

    // Column widths: No. | Description | ki | km | kc | l(m) | s(mm) | Status
    // Total must equal cw (182mm): 8+50+13+13+13+16+22+47 = 182
    const cols   = [8, 50, 13, 13, 13, 16, 22, 47];
    const hdrs   = ['No.', 'Description', 'ki', 'km', 'kc', 'l (m)', 's (mm)', 'Status'];
    const hdrH   = 9;
    const rowH   = 9;

    // Header row
    pdf.setFillColor(...SD_BLUE);
    pdf.rect(SD_MARGIN, y, cw, hdrH, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    let cx = SD_MARGIN;
    hdrs.forEach((h, i) => {
        pdf.text(sdSafe(h), cx + cols[i] / 2, y + 6.2, { align: 'center' });
        cx += cols[i];
    });
    y += hdrH;

    const tableTopY = y;

    calculations.forEach((calc, idx) => {
        const bg = idx % 2 === 0 ? [255,255,255] : [244,248,252];
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
            calc.kcLabel || '-',
            calc.l  != null ? calc.l.toFixed(1)  : '-',
            calc.s_mm != null ? `${calc.s_mm}` : '-',
            calc.compliance || '-'
        ];

        cx = SD_MARGIN;
        cells.forEach((cell, i) => {
            if (i === 7 && calc.compliance) {
                const isPass = calc.compliance === 'PASS';
                pdf.setTextColor(...(isPass ? SD_GREEN : SD_RED));
                pdf.setFont(undefined, 'bold');
                pdf.text(sdSafe(cell), cx + cols[i] / 2, y + 6.2, { align: 'center' });
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(20, 20, 20);
            } else {
                const t = pdf.splitTextToSize(sdSafe(cell), cols[i] - 2)[0] || '';
                pdf.text(t, cx + cols[i] / 2, y + 6.2, { align: 'center' });
            }
            cx += cols[i];
        });
        y += rowH;
    });

    // Table border + column dividers
    pdf.setDrawColor(...SD_BLUE);
    pdf.setLineWidth(0.3);
    pdf.rect(SD_MARGIN, tableTopY - hdrH, cw, y - tableTopY + hdrH);
    cx = SD_MARGIN;
    cols.slice(0, -1).forEach(w => {
        cx += w;
        pdf.line(cx, tableTopY - hdrH, cx, y);
    });

    y += 8;

    // Formula reference
    pdf.setFontSize(7.5);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Formula (Eq. 6, Cl. 6.3.2): s = (ki / km) x kc x l', SD_MARGIN, y);
    y += 5;
    pdf.text('ki: LPS class factor (Table 11)  |  km: insulation material factor (Table 12)  |  kc: current partition coefficient (Table 13 or Annex B)  |  l: conductor length (m)', SD_MARGIN, y, { maxWidth: cw });
    pdf.setTextColor(0, 0, 0);
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

function sdGeneratePDF(data) {
    const { siteName, siteAddress, calcDate, engineerName, calculations } = data;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Cover page
    sdBuildCoverPage(pdf, { siteName, siteAddress, calcDate, engineerName });

    // Calculation pages
    sdBuildCalculations(pdf, calculations);

    // Summary table (only if 2+ calculations)
    if (calculations.length > 1) {
        sdBuildSummary(pdf, calculations);
    }

    // Filename: SD Calc - [SiteName] [dd-mm-yy].pdf
    const datePart = sdFormatDateShort(calcDate);
    const namePart = (siteName || 'Report').replace(/[^a-zA-Z0-9 \-_]/g, '').trim().substring(0, 40);
    pdf.save(`SD Calc - ${namePart} ${datePart}.pdf`);
}
