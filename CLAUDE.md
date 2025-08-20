# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xtouch is an ESP32-based touch screen interface for BambuLab 3D printers (P1P, P1S, X1, X1S). It provides advanced printer control, monitoring, and status display through a 2.8" ESP32-2432S028R touch screen board.

## Build System

This project uses PlatformIO with custom build scripts:

- **Build command**: `pio run` or `platformio run`
- **Upload command**: `pio run --target upload`
- **Monitor command**: `pio run --target monitor`
- **Clean command**: `pio run --target clean`

### Build Configuration
- Target board: ESP32-2432S028R (esp32dev in platformio.ini)
- Framework: Arduino
- Monitor speed: 115200 baud
- Filesystem: LittleFS
- Partitions: min_spiffs.csv

### Build Scripts
- **scripts/pre-build.py**: Downloads error definitions before compilation
- **scripts/post-build.py**: Handles version incrementing, creates OTA packages, generates manifest files
- **scripts/version.py**: Injects firmware version into build flags

## Architecture

### Core Structure
```
src/
├── main.cpp              # Main entry point and setup/loop
├── ui/                   # LVGL-based user interface
│   ├── components/       # Reusable UI components
│   ├── screens/          # Individual screen implementations
│   └── fonts/           # Custom fonts
└── xtouch/              # Core functionality modules
    ├── bbl/             # BambuLab protocol implementation
    ├── sensors/         # Temperature and sensor handling
    └── *.h/*.c          # Core system modules
```

### Key Modules

**Core System (src/xtouch/)**:
- `config.h`: Configuration loading from SD card (xtouch.json)
- `mqtt.h`: MQTT communication with BambuLab printers
- `net.h`: WiFi networking and connectivity
- `settings.h`: Device settings management
- `firmware.h`: OTA update functionality
- `globals.h`: Global state management
- `filesystem.h`: SD card and file operations

**UI System (src/ui/)**:
- Built on LVGL 8.3.9 graphics library
- Component-based architecture with reusable UI elements
- Screen-based navigation (home, temperature, control, filament, settings)
- Touch screen calibration and input handling

**Hardware Support**:
- TFT_eSPI for display driver
- XPT2046_Touchscreen for touch input
- OneWire + DallasTemperature for DS18B20 chamber sensor
- PubSubClient for MQTT communication

### Configuration System

The device requires an `xtouch.json` file on the SD card root with:
```json
{
  "ssid": "wifi-network",
  "pwd": "wifi-password",
  "timeout": "3000",
  "coldboot": "5000",
  "mqtt": {
    "host": "printer-ip",
    "accessCode": "bambu-access-code",
    "serialNumber": "printer-serial",
    "printerModel": "P1P"
  }
}
```

### Startup Sequence (main.cpp:35-67)
1. Serial/debug initialization
2. EEPROM setup for persistent storage
3. Global state initialization
4. Screen hardware setup
5. Intro screen display
6. SD card initialization (blocking)
7. Coldboot check for factory reset
8. Settings loading from SD
9. Firmware update check (local)
10. Touch screen calibration
11. WiFi connection (blocking)
12. Online firmware update check
13. Event system setup
14. MQTT connection to printer

### Dependencies

Key libraries:
- LVGL 8.3.9 (graphics)
- TFT_eSPI (display driver)
- XPT2046_Touchscreen (touch input)
- PubSubClient (MQTT)
- ArduinoJson 6.21.5 (configuration parsing)
- OneWire + DallasTemperature (DS18B20 sensor)
- ESPAsyncWebServer (OTA updates)

## Browser Extension

The `xtouch28/` directory contains a Chrome extension for device provisioning:
- Generates configuration files for the device
- Provides a local-only configuration interface
- No cloud dependencies or token authentication required

## Development Notes

- The project supports multiple screen sizes (2.8" currently implemented)
- Conditional compilation using `__XTOUCH_SCREEN_28__` flag
- Version management through version.json (auto-incremented on build)
- OTA update system with manifest generation for web installer
- Debug output available through serial console (115200 baud)
- Chamber temperature sensor support (DS18B20) is optional
- Device settings stored in EEPROM for persistence across reboots