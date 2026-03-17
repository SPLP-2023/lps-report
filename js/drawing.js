/* =====================================================
   STRIKER DRAWING TOOL — drawing.js
   Canvas engine: tools, undo/redo, symbols, grid
   ===================================================== */

// ── Canvas setup ──────────────────────────────────────
const bgCanvas      = document.getElementById('bgCanvas');
const mainCanvas    = document.getElementById('mainCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const bgCtx         = bgCanvas.getContext('2d');
const mainCtx       = mainCanvas.getContext('2d');
const previewCtx    = previewCanvas.getContext('2d');

const CANVAS_W = 1400;
const CANVAS_H = 900;

[bgCanvas, mainCanvas, previewCanvas].forEach(c => {
    c.width  = CANVAS_W;
    c.height = CANVAS_H;
});

// ── State ─────────────────────────────────────────────
let currentTool   = 'freehand';
let lineStyle     = 'solid';   // 'solid' | 'dashed'
let currentColour = '#222222';
let lineWidth     = 2;
let earthType     = 'standard'; // 'standard' | 'eq'
let snapToGrid    = false;
let showGrid      = false;
let gridSize      = 25;
let bgImage       = null;
let bgOpacity     = 0.4;
let bgLocked      = true;   // locked by default — drawing works over bg

// Background image transform state
let bgX = 0, bgY = 0;
let bgW = 0, bgH = 0;
let bgRotation = 0;
let bgDragging = false;
let bgResizing = false;
let bgDragStartX = 0, bgDragStartY = 0;
let bgDragOriginX = 0, bgDragOriginY = 0;
let bgResizeStartX = 0, bgResizeStartY = 0;
let bgResizeOriginW = 0, bgResizeOriginH = 0;
const BG_HANDLE = 18;

// Pinch-to-zoom state (mobile bg editing)
let pinchActive       = false;
let pinchStartDist    = 0;
let pinchStartAngle   = 0;
let pinchStartW       = 0;
let pinchStartRotation = 0;

// Drawing state
let isDrawing     = false;
let startX = 0, startY = 0;
let currentPath   = [];  // for freehand

// Elements (the persistent drawn objects)
let elements = [];       // committed
let undoStack = [];      // for redo
let selectedIndex = -1;  // index of selected element

// Counters
let earthCounter    = 0;
let mdbCounter      = 0;
let bondCounter     = 0;
let entrancePlaced  = false;  // only one entrance allowed

// Custom colour legend tracking
let colourLegend = {}; // colour -> label string

// ── Canvas sizing ──────────────────────────────────────
function resizeCanvasWrapper() {
    // Canvases are fixed size; wrapper scrolls
}

// ── Grid & background render ────────────────────────────
function drawGrid() {
    bgCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (bgImage) {
        bgCtx.save();
        bgCtx.globalAlpha = bgOpacity;
        const cx = bgX + bgW / 2;
        const cy = bgY + bgH / 2;
        bgCtx.translate(cx, cy);
        bgCtx.rotate(bgRotation * Math.PI / 180);
        bgCtx.drawImage(bgImage, -bgW / 2, -bgH / 2, bgW, bgH);
        bgCtx.restore();
        bgCtx.globalAlpha = 1;

        // Only show edit handles when unlocked
        if (!bgLocked) {
            bgCtx.save();
            bgCtx.translate(bgX + bgW / 2, bgY + bgH / 2);
            bgCtx.rotate(bgRotation * Math.PI / 180);

            // Dashed border
            bgCtx.strokeStyle = '#0877c3';
            bgCtx.lineWidth = 2;
            bgCtx.setLineDash([8, 5]);
            bgCtx.strokeRect(-bgW / 2, -bgH / 2, bgW, bgH);
            bgCtx.setLineDash([]);

            // Resize handle — bottom-right corner
            const hx = bgW / 2 - BG_HANDLE;
            const hy = bgH / 2 - BG_HANDLE;
            bgCtx.fillStyle = '#0877c3';
            bgCtx.fillRect(hx, hy, BG_HANDLE, BG_HANDLE);
            bgCtx.strokeStyle = 'white';
            bgCtx.lineWidth = 1.5;
            bgCtx.strokeRect(hx, hy, BG_HANDLE, BG_HANDLE);
            // Arrow icon in handle
            bgCtx.fillStyle = 'white';
            bgCtx.font = 'bold 11px Arial';
            bgCtx.textAlign = 'center';
            bgCtx.textBaseline = 'middle';
            bgCtx.fillText('⤡', hx + BG_HANDLE / 2, hy + BG_HANDLE / 2);

            // Move indicator at centre
            bgCtx.fillStyle = 'rgba(8,119,195,0.3)';
            bgCtx.beginPath();
            bgCtx.arc(0, 0, 14, 0, Math.PI * 2);
            bgCtx.fill();
            bgCtx.fillStyle = 'white';
            bgCtx.font = '14px Arial';
            bgCtx.fillText('✥', 0, 0);

            bgCtx.restore();
        }
    }

    // Grid — only shown on screen, never in PDF
    if (showGrid) {
        bgCtx.strokeStyle = 'rgba(8,119,195,0.12)';
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        for (let x = 0; x <= CANVAS_W; x += gridSize) {
            bgCtx.moveTo(x, 0); bgCtx.lineTo(x, CANVAS_H);
        }
        for (let y = 0; y <= CANVAS_H; y += gridSize) {
            bgCtx.moveTo(0, y); bgCtx.lineTo(CANVAS_W, y);
        }
        bgCtx.stroke();
    }
}

function toggleGrid(val) {
    showGrid = val;
    drawGrid();
}

function toggleSnap(val) {
    snapToGrid = val;
}

function setGridSize(val) {
    gridSize = parseInt(val);
    drawGrid();
}

function snap(v) {
    if (!snapToGrid) return v;
    return Math.round(v / gridSize) * gridSize;
}

// ── Background image ───────────────────────────────────
function loadBackground(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            bgImage = img;
            const scale = Math.min(CANVAS_W * 0.8 / img.width, CANVAS_H * 0.8 / img.height, 1);
            bgW = img.width  * scale;
            bgH = img.height * scale;
            bgX = (CANVAS_W - bgW) / 2;
            bgY = (CANVAS_H - bgH) / 2;
            bgRotation = 0;
            // Lock immediately after upload
            bgLocked = true;
            updateBgLockUI();
            drawGrid();
            document.getElementById('opacityCtrl').style.display    = 'flex';
            document.getElementById('btnClearBg').style.display     = 'inline-block';
            document.getElementById('bgEditControls').style.display = 'flex';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearBackground() {
    bgImage = null;
    bgX = bgY = bgW = bgH = bgRotation = 0;
    bgLocked = true;
    drawGrid();
    document.getElementById('opacityCtrl').style.display    = 'none';
    document.getElementById('btnClearBg').style.display     = 'none';
    document.getElementById('bgEditControls').style.display = 'none';
    document.getElementById('bgRotateControls').style.display = 'none';
    document.getElementById('bgUpload').value = '';
}

function setBgOpacity(val) {
    bgOpacity = parseInt(val) / 100;
    document.getElementById('bgOpacityLabel').textContent = val + '%';
    drawGrid();
}

function rotateBg(deg) {
    if (bgLocked) return;
    bgRotation = (bgRotation + deg) % 360;
    drawGrid();
}

function toggleBgLock() {
    bgLocked = !bgLocked;
    updateBgLockUI();
    drawGrid();
}

function updateBgLockUI() {
    const btn = document.getElementById('btnBgLock');
    if (!btn) return;
    if (bgLocked) {
        btn.textContent = '🔓 Edit BG';
        btn.classList.remove('btn-warning');
        btn.classList.add('small-btn');
        document.getElementById('bgRotateControls').style.display = 'none';
    } else {
        btn.textContent = '🔒 Lock BG';
        btn.classList.add('btn-warning');
        document.getElementById('bgRotateControls').style.display = 'flex';
    }
}

// ── Background image hit testing ───────────────────────
function getBgResizeHandlePos() {
    // Returns canvas coords of the resize handle centre (bottom-right of image, rotated)
    const rad = bgRotation * Math.PI / 180;
    const cx  = bgX + bgW / 2;
    const cy  = bgY + bgH / 2;
    const lx  = bgW / 2 - BG_HANDLE / 2 + BG_HANDLE / 2;
    const ly  = bgH / 2 - BG_HANDLE / 2 + BG_HANDLE / 2;
    return {
        x: cx + lx * Math.cos(rad) - ly * Math.sin(rad),
        y: cy + lx * Math.sin(rad) + ly * Math.cos(rad)
    };
}

function isOnBgHandle(x, y) {
    if (!bgImage) return false;
    const h = getBgResizeHandlePos();
    return Math.hypot(x - h.x, y - h.y) < BG_HANDLE;
}

function isOnBgImage(x, y) {
    if (!bgImage) return false;
    // Transform point into image local space
    const rad = -bgRotation * Math.PI / 180;
    const cx = bgX + bgW / 2;
    const cy = bgY + bgH / 2;
    const dx = x - cx, dy = y - cy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return lx >= -bgW / 2 && lx <= bgW / 2 && ly >= -bgH / 2 && ly <= bgH / 2;
}

// ── Tool selection ─────────────────────────────────────
function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + tool);
    if (btn) btn.classList.add('active');
    deselectAll();

    // Show/hide sub-options
    document.getElementById('line-style-opts').style.display =
        (tool === 'freehand' || tool === 'line') ? 'block' : 'none';
    document.getElementById('earth-type-opts').style.display =
        (tool === 'earth') ? 'block' : 'none';

    // Cursor
    const cursorMap = {
        freehand: 'crosshair', line: 'crosshair', rect: 'crosshair',
        circle: 'crosshair', triangle: 'crosshair', earth: 'copy',
        mdb: 'copy', bond: 'copy', entrance: 'copy', select: 'default', eraser: 'cell'
    };
    previewCanvas.style.cursor = cursorMap[tool] || 'crosshair';
}

