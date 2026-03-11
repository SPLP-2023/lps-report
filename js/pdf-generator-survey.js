// ===================== SURVEY REPORT PDF GENERATOR =====================
// Matches T&I report styling: navy/blue headers, logo top-right, ES12 footer

const SV_NAVY        = [13, 27, 42];
const SV_BLUE        = [8, 119, 195];
const SV_WHITE       = [255, 255, 255];
const SV_PAGE_W      = 210;
const SV_PAGE_H      = 297;
const SV_MARGIN      = 14;
const SV_PAGE_BOT    = 262;
const SV_FOOTER_TEXT = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852  |  Registered in England and Wales';

function svSafe(str) { return (str || '').replace(/[^\x20-\x7E]/g, ''); }

function svFormatDate(dateStr) {
    if (!dateStr) return '-';
    const [yyyy, mm, dd] = dateStr.split('-');
    return yyyy ? `${dd}-${mm}-${yyyy.slice(2)}` : '-';
}

function svAddImage(pdf, imgData, x, y, maxW, maxH, center) {
    if (!imgData) return 0;
    try {
        const fmt = imgData.includes('data:image/jpeg') ? 'JPEG' : 'PNG';
        const props = pdf.getImageProperties(imgData);
        const ar = props.width / props.height;
        let w, h;
        if (ar > maxW / maxH) { w = maxW; h = maxW / ar; }
        else { h = maxH; w = maxH * ar; }
        const fx = center ? x + (maxW - w) / 2 : x;
        pdf.addImage(imgData, fmt, fx, y, w, h);
        return h;
    } catch(e) { return 0; }
}

function svAddFooter(pdf) {
    const barY = SV_PAGE_H - 18;
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, barY, SV_PAGE_W, 18, 'F');
    if (window._footerBase64) {
        svAddImage(pdf, window._footerBase64, SV_MARGIN, barY + 1, 38, 15, false);
    }
    pdf.setFontSize(6);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...SV_WHITE);
    const lines = pdf.splitTextToSize(SV_FOOTER_TEXT, SV_PAGE_W - SV_MARGIN * 2 - 42);
    const lineH = 3.2;
    const blockH = lines.length * lineH;
    const textY = barY + (18 - blockH) / 2 + lineH;
    pdf.text(lines, SV_PAGE_W / 2 + 10, textY);
    pdf.setTextColor(0, 0, 0);
}

function svAddHeader(pdf, title, subtitle) {
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, SV_PAGE_W, 22, 'F');
    if (window._logoBase64) {
        svAddImage(pdf, window._logoBase64, SV_PAGE_W - 52, 1, 38, 20, false);
    }
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_WHITE);
    pdf.text(svSafe(title), SV_PAGE_W / 2, subtitle ? 10 : 13, { align: 'center' });
    if (subtitle) {
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 240);
        pdf.text(svSafe(subtitle), SV_PAGE_W / 2, 17, { align: 'center' });
    }
    pdf.setTextColor(0, 0, 0);
    return 28;
}

function svNewPage(pdf, title, subtitle) {
    pdf.addPage();
    svAddFooter(pdf);
    return svAddHeader(pdf, title, subtitle);
}

