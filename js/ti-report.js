// =============================================================================
// ti-report.js — Form logic, auto-save, image handling, earth table
// StrikeR — Strike Point Lightning Protection Ltd
// =============================================================================

// ===================== GLOBAL STATE =====================
let selectedFailuresList = [];
let earthTableData = [];
let uploadedImages = {};
let systemDetails = {};
window.systemDetails = systemDetails;

const STORAGE_KEY = 'splp_ti_autosave_v2';
const SAVE_DELAY = 500;
let saveTimeout;
let isRestoring = false;

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function () {
    // Init signature
    if (document.getElementById('siteStaffSignatureCanvas')) {
        window.siteStaffSignature = new TouchSignature(
            'siteStaffSignatureCanvas',
            'clearSiteStaffSignature',
            'saveSiteStaffSignature',
            'siteStaffSignatureStatus'
        );
    }

    // Set today's date if empty
    const dateField = document.getElementById('testDate');
    if (dateField && !dateField.value) {
        dateField.value = new Date().toISOString().split('T')[0];
    }

    restoreFormData();
    setupAutoSave();
    addControlButtons();
});

// ===================== AUTO-SAVE SETUP =====================
function setupAutoSave() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select');
    inputs.forEach(el => {
        el.addEventListener('input', debouncedSave);
        el.addEventListener('change', debouncedSave);
    });

    // Earth table dynamic fields
    document.addEventListener('change', function (e) {
        if (e.target.closest('#earthTableContainer')) debouncedSave();
    });
    document.addEventListener('input', function (e) {
        if (e.target.closest('#earthTableContainer')) debouncedSave();
    });

    // System detail & failure option clicks
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('failure-option')) {
            setTimeout(saveFormData, 200);
        }
    });

    window.addEventListener('beforeunload', () => { if (!isRestoring) saveFormData(); });
}

function debouncedSave() {
    if (isRestoring) return;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFormData, SAVE_DELAY);
}