function setLineStyle(style) {
    lineStyle = style;
    document.getElementById('style-solid').classList.toggle('active', style === 'solid');
    document.getElementById('style-dashed').classList.toggle('active', style === 'dashed');
    // Dashed = always red
    if (style === 'dashed') {
        currentColour = '#e74c3c';
        document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('active'));
    }
}

function setColour(btn) {
    currentColour = btn.dataset.colour;
    lineStyle = 'solid'; // colour pick resets to solid
    document.getElementById('style-solid').classList.add('active');
    document.getElementById('style-dashed').classList.remove('active');
    document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    // Register custom colour in legend if not standard
    const standards = ['#222222', '#e74c3c', '#2980b9', '#27ae60', '#f39c12'];
    if (!standards.includes(currentColour)) {
        registerColourLegend(currentColour);
    }
}

function setCustomColour(val) {
    currentColour = val;
    lineStyle = 'solid';
    document.getElementById('style-solid').classList.add('active');
    document.getElementById('style-dashed').classList.remove('active');
    document.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('active'));
    document.getElementById('customColourBtn').classList.add('active');
    registerColourLegend(val);
}

function setLineWidth(val) {
    lineWidth = parseInt(val);
    document.getElementById('lineWidthLabel').textContent = val + 'px';
}

function setEarthType(type) {
    earthType = type;
    document.getElementById('earthTypeStd').classList.toggle('active', type === 'standard');
    document.getElementById('earthTypeEQ').classList.toggle('active', type === 'eq');
}

