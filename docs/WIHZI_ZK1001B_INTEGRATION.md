# WIHZI ZK-1001B Amplifier Integration Guide

## Overview
Integration guide for connecting the ESP32-2432S028R based boombox controller with the WIHZI ZK-1001B Class D amplifier board.

## Hardware Specifications

### WIHZI ZK-1001B Amplifier
- **Amplifier IC**: TPA3116D2 (Texas Instruments)
- **Power Output**: 100W @ 4Ω mono, 50W @ 8Ω mono  
- **Input Voltage**: 12-24V DC (recommended 19-24V)
- **Current Draw**: 5-6A peak
- **Audio Inputs**: 
  - Bluetooth module (optional)
  - 3.5mm AUX analog input
  - Digital input options
- **Frequency Response**: 20Hz - 20kHz
- **THD+N**: <0.04% @ 1W
- **SNR**: >100dB

### ESP32-2432S028R Display Board
- **MCU**: ESP32-WROOM-32
- **Display**: 2.8" ILI9341 320x240 TFT
- **Touch**: XPT2046 resistive touch controller
- **I/O Voltage**: 3.3V
- **Power**: 5V USB or 3.3V direct

## System Architecture

```
┌─────────────────┐    I2S Audio     ┌─────────────┐    Analog    ┌─────────────────┐
│                 ├─────────────────→│             ├─────────────→│                 │
│  ESP32-2432S028R│                  │  PCM5102A   │              │  WIHZI ZK-1001B │
│                 │                  │  I2S DAC    │              │  100W Amplifier │
│                 │←─────────────────┤             │              │                 │
└─────────────────┘    Control       └─────────────┘              └─────────────────┘
        │                                                                   │
        │ Volume/EQ Control                                                 │
        └───────────────────────────────────────────────────────────────────┘
                                    Speakers (4Ω/8Ω)
```

## Pin Connections

### ESP32 to PCM5102A DAC
```
ESP32-2432S028R    │  PCM5102A DAC
GPIO 25 (I2S_DOUT) │  DIN (Data Input)
GPIO 26 (I2S_LRC)  │  LCK (Left/Right Clock)
GPIO 27 (I2S_BCLK) │  BCK (Bit Clock)
3.3V               │  VCC
GND                │  GND
3.3V               │  SCK (System Clock - tie high for auto)
GND                │  FLT (Filter Select - tie low for slow)
3.3V               │  DEMP (De-emphasis - tie high for off)
3.3V               │  XSMT (Soft Mute - tie high for normal)
```

### PCM5102A to WIHZI ZK-1001B
```
PCM5102A DAC       │  WIHZI ZK-1001B
OUTL (Left)        │  AUX Input L
OUTR (Right)       │  AUX Input R  
AGND               │  AUX Ground
```

### Power Connections
```
Component          │  Power Source      │  Voltage │  Current
ESP32-2432S028R    │  USB 5V or 3.3V   │  3.3V    │  300mA
PCM5102A           │  ESP32 3.3V        │  3.3V    │  10mA
WIHZI ZK-1001B     │  External PSU      │  19-24V  │  5-6A peak
```

## Integration Steps

### 1. Power Supply Design
```
24V DC Input (Wall Adapter)
     │
     ├─→ WIHZI ZK-1001B (24V, 6A)
     │
     └─→ Buck Converter (24V → 5V, 1A)
             │
             └─→ ESP32-2432S028R (5V via USB)
```

**Recommended Components:**
- 24V 8A switching power supply
- LM2596 buck converter module (24V → 5V)
- 1000µF/35V electrolytic capacitors for power filtering
- 100nF ceramic bypass capacitors

### 2. Audio Signal Path

**High-Quality Audio Chain:**
1. **Digital Audio Processing** (ESP32)
   - 44.1kHz/16-bit I2S output
   - Real-time equalizer processing
   - Volume control in digital domain
   
2. **Digital-to-Analog Conversion** (PCM5102A)
   - I2S input, stereo analog output
   - 112dB dynamic range
   - Low distortion (<0.01% THD+N)
   
3. **Power Amplification** (WIHZI ZK-1001B)
   - Analog input, 100W power output
   - Class D efficiency (>85%)
   - Integrated protection circuits

### 3. Software Integration

#### Modified I2S Configuration
```cpp
// I2S configuration for PCM5102A DAC
i2s_config_t i2s_config = {
    .mode = I2S_MODE_MASTER | I2S_MODE_TX,
    .sample_rate = 44100,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll = true,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
};

i2s_pin_config_t pin_config = {
    .bck_io_num = 27,      // Bit Clock
    .ws_io_num = 26,       // Word Select (LR Clock)
    .data_out_num = 25,    // Data Output
    .data_in_num = -1      // Data Input (not used)
};
```

#### Volume Control Strategy
Since the WIHZI ZK-1001B doesn't have digital volume control, implement volume in the ESP32:

```cpp
// Digital volume control (0-100%)
void applyVolumeControl(int16_t* audio_buffer, size_t samples, uint8_t volume) {
    float volume_factor = (float)volume / 100.0f;
    for (size_t i = 0; i < samples; i++) {
        audio_buffer[i] = (int16_t)(audio_buffer[i] * volume_factor);
    }
}
```

## Physical Integration Considerations

