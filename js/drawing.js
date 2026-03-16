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

// Drawing state
let isDrawing     = false;
let startX = 0, startY = 0;
let currentPath   = [];  // for freehand

// Elements (the persistent drawn objects)
let elements = [];       // committed
let undoStack = [];      // for redo
let selectedIndex = -1;  // index of selected element

// Counters
let earthCounter = 0;    // next earth number
let mdbCounter   = 0;
let bondCounter  = 0;

// Custom colour legend tracking
let colourLegend = {}; // colour -> label string

// ── Canvas sizing ──────────────────────────────────────
function resizeCanvasWrapper() {
    // Canvases are fixed size; wrapper scrolls
}

// ── Grid ───────────────────────────────────────────────
function drawGrid() {
    bgCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    // Background fill
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Draw background image if loaded
    if (bgImage) {
        bgCtx.globalAlpha = bgOpacity;
        bgCtx.drawImage(bgImage, 0, 0, CANVAS_W, CANVAS_H);
        bgCtx.globalAlpha = 1;
    }
    // Grid lines
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
            drawGrid();
            document.getElementById('opacityCtrl').style.display = 'flex';
            document.getElementById('btnClearBg').style.display = 'inline-block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearBackground() {
    bgImage = null;
    drawGrid();
    document.getElementById('opacityCtrl').style.display = 'none';
    document.getElementById('btnClearBg').style.display = 'none';
    document.getElementById('bgUpload').value = '';
}

function setBgOpacity(val) {
    bgOpacity = parseInt(val) / 100;
    document.getElementById('bgOpacityLabel').textContent = val + '%';
    drawGrid();
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
        mdb: 'copy', bond: 'copy', select: 'default', eraser: 'cell'
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
        x: snap((clientX - rect.left) * scaleX),
        y: snap((clientY - rect.top)  * scaleY)
    };
}

// ── Pointer events ─────────────────────────────────────
previewCanvas.addEventListener('mousedown',  onPointerDown);
previewCanvas.addEventListener('mousemove',  onPointerMove);
previewCanvas.addEventListener('mouseup',    onPointerUp);
previewCanvas.addEventListener('mouseleave', onPointerUp);
previewCanvas.addEventListener('touchstart', e => { e.preventDefault(); onPointerDown(e); }, { passive: false });
previewCanvas.addEventListener('touchmove',  e => { e.preventDefault(); onPointerMove(e); }, { passive: false });
previewCanvas.addEventListener('touchend',   e => { e.preventDefault(); onPointerUp(e);   }, { passive: false });

function onPointerDown(e) {
    const pos = getPos(e);

    if (currentTool === 'select') {
        handleSelect(pos.x, pos.y);
        return;
    }
    if (currentTool === 'eraser') {
        handleErase(pos.x, pos.y);
        return;
    }
    // Stamp tools — place on click
    if (['earth', 'mdb', 'bond'].includes(currentTool)) {
        placeSymbol(pos.x, pos.y);
        return;
    }

    isDrawing = true;
    startX = pos.x;
    startY = pos.y;

    if (currentTool === 'freehand') {
        currentPath = [{ x: pos.x, y: pos.y }];
    }
}

function onPointerMove(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    previewCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (currentTool === 'freehand') {
        currentPath.push({ x: pos.x, y: pos.y });
        drawFreehandPreview();
    } else {
        drawShapePreview(startX, startY, pos.x, pos.y);
    }
}

function onPointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    previewCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const pos = getPos(e);

    if (currentTool === 'freehand' && currentPath.length > 1) {
        commitElement({
            type: 'freehand',
            path: [...currentPath],
            colour: lineStyle === 'dashed' ? '#e74c3c' : currentColour,
            dashed: lineStyle === 'dashed',
            width: lineWidth
        });
        currentPath = [];
    } else if (currentTool === 'line') {
        if (Math.abs(pos.x - startX) > 2 || Math.abs(pos.y - startY) > 2) {
            commitElement({
                type: 'line',
                x1: startX, y1: startY, x2: pos.x, y2: pos.y,
                colour: lineStyle === 'dashed' ? '#e74c3c' : currentColour,
                dashed: lineStyle === 'dashed',
                width: lineWidth
            });
        }
    } else if (['rect', 'circle', 'triangle'].includes(currentTool)) {
        const w = pos.x - startX;
        const h = pos.y - startY;
        if (Math.abs(w) > 3 && Math.abs(h) > 3) {
            commitElement({
                type: currentTool,
                x: startX, y: startY, w, h,
                colour: currentColour,
                width: lineWidth
            });
        }
    }
    undoStack = []; // clear redo on new action
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
        commitElement({
            type: 'earth',
            x, y,
            eq: earthType === 'eq',
            label
        });
        document.getElementById('nextEarthLabel').textContent = 'E' + (earthCounter + 1);
        document.getElementById('earthCountDisplay').textContent = earthCounter;
    } else if (currentTool === 'mdb') {
        mdbCounter++;
        commitElement({ type: 'mdb', x, y, label: 'MDB' + (mdbCounter > 1 ? mdbCounter : '') });
    } else if (currentTool === 'bond') {
        bondCounter++;
        commitElement({ type: 'bond', x, y, label: 'B' + bondCounter });
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
    }
    ctx.restore();
}

