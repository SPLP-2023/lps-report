// =============================================================================
// remedial-report.js — Remedial Report Logic
// Manages the repairs list, quantity/earth pickers, and selected repairs state
// =============================================================================

// ===================== REPAIRS CATALOGUE =====================
// "X" = quantity input,  "E#" = earth point text input
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
        hasQty: true, hasEarth: false, qtyLabel: 'No. of bonds'
    },
    {
        id: 'r04',
        template: 'Installation of {X} new A-clamps.',
        hasQty: true, hasEarth: false, qtyLabel: 'No. of clamps'
    },
    {
        id: 'r05',
        template: 'Installation of {X} new Stainless Steel test clamps.',
        hasQty: true, hasEarth: false, qtyLabel: 'No. of clamps'
    },
    {
        id: 'r06',
        template: 'Installation of additional earthing materials to {E#} to reduce the earth resistance reading.',
        hasQty: false, hasEarth: true, earthLabel: 'Earth point'
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
        hasQty: false, hasEarth: true, earthLabel: 'Earth point'
    },
    {
        id: 'r11',
        template: 'Continuity fault investigations at {E#} completed - Fault located, repaired on site with new parts.',
        hasQty: false, hasEarth: true, earthLabel: 'Earth point'
    },
    {
        id: 'r12',
        template: 'Continuity fault investigations at {E#} completed - Fault located, further works required.',
        hasQty: false, hasEarth: true, earthLabel: 'Earth point'
    },
    {
        id: 'r13',
        template: 'Installation of finial rods to provide an angle of protection over the roof areas.',
        hasQty: false, hasEarth: false
    },
];

// ===================== STATE =====================
window.selectedRepairs = [];   // array of { id, text, custom }

// ===================== BUILD REPAIRS LIST UI =====================
function buildRepairsList() {
    const container = document.getElementById('repairsListContainer');
    if (!container) return;
    container.innerHTML = '';

    REPAIRS_CATALOGUE.forEach(repair => {
        const item = document.createElement('div');
        item.className = 'repair-item';
        item.id = 'repair-item-' + repair.id;

        // Preview text (shows template with placeholders replaced by inputs)
        const previewText = repair.template
            .replace('{X}', '<span class="ph qty-ph">[qty]</span>')
            .replace('{E#}', '<span class="ph earth-ph">[earth point]</span>');

        let inputsHtml = '';
        if (repair.hasQty) {
            inputsHtml += `
                <label>${repair.qtyLabel || 'Quantity'}:</label>
                <input type="number" min="1" max="999" value="1"
                    id="qty-${repair.id}" class="repair-qty-input"
                    oninput="refreshSelectedRepair('${repair.id}')" onclick="event.stopPropagation()">`;
        }
        if (repair.hasEarth) {
            inputsHtml += `
                <label>${repair.earthLabel || 'Earth point'} ref:</label>
                <input type="text" placeholder="e.g. E1"
                    id="earth-${repair.id}" class="repair-earth-input"
                    oninput="refreshSelectedRepair('${repair.id}')" onclick="event.stopPropagation()">`;
        }

        item.innerHTML = `
            <input type="checkbox" id="chk-${repair.id}"
                onchange="toggleRepair('${repair.id}')" style="margin-top:3px;">
            <div class="repair-item-body">
                <div class="repair-label-row">
                    <label for="chk-${repair.id}">${repair.template
                        .replace('{X}', '<em style="color:#0877c3">[qty]</em>')
                        .replace('{E#}', '<em style="color:#0877c3">[ref]</em>')}</label>
                </div>
                ${inputsHtml ? `<div class="repair-inputs">${inputsHtml}</div>` : ''}
            </div>`;

        container.appendChild(item);
    });
}

// ===================== RESOLVE REPAIR TEXT =====================
function resolveRepairText(repair) {
    let text = repair.template;
    if (repair.hasQty) {
        const qtyEl = document.getElementById('qty-' + repair.id);
        const qty = (qtyEl && qtyEl.value) ? qtyEl.value.trim() : '?';
        text = text.replace('{X}', qty);
    }
    if (repair.hasEarth) {
        const earthEl = document.getElementById('earth-' + repair.id);
        const ref = (earthEl && earthEl.value) ? earthEl.value.trim() : '?';
        text = text.replace('{E#}', ref);
    }
    return text;
}

// ===================== TOGGLE REPAIR =====================
function toggleRepair(id) {
    const chk = document.getElementById('chk-' + id);
    const item = document.getElementById('repair-item-' + id);
    const repair = REPAIRS_CATALOGUE.find(r => r.id === id);
    if (!repair) return;

    if (chk.checked) {
        item.classList.add('selected');
        const text = resolveRepairText(repair);
        window.selectedRepairs.push({ id, text, custom: false });
    } else {
        item.classList.remove('selected');
        window.selectedRepairs = window.selectedRepairs.filter(r => r.id !== id);
    }
    renderSelectedRepairs();
    updateAllDots();
}

// ===================== REFRESH WHEN INPUTS CHANGE =====================
function refreshSelectedRepair(id) {
    const existing = window.selectedRepairs.find(r => r.id === id);
    if (!existing) return;   // not checked yet
    const repair = REPAIRS_CATALOGUE.find(r => r.id === id);
    if (!repair) return;
    existing.text = resolveRepairText(repair);
    renderSelectedRepairs();
}

// ===================== ADD CUSTOM REPAIR =====================
function addCustomRepair() {
    const ta = document.getElementById('customRepairText');
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    const id = 'custom-' + Date.now();
    window.selectedRepairs.push({ id, text, custom: true });
    ta.value = '';
    renderSelectedRepairs();
    updateAllDots();
}

// ===================== REMOVE SELECTED REPAIR =====================
function removeSelectedRepair(id) {
    window.selectedRepairs = window.selectedRepairs.filter(r => r.id !== id);
    // Uncheck catalogue item if it was from the list
    const chk = document.getElementById('chk-' + id);
    if (chk) { chk.checked = false; document.getElementById('repair-item-' + id)?.classList.remove('selected'); }
    renderSelectedRepairs();
    updateAllDots();
}

// ===================== RENDER SELECTED REPAIRS =====================
function renderSelectedRepairs() {
    const container = document.getElementById('selectedRepairsContainer');
    if (!container) return;
    if (!window.selectedRepairs.length) {
        container.innerHTML = '<p class="empty-msg">No repairs selected yet. Tick repairs in the section above.</p>';
        return;
    }
    container.innerHTML = window.selectedRepairs.map((r, i) => `
        <div class="selected-repair-tag">
            <span class="repair-text"><strong>${i + 1}.</strong> ${r.text}</span>
            <button class="remove-btn" onclick="removeSelectedRepair('${r.id}')" title="Remove">×</button>
        </div>`).join('');
}