// ── Pointer helpers ────────────────────────────────────
function getPos(e) {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return {
        x:  snap((clientX - rect.left) * scaleX),
        y:  snap((clientY - rect.top)  * scaleY),
        rx: (clientX - rect.left) * scaleX,
        ry: (clientY - rect.top)  * scaleY
    };
}

function getTouchCanvasPos(touch) {
    const rect = previewCanvas.getBoundingClientRect();
    return {
        rx: (touch.clientX - rect.left) * (CANVAS_W / rect.width),
        ry: (touch.clientY - rect.top)  * (CANVAS_H / rect.height)
    };
}

function pinchDist(t0, t1) {
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    return Math.sqrt(dx*dx + dy*dy);
}

function pinchAngle(t0, t1) {
    return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX) * 180 / Math.PI;
}

// ── Pointer events ─────────────────────────────────────
const wrapper = document.getElementById('canvasWrapper');
const zoomContainer = document.getElementById('canvasZoomContainer');

// Zoom state (mobile only)
let viewScale    = 1;
let viewOffsetX  = 0;
let viewOffsetY  = 0;

// Pinch state
let pinchStartDist2   = 0;
let pinchStartScale   = 1;
let pinchStartMidX    = 0;
let pinchStartMidY    = 0;
let pinchStartOffsetX = 0;
let pinchStartOffsetY = 0;

function applyZoom() {
    if (window.innerWidth > 768) return;
    zoomContainer.style.transform =
        `translate(${viewOffsetX}px, ${viewOffsetY}px) scale(${viewScale})`;
}

previewCanvas.addEventListener('mousedown',  onPointerDown);
previewCanvas.addEventListener('mousemove',  onPointerMove);
previewCanvas.addEventListener('mouseup',    onPointerUp);
previewCanvas.addEventListener('mouseleave', onPointerUp);

previewCanvas.addEventListener('touchstart', e => {
    e.preventDefault();

    if (e.touches.length === 2) {
        if (!bgLocked && bgImage) {
            // Edit BG mode — pinch manipulates BG image
            pinchActive        = true;
            pinchStartDist     = pinchDist(e.touches[0], e.touches[1]);
            pinchStartAngle    = pinchAngle(e.touches[0], e.touches[1]);
            pinchStartW        = bgW;
            pinchStartRotation = bgRotation;
        } else {
            // Normal mode — two fingers zoom+pan the canvas view
            pinchStartDist2   = pinchDist(e.touches[0], e.touches[1]);
            pinchStartScale   = viewScale;
            pinchStartOffsetX = viewOffsetX;
            pinchStartOffsetY = viewOffsetY;
            // Mid point in screen coords
            pinchStartMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            pinchStartMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            twoFingerPanning = true;
        }
        return;
    }
    onPointerDown(e);
}, { passive: false });

previewCanvas.addEventListener('touchmove', e => {
    e.preventDefault();

    if (e.touches.length === 2) {
        if (pinchActive && !bgLocked && bgImage) {
            // Edit BG mode
            const dist  = pinchDist(e.touches[0], e.touches[1]);
            const angle = pinchAngle(e.touches[0], e.touches[1]);
            const scale = dist / pinchStartDist;
            const ratio = bgH / bgW;
            bgW = Math.max(50, pinchStartW * scale);
            bgH = bgW * ratio;
            bgRotation = pinchStartRotation + (angle - pinchStartAngle);
            drawGrid();
        } else if (twoFingerPanning) {
            // Canvas zoom + pan
            const dist  = pinchDist(e.touches[0], e.touches[1]);
            const midX  = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY  = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const scaleRatio = dist / pinchStartDist2;
            const newScale   = Math.min(5, Math.max(1, pinchStartScale * scaleRatio));

            // Pan: move offset by how much the mid point moved
            const dPanX = midX - pinchStartMidX;
            const dPanY = midY - pinchStartMidY;

            viewScale   = newScale;
            viewOffsetX = pinchStartOffsetX + dPanX;
            viewOffsetY = pinchStartOffsetY + dPanY;

            // When zoomed back to 1x, snap offset to 0
            if (viewScale <= 1.02) {
                viewScale   = 1;
                viewOffsetX = 0;
                viewOffsetY = 0;
            }

            applyZoom();
        }
        return;
    }
    onPointerMove(e);
}, { passive: false });

previewCanvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (pinchActive) { pinchActive = false; return; }
    if (twoFingerPanning) { twoFingerPanning = false; return; }
    const syntheticE = { touches: e.changedTouches };
    onPointerUp(syntheticE);
}, { passive: false });

let twoFingerPanning = false;
let panLastX = 0, panLastY = 0;

function onPointerDown(e) {
    if (e.touches && e.touches.length === 2) return;
    const pos = getPos(e);

    // BG interactions only allowed when unlocked
    if (!bgLocked && bgImage) {
        if (isOnBgHandle(pos.rx, pos.ry)) {
            bgResizing = true;
            bgResizeStartX  = pos.rx;
            bgResizeStartY  = pos.ry;
            bgResizeOriginW = bgW;
            bgResizeOriginH = bgH;
            return;
        }
        if (isOnBgImage(pos.rx, pos.ry)) {
            bgDragging    = true;
            bgDragStartX  = pos.rx;
            bgDragStartY  = pos.ry;
            bgDragOriginX = bgX;
            bgDragOriginY = bgY;
            return;
        }
    }

    // Normal drawing tools (always work when bg is locked)
    if (currentTool === 'select') { handleSelect(pos.x, pos.y); return; }
    if (currentTool === 'eraser') { handleErase(pos.x, pos.y);  return; }
    if (['earth', 'mdb', 'bond', 'entrance'].includes(currentTool)) { placeSymbol(pos.x, pos.y); return; }

    isDrawing = true;
    startX = pos.x;
    startY = pos.y;
    if (currentTool === 'freehand') currentPath = [{ x: pos.x, y: pos.y }];
}

