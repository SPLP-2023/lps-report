// =============================================================================
// remedial-report.js — Repairs catalogue, selection logic, per-repair images
// =============================================================================

const REPAIRS_CATALOGUE = [
    {
        id: 'r01',
        template: 'Installation of additional clips to secure roof conductors back to the structure.',
        hasQty: false, hasEarth: false
    },
    {
        id: 'r02',
        template: 'Installation of additional clips to secure the down conductors.',
        hasQty: false, hasEarth: false
    },
    {
        id: 'r03',
        template: 'Installation of {X} bonds to plant items to prevent flashover from occurring.',
        hasQty: true, qtyLabel: 'No. of bonds'
    },
    {
        id: 'r04',
        template: 'Installation of {X} new A-clamps.',
        hasQty: true, qtyLabel: 'No. of clamps'
    },
    {
        id: 'r05',
        template: 'Installation of {X} new Stainless Steel test clamps.',
        hasQty: true, qtyLabel: 'No. of clamps'
    },
    {
        id: 'r06',
        template: 'Installation of additional earthing materials to {E#} to reduce the earth resistance reading.',
        hasEarth: true, earthLabel: 'Earth ref'
    },
    {
        id: 'r07',
        template: 'Installation of new clamps to replace corroded clamps.',
        hasQty: false, hasEarth: false
    },
    {
        id: 'r08',
        template: 'Installation of new clamps to replace broken clamps.',
        hasQty: false, hasEarth: false
    },
    {
        id: 'r09',
        template: 'Installation of new ESEAT lightning protection system, certified to NF C 17-102.',
        hasQty: false, hasEarth: false
    },
    {
        id: 'r10',
        template: 'Excavation of {E#} to locate the earth and tested the resistance. Ground made good on completion.',
        hasEarth: true, earthLabel: 'Earth ref'
    },
    {
        id: 'r11',
        template: 'Continuity fault investigations at {E#} completed - Fault located, repaired on site with new parts.',
        hasEarth: true, earthLabel: 'Earth ref'
    },
    {
        id: 'r12',
        template: 'Continuity fault investigations at {E#} completed - Fault located, further works required.',
        hasEarth: true, earthLabel: 'Earth ref'
    },
    {
        id: 'r13',
        template: 'Installation of finial rods to provide an angle of protection over the roof areas.',
        hasQty: false, hasEarth: false
    },
];

window.selectedRepairs = [];

