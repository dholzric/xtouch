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
            
            // Simple initialization without complex async chains
            this.initializeModulesSimple();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading screen quickly
            setTimeout(() => {
                this.hideLoadingScreen();
                this.startSimpleDemo();
            }, 1000);
            
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

    initializeModulesSimple() {
        try {
            // Initialize Debug Console first for logging
            this.debugConsole = new DebugConsole();
            this.debugConsole.init();
            this.debugConsole.log('Debug console ready', 'info');
            
            // Initialize Audio Engine
            this.audioEngine = new AudioEngine();
            this.debugConsole.log('Audio engine created', 'info');
            
            // Initialize Device Simulator
            this.deviceSimulator = new DeviceSimulator();
            this.debugConsole.log('Device simulator created', 'info');
            
            // Initialize UI Simulator
            this.uiSimulator = new UISimulator();
            this.debugConsole.log('UI simulator created', 'info');
            
            // Initialize Performance Monitor
            this.performanceMonitor = new PerformanceMonitor();
            this.performanceMonitor.init();
            
            // Initialize Touch Controller
            this.touchController = new TouchController();
            this.touchController.init();
            
            this.debugConsole.log('All modules initialized', 'info');
        } catch (error) {
            console.error('Module initialization failed:', error);
        }
    }

    startSimpleDemo() {
        try {
            // Initialize audio engine asynchronously
            this.audioEngine.init().then(() => {
                this.debugConsole.log('Audio engine ready', 'info');
                this.loadDemoTrack();
            }).catch(err => {
                this.debugConsole.log('Audio init failed: ' + err.message, 'error');
            });
            
            // Initialize device simulator
            this.deviceSimulator.init().then(() => {
                this.debugConsole.log('Device simulator ready', 'info');
            }).catch(err => {
                this.debugConsole.log('Device init failed: ' + err.message, 'error');
            });
            
            // Initialize UI simulator
            this.uiSimulator.init().then(() => {
                this.debugConsole.log('UI simulator ready', 'info');
                this.uiSimulator.showScreen('intro');
                
                // Generate EQ sliders
                this.generateEqualizerSliders();
                
                // Transition to home after intro
                setTimeout(() => {
                    this.uiSimulator.showScreen('home');
                    this.startBoomboxAnimations();
                }, 2000);
            }).catch(err => {
                this.debugConsole.log('UI init failed: ' + err.message, 'error');
            });
            
            // Start performance monitoring
            this.performanceMonitor.start();
            
        } catch (error) {
            console.error('Demo start failed:', error);
            this.debugConsole.log('Demo start failed: ' + error.message, 'error');
        }
    }

    startBoomboxAnimations() {
        // Animate main spectrum display
        this.animateMainSpectrum();
        
        // Animate power meter
        this.animatePowerMeter();
    }

    animateSpectrum() {
        const canvas = document.getElementById('spectrum-bars');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const bars = 8;
        const barWidth = width / bars;
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Get real spectrum data if available
            let spectrumData = null;
            if (this.audioEngine && this.isPlaying) {
                spectrumData = this.audioEngine.getSpectrumData();
            }
            
            for (let i = 0; i < bars; i++) {
                let barHeight;
                
                if (spectrumData && spectrumData.length >= bars) {
                    // Use real audio spectrum data
                    barHeight = spectrumData[i] * height * 0.9 + height * 0.05;
                } else {
                    // Fallback to gentle random animation when no audio
                    barHeight = Math.random() * height * 0.3 + height * 0.1;
                }
                
                const x = i * barWidth;
                
                // Color gradient based on frequency and intensity
                const intensity = barHeight / height;
                const hue = 120 + i * 15; // Green to orange spectrum
                const saturation = 60 + intensity * 20; // More saturated with higher intensity
                const lightness = 40 + intensity * 20; // Brighter with higher intensity
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    animateMainSpectrum() {
        const canvas = document.getElementById('main-spectrum');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const bars = 12; // More bars for better frequency resolution
        const barWidth = width / bars;
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Get real spectrum data if available
            let spectrumData = null;
            if (this.audioEngine && this.isPlaying) {
                spectrumData = this.audioEngine.getSpectrumData();
            }
            
            for (let i = 0; i < bars; i++) {
                let barHeight;
                if (spectrumData && spectrumData.length > 0) {
                    // Use real audio spectrum data
                    barHeight = spectrumData[Math.floor(i * spectrumData.length / bars)] * height * 0.9 + height * 0.05;
                } else {
                    // Fallback to gentle random animation when no audio
                    barHeight = Math.random() * height * 0.4 + height * 0.1;
                }
                
                const x = i * barWidth;
                
                // Enhanced color gradient - frequency-based colors
                const intensity = barHeight / height;
                const hue = 120 + i * 8; // Green to cyan spectrum (120-216)
                const saturation = 70 + intensity * 30;
                const lightness = 35 + intensity * 35;
                
                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness-10}%)`);
                gradient.addColorStop(0.7, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
                gradient.addColorStop(1, `hsl(${hue}, ${saturation+20}%, ${lightness+20}%)`);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    animatePowerMeter() {
        const powerFill = document.querySelector('.power-fill');
        const powerText = document.querySelector('.power-text');
        
        if (!powerFill || !powerText) return;
        
        setInterval(() => {
            const power = 30 + Math.random() * 40; // 30-70W
            powerFill.style.width = `${power}%`;
            powerText.textContent = `${Math.round(power)}W`;
        }, 500);
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
        const audioFileInput = document.getElementById('audio-file');
        audioFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.loadAudioFile(e.target.files[0]);
            }
        });
        
        // Add drag & drop support for audio files
        const audioSection = document.querySelector('.audio-controls');
        if (audioSection) {
            audioSection.addEventListener('dragover', (e) => {
                e.preventDefault();
                audioSection.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
            });
            
            audioSection.addEventListener('dragleave', (e) => {
                e.preventDefault();
                audioSection.style.backgroundColor = '';
            });
            
            audioSection.addEventListener('drop', (e) => {
                e.preventDefault();
                audioSection.style.backgroundColor = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('audio/')) {
                    this.loadAudioFile(files[0]);
                }
            });
        }
        
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
        
        // Brightness control
        const brightnessSlider = document.getElementById('brightness-slider');
        const brightnessValue = document.getElementById('brightness-value');
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.addEventListener('input', (e) => {
                this.setBrightness(e.target.value);
            });
        }
        
        // Settings volume control
        const settingsVolumeSlider = document.getElementById('settings-volume-slider');
        const settingsVolumeValue = document.getElementById('settings-volume-value');
        if (settingsVolumeSlider && settingsVolumeValue) {
            settingsVolumeSlider.addEventListener('input', (e) => {
                this.setMasterVolume(e.target.value / 100);
            });
        }
        
        // Settings buttons
        document.getElementById('load-music-btn')?.addEventListener('click', () => {
            this.showMusicLoadDialog();
        });
        
        document.getElementById('bluetooth-pair-btn')?.addEventListener('click', () => {
            this.showBluetoothPairDialog();
        });
        
        document.getElementById('spotify-setup-btn')?.addEventListener('click', () => {
            this.showSpotifySetupDialog();
        });
        
        document.getElementById('wifi-setup-btn')?.addEventListener('click', () => {
            this.showWiFiSetupDialog();
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
        
        // Equalizer presets (both full screen and quick buttons)
        document.querySelectorAll('.preset-btn, .eq-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                if (preset) {
                    this.applyEqualizerPreset(preset);
                }
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

    // Removed complex async demo sequence

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

    async startPlayback() {
        if (!this.audioEngine.isLoaded()) {
            this.debugConsole.log('No audio loaded', 'warning');
            return;
        }
        
        try {
            // Ensure audio context is resumed (required for Chrome autoplay policy)
            if (this.audioEngine.audioContext.state === 'suspended') {
                await this.audioEngine.audioContext.resume();
                this.debugConsole.log('Audio context resumed', 'info');
            }
            
            this.audioEngine.play();
            this.isPlaying = true;
            
            // Update UI
            const playBtn = document.getElementById('play-btn');
            const masterPlay = document.getElementById('master-play');
            if (playBtn) playBtn.textContent = '⏸';
            if (masterPlay) masterPlay.textContent = 'Pause';
            
            // Start position updates
            this.startPositionUpdates();
            
            this.debugConsole.log('Playback started successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log('Playback failed: ' + error.message, 'error');
            console.error('Playback error:', error);
        }
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
        
        // Update settings volume slider if it exists
        const settingsVolumeSlider = document.getElementById('settings-volume-slider');
        const settingsVolumeValue = document.getElementById('settings-volume-value');
        if (settingsVolumeSlider && settingsVolumeValue) {
            settingsVolumeSlider.value = volume * 100;
            settingsVolumeValue.textContent = `${Math.round(volume * 100)}%`;
        }
    }

    setBrightness(brightness) {
        const brightnessValue = parseInt(brightness);
        
        // Update display brightness by adjusting screen opacity/filter
        const displayScreen = document.getElementById('device-screen');
        if (displayScreen) {
            // Convert brightness (10-100) to filter values
            const opacity = brightnessValue / 100;
            const brightness_filter = brightnessValue / 100 + 0.2; // Slight boost for visibility
            
            displayScreen.style.filter = `brightness(${brightness_filter}) opacity(${opacity})`;
            displayScreen.style.transition = 'filter 0.3s ease';
        }
        
        // Update brightness value display
        const brightnessValueElement = document.getElementById('brightness-value');
        if (brightnessValueElement) {
            brightnessValueElement.textContent = `${brightnessValue}%`;
        }
        
        this.debugConsole.log(`Display brightness set to ${brightnessValue}%`, 'info');
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
        try {
            this.audioEngine.applyEqualizerPreset(presetName);
            
            // Update preset button states (both full screen and quick buttons)
            document.querySelectorAll('.preset-btn, .eq-preset-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.preset === presetName);
            });
            
            // Update individual sliders to match preset
            this.updateEqualizerSlidersFromPreset(presetName);
            
            this.debugConsole.log(`Applied equalizer preset: ${presetName}`, 'info');
            
            // Visual feedback
            this.showPresetFeedback(presetName);
            
        } catch (error) {
            this.debugConsole.log(`EQ preset failed: ${error.message}`, 'error');
        }
    }
    
    showPresetFeedback(presetName) {
        // Show brief visual confirmation
        const activeBtn = document.querySelector(`[data-preset="${presetName}"].active`);
        if (activeBtn) {
            activeBtn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                activeBtn.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Show what each preset does in the console
        const presetDescriptions = {
            flat: 'Flat - No EQ adjustments (natural sound)',
            rock: 'Rock - Heavy bass & treble, scooped mids (punchy)',
            pop: 'Pop - Mid boost with bright highs (vocal clarity)',
            jazz: 'Jazz - Warm, smooth response (rich & full)'
        };
        
        const description = presetDescriptions[presetName] || `${presetName} preset applied`;
        this.debugConsole.log(description, 'info');
        
        // Log the actual EQ settings for debugging
        if (this.audioEngine.presets[presetName]) {
            const values = this.audioEngine.presets[presetName];
            const freqs = this.audioEngine.equalizerFreqs;
            const eqString = values.map((val, i) => `${freqs[i]}Hz: ${val > 0 ? '+' : ''}${val}dB`).join(', ');
            this.debugConsole.log(`EQ Values: ${eqString}`, 'debug');
        }
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
        
        // Convert to device coordinates (320x240 landscape)
        const deviceX = (x / rect.width) * 320;
        const deviceY = (y / rect.height) * 240;
        
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
    
    generateEqualizerSliders() {
        const eqBandsContainer = document.getElementById('eq-bands');
        if (!eqBandsContainer || !this.audioEngine) return;
        
        const frequencies = this.audioEngine.equalizerFreqs;
        const freqLabels = ['60', '170', '310', '600', '1k', '3k', '6k', '12k', '14k', '16k'];
        
        eqBandsContainer.innerHTML = ''; // Clear existing content
        
        // Create slider for each frequency band
        frequencies.forEach((freq, index) => {
            const bandContainer = document.createElement('div');
            bandContainer.className = 'eq-band';
            
            // Frequency label
            const label = document.createElement('div');
            label.className = 'eq-label';
            label.textContent = freqLabels[index];
            
            // Vertical slider container
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'eq-slider-container';
            
            // Range input (vertical)
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'eq-slider';
            slider.id = `eq-slider-${index}`;
            slider.min = '-12';
            slider.max = '12';
            slider.step = '1';
            slider.value = '0';
            slider.orient = 'vertical'; // For vertical orientation
            
            // Value display
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'eq-value';
            valueDisplay.id = `eq-value-${index}`;
            valueDisplay.textContent = '0dB';
            
            // Add event listener
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}dB`;
                this.setEqualizerBand(index, value);
            });
            
            // Assemble the band
            sliderContainer.appendChild(slider);
            bandContainer.appendChild(label);
            bandContainer.appendChild(sliderContainer);
            bandContainer.appendChild(valueDisplay);
            
            eqBandsContainer.appendChild(bandContainer);
        });
        
        this.debugConsole.log('Generated 10-band equalizer sliders', 'info');
    }
    
    setEqualizerBand(bandIndex, gainValue) {
        if (this.audioEngine) {
            this.audioEngine.setEqualizerBand(bandIndex, gainValue);
            this.debugConsole.log(`EQ Band ${bandIndex + 1} (${this.audioEngine.equalizerFreqs[bandIndex]}Hz): ${gainValue > 0 ? '+' : ''}${gainValue}dB`, 'debug');
        }
    }
    
    updateEqualizerSlidersFromPreset(presetName) {
        const preset = this.audioEngine.presets[presetName];
        if (!preset) return;
        
        preset.forEach((value, index) => {
            const slider = document.getElementById(`eq-slider-${index}`);
            const valueDisplay = document.getElementById(`eq-value-${index}`);
            
            if (slider && valueDisplay) {
                slider.value = value;
                valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}dB`;
            }
        });
        
        this.debugConsole.log(`Updated sliders for ${presetName} preset`, 'debug');
    }
    
    showMusicLoadDialog() {
        this.debugConsole.log('Opening music load dialog', 'info');
        
        // Create file input if it doesn't exist
        let fileInput = document.getElementById('hidden-file-input');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'hidden-file-input';
            fileInput.accept = 'audio/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.loadAudioFile(e.target.files[0]);
                    this.navigateToScreen('home');
                }
            });
        }
        
        fileInput.click();
    }
    
    showBluetoothPairDialog() {
        this.debugConsole.log('Starting Bluetooth pairing mode', 'info');
        
        // Simulate Bluetooth pairing process
        const status = confirm('Start Bluetooth pairing mode?\n\nMake your device discoverable and look for "XTouch Boombox" in your Bluetooth settings.');
        
        if (status) {
            this.debugConsole.log('Bluetooth pairing enabled - device discoverable', 'info');
            
            // Simulate pairing success after delay
            setTimeout(() => {
                const success = confirm('Device "iPhone" wants to pair. Accept connection?');
                if (success) {
                    this.debugConsole.log('Bluetooth device paired successfully', 'success');
                    alert('Connected to "iPhone"\n\nYou can now stream audio from your device.');
                } else {
                    this.debugConsole.log('Bluetooth pairing cancelled', 'warning');
                }
            }, 2000);
        }
    }
    
    showSpotifySetupDialog() {
        this.debugConsole.log('Opening Spotify Connect setup', 'info');
        
        const action = prompt('Spotify Connect Setup\n\n1. Show pairing code (recommended)\n2. Manual configuration\n3. View current status\n\nEnter option (1-3):');
        
        switch (action) {
            case '1':
                // Device-based pairing with code
                this.debugConsole.log('Generating Spotify pairing code...', 'info');
                setTimeout(() => {
                    const pairingCode = 'SP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
                    const success = confirm(`Spotify Connect Pairing\n\nPairing Code: ${pairingCode}\n\n1. Open Spotify app on your phone/computer\n2. Go to Settings > Connect to a Device\n3. Select "Enter Code Manually"\n4. Enter: ${pairingCode}\n\nCode expires in 5 minutes.\n\nContinue with pairing?`);
                    
                    if (success) {
                        this.debugConsole.log('Waiting for Spotify app to connect...', 'info');
                        setTimeout(() => {
                            this.debugConsole.log('Spotify Connect paired successfully', 'success');
                            alert('✓ Connected to Spotify!\n\n"XTouch Boombox" is now available in your Spotify app under "Connect to a Device".\n\nYou can now stream music directly from any Spotify app.');
                        }, 2000);
                    } else {
                        this.debugConsole.log('Spotify pairing cancelled', 'info');
                    }
                }, 1000);
                break;
                
            case '2':
                // Manual configuration using device credentials
                const username = prompt('Enter Spotify Premium username:');
                if (username) {
                    const deviceName = prompt('Device name for Spotify Connect:', 'XTouch Boombox');
                    if (deviceName) {
                        this.debugConsole.log(`Configuring Spotify Connect for ${username}`, 'info');
                        setTimeout(() => {
                            this.debugConsole.log('Spotify Connect configured manually', 'success');
                            alert(`✓ Spotify Connect Setup Complete\n\nDevice: ${deviceName}\nAccount: ${username}\n\nYour device will appear in Spotify Connect within 30 seconds.`);
                        }, 1500);
                    }
                }
                break;
                
            case '3':
                // Show current Spotify status
                alert('Spotify Connect Status\n\nDevice Name: XTouch Boombox\nStatus: Ready\nLast Connected: 2 minutes ago\nAccount: demo@user.com\n\nTo reconnect, use "Connect to Device" in any Spotify app.');
                break;
                
            default:
                this.debugConsole.log('Spotify setup cancelled', 'info');
        }
    }
    
    showWiFiSetupDialog() {
        this.debugConsole.log('Opening WiFi configuration', 'info');
        
        const action = prompt('WiFi Setup\n\n1. Scan for networks\n2. Configure manual\n3. View current settings\n\nEnter option (1-3):');
        
        switch (action) {
            case '1':
                this.debugConsole.log('Scanning for WiFi networks...', 'info');
                setTimeout(() => {
                    const networks = ['XTouch_Demo (current)', 'HomeNetwork_5G', 'CoffeeShop_WiFi', 'Neighbors_Network'];
                    const selected = prompt('Available Networks:\n\n' + networks.map((n, i) => `${i + 1}. ${n}`).join('\n') + '\n\nSelect network (1-4):');
                    
                    if (selected && selected !== '1') {
                        const password = prompt('Enter WiFi password:');
                        if (password) {
                            this.debugConsole.log(`Connecting to network ${selected}...`, 'info');
                            setTimeout(() => {
                                this.debugConsole.log('WiFi connection successful', 'success');
                                document.getElementById('wifi-name').textContent = networks[parseInt(selected) - 1];
                                alert('Connected to WiFi successfully!');
                            }, 2000);
                        }
                    }
                }, 1000);
                break;
                
            case '2':
                const ssid = prompt('Enter WiFi Network Name (SSID):');
                if (ssid) {
                    const password = prompt('Enter WiFi Password:');
                    if (password) {
                        this.debugConsole.log(`Configuring manual WiFi connection to ${ssid}`, 'info');
                        setTimeout(() => {
                            this.debugConsole.log('Manual WiFi configuration saved', 'success');
                            alert('WiFi settings saved and connected!');
                            document.getElementById('wifi-name').textContent = ssid;
                        }, 1500);
                    }
                }
                break;
                
            case '3':
                alert('Current WiFi Settings:\n\nSSID: XTouch_Demo\nSecurity: WPA2\nSignal: -45 dBm (Strong)\nIP: 192.168.1.123\nDNS: 8.8.8.8');
                break;
                
            default:
                this.debugConsole.log('WiFi setup cancelled', 'info');
        }
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