function onPointerMove(e) {
    const pos = getPos(e);

    if (bgResizing && !bgLocked) {
        const dx = pos.rx - bgResizeStartX;
        const ratio = bgResizeOriginH / bgResizeOriginW;
        bgW = Math.max(50, bgResizeOriginW + dx);
        bgH = bgW * ratio;
        drawGrid();
        return;
    }
    if (bgDragging && !bgLocked) {
        bgX = bgDragOriginX + (pos.rx - bgDragStartX);
        bgY = bgDragOriginY + (pos.ry - bgDragStartY);
        drawGrid();
        return;
    }

    if (!isDrawing) return;
    previewCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (currentTool === 'freehand') {
        currentPath.push({ x: pos.x, y: pos.y });
        drawFreehandPreview();
    } else {
        drawShapePreview(startX, startY, pos.x, pos.y);
    }
}

function onPointerUp(e) {
    if (bgResizing || bgDragging) {
        bgResizing = false;
        bgDragging = false;
        return;
    }
    if (!isDrawing) return;
    isDrawing = false;
    previewCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const pos = getPos(e);

    if (currentTool === 'freehand' && currentPath.length > 1) {
        commitElement({ type:'freehand', path:[...currentPath],
            colour: lineStyle==='dashed' ? '#e74c3c' : currentColour,
            dashed: lineStyle==='dashed', width: lineWidth });
        currentPath = [];
    } else if (currentTool === 'line') {
        if (Math.abs(pos.x-startX) > 2 || Math.abs(pos.y-startY) > 2) {
            commitElement({ type:'line', x1:startX, y1:startY, x2:pos.x, y2:pos.y,
                colour: lineStyle==='dashed' ? '#e74c3c' : currentColour,
                dashed: lineStyle==='dashed', width: lineWidth });
        }
    } else if (['rect','circle','triangle'].includes(currentTool)) {
        const w = pos.x - startX, h = pos.y - startY;
        if (Math.abs(w) > 3 && Math.abs(h) > 3) {
            commitElement({ type:currentTool, x:startX, y:startY, w, h,
                colour:currentColour, width:lineWidth });
        }
    }
    undoStack = [];
    updateLegend();
}

// ── Preview drawing ────────────────────────────────────
function applyLineStyle(ctx, dashed) {
    ctx.setLineDash(dashed ? [10, 6] : []);
}

function drawFreehandPreview() {
    previewCtx.beginPath();
    previewCtx.strokeStyle = lineStyle === 'dashed' ? '#e74c3c' : currentColour;
    previewCtx.lineWidth   = lineWidth;
    previewCtx.lineCap     = 'round';
    previewCtx.lineJoin    = 'round';
    applyLineStyle(previewCtx, lineStyle === 'dashed');
    previewCtx.moveTo(currentPath[0].x, currentPath[0].y);
    currentPath.forEach(p => previewCtx.lineTo(p.x, p.y));
    previewCtx.stroke();
}

