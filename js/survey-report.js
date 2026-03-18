// Enhanced Survey Report JavaScript
// File: js/survey-report.js

// Initialize the survey report
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const surveyDateElement = document.getElementById('surveyDate');
    if (surveyDateElement) {
        surveyDateElement.valueAsDate = new Date();
    }

    // Start auto-save
    initSurveyAutoSave();
});

// Get selected checkboxes for any category
function getSelectedCheckboxes(className) {
    const selected = [];
    const checkboxes = document.querySelectorAll('.' + className + ':checked');
    
    checkboxes.forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
            selected.push(label.textContent);
        }
    });
    
    return selected;
}

// Get selected ground types
function getSelectedGroundTypes() {
    return getSelectedCheckboxes('ground-checkbox');
}

// Get selected wall types
function getSelectedWallTypes() {
    return getSelectedCheckboxes('wall-checkbox');
}

// Get selected system components
function getSelectedSystemComponents() {
    return getSelectedCheckboxes('system-checkbox');
}

// Get selected risk factors
function getSelectedRiskFactors() {
    return getSelectedCheckboxes('risk-checkbox');
}

// Get selected electrical systems
function getSelectedElectricalSystems() {
    return getSelectedCheckboxes('electrical-checkbox');
}

// Generate auto-description based on form data (NOT calling getSurveyData to avoid circular reference)
function generateAutoDescription() {
    let description = '';
    
    // Get form data directly without calling getSurveyData()
    const structureType = document.getElementById('structureType')?.value || '';
    const structureHeight = document.getElementById('structureHeight')?.value || '';
    const buildingAge = document.getElementById('buildingAge')?.value || '';
    const numberOfFloors = document.getElementById('numberOfFloors')?.value || '';
    const numberOfOccupants = document.getElementById('numberOfOccupants')?.value || '';
    const roofType = document.getElementById('roofType')?.value || '';
    const roofAccess = document.getElementById('roofAccess')?.value || '';
    const existingSystem = document.getElementById('existingSystem')?.value || '';
    const systemCondition = document.getElementById('systemCondition')?.value || '';
    const lastTested = document.getElementById('lastTested')?.value || '';
    const standardInstalled = document.getElementById('standardInstalled')?.value || '';
    
    // Get checkbox selections directly
    const wallTypes = getSelectedWallTypes();
    const groundTypes = getSelectedGroundTypes();
    const systemComponents = getSelectedSystemComponents();
    const electricalSystems = getSelectedElectricalSystems();
    
    // Helper function to format lists with proper grammar
    function formatList(items) {
        if (items.length === 0) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return items.join(' and ');
        return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    }
    
    // ==================== STRUCTURE INFORMATION ====================
    if (structureType || structureHeight || wallTypes.length > 0 || groundTypes.length > 0 || buildingAge || numberOfFloors || numberOfOccupants || roofType || roofAccess) {
        description += 'The surveyed structure';
        
        if (buildingAge) {
            description += `, built approximately ${buildingAge} years ago,`;
        }
        
        if (structureType) {
            description += ` is operated as a ${structureType}.`;
        } else {
            description += '.';
        }
        
        // Second sentence of structure paragraph
        let structureDetails = [];
        if (structureHeight) structureDetails.push(`approximately ${structureHeight}m in height`);
        if (wallTypes.length > 0) structureDetails.push(`${formatList(wallTypes)} construction`);
        if (groundTypes.length > 0) structureDetails.push(`the surrounding ground consisting of ${formatList(groundTypes)}`);
        
        if (structureDetails.length > 0) {
            description += ` The structure is ${structureDetails.join(' with ')}.`;
        }
        
        description += '\n\n';
        
        // Third sentence - floors, occupants, roof
        let buildingDetails = [];
        if (numberOfFloors) buildingDetails.push(`${numberOfFloors}-floor building`);
        if (numberOfOccupants) buildingDetails.push(`accommodates a maximum of ${numberOfOccupants} occupants`);
        
        let roofDetails = [];
        if (roofType) roofDetails.push(`${roofType.toLowerCase()} roofing`);
        if (roofAccess) roofDetails.push(`${roofAccess.toLowerCase()}`);
        
        if (buildingDetails.length > 0 || roofDetails.length > 0) {
            description += 'The ';
            if (buildingDetails.length > 0) {
                description += buildingDetails.join(' ');
            }
            if (roofDetails.length > 0) {
                if (buildingDetails.length > 0) description += ' and ';
                description += `features ${roofDetails.join(' with ')}.`;
            } else if (buildingDetails.length > 0) {
                description += '.';
            }
        }
    }
    
    // ==================== SYSTEM INFORMATION ====================
    if (existingSystem || systemCondition || lastTested || standardInstalled || systemComponents.length > 0) {
        if (description.length > 0) description += '\n\n';
        
        if (existingSystem) {
            description += `The existing lightning protection system is assessed as ${existingSystem}`;
            
            if (systemCondition) {
                description += ` with ${systemCondition.toLowerCase()} overall condition`;
            }
            
            if (lastTested) {
                description += `, which was last tested ${lastTested.toLowerCase()}.`;
            } else {
                description += '.';
            }
            
            description += '\n\n';
            
            if (standardInstalled) {
                description += `The system was installed to ${standardInstalled} standard.`;
            }
            
            if (systemComponents.length > 0) {
                if (standardInstalled) description += ' ';
                description += `Visible system components include ${formatList(systemComponents.map(c => c.toLowerCase()))}.`;
            }
        }
    }
    
    // ==================== CONNECTED ELECTRICAL EQUIPMENT ====================
    if (electricalSystems.length > 0) {
        if (description.length > 0) description += '\n\n';
        
        description += `The electrical infrastructure comprises of ${formatList(electricalSystems)}.\n\n`;
        description += 'This indicates that comprehensive surge protection measures for coordinated system protection are highly recommended.';
    }
    
    return description.trim();
}
// Clear all survey data
function clearSurveyData() {
    if (confirm('Are you sure you want to clear all survey data and start a new report?')) {
        // Clear basic fields
        document.getElementById('siteAddress').value = '';
        document.getElementById('surveyDate').valueAsDate = new Date();
        document.getElementById('surveyorName').value = '';

        
        // Clear structure fields
        document.getElementById('structureType').value = '';
        document.getElementById('structureHeight').value = '';
        document.getElementById('buildingAge').value = '';
        document.getElementById('numberOfFloors').value = '';
        document.getElementById('numberOfOccupants').value = '';
        document.getElementById('hasBasement').value = '';
        document.getElementById('roofType').value = '';
        document.getElementById('roofAccess').value = '';
        
        // Clear system fields
        document.getElementById('existingSystem').value = 'None Visible';
        document.getElementById('systemCondition').value = '';
        document.getElementById('lastTested').value = '';
        document.getElementById('standardInstalled').value = '';
        
        // Clear text areas
        document.getElementById('surveyFindings').value = '';
        document.getElementById('recommendations').value = '';
        
        // Clear all checkboxes
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear signature

        
        // Clear uploaded images
        window.uploadedImages = {};
        
        document.getElementById('buildingImagePreview').textContent = 'Click to upload building photo';
        document.getElementById('additionalPhotosPreview').textContent = 'Click to upload survey photos';
        
        console.log('Survey form cleared');
    }
}

