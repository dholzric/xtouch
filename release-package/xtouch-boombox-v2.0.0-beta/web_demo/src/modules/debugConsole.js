/**
 * @file debugConsole.js
 * Debug console for the demo
 */

export class DebugConsole {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.container = null;
        this.isVisible = true;
    }
    
    init() {
        this.container = document.getElementById('console-output');
        if (!this.container) {
            console.warn('Console output container not found');
        }
        console.log('DebugConsole initialized');
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            level,
            id: Date.now() + Math.random()
        };
        
        this.logs.push(logEntry);
        
        // Limit log count
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Update display
        this.updateDisplay();
        
        // Also log to browser console
        console[level] ? console[level](message) : console.log(message);
    }
    
    updateDisplay() {
        if (!this.container) return;
        
        const logHtml = this.logs.map(log => 
            `<div class="console-line ${log.level}">
                <span class="timestamp">[${log.timestamp}]</span>
                <span class="level">${log.level.toUpperCase()}</span>
                <span class="message">${this.escapeHtml(log.message)}</span>
            </div>`
        ).join('');
        
        this.container.innerHTML = logHtml;
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    clear() {
        this.logs = [];
        this.updateDisplay();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    show() {
        this.isVisible = true;
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}