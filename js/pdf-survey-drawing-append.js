// ── Survey PDF — Drawing Page Append ────────────────────
// Include AFTER pdf-generator-survey.js in survey.html.

(function () {
    const _original = window.generateSurveyPDF;

    window.generateSurveyPDF = function () {
        const drawingData = localStorage.getItem('striker-drawing-survey');

        if (!drawingData) {
            _original();
            return;
        }

        const { jsPDF: OriginalJsPDF } = window.jspdf;

        class PatchedJsPDF extends OriginalJsPDF {
            save(filename) {
                try {
                    // Add landscape A3 page (width=420, height=297 in mm)
                    this.addPage([420, 297], 'landscape');

                    const PW = 420, PH = 297, M = 8;

                    // Outer border
                    this.setDrawColor(30, 30, 30);
                    this.setLineWidth(0.4);
                    this.rect(M, M, PW - M * 2, PH - M * 2);

                    // Canvas dimensions are always 1400×900 — use these directly
                    // rather than reading naturalWidth from a fresh Image element
                    const cW    = 1400;
                    const cH    = 900;
                    const areaW = PW - M * 2;
                    const areaH = PH - M * 2;
                    const fit   = Math.min(areaW / cW, areaH / cH);
                    const fitW  = cW * fit;
                    const fitH  = cH * fit;
                    const offX  = M + (areaW - fitW) / 2;
                    const offY  = M + (areaH - fitH) / 2;

                    this.addImage(drawingData, 'JPEG', offX, offY, fitW, fitH);

                } catch (e) {
                    console.error('Drawing page append failed:', e);
                }
                super.save(filename);
            }
        }

        window.jspdf.jsPDF = PatchedJsPDF;
        try {
            _original();
        } finally {
            window.jspdf.jsPDF = OriginalJsPDF;
        }
    };
})();