function drawShapePreview(x1, y1, x2, y2) {
    const ctx = previewCtx;
    ctx.strokeStyle = lineStyle === 'dashed' ? '#e74c3c' : currentColour;
    ctx.lineWidth   = lineWidth;
    ctx.lineCap     = 'round';
    applyLineStyle(ctx, lineStyle === 'dashed');

    if (currentTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    } else if (currentTool === 'rect') {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (currentTool === 'circle') {
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (currentTool === 'triangle') {
        ctx.beginPath();
        ctx.moveTo((x1 + x2) / 2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
        ctx.stroke();
    }
}

// ── Commit element ─────────────────────────────────────
function commitElement(el) {
    elements.push(el);
    redrawMain();
}

// ── Symbol placement ───────────────────────────────────
function placeSymbol(x, y) {
    if (currentTool === 'earth') {
        earthCounter++;
        const label = 'E' + earthCounter;
        commitElement({ type: 'earth', x, y, eq: earthType === 'eq', label });
        document.getElementById('nextEarthLabel').textContent = 'E' + (earthCounter + 1);
        document.getElementById('earthCountDisplay').textContent = earthCounter;
    } else if (currentTool === 'mdb') {
        mdbCounter++;
        commitElement({ type: 'mdb', x, y, label: 'MDB' + (mdbCounter > 1 ? mdbCounter : '') });
    } else if (currentTool === 'bond') {
        bondCounter++;
        commitElement({ type: 'bond', x, y, label: 'B' + bondCounter });
    } else if (currentTool === 'entrance') {
        if (entrancePlaced) {
            alert('Only one entrance can be placed per drawing. Delete the existing entrance to move it.');
            return;
        }
        entrancePlaced = true;
        commitElement({ type: 'entrance', x, y, label: 'ENT' });
        // Disable the button to signal it's been used
        const btn = document.getElementById('tool-entrance');
        if (btn) btn.classList.add('tool-used');
        const mobBtn = document.getElementById('mob-entrance');
        if (mobBtn) mobBtn.classList.add('tool-used');
    }
    undoStack = [];
    updateLegend();
}

// ── Draw element ───────────────────────────────────────
function drawElement(ctx, el, selected) {
    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    if (selected) {
        ctx.shadowColor = '#0877c3';
        ctx.shadowBlur  = 10;
    }

    switch (el.type) {
        case 'freehand': {
            ctx.beginPath();
            ctx.strokeStyle = el.colour;
            ctx.lineWidth   = el.width;
            applyLineStyle(ctx, el.dashed);
            ctx.moveTo(el.path[0].x, el.path[0].y);
            el.path.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            break;
        }
        case 'line': {
            ctx.beginPath();
            ctx.strokeStyle = el.colour;
            ctx.lineWidth   = el.width;
            applyLineStyle(ctx, el.dashed);
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
            break;
        }
        case 'rect': {
            ctx.strokeStyle = el.colour;
            ctx.lineWidth   = el.width;
            ctx.setLineDash([]);
            ctx.strokeRect(el.x, el.y, el.w, el.h);
            if (selected) {
                ctx.fillStyle = 'rgba(8,119,195,0.08)';
                ctx.fillRect(el.x, el.y, el.w, el.h);
            }
            break;
        }
        case 'circle': {
            const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
            const rx = Math.abs(el.w) / 2, ry = Math.abs(el.h) / 2;
            ctx.strokeStyle = el.colour;
            ctx.lineWidth   = el.width;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }
        case 'triangle': {
            ctx.strokeStyle = el.colour;
            ctx.lineWidth   = el.width;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(el.x + el.w / 2, el.y);
            ctx.lineTo(el.x + el.w,     el.y + el.h);
            ctx.lineTo(el.x,             el.y + el.h);
            ctx.closePath();
            ctx.stroke();
            break;
        }
        case 'earth': {
            drawEarthSymbol(ctx, el.x, el.y, el.eq, el.label);
            break;
        }
        case 'mdb': {
            drawMDBSymbol(ctx, el.x, el.y, el.label);
            break;
        }
        case 'bond': {
            drawBondSymbol(ctx, el.x, el.y, el.label);
            break;
        }
        case 'entrance': {
            drawEntranceSymbol(ctx, el.x, el.y);
            break;
        }
    }
    ctx.restore();
}

// ── Symbol renderers ───────────────────────────────────
function drawEarthSymbol(ctx, x, y, eq, label) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([]);
    const sz = 36;  // increased from 22

    // Vertical stem
    ctx.beginPath();
    ctx.moveTo(x, y - sz / 2);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Three horizontal lines (earth symbol)
    [[0, 1], [6, 0.65], [12, 0.35]].forEach(([offset, scale]) => {
        ctx.beginPath();
        ctx.moveTo(x - sz * scale / 2, y + offset);
        ctx.lineTo(x + sz * scale / 2, y + offset);
        ctx.stroke();
    });

    // EQ circle
    if (eq) {
        ctx.beginPath();
        ctx.arc(x, y + 4, sz * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = '#0877c3';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Label above — larger font
    ctx.fillStyle = '#1a1a1a';
    ctx.font      = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y - sz / 2 - 6);
}

function drawMDBSymbol(ctx, x, y, label) {
    ctx.setLineDash([]);
    const w = 54, h = 26;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MDB', x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(label !== 'MDB' ? label.replace('MDB', '') : '', x, y - h / 2 - 6);
}

function drawBondSymbol(ctx, x, y, label) {
    ctx.setLineDash([]);
    // Draw bond symbol using lines and filled circle (avoids Unicode font issues)
    const r = 10;
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle   = '#1a1a1a';
    ctx.lineWidth   = 2.5;
    // Horizontal bar left
    ctx.beginPath();
    ctx.moveTo(x - r * 2.2, y);
    ctx.lineTo(x - r, y);
    ctx.stroke();
    // Filled circle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Horizontal bar right
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + r * 2.2, y);
    ctx.stroke();
    // Label above — larger font
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y - r - 6);
}

function drawEntranceSymbol(ctx, x, y) {
    ctx.setLineDash([]);
    const w = 46, h = 32;
    // Square border — blue to stand out
    ctx.strokeStyle = '#0877c3';
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    // Light blue fill
    ctx.fillStyle = 'rgba(8,119,195,0.10)';
    ctx.fillRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2);
    // Bold "E" centred
    ctx.fillStyle   = '#0877c3';
    ctx.font        = 'bold 20px Arial';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', x, y);
    // "ENT" label above
    ctx.fillStyle    = '#0877c3';
    ctx.font         = 'bold 14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('ENT', x, y - h / 2 - 6);
}

// ── Redraw main canvas ─────────────────────────────────
function redrawMain() {
    mainCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    elements.forEach((el, i) => drawElement(mainCtx, el, i === selectedIndex));
}

// ── Select & Move ──────────────────────────────────────
let dragOffsetX = 0, dragOffsetY = 0;
let isDragging = false;

function handleSelect(x, y) {
    const hit = hitTest(x, y);
    if (hit >= 0) {
        selectedIndex = hit;
        const el = elements[hit];
        dragOffsetX = x - getElX(el);
        dragOffsetY = y - getElY(el);
        isDragging = true;
        document.getElementById('deleteOverlay').style.display = 'flex';
        redrawMain();

        // Switch to drag mode temporarily
        previewCanvas.onmousemove = onDrag;
        previewCanvas.onmouseup   = onDragEnd;
        previewCanvas.ontouchmove = e => { e.preventDefault(); onDrag(e); };
        previewCanvas.ontouchend  = e => { e.preventDefault(); onDragEnd(e); };
    } else {
        deselectAll();
    }
}

function onDrag(e) {
    if (!isDragging || selectedIndex < 0) return;
    const pos = getPos(e);
    moveElement(elements[selectedIndex], pos.x - dragOffsetX, pos.y - dragOffsetY);
    redrawMain();
}

function onDragEnd(e) {
    isDragging = false;
    previewCanvas.onmousemove = onPointerMove;
    previewCanvas.onmouseup   = onPointerUp;
    previewCanvas.ontouchmove = e2 => { e2.preventDefault(); onPointerMove(e2); };
    previewCanvas.ontouchend  = e2 => { e2.preventDefault(); onPointerUp(e2); };
}

