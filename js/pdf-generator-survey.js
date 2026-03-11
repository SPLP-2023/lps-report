// Survey Report PDF Generator — StrikeR
// Matches T&I report PDF styling

const SV_NAVY        = [13, 27, 42];
const SV_BLUE        = [8, 119, 195];
const SV_WHITE       = [255, 255, 255];
const SV_LIGHT_BLUE  = [240, 248, 255];
const SV_PAGE_W      = 210;
const SV_PAGE_H      = 297;
const SV_MARGIN      = 14;
const SV_PAGE_BOT    = 262;
const SV_FOOTER_TEXT = 'Strike Point Lightning Protection Ltd  |  Registered office: Atkinson Evans, 10 Arnot Hill Road, Nottingham NG5 6LJ  |  Company No. 15114852, Registered in England and Wales  |  info@strikepoint.uk  |  01159903220';

function svSafe(str) {
    if (!str) return '';
    return String(str).replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
}

function svFormatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    if (!y) return '-';
    return `${d}-${m}-${y.slice(2)}`;
}

function svAddImage(pdf, data, x, y, maxW, maxH, centre) {
    if (!data) return 0;
    try {
        const fmt = data.includes('data:image/jpeg') ? 'JPEG' : 'PNG';
        const props = pdf.getImageProperties(data);
        const ratio = props.width / props.height;
        let w, h;
        if (ratio > maxW / maxH) { w = maxW; h = maxW / ratio; }
        else                      { h = maxH; w = maxH * ratio; }
        const fx = centre ? x + (maxW - w) / 2 : x;
        pdf.addImage(data, fmt, fx, y, w, h);
        return h;
    } catch(e) { return 0; }
}

function svAddFooter(pdf) {
    const barY = SV_PAGE_H - 18;
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, barY, SV_PAGE_W, 18, 'F');
    if (window._footerBase64) {
        svAddImage(pdf, window._footerBase64, SV_PAGE_W - 38, barY + 1, 28, 14, true);
    }
    pdf.setFontSize(5.5);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...SV_WHITE);
    const lines = pdf.splitTextToSize(SV_FOOTER_TEXT, SV_PAGE_W - 44);
    const lineH = 3.5;
    const blockH = lines.length * lineH;
    const textY = barY + (18 - blockH) / 2 + lineH - 1;
    lines.forEach((ln, i) => pdf.text(ln, SV_PAGE_W / 2 - 10, textY + i * lineH, { align: 'center' }));
}

function svAddHeader(pdf, title, subtitle) {
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, SV_PAGE_W, 18, 'F');
    if (window._logoBase64) {
        svAddImage(pdf, window._logoBase64, SV_PAGE_W - 46, 1, 32, 16, true);
    }
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_WHITE);
    pdf.text(svSafe(title), SV_PAGE_W / 2 - 10, 10, { align: 'center' });
    if (subtitle) {
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(180, 210, 240);
        pdf.text(svSafe(subtitle), SV_PAGE_W / 2 - 10, 15, { align: 'center' });
    }
    return 24;
}

function svNewPage(pdf, title, subtitle) {
    pdf.addPage();
    svAddFooter(pdf);
    return svAddHeader(pdf, title, subtitle || 'Lightning Protection Survey Report');
}

function svSectionBar(pdf, label, x, y, w) {
    pdf.setFillColor(...SV_BLUE);
    pdf.rect(x, y, w, 9, 'F');
    pdf.setFontSize(8.5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_WHITE);
    pdf.text(svSafe(label), x + 4, y + 6.2);
    pdf.setTextColor(0, 0, 0);
    return y + 9;
}

