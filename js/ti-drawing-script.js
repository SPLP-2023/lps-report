// ── Drawing Tool Integration — T&I Report ───────────────
const DRAWING_KEY = 'striker-drawing-ti';

function openDrawingTool() {
    window.location.href = 'drawing.html?report=ti';
}

function removeDrawing() {
    if (confirm('Remove the site drawing from this report?')) {
        localStorage.removeItem(DRAWING_KEY);
        localStorage.removeItem(DRAWING_KEY + '-state');
        updateDrawingPreview();
    }
}

function updateDrawingPreview() {
    const imgData = localStorage.getItem(DRAWING_KEY);
    const empty   = document.getElementById('drawingEmpty');
    const preview = document.getElementById('drawingPreview');
    const thumb   = document.getElementById('drawingThumb');
    if (!empty || !preview) return;
    if (imgData) {
        if (thumb) thumb.src = imgData;
        empty.style.display   = 'none';
        preview.style.display = 'block';
    } else {
        empty.style.display   = 'block';
        preview.style.display = 'none';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDrawingPreview);
} else {
    updateDrawingPreview();
}
