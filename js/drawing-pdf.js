/* =====================================================
   STRIKER DRAWING TOOL — drawing-pdf.js
   Exports drawing as landscape A3 PDF with
   Strike Point title block (right-hand panel)
   ===================================================== */

async function exportDrawingPDF() {
    const btn = document.getElementById('btnExportPDF');
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;

    try {
        // Load jsPDF if not already loaded
        if (typeof window.jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        // A3 landscape in mm
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

        const PW = pdf.internal.pageSize.getWidth();  // 420mm
        const PH = pdf.internal.pageSize.getHeight(); // 297mm

        // ── Layout constants ───────────────────────────
        const MARGIN   = 8;
        const TB_W     = 72;   // title block width (right side)
        const TB_X     = PW - MARGIN - TB_W;  // left edge of title block
        const DRAW_X   = MARGIN;
        const DRAW_Y   = MARGIN;
        const DRAW_W   = TB_X - MARGIN - 4;   // drawing area width
        const DRAW_H   = PH - MARGIN * 2;

        const meta = window.getDrawingMeta ? window.getDrawingMeta() : {};
        const siteName = meta.siteName || '';
        const address  = meta.address  || '';
        const drawnBy  = meta.drawnBy  || '';
        const date     = formatDate(meta.date);
        const scale    = meta.scale    || 'NOT TO SCALE';
        const legend   = meta.legend   || [];

        // ── Outer border ───────────────────────────────
        pdf.setDrawColor(30, 30, 30);
        pdf.setLineWidth(0.4);
        pdf.rect(MARGIN, MARGIN, PW - MARGIN * 2, PH - MARGIN * 2);

        // ── Drawing canvas image ───────────────────────
        const drawingCanvas = window.getDrawingCanvas ? window.getDrawingCanvas() : null;
        if (drawingCanvas) {
            const imgData = drawingCanvas.toDataURL('image/jpeg', 0.92);
            pdf.addImage(imgData, 'JPEG', DRAW_X, DRAW_Y, DRAW_W, DRAW_H);
        }

        // ── Vertical divider ───────────────────────────
        pdf.setDrawColor(30, 30, 30);
        pdf.setLineWidth(0.5);
        pdf.line(TB_X, MARGIN, TB_X, PH - MARGIN);

        // ── TITLE BLOCK (right panel) ──────────────────
        const tbY = MARGIN;
        const tbH = PH - MARGIN * 2;

        // Load Strike Point logo
        let logoData = null;
        try {
            logoData = await fetchLogoBase64();
        } catch(e) {
            console.warn('Logo load failed:', e);
        }

        // ── Logo + company block ───────────────────────
        const logoH = 28;
        if (logoData) {
            pdf.addImage(logoData, 'PNG', TB_X + 6, tbY + 4, TB_W - 12, logoH);
        } else {
            // Fallback text
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(8, 119, 195);
            pdf.text('STRIKE POINT', TB_X + TB_W / 2, tbY + 14, { align: 'center' });
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('LIGHTNING PROTECTION LTD', TB_X + TB_W / 2, tbY + 19, { align: 'center' });
        }

        let curY = tbY + logoH + 6;

        // ── Horizontal rule ────────────────────────────
        function hRule(y) {
            pdf.setDrawColor(180, 180, 180);
            pdf.setLineWidth(0.25);
            pdf.line(TB_X, y, TB_X + TB_W, y);
            return y;
        }

        // ── Label + content block ──────────────────────
        function infoBlock(label, content, startY, maxH) {
            hRule(startY);
            pdf.setFontSize(6.5);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(80, 80, 80);
            pdf.text(label.toUpperCase(), TB_X + 3, startY + 5);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(30, 30, 30);
            const lines = pdf.splitTextToSize(content, TB_W - 6);
            const lineH = 4.5;
            let ty = startY + 10;
            lines.forEach(line => {
                if (ty < startY + maxH) {
                    pdf.text(line, TB_X + 3, ty);
                    ty += lineH;
                }
            });
            return startY + maxH;
        }

        // Site name
        curY = infoBlock('Project Name', siteName, curY, 18);
        // Address
        curY = infoBlock('Project Address', address, curY, 30);

        // ── Legend block ───────────────────────────────
        hRule(curY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('LEGEND', TB_X + 3, curY + 5);

        let ly = curY + 10;
        const legendBottom = PH - MARGIN - 40; // leave room for scale/drawn by/date

        legend.forEach(item => {
            if (ly > legendBottom) return;

            if (item.kind === 'line') {
                // Draw line swatch
                const r = hexToRgb(item.colour);
                pdf.setDrawColor(r.r, r.g, r.b);
                pdf.setLineWidth(item.dashed ? 0.8 : 1.0);
                if (item.dashed) pdf.setLineDash([2, 1.5]);
                else pdf.setLineDash([]);
                pdf.line(TB_X + 3, ly - 1, TB_X + 14, ly - 1);
                pdf.setLineDash([]);

                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(30, 30, 30);
                pdf.text(item.label, TB_X + 16, ly);
                ly += 6;

            } else if (item.kind === 'earth-std' || item.kind === 'earth-eq') {
                // Draw earth symbol inline
                const ex = TB_X + 7;
                pdf.setDrawColor(26, 26, 26);
                pdf.setLineWidth(0.8);
                pdf.setLineDash([]);
                pdf.line(ex, ly - 6, ex, ly - 2);
                pdf.line(ex - 4, ly - 2, ex + 4, ly - 2);
                pdf.line(ex - 2.5, ly + 0.5, ex + 2.5, ly + 0.5);
                pdf.line(ex - 1, ly + 2.5, ex + 1, ly + 2.5);
                if (item.kind === 'earth-eq') {
                    pdf.setDrawColor(8, 119, 195);
                    pdf.setLineWidth(0.5);
                    pdf.circle(ex, ly - 0.5, 5, 'S');
                }
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(30, 30, 30);
                pdf.text(item.label, TB_X + 16, ly);
                ly += 8;

            } else if (item.kind === 'mdb') {
                pdf.setDrawColor(26, 26, 26);
                pdf.setLineWidth(0.6);
                pdf.setLineDash([]);
                pdf.rect(TB_X + 3, ly - 5, 10, 5);
                pdf.setFontSize(5.5);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(26, 26, 26);
                pdf.text('MDB', TB_X + 8, ly - 1.5, { align: 'center' });
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.text(item.label, TB_X + 16, ly);
                ly += 7;

            } else if (item.kind === 'bond') {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(26, 26, 26);
                pdf.text('⊷', TB_X + 3, ly);
                pdf.setFontSize(7);
                pdf.text(item.label, TB_X + 16, ly);
                ly += 7;
            }
        });

        // ── Bottom info blocks ─────────────────────────
        const bottomY = PH - MARGIN - 30;

        // Scale
        hRule(bottomY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('SCALE', TB_X + 3, bottomY + 5);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        pdf.text(scale, TB_X + 3, bottomY + 11);

        // Drawn by + date (split row)
        const drawnY = bottomY + 17;
        hRule(drawnY);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('DRAWN BY', TB_X + 3, drawnY + 5);
        pdf.text('DATE', TB_X + TB_W / 2 + 2, drawnY + 5);

        // Vertical split
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.25);
        pdf.line(TB_X + TB_W / 2, drawnY, TB_X + TB_W / 2, PH - MARGIN);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text(drawnBy.toUpperCase(), TB_X + 3, drawnY + 12);
        pdf.text(date, TB_X + TB_W / 2 + 2, drawnY + 12);

        // Bottom outer rule
        hRule(PH - MARGIN);

        // ── Save ───────────────────────────────────────
        const fileName = (siteName || 'site-drawing').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-drawing.pdf';
        pdf.save(fileName);

    } catch (err) {
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
        s.src = src;
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function fetchLogoBase64() {
    const url = 'https://raw.githubusercontent.com/SPLP-2023/tool/refs/heads/main/assets/Color%20logo%20-%20no%20background%20(px%20reduction).png';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Logo fetch failed');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}-${m}-${y.slice(2)}`;
}

function hexToRgb(hex) {
    // Normalise shorthand hex e.g. #222 -> #222222, #abc -> #aabbcc
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0]+h[0] + h[1]+h[1] + h[2]+h[2];
    }
    if (h.length !== 6) return { r: 0, g: 0, b: 0 }; // fallback black
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
}
