/* =====================================================
   STRIKER DRAWING TOOL — drawing-pdf.js
   ===================================================== */

async function exportDrawingPDF() {
    const btn = document.getElementById('btnExportPDF');
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;

    try {
        if (typeof window.jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

        const PW = pdf.internal.pageSize.getWidth();   // 420mm
        const PH = pdf.internal.pageSize.getHeight();  // 297mm

        const MARGIN  = 8;
        const TB_W    = 78;                             // title block width
        const TB_X    = PW - MARGIN - TB_W;
        const DRAW_X  = MARGIN;
        const DRAW_Y  = MARGIN;
        const DRAW_W  = TB_X - MARGIN - 8;             // extra gap so drawing never touches divider
        const DRAW_H  = PH - MARGIN * 2;

        const meta     = window.getDrawingMeta ? window.getDrawingMeta() : {};
        const siteName = meta.siteName || '';
        const address  = meta.address  || '';
        const drawnBy  = meta.drawnBy  || '';
        const date     = formatDate(meta.date);
        const scale    = meta.scale    || 'NOT TO SCALE';
        const legend   = meta.legend   || [];

        // ── Outer border ──────────────────────────────
        pdf.setDrawColor(30, 30, 30);
        pdf.setLineWidth(0.4);
        pdf.rect(MARGIN, MARGIN, PW - MARGIN * 2, PH - MARGIN * 2);

        // ── Drawing canvas — letterbox fit, slight inset ──
        const drawingCanvas = window.getDrawingCanvas ? window.getDrawingCanvas() : null;
        if (drawingCanvas) {
            const imgData = drawingCanvas.toDataURL('image/jpeg', 0.92);
            const cW = drawingCanvas.width;
            const cH = drawingCanvas.height;
            const fit = Math.min((DRAW_W - 4) / cW, DRAW_H / cH);
            const fitW = cW * fit;
            const fitH = cH * fit;
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

        const logoAreaW = TB_W - 10;
        const logoAreaH = 26;
        let logoDrawW = logoAreaW;
        let logoDrawH = logoAreaW / logoAspect;
        if (logoDrawH > logoAreaH) { logoDrawH = logoAreaH; logoDrawW = logoAreaH * logoAspect; }
        const logoOffX = TB_X + 5 + (logoAreaW - logoDrawW) / 2;
        const logoOffY = MARGIN + 4;

        if (logoData) {
            pdf.addImage(logoData, 'PNG', logoOffX, logoOffY, logoDrawW, logoDrawH);
        } else {
            pdf.setFontSize(11); pdf.setFont('helvetica','bold');
            pdf.setTextColor(8,119,195);
            pdf.text('STRIKE POINT', TB_X + TB_W/2, MARGIN+14, {align:'center'});
        }

        let curY = MARGIN + logoDrawH + 8;

        // ── Helpers ───────────────────────────────────
        function hRule(y) {
            pdf.setDrawColor(160,160,160);
            pdf.setLineWidth(0.25);
            pdf.setLineDash([]);
            pdf.line(TB_X, y, TB_X + TB_W, y);
        }

        function infoBlock(label, content, startY, contentSize, blockH) {
            hRule(startY);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica','bold');
            pdf.setTextColor(90,90,90);
            pdf.text(label.toUpperCase(), TB_X + 3, startY + 6);
            pdf.setFont('helvetica','normal');
            pdf.setFontSize(contentSize);
            pdf.setTextColor(15,15,15);
            const lines = pdf.splitTextToSize(content, TB_W - 6);
            const lineH = contentSize * 0.48;
            let ty = startY + 6 + lineH + 1.5;
            lines.forEach(line => {
                if (ty < startY + blockH - 1) { pdf.text(line, TB_X + 3, ty); ty += lineH; }
            });
            return startY + blockH;
        }

        curY = infoBlock('Site Name',    siteName, curY, 11, 22);

        // ── Date — own box directly under Site Name ───
        hRule(curY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica','bold');
        pdf.setTextColor(90,90,90);
        pdf.text('DATE', TB_X + 3, curY + 6);
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(10);
        pdf.setTextColor(15,15,15);
        pdf.text(date, TB_X + 3, curY + 14);
        curY += 20;

        curY = infoBlock('Site Address', address, curY, 10, 34);

        // ── Legend ────────────────────────────────────
        hRule(curY);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica','bold');
        pdf.setTextColor(90,90,90);
        pdf.text('LEGEND', TB_X + 3, curY + 6);

        const legendBottom = PH - MARGIN - 36;
        let ly = curY + 16;   // generous gap below heading
        const ROW_H = 11;     // row height per legend item
        const SWATCH_X = TB_X + 3;
        const LABEL_X  = TB_X + 20;
        const LABEL_W  = TB_W - 22;

        legend.forEach(item => {
            if (ly > legendBottom) return;

            if (item.kind === 'line') {
                const rgb = hexToRgb(item.colour);
                pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
                pdf.setLineWidth(item.dashed ? 0.7 : 1.2);
                pdf.setLineDash(item.dashed ? [2.5, 2] : []);
                pdf.line(SWATCH_X, ly - 2, SWATCH_X + 14, ly - 2);
                pdf.setLineDash([]);
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica','normal');
                pdf.setTextColor(15,15,15);
                const lines = pdf.splitTextToSize(item.label, LABEL_W);
                lines.forEach((ln, i) => {
                    if (ly + i * 4.5 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4.5);
                });
                ly += Math.max(ROW_H, lines.length * 4.5 + 3);

            } else if (item.kind === 'earth-std' || item.kind === 'earth-eq') {
                const ex = SWATCH_X + 7;
                pdf.setDrawColor(26,26,26);
                pdf.setLineWidth(0.8);
                pdf.setLineDash([]);
                pdf.line(ex, ly-8, ex, ly-4);
                pdf.line(ex-5, ly-4, ex+5, ly-4);
                pdf.line(ex-3.2, ly-1.5, ex+3.2, ly-1.5);
                pdf.line(ex-1.5, ly+0.5, ex+1.5, ly+0.5);
                if (item.kind === 'earth-eq') {
                    pdf.setDrawColor(8,119,195);
                    pdf.setLineWidth(0.5);
                    pdf.circle(ex, ly-2.5, 6, 'S');
                }
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica','normal');
                pdf.setTextColor(15,15,15);
                const lines = pdf.splitTextToSize(item.label, LABEL_W);
                lines.forEach((ln, i) => {
                    if (ly + i * 4.5 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4.5);
                });
                ly += Math.max(ROW_H, lines.length * 4.5 + 3);

            } else if (item.kind === 'mdb') {
                pdf.setDrawColor(26,26,26);
                pdf.setLineWidth(0.6);
                pdf.setLineDash([]);
                pdf.rect(SWATCH_X, ly-6.5, 12, 6);
                pdf.setFontSize(5.5);
                pdf.setFont('helvetica','bold');
                pdf.setTextColor(26,26,26);
                pdf.text('MDB', SWATCH_X+6, ly-2.5, {align:'center'});
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica','normal');
                pdf.setTextColor(15,15,15);
                const lines = pdf.splitTextToSize(item.label, LABEL_W);
                lines.forEach((ln, i) => {
                    if (ly + i * 4.5 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4.5);
                });
                ly += Math.max(ROW_H, lines.length * 4.5 + 3);

            } else if (item.kind === 'bond') {
                // Draw bond symbol as lines + filled circle (avoids Unicode font issues)
                const bx = SWATCH_X + 7;
                pdf.setDrawColor(26,26,26);
                pdf.setFillColor(26,26,26);
                pdf.setLineWidth(0.8);
                pdf.setLineDash([]);
                pdf.line(SWATCH_X, ly - 2, bx - 3, ly - 2);
                pdf.circle(bx, ly - 2, 2.5, 'F');
                pdf.line(bx + 3, ly - 2, SWATCH_X + 14, ly - 2);
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica','normal');
                pdf.setTextColor(15,15,15);
                const lines = pdf.splitTextToSize(item.label, LABEL_W);
                lines.forEach((ln, i) => {
                    if (ly + i * 4.5 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4.5);
                });
                ly += Math.max(ROW_H, lines.length * 4.5 + 3);

            } else if (item.kind === 'entrance') {
                // Draw E-in-square symbol
                const ex = SWATCH_X + 7;
                pdf.setDrawColor(8,119,195);
                pdf.setFillColor(8,119,195,0.12);
                pdf.setLineWidth(0.8);
                pdf.setLineDash([]);
                pdf.rect(SWATCH_X, ly - 7, 14, 10, 'S');
                pdf.setFontSize(8);
                pdf.setFont('helvetica','bold');
                pdf.setTextColor(8,119,195);
                pdf.text('E', ex, ly - 1, { align: 'center' });
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica','normal');
                pdf.setTextColor(15,15,15);
                const lines = pdf.splitTextToSize(item.label, LABEL_W);
                lines.forEach((ln, i) => {
                    if (ly + i * 4.5 < legendBottom) pdf.text(ln, LABEL_X, ly + i * 4.5);
                });
                ly += Math.max(ROW_H, lines.length * 4.5 + 3);
            }
        });

        // ── Close bottom border only ───────────────────
        hRule(PH - MARGIN);

        // ── Filename: LP Drawing - [SiteName] [dd-mm-yy] ─
        const fileDate = formatFilenameDate(meta.date);
        const cleanName = (siteName || 'Site').replace(/[^a-z0-9 ]/gi, '').trim();
        const fileName = `LP Drawing - ${cleanName} [${fileDate}].pdf`;
        pdf.save(fileName);

    } catch(err) {
        console.error('PDF export error:', err);
        alert('PDF generation failed: ' + err.message);
    } finally {
        btn.textContent = '⬇ Export PDF';
        btn.disabled = false;
    }
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

        // Save as JPEG base64 — kept at reasonable quality to avoid localStorage limits
        const imgData = drawingCanvas.toDataURL('image/jpeg', 0.85);

        const storageKey = 'striker-drawing-' + reportMode;
        localStorage.setItem(storageKey, imgData);

        // Navigate back to the report
        const REPORT_URLS = {
            survey:   'survey.html',
            ti:       't&i-report.html',
            remedial: 'remedial-report.html'
        };
        const returnUrl = REPORT_URLS[reportMode] || 'reports.html';
        window.location.href = returnUrl;

    } catch (err) {
        console.error('Save to report failed:', err);
        alert('Failed to save drawing: ' + err.message);
        btn.textContent = '💾 Save to Report';
        btn.disabled = false;
    }
}