function svBuildCover(pdf, d) {
    const PAGE_W = SV_PAGE_W, MARGIN = SV_MARGIN;
    pdf.setFillColor(...SV_NAVY);
    pdf.rect(0, 0, PAGE_W, 10, 'F');

    let y = 14;
    if (window._logoBase64) {
        const lh = svAddImage(pdf, window._logoBase64, MARGIN + 10, y, PAGE_W - MARGIN * 2 - 20, 32, true);
        y += lh + 4;
    }

    const bImg = (typeof uploadedImages !== 'undefined') ? uploadedImages['buildingImagePreview_data'] : null;
    if (bImg) {
        const ih = svAddImage(pdf, bImg, MARGIN, y, PAGE_W - MARGIN * 2, 70, true);
        y += ih + 4;
    }

    y += 2;
    const cardW = PAGE_W - MARGIN * 2;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...SV_NAVY);
    pdf.text(svSafe(d.siteName || d.jobReference || '-'), PAGE_W / 2, y + 6, { align: 'center' });
    y += 10;

    if (d.siteAddress) {
        const addrLines = pdf.splitTextToSize(svSafe(d.siteAddress), cardW - 10);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(90, 90, 90);
        pdf.text(addrLines, PAGE_W / 2, y, { align: 'center', lineHeightFactor: 1.5 });
        y += addrLines.length * 5;
    }
    y += 6;

    pdf.setFillColor(25, 45, 65);
    pdf.rect(MARGIN, y, cardW, 24, 'F');
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('LIGHTNING PROTECTION', PAGE_W / 2, y + 9, { align: 'center' });
    pdf.setFontSize(13);
    pdf.setTextColor(230, 160, 40);
    pdf.text('SURVEY REPORT', PAGE_W / 2, y + 18, { align: 'center' });
    y += 30;

    const rowH = 18;
    const infoH = rowH * 3;
    pdf.setFillColor(...SV_LIGHT_BLUE);
    pdf.rect(MARGIN, y, cardW, infoH, 'F');
    pdf.setDrawColor(...SV_BLUE);
    pdf.setLineWidth(0.5);
    pdf.rect(MARGIN, y, cardW, infoH);
    const divX = MARGIN + cardW / 2;
    pdf.setDrawColor(210, 225, 240);
    pdf.setLineWidth(0.3);
    pdf.line(divX, y + 1, divX, y + infoH - 1);
    [1,2].forEach(i => { pdf.line(MARGIN + 1, y + rowH * i, MARGIN + cardW - 1, y + rowH * i); });

    const col1X = MARGIN + 5;
    const col2X = MARGIN + cardW / 2 + 5;
    const colW  = cardW / 2 - 10;
    const labelClr = [100, 130, 160];
    const valueClr = [20, 20, 20];

    function infoCell(label, value, x, fy) {
        pdf.setFontSize(7); pdf.setFont(undefined, 'normal'); pdf.setTextColor(...labelClr);
        pdf.text(label.toUpperCase(), x, fy + 4);
        pdf.setFontSize(10); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...valueClr);
        const ls = pdf.splitTextToSize(svSafe(value || '-'), colW);
        pdf.text(ls[0], x, fy + 12);
    }

    infoCell('Job Reference', d.jobReference, col1X, y);
    infoCell('Date', svFormatDate(d.surveyDate), col2X, y);
    infoCell('Surveyor', d.surveyorName, col1X, y + rowH);
    infoCell('Site Representative', d.clientRepName, col2X, y + rowH);
    infoCell('Standard', d.standardInstalled || '-', col1X, y + rowH * 2);

    if (d.signatureData) {
        const sigY = y + rowH * 2;
        pdf.setFontSize(7); pdf.setFont(undefined, 'normal'); pdf.setTextColor(...labelClr);
        pdf.text('SITE REP SIGNATURE', col2X, sigY + 4);
        svAddImage(pdf, d.signatureData, col2X, sigY + 5, colW, rowH - 7, false);
    }

    svAddFooter(pdf);
}

