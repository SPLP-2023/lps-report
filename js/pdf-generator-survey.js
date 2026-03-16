// =============================================================================
// pdf-generator-survey.js — Survey Report PDF Generator
// Layout exactly mirrors ti-pdf-generator.js: same header, footer, cover page
// =============================================================================

const SV_NAVY        = [13, 27, 42];
const SV_BLUE        = [8, 119, 195];
const SV_AMBER       = [230, 160, 40];
const SV_PAGE_W      = 210;
const SV_PAGE_H      = 297;
const SV_MARGIN      = 14;
const SV_PAGE_BOT    = 262;
const SV_FOOTER_TEXT = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852, Registered in England and Wales  |  info@strikepoint.uk  |  Tel: 01159903220';

// ---- EXACT COPY of T&I addImageToPDF ----
function svAddImageToPDF(pdf, imageData, x, y, maxWidth, maxHeight, centerAlign) {
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
        console.error('svAddImageToPDF error:', e);
        return 0;
    }
}

// ---- EXACT COPY of T&I addPageHeader (same sizes/positions) ----
function svAddPageHeader(pdf, title, subtitle) {
    const barH = 18;
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, SV_PAGE_W, barH, 'F');

    // Logo right — same position as T&I: PAGE_W - 32, y=1, 30x16
    try {
        if (window._logoBase64) svAddImageToPDF(pdf, window._logoBase64, SV_PAGE_W - 32, 1, 30, 16, false);
    } catch (e) {}

    // Title centred
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, SV_PAGE_W / 2, 10, { align: 'center' });

    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 235);
        pdf.text(subtitle, SV_PAGE_W / 2, 15, { align: 'center' });
    }

    pdf.setTextColor(0, 0, 0);
    return barH + 6;
}

// ---- EXACT COPY of T&I addFooterToPage ----
function svAddFooterToPage(pdf) {
    const barH = 16;
    const barY = SV_PAGE_H - barH;

    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, barY, SV_PAGE_W, barH, 'F');

    // Footer accreditation image — CENTRED, same coords as T&I: PAGE_W/2-36, y=259, 72x18
    try {
        if (window._footerBase64) svAddImageToPDF(pdf, window._footerBase64, SV_PAGE_W / 2 - 36, 259, 72, 18, false);
    } catch (e) {}

    // Footer text centred over the bar
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(160, 190, 210);
    const lines = pdf.splitTextToSize(SV_FOOTER_TEXT, 180);
    const lineH = 3.5;
    const textBlockH = lines.length * lineH;
    const textY = barY + (barH / 2) - (textBlockH / 2) + lineH;
    pdf.text(lines, SV_PAGE_W / 2, textY, { align: 'center', lineHeightFactor: 1.3 });
    pdf.setTextColor(0, 0, 0);
}

// ---- EXACT COPY of T&I newPage ----
function svNewPage(pdf, title, subtitle) {
    pdf.addPage();
    svAddFooterToPage(pdf);
    return svAddPageHeader(pdf, title, subtitle);
}

