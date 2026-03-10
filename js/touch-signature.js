// Touch Signature Component - Reusable across all reports
// File: js/touch-signature.js

class TouchSignature {
    constructor(canvasId, clearButtonId, saveButtonId, statusId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.clearBtn = document.getElementById(clearButtonId);
        this.saveBtn = document.getElementById(saveButtonId);
        this.status = document.getElementById(statusId);
        
        this.isDrawing = false;
        this.signatureData = null;
        
        this.init();
    }
    
    init() {
        // Set canvas properties
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Add event listeners
        this.addEventListeners();
        
        // Set initial status
        this.updateStatus('Please sign above');
    }
    
    addEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('mouseout', (e) => this.stopDrawing(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchend', (e) => this.stopDrawing(e));
        
        // Button events
        this.clearBtn.addEventListener('click', () => this.clear());
        this.saveBtn.addEventListener('click', () => this.save());
    }
    
    getPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let x, y;
        
        if (event.touches) {
            // Touch event
            x = (event.touches[0].clientX - rect.left) * scaleX;
            y = (event.touches[0].clientY - rect.top) * scaleY;
        } else {
            // Mouse event
            x = (event.clientX - rect.left) * scaleX;
            y = (event.clientY - rect.top) * scaleY;
        }
        
        return { x, y };
    }
    
    startDrawing(event) {
        event.preventDefault();
        this.isDrawing = true;
        
        const pos = this.getPosition(event);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        this.updateStatus('Signing...');
    }
    
    draw(event) {
        if (!this.isDrawing) return;
        event.preventDefault();
        
        const pos = this.getPosition(event);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    handleTouch(event) {
        event.preventDefault();
        
        if (event.type === 'touchstart') {
            this.startDrawing(event);
        } else if (event.type === 'touchmove') {
            this.draw(event);
        }
    }
    
    stopDrawing(event) {
        if (!this.isDrawing) return;
        event.preventDefault();
        
        this.isDrawing = false;
        this.ctx.beginPath();
        
        this.updateStatus('Signature ready - click Save to confirm');
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.signatureData = null;
        this.updateStatus('Please sign above');
        this.status.classList.remove('saved');
    }
    
    save() {
        // Check if canvas has content
        if (!this.hasSignature()) {
            alert('Please provide a signature before saving.');
            return false;
        }
        
        // Save signature as data URL
        this.signatureData = this.canvas.toDataURL('image/png');
        
        this.updateStatus('Signature saved successfully ✓');
        this.status.classList.add('saved');
        
        console.log('Signature saved');
        return true;
    }
    
    hasSignature() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData.data.some((channel, index) => {
            return index % 4 === 3 && channel !== 0; // Check alpha channel
        });
    }
    
    updateStatus(message) {
        this.status.textContent = message;
    }
    
    getSignatureData() {
        return this.signatureData;
    }
    
    // Method to check if signature is saved
    isSaved() {
        return this.signatureData !== null;
    }
    
    // Method to reset the component
    reset() {
        this.clear();
    }
    
    // Method to redraw the signature
    redraw() {
        if (this.signatureData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.updateStatus('Signature restored');
                this.status.classList.add('saved');
            };
            img.src = this.signatureData;
        }
    }
}

// Global function to create signature instances easily
function createTouchSignature(canvasId, clearButtonId, saveButtonId, statusId) {
    return new TouchSignature(canvasId, clearButtonId, saveButtonId, statusId);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchSignature;
}
