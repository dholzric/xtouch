# LVGL PC Simulator for xtouch UI Development

This directory contains a native PC simulator for developing and testing the xtouch UI using LVGL without requiring ESP32 hardware.

## Features

- **Native Performance**: Runs at full speed on your development machine
- **Real UI Testing**: Uses the exact same UI code as the ESP32 target
- **Hot Reload**: Quick compilation and testing cycle
- **Debug Support**: Full debugging capabilities with GDB
- **Cross Platform**: Works on Windows, Linux, and macOS
- **SDL2 Backend**: Hardware-accelerated rendering when available

## Requirements

### Windows
```bash
# Install SDL2 development libraries
# Download SDL2 development libraries from https://libsdl.org/download-2.0.php
# Extract to C:\SDL2 or use vcpkg:
vcpkg install sdl2

# Or use MSYS2
pacman -S mingw-w64-x86_64-SDL2
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install build-essential cmake libsdl2-dev pkg-config
```

### macOS
```bash
# Using Homebrew
brew install cmake sdl2 pkg-config
```

## Setup Instructions

1. **Clone LVGL library**:
   ```bash
   cd simulation/lvgl_pc
   git clone https://github.com/lvgl/lvgl.git
   cd lvgl
   git checkout v8.3.9  # Match the version used in platformio.ini
   ```

2. **Create build directory**:
   ```bash
   mkdir build
   cd build
   ```

3. **Configure and build**:
   ```bash
   cmake ..
   make -j$(nproc)
   ```

4. **Run the simulator**:
   ```bash
   ./xtouch_lvgl_simulator
   ```

## Development Workflow

### Quick Build and Test
```bash
# From simulation/lvgl_pc directory
./scripts/quick_build.sh
```

### Debug Build
```bash
mkdir build_debug
cd build_debug
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc)
gdb ./xtouch_lvgl_simulator
```

### Hot Reload Development
```bash
# Use the file watcher script for automatic rebuilds
./scripts/watch_and_rebuild.sh
```

## Controls and Shortcuts

- **Mouse**: Acts as touch input
- **Escape**: Exit simulator
- **R**: Reset/restart simulation
- **F11**: Toggle fullscreen (if supported)
- **Ctrl+C**: Force quit from terminal

## Testing Scenarios

### 1. UI Layout Testing
- Test responsive layouts at 240x320 resolution
- Verify all UI elements are properly positioned
- Check text wrapping and font rendering
- Test different theme configurations

### 2. Touch Interaction Testing
- Click/touch events on buttons and sliders
- Scroll behavior in lists and containers
- Gesture recognition (swipe, pinch if implemented)
- Multi-touch simulation (planned feature)

### 3. Performance Profiling
- Memory usage monitoring via LVGL built-in monitor
- Frame rate analysis
- Widget update frequency
- Memory leak detection

### 4. Component Integration Testing
- Screen transitions and navigation
- Event handling between components
- State management across screens
- Data binding and updates

## File Structure

```
simulation/lvgl_pc/
├── CMakeLists.txt           # Build configuration
├── lv_conf.h               # LVGL configuration for PC
├── src/
│   ├── main.cpp            # Main simulator entry point
│   ├── hal.cpp             # Hardware abstraction layer
│   ├── hal.h               # HAL header
│   └── mouse_cursor_icon.c # Mouse cursor graphics
├── lvgl/                   # LVGL library (git submodule)
├── build/                  # Build output directory
├── scripts/
│   ├── quick_build.sh      # Quick build script
│   ├── watch_and_rebuild.sh # File watcher for hot reload
│   └── setup_deps.sh       # Dependency installation
└── README.md              # This file
```

## Configuration Options

### Display Configuration
- **Resolution**: 240x320 (matches ESP32-2432S028R)
- **Color Depth**: 32-bit for PC (16-bit simulated)
- **Refresh Rate**: 60 FPS (configurable)
- **Zoom Factor**: 2x (configurable in hal.cpp)

### Memory Configuration
- **Dynamic Allocation**: Uses system malloc/free
- **No Memory Limits**: Unlike ESP32, PC has abundant RAM
- **Memory Monitoring**: Built-in LVGL memory monitor enabled

