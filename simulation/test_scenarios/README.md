# xtouch Simulation Test Scenarios

This directory contains comprehensive test scenarios and frameworks for validating all simulation approaches of the ESP32-2432S028R boombox project.

## Overview

The test framework provides automated testing capabilities for:
- **Wokwi ESP32 Simulator**: Hardware-level simulation testing
- **LVGL PC Simulator**: UI/UX testing and performance validation
- **Audio Desktop Simulator**: Audio processing and DSP validation
- **Web Demo**: Browser-based simulation testing

## Framework Architecture

```
Test Framework
├── TestFramework (Orchestrator)
├── SimulatorBase (Abstract Base)
├── WokwiSimulator
├── LVGLSimulator
├── AudioSimulator
├── WebDemoSimulator
└── Test Result Management
```

## Quick Start

### Prerequisites

#### Python Environment
```bash
# Python 3.8+ required
pip install -r requirements.txt
```

#### System Dependencies
```bash
# For audio testing
sudo apt install portaudio19-dev libsndfile1-dev

# For web testing (optional)
pip install selenium requests
# Install Chrome/Chromium for browser testing

# For process monitoring
pip install psutil
```

### Basic Usage

```bash
# Run all tests for all simulators
python test_framework.py

# Test specific simulators
python test_framework.py --simulators wokwi lvgl

# Verbose output
python test_framework.py --verbose

# Custom output file
python test_framework.py --output my_test_report.txt
```

## Test Categories

### 1. Wokwi ESP32 Hardware Tests

#### Boot Sequence Validation
- **Objective**: Verify ESP32 boot process and initialization
- **Method**: Monitor serial output for boot messages
- **Criteria**: All critical boot messages detected
- **Timeout**: 30 seconds

```python
Expected Boot Messages:
- "ESP-ROM:"
- "Build:Mar 27 2021"
- "rst:0x1 (POWERON_RESET)"
- "configsip:"
- "mode:DIO"
- "ets Jul 29 2019"
```

#### Display Output Testing
- **Objective**: Validate ILI9341 TFT display initialization
- **Method**: Check display driver initialization logs
- **Criteria**: Display properly initialized with correct parameters
- **Metrics**: Resolution (240x320), Color depth (16-bit)

#### Touch Input Validation
- **Objective**: Test XPT2046 touch controller functionality
- **Method**: Inject touch events and verify response
- **Criteria**: Touch events properly processed
- **Test Points**: Multiple coordinates across screen area

#### I2S Audio Interface
- **Objective**: Verify I2S audio output functionality
- **Method**: Check I2S driver initialization and data flow
- **Criteria**: Proper I2S configuration and data output
- **Parameters**: 44.1kHz, 16-bit, stereo

#### SD Card Operations
- **Objective**: Test SD card file system operations
- **Method**: Perform mount, read, write, delete operations
- **Criteria**: File operations complete successfully
- **Operations**: Mount, create file, read file, delete file

### 2. LVGL PC Simulator Tests

#### UI Rendering Performance
- **Objective**: Measure LVGL rendering performance
- **Method**: Monitor frame rate and rendering efficiency
- **Criteria**: Target 60 FPS, minimum 90% efficiency
- **Duration**: 5 seconds continuous rendering

#### Memory Usage Analysis
- **Objective**: Detect memory leaks and monitor usage
- **Method**: Track memory allocation over time
- **Criteria**: Memory growth < 10MB over test period
- **Tools**: Process memory monitoring

#### Performance Metrics
- **Objective**: Overall performance validation
- **Criteria**: 
  - Startup time < 5 seconds
  - Response time < 100ms
  - Memory usage < 50MB
  - CPU usage < 50%

#### Screen Transition Testing
- **Objective**: Validate UI navigation and animations
- **Method**: Test transitions between all screens
- **Criteria**: Average transition time < 500ms
- **Screens**: Intro → Home → Settings → Equalizer

### 3. Audio Desktop Simulator Tests

#### Equalizer Functionality
- **Objective**: Validate 10-band equalizer operation
- **Method**: Test all bands and presets
- **Criteria**: All bands respond correctly to gain changes
- **Range**: -12dB to +12dB per band
- **Presets**: Flat, Rock, Pop, Jazz, Classical

#### Audio Processing Pipeline
- **Objective**: Test real-time audio processing
- **Method**: Monitor processing metrics under load
- **Criteria**: 
  - Latency < 50ms
  - CPU usage < 80%
  - Zero buffer underruns
- **Duration**: 3 seconds processing

#### File Format Support
- **Objective**: Verify audio file format compatibility
- **Method**: Test loading various audio formats
- **Criteria**: Support rate ≥ 50%
- **Formats**: WAV, MP3, FLAC, OGG