function svSectionHeader(pdf, label, x, y, w) {
    pdf.setFillColor(...SV_BLUE);
    pdf.rect(x, y, w, 9, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_WHITE);
    pdf.text(label.toUpperCase(), x + 4, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + 9;
}

// ---- Cover Page ----
function svBuildCoverPage(pdf, d) {
    const { siteName, siteAddress, surveyDate, surveyorName, clientRepName, signatureData, buildingImage, jobReference } = d;

    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, SV_PAGE_W, 10, 'F');

    let y = 14;
    if (window._logoBase64) {
        const h = svAddImage(pdf, window._logoBase64, SV_MARGIN + 20, y, 130, 45, true);
        y += h + 4;
    } else { y += 20; }

    const cardX = SV_MARGIN;
    const cardW = SV_PAGE_W - SV_MARGIN * 2;
    y += 4;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_NAVY);
    pdf.text(svSafe(siteName || jobReference || '-'), SV_PAGE_W / 2, y + 6, { align: 'center' });
    y += 10;

    if (siteAddress) {
        const addrLines = pdf.splitTextToSize(svSafe(siteAddress), cardW - 10);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrLines, SV_PAGE_W / 2, y, { align: 'center', lineHeightFactor: 1.5 });
        y += addrLines.length * 5;
    }
    y += 6;

    if (buildingImage) {
        const remaining = SV_PAGE_BOT - y - 55;
        const imgH = svAddImage(pdf, buildingImage, cardX, y, cardW, Math.min(80, remaining), true);
        y += imgH + 6;
    }

    // Title card
    pdf.setFillColor(25, 45, 65);
    pdf.rect(cardX, y, cardW, 24, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_WHITE);
    pdf.text('LIGHTNING PROTECTION', SV_PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setTextColor(230, 160, 40);
    pdf.text('SURVEY REPORT', SV_PAGE_W / 2, y + 18, { align: 'center' });
    y += 30;

    // Info table — 3 rows
    const rowH = 18;
    const infoH = rowH * 3;
    pdf.setFillColor(250, 252, 255);
    pdf.rect(cardX, y, cardW, infoH, 'F');
    pdf.setDrawColor(...SV_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, y, cardW, infoH);
    const divX = cardX + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, y + 1, divX, y + infoH - 1);

    const col1X = cardX + 5;
    const col2X = cardX + cardW / 2 + 5;
    const colW  = cardW / 2 - 10;

    function infoField(label, value, x, fy) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 130, 160);
        pdf.text(label.toUpperCase(), x, fy + 4);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(20, 20, 20);
        const lines = pdf.splitTextToSize(svSafe(value) || '-', colW);
        pdf.text(lines[0], x, fy + 12);
    }

    // Row dividers
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(cardX + 1, y + rowH, cardX + cardW - 1, y + rowH);
    pdf.line(cardX + 1, y + rowH * 2, cardX + cardW - 1, y + rowH * 2);

    infoField('Job Reference',      jobReference,  col1X, y);
    infoField('Date',               svFormatDate(surveyDate), col2X, y);
    infoField('Surveyor',           surveyorName,  col1X, y + rowH);
    infoField('Site Representative',clientRepName, col2X, y + rowH);

    // Signature row
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 130, 160);
    pdf.text('SITE REPRESENTATIVE SIGNATURE', col1X, y + rowH * 2 + 4);
    if (signatureData) {
        svAddImage(pdf, signatureData, col1X, y + rowH * 2 + 6, 60, 10, false);
    }
    pdf.setTextColor(0, 0, 0);

    svAddFooter(pdf);
}

// ---- Survey Summary Page ----
function svBuildSummary(pdf, d) {
    let y = svNewPage(pdf, 'SURVEY SUMMARY', 'Lightning Protection Survey Report');
    const M = SV_MARGIN;
    const W = SV_PAGE_W - M * 2;
    const colW = (W - 6) / 2;
    const col1X = M;
    const col2X = M + colW + 6;

    // Auto description
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

    // Left: Structure
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
    if (d.roofType)    { pdf.text(svSafe('Roof: ' + d.roofType), col2X, rightY); rightY += 6; }
    if (d.roofAccess)  { pdf.text(svSafe('Roof Access: ' + d.roofAccess), col2X, rightY); rightY += 6; }

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
        y = Math.max(eY1, eY2) + 8;
    }
}

// ---- Observations Page ----
function svBuildObservations(pdf, findings) {
    let y = svNewPage(pdf, "ENGINEER'S ADDITIONAL OBSERVATIONS", 'Lightning Protection Survey Report');
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

// ---- Photos Page ----
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
        svAddImage(pdf, img, col === 0 ? col1X : col2X, y + row * (imgH + gap), imgW, imgH, false);
        count++;
    });
}

// ---- Next Steps Page ----
function svBuildNextSteps(pdf) {
    let y = svNewPage(pdf, 'RECOMMENDED NEXT STEPS', 'Lightning Protection Survey Report');
    const M = SV_MARGIN;

    const steps = [
        [true,  'Following this survey, the following actions are recommended:'],
        [false, ''],
        [true,  '1. Lightning Protection Risk Assessment'],
        [false, '   \u2022 Conduct a detailed BS EN 62305-2 risk assessment'],
        [false, '   \u2022 Determine if lightning protection is required'],
        [false, '   \u2022 Calculate Lightning Protection Level (LPL) if needed'],
        [false, ''],
        [true,  '2. Surge Protection Assessment'],
        [false, '   \u2022 Evaluate connected electrical systems identified above'],
        [false, '   \u2022 Specify appropriate SPD requirements'],
        [false, '   \u2022 Design a coordinated surge protection strategy'],
        [false, ''],
        [true,  '3. System Design & Installation (if required)'],
        [false, '   \u2022 Develop detailed system design to BS EN 62305-3'],
        [false, '   \u2022 Specify installation requirements and materials'],
        [false, '   \u2022 Prepare installation drawings and method statements'],
        [false, ''],
        [true,  '4. Testing & Commissioning'],
        [false, '   \u2022 Commission system with full electrical testing'],
        [false, '   \u2022 Provide test certificates and documentation'],
        [false, '   \u2022 Establish an ongoing maintenance programme'],
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

// ---- Main Entry Point ----
function generateSurveyPDF() {
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
        .map(el => { const lbl = document.querySelector(`label[for="${el.id}"]`); return lbl ? lbl.textContent.trim() : ''; })
        .filter(Boolean);

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

    const namePart = (siteName || jobReference || 'Survey').replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
    const datePart = svFormatDate(surveyDate);
    pdf.save(`Lightning Protection Survey Report - ${namePart} ${datePart}.pdf`);
}
