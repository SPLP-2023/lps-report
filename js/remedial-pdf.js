// =============================================================================
// remedial-pdf.js — Remedial Report PDF Generator
// Exact T&I layout. Per-repair photos shown inline under each repair item.
// =============================================================================

const RM_NAVY        = [13, 27, 42];
const RM_BLUE        = [8, 119, 195];
const RM_AMBER       = [230, 160, 40];
const RM_PAGE_W      = 210;
const RM_PAGE_H      = 297;
const RM_MARGIN      = 14;
const RM_PAGE_BOT    = 262;
const RM_FOOTER_TEXT = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852, Registered in England and Wales  |  info@strikepoint.uk  |  Tel: 01159903220';

// ---- EXACT COPY of T&I addImageToPDF ----
function rmAddImageToPDF(pdf, imageData, x, y, maxWidth, maxHeight, centerAlign) {
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
        console.error('rmAddImageToPDF error:', e);
        return 0;
    }
}

// ---- EXACT COPY of T&I addPageHeader ----
function rmAddPageHeader(pdf, title, subtitle) {
    const barH = 18;
    pdf.setFillColor(...RM_NAVY);
    pdf.rect(0, 0, RM_PAGE_W, barH, 'F');
    try {
        if (window._logoBase64) rmAddImageToPDF(pdf, window._logoBase64, RM_PAGE_W - 32, 1, 30, 16, false);
    } catch (e) {}
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, RM_PAGE_W / 2, 10, { align: 'center' });
    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 235);
        pdf.text(subtitle, RM_PAGE_W / 2, 15, { align: 'center' });
    }
    pdf.setTextColor(0, 0, 0);
    return barH + 6;
}

// ---- EXACT COPY of T&I addFooterToPage ----
function rmAddFooterToPage(pdf) {
    const barH = 16;
    const barY = RM_PAGE_H - barH;
    pdf.setFillColor(...RM_NAVY);
    pdf.rect(0, barY, RM_PAGE_W, barH, 'F');
    try {
        if (window._footerBase64) rmAddImageToPDF(pdf, window._footerBase64, RM_PAGE_W / 2 - 36, 259, 72, 18, false);
    } catch (e) {}
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(160, 190, 210);
    const lines = pdf.splitTextToSize(RM_FOOTER_TEXT, 180);
    const lineH = 3.5;
    const textBlockH = lines.length * lineH;
    const textY = barY + (barH / 2) - (textBlockH / 2) + lineH;
    pdf.text(lines, RM_PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
    pdf.setTextColor(0, 0, 0);
}

// ---- newPage ----
function rmNewPage(pdf, title, subtitle) {
    pdf.addPage();
    rmAddFooterToPage(pdf);
    return rmAddPageHeader(pdf, title, subtitle);
}

// ---- Blue section header bar ----
function rmSectionHeader(pdf, label, x, y, w) {
    pdf.setFillColor(...RM_BLUE);
    pdf.rect(x, y, w, 9, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(label.toUpperCase(), x + 4, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + 9;
}

function rmSafe(str) { return (str || '').replace(/[^\x20-\x7E]/g, ''); }

function rmFormatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}/${m}/${y}` : '-';
}

function rmFormatDateShort(dateStr) {
    if (!dateStr) return 'undated';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}-${m}-${y.slice(2)}` : 'undated';
}

// ===================== COVER PAGE =====================
// Exact T&I order: narrow navy bar → logo centred → building photo → site name/address → title card → info table → footer

function rmBuildCoverPage(pdf, data) {
    const { siteName, siteAddress, remedialDate, remedialEngineer, siteStaffName,
            signatureData, buildingImage, jobReference } = data;

    // Thin top navy bar
    pdf.setFillColor(...RM_NAVY);
    pdf.rect(0, 0, RM_PAGE_W, 10, 'F');

    // Logo centred — x=MARGIN, maxW=PAGE_W-MARGIN*2, maxH=50, centred=true (exact T&I)
    let y = 14;
    try {
        if (window._logoBase64) {
            const logoH = rmAddImageToPDF(pdf, window._logoBase64, RM_MARGIN, y, RM_PAGE_W - RM_MARGIN * 2, 50, true);
            y += logoH + 6;
        } else { y += 56; }
    } catch (e) { y += 56; }

    // Building image — same T&I call
    if (buildingImage) {
        try {
            const imgH = rmAddImageToPDF(pdf, buildingImage, RM_MARGIN, y, RM_PAGE_W - RM_MARGIN * 2, 65, true);
            y += imgH + 6;
        } catch (e) { y += 6; }
    }

    // Site name + address block (below image — same as T&I)
    const cardX = RM_MARGIN;
    const cardW = RM_PAGE_W - RM_MARGIN * 2;
    const addrBlock = siteAddress ? pdf.splitTextToSize(rmSafe(siteAddress), cardW - 10) : [];

    y += 4;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...RM_NAVY);
    pdf.text(rmSafe(siteName || jobReference || '-'), RM_PAGE_W / 2, y + 6, { align: 'center' });
    y += 10;

    if (addrBlock.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrBlock, RM_PAGE_W / 2, y, { align: 'center', lineHeightFactor: 1.5 });
        y += addrBlock.length * 5;
    }
    y += 6;

    // Title card
    const cardH = 24;
    pdf.setFillColor(25, 45, 65);
    pdf.rect(cardX, y, cardW, cardH, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIGHTNING PROTECTION', RM_PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...RM_AMBER);
    pdf.text('REMEDIAL REPORT', RM_PAGE_W / 2, y + 18, { align: 'center' });
    y += cardH + 6;

    // Info table — 3 rows x 2 cols (same as T&I)
    const rowH = 18;
    const infoH = rowH * 3;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, y, cardW, infoH, 'F');
    pdf.setDrawColor(...RM_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, y, cardW, infoH);

    const divX = cardX + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, y + 1, divX, y + infoH - 1);

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
        const lines = pdf.splitTextToSize(rmSafe(value) || '-', colW);
        pdf.text(lines[0], x, fy + 12);
    }

    // Row dividers
    pdf.setDrawColor(210, 225, 240); pdf.setLineWidth(0.3);
    pdf.line(cardX + 1, y + rowH, cardX + cardW - 1, y + rowH);
    pdf.line(cardX + 1, y + rowH * 2, cardX + cardW - 1, y + rowH * 2);

    infoField('Job Reference',     jobReference,       col1X, y);
    infoField('Date',              rmFormatDate(remedialDate), col2X, y);
    infoField('Remedial Engineer', remedialEngineer,   col1X, y + rowH);
    infoField('Site Staff',        siteStaffName,      col2X, y + rowH);

    // Row 3: signature
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...labelColor);
    pdf.text('SITE STAFF SIGNATURE', col2X, y + rowH * 2 + 4);
    if (signatureData) {
        try { pdf.addImage(signatureData, 'PNG', col2X, y + rowH * 2 + 5, 50, 11); } catch(e) {}
    }
    pdf.setTextColor(0, 0, 0);

    rmAddFooterToPage(pdf);
}