#### Performance Under Load
- **Objective**: Stress test audio processing
- **Method**: Concurrent operations with monitoring
- **Criteria**:
  - Max CPU usage < 70%
  - Zero audio dropouts
  - Memory stable
- **Operations**: Playback + EQ + Spectrum + File I/O

### 4. Web Demo Simulator Tests

#### Web Interface Responsiveness
- **Objective**: Test web interface functionality
- **Method**: HTTP requests and DOM element verification
- **Criteria**: 
  - HTTP 200 response
  - All critical elements present
  - Success rate ≥ 80%
- **Elements**: main-interface, device-canvas, audio-visualizer

#### Web Audio Engine
- **Objective**: Validate Web Audio API integration
- **Method**: Test audio context and processing nodes
- **Criteria**: All audio features functional
- **Features**: AudioContext, Equalizer, Visualization, File loading

#### Device Simulation
- **Objective**: Test 3D device rendering and interaction
- **Method**: Verify WebGL rendering and touch simulation
- **Criteria**: All simulation components working
- **Components**: 3D rendering, Touch simulation, Display rendering

#### Web Performance
- **Objective**: Measure web demo performance
- **Method**: Performance metrics collection
- **Criteria**:
  - Page load time < 5 seconds
  - Audio latency < 100ms
  - Frame rate > 30 FPS

## Test Results and Reporting

### Result Categories
- **PASS**: Test completed successfully
- **FAIL**: Test failed to meet criteria
- **ERROR**: Test encountered an error
- **SKIP**: Test was skipped (missing dependencies)

### Severity Levels
- **CRITICAL**: Core functionality, must pass
- **HIGH**: Important features, should pass
- **MEDIUM**: Nice-to-have features
- **LOW**: Optional or experimental features

### Test Report Format

```
================================================================================
XTOUCH SIMULATION TEST REPORT
================================================================================

Total Tests: 16
Passed: 14 (87.5%)
Failed: 1
Errors: 0
Skipped: 1
Duration: 245.3 seconds

WOKWI SIMULATOR
----------------------------------------
Tests: 5
Success Rate: 100.0%
Duration: 67.2s

  ✓ ESP32 Boot Sequence (12.5s)
  ✓ Display Output (8.3s)
  ✓ Touch Input (5.1s)
  ✓ I2S Audio Output (15.7s)
  ✓ SD Card Operations (25.6s)

LVGL SIMULATOR
----------------------------------------
Tests: 4
Success Rate: 75.0%
Duration: 89.4s

  ✓ UI Rendering Performance (22.1s)
  ✗ Memory Usage (45.8s)
    Error: Memory growth exceeded threshold: 15.2MB
  ✓ Performance Metrics (12.3s)
  ✓ Screen Transitions (9.2s)
```

### Metrics Collection

Each test collects relevant metrics:

```json
{
  "test_name": "Audio Processing",
  "result": "PASS",
  "duration": 15.7,
  "metrics": {
    "sample_rate": 44100,
    "buffer_size": 512,
    "latency_ms": 11.6,
    "cpu_usage": 15.5,
    "buffer_underruns": 0
  },
  "timestamp": "2024-01-15 14:30:25"
}
```

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Simulation Tests
on: [push, pull_request]

jobs:
  test-simulations:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        simulator: [wokwi, lvgl, audio]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r simulation/test_scenarios/requirements.txt
          sudo apt-get update
          sudo apt-get install -y portaudio19-dev libsndfile1-dev
      
      - name: Run tests
        run: |
          cd simulation/test_scenarios
          python test_framework.py --simulators ${{ matrix.simulator }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.simulator }}
          path: simulation/test_scenarios/test_results_*.json
```

### Local Development Workflow

```bash
# Pre-commit testing
./scripts/pre-commit-test.sh

# Watch mode for development
./scripts/watch-test.sh

# Performance regression testing
./scripts/performance-test.sh
```

## Custom Test Development

### Adding New Test Cases

1. **Extend Simulator Class**:
```python
class MySimulator(SimulatorBase):
    def run_test(self, test_case: TestCase) -> TestReport:
        if test_case.test_function == "my_custom_test":
            return self._my_custom_test(test_case, time.time())
```

2. **Define Test Case**:
```python
TestCase(
    name="My Custom Test",
    description="Description of what this test validates",
    test_function="my_custom_test",
    severity=TestSeverity.HIGH,
    timeout=30
)
```

3. **Implement Test Logic**:
```python
def _my_custom_test(self, test_case: TestCase, start_time: float) -> TestReport:
    # Test implementation
    success = perform_test_operations()
    
    return TestReport(
        test_name=test_case.name,
        result=TestResult.PASS if success else TestResult.FAIL,
        duration=time.time() - start_time,
        metrics={"custom_metric": value}
    )
