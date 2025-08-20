/**
 * @file audioEngine.js
 * Web Audio API wrapper for xtouch demo
 */

export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;
        this.equalizerNodes = [];
        this.isInitialized = false;
        this.audioLoaded = false;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.playbackRate = 1;
        this.debugMode = false;
        
        // Equalizer frequencies (10-band)
        this.equalizerFreqs = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        
        // Presets with more pronounced differences (in dB)
        this.presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            rock: [6, 4, -2, -2, 2, 4, 6, 6, 4, 2],          // Heavy bass & treble
            pop: [2, 4, 6, 4, -2, -2, 2, 4, 6, 4],          // Mid boost, scooped mids
            jazz: [4, 2, 0, 2, 4, 4, 2, 2, 4, 4],           // Warm, smooth response
            classical: [6, 4, 2, 0, 0, 0, 2, 4, 6, 6],       // Natural with extended highs
            electronic: [6, 4, 0, -2, 2, 4, 6, 6, 4, 2]     // Bass heavy with bright highs
        };
    }
    
    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', this.audioContext.state);
            
            // Resume context if suspended (Chrome autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed, new state:', this.audioContext.state);
            }
            
            // Create basic nodes first
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.7; // Default volume
            
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0.85;
            
            // Connect gain to destination first (simple path)
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.connect(this.analyserNode);
            
            // Create equalizer (optional enhancement)
            try {
                this.createEqualizer();
                this.connectAudioGraph();
                console.log('Created', this.equalizerNodes.length, 'equalizer nodes');
            } catch (eqError) {
                console.warn('Failed to create equalizer, using basic audio path:', eqError);
                this.equalizerNodes = [];
            }
            
            this.isInitialized = true;
            console.log('AudioEngine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AudioEngine:', error);
            throw error;
        }
    }
    
    createEqualizer() {
        this.equalizerNodes = [];
        
        for (let i = 0; i < this.equalizerFreqs.length; i++) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = this.equalizerFreqs[i];
            filter.Q.value = 1;
            filter.gain.value = 0;
            
            this.equalizerNodes.push(filter);
        }
    }
    
    connectAudioGraph() {
        if (this.equalizerNodes.length === 0) {
            console.warn('No equalizer nodes to connect');
            return;
        }
        
        // Connect equalizer nodes in series
        for (let i = 0; i < this.equalizerNodes.length; i++) {
            if (i === 0) {
                // First node will be connected from source later
                continue;
            }
            this.equalizerNodes[i - 1].connect(this.equalizerNodes[i]);
        }
        
        // Connect last equalizer to gain and analyser
        const lastEq = this.equalizerNodes[this.equalizerNodes.length - 1];
        if (lastEq) {
            lastEq.connect(this.gainNode);
            lastEq.connect(this.analyserNode);
        }
        
        console.log('Audio graph connected:', this.equalizerNodes.length, 'EQ nodes');
    }
    
    async loadFromBuffer(audioData, title = 'Unknown', artist = 'Unknown') {
        try {
            // Ensure audio context is running
            if (!this.audioContext) {
                console.error('Audio context not initialized');
                return;
            }
            
            // Convert Float32Array to AudioBuffer
            const channels = 2;
            const sampleRate = 44100;
            const length = audioData.length / channels;
            
            this.audioBuffer = this.audioContext.createBuffer(channels, length, sampleRate);
            
            // Copy data to buffer
            for (let channel = 0; channel < channels; channel++) {
                const channelData = this.audioBuffer.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    channelData[i] = audioData[i * channels + channel];
                }
            }
            
            this.trackInfo = { title, artist };
            this.audioLoaded = true;
            
            console.log('Audio loaded from buffer successfully');
            console.log('Audio context state:', this.audioContext.state);
            console.log('Buffer duration:', this.audioBuffer.duration, 'seconds');
            
        } catch (error) {
            console.error('Failed to load audio from buffer:', error);
            throw error;
        }
    }
    
    async loadFromFile(arrayBuffer, filename) {
        try {
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.trackInfo = { 
                title: filename.replace(/\.[^/.]+$/, ""), 
                artist: 'User Upload' 
            };
            this.audioLoaded = true;
            
            console.log('Audio loaded from file');
            
        } catch (error) {
            console.error('Failed to load audio from file:', error);
            throw error;
        }
    }
    
    play() {
        if (!this.audioLoaded || this.isPlaying) return;
        
        // Ensure audio context is ready
        if (!this.audioContext || !this.gainNode) {
            console.error('Audio context not properly initialized');
            return;
        }
        
        // Resume audio context if needed (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create new source node
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.value = this.playbackRate;
        
        // Connect through equalizer if available, otherwise direct
        try {
            if (this.equalizerNodes && this.equalizerNodes.length > 0 && this.equalizerNodes[0]) {
                // Connect source to first equalizer node
                this.sourceNode.connect(this.equalizerNodes[0]);
                console.log('Connected source through equalizer chain');
            } else {
                // Fallback: connect directly to gain node
                this.sourceNode.connect(this.gainNode);
                console.log('Connected source directly to gain node (no EQ)');
            }
        } catch (error) {
            console.error('Failed to connect audio graph:', error);
            try {
                // Final fallback: connect directly to destination
                this.sourceNode.connect(this.audioContext.destination);
                console.log('Connected source directly to destination');
            } catch (finalError) {
                console.error('All connection attempts failed:', finalError);
                return;
            }
        }
        
        // Handle end of playback
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.startTime = 0;
            this.pauseTime = 0;
        };
        
        // Start playback
        try {
            const offset = this.pauseTime;
            this.sourceNode.start(0, offset);
            this.startTime = this.audioContext.currentTime - offset;
            this.isPlaying = true;
            console.log('Playback started successfully');
        } catch (error) {
            console.error('Failed to start playback:', error);
            this.isPlaying = false;
        }
    }
    
    pause() {
        if (!this.isPlaying) return;
        
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.sourceNode.stop();
        this.isPlaying = false;
        
        console.log('Playback paused');
    }
    
    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
        }
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        
        console.log('Playback stopped');
    }
    
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    getVolume() {
        return this.gainNode ? this.gainNode.gain.value : 0;
    }
    
    getCurrentTime() {
        if (!this.isPlaying) return this.pauseTime;
        return this.audioContext.currentTime - this.startTime;
    }
    
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }
    
    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.sourceNode) {
            this.sourceNode.playbackRate.value = rate;
        }
    }
    
    applyEqualizerPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        for (let i = 0; i < preset.length && i < this.equalizerNodes.length; i++) {
            this.equalizerNodes[i].gain.value = preset[i];
        }
        
        console.log(`Applied equalizer preset: ${presetName}`);
    }
    
    setEqualizerBand(bandIndex, gain) {
        if (bandIndex >= 0 && bandIndex < this.equalizerNodes.length) {
            this.equalizerNodes[bandIndex].gain.value = gain;
        }
    }
    
    getEqualizerBand(bandIndex) {
        if (bandIndex >= 0 && bandIndex < this.equalizerNodes.length) {
            return this.equalizerNodes[bandIndex].gain.value;
        }
        return 0;
    }
    
    updateVisualizer() {
        if (!this.analyserNode) return null;
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);
        
        return dataArray;
    }
    
    getSpectrumData() {
        const data = this.updateVisualizer();
        if (!data) return null;
        
        // Return 10-band spectrum for display
        const bands = 10;
        const bandSize = Math.floor(data.length / bands);
        const spectrum = [];
        
        for (let i = 0; i < bands; i++) {
            let sum = 0;
            for (let j = 0; j < bandSize; j++) {
                sum += data[i * bandSize + j];
            }
            spectrum.push(sum / bandSize / 255); // Normalize to 0-1
        }
        
        return spectrum;
    }
    
    enableDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    getState() {
        return {
            isInitialized: this.isInitialized,
            isLoaded: this.audioLoaded,
            isPlaying: this.isPlaying,
            currentTime: this.getCurrentTime(),
            duration: this.getDuration(),
            volume: this.getVolume(),
            playbackRate: this.playbackRate,
            trackInfo: this.trackInfo
        };
    }
    
    isLoaded() {
        return this.audioLoaded;
    }
    
    handleResize() {
        // Update any canvas-based visualizers
        console.log('AudioEngine handling resize');
    }
}