function svBuildSummary(pdf, d) {
    let y = svNewPage(pdf, 'SURVEY SUMMARY');
    const MARGIN = SV_MARGIN;
    const W = SV_PAGE_W - MARGIN * 2;

    if (d.autoDescription) {
        y = svSectionBar(pdf, 'STRUCTURE & SYSTEM ASSESSMENT', MARGIN, y, W) + 4;
        pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
        const lines = pdf.splitTextToSize(svSafe(d.autoDescription), W);
        lines.forEach(ln => {
            if (y > SV_PAGE_BOT) { y = svNewPage(pdf, 'SURVEY SUMMARY (CONTINUED)'); }
            pdf.text(ln, MARGIN, y); y += 5;
        });
        y += 6;
    }

    if (y + 20 > SV_PAGE_BOT) y = svNewPage(pdf, 'SURVEY BREAKDOWN');
    else y = svSectionBar(pdf, 'SURVEY BREAKDOWN', MARGIN, y, W) + 4;

    const halfW = (W - 6) / 2;
    const col1 = MARGIN, col2 = MARGIN + halfW + 6;

    let ly = y;
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('SYSTEM OVERVIEW', col1, ly); ly += 6;
    pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    [d.existingSystem && `System: ${d.existingSystem}`,
     d.systemCondition && `Condition: ${d.systemCondition}`,
     d.lastTested && `Last Tested: ${d.lastTested}`,
     d.standardInstalled && `Standard: ${d.standardInstalled}`
    ].filter(Boolean).forEach(it => { pdf.text(svSafe(it), col1, ly); ly += 5; });
    ly += 4;

    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('STRUCTURE OVERVIEW', col1, ly); ly += 6;
    pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    [d.structureType && `Type: ${d.structureType}`,
     d.structureHeight && `Height: ${d.structureHeight}m`,
     d.numberOfFloors && `Floors: ${d.numberOfFloors}`,
     d.numberOfOccupants && `Max Occupancy: ${d.numberOfOccupants}`,
     d.buildingAge && `Age: ${d.buildingAge} years`,
     d.hasBasement && `Basement: ${d.hasBasement}`,
     d.roofType && `Roof: ${d.roofType}`,
     d.roofAccess && `Roof Access: ${d.roofAccess}`
    ].filter(Boolean).forEach(it => { pdf.text(svSafe(it), col1, ly); ly += 5; });

    let ry = y;
    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('VISIBLE SYSTEM COMPONENTS', col2, ry); ry += 6;
    pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    (d.systemComponents.length > 0 ? d.systemComponents : ['None identified']).forEach(c => {
        const ls = pdf.splitTextToSize(`• ${c}`, halfW);
        ls.forEach(ln => { pdf.text(svSafe(ln), col2, ry); ry += 4.5; });
    });
    ry += 4;

    pdf.setFontSize(8.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
    pdf.text('STRUCTURE FABRICS', col2, ry); ry += 6;
    pdf.setFont(undefined, 'normal'); pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    [d.wallTypes.length > 0 && `Walls: ${d.wallTypes.join(', ')}`,
     d.groundTypes.length > 0 && `Ground: ${d.groundTypes.join(', ')}`
    ].filter(Boolean).forEach(f => {
        const ls = pdf.splitTextToSize(svSafe(f), halfW);
        ls.forEach(ln => { pdf.text(ln, col2, ry); ry += 4.5; });
    });

    y = Math.max(ly, ry) + 8;

    if (d.riskFactors.length > 0) {
        if (y + 20 > SV_PAGE_BOT) y = svNewPage(pdf, 'SURVEY BREAKDOWN (CONTINUED)');
        y = svSectionBar(pdf, 'IDENTIFIED RISK FACTORS', MARGIN, y, W) + 4;
        pdf.setFontSize(8); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
        const riskW = (W - 6) / 2;
        d.riskFactors.forEach((rf, i) => {
            const cx = MARGIN + (i % 2) * (riskW + 6);
            const rowY = y + Math.floor(i / 2) * 5;
            if (rowY < SV_PAGE_BOT) pdf.text(svSafe(`• ${rf}`), cx, rowY);
        });
        y += Math.ceil(d.riskFactors.length / 2) * 5 + 6;
    }

    if (d.electricalSystems.length > 0) {
        if (y + 20 > SV_PAGE_BOT) y = svNewPage(pdf, 'SURVEY BREAKDOWN (CONTINUED)');
        y = svSectionBar(pdf, 'CONNECTED ELECTRICAL SYSTEMS', MARGIN, y, W) + 4;
        pdf.setFontSize(8); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
        pdf.text('The following systems were identified for surge protection assessment:', MARGIN, y); y += 6;
        const elW = (W - 6) / 2;
        d.electricalSystems.forEach((es, i) => {
            const cx = MARGIN + (i % 2) * (elW + 6);
            const rowY = y + Math.floor(i / 2) * 5;
            if (rowY < SV_PAGE_BOT) pdf.text(svSafe(`• ${es}`), cx, rowY);
        });
        y += Math.ceil(d.electricalSystems.length / 2) * 5 + 6;
    }
}

function svBuildObservations(pdf, d) {
    if (!d.surveyFindings || !d.surveyFindings.trim()) return;
    let y = svNewPage(pdf, "ENGINEER'S ADDITIONAL OBSERVATIONS");
    const MARGIN = SV_MARGIN, W = SV_PAGE_W - MARGIN * 2;
    pdf.setFontSize(9); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40, 40, 40);
    pdf.splitTextToSize(svSafe(d.surveyFindings), W).forEach(ln => {
        if (y > SV_PAGE_BOT) y = svNewPage(pdf, "ENGINEER'S OBSERVATIONS (CONTINUED)");
        pdf.text(ln, MARGIN, y); y += 5;
    });
}

