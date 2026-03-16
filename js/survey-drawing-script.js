// ── Drawing tool integration ─────────────────────────────
const DRAWING_KEY = 'striker-drawing-survey';

function openDrawingTool() {
    window.location.href = 'drawing.html?report=survey';
}

function removeDrawing() {
    if (confirm('Remove the site drawing from this report?')) {
        localStorage.removeItem(DRAWING_KEY);
        updateDrawingPreview();
    }
}

function updateDrawingPreview() {
    const imgData = localStorage.getItem(DRAWING_KEY);
    const empty   = document.getElementById('drawingEmpty');
    const preview = document.getElementById('drawingPreview');
    const thumb   = document.getElementById('drawingThumb');
    if (imgData) {
        thumb.src         = imgData;
        empty.style.display   = 'none';
        preview.style.display = 'block';
    } else {
        empty.style.display   = 'block';
        preview.style.display = 'none';
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateDrawingPreview);
// Also run immediately in case DOMContentLoaded already fired
updateDrawingPreview();
