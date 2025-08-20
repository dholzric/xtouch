# xtouch Web Demo

This directory contains a comprehensive web-based demonstration environment for the ESP32-2432S028R boombox project. The demo provides an interactive browser-based simulation of the complete hardware and software stack.

## Features

### Hardware Simulation
- **3D ESP32-2432S028R Visualization**: Interactive 3D model using Three.js
- **Display Simulation**: Pixel-perfect 240x320 ILI9341 TFT display
- **Touch Interface**: Mouse/touch input simulation with visual feedback
- **Hardware Status**: WiFi, battery, and SD card status simulation
- **Real-time Performance Monitoring**: CPU, memory, and audio buffer monitoring

### Audio Engine
- **Web Audio API Integration**: Professional-grade audio processing
- **Real-time Equalizer**: 10-band parametric equalizer with presets
- **Audio Visualization**: Spectrum analyzer and waveform display
- **File Format Support**: MP3, WAV, OGG, and more via Web Audio API
- **Demo Track Generation**: Built-in procedural audio generation

### UI Simulation
- **LVGL-inspired Interface**: Faithful recreation of embedded UI
- **Multi-screen Navigation**: Home, equalizer, and settings screens
- **Touch Interaction**: Responsive touch/click handling
- **State Management**: Persistent UI state across sessions
- **Visual Effects**: Smooth transitions and animations

### Development Tools
- **Debug Console**: Real-time logging and command interface
- **Performance Profiler**: CPU and memory usage tracking
- **Automated Testing**: Built-in demo sequences and scenarios
- **Hot Reload**: Instant updates during development
- **Cross-platform**: Works on desktop and mobile browsers

## Quick Start

### Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build

# Serve production build
npm run serve
```

### Testing
```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
simulation/web_demo/
├── package.json                # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── index.html                 # Main HTML file
├── src/
│   ├── index.js               # Main application entry
│   ├── styles/
│   │   └── main.css          # Global styles
│   ├── modules/
│   │   ├── audioEngine.js     # Web Audio API wrapper
│   │   ├── deviceSimulator.js # 3D hardware simulation
│   │   ├── uiSimulator.js     # LVGL UI simulation
│   │   ├── performanceMonitor.js # Performance monitoring
│   │   ├── debugConsole.js    # Debug tools
│   │   ├── touchController.js # Touch input handling
│   │   └── equalizer.js       # Audio equalizer
│   ├── shaders/
│   │   ├── vertex.glsl        # WebGL vertex shaders
│   │   └── fragment.glsl      # WebGL fragment shaders
│   └── workers/
│       └── audioProcessor.js  # Web Audio worklet
├── assets/
│   ├── models/
│   │   └── esp32-board.gltf   # 3D model files
│   ├── textures/
│   │   └── pcb-texture.jpg    # PCB textures
│   ├── audio/
│   │   └── demo-track.wav     # Demo audio files
│   └── icons/
│       └── favicon.ico        # App icons
├── tests/
│   ├── audio.test.js          # Audio engine tests
│   ├── ui.test.js             # UI simulation tests
│   └── integration.test.js    # Integration tests
└── README.md                  # This file
```

## Usage Guide

### Basic Operation

1. **Load the Demo**: Open in a modern web browser
2. **Audio Setup**: Click "Use Demo Track" or upload your own audio file
3. **Playback Control**: Use the device controls or master controls panel
4. **UI Navigation**: Click on the simulated display to interact with the UI
5. **Equalizer**: Navigate to the equalizer screen to adjust audio settings

### Interactive Features

#### Device Controls
- **Power Button**: Simulated power on/off (visual feedback only)
- **Display Touch**: Full touch interface simulation
- **Status Indicators**: WiFi, battery, and connectivity status
- **Hardware Simulation**: Toggle WiFi, battery, and SD card errors

#### Audio Controls
- **File Upload**: Drag & drop or select audio files
- **Playback**: Play, pause, stop, seek functionality
- **Volume Control**: Master volume and device volume sync
- **Equalizer**: 10-band EQ with preset configurations

#### Simulation Modes
- **Real-time**: Normal operation at 1x speed
- **Fast Mode**: 10x speed for quick testing
- **Debug Mode**: Enhanced logging and performance metrics

### Debug Console Commands

Access the debug console at the bottom of the interface:

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

### Keyboard Shortcuts

- **Ctrl/Cmd + Space**: Toggle playback
- **Ctrl/Cmd + F**: Toggle fullscreen
- **Ctrl/Cmd + I**: Show project information
- **Escape**: Close modals

## Technical Implementation

### Audio Engine Architecture

The audio engine is built on the Web Audio API and provides:

```javascript
// Audio processing pipeline
AudioSource → GainNode → EqualizerNode → AnalyserNode → AudioDestination
                ↓              ↓             ↓
            VolumeControl  FrequencyBands  Visualization
