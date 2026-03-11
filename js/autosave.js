// =============================================================================
// autosave.js — Generic auto-save / restore for StrikeR report pages
// Mirrors the T&I save pattern. Each report calls initAutoSave(config) on load.
// =============================================================================

(function () {

    const SAVE_DELAY = 500;
    let _config      = null;
    let _saveTimeout = null;
    let _isRestoring = false;

    // ---- Public entry point ----
    window.initAutoSave = function (config) {
        // config = {
        //   storageKey : string,
        //   fields     : [string, ...]          — text/number/date/select/textarea IDs
        //   checkboxes : [string, ...]           — checkbox IDs
        //   signature  : string | null           — window property name e.g. 'siteStaffSignature'
        //   onSave     : function() → {}         — returns extra data to merge into save obj
        //   onRestore  : function(saved) → void  — called after fields restored with full saved obj
        //   clearExtra : function() → void       — extra clear steps (reset UI state etc)
        //   dateFields : [string, ...]           — fields to default to today if empty on clear
        // }
        _config = config;

        // Watch all static inputs
        document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea, select')
            .forEach(el => {
                el.addEventListener('input',  _debouncedSave);
                el.addEventListener('change', _debouncedSave);
            });

        // Watch dynamically added inputs (repair qty/earth fields etc)
        document.addEventListener('input',  e => { if (!e.target.closest('input[type="file"]')) _debouncedSave(); });
        document.addEventListener('change', e => { if (!e.target.closest('input[type="file"]')) _debouncedSave(); });

        window.addEventListener('beforeunload', () => { if (!_isRestoring) _save(); });

        _restore();
        _injectNewReportButton();
    };

    // ---- Public manual trigger (call after images load etc) ----
    window.triggerAutoSave = function () { _debouncedSave(); };

    // ---- Debounced save ----
    function _debouncedSave() {
        if (_isRestoring) return;
        clearTimeout(_saveTimeout);
        _saveTimeout = setTimeout(_save, SAVE_DELAY);
    }

    // ---- Save ----
    function _save() {
        if (!_config || _isRestoring) return;
        try {
            const data = { savedAt: new Date().toISOString() };

            // Text / number / date / select / textarea
            (_config.fields || []).forEach(id => {
                const el = document.getElementById(id);
                if (el) data[id] = el.value;
            });

            // Checkboxes — save as array of checked IDs
            const checkedBoxes = [];
            (_config.checkboxes || []).forEach(id => {
                const el = document.getElementById(id);
                if (el && el.checked) checkedBoxes.push(id);
            });
            data._checkboxes = checkedBoxes;

            // Signature
            if (_config.signature && window[_config.signature]) {
                data._signature = window[_config.signature].signatureData || null;
            }

            // Extra data from report (images, selected repairs, etc)
            if (typeof _config.onSave === 'function') {
                Object.assign(data, _config.onSave());
            }

            localStorage.setItem(_config.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('AutoSave failed:', e);
        }
    }

    // ---- Restore ----
    function _restore() {
        if (!_config) return;
        try {
            const raw = localStorage.getItem(_config.storageKey);
            if (!raw) return;
            _isRestoring = true;
            const d = JSON.parse(raw);

            // Fields
            (_config.fields || []).forEach(id => {
                const el = document.getElementById(id);
                if (el && d[id] !== undefined && d[id] !== null && d[id] !== '') {
                    el.value = d[id];
                }
            });

            // Checkboxes
            if (Array.isArray(d._checkboxes)) {
                (_config.checkboxes || []).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.checked = d._checkboxes.includes(id);
                });
            }

            // Signature
            if (_config.signature && d._signature && window[_config.signature]) {
                const sig = window[_config.signature];
                sig.signatureData = d._signature;
                sig.updateStatus('Signature restored');
                if (typeof sig.redraw === 'function') sig.redraw();
            }

            // Report-specific restore (images, repairs state, etc)
            if (typeof _config.onRestore === 'function') {
                _config.onRestore(d);
            }

            setTimeout(() => {
                _isRestoring = false;
                _save();
            }, 1500);

        } catch (e) {
            console.error('AutoSave restore failed:', e);
            _isRestoring = false;
        }
    }

    // ---- Clear ----
    window.clearReportData = function () {
        if (!_config) return;
        localStorage.removeItem(_config.storageKey);

        // Fields
        (_config.fields || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Checkboxes
        (_config.checkboxes || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = false;
        });

        // Signature
        if (_config.signature && window[_config.signature]) {
            window[_config.signature].clear();
        }

        // Default date fields to today
        (_config.dateFields || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = new Date().toISOString().split('T')[0];
        });

        // Report-specific clear
        if (typeof _config.clearExtra === 'function') {
            _config.clearExtra();
        }
    };

    // ---- Inject "New Report" button below generate button — matches T&I exactly ----
    function _injectNewReportButton() {
        const genBtn = document.querySelector('.sticky-generate button');
        if (!genBtn || document.getElementById('newReportBtn')) return;

        const btn = document.createElement('button');
        btn.id          = 'newReportBtn';
        btn.textContent = 'New Report';
        btn.className   = 'new-report-button';
        btn.onclick = () => {
            if (confirm('Start a new report? This will clear all current data.')) {
                window.clearReportData();
                if (typeof updateAllDots === 'function') updateAllDots();
            }
        };
        // Insert directly after the generate button — same as T&I's afterend pattern
        genBtn.insertAdjacentElement('afterend', btn);
    }

})();
