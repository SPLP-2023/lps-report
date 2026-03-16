/* =====================================================
   STRIKER DRAWING TOOL — drawing-pdf.js
   ===================================================== */

// ── Standalone export (from drawing.html) ─────────────
async function exportDrawingPDF() {
    const btn = document.getElementById('btnExportPDF');
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;

    try {
        if (typeof window.jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const drawingCanvas = window.getDrawingCanvas ? window.getDrawingCanvas() : null;
        const imgData = drawingCanvas ? drawingCanvas.toDataURL('image/jpeg', 0.92) : null;
        const meta    = window.getDrawingMeta ? window.getDrawingMeta() : {};

        await buildDrawingPage(pdf, imgData, meta);

        const fileDate  = formatFilenameDate(meta.date);
        const cleanName = (meta.siteName || 'Site').replace(/[^a-z0-9 ]/gi, '').trim();
        pdf.save(`LP Drawing - ${cleanName} ${fileDate}.pdf`);

    } catch(err) {
        console.error('PDF export error:', err);
        alert('PDF generation failed: ' + err.message);
    } finally {
        btn.textContent = '⬇ Export PDF';
        btn.disabled = false;
    }
}

// ── Shared: build one landscape A4 drawing page ────────
// pdf     — jsPDF instance (page will be added if needed, or drawn on current page)
// imgData — base64 JPEG of the drawing canvas (may be null)
// meta    — { siteName, address, date, legend[] }
// addNewPage — if true, calls pdf.addPage() first (for appending to existing report)
async function buildDrawingPage(pdf, imgData, meta, addNewPage) {
    if (addNewPage) {
        pdf.addPage([297, 210], 'landscape');
    }

    const PW = 297, PH = 210;  // A4 landscape in mm
    const MARGIN = 6;
    const TB_W   = 68;
    const TB_X   = PW - MARGIN - TB_W;
    const DRAW_X = MARGIN;
    const DRAW_Y = MARGIN;
    const DRAW_W = TB_X - MARGIN - 6;
    const DRAW_H = PH - MARGIN * 2;

    const siteName = (meta && meta.siteName) || '';
    const address  = (meta && meta.address)  || '';
    const date     = formatDate((meta && meta.date) || '');
    const legend   = (meta && meta.legend)   || [];

    // ── Outer border ──────────────────────────────
    pdf.setDrawColor(30, 30, 30);
    pdf.setLineWidth(0.4);
    pdf.rect(MARGIN, MARGIN, PW - MARGIN * 2, PH - MARGIN * 2);

    // ── Drawing image — letterbox fit ─────────────
    if (imgData) {
        const cW  = 1400, cH = 900;
        const fit = Math.min((DRAW_W - 4) / cW, DRAW_H / cH);
        const fitW = cW * fit, fitH = cH * fit;
        const offX = DRAW_X + (DRAW_W - fitW) / 2;
        const offY = DRAW_Y + (DRAW_H - fitH) / 2;
        pdf.addImage(imgData, 'JPEG', offX, offY, fitW, fitH);
    }

    // ── Vertical divider ──────────────────────────
    pdf.setDrawColor(30, 30, 30);
    pdf.setLineWidth(0.5);
    pdf.setLineDash([]);
    pdf.line(TB_X, MARGIN, TB_X, PH - MARGIN);

    // ── Logo ──────────────────────────────────────
    let logoData = null, logoAspect = 3.2;
    try {
        const r = await fetchLogoBase64WithSize();
        logoData   = r.data;
        logoAspect = r.aspect;
    } catch(e) { console.warn('Logo load failed:', e); }

    const logoAreaW = TB_W - 8;
    const logoAreaH = 22;
    let logoDrawW = logoAreaW;
    let logoDrawH = logoAreaW / logoAspect;
    if (logoDrawH > logoAreaH) { logoDrawH = logoAreaH; logoDrawW = logoAreaH * logoAspect; }
    const logoOffX = TB_X + 4 + (logoAreaW - logoDrawW) / 2;
    const logoOffY = MARGIN + 3;

    if (logoData) {
        pdf.addImage(logoData, 'PNG', logoOffX, logoOffY, logoDrawW, logoDrawH);
    } else {
        pdf.setFontSize(9); pdf.setFont('helvetica','bold');
        pdf.setTextColor(8,119,195);
        pdf.text('STRIKE POINT', TB_X + TB_W/2, MARGIN+12, {align:'center'});
    }

    let curY = MARGIN + logoDrawH + 6;

    // ── Helpers ───────────────────────────────────
    function hRule(y) {
        pdf.setDrawColor(160,160,160);
        pdf.setLineWidth(0.25);
        pdf.setLineDash([]);
        pdf.line(TB_X, y, TB_X + TB_W, y);
    }

    function infoBlock(label, content, startY, contentSize, blockH) {
        hRule(startY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica','bold');
        pdf.setTextColor(90,90,90);
        pdf.text(label.toUpperCase(), TB_X + 3, startY + 5);
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(contentSize);
        pdf.setTextColor(15,15,15);
        const lines = pdf.splitTextToSize(content, TB_W - 6);
        const lineH = contentSize * 0.48;
        let ty = startY + 5 + lineH + 1;
        lines.forEach(line => {
            if (ty < startY + blockH - 1) { pdf.text(line, TB_X + 3, ty); ty += lineH; }
        });
        return startY + blockH;
    }

    // Site Name
    curY = infoBlock('Site Name', siteName, curY, 9, 18);

    // Date box
    hRule(curY);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica','bold');
    pdf.setTextColor(90,90,90);
    pdf.text('DATE', TB_X + 3, curY + 5);
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(9);
    pdf.setTextColor(15,15,15);
    pdf.text(date, TB_X + 3, curY + 12);
    curY += 16;

    // Site Address
    curY = infoBlock('Site Address', address, curY, 8, 26);

    // Legend
    hRule(curY);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica','bold');
    pdf.setTextColor(90,90,90);
    pdf.text('LEGEND', TB_X + 3, curY + 5);

    const legendBottom = PH - MARGIN - 4;
    let ly = curY + 13;
    const ROW_H    = 9;
    const SWATCH_X = TB_X + 3;
    const LABEL_X  = TB_X + 18;
    const LABEL_W  = TB_W - 20;

    legend.forEach(item => {
        if (ly > legendBottom) return;

        if (item.kind === 'line') {
            const rgb = hexToRgb(item.colour);
            pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
            pdf.setLineWidth(item.dashed ? 0.6 : 1.0);
            pdf.setLineDash(item.dashed ? [2, 1.5] : []);
            pdf.line(SWATCH_X, ly - 1.5, SWATCH_X + 12, ly - 1.5);
            pdf.setLineDash([]);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','normal');
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(item.label, LABEL_W);
            lines.forEach((ln, i) => {
                if (ly + i * 4 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4);
            });
            ly += Math.max(ROW_H, lines.length * 4 + 2);

        } else if (item.kind === 'earth-std' || item.kind === 'earth-eq') {
            const ex = SWATCH_X + 6;
            pdf.setDrawColor(26,26,26);
            pdf.setLineWidth(0.7);
            pdf.setLineDash([]);
            pdf.line(ex, ly-7, ex, ly-3);
            pdf.line(ex-4, ly-3, ex+4, ly-3);
            pdf.line(ex-2.5, ly-1, ex+2.5, ly-1);
            pdf.line(ex-1.2, ly+0.5, ex+1.2, ly+0.5);
            if (item.kind === 'earth-eq') {
                pdf.setDrawColor(8,119,195);
                pdf.setLineWidth(0.4);
                pdf.circle(ex, ly-2, 5, 'S');
            }
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','normal');
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(item.label, LABEL_W);
            lines.forEach((ln, i) => {
                if (ly + i * 4 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4);
            });
            ly += Math.max(ROW_H, lines.length * 4 + 2);

        } else if (item.kind === 'mdb') {
            pdf.setDrawColor(26,26,26);
            pdf.setLineWidth(0.5);
            pdf.setLineDash([]);
            pdf.rect(SWATCH_X, ly-5.5, 11, 5);
            pdf.setFontSize(4.5);
            pdf.setFont('helvetica','bold');
            pdf.setTextColor(26,26,26);
            pdf.text('MDB', SWATCH_X+5.5, ly-2, {align:'center'});
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','normal');
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(item.label, LABEL_W);
            lines.forEach((ln, i) => {
                if (ly + i * 4 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4);
            });
            ly += Math.max(ROW_H, lines.length * 4 + 2);

        } else if (item.kind === 'bond') {
            const bx = SWATCH_X + 6;
            pdf.setDrawColor(26,26,26);
            pdf.setFillColor(26,26,26);
            pdf.setLineWidth(0.7);
            pdf.setLineDash([]);
            pdf.line(SWATCH_X, ly-2, bx-2, ly-2);
            pdf.circle(bx, ly-2, 2, 'F');
            pdf.line(bx+2, ly-2, SWATCH_X+12, ly-2);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','normal');
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(item.label, LABEL_W);
            lines.forEach((ln, i) => {
                if (ly + i * 4 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4);
            });
            ly += Math.max(ROW_H, lines.length * 4 + 2);

        } else if (item.kind === 'entrance') {
            const ex = SWATCH_X + 6;
            pdf.setDrawColor(8,119,195);
            pdf.setLineWidth(0.7);
            pdf.setLineDash([]);
            pdf.rect(SWATCH_X, ly-6, 12, 8, 'S');
            pdf.setFontSize(6.5);
            pdf.setFont('helvetica','bold');
            pdf.setTextColor(8,119,195);
            pdf.text('E', ex, ly-0.5, {align:'center'});
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','normal');
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(item.label, LABEL_W);
            lines.forEach((ln, i) => {
                if (ly + i * 4 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4);
            });
            ly += Math.max(ROW_H, lines.length * 4 + 2);
        }
    });

    // ── Close bottom border ───────────────────────
    hRule(PH - MARGIN);
}

// ── Helpers ────────────────────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function fetchLogoBase64WithSize() {
    const url = 'https://raw.githubusercontent.com/SPLP-2023/tool/refs/heads/main/assets/Color%20logo%20-%20no%20background%20(px%20reduction).png';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Logo fetch failed');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve({ data: reader.result, aspect: img.naturalWidth / img.naturalHeight });
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// PDF display date: dd/mm/yy
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y.slice(2)}`;
}

// Filename date: dd-mm-yy
function formatFilenameDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}-${m}-${y.slice(2)}`;
}