function getElX(el) {
    if (el.type === 'freehand') return el.path[0].x;
    if (el.type === 'line') return el.x1;
    if (['earth','mdb','bond'].includes(el.type)) return el.x;
    return el.x;
}
function getElY(el) {
    if (el.type === 'freehand') return el.path[0].y;
    if (el.type === 'line') return el.y1;
    if (['earth','mdb','bond'].includes(el.type)) return el.y;
    return el.y;
}

function moveElement(el, nx, ny) {
    if (el.type === 'freehand') {
        const dx = nx - el.path[0].x, dy = ny - el.path[0].y;
        el.path = el.path.map(p => ({ x: p.x + dx, y: p.y + dy }));
    } else if (el.type === 'line') {
        const dx = nx - el.x1, dy = ny - el.y1;
        el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy;
    } else if (['earth','mdb','bond'].includes(el.type)) {
        el.x = nx; el.y = ny;
    } else {
        el.x = nx; el.y = ny;
    }
}

function hitTest(x, y) {
    // Test in reverse (top element first)
    for (let i = elements.length - 1; i >= 0; i--) {
        if (elementHit(elements[i], x, y)) return i;
    }
    return -1;
}

function elementHit(el, x, y) {
    const tol = 12;
    if (el.type === 'freehand') {
        return el.path.some(p => Math.hypot(p.x - x, p.y - y) < tol * 2);
    }
    if (el.type === 'line') {
        return pointNearSegment(x, y, el.x1, el.y1, el.x2, el.y2, tol);
    }
    if (el.type === 'rect' || el.type === 'triangle') {
        const minX = Math.min(el.x, el.x + el.w), maxX = Math.max(el.x, el.x + el.w);
        const minY = Math.min(el.y, el.y + el.h), maxY = Math.max(el.y, el.y + el.h);
        return x >= minX - tol && x <= maxX + tol && y >= minY - tol && y <= maxY + tol;
    }
    if (el.type === 'circle') {
        const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
        const rx = Math.abs(el.w) / 2 + tol, ry = Math.abs(el.h) / 2 + tol;
        return ((x - cx) ** 2 / rx ** 2) + ((y - cy) ** 2 / ry ** 2) <= 1;
    }
    if (['earth','mdb','bond','entrance'].includes(el.type)) {
        return Math.hypot(el.x - x, el.y - y) < 32;
    }
    return false;
}

function pointNearSegment(px, py, x1, y1, x2, y2, tol) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1) < tol;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) < tol;
}

function deleteSelected() {
    if (selectedIndex >= 0) {
        const el = elements[selectedIndex];
        // Adjust counters if needed (can't easily un-number, so just remove)
        elements.splice(selectedIndex, 1);
        selectedIndex = -1;
        redrawMain();
        updateLegend();
        document.getElementById('deleteOverlay').style.display = 'none';
    }
}

function deselectAll() {
    selectedIndex = -1;
    isDragging = false;
    document.getElementById('deleteOverlay').style.display = 'none';
    // Restore normal event listeners
    previewCanvas.onmousemove = onPointerMove;
    previewCanvas.onmouseup   = onPointerUp;
    redrawMain();
}

// ── Eraser ─────────────────────────────────────────────
function handleErase(x, y) {
    const hit = hitTest(x, y);
    if (hit >= 0) {
        elements.splice(hit, 1);
        redrawMain();
        updateLegend();
    }
}

// ── Undo / Redo ────────────────────────────────────────
function undo() {
    if (elements.length === 0) return;
    undoStack.push(elements.pop());
    // Recount earths
    recountSymbols();
    redrawMain();
    updateLegend();
}

function redo() {
    if (undoStack.length === 0) return;
    elements.push(undoStack.pop());
    recountSymbols();
    redrawMain();
    updateLegend();
}

function recountSymbols() {
    earthCounter   = elements.filter(e => e.type === 'earth').length;
    mdbCounter     = elements.filter(e => e.type === 'mdb').length;
    bondCounter    = elements.filter(e => e.type === 'bond').length;
    entrancePlaced = elements.some(e => e.type === 'entrance');
    document.getElementById('nextEarthLabel').textContent = 'E' + (earthCounter + 1);
    document.getElementById('earthCountDisplay').textContent = earthCounter;
    // Reflect entrance availability in button state
    const btn    = document.getElementById('tool-entrance');
    const mobBtn = document.getElementById('mob-entrance');
    if (btn)    btn.classList.toggle('tool-used', entrancePlaced);
    if (mobBtn) mobBtn.classList.toggle('tool-used', entrancePlaced);
}

function clearCanvas() {
    if (!confirm('Clear the entire drawing? This cannot be undone.')) return;
    elements   = [];
    undoStack  = [];
    earthCounter = mdbCounter = bondCounter = 0;
    colourLegend = {};
    recountSymbols();
    redrawMain();
    updateLegend();
}

function resetEarthCounter() {
    // Renumber earths in order of placement
    let n = 0;
    elements.forEach(el => {
        if (el.type === 'earth') {
            n++;
            el.label = 'E' + n;
        }
    });
    earthCounter = n;
    recountSymbols();
    redrawMain();
}

// ── Predefined colour map ─────────────────────────────
// These colours always get a fixed label — no user input needed
const PREDEFINED_COLOURS = {
    '#222222': 'Building / Structure',
    '#e74c3c': 'Conductor',           // also used for dashed
};
// These colours need a user-typed label
const PALETTE_COLOURS = ['#2980b9', '#27ae60', '#f39c12'];