// ===================== BUILD REPAIR LIST UI =====================
function buildRepairsList() {
    const container = document.getElementById('repairsListContainer');
    if (!container) return;
    container.innerHTML = '';

    REPAIRS_CATALOGUE.forEach(repair => {
        const hasInputs = repair.hasQty || repair.hasEarth;

        // Label HTML — show placeholders in accent colour
        const labelHtml = repair.template
            .replace('{X}', '<em style="color:#0877c3;font-style:normal;font-weight:700;">[qty]</em>')
            .replace('{E#}', '<em style="color:#0877c3;font-style:normal;font-weight:700;">[ref]</em>');

        // Qty / earth inputs
        let inputsHtml = '';
        if (repair.hasQty) {
            inputsHtml += `
                <label class="rm-input-label">${repair.qtyLabel || 'Quantity'}:</label>
                <input type="number" min="1" max="999" value="1"
                    id="qty-${repair.id}"
                    class="rm-num-input"
                    oninput="refreshSelectedRepair('${repair.id}')"
                    onclick="event.stopPropagation()">`;
        }
        if (repair.hasEarth) {
            inputsHtml += `
                <label class="rm-input-label">${repair.earthLabel || 'Earth ref'}:</label>
                <input type="text" placeholder="e.g. E1"
                    id="earth-${repair.id}"
                    class="rm-text-input"
                    oninput="refreshSelectedRepair('${repair.id}')"
                    onclick="event.stopPropagation()">`;
        }

        // Photo upload row (hidden until checked)
        const photoHtml = `
            <div class="rm-photo-row" id="photo-row-${repair.id}" style="display:none;">
                <span class="rm-photo-label">📷 Photos:</span>
                <label class="rm-photo-btn" for="repair-img-${repair.id}">
                    Add photos
                    <input type="file" id="repair-img-${repair.id}"
                        accept="image/*" multiple style="display:none;"
                        onchange="handleRepairImages(this, '${repair.id}')">
                </label>
                <span id="repair-img-preview-${repair.id}" class="rm-photo-count"></span>
            </div>`;

        const item = document.createElement('div');
        item.className = 'rm-repair-item';
        item.id = 'repair-item-' + repair.id;
        item.innerHTML = `
            <div class="rm-repair-check-col">
                <input type="checkbox" id="chk-${repair.id}" class="rm-checkbox"
                    onchange="toggleRepair('${repair.id}')">
            </div>
            <div class="rm-repair-body">
                <label for="chk-${repair.id}" class="rm-repair-label">${labelHtml}</label>
                ${hasInputs ? `<div class="rm-inputs-row" id="inputs-row-${repair.id}" style="display:none;">${inputsHtml}</div>` : ''}
                ${photoHtml}
            </div>`;

        container.appendChild(item);
    });

    // Inject styles (scoped, only if not already present)
    if (!document.getElementById('rm-repair-styles')) {
        const style = document.createElement('style');
        style.id = 'rm-repair-styles';
        style.textContent = `
            .rm-repair-item {
                display: flex;
                gap: 12px;
                align-items: flex-start;
                padding: 12px 14px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin-bottom: 8px;
                background: #fff;
                transition: border-color 0.2s, background 0.2s;
            }
            .rm-repair-item.rm-selected {
                border-color: #0877c3;
                background: #f0f7ff;
            }
            .rm-repair-check-col { padding-top: 2px; flex-shrink: 0; }
            .rm-checkbox { width: 17px; height: 17px; cursor: pointer; accent-color: #0877c3; }
            .rm-repair-body { flex: 1; }
            .rm-repair-label {
                font-size: 13.5px;
                color: #1a1a1a;
                cursor: pointer;
                line-height: 1.45;
                display: block;
                margin: 0;
                font-weight: normal;
            }
            .rm-inputs-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 8px;
            }
            .rm-input-label {
                font-size: 12px;
                font-weight: 600;
                color: #555;
                white-space: nowrap;
            }
            .rm-num-input {
                width: 68px;
                padding: 4px 8px;
                border: 1px solid #adb5bd;
                border-radius: 4px;
                font-size: 13px;
            }
            .rm-text-input {
                width: 100px;
                padding: 4px 8px;
                border: 1px solid #adb5bd;
                border-radius: 4px;
                font-size: 13px;
            }
            .rm-photo-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 8px;
                flex-wrap: wrap;
            }
            .rm-photo-label { font-size: 12px; color: #555; font-weight: 600; }
            .rm-photo-btn {
                display: inline-block;
                padding: 4px 12px;
                background: #0877c3;
                color: #fff;
                border-radius: 5px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                user-select: none;
            }
            .rm-photo-btn:hover { background: #065f99; }
            .rm-photo-count { font-size: 12px; color: #27ae60; font-weight: 600; }

            /* Selected repair tags */
            .rm-selected-tag {
                background: #e8f4fd;
                border: 1px solid #0877c3;
                border-radius: 7px;
                padding: 10px 14px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 10px;
            }
            .rm-selected-tag .rm-tag-text { flex: 1; font-size: 13.5px; color: #0d1b2a; line-height: 1.45; }
            .rm-selected-tag .rm-tag-photos { font-size: 11.5px; color: #0877c3; margin-top: 3px; }
            .rm-tag-remove {
                background: none; border: none;
                color: #c0392b; font-size: 20px;
                cursor: pointer; padding: 0; line-height: 1; flex-shrink: 0;
            }
            .add-btn {
                background: #0877c3; color: #fff;
                border: none; border-radius: 6px;
                padding: 8px 16px; font-size: 14px;
                font-weight: 600; cursor: pointer;
            }
            .add-btn:hover { background: #065f99; }
        `;
        document.head.appendChild(style);
    }
}

// ===================== RESOLVE REPAIR TEXT =====================
function resolveRepairText(repair) {
    let text = repair.template;
    if (repair.hasQty) {
        const qtyEl = document.getElementById('qty-' + repair.id);
        text = text.replace('{X}', (qtyEl && qtyEl.value) ? qtyEl.value.trim() : '?');
    }
    if (repair.hasEarth) {
        const earthEl = document.getElementById('earth-' + repair.id);
        text = text.replace('{E#}', (earthEl && earthEl.value) ? earthEl.value.trim() : '?');
    }
    return text;
}

