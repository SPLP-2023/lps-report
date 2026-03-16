// ── Survey PDF — Drawing Page Append ────────────────────
// Replaces the wrapper approach with a direct override of generateSurveyPDF.
// Include AFTER pdf-generator-survey.js in survey.html.

(function () {
    // Wait until pdf-generator-survey.js has defined generateSurveyPDF
    const _original = window.generateSurveyPDF;

    window.generateSurveyPDF = async function () {
        const drawingData = localStorage.getItem('striker-drawing-survey');

        if (!drawingData) {
            // No drawing — run original unchanged
            _original();
            return;
        }

        // ── Patch: intercept pdf.save on the jsPDF instance ──
        // We temporarily override jsPDF so the instance created inside
        // generateSurveyPDF calls our wrapper instead of the real save.
        const { jsPDF: OriginalJsPDF } = window.jspdf;

        // Proxy class — same as jsPDF but save() appends drawing first
        class PatchedJsPDF extends OriginalJsPDF {
            save(filename) {
                try {
                    // Add landscape A3 page
                    this.addPage([420, 297], 'landscape');

                    const PW = 420, PH = 297, M = 8;

                    // Outer border
                    this.setDrawColor(30, 30, 30);
                    this.setLineWidth(0.4);
                    this.rect(M, M, PW - M * 2, PH - M * 2);

                    // Drawing image — letterbox fit inside border
                    const tmpImg    = new Image();
                    tmpImg.src      = drawingData;
                    const cW        = tmpImg.naturalWidth  || 1400;
                    const cH        = tmpImg.naturalHeight || 900;
                    const areaW     = PW - M * 2;
                    const areaH     = PH - M * 2;
                    const fit       = Math.min(areaW / cW, areaH / cH);
                    const fitW      = cW * fit;
                    const fitH      = cH * fit;
                    const offX      = M + (areaW - fitW) / 2;
                    const offY      = M + (areaH - fitH) / 2;
                    this.addImage(drawingData, 'JPEG', offX, offY, fitW, fitH);

                } catch (e) {
                    console.error('Drawing page append failed:', e);
                }
                // Now do the real save
                super.save(filename);
            }
        }

        // Temporarily replace jsPDF in the window.jspdf namespace
        window.jspdf.jsPDF = PatchedJsPDF;

        try {
            _original();
        } finally {
            // Always restore the original jsPDF
            window.jspdf.jsPDF = OriginalJsPDF;
        }
    };
})();