function svBuildPhotos(pdf, images) {
    if (!images || images.length === 0) return;
    let y = svNewPage(pdf, 'SURVEY PHOTOGRAPHS');
    const MARGIN = SV_MARGIN, imgW = 85, imgH = 62, gap = 6;
    const col2X = MARGIN + imgW + gap;
    let count = 0;
    images.forEach(img => {
        if (!img) return;
        if (count > 0 && count % 6 === 0) y = svNewPage(pdf, 'SURVEY PHOTOGRAPHS (CONTINUED)');
        const row = Math.floor((count % 6) / 2);
        const col = count % 2;
        svAddImage(pdf, img, col === 0 ? MARGIN : col2X, y + row * (imgH + gap), imgW, imgH, false);
        count++;
    });
}

function svBuildNextSteps(pdf) {
    let y = svNewPage(pdf, 'RECOMMENDED NEXT STEPS');
    const MARGIN = SV_MARGIN, W = SV_PAGE_W - MARGIN * 2;
    const steps = [
        {t:'intro',   s:'Following this survey, the following actions are recommended:'},
        {t:'heading', s:'1. Lightning Protection Risk Assessment'},
        {t:'bullet',  s:'Conduct detailed BS EN 62305-2 risk assessment'},
        {t:'bullet',  s:'Determine if lightning protection is required'},
        {t:'bullet',  s:'Calculate the appropriate Lightning Protection Level (LPL)'},
        {t:'heading', s:'2. Surge Protection Assessment'},
        {t:'bullet',  s:'Evaluate all identified connected electrical systems'},
        {t:'bullet',  s:'Specify appropriate SPD requirements per zone'},
        {t:'bullet',  s:'Design a coordinated surge protection strategy'},
        {t:'heading', s:'3. System Design & Installation (if required)'},
        {t:'bullet',  s:'Develop detailed system design to BS EN 62305-3'},
        {t:'bullet',  s:'Specify installation requirements and materials'},
        {t:'bullet',  s:'Prepare installation drawings and method statements'},
        {t:'heading', s:'4. Testing & Commissioning'},
        {t:'bullet',  s:'Commission system with full electrical testing'},
        {t:'bullet',  s:'Provide test certificates and documentation'},
        {t:'bullet',  s:'Establish an ongoing maintenance programme'},
    ];
    steps.forEach(step => {
        if (y > SV_PAGE_BOT - 6) y = svNewPage(pdf, 'RECOMMENDED NEXT STEPS (CONTINUED)');
        if (step.t === 'intro') {
            pdf.setFontSize(9); pdf.setFont(undefined, 'italic'); pdf.setTextColor(80,80,80);
            pdf.text(svSafe(step.s), MARGIN, y); y += 7;
        } else if (step.t === 'heading') {
            y += 2; pdf.setFontSize(9.5); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...SV_NAVY);
            pdf.text(svSafe(step.s), MARGIN, y); y += 6;
        } else {
            pdf.setFontSize(8.5); pdf.setFont(undefined, 'normal'); pdf.setTextColor(40,40,40);
            pdf.splitTextToSize(`    • ${step.s}`, W).forEach(ln => { pdf.text(svSafe(ln), MARGIN, y); y += 5; });
        }
    });
}