// ===================== TOGGLE REPAIR =====================
function toggleRepair(id) {
    const chk = document.getElementById('chk-' + id);
    const item = document.getElementById('repair-item-' + id);
    const repair = REPAIRS_CATALOGUE.find(r => r.id === id);
    if (!repair) return;

    const inputsRow = document.getElementById('inputs-row-' + id);
    const photoRow  = document.getElementById('photo-row-' + id);

    if (chk.checked) {
        item.classList.add('rm-selected');
        if (inputsRow) inputsRow.style.display = 'flex';
        if (photoRow)  photoRow.style.display  = 'flex';
        const text = resolveRepairText(repair);
        window.selectedRepairs.push({ id, text, custom: false });
    } else {
        item.classList.remove('rm-selected');
        if (inputsRow) inputsRow.style.display = 'none';
        if (photoRow)  photoRow.style.display  = 'none';
        window.selectedRepairs = window.selectedRepairs.filter(r => r.id !== id);
        // Clear stored images for this repair
        delete window.imageStore['repair-' + id];
        const previewEl = document.getElementById('repair-img-preview-' + id);
        if (previewEl) previewEl.textContent = '';
    }

    renderSelectedRepairs();
    updateAllDots();
}

// ===================== REFRESH REPAIR TEXT WHEN INPUTS CHANGE =====================
function refreshSelectedRepair(id) {
    const existing = window.selectedRepairs.find(r => r.id === id);
    if (!existing) return;
    const repair = REPAIRS_CATALOGUE.find(r => r.id === id);
    if (!repair) return;
    existing.text = resolveRepairText(repair);
    renderSelectedRepairs();
}

// ===================== CUSTOM REPAIR =====================
function addCustomRepair() {
    const ta = document.getElementById('customRepairText');
    const text = (ta.value || '').trim();
    if (!text) { ta.focus(); return; }
    const id = 'custom-' + Date.now();
    window.selectedRepairs.push({ id, text, custom: true });
    ta.value = '';
    renderSelectedRepairs();
    updateAllDots();
}

// ===================== REMOVE REPAIR =====================
function removeSelectedRepair(id) {
    window.selectedRepairs = window.selectedRepairs.filter(r => r.id !== id);
    const chk = document.getElementById('chk-' + id);
    if (chk) {
        chk.checked = false;
        document.getElementById('repair-item-' + id)?.classList.remove('rm-selected');
        const inputsRow = document.getElementById('inputs-row-' + id);
        const photoRow  = document.getElementById('photo-row-' + id);
        if (inputsRow) inputsRow.style.display = 'none';
        if (photoRow)  photoRow.style.display  = 'none';
    }
    delete window.imageStore['repair-' + id];
    renderSelectedRepairs();
    updateAllDots();
}

// ===================== RENDER SELECTED REPAIRS =====================
function renderSelectedRepairs() {
    const container = document.getElementById('selectedRepairsContainer');
    if (!container) return;
    if (!window.selectedRepairs.length) {
        container.innerHTML = '<p style="color:#888;font-style:italic;font-size:13px;">No repairs selected yet. Tick repairs in the section above.</p>';
        return;
    }
    container.innerHTML = window.selectedRepairs.map((r, i) => {
        const imgs = window.imageStore['repair-' + r.id];
        const imgCount = Array.isArray(imgs) ? imgs.length : (imgs ? 1 : 0);
        const photoNote = imgCount > 0
            ? `<div class="rm-tag-photos">📷 ${imgCount} photo${imgCount > 1 ? 's' : ''} attached</div>`
            : '';
        // Custom repairs show their photo uploader here; catalogue repairs show it in the list above
        const uploadRow = r.custom ? `
            <div class="rm-photo-row" style="margin-top:8px;">
                <span class="rm-photo-label">📷 Photos:</span>
                <label class="rm-photo-btn" for="custom-img-${r.id}">
                    Add photos
                    <input type="file" id="custom-img-${r.id}" accept="image/*" multiple style="display:none;"
                        onchange="handleRepairImages(this, '${r.id}')">
                </label>
                <span id="repair-img-preview-${r.id}" class="rm-photo-count">${imgCount > 0 ? '✓ ' + imgCount + ' photo(s)' : ''}</span>
            </div>` : '';
        return `
            <div class="rm-selected-tag">
                <div class="rm-tag-text">
                    <strong>${i + 1}.</strong> ${r.text}
                    ${photoNote}
                    ${uploadRow}
                </div>
                <button class="rm-tag-remove" onclick="removeSelectedRepair('${r.id}')" title="Remove">×</button>
            </div>`;
    }).join('');
}