// ===================== SAVE =====================
function saveFormData() {
    if (isRestoring) return;
    try {
        const data = {
            siteAddress:         document.getElementById('siteAddress')?.value || '',
            testDate:            document.getElementById('testDate')?.value || '',
            engineerName:        document.getElementById('engineerName')?.value || '',
            testKitRef:          document.getElementById('testKitRef')?.value || '',
            jobReference:        document.getElementById('jobReference')?.value || '',
            siteStaffName:       document.getElementById('siteStaffName')?.value || '',
            siteStaffSignature:  window.siteStaffSignature?.signatureData || null,
            generalComments:     document.getElementById('generalComments')?.value || '',
            finalComments:       document.getElementById('finalComments')?.value || '',
            structureHeight:     document.getElementById('structureHeight')?.value || '',
            structurePerimeter:  document.getElementById('structurePerimeter')?.value || '',
            structureUse:        document.getElementById('structureUse')?.value || '',
            structureOccupancy:  document.getElementById('structureOccupancy')?.value || '',
            structureAge:        document.getElementById('structureAge')?.value || '',
            previousInspections: document.getElementById('previousInspections')?.value || '',
            earthArrangement:    document.getElementById('earthArrangement')?.value || '',
            mainEquipotentialBond: document.getElementById('mainEquipotentialBond')?.value || '',
            surgeInstalled:      document.getElementById('surgeInstalled')?.value || '',
            surgeType:           document.getElementById('surgeType')?.value || '',
            surgeSafe:           document.getElementById('surgeSafe')?.value || '',
            standard:            document.getElementById('standard')?.value || '',
            numEarths:           document.getElementById('numEarths')?.value || '',
            partOfLargerSystem:  document.getElementById('partOfLargerSystem')?.checked || false,
            selectedFailures:    selectedFailuresList,
            earthTableData:      earthTableData,
            systemDetails:       systemDetails,
            uploadedImages:      uploadedImages,
            selectedRecommendations: window.selectedRecommendations || [],
            savedAt:             new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Auto-save failed:', e);
    }
}

// ===================== RESTORE =====================
function restoreFormData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        isRestoring = true;
        const d = JSON.parse(raw);

        const fields = [
            'siteAddress','testDate','engineerName','testKitRef','jobReference',
            'siteStaffName','generalComments','finalComments','structureHeight',
            'structurePerimeter','structureUse','structureOccupancy','structureAge',
            'previousInspections','earthArrangement','mainEquipotentialBond',
            'surgeInstalled','surgeType','surgeSafe','numEarths'
        ];
        fields.forEach(id => setFieldValue(id, d[id]));

        // Signature
        if (d.siteStaffSignature && window.siteStaffSignature) {
            window.siteStaffSignature.signatureData = d.siteStaffSignature;
            window.siteStaffSignature.updateStatus('Signature restored');
            if (typeof window.siteStaffSignature.redraw === 'function') {
                window.siteStaffSignature.redraw();
            }
        }

        // Checkbox
        const cb = document.getElementById('partOfLargerSystem');
        if (cb && d.partOfLargerSystem !== undefined) cb.checked = d.partOfLargerSystem;

        // Standard + failures
        if (d.standard) {
            setFieldValue('standard', d.standard);
            setTimeout(() => {
                updateFailuresList();
                setTimeout(() => {
                    if (d.selectedFailures && Array.isArray(d.selectedFailures)) {
                        selectedFailuresList = d.selectedFailures;
                        d.selectedFailures.forEach(f => {
                            document.querySelectorAll('#failuresList .failure-option').forEach(el => {
                                if (el.textContent.trim() === f.failure) el.classList.add('selected');
                            });
                        });
                        updateSelectedFailures();
                        setTimeout(() => {
                            d.selectedFailures.forEach((f, i) => {
                                if (f.comment) {
                                    const ta = document.querySelector(`textarea[onchange*="updateFailureComment(${i})"]`);
                                    if (ta) ta.value = f.comment;
                                }
                            });
                        }, 100);
                    }
                }, 400);
            }, 100);
        }

        // Earth table
        if (d.numEarths) {
            setTimeout(() => {
                earthTableData = d.earthTableData || [];
                generateEarthTable();
                setTimeout(() => {
                    earthTableData = d.earthTableData || [];
                    restoreEarthTableFields();
                    calculateOverallResistance();
                }, 400);
            }, 100);
        }

        // System details
        if (d.systemDetails) {
            systemDetails = d.systemDetails;
            window.systemDetails = systemDetails;
            Object.keys(d.systemDetails).forEach(cat => {
                (d.systemDetails[cat] || []).forEach(val => {
                    const isOther = val.startsWith('Other: ');
                    const matchText = isOther ? 'Other' : val;
                    document.querySelectorAll(`#${cat}List .failure-option`).forEach(el => {
                        if (el.textContent.trim() === matchText) {
                            el.classList.add('selected');
                            if (isOther) {
                                const inp = document.getElementById(cat + 'Other');
                                if (inp) { inp.classList.remove('hidden'); inp.value = val.slice(7); }
                            }
                        }
                    });
                });
            });
        }

        // Images
        if (d.uploadedImages) {
            uploadedImages = d.uploadedImages;
            window.uploadedImages = uploadedImages;
            Object.keys(d.uploadedImages).forEach(key => {
                if (key.endsWith('_data')) {
                    const previewEl = document.getElementById(key.replace('_data', ''));
                    if (previewEl) {
                        const val = d.uploadedImages[key];
                        previewEl.textContent = Array.isArray(val)
                            ? `${val.length} image(s) restored`
                            : 'Image restored';
                    }
                }
            });
        }

        // Recommendations
        if (d.selectedRecommendations && Array.isArray(d.selectedRecommendations)) {
            setTimeout(() => {
                window.selectedRecommendations = d.selectedRecommendations;
                d.selectedRecommendations.forEach(r => {
                    const chk = document.getElementById('recchk-' + r.id);
                    if (chk) {
                        chk.checked = true;
                        document.getElementById('rec-item-' + r.id)?.classList.add('rm-selected');
                        const inputsRow = document.getElementById('rec-inputs-row-' + r.id);
                        const photoRow  = document.getElementById('rec-photo-row-'  + r.id);
                        if (inputsRow) inputsRow.style.display = 'flex';
                        if (photoRow)  photoRow.style.display  = 'flex';
                        const rec = RECOMMENDATIONS_CATALOGUE.find(rc => rc.id === r.id);
                        if (rec && rec.hasQty) {
                            const match = r.text.match(/install (\d+)/);
                            const qtyEl = document.getElementById('recqty-' + r.id);
                            if (qtyEl && match) qtyEl.value = match[1];
                        }
                        if (rec && rec.hasEarth) {
                            const match = r.text.match(/\b(E\d+)\b/);
                            const earthEl = document.getElementById('recearth-' + r.id);
                            if (earthEl && match) earthEl.value = match[1];
                        }
                    }
                });
                renderSelectedRecs();
                updateAllDots();
            }, 600);
        }
        
                setTimeout(() => { isRestoring = false; saveFormData(); }, 2000);
    } catch (e) {
        console.error('Restore failed:', e);
        isRestoring = false;
    }
}

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null && value !== '') el.value = value;
}

