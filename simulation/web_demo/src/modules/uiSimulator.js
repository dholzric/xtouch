/**
 * @file uiSimulator.js
 * LVGL-inspired UI simulation
 */

export class UISimulator {
    constructor() {
        this.currentScreen = 'intro';
        this.screenHistory = [];
        this.isInitialized = false;
        this.screens = {};
        this.animations = true;
    }
    
    async init() {
        try {
            // Initialize with existing HTML structure
            this.showScreen('intro');
            this.isInitialized = true;
            console.log('UISimulator initialized');
        } catch (error) {
            console.error('Failed to initialize UISimulator:', error);
            throw error;
        }
    }
    
    initializeScreens() {
        this.screens = {
            intro: this.createIntroScreen(),
            home: this.createHomeScreen(),
            equalizer: this.createEqualizerScreen(),
            settings: this.createSettingsScreen(),
            info: this.createInfoScreen()
        };
    }
    
    createIntroScreen() {
        return `
            <div class="screen intro-screen">
                <div class="intro-content">
                    <div class="logo-section">
                        <div class="xtouch-logo">XTouch</div>
                        <div class="boombox-subtitle">Boombox Edition</div>
                    </div>
                    <div class="boot-info">
                        <div class="hardware-info">ESP32-2432S028R</div>
                        <div class="amplifier-info">WIHZI ZK-1001B</div>
                        <div class="status-info">Initializing...</div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createHomeScreen() {
        return `
            <div class="screen home-screen">
                <div class="status-bar">
                    <div class="time">12:34</div>
                    <div class="status-icons">
                        <span class="wifi-status">📶</span>
                        <span class="battery">🔋</span>
                    </div>
                </div>
                
                <div class="main-content">
                    <div class="track-info">
                        <div class="track-title">Demo Track</div>
                        <div class="track-artist">xtouch Simulator</div>
                    </div>
                    
                    <div class="album-art">
                        <div class="album-placeholder">🎵</div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="time-display">
                            <span id="current-time">0:00</span>
                            <span id="total-time">3:45</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="controls">
                        <button class="control-btn" id="prev-btn">⏮</button>
                        <button class="control-btn play-btn" id="play-btn">▶</button>
                        <button class="control-btn" id="next-btn">⏭</button>
                    </div>
                    
                    <div class="volume-section">
                        <span class="volume-icon">🔊</span>
                        <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="70">
                        <span class="volume-value" id="volume-value">70%</span>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn active" data-screen="home">Home</button>
                    <button class="tab-btn" data-screen="equalizer">EQ</button>
                    <button class="tab-btn" data-screen="settings">Settings</button>
                </div>
            </div>
        `;
    }
    
    createEqualizerScreen() {
        return `
            <div class="screen equalizer-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>Equalizer</h2>
                </div>
                
                <div class="eq-content">
                    <div class="eq-presets">
                        <button class="preset-btn active" data-preset="flat">Flat</button>
                        <button class="preset-btn" data-preset="rock">Rock</button>
                        <button class="preset-btn" data-preset="pop">Pop</button>
                        <button class="preset-btn" data-preset="jazz">Jazz</button>
                        <button class="preset-btn" data-preset="classical">Classical</button>
                        <button class="preset-btn" data-preset="electronic">Electronic</button>
                    </div>
                    
                    <div class="eq-bands">
                        <div class="band">
                            <div class="freq-label">60Hz</div>
                            <input type="range" class="eq-slider" data-band="0" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">170Hz</div>
                            <input type="range" class="eq-slider" data-band="1" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">310Hz</div>
                            <input type="range" class="eq-slider" data-band="2" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">600Hz</div>
                            <input type="range" class="eq-slider" data-band="3" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">1kHz</div>
                            <input type="range" class="eq-slider" data-band="4" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">3kHz</div>
                            <input type="range" class="eq-slider" data-band="5" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">6kHz</div>
                            <input type="range" class="eq-slider" data-band="6" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">12kHz</div>
                            <input type="range" class="eq-slider" data-band="7" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">14kHz</div>
                            <input type="range" class="eq-slider" data-band="8" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                        <div class="band">
                            <div class="freq-label">16kHz</div>
                            <input type="range" class="eq-slider" data-band="9" min="-12" max="12" value="0" orient="vertical">
                            <div class="gain-value">0dB</div>
                        </div>
                    </div>
                    
                    <div class="eq-visualizer">
                        <canvas class="spectrum-canvas" width="200" height="60"></canvas>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn" data-screen="home">Home</button>
                    <button class="tab-btn active" data-screen="equalizer">EQ</button>
                    <button class="tab-btn" data-screen="settings">Settings</button>
                </div>
            </div>
        `;
    }
    
    createSettingsScreen() {
        return `
            <div class="screen settings-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>Settings</h2>
                </div>
                
                <div class="settings-content">
                    <div class="setting-group">
                        <h3>Audio</h3>
                        <div class="setting-item">
                            <label>Master Volume</label>
                            <input type="range" id="master-volume" min="0" max="100" value="70">
                            <span id="master-volume-value">70%</span>
                        </div>
                        <div class="setting-item">
                            <label>Bass Boost</label>
                            <input type="range" min="0" max="10" value="0">
                            <span>0dB</span>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>Display</h3>
                        <div class="setting-item">
                            <label>Brightness</label>
                            <input type="range" min="10" max="100" value="80">
                            <span>80%</span>
                        </div>
                        <div class="setting-item">
                            <label>Screen Timeout</label>
                            <select>
                                <option>30 seconds</option>
                                <option>1 minute</option>
                                <option selected>2 minutes</option>
                                <option>Never</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>System</h3>
                        <div class="setting-item">
                            <label>WiFi</label>
                            <button class="toggle-btn active">ON</button>
                        </div>
                        <div class="setting-item">
                            <label>Auto-Sleep</label>
                            <button class="toggle-btn">OFF</button>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <h3>About</h3>
                        <div class="info-item">
                            <label>Model</label>
                            <span>ESP32-2432S028R</span>
                        </div>
                        <div class="info-item">
                            <label>Amplifier</label>
                            <span>WIHZI ZK-1001B</span>
                        </div>
                        <div class="info-item">
                            <label>Firmware</label>
                            <span>v1.0.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="navigation-tabs">
                    <button class="tab-btn" data-screen="home">Home</button>
                    <button class="tab-btn" data-screen="equalizer">EQ</button>
                    <button class="tab-btn active" data-screen="settings">Settings</button>
                </div>
            </div>
        `;
    }
    
    createInfoScreen() {
        return `
            <div class="screen info-screen">
                <div class="header">
                    <button class="back-btn" data-target="home">‹ Back</button>
                    <h2>System Info</h2>
                </div>
                
                <div class="info-content">
                    <div class="system-stats">
                        <div class="stat-item">
                            <label>CPU Usage</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 25%"></div>
                            </div>
                            <span>25%</span>
                        </div>
                        <div class="stat-item">
                            <label>Memory</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 40%"></div>
                            </div>
                            <span>126KB / 320KB</span>
                        </div>
                        <div class="stat-item">
                            <label>Storage</label>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 60%"></div>
                            </div>
                            <span>2.4MB / 4MB</span>
                        </div>
                    </div>
                    
                    <div class="hardware-info">
                        <h3>Hardware Status</h3>
                        <div class="hw-item">
                            <span class="hw-name">Display</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Touch</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Audio DAC</span>
                            <span class="hw-status good">✓ OK</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">Amplifier</span>
                            <span class="hw-status good">✓ Connected</span>
                        </div>
                        <div class="hw-item">
                            <span class="hw-name">SD Card</span>
                            <span class="hw-status good">✓ Mounted</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    showScreen(screenName) {
        console.log(`Showing screen: ${screenName}`);
        
        // Update current screen
        this.currentScreen = screenName;
        
        // Hide all screens first
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.warn(`Screen element '${screenName}-screen' not found`);
        }
        
        this.onScreenShown(screenName);
    }
    