// Export comprehensive survey data for PDF generation (WITHOUT calling generateAutoDescription)
function getSurveyData() {
    return {
        // Basic information
        jobReference: document.getElementById('jobReference')?.value || '',
        siteAddress: document.getElementById('siteAddress')?.value || '',
        surveyDate: document.getElementById('surveyDate')?.value || '',
        surveyorName: document.getElementById('surveyorName')?.value || '',

        
        // Structure details
        structureType: document.getElementById('structureType')?.value || '',
        structureHeight: document.getElementById('structureHeight')?.value || '',
        buildingAge: document.getElementById('buildingAge')?.value || '',
        numberOfFloors: document.getElementById('numberOfFloors')?.value || '',
        numberOfOccupants: document.getElementById('numberOfOccupants')?.value || '',
        hasBasement: document.getElementById('hasBasement')?.value || '',
        roofType: document.getElementById('roofType')?.value || '',
        roofAccess: document.getElementById('roofAccess')?.value || '',
        
        // Checkbox selections
        groundTypes: getSelectedGroundTypes(),
        wallTypes: getSelectedWallTypes(),
        systemComponents: getSelectedSystemComponents(),
        riskFactors: getSelectedRiskFactors(),
        electricalSystems: getSelectedElectricalSystems(),
        
        // Existing system
        existingSystem: document.getElementById('existingSystem')?.value || '',
        systemCondition: document.getElementById('systemCondition')?.value || '',
        lastTested: document.getElementById('lastTested')?.value || '',
        standardInstalled: document.getElementById('standardInstalled')?.value || '',
        
        // Comments
        surveyFindings: document.getElementById('surveyFindings')?.value || '',
        recommendations: document.getElementById('recommendations')?.value || '',
        
        // Signature

        
        // Auto-generated description - call the function separately to avoid circular reference
        autoDescription: generateAutoDescription()
    };
}

