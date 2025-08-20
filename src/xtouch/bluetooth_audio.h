/**
 * @file bluetooth_audio.h  
 * @brief Bluetooth A2DP audio receiver for ESP32 boombox
 * 
 * Handles phone pairing, audio streaming, and playback controls
 * Compatible with WIHZI ZK-1001B amplifier via I2S
 */

#pragma once

#include <Arduino.h>
#include <BluetoothA2DPSink.h>
#include <driver/i2s.h>
#include <ArduinoJson.h>
#include "types.h"

// Bluetooth audio configuration
#define BT_DEVICE_NAME "XTouch Boombox"
#define BT_PIN "0000"  // Default pairing PIN
#define I2S_PORT I2S_NUM_0
#define I2S_SAMPLE_RATE 44100
#define I2S_BITS_PER_SAMPLE I2S_BITS_PER_SAMPLE_16BIT

class BluetoothAudioManager {
private:
    BluetoothA2DPSink a2dp_sink;
    bool is_connected = false;
    bool is_playing = false;
    String connected_device = "";
    int volume_level = 70;
    
    // I2S configuration for PCM5102A DAC
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = I2S_SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .use_apll = false,
        .tx_desc_auto_clear = true
    };
    
public:
    /**
     * Initialize Bluetooth audio system
     */
    bool init() {
        ConsoleInfo.println(F("[BLUETOOTH] Initializing A2DP audio sink..."));
        
        // Set device name
        a2dp_sink.set_device_name(BT_DEVICE_NAME);
        
        // Set PIN for secure pairing
        a2dp_sink.set_pin_code(BT_PIN);
        
        // Configure I2S for PCM5102A DAC
        i2s_pin_config_t pin_config = {
            .bck_io_num = 26,   // Bit clock
            .ws_io_num = 25,    // Word select (LRCLK)  
            .data_out_num = 22, // Data out to PCM5102A
            .data_in_num = I2S_PIN_NO_CHANGE
        };
        
        // Set up callbacks
        a2dp_sink.set_stream_reader(audio_data_callback, false);
        a2dp_sink.set_on_connection_state_changed(connection_state_callback);
        a2dp_sink.set_on_audio_state_changed(audio_state_callback);
        
        // Start Bluetooth A2DP sink
        if (a2dp_sink.start("XTouch Boombox")) {
            ConsoleInfo.println(F("[BLUETOOTH] A2DP sink started successfully"));
            ConsoleInfo.printf("[BLUETOOTH] Device discoverable as '%s'\n", BT_DEVICE_NAME);
            ConsoleInfo.printf("[BLUETOOTH] Pairing PIN: %s\n", BT_PIN);
            return true;
        } else {
            ConsoleError.println(F("[BLUETOOTH] Failed to start A2DP sink"));
            return false;
        }
    }
    
    /**
     * Audio data callback - receives stereo PCM data from phone
     */
    static void audio_data_callback(const uint8_t *data, uint32_t length) {
        // Write audio data to I2S for PCM5102A DAC
        size_t bytes_written;
        i2s_write(I2S_PORT, data, length, &bytes_written, portMAX_DELAY);
        
        // Update FFT analyzer with audio data
        update_spectrum_analyzer(data, length);
    }
    
    /**
     * Connection state callback
     */
    static void connection_state_callback(esp_a2d_connection_state_t state, void *ptr) {
        BluetoothAudioManager* manager = (BluetoothAudioManager*)ptr;
        
        switch (state) {
            case ESP_A2D_CONNECTION_STATE_CONNECTED:
                ConsoleInfo.println(F("[BLUETOOTH] Phone connected"));
                manager->is_connected = true;
                xtouch_mqtt_sendMsg(XTOUCH_ON_BT_CONNECTED, 1);
                break;
                
            case ESP_A2D_CONNECTION_STATE_DISCONNECTED:
                ConsoleInfo.println(F("[BLUETOOTH] Phone disconnected"));
                manager->is_connected = false;
                manager->is_playing = false;
                xtouch_mqtt_sendMsg(XTOUCH_ON_BT_CONNECTED, 0);
                break;
                
            default:
                break;
        }
        
        // Update UI status
        update_bluetooth_status(manager->is_connected);
    }
    
    /**
     * Audio state callback
     */
    static void audio_state_callback(esp_a2d_audio_state_t state, void *ptr) {
        BluetoothAudioManager* manager = (BluetoothAudioManager*)ptr;
        
        switch (state) {
            case ESP_A2D_AUDIO_STATE_STARTED:
                ConsoleInfo.println(F("[BLUETOOTH] Audio playback started"));
                manager->is_playing = true;
                xtouch_mqtt_sendMsg(XTOUCH_ON_BT_PLAYING, 1);
                break;
                
            case ESP_A2D_AUDIO_STATE_STOPPED:
                ConsoleInfo.println(F("[BLUETOOTH] Audio playback stopped"));
                manager->is_playing = false;
                xtouch_mqtt_sendMsg(XTOUCH_ON_BT_PLAYING, 0);
                break;
                
            default:
                break;
        }
        
        // Update UI playback status
        update_playback_status(manager->is_playing);
    }
    
    /**
     * Get connection status
     */
    bool isConnected() { return is_connected; }
    bool isPlaying() { return is_playing; }
    String getConnectedDevice() { return connected_device; }
    
    /**
     * Control functions
     */
    void setVolume(int volume) {
        volume_level = constrain(volume, 0, 100);
        a2dp_sink.set_volume(volume_level);
        ConsoleInfo.printf("[BLUETOOTH] Volume set to %d%%\n", volume_level);
    }
    
    int getVolume() { return volume_level; }
    
    /**
     * Make device discoverable for pairing
     */
    void startPairing() {
        ConsoleInfo.println(F("[BLUETOOTH] Starting pairing mode..."));
        ConsoleInfo.printf("[BLUETOOTH] Look for '%s' in your phone's Bluetooth settings\n", BT_DEVICE_NAME);
        ConsoleInfo.printf("[BLUETOOTH] Use PIN: %s if prompted\n", BT_PIN);
        
        // Reset any existing connections
        a2dp_sink.disconnect();
        delay(1000);
        
        // Make discoverable
        esp_bt_gap_set_scan_mode(ESP_BT_CONNECTABLE, ESP_BT_GENERAL_DISCOVERABLE);
        
        // Update UI to show pairing mode
        show_pairing_screen();
    }
    
    /**
     * Disconnect current device
     */
    void disconnect() {
        if (is_connected) {
            ConsoleInfo.println(F("[BLUETOOTH] Disconnecting device..."));
            a2dp_sink.disconnect();
        }
    }
    
    /**
     * Get device info for display
     */
    DynamicJsonDocument getDeviceInfo() {
        DynamicJsonDocument info(200);
        info["connected"] = is_connected;
        info["playing"] = is_playing;
        info["device"] = connected_device;
        info["volume"] = volume_level;
        info["name"] = BT_DEVICE_NAME;
        info["pin"] = BT_PIN;
        return info;
    }
};

// Global instance
extern BluetoothAudioManager bluetooth_audio;

// Helper functions for UI updates
void update_bluetooth_status(bool connected);
void update_playback_status(bool playing);
void update_spectrum_analyzer(const uint8_t* data, uint32_t length);
void show_pairing_screen();