// ===================== REMEDIAL WORKS PAGE =====================
// Each repair shows as a numbered entry with any attached photos inline below it

function rmBuildWorks(pdf, data) {
    let y = rmNewPage(pdf, 'REMEDIAL WORKS', 'Lightning Protection Remedial Report');
    const M = RM_MARGIN;
    const W = RM_PAGE_W - M * 2;

    if (data.selectedRepairs && data.selectedRepairs.length) {
        y = rmSectionHeader(pdf, 'Works Carried Out', M, y, W) + 6;

        data.selectedRepairs.forEach((repair, i) => {
            const repairLines = pdf.splitTextToSize(rmSafe(repair.text), W - 12);
            const photos = data.repairImages[repair.id] || [];

            // Only break to new page before the repair TEXT if there's genuinely no room
            // for at least the bullet + first line (never pre-jump for photos)
            if (y + 10 > RM_PAGE_BOT) {
                y = rmNewPage(pdf, 'REMEDIAL WORKS (CONTINUED)', 'Lightning Protection Remedial Report');
            }

            // Numbered circle bullet
            pdf.setFillColor(...RM_BLUE);
            pdf.circle(M + 3.5, y - 1.5, 3.5, 'F');
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text(String(i + 1), M + 3.5, y - 0.5, { align: 'center' });
            pdf.setTextColor(0, 0, 0);

            // Repair text — break line by line
            pdf.setFontSize(9.5);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(30, 30, 30);
            repairLines.forEach((line, li) => {
                if (y > RM_PAGE_BOT - 8) {
                    y = rmNewPage(pdf, 'REMEDIAL WORKS (CONTINUED)', 'Lightning Protection Remedial Report');
                }
                pdf.text(line, M + 10, y);
                y += 5.5;
            });
            y += 3;

            // Photos — 3 per row, 55x40mm, break to new page between ROWS (not blocks)
            if (photos.length) {
                const imgW = 55, imgH = 40, gap = 4;
                const perRow = 3;
                let col = 0;
                let rowY = y;

                photos.forEach((imgData, pi) => {
                    // Start a new row
                    if (col === perRow) {
                        col = 0;
                        y = rowY + imgH + gap;
                        rowY = y;
                    }
                    // At start of a new row, check if it fits — if not, new page
                    if (col === 0) {
                        if (rowY + imgH > RM_PAGE_BOT) {
                            y = rmNewPage(pdf, 'REMEDIAL WORKS (CONTINUED)', 'Lightning Protection Remedial Report');
                            rowY = y;
                        }
                    }
                    const xPos = M + 10 + col * (imgW + gap);
                    rmAddImageToPDF(pdf, imgData, xPos, rowY, imgW, imgH, false);
                    col++;
                });

                // Advance y past the last row of photos
                y = rowY + imgH + 6;
            }

            y += 5;
        });
        y += 4;
    }

    // Additional Repairs
    if (data.additionalRepairs && data.additionalRepairs.trim()) {
        if (y + 30 > RM_PAGE_BOT) y = rmNewPage(pdf, 'REMEDIAL WORKS (CONTINUED)', 'Lightning Protection Remedial Report');
        y = rmSectionHeader(pdf, 'Additional Repairs Discovered On Site', M, y, W) + 6;
        pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(30, 30, 30);
        const lines = pdf.splitTextToSize(rmSafe(data.additionalRepairs), W - 4);
        lines.forEach(line => {
            if (y > RM_PAGE_BOT - 8) y = rmNewPage(pdf, 'REMEDIAL WORKS (CONTINUED)', 'Lightning Protection Remedial Report');
            pdf.text(line, M + 2, y);
            y += 5;
        });
        y += 8;
    }
}