// ===================== CLEAR / NEW REPORT =====================
function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    selectedFailuresList = [];
    window.selectedRecommendations = [];
    window.imageStore = {};
    earthTableData = [];
    uploadedImages = {};
    systemDetails = {};
    window.systemDetails = {};

    if (window.siteStaffSignature) window.siteStaffSignature.clear();

    document.querySelectorAll('input:not([type="file"]):not([type="checkbox"]), textarea, select').forEach(el => el.value = '');
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.querySelectorAll('.failure-option.selected').forEach(el => el.classList.remove('selected'));

    const sf = document.getElementById('selectedFailures');
    if (sf) sf.innerHTML = '';
    const fc = document.getElementById('failuresContainer');
    if (fc) fc.classList.add('hidden');
    const etc = document.getElementById('earthTableContainer');
    if (etc) etc.classList.add('hidden');
    const er = document.getElementById('earthResult');
    if (er) er.classList.add('hidden');

    document.querySelectorAll('.hidden-file-input').forEach(el => el.value = '');
    ['buildingImagePreview', 'earthImagesPreview'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = id.includes('building') ? 'Click to upload building image' : 'Click to upload earth test images';
    });
    renderSelectedRecs();
    const dateField = document.getElementById('testDate');
    if (dateField) dateField.value = new Date().toISOString().split('T')[0];
}

function addControlButtons() {
    const gen = document.getElementById('generateReport');
    if (!gen) return;

    const newBtn = document.createElement('button');
    newBtn.id = 'newReport';
    newBtn.textContent = 'New Report';
    newBtn.className = 'new-report-button';
    newBtn.onclick = () => { if (confirm('Start a new report? This will clear all current data.')) clearAllData(); };
    gen.insertAdjacentElement('afterend', newBtn);
}

// ===================== SYSTEM DETAIL SELECTION =====================
function selectSystemDetail(category, value, element, isOther = false) {
    if (!systemDetails[category]) systemDetails[category] = [];

    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        systemDetails[category] = systemDetails[category].filter(i => i !== value);
        if (isOther) {
            const inp = document.getElementById(category + 'Other');
            if (inp) { inp.classList.add('hidden'); inp.value = ''; }
        }
    } else {
        element.classList.add('selected');
        if (!systemDetails[category].includes(value)) systemDetails[category].push(value);
        if (isOther) {
            const inp = document.getElementById(category + 'Other');
            if (inp) inp.classList.remove('hidden');
        }
    }
    debouncedSave();
}

function updateOtherValue(category, value) {
    if (!systemDetails[category]) systemDetails[category] = [];
    systemDetails[category] = systemDetails[category].filter(i => !i.startsWith('Other:'));
    if (value.trim()) systemDetails[category].push('Other: ' + value.trim());
}

