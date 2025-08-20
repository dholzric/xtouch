/**
 * @file index.js
 * Main entry point for xtouch Web Demo
 */

import { AudioEngine } from './modules/audioEngine.js';
import { DeviceSimulator } from './modules/deviceSimulator.js';
import { UISimulator } from './modules/uiSimulator.js';
import { PerformanceMonitor } from './modules/performanceMonitor.js';
import { DebugConsole } from './modules/debugConsole.js';
import { TouchController } from './modules/touchController.js';

class XTouchDemo {
    constructor() {
        this.audioEngine = null;
        this.deviceSimulator = null;
        this.uiSimulator = null;
        this.performanceMonitor = null;
        this.debugConsole = null;
        this.touchController = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentTrack = null;
        
        // Demo state
        this.demoMode = 'realtime';
        this.autoDemo = false;
        this.hardwareSimulation = {
            wifi: true,
            battery: 100,
            sdCard: true
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing xtouch Demo...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize modules
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start demo sequence
            await this.startDemoSequence();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('xtouch Demo initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize xtouch Demo:', error);
            this.showError('Failed to initialize demo. Please refresh and try again.');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('progress-bar');
        
        loadingScreen.classList.remove('hidden');
        
        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainInterface = document.getElementById('main-interface');
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            mainInterface.classList.remove('hidden');
        }, 500);
    }

    async initializeModules() {
        // Initialize Debug Console first for logging
        this.debugConsole = new DebugConsole();
        this.debugConsole.log('Initializing audio engine...', 'info');
        
        // Initialize Audio Engine
        this.audioEngine = new AudioEngine();
        await this.audioEngine.init();
        this.debugConsole.log('Audio engine initialized', 'info');
        
        // Initialize Device Simulator
        this.debugConsole.log('Initializing device simulator...', 'info');
        this.deviceSimulator = new DeviceSimulator();
        await this.deviceSimulator.init();
        this.debugConsole.log('Device simulator initialized', 'info');
        
        // Initialize UI Simulator
        this.debugConsole.log('Initializing UI simulator...', 'info');
        this.uiSimulator = new UISimulator();
        await this.uiSimulator.init();
        this.debugConsole.log('UI simulator initialized', 'info');
        
        // Initialize Performance Monitor
        this.performanceMonitor = new PerformanceMonitor();
        this.performanceMonitor.init();
        
        // Initialize Touch Controller
        this.touchController = new TouchController();
        this.touchController.init();
        
        this.debugConsole.log('All modules initialized', 'info');
    }

    setupEventListeners() {
        // Header controls
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.getElementById('info-btn').addEventListener('click', () => {
            this.showInfoModal();
        });
        
        // Modal controls
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideInfoModal();
        });
        
        // Audio controls
        document.getElementById('audio-file').addEventListener('change', (e) => {
            this.loadAudioFile(e.target.files[0]);
        });
        
        document.getElementById('demo-track-btn').addEventListener('click', () => {
            this.loadDemoTrack();
        });
        
        document.getElementById('master-play').addEventListener('click', () => {
            this.togglePlayback();
        });
        
        document.getElementById('master-pause').addEventListener('click', () => {
            this.pausePlayback();
        });
        
        document.getElementById('master-stop').addEventListener('click', () => {
            this.stopPlayback();
        });
        
        document.getElementById('master-volume').addEventListener('input', (e) => {
            this.setMasterVolume(e.target.value / 100);
        });
        
        // Device UI controls
        document.getElementById('play-btn').addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Navigation tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToScreen(e.target.dataset.screen);
            });
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateToScreen(e.target.dataset.target);
            });
        });
        
        // Equalizer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyEqualizerPreset(e.target.dataset.preset);
            });
        });
        
        // Simulation controls
        document.getElementById('simulation-mode').addEventListener('change', (e) => {
            this.setSimulationMode(e.target.value);
        });
        
        document.getElementById('enable-touch').addEventListener('click', (e) => {
            this.toggleTouchSimulation(e.target);
        });
        
        document.getElementById('auto-demo').addEventListener('click', () => {
            this.toggleAutoDemo();
        });
        
        // Hardware simulation buttons
        document.getElementById('simulate-wifi').addEventListener('click', (e) => {
            this.toggleWiFiSimulation(e.target);
        });
        
        document.getElementById('simulate-low-battery').addEventListener('click', (e) => {
            this.toggleBatterySimulation(e.target);
        });
        
        document.getElementById('simulate-sd-error').addEventListener('click', (e) => {
            this.toggleSDCardSimulation(e.target);
        });
        
        // Console command input
        document.getElementById('console-command').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processConsoleCommand(e.target.value);
                e.target.value = '';
            }
        });
        
        document.getElementById('console-send').addEventListener('click', () => {
            const input = document.getElementById('console-command');
            this.processConsoleCommand(input.value);
            input.value = '';
        });
        
        // Touch layer for device interaction
        document.getElementById('touch-layer').addEventListener('click', (e) => {
            this.handleDeviceTouch(e);
        });
        
        // Window events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    async startDemoSequence() {
        // Start with intro screen
        this.uiSimulator.showScreen('intro');
        
        // Simulate boot sequence
        await this.sleep(2000);
        this.debugConsole.log('Boot sequence complete', 'info');
        
        // Transition to home screen
        this.uiSimulator.showScreen('home');
        
        // Start performance monitoring
        this.performanceMonitor.start();
        
        // Load demo track
        await this.loadDemoTrack();
        
        // Start auto demo if enabled
        if (this.autoDemo) {
            this.startAutoDemo();
        }
    }

    async loadDemoTrack() {
        try {
            this.debugConsole.log('Loading demo track...', 'info');
            
            // Generate demo audio data (sine wave)
            const demoTrack = this.generateDemoAudio();
            await this.audioEngine.loadFromBuffer(demoTrack, 'Demo Track', 'xtouch Simulator');
            
            this.currentTrack = {
                title: 'Demo Track',
                artist: 'xtouch Simulator',
                duration: 225000 // 3:45
            };
            
            this.updateTrackInfo();
            this.debugConsole.log('Demo track loaded', 'info');
            
        } catch (error) {
            console.error('Failed to load demo track:', error);
            this.debugConsole.log('Failed to load demo track', 'error');
        }
    }

    async loadAudioFile(file) {
        if (!file) return;
        
        try {
            this.debugConsole.log(`Loading audio file: ${file.name}`, 'info');
            
            const arrayBuffer = await file.arrayBuffer();
            await this.audioEngine.loadFromFile(arrayBuffer, file.name);
            
            this.currentTrack = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'User Upload',
                duration: this.audioEngine.getDuration()
            };
            
            this.updateTrackInfo();
            this.debugConsole.log('Audio file loaded successfully', 'info');
            
        } catch (error) {
            console.error('Failed to load audio file:', error);
            this.debugConsole.log('Failed to load audio file', 'error');
        }
    }

    generateDemoAudio() {
        const sampleRate = 44100;
        const duration = 225; // 3:45 in seconds
        const channels = 2;
        const length = sampleRate * duration;
        
        const buffer = new Float32Array(length * channels);
        
        // Generate a complex demo tone with multiple frequencies
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            
            // Multiple sine waves for a richer sound
            const freq1 = 440; // A4
            const freq2 = 554.37; // C#5
            const freq3 = 659.25; // E5
            
            const wave1 = Math.sin(2 * Math.PI * freq1 * t) * 0.3;
            const wave2 = Math.sin(2 * Math.PI * freq2 * t) * 0.2;
            const wave3 = Math.sin(2 * Math.PI * freq3 * t) * 0.1;
            
            // Add some envelope and effects
            const envelope = Math.exp(-t * 0.001) * (1 - Math.exp(-t * 5));
            const vibrato = 1 + 0.05 * Math.sin(2 * Math.PI * 5 * t);
            
            const sample = (wave1 + wave2 + wave3) * envelope * vibrato * 0.5;
            
            // Stereo
            buffer[i * 2] = sample;
            buffer[i * 2 + 1] = sample;
        }
        
        return buffer;
    }

    updateTrackInfo() {
        if (!this.currentTrack) return;
        
        // Update device UI
        document.querySelector('.track-title').textContent = this.currentTrack.title;
        document.querySelector('.track-artist').textContent = this.currentTrack.artist;
        
        // Update time display
        const totalTime = this.formatTime(this.currentTrack.duration);
        document.getElementById('total-time').textContent = totalTime;
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (!this.audioEngine.isLoaded()) {
            this.debugConsole.log('No audio loaded', 'warning');
            return;
        }
        
        this.audioEngine.play();
        this.isPlaying = true;
        
        // Update UI
        document.getElementById('play-btn').textContent = '⏸';
        document.getElementById('master-play').textContent = 'Pause';
        
        // Start position updates
        this.startPositionUpdates();
        
        this.debugConsole.log('Playback started', 'info');
    }

    pausePlayback() {
        this.audioEngine.pause();
        this.isPlaying = false;
        
        // Update UI
        document.getElementById('play-btn').textContent = '▶';
        document.getElementById('master-play').textContent = 'Play';
        
        this.stopPositionUpdates();
        this.debugConsole.log('Playback paused', 'info');
    }

    stopPlayback() {
        this.audioEngine.stop();
        this.isPlaying = false;
        
        // Update UI
        document.getElementById('play-btn').textContent = '▶';
        document.getElementById('master-play').textContent = 'Play';
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('current-time').textContent = '0:00';
        
        this.stopPositionUpdates();
        this.debugConsole.log('Playback stopped', 'info');
    }

    setMasterVolume(volume) {
        this.audioEngine.setVolume(volume);
        document.getElementById('master-volume-value').textContent = `${Math.round(volume * 100)}%`;
        document.getElementById('volume-value').textContent = `${Math.round(volume * 100)}%`;
        document.getElementById('volume-slider').value = volume * 100;
    }

    startPositionUpdates() {
        this.positionUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.currentTrack) {
                const position = this.audioEngine.getCurrentTime() * 1000;
                const progress = (position / this.currentTrack.duration) * 100;
                
                document.getElementById('progress-fill').style.width = `${progress}%`;
                document.getElementById('current-time').textContent = this.formatTime(position);
                
                // Update visualizer
                this.audioEngine.updateVisualizer();
            }
        }, 100);
    }

    stopPositionUpdates() {
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
            this.positionUpdateInterval = null;
        }
    }

    navigateToScreen(screenName) {
        this.uiSimulator.showScreen(screenName);
        
        // Update tab states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });
        
        this.debugConsole.log(`Navigated to ${screenName} screen`, 'debug');
    }

    applyEqualizerPreset(presetName) {
        this.audioEngine.applyEqualizerPreset(presetName);
        
        // Update preset button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === presetName);
        });
        
        this.debugConsole.log(`Applied equalizer preset: ${presetName}`, 'info');
    }

    setSimulationMode(mode) {
        this.demoMode = mode;
        this.debugConsole.log(`Simulation mode set to: ${mode}`, 'info');
        
        switch (mode) {
            case 'fast':
                this.audioEngine.setPlaybackRate(10);
                break;
            case 'debug':
                this.audioEngine.enableDebugMode(true);
                break;
            default:
                this.audioEngine.setPlaybackRate(1);
                this.audioEngine.enableDebugMode(false);
        }
    }

    toggleTouchSimulation(button) {
        const enabled = button.classList.toggle('active');
        this.touchController.setEnabled(enabled);
        this.debugConsole.log(`Touch simulation ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    toggleAutoDemo() {
        this.autoDemo = !this.autoDemo;
        if (this.autoDemo) {
            this.startAutoDemo();
        } else {
            this.stopAutoDemo();
        }
        this.debugConsole.log(`Auto demo ${this.autoDemo ? 'enabled' : 'disabled'}`, 'info');
    }

    startAutoDemo() {
        this.debugConsole.log('Starting auto demo sequence', 'info');
        
        this.autoDemoInterval = setInterval(() => {
            const screens = ['home', 'equalizer', 'settings'];
            const currentIndex = screens.indexOf(this.uiSimulator.currentScreen);
            const nextIndex = (currentIndex + 1) % screens.length;
            this.navigateToScreen(screens[nextIndex]);
        }, 5000);
    }

    stopAutoDemo() {
        if (this.autoDemoInterval) {
            clearInterval(this.autoDemoInterval);
            this.autoDemoInterval = null;
        }
    }

    toggleWiFiSimulation(button) {
        this.hardwareSimulation.wifi = !button.classList.contains('active');
        button.classList.toggle('active');
        
        // Update WiFi status in UI
        const wifiStatus = document.querySelector('.wifi-status');
        wifiStatus.textContent = this.hardwareSimulation.wifi ? '📶' : '📵';
        
        this.debugConsole.log(`WiFi simulation: ${this.hardwareSimulation.wifi ? 'connected' : 'disconnected'}`, 'info');
    }

    toggleBatterySimulation(button) {
        const isLowBattery = button.classList.toggle('active');
        this.hardwareSimulation.battery = isLowBattery ? 15 : 100;
        
        // Update battery status in UI
        const batteryStatus = document.querySelector('.battery');
        batteryStatus.textContent = isLowBattery ? '🪫' : '🔋';
        
        this.debugConsole.log(`Battery simulation: ${this.hardwareSimulation.battery}%`, 'info');
    }

    toggleSDCardSimulation(button) {
        this.hardwareSimulation.sdCard = !button.classList.contains('active');
        button.classList.toggle('active');
        
        if (!this.hardwareSimulation.sdCard) {
            this.debugConsole.log('SD card error simulated', 'error');
        } else {
            this.debugConsole.log('SD card restored', 'info');
        }
    }

    handleDeviceTouch(event) {
        if (!this.touchController.isEnabled()) return;
        
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert to device coordinates (240x320)
        const deviceX = (x / rect.width) * 240;
        const deviceY = (y / rect.height) * 320;
        
        this.touchController.handleTouch(deviceX, deviceY);
        this.debugConsole.log(`Touch at (${Math.round(deviceX)}, ${Math.round(deviceY)})`, 'debug');
        
        // Add visual feedback
        this.showTouchFeedback(x, y);
    }

    showTouchFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.style.position = 'absolute';
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        feedback.style.width = '20px';
        feedback.style.height = '20px';
        feedback.style.borderRadius = '50%';
        feedback.style.background = 'rgba(255, 255, 255, 0.5)';
        feedback.style.pointerEvents = 'none';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        const touchLayer = document.getElementById('touch-layer');
        touchLayer.appendChild(feedback);
        
        setTimeout(() => {
            touchLayer.removeChild(feedback);
        }, 500);
    }

    processConsoleCommand(command) {
        this.debugConsole.log(`> ${command}`, 'debug');
        
        const parts = command.toLowerCase().split(' ');
        const cmd = parts[0];
        
        switch (cmd) {
            case 'help':
                this.debugConsole.log('Available commands: play, pause, stop, volume, eq, status, clear', 'info');
                break;
            case 'play':
                this.startPlayback();
                break;
            case 'pause':
                this.pausePlayback();
                break;
            case 'stop':
                this.stopPlayback();
                break;
            case 'volume':
                if (parts[1]) {
                    this.setMasterVolume(parseFloat(parts[1]) / 100);
                }
                break;
            case 'eq':
                if (parts[1]) {
                    this.applyEqualizerPreset(parts[1]);
                }
                break;
            case 'status':
                this.debugConsole.log(`Playing: ${this.isPlaying}, Mode: ${this.demoMode}`, 'info');
                break;
            case 'clear':
                this.debugConsole.clear();
                break;
            default:
                this.debugConsole.log(`Unknown command: ${cmd}`, 'error');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    showInfoModal() {
        document.getElementById('info-modal').classList.remove('hidden');
    }

    hideInfoModal() {
        document.getElementById('info-modal').classList.add('hidden');
    }

    handleResize() {
        // Adjust canvas sizes and layouts
        if (this.deviceSimulator) {
            this.deviceSimulator.handleResize();
        }
        if (this.audioEngine) {
            this.audioEngine.handleResize();
        }
    }

    handleKeyboard(event) {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    this.togglePlayback();
                    break;
                case 'f':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'i':
                    event.preventDefault();
                    this.showInfoModal();
                    break;
            }
        } else {
            switch (event.key) {
                case 'Escape':
                    this.hideInfoModal();
                    break;
            }
        }
    }

    showError(message) {
        this.debugConsole.log(message, 'error');
        alert(message);
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
    }
`;
document.head.appendChild(style);

// Initialize demo when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xtouchDemo = new XTouchDemo();
});

// Export for debugging
window.XTouchDemo = XTouchDemo;