// ── Legend ─────────────────────────────────────────────
function updateLegend() {
    const hasEarth  = elements.some(e => e.type === 'earth' && !e.eq);
    const hasEQ     = elements.some(e => e.type === 'earth' && e.eq);
    const hasBlack  = elements.some(e =>
        (e.type === 'freehand' || e.type === 'line' || ['rect','circle','triangle'].includes(e.type))
        && !e.dashed && (e.colour === '#222222' || !e.colour));
    const hasDashed = elements.some(e => (e.type === 'freehand' || e.type === 'line') && e.dashed);
    const hasMDB    = elements.some(e => e.type === 'mdb');
    const hasBond   = elements.some(e => e.type === 'bond');
    const hasEntrance = elements.some(e => e.type === 'entrance');

    let html = '';
    if (hasEarth)    html += legendRow('symbol', null,      'earth-std', 'Standard Earth (E)');
    if (hasEQ)       html += legendRow('symbol', null,      'earth-eq',  'EQ / Protective Earth');
    if (hasBlack)    html += legendRow('line',   '#222222', false,       'Building / Structure');
    if (hasDashed)   html += legendRow('line',   '#e74c3c', true,        'Conductor');
    if (hasMDB)      html += legendRow('symbol', null,      'mdb',       'MDB – Main Distribution Board');
    if (hasBond)     html += legendRow('symbol', null,      'bond',      'Bond Point');
    if (hasEntrance) html += legendRow('symbol', null,      'entrance',  'Entrance');

    // Collect all non-black, non-dashed colours used on canvas
    const usedCustomColours = [...new Set(
        elements
            .filter(e =>
                (e.type === 'freehand' || e.type === 'line' || ['rect','circle','triangle'].includes(e.type))
                && !e.dashed
                && e.colour
                && e.colour !== '#222222')
            .map(e => e.colour)
    )];

    usedCustomColours.forEach(c => {
        if (!(c in colourLegend)) colourLegend[c] = '';
        html += legendRowCustom(c, colourLegend[c]);
    });

    // Remove colours no longer on canvas
    Object.keys(colourLegend).forEach(c => {
        if (!usedCustomColours.includes(c)) delete colourLegend[c];
    });

    if (!html) html = '<div class="legend-empty">Add elements to the canvas to build the legend.</div>';
    document.getElementById('legendList').innerHTML = html;

    // Re-attach input listeners
    usedCustomColours.forEach(c => {
        const id  = 'legend-input-' + c.replace('#', '');
        const inp = document.getElementById(id);
        if (inp) {
            inp.addEventListener('input', function() {
                colourLegend[c] = this.value;
            });
        }
    });
}