function rebuildSystemDetailsFromDOM() {
    const cats = ['groundType','boundaryType','roofType','roofLayout','airTermination',
                  'airConductors','downConductorNetwork','downConductors','earthTermination'];
    const rebuilt = {};
    cats.forEach(cat => {
        rebuilt[cat] = Array.from(document.querySelectorAll(`#${cat}List .selected`))
            .map(el => el.textContent.trim());
        const inp = document.getElementById(cat + 'Other');
        if (inp && !inp.classList.contains('hidden') && inp.value.trim()) {
            rebuilt[cat].push('Other: ' + inp.value.trim());
        }
    });
    window.systemDetails = rebuilt;
    systemDetails = rebuilt;
}

// ===================== FAILURES =====================
function updateFailuresList() {
    const standard = document.getElementById('standard')?.value;
    const container = document.getElementById('failuresContainer');
    const list = document.getElementById('failuresList');
    if (!container || !list) return;

    if (standard && standardFailures[standard]) {
        container.classList.remove('hidden');
        list.innerHTML = '';
        selectedFailuresList = [];
        updateSelectedFailures();

        standardFailures[standard].forEach(f => {
            const div = document.createElement('div');
            div.className = 'failure-option';
            div.textContent = f.failure;
            div.onclick = () => selectFailure(f, div);
            list.appendChild(div);
        });
    } else {
        container.classList.add('hidden');
        selectedFailuresList = [];
        updateSelectedFailures();
    }
}

function selectFailure(failureObj, element) {
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedFailuresList = selectedFailuresList.filter(f => f.failure !== failureObj.failure);
    } else {
        element.classList.add('selected');
        selectedFailuresList.push({
            failure: failureObj.failure,
            reference: failureObj.ref,
            requirement: failureObj.req,
            comment: '',
            imageData: null
        });
    }
    updateSelectedFailures();
}