// ── Symbol renderers ───────────────────────────────────
function drawEarthSymbol(ctx, x, y, eq, label) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    const sz = 22;

    // Vertical stem
    ctx.beginPath();
    ctx.moveTo(x, y - sz / 2);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Three horizontal lines (earth symbol)
    [[0, 1], [4, 0.65], [8, 0.35]].forEach(([offset, scale]) => {
        ctx.beginPath();
        ctx.moveTo(x - sz * scale / 2, y + offset);
        ctx.lineTo(x + sz * scale / 2, y + offset);
        ctx.stroke();
    });

    // EQ circle
    if (eq) {
        ctx.beginPath();
        ctx.arc(x, y + 2, sz * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = '#0877c3';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Label above
    ctx.fillStyle = '#1a1a1a';
    ctx.font      = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - sz / 2 - 4);
}

function drawMDBSymbol(ctx, x, y, label) {
    ctx.setLineDash([]);
    const w = 44, h = 22;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MDB', x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.font = '10px Arial';
    ctx.fillText(label !== 'MDB' ? label.replace('MDB', '') : '', x, y - h / 2 - 4);
}

function drawBondSymbol(ctx, x, y, label) {
    ctx.setLineDash([]);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⊷', x, y);
    ctx.font = 'bold 10px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y - 16);
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
    if (['earth','mdb','bond'].includes(el.type)) {
        return Math.hypot(el.x - x, el.y - y) < 28;
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
    earthCounter = elements.filter(e => e.type === 'earth').length;
    mdbCounter   = elements.filter(e => e.type === 'mdb').length;
    bondCounter  = elements.filter(e => e.type === 'bond').length;
    document.getElementById('nextEarthLabel').textContent = 'E' + (earthCounter + 1);
    document.getElementById('earthCountDisplay').textContent = earthCounter;
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

// ── Custom colour legend ───────────────────────────────
function registerColourLegend(colour) {
    if (!colourLegend[colour]) {
        colourLegend[colour] = '';
        updateLegend();
    }
}

// ── Legend ─────────────────────────────────────────────
function updateLegend() {
    const hasEarth    = elements.some(e => e.type === 'earth' && !e.eq);
    const hasEQ       = elements.some(e => e.type === 'earth' && e.eq);
    const hasSolid    = elements.some(e => (e.type === 'freehand' || e.type === 'line') && !e.dashed && e.colour === '#222222');
    const hasDashed   = elements.some(e => (e.type === 'freehand' || e.type === 'line') && e.dashed);
    const hasRect     = elements.some(e => ['rect','circle','triangle'].includes(e.type));
    const hasMDB      = elements.some(e => e.type === 'mdb');
    const hasBond     = elements.some(e => e.type === 'bond');

    let html = '';
    if (hasEarth)  html += legendRow('symbol', null, 'earth-std',  'Standard Earth (E)');
    if (hasEQ)     html += legendRow('symbol', null, 'earth-eq',   'EQ / Protective Earth');
    if (hasSolid)  html += legendRow('line',   '#222', false,       'Building / Structure');
    if (hasDashed) html += legendRow('line',   '#e74c3c', true,     'Conductor (Down / Air Terminal)');
    if (hasRect)   html += legendRow('line',   '#222', false,       'Shape / Zone');
    if (hasMDB)    html += legendRow('symbol', null, 'mdb',         'MDB – Main Distribution Board');
    if (hasBond)   html += legendRow('symbol', null, 'bond',        'Bond Point');

    // Custom colour lines
    const customColours = [...new Set(
        elements
            .filter(e => (e.type === 'freehand' || e.type === 'line') && !e.dashed && e.colour !== '#222222')
            .map(e => e.colour)
    )];
    customColours.forEach(c => {
        if (!colourLegend[c]) colourLegend[c] = '';
        html += legendRowCustom(c, colourLegend[c]);
    });
    // Remove colours no longer on canvas
    Object.keys(colourLegend).forEach(c => {
        if (!customColours.includes(c)) delete colourLegend[c];
    });

    if (!html) html = '<div class="legend-empty">Add elements to the canvas to build the legend.</div>';
    document.getElementById('legendList').innerHTML = html;

    // Attach input listeners for custom colour labels
    customColours.forEach(c => {
        const inp = document.getElementById('legend-input-' + CSS.escape(c));
        if (inp) {
            inp.value = colourLegend[c] || '';
            inp.addEventListener('input', function() {
                colourLegend[c] = this.value;
            });
        }
    });
}

function legendRow(kind, colour, special, label) {
    if (kind === 'line') {
        const dash = special ? 'border-top: 2px dashed ' + colour : 'border-top: 2.5px solid ' + colour;
        return `<div class="legend-item">
            <div class="legend-swatch" style="${dash};height:0;width:28px;margin-top:7px;"></div>
            <span class="legend-label">${label}</span>
        </div>`;
    }
    if (special === 'earth-std') {
        return `<div class="legend-item"><div class="legend-swatch"><svg width="22" height="18" viewBox="0 0 22 18">
            <line x1="11" y1="0" x2="11" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="1" y1="8" x2="21" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="4" y1="12" x2="18" y2="12" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="7" y1="16" x2="15" y2="16" stroke="#1a1a1a" stroke-width="1.8"/>
        </svg></div><span class="legend-label">${label}</span></div>`;
    }
    if (special === 'earth-eq') {
        return `<div class="legend-item"><div class="legend-swatch"><svg width="22" height="22" viewBox="0 0 22 22">
            <line x1="11" y1="1" x2="11" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="2" y1="8" x2="20" y2="8" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="5" y1="11" x2="17" y2="11" stroke="#1a1a1a" stroke-width="1.8"/>
            <line x1="8" y1="14" x2="14" y2="14" stroke="#1a1a1a" stroke-width="1.8"/>
            <circle cx="11" cy="11" r="9" fill="none" stroke="#0877c3" stroke-width="1.5"/>
        </svg></div><span class="legend-label">${label}</span></div>`;
    }
    if (special === 'mdb') {
        return `<div class="legend-item"><div class="legend-swatch"><svg width="28" height="14" viewBox="0 0 28 14">
            <rect x="1" y="1" width="26" height="12" rx="2" fill="#f8f9fa" stroke="#1a1a1a" stroke-width="1.5"/>
            <text x="14" y="10" text-anchor="middle" font-size="7" font-weight="bold" fill="#1a1a1a">MDB</text>
        </svg></div><span class="legend-label">${label}</span></div>`;
    }
    if (special === 'bond') {
        return `<div class="legend-item"><div class="legend-swatch" style="font-size:18px;line-height:1;">⊷</div>
            <span class="legend-label">${label}</span></div>`;
    }
    return '';
}

function legendRowCustom(colour, labelVal) {
    const id = 'legend-input-' + colour.replace('#', '');
    return `<div class="legend-item" style="flex-wrap:wrap;gap:4px;">
        <div class="legend-swatch" style="border-top:2.5px solid ${colour};height:0;width:28px;margin-top:7px;"></div>
        <input class="legend-label-input" id="${id}" type="text" placeholder="Label this colour..." value="${labelVal || ''}">
    </div>`;
}

// ── Expose canvas for PDF export ───────────────────────
window.getDrawingCanvas = function() {
    // Composite: bg + main onto a new canvas
    const out = document.createElement('canvas');
    out.width  = CANVAS_W;
    out.height = CANVAS_H;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(bgCanvas, 0, 0);
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
    const hasSolid  = elements.some(e => (e.type === 'freehand'||e.type==='line') && !e.dashed && e.colour==='#222222');
    const hasDashed = elements.some(e => (e.type === 'freehand'||e.type==='line') && e.dashed);
    const hasRect   = elements.some(e => ['rect','circle','triangle'].includes(e.type));
    const hasMDB    = elements.some(e => e.type === 'mdb');
    const hasBond   = elements.some(e => e.type === 'bond');

    if (hasEarth)  items.push({ kind:'earth-std',  label:'Standard Earth (E)' });
    if (hasEQ)     items.push({ kind:'earth-eq',   label:'EQ / Protective Earth' });
    if (hasSolid)  items.push({ kind:'line',  colour:'#222',     dashed:false, label:'Building / Structure' });
    if (hasDashed) items.push({ kind:'line',  colour:'#e74c3c',  dashed:true,  label:'Conductor' });
    if (hasRect)   items.push({ kind:'line',  colour:'#222',     dashed:false, label:'Shape / Zone' });
    if (hasMDB)    items.push({ kind:'mdb',   label:'MDB – Main Distribution Board' });
    if (hasBond)   items.push({ kind:'bond',  label:'Bond Point' });

    // Custom colours
    const customC = [...new Set(
        elements.filter(e => (e.type==='freehand'||e.type==='line') && !e.dashed && e.colour!=='#222222').map(e => e.colour)
    )];
    customC.forEach(c => {
        items.push({ kind:'line', colour:c, dashed:false, label: colourLegend[c] || c });
    });
    return items;
}

// ── Init ───────────────────────────────────────────────
drawGrid();
setTool('freehand');
// Hide sub-options initially
document.getElementById('earth-type-opts').style.display = 'none';