// ===================== COMPLETION NOTES & COMPLIANCE PAGE =====================
// Mirrors the T&I inspection summary layout: result pill, supporting text, notes

function rmBuildCompletionPage(pdf, data) {
    const { complianceResult, completionNotes, remedialDate, remedialEngineer, selectedRepairs } = data;
    const hasResult = complianceResult === 'PASS' || complianceResult === 'FAIL';
    const isPass    = complianceResult === 'PASS';

    let y = rmNewPage(pdf, 'COMPLETION SUMMARY', 'Lightning Protection Remedial Report');
    const M  = RM_MARGIN;
    const W  = RM_PAGE_W - M * 2;

    // ---- Compliance result block (only if PASS or FAIL selected) ----
    if (hasResult) {
        y += 4;

        // "Compliance Result" label — matches T&I
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('Compliance Result', RM_PAGE_W / 2, y, { align: 'center' });
        y += 8;

        // PASS / FAIL pill — matches T&I exactly
        const bannerLabel = isPass ? 'PASS' : 'FAIL — Action Required';
        pdf.setFontSize(26);
        pdf.setFont(undefined, 'bold');
        const labelW  = pdf.getTextWidth(bannerLabel) + 10;
        const bannerH = 14;
        const bannerX = (RM_PAGE_W - labelW) / 2;
        pdf.setFillColor(...(isPass ? [34, 139, 34] : [200, 40, 40]));
        pdf.rect(bannerX, y, labelW, bannerH, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text(bannerLabel, RM_PAGE_W / 2, y + 10.5, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        y += bannerH + 7;

        // Supporting line
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(80, 80, 80);
        if (isPass) {
            pdf.text('Remedial works have been completed and the system is now compliant.', RM_PAGE_W / 2, y, { align: 'center' });
            y += 7;
            pdf.text('This certificate is valid for 12 months from the date of issue.', RM_PAGE_W / 2, y, { align: 'center' });
        } else {
            pdf.text('Remedial works have been carried out, however the system remains non-compliant.', RM_PAGE_W / 2, y, { align: 'center' });
            y += 7;
            pdf.text('Further action is required to achieve compliance.', RM_PAGE_W / 2, y, { align: 'center' });
        }
        y += 7;

        // Standard note — matches T&I small italic lines
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(120, 120, 120);
        pdf.text('All works are carried out in accordance with BS EN 62305, BS6651, NF C 17-102:2011 and BS7430.', RM_PAGE_W / 2, y, { align: 'center' });
        y += 6;
        pdf.text('Lightning protection systems should be tested annually under The Electricity At Work Act 1989.', RM_PAGE_W / 2, y, { align: 'center' });
        y += 14;
        pdf.setTextColor(0, 0, 0);
    }

    // ---- Works Summary block ----
    y = rmSectionHeader(pdf, 'Remedial Works Summary', M, y, W) + 5;

    // Mini summary table: date, engineer, no. of repairs
    const summaryRows = [
        ['Date of Remedial Works', rmFormatDate(remedialDate)],
        ['Remedial Engineer',      rmSafe(remedialEngineer) || '-'],
        ['Number of Repairs',      String((selectedRepairs || []).length)],
    ];
    const rowH = 10, col1W = 70;
    summaryRows.forEach((row, i) => {
        const fy = y + i * rowH;
        pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 253 : 255);
        pdf.rect(M, fy, W, rowH, 'F');
        pdf.setDrawColor(220, 230, 240); pdf.setLineWidth(0.2);
        pdf.rect(M, fy, W, rowH);
        pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(60, 90, 130);
        pdf.text(row[0], M + 3, fy + 7);
        pdf.setFont(undefined, 'normal'); pdf.setTextColor(30, 30, 30);
        pdf.text(rmSafe(row[1]), M + col1W, fy + 7);
    });
    y += summaryRows.length * rowH + 8;

    // ---- Completion Notes ----
    if (completionNotes && completionNotes.trim()) {
        if (y + 30 > RM_PAGE_BOT) y = rmNewPage(pdf, 'COMPLETION SUMMARY (CONTINUED)', 'Lightning Protection Remedial Report');
        y = rmSectionHeader(pdf, 'Completion Notes', M, y, W) + 5;
        pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(30, 30, 30);
        const lines = pdf.splitTextToSize(rmSafe(completionNotes), W - 4);
        lines.forEach(line => {
            if (y > RM_PAGE_BOT - 8) y = rmNewPage(pdf, 'COMPLETION SUMMARY (CONTINUED)', 'Lightning Protection Remedial Report');
            pdf.text(line, M + 2, y);
            y += 5;
        });
    }
}

// ===================== MAIN ENTRY POINT =====================

function generateRemedialPDF() {
    const siteName         = document.getElementById('siteName')?.value || '';
    const jobReference     = document.getElementById('jobReference')?.value || '';
    const siteAddress      = document.getElementById('siteAddress')?.value || '';
    const remedialDate     = document.getElementById('remedialDate')?.value || '';
    const remedialEngineer = document.getElementById('remedialEngineer')?.value || '';
    const siteStaffName    = document.getElementById('siteStaffName')?.value || '';
    const additionalRepairs  = document.getElementById('additionalRepairs')?.value || '';
    const completionNotes    = document.getElementById('completionNotes')?.value || '';
    const complianceResult   = document.getElementById('complianceResult')?.value || '';

    if (!siteAddress.trim() && !siteName.trim()) {
        alert('Please enter at least a Site Name or Site Address before generating the report.');
        return;
    }
    if (!window.selectedRepairs || !window.selectedRepairs.length) {
        if (!confirm('No repairs have been selected. Continue anyway?')) return;
    }

    // Build repairImages map: id -> array of base64 strings
    const repairImages = {};
    (window.selectedRepairs || []).forEach(r => {
        const imgs = window.imageStore['repair-' + r.id];
        if (imgs) repairImages[r.id] = Array.isArray(imgs) ? imgs : [imgs];
        else repairImages[r.id] = [];
    });

    const data = {
        siteName, jobReference, siteAddress, remedialDate, remedialEngineer, siteStaffName,
        additionalRepairs, completionNotes, complianceResult,
        signatureData:   window.siteStaffSignature ? window.siteStaffSignature.getSignatureData() : null,
        buildingImage:   window.imageStore['building'] || null,
        selectedRepairs: window.selectedRepairs || [],
        repairImages,
    };

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    rmBuildCoverPage(pdf, data);
    rmBuildWorks(pdf, data);
    rmBuildCompletionPage(pdf, data);

    const namePart = (siteName || jobReference || 'Remedial').replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
    pdf.save(`Lightning Protection Remedial Report - ${namePart} ${rmFormatDateShort(remedialDate)}.pdf`);
}