### 1. PCB Layout Guidelines
```
┌─────────────────────────────────────────┐
│  ESP32-2432S028R Display Module         │
├─────────────────────────────────────────┤
│  ┌─────────┐     ┌─────────┐           │
│  │PCM5102A │     │ Power   │           │
│  │   DAC   │     │ Supply  │           │
│  └─────────┘     └─────────┘           │
├─────────────────────────────────────────┤
│           WIHZI ZK-1001B                │
│         100W Amplifier Board            │
└─────────────────────────────────────────┘
```

### 2. Thermal Management
- **Heat Generation**: ZK-1001B generates significant heat at high power
- **Cooling Solution**: 
  - Aluminum heatsink (minimum 50mm x 50mm x 15mm)
  - Optional cooling fan for continuous high-power operation
  - Thermal interface material between TPA3116D2 and heatsink

### 3. EMI Considerations
- **Shielded Audio Cables**: Use twisted pair or coaxial for analog audio
- **Ground Plane**: Separate digital and analog ground planes
- **Ferrite Beads**: On power and audio signal lines
- **Bypass Capacitors**: 100nF ceramic near all power pins

## Software Modifications to xtouch Codebase

### 1. Update platformio.ini
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
build_flags = 
    -D__XTOUCH_SCREEN_28__
    -D__XTOUCH_AUDIO_ENABLED__
    -D__XTOUCH_AMPLIFIER_ZK1001B__  # Add this flag
lib_deps = 
    # ... existing dependencies ...
    earlephilhower/ESP8266Audio
```

### 2. Audio Manager Updates
```cpp
// src/xtouch/audio/audio_manager.h
class AudioManager {
private:
    AudioOutputI2S* audioOutput;
    AudioFileSourceSD* audioSource;
    AudioGeneratorMP3* audioGenerator;
    
public:
    bool initializeZK1001B();
    void setMasterVolume(uint8_t volume);  // 0-100%
    void applyEqualizer(int16_t* buffer, size_t samples);
};
```

### 3. Power Management Integration
```cpp
// Power sequencing for proper startup
void powerUpSequence() {
    // 1. Initialize ESP32 and display
    xtouch_screen_setup();
    
    // 2. Initialize I2S DAC
    audioManager.initializeI2S();
    
    // 3. Small delay for DAC settling
    delay(100);
    
    // 4. WIHZI amplifier auto-starts when audio signal present
    audioManager.startAudio();
}
```

## Performance Characteristics

### Power Consumption
- **Idle Mode**: ESP32 (300mA) + Display (100mA) = 2W total
- **Audio Playback**: + WIHZI amplifier = 5-120W depending on volume
- **Maximum Power**: 24V × 6A = 144W total system

### Audio Quality
- **Frequency Response**: 20Hz - 20kHz (±1dB)
- **Signal-to-Noise Ratio**: >95dB (system-wide)
- **Total Harmonic Distortion**: <0.1% @ moderate levels
- **Channel Separation**: >60dB

## Testing and Validation

### 1. Audio Quality Tests
```cpp
// Audio test tone generator
void generateTestTone(float frequency, uint8_t amplitude) {
    const int samples = 1024;
    int16_t test_buffer[samples];
    
    for (int i = 0; i < samples; i++) {
        float t = (float)i / 44100.0f;
        test_buffer[i] = (int16_t)(amplitude * sin(2 * PI * frequency * t));
    }
    
    i2s_write(I2S_NUM_0, test_buffer, samples * 2, &bytes_written, portMAX_DELAY);
}
```

### 2. Performance Monitoring
```cpp
// Monitor system performance
void monitorAudioPerformance() {
    float cpu_usage = getCPUUsage();
    size_t free_heap = esp_get_free_heap_size();
    float amplifier_temp = getAmplifierTemperature();
    
    if (cpu_usage > 80.0f) {
        // Reduce audio quality to maintain real-time performance
    }
}
```

## Troubleshooting Guide

### Common Issues

1. **No Audio Output**
   - Check I2S pin connections
   - Verify PCM5102A power supply (3.3V)
   - Confirm audio cable connections to ZK-1001B

2. **Distorted Audio**
   - Reduce digital volume level
   - Check for clipping in equalizer processing
   - Verify power supply voltage stability

3. **Noise/Interference**
   - Add ferrite beads to power and audio lines
   - Improve ground plane design
   - Separate digital and analog circuits

4. **Thermal Issues**
   - Install adequate heatsink on TPA3116D2
   - Ensure proper airflow
   - Monitor ambient temperature

## Cost Estimation

| Component | Cost (USD) | Notes |
|-----------|------------|--------|
| WIHZI ZK-1001B | $25-35 | Class D amplifier board |
| PCM5102A Module | $5-8 | I2S DAC breakout |
| 24V Power Supply | $15-25 | 8A switching PSU |
| Heatsink | $5-10 | For thermal management |
| Connectors/Cables | $10-15 | Audio and power connections |
| **Total Additional** | **$60-93** | Beyond ESP32 display board |

## Conclusion

The WIHZI ZK-1001B integration provides a high-quality, powerful amplifier solution for the ESP32-based boombox project. The Class D design offers excellent efficiency and sound quality, while the modular approach allows for easy assembly and maintenance.

Key benefits:
- Professional audio quality with 100W power output
- Efficient Class D amplification (>85% efficiency)
- Integrated protection circuits
- Cost-effective solution
- Excellent upgrade path for future enhancements