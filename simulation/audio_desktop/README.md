# xtouch Audio Desktop Simulator

This directory contains a native desktop audio simulation environment for testing and validating audio processing, equalizer DSP, and I2S output functionality without requiring ESP32 hardware.

## Features

- **Real Audio Playback**: Full-featured audio engine with PortAudio backend
- **Digital Equalizer**: 10-band parametric equalizer with presets
- **I2S Simulation**: Simulates ESP32 I2S interface for compatibility testing
- **Performance Monitoring**: Real-time CPU and memory usage tracking
- **File Format Support**: WAV, MP3, FLAC audio file support
- **Automated Testing**: Comprehensive test suite for all audio components
- **Interactive Mode**: Command-line interface for real-time testing
- **Benchmark Tools**: Performance profiling and optimization tools

## Dependencies

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install build-essential cmake pkg-config
sudo apt install libportaudio2 libportaudio-dev
sudo apt install libsndfile1 libsndfile1-dev
sudo apt install libfftw3-dev libfftw3-single3
```

### macOS
```bash
brew install cmake portaudio libsndfile fftw
```

### Windows (MSYS2)
```bash
pacman -S mingw-w64-x86_64-cmake
pacman -S mingw-w64-x86_64-portaudio
pacman -S mingw-w64-x86_64-libsndfile
pacman -S mingw-w64-x86_64-fftw
```

## Build Instructions

1. **Create build directory**:
   ```bash
   cd simulation/audio_desktop
   mkdir build && cd build
   ```

2. **Configure and build**:
   ```bash
   cmake ..
   make -j$(nproc)
   ```

3. **Run tests** (optional):
   ```bash
   make test
   ```

## Usage

### Interactive Mode
```bash
# Start interactive audio simulator
./xtouch_audio_simulator

# Load and play audio file
./xtouch_audio_simulator test_audio/sample.wav

# Start with specific equalizer preset
./xtouch_audio_simulator --eq-preset rock test_audio/music.wav
```

### Automated Testing
```bash
# Run all audio tests
./xtouch_audio_simulator --test

# Run performance benchmark
./xtouch_audio_simulator --benchmark

# Quiet mode for CI/CD
./xtouch_audio_simulator --quiet --test
```

### Command Line Options
```
Usage: xtouch_audio_simulator [options] [audio_file]

Options:
  -h, --help          Show help message
  -t, --test          Run automated tests
  -b, --benchmark     Run performance benchmarks
  -i, --interactive   Interactive mode (default)
  -q, --quiet         Quiet mode (minimal output)
  --eq-preset NAME    Apply equalizer preset (flat, rock, pop, jazz, etc.)
  --volume LEVEL      Set initial volume (0.0-1.0)
```

## Interactive Commands

When running in interactive mode, the following commands are available:

### Playback Control
- `play` - Start playback
- `pause` - Pause playback
- `stop` - Stop playback
- `load <file>` - Load audio file
- `seek <time_ms>` - Seek to position in milliseconds

### Audio Control
- `volume <0.0-1.0>` - Set volume level
- `eq <band> <gain>` - Set equalizer band gain (-12.0 to +12.0 dB)
- `eq preset <name>` - Apply equalizer preset
- `eq reset` - Reset equalizer to flat response

### Information
- `info` - Show current file information and playback status
- `stats` - Show performance statistics
- `list` - List available test audio files

### Testing
- `test` - Run quick functionality tests
- `help` - Show command help
- `quit` - Exit simulator

## Audio Engine Architecture

### Core Components

1. **Audio Engine** (`audio_engine.cpp`)
   - File loading and decoding
   - Playback control and state management
   - Real-time audio processing pipeline
   - I2S interface simulation

2. **Digital Equalizer** (`equalizer.cpp`)
   - 10-band parametric equalizer
   - Real-time DSP processing
   - Preset management
   - Frequency response analysis

3. **File Manager** (`file_manager.cpp`)
   - Multi-format audio file support
   - Metadata extraction
   - File system operations
   - Playlist management

4. **Performance Monitor** (`performance_monitor.cpp`)
   - CPU usage tracking
   - Memory usage monitoring
   - Real-time statistics
   - Performance profiling

### Audio Processing Pipeline

```
Audio File → Decoder → Equalizer → Volume → I2S Simulator → PortAudio → Speakers
                ↓         ↓         ↓           ↓
           Metadata   Spectrum   Level      Performance
           Extraction Analysis  Monitoring   Monitoring
```

## Equalizer Configuration

### Available Bands
- **32 Hz** - Sub-bass
- **64 Hz** - Bass
- **125 Hz** - Bass
- **250 Hz** - Low midrange
- **500 Hz** - Midrange
- **1 kHz** - Midrange
- **2 kHz** - High midrange
- **4 kHz** - Presence
- **8 kHz** - Brilliance
- **16 kHz** - Air

### Presets
- **Flat** - No adjustment (0 dB all bands)
- **Rock** - Enhanced bass and treble
- **Pop** - Balanced with slight bass boost
- **Jazz** - Smooth midrange emphasis
- **Classical** - Natural frequency response
- **Vocal** - Enhanced midrange for vocals
- **Bass Boost** - Enhanced low frequencies
- **Treble Boost** - Enhanced high frequencies

### Custom Configuration
```cpp
// Set individual band gains
equalizer_set_band_gain(EQ_FREQ_1KHZ, 3.0f);  // +3dB at 1kHz

// Set all bands at once
float gains[EQ_BANDS] = {0, 2, 4, 2, 0, 1, 2, 3, 1, 0};
equalizer_set_all_gains(gains);