function generateSurveyPDF() {
    const siteAddress  = document.getElementById('siteAddress')?.value || '';
    const surveyorName = document.getElementById('surveyorName')?.value || '';
    if (!siteAddress.trim()) { alert('Please enter a Site Address before generating the report.'); return; }
    if (!surveyorName.trim()) { alert('Please enter the Surveyor Name before generating the report.'); return; }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    const siteName          = document.getElementById('siteName')?.value || '';
    const jobReference      = document.getElementById('jobReference')?.value || '';
    const surveyDate        = document.getElementById('surveyDate')?.value || '';
    const clientRepName     = document.getElementById('clientRepName')?.value || '';
    const structureType     = document.getElementById('structureType')?.value || '';
    const structureHeight   = document.getElementById('structureHeight')?.value || '';
    const buildingAge       = document.getElementById('buildingAge')?.value || '';
    const numberOfFloors    = document.getElementById('numberOfFloors')?.value || '';
    const numberOfOccupants = document.getElementById('numberOfOccupants')?.value || '';
    const hasBasement       = document.getElementById('hasBasement')?.value || '';
    const roofType          = document.getElementById('roofType')?.value || '';
    const roofAccess        = document.getElementById('roofAccess')?.value || '';
    const existingSystem    = document.getElementById('existingSystem')?.value || '';
    const systemCondition   = document.getElementById('systemCondition')?.value || '';
    const lastTested        = document.getElementById('lastTested')?.value || '';
    const standardInstalled = document.getElementById('standardInstalled')?.value || '';
    const surveyFindings    = document.getElementById('surveyFindings')?.value || '';

    const groundTypes       = getSelectedCheckboxes('ground-checkbox');
    const wallTypes         = getSelectedCheckboxes('wall-checkbox');
    const systemComponents  = getSelectedCheckboxes('system-checkbox');
    const riskFactors       = getSelectedCheckboxes('risk-checkbox');
    const electricalSystems = getSelectedCheckboxes('electrical-checkbox');
    const signatureData     = window.clientSignature ? window.clientSignature.getSignatureData() : null;
    const autoDescription   = generateAutoDescription();
    const imgs = typeof uploadedImages !== 'undefined' ? uploadedImages : {};

    const coverData = {
        siteName, jobReference, siteAddress, surveyDate, surveyorName,
        clientRepName, standardInstalled, signatureData
    };

    const summaryData = {
        autoDescription, existingSystem, systemCondition, lastTested, standardInstalled,
        structureType, structureHeight, numberOfFloors, numberOfOccupants, buildingAge,
        hasBasement, roofType, roofAccess,
        groundTypes, wallTypes, systemComponents, riskFactors, electricalSystems
    };

    let photos = [];
    const rawPhotos = imgs['additionalPhotosPreview_data'];
    if (rawPhotos) photos = Array.isArray(rawPhotos) ? rawPhotos : [rawPhotos];

    svBuildCover(pdf, coverData);
    svBuildSummary(pdf, summaryData);
    svBuildObservations(pdf, { surveyFindings });
    if (photos.length > 0) svBuildPhotos(pdf, photos);
    svBuildNextSteps(pdf);

    const namePart = (siteName || jobReference || 'Report').replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
    const datePart = svFormatDate(surveyDate);
    pdf.save(`Lightning Protection Survey Report - ${namePart} ${datePart}.pdf`);
}