function hexToRgb(hex) {
    let h = hex.replace('#','');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return {r:0,g:0,b:0};
    return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) };
}

// ── Save drawing to report via localStorage ─────────────
function saveDrawingToReport() {
    const btn = document.getElementById('btnSaveToReport');
    btn.textContent = '⏳ Saving...';
    btn.disabled = true;

    try {
        const urlParams  = new URLSearchParams(window.location.search);
        const reportMode = urlParams.get('report');
        if (!reportMode) throw new Error('No report mode specified');

        const drawingCanvas = window.getDrawingCanvas ? window.getDrawingCanvas() : null;
        if (!drawingCanvas) throw new Error('No canvas found');

        const key = 'striker-drawing-' + reportMode;

        // Save the rendered image
        const imgData = drawingCanvas.toDataURL('image/jpeg', 0.85);
        localStorage.setItem(key, imgData);

        // Save the drawing state so it can be restored on edit
        const meta = window.getDrawingMeta ? window.getDrawingMeta() : {};
        const state = {
            elements:       typeof elements       !== 'undefined' ? elements       : [],
            earthCounter:   typeof earthCounter   !== 'undefined' ? earthCounter   : 0,
            mdbCounter:     typeof mdbCounter     !== 'undefined' ? mdbCounter     : 0,
            bondCounter:    typeof bondCounter    !== 'undefined' ? bondCounter    : 0,
            entrancePlaced: typeof entrancePlaced !== 'undefined' ? entrancePlaced : false,
            colourLegend:   typeof colourLegend   !== 'undefined' ? colourLegend   : {},
            siteName:       meta.siteName || '',
            address:        meta.address  || '',
            drawnBy:        meta.drawnBy  || '',
            date:           meta.date     || '',
            legend:         meta.legend   || []
        };
        localStorage.setItem(key + '-state', JSON.stringify(state));

        const REPORT_URLS = {
            survey:   'survey.html',
            ti:       't&i-report.html',
            remedial: 'remedial-report.html'
        };
        window.location.href = REPORT_URLS[reportMode] || 'reports.html';

    } catch (err) {
        console.error('Save to report failed:', err);
        alert('Failed to save drawing: ' + err.message);
        btn.textContent = '💾 Save to Report';
        btn.disabled = false;
    }
}
