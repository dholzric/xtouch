# Wokwi ESP32-2432S028R Simulation

This directory contains the Wokwi simulation setup for the ESP32-2432S028R yellow display board (Cheap Yellow Display - CYD).

## Hardware Components Simulated

- **ESP32-WROOM-32**: Main microcontroller
- **ILI9341 TFT Display**: 2.8" 240x320 pixel display
- **XPT2046 Touch Controller**: Resistive touch screen controller
- **MicroSD Card**: For storing audio files and configuration
- **I2S Audio Output**: Simulated digital audio interface
- **GPIO Pins**: For additional controls and indicators

## Pin Mapping (ESP32-2432S028R)

### Display (ILI9341)
- VCC: 3.3V
- GND: Ground
- CS: GPIO 15
- RESET: GPIO 4  
- DC: GPIO 2
- MOSI: GPIO 13
- SCK: GPIO 14
- LED: 3.3V (always on)

### Touch (XPT2046)
- T_CLK: GPIO 25
- T_CS: GPIO 33
- T_DIN: GPIO 32
- T_DO: GPIO 39
- T_IRQ: GPIO 36

### SD Card
- CS: GPIO 5
- MOSI: GPIO 23
- MISO: GPIO 19
- SCK: GPIO 18

### I2S Audio
- BCK: GPIO 26
- WS: GPIO 25
- DATA: GPIO 22

### Additional GPIOs
- User LED: GPIO 17
- Boot Button: GPIO 0
- User Button: GPIO 35

## Setup Instructions

1. **Install Wokwi CLI** (if using local simulation):
   ```bash
   npm install -g @wokwi/cli
   ```

2. **Build the project**:
   ```bash
   cd F:\xtouch
   pio run
   ```

3. **Run simulation**:
   ```bash
   cd simulation/wokwi
   wokwi-cli diagram.json
   ```

4. **Or use Wokwi web interface**:
   - Open https://wokwi.com
   - Create new project
   - Upload `diagram.json` and firmware files
   - Click "Start Simulation"

## Testing Scenarios

### 1. Display and Touch Testing
- Verify LVGL UI renders correctly
- Test touch responsiveness across screen
- Check screen rotation and scaling
- Validate font rendering and graphics

### 2. Audio Processing Simulation
- Test I2S output configuration
- Verify audio file playback simulation
- Check equalizer DSP processing
- Monitor CPU usage during audio operations

### 3. File System Testing
- Test SD card file operations
- Verify configuration file loading
- Check audio file enumeration
- Test file system error handling

### 4. WiFi and Connectivity
- Simulate WiFi connection process
- Test MQTT connectivity
- Verify web server functionality
- Check OTA update process

### 5. Performance Monitoring
- Monitor heap memory usage
- Check stack overflow conditions
- Measure rendering performance
- Profile CPU utilization

## Debugging Features

### Serial Monitor
- Real-time log output at 115200 baud
- Debug message filtering
- Error tracking and analysis

### Memory Monitoring
- Heap usage tracking
- Stack overflow detection
- Memory leak identification
- PSRAM usage (if enabled)

### GPIO State Monitoring
- Real-time pin state visualization
- Touch event logging
- Button press detection
- LED status indication

## Limitations

1. **Audio Output**: No actual audio playback, only I2S signal simulation
2. **Touch Precision**: May not match exact hardware characteristics
3. **Timing**: Simulation timing may differ from real hardware
4. **Peripheral Simulation**: Some advanced features may be simplified
5. **Real-time Performance**: Simulation speed depends on host system

## Integration with Development Workflow

### Continuous Integration
```yaml
# .github/workflows/wokwi-test.yml
name: Wokwi Simulation Test
on: [push, pull_request]
jobs:
  simulate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PlatformIO
        run: pip install platformio
      - name: Build firmware
        run: pio run
      - name: Run Wokwi simulation
        run: |
          cd simulation/wokwi
          wokwi-cli --headless --timeout 60 diagram.json
```

### Local Development
```bash
# Build and test cycle
pio run && cd simulation/wokwi && wokwi-cli diagram.json
```

## Test Files Structure

```
simulation/wokwi/
├── diagram.json          # Wokwi circuit diagram
├── wokwi.toml           # Configuration file
├── test_files/
│   ├── audio/
│   │   ├── test.wav     # Test audio file
│   │   └── test.mp3     # MP3 test file
│   └── config/
│       └── settings.json # Test configuration
├── scripts/
│   ├── build_and_run.sh # Automated build/run script
│   └── test_runner.js   # Automated test scenarios
└── README.md           # This file
```

## Troubleshooting

### Common Issues

1. **Firmware not loading**:
   - Ensure `.pio/build/esp32dev/firmware.bin` exists
   - Check build configuration in `platformio.ini`

2. **Display not working**:
   - Verify pin connections in diagram.json
   - Check TFT_eSPI configuration

3. **Touch not responsive**:
   - Confirm XPT2046 pin mapping
   - Check touch calibration values

4. **Audio issues**:
   - Verify I2S pin configuration
   - Check audio file format support

### Debug Commands
```bash
# View serial output
wokwi-cli --monitor diagram.json

# Run with debugging
wokwi-cli --debug diagram.json

# Headless testing
wokwi-cli --headless --timeout 30 diagram.json
```