// ---- Section header bar (blue, same as T&I drawSectionHeader) ----
function svSectionHeader(pdf, label, x, y, w) {
    pdf.setFillColor(...SV_BLUE);
    pdf.rect(x, y, w, 9, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(label.toUpperCase(), x + 4, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + 9;
}

function svSafe(str) { return (str || '').replace(/[^\x20-\x7E]/g, ''); }

function svFormatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}/${m}/${y}` : '-';
}

function svFormatDateShort(dateStr) {
    if (!dateStr) return 'undated';
    const [y, m, d] = dateStr.split('-');
    return y ? `${d}-${m}-${y.slice(2)}` : 'undated';
}

// ===================== COVER PAGE =====================
// Layout: top navy bar → logo centred → building photo → site name/address → title card → info table → footer
// MATCHES T&I buildCoverPage exactly

function svBuildCoverPage(pdf, data) {
    const { siteName, siteAddress, surveyDate, surveyorName, clientRepName,
            signatureData, buildingImage, jobReference } = data;

    // Top navy bar (same as T&I)
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, SV_PAGE_W, 10, 'F');

    // Company logo centred — same as T&I: x=MARGIN, maxW=PAGE_W-MARGIN*2, maxH=50, centred
    let y = 14;
    try {
        if (window._logoBase64) {
            const logoH = svAddImageToPDF(pdf, window._logoBase64, SV_MARGIN, y, SV_PAGE_W - SV_MARGIN * 2, 50, true);
            y += logoH + 6;
        } else { y += 56; }
    } catch (e) { y += 56; }

    // Building image — same as T&I: MARGIN, y, PAGE_W-MARGIN*2, 65, centred
    if (buildingImage) {
        try {
            const imgH = svAddImageToPDF(pdf, buildingImage, SV_MARGIN, y, SV_PAGE_W - SV_MARGIN * 2, 65, true);
            y += imgH + 6;
        } catch (e) { y += 6; }
    }

    // Site name and address — same as T&I (below image)
    const cardX = SV_MARGIN;
    const cardW = SV_PAGE_W - SV_MARGIN * 2;
    const addrBlock = siteAddress ? pdf.splitTextToSize(svSafe(siteAddress), cardW - 10) : [];

    y += 4;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_NAVY);
    pdf.text(svSafe(siteName || jobReference || '-'), SV_PAGE_W / 2, y + 6, { align: 'center' });
    y += 10;

    if (addrBlock.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrBlock, SV_PAGE_W / 2, y, { align: 'center', lineHeightFactor: 1.5 });
        y += addrBlock.length * 5;
    }
    y += 6;

    // Title card — same as T&I
    const cardH = 24;
    pdf.setFillColor(25, 45, 65);
    pdf.rect(cardX, y, cardW, cardH, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIGHTNING PROTECTION', SV_PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_AMBER);
    pdf.text('SURVEY REPORT', SV_PAGE_W / 2, y + 18, { align: 'center' });
    y += cardH + 6;

    // Info table — 3 rows x 2 cols, same as T&I
    const rowH = 18;
    const infoH = rowH * 3;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, y, cardW, infoH, 'F');
    pdf.setDrawColor(...SV_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, y, cardW, infoH);

    // Vertical divider
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
        const lines = pdf.splitTextToSize(svSafe(value) || '-', colW);
        pdf.text(lines[0], x, fy + 12);
    }

    // Row 1: Job Reference | Date
    infoField('Job Reference', jobReference, col1X, y);
    infoField('Date', svFormatDate(surveyDate), col2X, y);

    // Row divider
    pdf.setDrawColor(210, 225, 240); pdf.setLineWidth(0.3);
    pdf.line(cardX + 1, y + rowH, cardX + cardW - 1, y + rowH);

    // Row 2: Surveyor | Site Representative
    infoField('Surveyor', surveyorName, col1X, y + rowH);
    infoField('Site Representative', clientRepName, col2X, y + rowH);

    // Row divider
    pdf.line(cardX + 1, y + rowH * 2, cardX + cardW - 1, y + rowH * 2);

    // Row 3: (left blank label) | Signature
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...labelColor);
    pdf.text('SITE REPRESENTATIVE SIGNATURE', col2X, y + rowH * 2 + 4);
    if (signatureData) {
        try { pdf.addImage(signatureData, 'PNG', col2X, y + rowH * 2 + 5, 50, 11); } catch(e) {}
    }

    svAddFooterToPage(pdf);
}

// ===================== SURVEY SUMMARY =====================

function svBuildSummary(pdf, d) {
    let y = svNewPage(pdf, 'SURVEY SUMMARY', 'Lightning Protection Survey Report');
    const M = SV_MARGIN;
    const W = SV_PAGE_W - M * 2;
    const colW = (W - 6) / 2;
    const col1X = M;
    const col2X = M + colW + 6;

    // Auto-generated description
    if (d.autoDescription) {
        y = svSectionHeader(pdf, 'Structure & System Assessment', M, y, W) + 4;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(40, 40, 40);
        const lines = pdf.splitTextToSize(svSafe(d.autoDescription), W - 4);
        lines.forEach(line => {
            if (y > SV_PAGE_BOT - 10) y = svNewPage(pdf, 'SURVEY SUMMARY (CONTINUED)', 'Lightning Protection Survey Report');
            pdf.text(line, M + 2, y);
            y += 5;
        });
        y += 6;
    }

    if (y + 60 > SV_PAGE_BOT) {
        y = svNewPage(pdf, 'SURVEY BREAKDOWN', 'Lightning Protection Survey Report');
    } else {
        y = svSectionHeader(pdf, 'Survey Breakdown', M, y + 4, W) + 4;
    }

    let leftY = y, rightY = y;

    // Left: System Overview
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('SYSTEM OVERVIEW', col1X, leftY); leftY += 7;
    pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    const sysLines = [];
    if (d.existingSystem)    sysLines.push('System: ' + d.existingSystem);
    if (d.systemCondition)   sysLines.push('Condition: ' + d.systemCondition);
    if (d.lastTested)        sysLines.push('Last Tested: ' + d.lastTested);
    if (d.standardInstalled) sysLines.push('Standard: ' + d.standardInstalled);
    if (!sysLines.length)    sysLines.push('No system information recorded');
    sysLines.forEach(l => { pdf.text(svSafe(l), col1X, leftY); leftY += 6; });
    leftY += 6;

    // Left: Structure Overview
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('STRUCTURE OVERVIEW', col1X, leftY); leftY += 7;
    pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    const strLines = [];
    if (d.structureType)      strLines.push('Type: ' + d.structureType);
    if (d.structureHeight)    strLines.push('Height: ' + d.structureHeight + 'm');
    if (d.numberOfFloors)     strLines.push('Floors: ' + d.numberOfFloors);
    if (d.numberOfOccupants)  strLines.push('Max Occupants: ' + d.numberOfOccupants);
    if (d.buildingAge)        strLines.push('Age: ' + d.buildingAge + ' years');
    if (d.hasBasement)        strLines.push('Basement: ' + d.hasBasement);
    strLines.forEach(l => { pdf.text(svSafe(l), col1X, leftY); leftY += 6; });

    // Right: Visible Components
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('VISIBLE SYSTEM COMPONENTS', col2X, rightY); rightY += 7;
    pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    if (d.systemComponents && d.systemComponents.length) {
        d.systemComponents.forEach(c => { pdf.text('• ' + svSafe(c), col2X, rightY); rightY += 6; });
    } else { pdf.text('None identified', col2X, rightY); rightY += 6; }
    rightY += 6;

    // Right: Structure Fabrics
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('STRUCTURE FABRICS', col2X, rightY); rightY += 7;
    pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    if (d.wallTypes && d.wallTypes.length)     { pdf.text(svSafe('Walls: ' + d.wallTypes.join(', ')), col2X, rightY); rightY += 6; }
    if (d.groundTypes && d.groundTypes.length) { pdf.text(svSafe('Ground: ' + d.groundTypes.join(', ')), col2X, rightY); rightY += 6; }
    if (d.roofType)   { pdf.text(svSafe('Roof: ' + d.roofType), col2X, rightY); rightY += 6; }
    if (d.roofAccess) { pdf.text(svSafe('Roof Access: ' + d.roofAccess), col2X, rightY); rightY += 6; }

    y = Math.max(leftY, rightY) + 10;

    // Risk Factors
    if (d.riskFactors && d.riskFactors.length) {
        if (y + 30 > SV_PAGE_BOT) y = svNewPage(pdf, 'SURVEY BREAKDOWN (CONTINUED)', 'Lightning Protection Survey Report');
        y = svSectionHeader(pdf, 'Identified Risk Factors', M, y, W) + 4;
        pdf.setFontSize(8.5); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
        const half = Math.ceil(d.riskFactors.length / 2);
        let rY1 = y, rY2 = y;
        d.riskFactors.forEach((r, i) => {
            if (i < half) { pdf.text('• ' + svSafe(r), col1X, rY1); rY1 += 6; }
            else          { pdf.text('• ' + svSafe(r), col2X, rY2); rY2 += 6; }
        });
        y = Math.max(rY1, rY2) + 8;
    }

    // Electrical Systems
    if (d.electricalSystems && d.electricalSystems.length) {
        if (y + 30 > SV_PAGE_BOT) y = svNewPage(pdf, 'SURVEY BREAKDOWN (CONTINUED)', 'Lightning Protection Survey Report');
        y = svSectionHeader(pdf, 'Connected Electrical Systems', M, y, W) + 4;
        pdf.setFontSize(8.5); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
        const half = Math.ceil(d.electricalSystems.length / 2);
        let eY1 = y, eY2 = y;
        d.electricalSystems.forEach((s, i) => {
            if (i < half) { pdf.text('• ' + svSafe(s), col1X, eY1); eY1 += 6; }
            else          { pdf.text('• ' + svSafe(s), col2X, eY2); eY2 += 6; }
        });
    }
}

// ===================== OBSERVATIONS =====================

function svBuildObservations(pdf, findings) {
    let y = svNewPage(pdf, "ENGINEER'S OBSERVATIONS", 'Lightning Protection Survey Report');
    const M = SV_MARGIN;
    const W = SV_PAGE_W - M * 2;
    pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    const lines = pdf.splitTextToSize(svSafe(findings), W - 4);
    lines.forEach(line => {
        if (y > SV_PAGE_BOT - 10) y = svNewPage(pdf, 'OBSERVATIONS (CONTINUED)', 'Lightning Protection Survey Report');
        pdf.text(line, M + 2, y);
        y += 5;
    });
}

// ===================== SURVEY PHOTOGRAPHS =====================

function svBuildPhotos(pdf, images) {
    let y = svNewPage(pdf, 'SURVEY PHOTOGRAPHS', 'Lightning Protection Survey Report');
    const M = SV_MARGIN;
    const imgW = 85, imgH = 63, gap = 6;
    const col1X = M, col2X = M + imgW + gap;
    let count = 0;
    images.forEach(img => {
        if (!img) return;
        if (count > 0 && count % 6 === 0) {
            y = svNewPage(pdf, 'SURVEY PHOTOGRAPHS (CONTINUED)', 'Lightning Protection Survey Report');
        }
        const row = Math.floor((count % 6) / 2);
        const col = count % 2;
        svAddImageToPDF(pdf, img, col === 0 ? col1X : col2X, y + row * (imgH + gap), imgW, imgH, false);
        count++;
    });
}

// ===================== NEXT STEPS =====================

function svBuildNextSteps(pdf) {
    let y = svNewPage(pdf, 'RECOMMENDED NEXT STEPS', 'Lightning Protection Survey Report');
    const M = SV_MARGIN;

    const steps = [
        [true,  'Following this survey, the following actions are recommended:'],
        [false, ''],
        [true,  '1. Lightning Protection Risk Assessment'],
        [false, '    \u2022  Conduct a detailed BS EN 62305-2 risk assessment'],
        [false, '    \u2022  Determine if lightning protection is required'],
        [false, '    \u2022  Calculate Lightning Protection Level (LPL) if needed'],
        [false, ''],
        [true,  '2. Surge Protection Assessment'],
        [false, '    \u2022  Evaluate connected electrical systems identified above'],
        [false, '    \u2022  Specify appropriate SPD requirements'],
        [false, '    \u2022  Design a coordinated surge protection strategy'],
        [false, ''],
        [true,  '3. System Design & Installation (if required)'],
        [false, '    \u2022  Develop detailed system design to BS EN 62305-3'],
        [false, '    \u2022  Specify installation requirements and materials'],
        [false, '    \u2022  Prepare installation drawings and method statements'],
        [false, ''],
        [true,  '4. Testing & Commissioning'],
        [false, '    \u2022  Commission system with full electrical testing'],
        [false, '    \u2022  Provide test certificates and documentation'],
        [false, '    \u2022  Establish an ongoing maintenance programme'],
    ];

    steps.forEach(([heading, text]) => {
        if (y > SV_PAGE_BOT - 10) y = svNewPage(pdf, 'RECOMMENDED NEXT STEPS (CONTINUED)', 'Lightning Protection Survey Report');
        pdf.setFontSize(heading ? 10 : 9);
        pdf.setFont(undefined, heading ? 'bold' : 'normal');
        pdf.setTextColor(...(heading ? SV_NAVY : [40, 40, 40]));
        if (text) pdf.text(svSafe(text), M + 2, y);
        y += text ? 6 : 3;
    });
    pdf.setTextColor(0, 0, 0);
}

// ===================== MAIN ENTRY POINT =====================

async function generateSurveyPDF() {
    const siteName       = document.getElementById('siteName')?.value || '';
    const jobReference   = document.getElementById('jobReference')?.value || '';
    const siteAddress    = document.getElementById('siteAddress')?.value || '';
    const surveyDate     = document.getElementById('surveyDate')?.value || '';
    const surveyorName   = document.getElementById('surveyorName')?.value || '';
    const clientRepName  = document.getElementById('clientRepName')?.value || '';

    if (!siteAddress.trim() && !siteName.trim()) {
        alert('Please enter at least a Site Name or Site Address before generating the report.');
        return;
    }

    const getChecked = cls => Array.from(document.querySelectorAll('.' + cls + ':checked'))
        .map(el => {
            const lbl = document.querySelector(`label[for="${el.id}"]`);
            return lbl ? lbl.textContent.trim() : '';
        }).filter(Boolean);

    const d = {
        siteName, jobReference, siteAddress, surveyDate, surveyorName, clientRepName,
        signatureData:     window.clientSignature ? window.clientSignature.getSignatureData() : null,
        buildingImage:     window.uploadedImages['buildingImagePreview_data'] || null,
        structureType:     document.getElementById('structureType')?.value || '',
        structureHeight:   document.getElementById('structureHeight')?.value || '',
        buildingAge:       document.getElementById('buildingAge')?.value || '',
        numberOfFloors:    document.getElementById('numberOfFloors')?.value || '',
        numberOfOccupants: document.getElementById('numberOfOccupants')?.value || '',
        hasBasement:       document.getElementById('hasBasement')?.value || '',
        roofType:          document.getElementById('roofType')?.value || '',
        roofAccess:        document.getElementById('roofAccess')?.value || '',
        existingSystem:    document.getElementById('existingSystem')?.value || '',
        systemCondition:   document.getElementById('systemCondition')?.value || '',
        lastTested:        document.getElementById('lastTested')?.value || '',
        standardInstalled: document.getElementById('standardInstalled')?.value || '',
        surveyFindings:    document.getElementById('surveyFindings')?.value || '',
        groundTypes:        getChecked('ground-checkbox'),
        wallTypes:          getChecked('wall-checkbox'),
        systemComponents:   getChecked('system-checkbox'),
        riskFactors:        getChecked('risk-checkbox'),
        electricalSystems:  getChecked('electrical-checkbox'),
        surveyPhotos:       window.uploadedImages['additionalPhotosPreview_data'] || null,
        autoDescription:    typeof generateAutoDescription === 'function' ? generateAutoDescription() : '',
    };

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    svBuildCoverPage(pdf, d);
    svBuildSummary(pdf, d);
    if (d.surveyFindings.trim()) svBuildObservations(pdf, d.surveyFindings);
    const photos = Array.isArray(d.surveyPhotos) ? d.surveyPhotos : (d.surveyPhotos ? [d.surveyPhotos] : []);
    if (photos.length) svBuildPhotos(pdf, photos);
    svBuildNextSteps(pdf);
    
        // ── Append site drawing if saved ──────────────────────
    const surveyDrawing = localStorage.getItem('striker-drawing-survey');
    if (surveyDrawing) {
        const savedState = JSON.parse(localStorage.getItem('striker-drawing-survey-state') || '{}');
        const drawingMeta = {
            siteName: siteName    || '',
            address:  siteAddress || '',
            date:     surveyDate  || '',
            legend:   savedState.legend || []
        };
        await buildDrawingPage(pdf, surveyDrawing, drawingMeta, true);
    }
    // ─────────────────────────────────────────────────────

    const namePart = (siteName || jobReference || 'Survey').replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
    pdf.save(`Lightning Protection Survey Report - ${namePart} ${svFormatDateShort(surveyDate)}.pdf`);
}