// Save/load custom settings
equalizer_save_settings("my_preset.eq");
equalizer_load_settings("my_preset.eq");
```

## I2S Simulation

The simulator provides ESP32 I2S compatibility for testing embedded audio code:

```cpp
// ESP32-compatible I2S functions
int audio_engine_i2s_write(const void* data, size_t size);

// These simulate the ESP32 I2S driver interface
i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
i2s_set_pin(I2S_NUM_0, &pin_config);
i2s_write(I2S_NUM_0, audio_data, bytes_to_write, &bytes_written, portMAX_DELAY);
```

## Testing Framework

### Unit Tests
- **Equalizer Tests**: Filter response, gain accuracy, preset validation
- **DSP Tests**: Audio processing accuracy, performance benchmarks
- **File Manager Tests**: Format support, metadata extraction, error handling

### Integration Tests
- **End-to-end Audio Processing**: Complete pipeline validation
- **Performance Tests**: CPU usage, memory consumption, real-time processing
- **Compatibility Tests**: ESP32 I2S interface simulation

### Automated Test Scenarios
```bash
# Run specific test categories
./audio_tests equalizer
./audio_tests dsp
./audio_tests files

# Performance benchmarking
./xtouch_audio_simulator --benchmark

# Continuous testing during development
./scripts/watch_and_test.sh
```

## Performance Monitoring

### Real-time Metrics
- **CPU Usage**: Audio processing load
- **Memory Usage**: Heap and buffer allocation
- **Buffer Health**: Underruns and overruns
- **Latency**: Audio processing delay

### Performance Optimization
- **SIMD Instructions**: Vectorized DSP operations
- **Buffer Management**: Optimized memory allocation
- **Thread Scheduling**: Real-time priority handling
- **Cache Optimization**: Memory access patterns

## Development Workflow

### Hot Reload Development
```bash
# Watch for changes and rebuild automatically
./scripts/watch_and_rebuild.sh

# Quick test cycle
make && ./xtouch_audio_simulator --test
```

### Debugging
```bash
# Build with debug symbols
cmake -DCMAKE_BUILD_TYPE=Debug ..
make

# Run with GDB
gdb ./xtouch_audio_simulator
(gdb) break equalizer_process
(gdb) run test_audio/sample.wav
```

### Profiling
```bash
# CPU profiling with perf
perf record ./xtouch_audio_simulator --benchmark
perf report

# Memory profiling with valgrind
valgrind --tool=massif ./xtouch_audio_simulator test_audio/sample.wav
```

## Integration with xtouch Project

### ESP32 Compatibility Layer
The simulator provides mock implementations of ESP32-specific functions:

```cpp
// Mock I2S driver
int i2s_driver_install(i2s_port_t i2s_num, const i2s_config_t *i2s_config, int queue_size, void *queue);
esp_err_t i2s_write(i2s_port_t i2s_num, const void *src, size_t size, size_t *bytes_written, TickType_t ticks_to_wait);

// Mock audio processing functions
void audio_process_equalizer(const int16_t* input, int16_t* output, size_t frames);
void audio_set_volume(float volume);
```

### Configuration Synchronization
```bash
# Sync audio configurations between simulator and ESP32
./scripts/sync_audio_config.sh
```

### Cross-platform Testing
```bash
# Test audio processing on multiple platforms
./scripts/test_all_platforms.sh
```

## Troubleshooting

### Common Issues

1. **Audio Device Not Found**:
   ```bash
   # List available audio devices
   ./xtouch_audio_simulator --list-devices
   
   # Use specific device
   ./xtouch_audio_simulator --device 2
   ```

2. **Library Not Found**:
   ```bash
   # Check library dependencies
   ldd ./xtouch_audio_simulator
   
   # Install missing libraries
   sudo apt install libportaudio2 libsndfile1
   ```

3. **Permission Denied**:
   ```bash
   # Add user to audio group (Linux)
   sudo usermod -a -G audio $USER
   ```

### Performance Issues

1. **High CPU Usage**:
   - Reduce buffer size in cmake configuration
   - Disable spectrum analysis features
   - Use optimized build (`-DCMAKE_BUILD_TYPE=Release`)

2. **Audio Dropouts**:
   - Increase buffer size
   - Check system audio latency
   - Disable other audio applications

3. **Memory Leaks**:
   ```bash
   # Run with memory debugging
   valgrind --leak-check=full ./xtouch_audio_simulator
   ```

## File Structure

```
simulation/audio_desktop/
├── CMakeLists.txt              # Build configuration
├── include/
│   ├── audio_engine.h          # Audio engine interface
│   ├── equalizer.h             # Equalizer interface
│   ├── file_manager.h          # File management
│   ├── dsp_processor.h         # DSP utilities
│   ├── performance_monitor.h   # Performance monitoring
│   └── i2s_simulator.h         # I2S simulation
├── src/
│   ├── main.cpp               # Main application
│   ├── audio_engine.cpp       # Audio engine implementation
│   ├── equalizer.cpp          # Equalizer implementation
│   ├── file_manager.cpp       # File management
│   ├── dsp_processor.cpp      # DSP processing
│   ├── performance_monitor.cpp # Performance monitoring
│   ├── i2s_simulator.cpp      # I2S simulation
│   └── test_runner.cpp        # Test framework
├── tests/
│   ├── test_equalizer.cpp     # Equalizer unit tests
│   ├── test_dsp.cpp           # DSP unit tests
│   └── test_file_manager.cpp  # File manager tests
├── test_data/
│   ├── sample.wav             # Test audio files
│   ├── music.wav
│   └── sweep.wav
├── scripts/
│   ├── build.sh               # Build script
│   ├── test.sh                # Test script
│   ├── watch_and_rebuild.sh   # Development helper
│   └── benchmark.sh           # Performance testing
└── README.md                  # This file
```