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
        if (typeof window.jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

        const PW = pdf.internal.pageSize.getWidth();  // 420mm
        const PH = pdf.internal.pageSize.getHeight(); // 297mm

        const MARGIN = 8;
        const TB_W   = 75;
        const TB_X   = PW - MARGIN - TB_W;
        const DRAW_X = MARGIN;
        const DRAW_Y = MARGIN;
        const DRAW_W = TB_X - MARGIN - 4;
        const DRAW_H = PH - MARGIN * 2;

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

        // ── Drawing canvas — letterbox fit ─────────────
        const drawingCanvas = window.getDrawingCanvas ? window.getDrawingCanvas() : null;
        if (drawingCanvas) {
            const imgData  = drawingCanvas.toDataURL('image/jpeg', 0.92);
            const cW = drawingCanvas.width;
            const cH = drawingCanvas.height;
            const scaleX = DRAW_W / cW;
            const scaleY = DRAW_H / cH;
            const fit    = Math.min(scaleX, scaleY);
            const fitW   = cW * fit;
            const fitH   = cH * fit;
            const offX   = DRAW_X + (DRAW_W - fitW) / 2;
            const offY   = DRAW_Y + (DRAW_H - fitH) / 2;
            pdf.addImage(imgData, 'JPEG', offX, offY, fitW, fitH);
        }

        // ── Vertical divider ──────────────────────────
        pdf.setDrawColor(30, 30, 30);
        pdf.setLineWidth(0.5);
        pdf.line(TB_X, MARGIN, TB_X, PH - MARGIN);

        // ── Logo — preserve aspect ratio ─────────────
        let logoData = null;
        let logoAspect = 1;
        try {
            const result = await fetchLogoBase64WithSize();
            logoData   = result.data;
            logoAspect = result.aspect; // width / height
        } catch(e) {
            console.warn('Logo load failed:', e);
        }

        const logoAreaW = TB_W - 10;
        const logoAreaH = 28;
        let logoDrawW = logoAreaW;
        let logoDrawH = logoAreaW / logoAspect;
        if (logoDrawH > logoAreaH) {
            logoDrawH = logoAreaH;
            logoDrawW = logoAreaH * logoAspect;
        }
        const logoOffX = TB_X + 5 + (logoAreaW - logoDrawW) / 2;
        const logoOffY = MARGIN + 4;

        if (logoData) {
            pdf.addImage(logoData, 'PNG', logoOffX, logoOffY, logoDrawW, logoDrawH);
        } else {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(8, 119, 195);
            pdf.text('STRIKE POINT', TB_X + TB_W / 2, MARGIN + 14, { align: 'center' });
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('LIGHTNING PROTECTION LTD', TB_X + TB_W / 2, MARGIN + 19, { align: 'center' });
        }

        let curY = MARGIN + logoDrawH + 8;

        // ── Helpers ───────────────────────────────────
        function hRule(y) {
            pdf.setDrawColor(160, 160, 160);
            pdf.setLineWidth(0.25);
            pdf.setLineDash([]);
            pdf.line(TB_X, y, TB_X + TB_W, y);
        }

        function infoBlock(label, content, startY, labelSize, contentSize, blockH) {
            hRule(startY);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(100, 100, 100);
            pdf.text(label.toUpperCase(), TB_X + 3, startY + 5.5);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(contentSize);
            pdf.setTextColor(20, 20, 20);
            const lines = pdf.splitTextToSize(content, TB_W - 6);
            const lineH = contentSize * 0.45;
            let ty = startY + 5.5 + lineH + 1;
            lines.forEach(line => {
                if (ty < startY + blockH) {
                    pdf.text(line, TB_X + 3, ty);
                    ty += lineH;
                }
            });
            return startY + blockH;
        }

        // ── Site name ─────────────────────────────────
        curY = infoBlock('Site Name', siteName, curY, 7, 10, 20);
        // ── Site address ──────────────────────────────
        curY = infoBlock('Site Address', address, curY, 7, 9, 32);

        // ── Legend ────────────────────────────────────
        hRule(curY);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('LEGEND', TB_X + 3, curY + 5.5);

        const legendBottom = PH - MARGIN - 34;
        let ly = curY + 13; // extra gap below "LEGEND" heading

        legend.forEach(item => {
            if (ly > legendBottom) return;
            const rowH = 8.5;

            if (item.kind === 'line') {
                const rgb = hexToRgb(item.colour);
                pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
                pdf.setLineWidth(item.dashed ? 0.7 : 1.0);
                pdf.setLineDash(item.dashed ? [2, 1.5] : []);
                pdf.line(TB_X + 3, ly - 1.5, TB_X + 15, ly - 1.5);
                pdf.setLineDash([]);
                pdf.setFontSize(7.5);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(20, 20, 20);
                pdf.text(item.label, TB_X + 18, ly);

            } else if (item.kind === 'earth-std' || item.kind === 'earth-eq') {
                const ex = TB_X + 8;
                pdf.setDrawColor(26, 26, 26);
                pdf.setLineWidth(0.7);
                pdf.setLineDash([]);
                pdf.line(ex, ly - 7, ex, ly - 3);
                pdf.line(ex - 4.5, ly - 3, ex + 4.5, ly - 3);
                pdf.line(ex - 3,   ly - 0.5, ex + 3, ly - 0.5);
                pdf.line(ex - 1.5, ly + 1.5, ex + 1.5, ly + 1.5);
                if (item.kind === 'earth-eq') {
                    pdf.setDrawColor(8, 119, 195);
                    pdf.setLineWidth(0.5);
                    pdf.circle(ex, ly - 1.5, 5.5, 'S');
                }
                pdf.setFontSize(7.5);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(20, 20, 20);
                pdf.text(item.label, TB_X + 18, ly);

            } else if (item.kind === 'mdb') {
                pdf.setDrawColor(26, 26, 26);
                pdf.setLineWidth(0.6);
                pdf.setLineDash([]);
                pdf.rect(TB_X + 3, ly - 5.5, 11, 6);
                pdf.setFontSize(5);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(26, 26, 26);
                pdf.text('MDB', TB_X + 8.5, ly - 1.5, { align: 'center' });
                pdf.setFontSize(7.5);
                pdf.setFont('helvetica', 'normal');
                pdf.text(item.label, TB_X + 18, ly);

            } else if (item.kind === 'bond') {
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(26, 26, 26);
                pdf.text('⊷', TB_X + 4, ly);
                pdf.setFontSize(7.5);
                pdf.text(item.label, TB_X + 18, ly);
            }
            ly += rowH;
        });

        // ── Scale ─────────────────────────────────────
        const scaleY = PH - MARGIN - 30;
        hRule(scaleY);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('SCALE', TB_X + 3, scaleY + 5.5);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(20, 20, 20);
        pdf.text(scale, TB_X + 3, scaleY + 12);

        // ── Drawn By / Date ───────────────────────────
        const bottomY = PH - MARGIN - 17;
        hRule(bottomY);
        const midX = TB_X + TB_W / 2;

        pdf.setDrawColor(160, 160, 160);
        pdf.setLineWidth(0.25);
        pdf.line(midX, bottomY, midX, PH - MARGIN);

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('DRAWN BY', TB_X + 3, bottomY + 5.5);
        pdf.text('DATE',     midX + 3,  bottomY + 5.5);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(20, 20, 20);
        pdf.text(drawnBy.toUpperCase(), TB_X + 3, bottomY + 13);
        pdf.text(date,                  midX + 3,  bottomY + 13);

        hRule(PH - MARGIN);

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
            img.onload = () => resolve({
                data:   reader.result,
                aspect: img.naturalWidth / img.naturalHeight
            });
            img.onerror = reject;
            img.src = reader.result;
        };
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
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return { r:0, g:0, b:0 };
    return {
        r: parseInt(h.slice(0,2), 16),
        g: parseInt(h.slice(2,4), 16),
        b: parseInt(h.slice(4,6), 16)
    };
}