```

#### Key Components

1. **AudioContext**: Main audio processing context
2. **ScriptProcessor**: Real-time audio processing
3. **BiquadFilter**: Equalizer band implementation
4. **AnalyserNode**: Spectrum analysis for visualization
5. **GainNode**: Volume control and mixing

### Device Simulation

The 3D device simulation uses Three.js for hardware visualization:

```javascript
// 3D rendering pipeline
Scene → Camera → Renderer → Canvas
  ↓       ↓        ↓
Lights  Controls  Materials
```

#### Features

- **Realistic PCB Rendering**: Accurate ESP32-2432S028R representation
- **Component Highlighting**: Interactive component identification
- **Animation System**: Status indicators and visual feedback
- **Responsive Layout**: Adapts to different screen sizes

### UI State Management

The UI simulator maintains state across multiple screens:

```javascript
const uiState = {
    currentScreen: 'home',
    audioState: {
        playing: false,
        position: 0,
        volume: 0.7,
        track: null
    },
    equalizerState: {
        preset: 'flat',
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    systemState: {
        wifi: true,
        battery: 100,
        brightness: 80
    }
};
```

## Development

### Adding New Features

1. **Create Module**: Add new module in `src/modules/`
2. **Import in Main**: Add import to `src/index.js`
3. **Initialize**: Add initialization in `XTouchDemo.init()`
4. **Test**: Add tests in `tests/` directory

### Audio Processing

To add new audio effects:

```javascript
// Create new audio node
const effectNode = audioContext.createBiquadFilter();
effectNode.type = 'lowpass';
effectNode.frequency.value = 1000;

// Insert into audio chain
sourceNode.connect(effectNode);
effectNode.connect(destinationNode);
```

### UI Customization

To add new screens or modify existing ones:

```css
/* Add new screen styles */
.my-custom-screen {
    /* Screen-specific styles */
}
```

```javascript
// Add screen to navigation
uiSimulator.addScreen('custom', MyCustomScreen);
```

### Performance Optimization

1. **Audio Buffer Size**: Adjust for latency vs. CPU usage
2. **Render Quality**: Balance visual quality vs. performance
3. **Update Frequency**: Optimize animation and monitoring intervals
4. **Memory Management**: Proper cleanup of audio resources

## Browser Compatibility

### Supported Browsers
- **Chrome/Chromium**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Partial support (some Web Audio limitations)
- **Edge**: Full support

### Required Features
- Web Audio API
- WebGL 2.0
- ES6 Modules
- Canvas 2D/WebGL
- File API

### Mobile Support
- **iOS Safari**: Limited (Web Audio restrictions)
- **Chrome Mobile**: Full support
- **Firefox Mobile**: Full support

## Deployment

### Static Hosting
The demo can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3
```

### Server Requirements
- **None**: Fully static, no server-side processing required
- **HTTPS**: Required for Web Audio API in production
- **CORS**: Configure if loading external audio files

### CDN Integration
```html
<!-- Optional CDN libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web-audio-api@latest/dist/web-audio-api.min.js"></script>
```

## Troubleshooting

### Common Issues

1. **No Audio Output**:
   - Check browser audio permissions
   - Ensure HTTPS in production
   - Verify Web Audio API support

2. **Performance Issues**:
   - Reduce audio buffer size
   - Disable visual effects
   - Close other browser tabs

3. **Display Problems**:
   - Check WebGL support
   - Update graphics drivers
   - Try different browser

4. **Touch Not Working**:
   - Enable touch simulation
   - Check browser console for errors
   - Verify pointer events

### Debug Information

Access debug info via browser console:

```javascript
// Check audio context state
console.log(window.xtouchDemo.audioEngine.getState());

// Monitor performance
console.log(window.xtouchDemo.performanceMonitor.getStats());

// View UI state
console.log(window.xtouchDemo.uiSimulator.getCurrentState());
```

## Contributing

### Development Workflow

1. **Fork Repository**: Create your own fork
2. **Create Branch**: `git checkout -b feature/my-feature`
3. **Make Changes**: Implement your feature
4. **Test**: Run all tests and verify functionality
5. **Submit PR**: Create pull request with description

### Code Style

- **ES6+**: Use modern JavaScript features
- **Modules**: Use ES6 module system
- **Comments**: Document complex logic
- **Naming**: Use descriptive variable names

### Testing Guidelines

- **Unit Tests**: Test individual modules
- **Integration Tests**: Test module interactions
- **User Tests**: Test complete workflows
- **Performance Tests**: Verify performance requirements

## License

This project is licensed under the GPL-3.0 license. See the main project LICENSE file for details.

## Support

- **Documentation**: Check main project README
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Wiki**: Additional documentation in project wiki