### Performance Features
- **Hardware Acceleration**: SDL2 GPU acceleration when available
- **VSync**: Enabled for smooth rendering
- **Multi-threading**: Safe for UI updates

## Debugging Features

### Built-in Monitors
```c
// Enable in lv_conf.h
#define LV_USE_PERF_MONITOR 1  // Shows FPS and CPU usage
#define LV_USE_MEM_MONITOR 1   // Shows memory usage
#define LV_USE_LOG 1           // Enable logging
```

### GDB Integration
```bash
# Build with debug symbols
cmake -DCMAKE_BUILD_TYPE=Debug ..
make

# Run with GDB
gdb ./xtouch_lvgl_simulator
(gdb) break main
(gdb) run
(gdb) step
```

### Log Output
The simulator provides detailed logging:
- Mock function calls (ESP32 functions)
- UI state transitions
- Performance metrics
- Error conditions

## Limitations and Differences from Hardware

1. **No Real Hardware Constraints**:
   - Unlimited memory compared to ESP32
   - No real-time constraints
   - Different timing characteristics

2. **Simulated Components**:
   - No actual SD card operations
   - No WiFi connectivity
   - No real audio output
   - No temperature sensors

3. **Input Differences**:
   - Mouse vs. resistive touch screen
   - Different precision and behavior
   - No pressure sensitivity

4. **Performance**:
   - Much faster than ESP32
   - Different bottlenecks
   - May mask performance issues

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: LVGL Simulator Test
on: [push, pull_request]

jobs:
  test-ui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          sudo apt update
          sudo apt install -y libsdl2-dev cmake
          
      - name: Setup LVGL
        run: |
          cd simulation/lvgl_pc
          git clone https://github.com/lvgl/lvgl.git
          cd lvgl && git checkout v8.3.9
          
      - name: Build simulator
        run: |
          cd simulation/lvgl_pc
          mkdir build && cd build
          cmake .. && make -j$(nproc)
          
      - name: Run headless tests
        run: |
          cd simulation/lvgl_pc/build
          timeout 10s ./xtouch_lvgl_simulator || true
```

## Troubleshooting

### Common Build Issues

1. **SDL2 not found**:
   ```bash
   # Linux
   sudo apt install libsdl2-dev
   # macOS
   brew install sdl2
   # Windows - use vcpkg or download binaries
   ```

2. **LVGL not found**:
   ```bash
   cd simulation/lvgl_pc
   git clone https://github.com/lvgl/lvgl.git
   ```

3. **CMake version too old**:
   ```bash
   # Update CMake to 3.16 or newer
   sudo apt install cmake
   ```

### Runtime Issues

1. **Window doesn't appear**:
   - Check if display is available
   - Try running with `DISPLAY=:0` on Linux
   - Check SDL2 backend availability

2. **Touch not working**:
   - Ensure mouse is within window bounds
   - Check coordinate scaling in hal.cpp
   - Verify LVGL input device registration

3. **Performance issues**:
   - Disable VSync: `SDL_RENDERER_PRESENTVSYNC`
   - Reduce zoom factor in hal.cpp
   - Check system resources

## Contributing

When modifying the simulator:

1. **Keep ESP32 compatibility**: Ensure changes don't break ESP32 build
2. **Mock new functions**: Add mock implementations for ESP32-specific code
3. **Update configurations**: Keep lv_conf.h in sync with ESP32 version
4. **Test thoroughly**: Verify UI behavior matches hardware expectations

## Advanced Features

### Custom Test Scenarios
Create automated test scenarios by extending `main.cpp`:

```cpp
void run_automated_tests() {
    // Simulate user interactions
    // Navigate through screens
    // Check UI state
    // Report results
}
```

### Performance Benchmarking
```cpp
void benchmark_performance() {
    // Measure rendering times
    // Count frame drops
    // Memory usage profiling
    // Generate reports
}
```

### UI Screenshot Capture
```cpp
void capture_screenshots() {
    // Save screen states
    // Compare with reference images
    // Visual regression testing
}
```