# 🎵 XTouch Boombox - Interactive Web Demo

## 🚀 **Live Demo Experience**

Experience the complete XTouch ESP32-2432S028R boombox interface directly in your browser! This interactive web demonstration simulates the entire hardware and software stack.

### **Demo URL (Local)**
```
http://localhost:5173
```

### **Quick Start**
```bash
cd simulation/web_demo
npm install
npm run dev
```

## ✨ **Features Demonstrated**

### 🔧 **Hardware Simulation**
- **3D ESP32-2432S028R Model**: Interactive hardware visualization
- **2.8" TFT Display**: Pixel-perfect 240x320 ILI9341 simulation
- **Touch Interface**: Mouse/touch input with visual feedback
- **Status Indicators**: WiFi, battery, and connectivity simulation
- **Real-time Monitoring**: CPU, memory, and audio buffer tracking

### 🎵 **Audio Engine**
- **Web Audio API**: Professional audio processing
- **10-Band Equalizer**: Real-time parametric EQ with presets
- **Audio Visualization**: Spectrum analyzer and waveform display
- **File Support**: Upload MP3, WAV, OGG files or use demo track
- **Real-time Processing**: Sub-10ms latency simulation

### 🎛️ **User Interface**
- **LVGL Recreation**: Faithful embedded UI simulation
- **Multi-screen Navigation**: Home, Equalizer, Settings screens
- **Touch Interaction**: Responsive click/touch handling
- **Smooth Animations**: Professional transitions and effects
- **State Management**: Persistent settings across sessions

### 🛠️ **Developer Tools**
- **Debug Console**: Real-time logging with command interface
- **Performance Monitor**: CPU, memory, and audio metrics
- **Simulation Controls**: Speed, debug mode, hardware scenarios
- **Auto Demo Mode**: Automated feature demonstration

## 🎮 **How to Use the Demo**

### **Basic Operation**
1. **Load Audio**: Click "Use Demo Track" or upload your own file
2. **Play Controls**: Use device buttons or master controls
3. **Touch Interface**: Click on the simulated display to interact
4. **Navigate**: Use tab buttons to switch between screens
5. **Equalizer**: Adjust the 10-band EQ and try presets

### **Interactive Elements**

#### **Device Controls**
- **Play/Pause Button**: Center of the device display
- **Volume Control**: Right side slider or settings
- **Navigation Tabs**: Bottom of display (Home, EQ, Settings)
- **Touch Areas**: Entire display surface is interactive

#### **Master Controls Panel**
- **File Upload**: Drag & drop or select audio files
- **Playback**: Play, pause, stop, seek controls
- **Volume**: Master volume slider with real-time sync
- **Audio Visualization**: Real-time spectrum display

#### **Simulation Options**
- **Modes**: Real-time, Fast (10x), Debug mode
- **Touch Simulation**: Enable/disable touch feedback
- **Hardware Scenarios**: WiFi disconnect, low battery, SD errors
- **Auto Demo**: Automated navigation and feature showcase

### **Debug Console Commands**
```
help                    # Show available commands
play                    # Start audio playback
pause                   # Pause audio playback
stop                    # Stop audio playback
volume 75               # Set volume to 75%
eq rock                 # Apply rock equalizer preset
status                  # Show current status
clear                   # Clear console output
```

### **Keyboard Shortcuts**
- **Ctrl/Cmd + Space**: Toggle playback
- **Ctrl/Cmd + F**: Toggle fullscreen
- **Ctrl/Cmd + I**: Show project information
- **Escape**: Close modals

## 🔧 **Technical Implementation**

### **Audio Processing Pipeline**
```
AudioSource → GainNode → EqualizerNode → AnalyserNode → AudioDestination
               ↓             ↓              ↓
           VolumeControl  FrequencyBands  Visualization
```

### **3D Hardware Simulation**
- **Three.js Rendering**: Realistic ESP32 PCB visualization
- **Component Highlighting**: Interactive element identification
- **Status LEDs**: Real-time power, WiFi, and battery indicators
- **2D Fallback**: Graceful degradation when WebGL unavailable

### **UI State Management**
```javascript
{
  currentScreen: 'home',
  audioState: { playing: false, position: 0, volume: 0.7 },
  equalizerState: { preset: 'flat', bands: [0,0,0,0,0,0,0,0,0,0] },
  systemState: { wifi: true, battery: 100, brightness: 80 }
}
```

