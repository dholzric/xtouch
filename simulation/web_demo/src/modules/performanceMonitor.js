/**
 * @file performanceMonitor.js
 * Performance monitoring for the demo
 */

export class PerformanceMonitor {
    constructor() {
        this.isRunning = false;
        this.stats = {
            fps: 0,
            memory: 0,
            cpu: 0,
            audio: {
                latency: 0,
                bufferSize: 0,
                dropouts: 0
            }
        };
        this.frameCount = 0;
        this.lastTime = 0;
        this.updateInterval = null;
    }
    
    init() {
        console.log('PerformanceMonitor initialized');
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 1000);
        
        console.log('Performance monitoring started');
    }
    
    stop() {
        this.isRunning = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        console.log('Performance monitoring stopped');
    }
    
    updateStats() {
        // Calculate FPS
        const now = performance.now();
        this.stats.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
        this.frameCount = 0;
        this.lastTime = now;
        
        // Mock CPU usage
        this.stats.cpu = Math.random() * 30 + 10;
        
        // Mock memory usage
        if (performance.memory) {
            this.stats.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        } else {
            this.stats.memory = Math.random() * 50 + 100;
        }
        
        // Mock audio stats
        this.stats.audio.latency = Math.random() * 5 + 5;
        this.stats.audio.bufferSize = 512;
        this.stats.audio.dropouts = Math.floor(Math.random() * 3);
    }
    
    frame() {
        if (this.isRunning) {
            this.frameCount++;
        }
    }
    
    getStats() {
        return { ...this.stats };
    }
}