// ===================== AUTO-SAVE CONFIG =====================
function initRemedialAutoSave() {
    initAutoSave({
        storageKey: 'splp_remedial_autosave_v1',
        fields: [
            'siteName','jobReference','siteAddress','remedialDate',
            'remedialEngineer','additionalRepairs',
            'completionNotes','complianceResult'
        ],
        checkboxes: [],
        dateFields: ['remedialDate'],
        onSave: () => {
            // Save selected repairs, their qty/earth inputs, and images
            const repairInputs = {};
            window.selectedRepairs.forEach(r => {
                if (!r.custom) {
                    const qtyEl   = document.getElementById('qty-'   + r.id);
                    const earthEl = document.getElementById('earth-' + r.id);
                    if (qtyEl)   repairInputs['qty-'   + r.id] = qtyEl.value;
                    if (earthEl) repairInputs['earth-' + r.id] = earthEl.value;
                }
            });
            const sigData = typeof window.getClientSignatureData === 'function' ? window.getClientSignatureData() : {};
            return {
                _selectedRepairs: window.selectedRepairs,
                _repairInputs:    repairInputs,
                _imageStore:      window.imageStore || {},
                ...sigData
            };
        },
        onRestore: (d) => {
            // Restore image store first
            if (d._imageStore) {
                window.imageStore = d._imageStore;
                // Update building image preview
                if (d._imageStore['building']) {
                    const el = document.getElementById('buildingImagePreview');
                    if (el) el.textContent = '✓ Image restored';
                }
            }
            // Restore selected repairs
            if (Array.isArray(d._selectedRepairs) && d._selectedRepairs.length) {
                window.selectedRepairs = d._selectedRepairs;

                // Re-tick catalogue checkboxes and show their input/photo rows
                d._selectedRepairs.forEach(r => {
                    if (!r.custom) {
                        const chk  = document.getElementById('chk-'        + r.id);
                        const item = document.getElementById('repair-item-' + r.id);
                        const inputsRow = document.getElementById('inputs-row-' + r.id);
                        const photoRow  = document.getElementById('photo-row-'  + r.id);
                        if (chk)  chk.checked = true;
                        if (item) item.classList.add('rm-selected');
                        if (inputsRow) inputsRow.style.display = 'flex';
                        if (photoRow)  photoRow.style.display  = 'flex';
                        // Restore qty / earth values
                        if (d._repairInputs) {
                            const qtyEl   = document.getElementById('qty-'   + r.id);
                            const earthEl = document.getElementById('earth-' + r.id);
                            if (qtyEl   && d._repairInputs['qty-'   + r.id]) qtyEl.value   = d._repairInputs['qty-'   + r.id];
                            if (earthEl && d._repairInputs['earth-' + r.id]) earthEl.value = d._repairInputs['earth-' + r.id];
                        }
                        // Restore photo count badge
                        const imgs = (window.imageStore || {})['repair-' + r.id];
                        if (imgs) {
                            const count = Array.isArray(imgs) ? imgs.length : 1;
                            const prev  = document.getElementById('repair-img-preview-' + r.id);
                            if (prev) prev.textContent = '✓ ' + count + ' photo(s)';
                        }
                    }
                });

                renderSelectedRepairs();
            }
            if (typeof window.restoreClientSignature === 'function') {
                window.restoreClientSignature({ clientSignatureData: d.clientSignatureData, clientSignatureName: d.clientSignatureName });
            }
            if (typeof updateAllDots === 'function') setTimeout(updateAllDots, 200);
        },
        clearExtra: () => {
            window.selectedRepairs = [];
            window.imageStore = {};
            // Untick all catalogue checkboxes and hide their rows
            REPAIRS_CATALOGUE.forEach(r => {
                const chk  = document.getElementById('chk-'        + r.id);
                const item = document.getElementById('repair-item-' + r.id);
                const inputsRow = document.getElementById('inputs-row-' + r.id);
                const photoRow  = document.getElementById('photo-row-'  + r.id);
                if (chk)  chk.checked = false;
                if (item) item.classList.remove('rm-selected');
                if (inputsRow) inputsRow.style.display = 'none';
                if (photoRow)  photoRow.style.display  = 'none';
                const prev = document.getElementById('repair-img-preview-' + r.id);
                if (prev) prev.textContent = '';
            });
            renderSelectedRepairs();
            if (typeof window.restoreClientSignature === 'function') {
                window.restoreClientSignature({ clientSignatureData: null, clientSignatureName: '' });
            }
            const ind = document.getElementById('sigSavedIndicator');
            if (ind) ind.style.display = 'none';
            const btn = document.getElementById('btnOpenSigModal');
            if (btn) btn.textContent = '✍️ Add Client Signature';
            const bp = document.getElementById('buildingImagePreview');
            if (bp) bp.textContent = 'Click to upload building photo';
            if (typeof updateAllDots === 'function') updateAllDots();
        }
    });
}