## 🎯 **Hardware Mapping**

### **Simulated Components**
- **ESP32-2432S028R**: Main microcontroller simulation
- **ILI9341 Display**: 240x320 pixel TFT with touch
- **XPT2046 Touch**: Resistive touch coordinate mapping
- **PCM5102A DAC**: I2S audio output simulation
- **WIHZI ZK-1001B**: 100W amplifier status indication

### **Touch Coordinate Mapping**
```javascript
// Device coordinates (240x320) mapped to screen pixels
const deviceX = (clickX / screenWidth) * 240;
const deviceY = (clickY / screenHeight) * 320;
```

## 📊 **Performance Metrics**

### **Real-time Monitoring**
- **FPS**: Animation frame rate tracking
- **CPU Usage**: Simulated processing load
- **Memory**: JavaScript heap usage monitoring
- **Audio Latency**: Web Audio API buffer timing
- **Touch Responsiveness**: Input-to-display delay

### **Browser Compatibility**
- **Chrome/Chromium**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Partial support (Web Audio limitations)
- **Mobile**: Chrome/Firefox mobile supported

## 🚀 **Deployment Options**

### **Static Hosting**
The demo builds to static files that can be deployed anywhere:
```bash
npm run build
# Deploy dist/ folder to any static host
```

### **Supported Platforms**
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any static file server

### **Requirements**
- **HTTPS**: Required for Web Audio API in production
- **Modern Browser**: ES6 modules, Web Audio API, WebGL support
- **No Server**: Fully client-side, no backend required

## 🎵 **Audio Features in Detail**

### **Equalizer Presets**
- **Flat**: No adjustment (0dB all bands)
- **Rock**: Enhanced bass and treble
- **Pop**: Vocal emphasis with bass boost
- **Jazz**: Smooth mid-range enhancement
- **Classical**: Natural acoustic balance
- **Electronic**: Extended bass and crisp highs

### **Frequency Bands**
```
60Hz, 170Hz, 310Hz, 600Hz, 1kHz, 3kHz, 6kHz, 12kHz, 14kHz, 16kHz
```

### **Audio Formats Supported**
- **MP3**: MPEG Layer-3 audio
- **WAV**: Uncompressed PCM audio
- **OGG**: Ogg Vorbis compression
- **M4A**: AAC in MP4 container (browser dependent)

## 🛠️ **Development**

### **Project Structure**
```
simulation/web_demo/
├── src/
│   ├── index.js              # Main application entry
│   ├── modules/              # Core functionality modules
│   │   ├── audioEngine.js    # Web Audio API wrapper
│   │   ├── deviceSimulator.js # 3D hardware simulation
│   │   ├── uiSimulator.js    # LVGL UI recreation
│   │   ├── performanceMonitor.js # Performance tracking
│   │   ├── debugConsole.js   # Debug interface
│   │   └── touchController.js # Touch input handling
│   └── styles/
│       └── main.css          # Application styles
├── dist/                     # Production build output
├── package.json              # Dependencies and scripts
└── index.html               # Main HTML file
```

### **Adding New Features**
1. **Create Module**: Add to `src/modules/`
2. **Import**: Add to `src/index.js`
3. **Initialize**: Include in demo startup
4. **Test**: Verify functionality

## 🏆 **Demo Highlights**

### **What Makes This Special**
- **Hardware-Accurate**: Faithful ESP32-2432S028R representation
- **Real-time Audio**: Professional-grade Web Audio processing
- **Touch Simulation**: Pixel-perfect coordinate mapping
- **Performance Monitoring**: Real-time system metrics
- **Cross-platform**: Works on desktop and mobile
- **No Installation**: Runs directly in browser
- **Developer-Friendly**: Full debug capabilities

### **Perfect For**
- **Project Demonstration**: Show stakeholders the vision
- **Development Testing**: UI/UX iteration without hardware
- **Education**: Learn embedded development concepts
- **Validation**: Test user flows and interactions
- **Marketing**: Showcase capabilities to potential users

---

## 🎉 **Ready to Experience the Future of DIY Boomboxes!**

This web demo provides a complete, interactive preview of the XTouch Boombox project. Experience professional audio processing, intuitive touch interfaces, and hardware simulation - all running in your browser at 60fps with sub-10ms audio latency.

**Start the demo and feel the bass! 🎵**