// Validate survey data before PDF generation
function validateSurveyData() {
    const data = getSurveyData();
    const errors = [];
    
    if (!data.siteAddress.trim()) {
        errors.push('Site Address is required');
    }
    
    if (!data.surveyorName.trim()) {
        errors.push('Surveyor Name is required');
    }
    
    if (errors.length > 0) {
        alert('Please complete the following required fields:\n\n' + errors.join('\n'));
        return false;
    }
    
    return true;
}

// ===================== AUTO-SAVE CONFIG =====================
// Called from DOMContentLoaded after signature is ready
function initSurveyAutoSave() {
    initAutoSave({
        storageKey: 'splp_survey_autosave_v1',
        fields: [
            'siteName','jobReference','siteAddress','surveyDate','surveyorName',
            'structureType','structureHeight','buildingAge','numberOfFloors','numberOfOccupants',
            'hasBasement','roofType','roofAccess','existingSystem','systemCondition',
            'lastTested','standardInstalled','surveyFindings'
        ],
        checkboxes: [
            'groundGravel','groundGrass','groundSoil','groundBlockPaving','groundTarmac',
            'groundConcrete','groundResinGravel',
            'wallBrick','wallConcrete','wallSteel','wallWood','wallMetal','wallGlass',
            'wallStone','wallComposite',
            'airTerminalsPresent','downConductorsVisible','earthSystemAccessible',
            'spdInstallation','testRecordsAvailable','asInstalledAvailable',
            'testClamps','bondingVisible',
            'heightRisk','isolationRisk','hilltopRisk','metalRoof','flammableRisk',
            'occupancyRisk','electronicRisk','historicRisk','explosiveRisk',
            'criticalInfrastructure','previousDamage','nearbyUtilities','waterExposure',
            'externalTanks','crowdedArea','meteorologicalRisk',
            'powerLV','powerHV','emergencyPower','telecomData','internet','cctv',
            'fireAlarm','securityAlarm','accessControl','externalLighting',
            'emergencyLighting','signageLighting','hvacControls','buildingManagement',
            'liftSystems','industrialControls','medicalEquipment','serverRoom'
        ],

        dateFields: ['surveyDate'],
        onSave: () => {
            // Save images from window.uploadedImages
            const imgs = {};
            const ui = window.uploadedImages || {};
            if (ui['buildingImagePreview_data']) imgs['buildingImagePreview_data'] = ui['buildingImagePreview_data'];
            if (ui['additionalPhotosPreview_data']) imgs['additionalPhotosPreview_data'] = ui['additionalPhotosPreview_data'];
            return { _images: imgs };
        },
        onRestore: (d) => {
            if (d._images) {
                window.uploadedImages = window.uploadedImages || {};
                if (d._images['buildingImagePreview_data']) {
                    window.uploadedImages['buildingImagePreview_data'] = d._images['buildingImagePreview_data'];
                    const el = document.getElementById('buildingImagePreview');
                    if (el) el.textContent = '✓ Building image restored';
                }
                if (d._images['additionalPhotosPreview_data']) {
                    window.uploadedImages['additionalPhotosPreview_data'] = d._images['additionalPhotosPreview_data'];
                    const arr = d._images['additionalPhotosPreview_data'];
                    const el = document.getElementById('additionalPhotosPreview');
                    if (el) el.textContent = '✓ ' + (Array.isArray(arr) ? arr.length : 1) + ' photo(s) restored';
                }
            }
            if (typeof updateAllDots === 'function') setTimeout(updateAllDots, 200);
        },
        clearExtra: () => {
            window.uploadedImages = {};
            const bp = document.getElementById('buildingImagePreview');
            if (bp) bp.textContent = 'Click to upload building photo';
            const ap = document.getElementById('additionalPhotosPreview');
            if (ap) ap.textContent = 'Click to upload survey photos';

            if (typeof updateAllDots === 'function') updateAllDots();
        }
    });
}