```

### Test Data Management

Create test data sets for consistent testing:

```python
# test_data.py
AUDIO_TEST_FILES = [
    "test_audio/sine_wave_440hz.wav",
    "test_audio/sweep_20hz_20khz.wav",
    "test_audio/music_sample.mp3"
]

UI_TEST_SCENARIOS = [
    {"screen": "home", "actions": ["play", "pause", "stop"]},
    {"screen": "equalizer", "actions": ["preset_rock", "band_adjust"]},
    {"screen": "settings", "actions": ["volume_change", "brightness"]}
]
```

## Performance Benchmarking

### Baseline Performance Metrics

#### Wokwi Simulator
- Boot time: < 15 seconds
- Serial response: < 1 second
- Display init: < 3 seconds

#### LVGL Simulator
- Startup time: < 5 seconds
- Frame rate: 60 FPS ±5%
- Memory usage: < 50 MB
- Transition time: < 500ms

#### Audio Simulator
- Audio latency: < 50ms
- CPU usage: < 30% (single track)
- Memory growth: < 5MB/hour
- Equalizer response: < 10ms

#### Web Demo
- Page load: < 5 seconds
- First paint: < 2 seconds
- Audio start: < 1 second
- Interaction response: < 100ms

### Performance Regression Testing

```bash
# Run performance benchmarks
python test_framework.py --benchmark

# Compare with baseline
python benchmark_compare.py current_results.json baseline.json

# Generate performance report
python performance_report.py --trend --period 30days
```

## Troubleshooting

### Common Issues

1. **Simulator Setup Failures**:
   - Check dependencies installation
   - Verify build environments
   - Check file permissions

2. **Test Timeouts**:
   - Increase timeout values for slow systems
   - Check system resources
   - Verify simulator responsiveness

3. **Missing Dependencies**:
   - Install all required packages
   - Check version compatibility
   - Use virtual environments

4. **Permission Errors**:
   - Check audio device permissions
   - Verify file access rights
   - Run with appropriate privileges

### Debug Mode

```bash
# Enable debug logging
python test_framework.py --verbose

# Run single test with debugging
python -c "
from test_framework import TestFramework
framework = TestFramework()
result = framework.run_simulator_tests('wokwi')
print(result)
"

# Monitor system resources during tests
python test_framework.py --monitor-resources
```

### Log Analysis

Test logs are saved with timestamps and categories:

```
2024-01-15 14:30:15 - TestFramework - INFO - Starting test run for simulators: ['wokwi']
2024-01-15 14:30:15 - Simulator.Wokwi - INFO - Wokwi simulator setup completed
2024-01-15 14:30:20 - Simulator.Wokwi - INFO - Wokwi simulator started
2024-01-15 14:30:25 - TestFramework - INFO - Running test: ESP32 Boot Sequence
2024-01-15 14:30:37 - TestFramework - INFO - Test ESP32 Boot Sequence: PASS
```

## Integration with Main Project

### Build System Integration

```cmake
# Add testing target to CMakeLists.txt
add_custom_target(test_simulations
    COMMAND python ${CMAKE_SOURCE_DIR}/simulation/test_scenarios/test_framework.py
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Running simulation tests"
)
```

### PlatformIO Integration

```ini
# platformio.ini
[env:test]
test_framework = custom
test_ignore = test_native
extra_scripts = simulation/test_scenarios/platformio_test.py
```

### Make Integration

```makefile
# Makefile
.PHONY: test-simulations
test-simulations:
	cd simulation/test_scenarios && python test_framework.py

test-quick:
	cd simulation/test_scenarios && python test_framework.py --simulators lvgl

test-ci:
	cd simulation/test_scenarios && python test_framework.py --output ci_results.txt
```

## Future Enhancements

### Planned Features

1. **Visual Regression Testing**: Screenshot comparison for UI tests
2. **Load Testing**: Multi-user simulation for web demo
3. **Hardware-in-the-Loop**: Integration with real ESP32 boards
4. **Automated Performance Trending**: Long-term performance tracking
5. **Test Generation**: AI-assisted test case generation
6. **Mobile Testing**: Mobile browser simulation testing

### Extensibility

The framework is designed for easy extension:

- **New Simulators**: Inherit from `SimulatorBase`
- **Custom Metrics**: Add to `TestReport.metrics`
- **Test Orchestration**: Extend `TestFramework`
- **Report Formats**: Custom report generators
- **Integration**: Plugin system for CI/CD tools

## License

This test framework is part of the xtouch project and is licensed under GPL-3.0.