function updateSelectedFailures() {
    const container = document.getElementById('selectedFailures');
    if (!container) return;
    container.innerHTML = '';

    selectedFailuresList.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'failure-item';
        div.innerHTML = `
            <h4>${item.failure}</h4>
            <div class="failure-reference">${item.reference}</div>
            <div class="minimum-requirement"><strong>Minimum Requirement:</strong> ${item.requirement}</div>
            <div class="form-group">
                <label>Comment:</label>
                <textarea onchange="updateFailureComment(${index}, this.value)" placeholder="Add detailed comments about this failure...">${item.comment || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Image:</label>
                <div class="image-upload" onclick="document.getElementById('failureImage${index}').click()">
                    <input type="file" id="failureImage${index}" accept="image/*" class="hidden-file-input"
                        onchange="handleFailureImage(${index}, this)">
                    <div id="failureImagePreview${index}">${item.imageData ? 'Image uploaded' : 'Click to upload image'}</div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateFailureComment(index, comment) {
    if (selectedFailuresList[index]) selectedFailuresList[index].comment = comment;
}

// ===================== IMAGE HANDLING =====================
function fixImageOrientation(file) {
    return new Promise((resolve) => {
        EXIF.getData(file, function () {
            const orientation = EXIF.getTag(this, 'Orientation') || 1;
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const isLandscape = img.width > img.height;
                    if (isLandscape && (orientation === 6 || orientation === 8)) {
                        if (orientation === 6) {
                            canvas.width = img.height; canvas.height = img.width;
                            ctx.rotate(90 * Math.PI / 180);
                            ctx.translate(0, -canvas.width);
                        } else {
                            canvas.width = img.height; canvas.height = img.width;
                            ctx.rotate(-90 * Math.PI / 180);
                            ctx.translate(-canvas.height, 0);
                        }
                    } else {
                        canvas.width = img.width; canvas.height = img.height;
                    }
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });
}

function compressImage(base64Str, maxWidth = 800, maxHeight = 800, quality = 0.65) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            const ar = width / height;
            if (width > maxWidth) { width = maxWidth; height = maxWidth / ar; }
            if (height > maxHeight) { height = maxHeight; width = maxHeight * ar; }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = base64Str;
    });
}

function handleImageUpload(input, previewId) {
    if (!input.files[0]) return;
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    if (preview) preview.textContent = 'Processing image...';
    fixImageOrientation(file).then(corrected =>
        compressImage(corrected, 800, 800, 0.65).then(compressed => {
            uploadedImages[previewId] = file;
            uploadedImages[previewId + '_data'] = compressed;
            if (preview) preview.textContent = 'Image uploaded successfully';
            debouncedSave();
        })
    ).catch(() => {
        if (preview) preview.textContent = 'Upload failed';
    });
}

function handleMultipleImageUpload(input, previewId) {
    if (!input.files.length) return;
    const files = Array.from(input.files);
    uploadedImages[previewId] = files;
    uploadedImages[previewId + '_data'] = [];
    const preview = document.getElementById(previewId);
    if (preview) preview.textContent = 'Processing images...';
    let done = 0;
    files.forEach((file, i) => {
        fixImageOrientation(file).then(corrected =>
            compressImage(corrected, 800, 800, 0.65).then(compressed => {
                uploadedImages[previewId + '_data'][i] = compressed;
                done++;
                if (done === files.length) {
                    if (preview) preview.textContent = `${files.length} image(s) uploaded`;
                    debouncedSave();
                }
            })
        );
    });
}

function handleFailureImage(index, input) {
    if (!input.files[0]) return;
    const file = input.files[0];
    const preview = document.getElementById(`failureImagePreview${index}`);
    if (preview) preview.textContent = 'Processing image...';
    fixImageOrientation(file).then(corrected => {
        if (selectedFailuresList[index]) {
            selectedFailuresList[index].image = file;
            selectedFailuresList[index].imageData = corrected;
        }
        if (preview) preview.textContent = 'Image uploaded';
        debouncedSave();
    }).catch(() => {
        const reader = new FileReader();
        reader.onload = e => { if (selectedFailuresList[index]) selectedFailuresList[index].imageData = e.target.result; };
        reader.readAsDataURL(file);
        if (preview) preview.textContent = 'Image uploaded';
    });
}

// ===================== EARTH TABLE =====================
const earthDropdownOptions = {
    testClamp: ['','Stainless','Bi-Metallic','G-Clamp','A-Clamp','Sq. Clamp','Oblong','B-Bond','Coffin Clamp','Other'],
    pitType:   ['','Concrete','Polymer','None','Other'],
    testType:  ['','Dead','FOP','Continuity','Reference','No Test'],
    groundType:['','Gravel','Tarmac','Soft','Slabs','Concrete','Astro','Other'],
    earthType: ['','Earth Rod','Earth Matt','B-Ring','REF','Foundations','Other','Unknown']
};

function createDropdownOptions(type) {
    return earthDropdownOptions[type].map(o => `<option value="${o}">${o}</option>`).join('');
}

function generateEarthTable() {
    const numEl = document.getElementById('numEarths');
    const container = document.getElementById('earthTableContainer');
    const tbody = document.getElementById('earthTableBody');
    if (!numEl || !container || !tbody) return;
    const num = parseInt(numEl.value) || 0;

    if (num > 0) {
        container.classList.remove('hidden');
        tbody.innerHTML = '';
        // Only reinitialise if we don't already have restored data
        if (!earthTableData.length || earthTableData.length !== num) {
            earthTableData = [];
            for (let i = 1; i <= num; i++) {
                earthTableData.push({ earthNumber: i, resistance: 0, testClamp: '', pitType: '', testType: '', groundType: '', earthType: '', comment: '' });
            }
        }
        for (let i = 1; i <= num; i++) {
            tbody.appendChild(createEarthTableRow(i));
        }
        calculateOverallResistance();
    } else {
        container.classList.add('hidden');
        earthTableData = [];
        const er = document.getElementById('earthResult');
        if (er) er.classList.add('hidden');
    }
}

function createEarthTableRow(n) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="earth-number">E${n}</td>
        <td><input type="number" step="0.01" min="0" placeholder="0.00" onchange="updateEarthResistance(${n-1},this.value)"></td>
        <td><select onchange="updateEarthDropdown(${n-1},'testClamp',this.value)">${createDropdownOptions('testClamp')}</select></td>
        <td><select onchange="updateEarthDropdown(${n-1},'pitType',this.value)">${createDropdownOptions('pitType')}</select></td>
        <td><select onchange="updateEarthDropdown(${n-1},'testType',this.value)">${createDropdownOptions('testType')}</select></td>
        <td><select onchange="updateEarthDropdown(${n-1},'groundType',this.value)">${createDropdownOptions('groundType')}</select></td>
        <td><select onchange="updateEarthDropdown(${n-1},'earthType',this.value)">${createDropdownOptions('earthType')}</select></td>
        <td><input type="text" placeholder="Comment..." onchange="updateEarthComment(${n-1},this.value)"></td>
    `;
    return row;
}

