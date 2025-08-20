/**
 * @file touchController.js
 * Touch input simulation controller
 */

export class TouchController {
    constructor() {
        this.enabled = true;
        this.touchHistory = [];
        this.maxHistory = 50;
        this.calibration = {
            xMin: 0,
            xMax: 320,
            yMin: 0,
            yMax: 240
        };
    }
    
    init() {
        console.log('TouchController initialized');
    }
    
    handleTouch(x, y) {
        if (!this.enabled) return;
        
        // Record touch point
        const touchPoint = {
            x: Math.round(x),
            y: Math.round(y),
            timestamp: Date.now()
        };
        
        this.touchHistory.push(touchPoint);
        
        // Limit history
        if (this.touchHistory.length > this.maxHistory) {
            this.touchHistory.shift();
        }
        
        // Process touch based on screen area
        this.processTouchInput(touchPoint);
    }
    
    processTouchInput(touch) {
        // Map touch coordinates to UI elements
        const uiElement = this.getTouchedElement(touch.x, touch.y);
        
        if (uiElement) {
            console.log(`Touch detected on: ${uiElement.type} at (${touch.x}, ${touch.y})`);
            this.triggerUIAction(uiElement, touch);
        }
    }
    
    getTouchedElement(x, y) {
        // Define touch areas for landscape layout (320x240)
        const areas = [
            { type: 'play_button', x1: 120, y1: 120, x2: 200, y2: 180 },
            { type: 'volume_up', x1: 260, y1: 60, x2: 310, y2: 100 },
            { type: 'volume_down', x1: 260, y1: 140, x2: 310, y2: 180 },
            { type: 'eq_button', x1: 10, y1: 200, x2: 100, y2: 230 },
            { type: 'settings_button', x1: 220, y1: 200, x2: 310, y2: 230 }
        ];
        
        for (const area of areas) {
            if (x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2) {
                return area;
            }
        }
        
        return { type: 'screen', x, y };
    }
    
    triggerUIAction(element, touch) {
        // Simulate button press
        switch (element.type) {
            case 'play_button':
                this.simulateButtonPress('play-btn');
                break;
            case 'volume_up':
                this.adjustVolume(5);
                break;
            case 'volume_down':
                this.adjustVolume(-5);
                break;
            case 'eq_button':
                this.navigateToScreen('equalizer');
                break;
            case 'settings_button':
                this.navigateToScreen('settings');
                break;
            default:
                console.log(`Touch on screen at (${touch.x}, ${touch.y})`);
        }
    }
    
    simulateButtonPress(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.click();
            // Visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 100);
        }
    }
    
    adjustVolume(delta) {
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            const currentValue = parseInt(volumeSlider.value);
            const newValue = Math.max(0, Math.min(100, currentValue + delta));
            volumeSlider.value = newValue;
            volumeSlider.dispatchEvent(new Event('input'));
        }
    }
    
    navigateToScreen(screenName) {
        const tabButton = document.querySelector(`[data-screen="${screenName}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Touch simulation ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    isEnabled() {
        return this.enabled;
    }
    
    calibrate(corners) {
        // Calibrate touch coordinates
        this.calibration = {
            xMin: corners.topLeft.x,
            xMax: corners.bottomRight.x,
            yMin: corners.topLeft.y,
            yMax: corners.bottomRight.y
        };
        
        console.log('Touch calibrated:', this.calibration);
    }
    
    getTouchHistory() {
        return [...this.touchHistory];
    }
    
    clearHistory() {
        this.touchHistory = [];
    }
}