function legendRow(kind, colour, special, label) {
    if (kind === 'line') {
        const style = special
            ? `border-top:2.5px dashed ${colour};height:0;width:30px;margin-top:8px;`
            : `border-top:2.5px solid ${colour};height:0;width:30px;margin-top:8px;`;
        return `<div class="legend-item">
            <div class="legend-swatch" style="${style}"></div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'earth-std') {
        return `<div class="legend-item">
            <div class="legend-swatch"><svg width="22" height="18" viewBox="0 0 22 18">
                <line x1="11" y1="0" x2="11" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="1" y1="8" x2="21" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="4" y1="12" x2="18" y2="12" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="7" y1="16" x2="15" y2="16" stroke="#1a1a1a" stroke-width="1.8"/>
            </svg></div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'earth-eq') {
        return `<div class="legend-item">
            <div class="legend-swatch"><svg width="22" height="22" viewBox="0 0 22 22">
                <line x1="11" y1="1" x2="11" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="2" y1="8" x2="20" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="5" y1="11" x2="17" y2="11" stroke="#1a1a1a" stroke-width="1.8"/>
                <line x1="8" y1="14" x2="14" y2="14" stroke="#1a1a1a" stroke-width="1.8"/>
                <circle cx="11" cy="11" r="9" fill="none" stroke="#0877c3" stroke-width="1.5"/>
            </svg></div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'mdb') {
        return `<div class="legend-item">
            <div class="legend-swatch"><svg width="28" height="14" viewBox="0 0 28 14">
                <rect x="1" y="1" width="26" height="12" rx="2" fill="#f8f9fa" stroke="#1a1a1a" stroke-width="1.5"/>
                <text x="14" y="10" text-anchor="middle" font-size="7" font-weight="bold" fill="#1a1a1a">MDB</text>
            </svg></div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'bond') {
        return `<div class="legend-item">
            <div class="legend-swatch">
                <svg width="28" height="14" viewBox="0 0 28 14">
                    <line x1="1" y1="7" x2="10" y2="7" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="14" cy="7" r="4" fill="#1a1a1a"/>
                    <line x1="18" y1="7" x2="27" y2="7" stroke="#1a1a1a" stroke-width="2"/>
                </svg>
            </div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'entrance') {
        return `<div class="legend-item">
            <div class="legend-swatch">
                <svg width="28" height="18" viewBox="0 0 28 18">
                    <rect x="1" y="1" width="26" height="16" fill="rgba(8,119,195,0.10)" stroke="#0877c3" stroke-width="1.8"/>
                    <text x="14" y="13" text-anchor="middle" font-size="11" font-weight="bold" fill="#0877c3">E</text>
                </svg>
            </div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    return '';
}

function legendRowCustom(colour, labelVal) {
    const id = 'legend-input-' + colour.replace('#', '');
    return `<div class="legend-item legend-item-custom">
        <div class="legend-swatch" style="border-top:2.5px solid ${colour};height:0;width:30px;margin-top:8px;flex-shrink:0;"></div>
        <input class="legend-label-input" id="${id}" type="text"
            placeholder="Label this colour…"
            value="${labelVal || ''}">
    </div>`;
}


// ── Expose canvas for PDF export ───────────────────────
window.getDrawingCanvas = function() {
    // PDF output: white canvas + drawing elements only
    // Background image and grid are intentionally excluded
    const out = document.createElement('canvas');
    out.width  = CANVAS_W;
    out.height = CANVAS_H;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Only draw the main elements layer — no bgCanvas
    ctx.drawImage(mainCanvas, 0, 0);
    return out;
};

window.getDrawingMeta = function() {
    return {
        siteName:  document.getElementById('infoSiteName').value  || '',
        address:   document.getElementById('infoAddress').value   || '',
        drawnBy:   document.getElementById('infoDrawnBy').value   || '',
        date:      document.getElementById('infoDate').value      || '',
        scale:     'NOT TO SCALE',
        legend:    buildLegendData()
    };
};

function buildLegendData() {
    const items = [];
    const hasEarth  = elements.some(e => e.type === 'earth' && !e.eq);
    const hasEQ     = elements.some(e => e.type === 'earth' && e.eq);
    const hasBlack  = elements.some(e =>
        (e.type === 'freehand'||e.type==='line'||['rect','circle','triangle'].includes(e.type))
        && !e.dashed && (e.colour === '#222222' || !e.colour));
    const hasDashed   = elements.some(e => (e.type === 'freehand'||e.type==='line') && e.dashed);
    const hasMDB      = elements.some(e => e.type === 'mdb');
    const hasBond     = elements.some(e => e.type === 'bond');
    const hasEntrance = elements.some(e => e.type === 'entrance');

    if (hasEarth)    items.push({ kind:'earth-std',  label:'Standard Earth (E)' });
    if (hasEQ)       items.push({ kind:'earth-eq',   label:'EQ / Protective Earth' });
    if (hasBlack)    items.push({ kind:'line', colour:'#222222', dashed:false, label:'Building / Structure' });
    if (hasDashed)   items.push({ kind:'line', colour:'#e74c3c', dashed:true,  label:'Conductor' });
    if (hasMDB)      items.push({ kind:'mdb',      label:'MDB – Main Distribution Board' });
    if (hasBond)     items.push({ kind:'bond',     label:'Bond Point' });
    if (hasEntrance) items.push({ kind:'entrance', label:'Entrance' });

    // Custom colours — all non-black non-dashed colours
    const customC = [...new Set(
        elements
            .filter(e =>
                (e.type==='freehand'||e.type==='line'||['rect','circle','triangle'].includes(e.type))
                && !e.dashed && e.colour && e.colour !== '#222222')
            .map(e => e.colour)
    )];
    customC.forEach(c => {
        // Use user-typed label if available, else fallback to "Unnamed"
        const label = (colourLegend[c] && colourLegend[c].trim()) ? colourLegend[c].trim() : 'Unnamed';
        items.push({ kind:'line', colour:c, dashed:false, label });
    });
    return items;
}

// ── Init ───────────────────────────────────────────────
drawGrid();
setTool('freehand');
document.getElementById('earth-type-opts').style.display = 'none';
updateBgLockUI();

// ── Canvas scaling ─────────────────────────────────────
function fitCanvas() {
    const isMobile = window.innerWidth <= 768;
    const canvasArea = document.getElementById('canvasArea');
    const wrapper    = document.getElementById('canvasWrapper');
    const zc         = document.getElementById('canvasZoomContainer');

    if (isMobile) {
        const w = canvasArea.clientWidth;
        const h = Math.round(w * CANVAS_H / CANVAS_W);
        wrapper.style.height = h + 'px';

        // Size zoom container to natural display size
        zc.style.width  = w + 'px';
        zc.style.height = h + 'px';

        [bgCanvas, mainCanvas, previewCanvas].forEach(c => {
            c.style.width  = w + 'px';
            c.style.height = h + 'px';
            c.style.top    = '0';
            c.style.left   = '0';
        });

        // Reset zoom on orientation change
        viewScale   = 1;
        viewOffsetX = 0;
        viewOffsetY = 0;
        applyZoom();
    } else {
        // Desktop: natural scrollable canvas, no zoom transform
        wrapper.style.height = '';
        zc.style.width  = CANVAS_W + 'px';
        zc.style.height = CANVAS_H + 'px';
        zc.style.transform = '';

        [bgCanvas, mainCanvas, previewCanvas].forEach(c => {
            c.style.width  = CANVAS_W + 'px';
            c.style.height = CANVAS_H + 'px';
            c.style.top    = '0';
            c.style.left   = '0';
        });
    }
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

// ── Restore drawing state if returning from report ──────
(function restoreStateIfNeeded() {
    const urlParams  = new URLSearchParams(window.location.search);
    const reportMode = urlParams.get('report');
    if (!reportMode) return;

    const stateKey = 'striker-drawing-' + reportMode + '-state';
    const raw = localStorage.getItem(stateKey);
    if (!raw) return;

    try {
        const state = JSON.parse(raw);

        // Restore drawing elements
        if (Array.isArray(state.elements)) {
            elements.length = 0;
            state.elements.forEach(el => elements.push(el));
        }

        // Restore counters
        if (typeof state.earthCounter   === 'number') earthCounter   = state.earthCounter;
        if (typeof state.mdbCounter     === 'number') mdbCounter     = state.mdbCounter;
        if (typeof state.bondCounter    === 'number') bondCounter    = state.bondCounter;
        if (typeof state.entrancePlaced === 'boolean') entrancePlaced = state.entrancePlaced;
        if (state.colourLegend && typeof state.colourLegend === 'object') {
            Object.assign(colourLegend, state.colourLegend);
        }

        // Restore info panel fields
        if (state.siteName && document.getElementById('infoSiteName'))
            document.getElementById('infoSiteName').value = state.siteName;
        if (state.address && document.getElementById('infoAddress'))
            document.getElementById('infoAddress').value = state.address;
        if (state.drawnBy && document.getElementById('infoDrawnBy'))
            document.getElementById('infoDrawnBy').value = state.drawnBy;
        if (state.date && document.getElementById('infoDate'))
            document.getElementById('infoDate').value = state.date;

        // Re-render
        recountSymbols();
        redrawMain();
        updateLegend();

    } catch(e) {
        console.warn('Could not restore drawing state:', e);
    }
})();