function updateEarthResistance(index, value) {
    if (earthTableData[index]) {
        earthTableData[index].resistance = parseFloat(value) || 0;
        calculateOverallResistance();
    }
}

function updateEarthDropdown(index, field, value) {
    if (!earthTableData[index]) return;
    earthTableData[index][field] = value;
    // Auto-populate from first row
    if (index === 0 && value !== '') {
        const fieldMap = { testClamp:2, pitType:3, testType:4, groundType:5, earthType:6 };
        const colIdx = fieldMap[field];
        for (let i = 1; i < earthTableData.length; i++) {
            earthTableData[i][field] = value;
            const tbody = document.getElementById('earthTableBody');
            if (tbody && colIdx) {
                const sel = tbody.children[i]?.children[colIdx]?.querySelector('select');
                if (sel) sel.value = value;
            }
        }
    }
}

function updateEarthComment(index, value) {
    if (earthTableData[index]) earthTableData[index].comment = value;
}

function calculateOverallResistance() {
    const valid = earthTableData.map(e => e.resistance).filter(r => r > 0);
    const resultEl = document.getElementById('earthResult');
    const valEl = document.getElementById('overallResistance');
    if (valid.length > 0) {
        const overall = 1 / valid.reduce((sum, r) => sum + 1/r, 0);
        if (resultEl) resultEl.classList.remove('hidden');
        if (valEl) {
            valEl.textContent = overall.toFixed(2) + ' Ω';
            valEl.style.color = overall <= 10 ? '#28a745' : '#dc3545';
        }
    } else {
        if (resultEl) resultEl.classList.add('hidden');
    }
}

function calculateOverallResistanceValue() {
    const valid = earthTableData.map(e => e.resistance).filter(r => r > 0);
    if (!valid.length) return 0;
    return 1 / valid.reduce((sum, r) => sum + 1/r, 0);
}

function getEarthTableData() {
    return {
        numEarths: earthTableData.length,
        earthData: earthTableData,
        overallResistance: calculateOverallResistanceValue()
    };
}

function restoreEarthTableFields() {
    const tbody = document.getElementById('earthTableBody');
    if (!tbody || !earthTableData.length) return;
    earthTableData.forEach((ed, i) => {
        const row = tbody.children[i];
        if (!row) return;
        const ri = row.children[1]?.querySelector('input[type="number"]');
        if (ri && ed.resistance) ri.value = ed.resistance;
        [['testClamp',2],['pitType',3],['testType',4],['groundType',5],['earthType',6]].forEach(([f,c]) => {
            const sel = row.children[c]?.querySelector('select');
            if (sel && ed[f]) sel.value = ed[f];
        });
        const ci = row.children[7]?.querySelector('input[type="text"]');
        if (ci && ed.comment) ci.value = ed.comment;
    });
}