    onScreenShown(screenName) {
        // Handle screen-specific initialization
        switch (screenName) {
            case 'intro':
                this.animateIntroSequence();
                break;
            case 'equalizer':
                this.initializeEqualizer();
                break;
            case 'settings':
                this.initializeSettings();
                break;
        }
    }
    
    animateIntroSequence() {
        let progress = 0;
        const progressBar = document.querySelector('.progress-fill');
        const statusInfo = document.querySelector('.status-info');
        
        const steps = [
            'Initializing...',
            'Loading audio engine...',
            'Connecting amplifier...',
            'Ready!'
        ];
        
        const interval = setInterval(() => {
            progress += 25;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            const stepIndex = Math.floor(progress / 25) - 1;
            if (statusInfo && stepIndex >= 0 && stepIndex < steps.length) {
                statusInfo.textContent = steps[stepIndex];
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.showScreen('home');
                }, 1000);
            }
        }, 800);
    }
    
    initializeEqualizer() {
        // Initialize spectrum visualizer
        const canvas = document.querySelector('.spectrum-canvas');
        if (canvas) {
            this.initializeSpectrum(canvas);
        }
        
        // Initialize EQ sliders
        const sliders = document.querySelectorAll('.eq-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const band = parseInt(e.target.dataset.band);
                const gain = parseFloat(e.target.value);
                this.updateEqualizerBand(band, gain);
            });
        });
    }
    
    initializeSpectrum(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Animation loop for spectrum
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Draw spectrum bars (mock data)
            const bars = 20;
            const barWidth = width / bars;
            
            for (let i = 0; i < bars; i++) {
                const barHeight = Math.random() * height * 0.8;
                const x = i * barWidth;
                
                ctx.fillStyle = `hsl(${120 + i * 10}, 70%, 50%)`;
                ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateEqualizerBand(band, gain) {
        // Update gain value display - handle new 10-band EQ structure
        const bandElement = document.querySelector(`[data-band="${band}"]`);
        if (bandElement && bandElement.parentNode) {
            const gainDisplay = bandElement.parentNode.querySelector('.gain-value');
            if (gainDisplay) {
                gainDisplay.textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
            }
        }
        
        console.log(`EQ Band ${band}: ${gain}dB`);
    }
    
    initializeSettings() {
        // Initialize toggle buttons
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                btn.textContent = btn.classList.contains('active') ? 'ON' : 'OFF';
            });
        });
    }
    
    goBack() {
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            this.showScreen(previousScreen);
        }
    }
    
    getCurrentState() {
        return {
            currentScreen: this.currentScreen,
            screenHistory: [...this.screenHistory],
            isInitialized: this.isInitialized,
            animations: this.animations
        };
    }
    
    setAnimations(enabled) {
        this.animations = enabled;
    }
}