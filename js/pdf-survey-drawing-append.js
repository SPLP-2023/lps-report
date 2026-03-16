// ── Survey PDF — Drawing Page Append ────────────────────
// This file wraps generateSurveyPDF to append a drawing page if one is saved.
// Include AFTER pdf-generator-survey.js in survey.html.

(function() {
    const _originalGenerate = window.generateSurveyPDF;

    window.generateSurveyPDF = function() {
        // Run the original generator — it handles validation + save internally
        // We intercept by overriding pdf.save temporarily
        const drawingData = localStorage.getItem('striker-drawing-survey');
        if (!drawingData) {
            // No drawing — run as normal
            _originalGenerate();
            return;
        }

        // Patch jsPDF save to intercept before saving
        const { jsPDF } = window.jspdf;
        const _originalSave = jsPDF.prototype.save;

        jsPDF.prototype.save = function(filename) {
            // Restore original save immediately to avoid infinite loop
            jsPDF.prototype.save = _originalSave;

            try {
                // Add a new landscape A3 page for the drawing
                this.addPage('a3', 'landscape');

                const PW = this.internal.pageSize.getWidth();
                const PH = this.internal.pageSize.getHeight();
                const M  = 8;

                // Outer border
                this.setDrawColor(30, 30, 30);
                this.setLineWidth(0.4);
                this.rect(M, M, PW - M * 2, PH - M * 2);

                // Drawing image — fill the full page inside the border
                const img    = new Image();
                img.src      = drawingData;
                const cW     = img.naturalWidth  || 1400;
                const cH     = img.naturalHeight || 900;
                const areaW  = PW - M * 2;
                const areaH  = PH - M * 2;
                const fit    = Math.min(areaW / cW, areaH / cH);
                const fitW   = cW * fit;
                const fitH   = cH * fit;
                const offX   = M + (areaW - fitW) / 2;
                const offY   = M + (areaH - fitH) / 2;

                this.addImage(drawingData, 'JPEG', offX, offY, fitW, fitH);

            } catch(e) {
                console.error('Drawing append failed:', e);
            }

            // Now save with original method
            _originalSave.call(this, filename);
        };

        // Run original generator — it will call pdf.save() which we've patched
        _originalGenerate();
    };
})();
