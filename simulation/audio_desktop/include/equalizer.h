/**
 * @file equalizer.h
 * Digital Equalizer for Audio Simulation
 */

#ifndef EQUALIZER_H
#define EQUALIZER_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>

// Number of equalizer bands
#define EQ_BANDS 10

// Equalizer band frequencies (Hz)
#define EQ_FREQ_32HZ    0
#define EQ_FREQ_64HZ    1
#define EQ_FREQ_125HZ   2
#define EQ_FREQ_250HZ   3
#define EQ_FREQ_500HZ   4
#define EQ_FREQ_1KHZ    5
#define EQ_FREQ_2KHZ    6
#define EQ_FREQ_4KHZ    7
#define EQ_FREQ_8KHZ    8
#define EQ_FREQ_16KHZ   9

// Equalizer presets
typedef enum {
    EQ_PRESET_FLAT,
    EQ_PRESET_ROCK,
    EQ_PRESET_POP,
    EQ_PRESET_JAZZ,
    EQ_PRESET_CLASSICAL,
    EQ_PRESET_VOCAL,
    EQ_PRESET_BASS_BOOST,
    EQ_PRESET_TREBLE_BOOST,
    EQ_PRESET_CUSTOM,
    EQ_PRESET_COUNT
} eq_preset_t;

// Equalizer configuration
typedef struct {
    float gains[EQ_BANDS];      // Gain for each band (-12.0 to +12.0 dB)
    float frequencies[EQ_BANDS]; // Center frequency for each band
    float q_factors[EQ_BANDS];   // Q factor for each band
    bool enabled;               // Master enable/disable
    eq_preset_t preset;         // Current preset
} eq_config_t;

// Equalizer statistics
typedef struct {
    float peak_levels[EQ_BANDS];    // Peak level for each band
    float rms_levels[EQ_BANDS];     // RMS level for each band
    float total_gain;               // Total gain applied
    uint32_t samples_processed;     // Total samples processed
    float cpu_usage_percent;        // CPU usage of equalizer
} eq_stats_t;

/**
 * Initialize the equalizer
 * @param sample_rate Audio sample rate
 * @return true if successful, false otherwise
 */
bool equalizer_init(uint32_t sample_rate);

/**
 * Shutdown the equalizer
 */
void equalizer_shutdown(void);

/**
 * Process audio through the equalizer
 * @param input Input audio buffer (interleaved stereo)
 * @param output Output audio buffer (interleaved stereo)
 * @param frame_count Number of audio frames
 */
void equalizer_process(const float* input, float* output, uint32_t frame_count);

/**
 * Set gain for a specific band
 * @param band Band index (0 to EQ_BANDS-1)
 * @param gain_db Gain in decibels (-12.0 to +12.0)
 * @return true if successful, false otherwise
 */
bool equalizer_set_band_gain(uint8_t band, float gain_db);

/**
 * Get gain for a specific band
 * @param band Band index (0 to EQ_BANDS-1)
 * @return Gain in decibels
 */
float equalizer_get_band_gain(uint8_t band);

/**
 * Set all band gains
 * @param gains Array of gains for all bands
 */
void equalizer_set_all_gains(const float gains[EQ_BANDS]);

/**
 * Get all band gains
 * @param gains Output array for gains
 */
void equalizer_get_all_gains(float gains[EQ_BANDS]);

/**
 * Apply an equalizer preset
 * @param preset Preset to apply
 * @return true if successful, false otherwise
 */
bool equalizer_apply_preset(eq_preset_t preset);

/**
 * Get current preset
 * @return Current preset
 */
eq_preset_t equalizer_get_preset(void);

/**
 * Enable or disable the equalizer
 * @param enabled True to enable, false to disable
 */
void equalizer_set_enabled(bool enabled);

/**
 * Check if equalizer is enabled
 * @return True if enabled, false otherwise
 */
bool equalizer_is_enabled(void);

/**
 * Reset equalizer to flat response
 */
void equalizer_reset(void);

/**
 * Get equalizer configuration
 * @return Pointer to configuration structure
 */
const eq_config_t* equalizer_get_config(void);

/**
 * Set equalizer configuration
 * @param config Configuration to apply
 * @return true if successful, false otherwise
 */
bool equalizer_set_config(const eq_config_t* config);

/**
 * Get equalizer statistics
 * @return Pointer to statistics structure
 */
const eq_stats_t* equalizer_get_stats(void);

/**
 * Update equalizer statistics (call after processing)
 */
void equalizer_update_stats(void);

/**
 * Get frequency response at a given frequency
 * @param frequency Frequency in Hz
 * @return Magnitude response in dB
 */
float equalizer_get_frequency_response(float frequency);

/**
 * Analyze input spectrum for visualization
 * @param input Input audio buffer
 * @param frame_count Number of frames
 * @param spectrum Output spectrum (magnitude for each band)
 */
void equalizer_analyze_spectrum(const float* input, uint32_t frame_count, float spectrum[EQ_BANDS]);

/**
 * Save equalizer settings to file
 * @param filename File to save to
 * @return true if successful, false otherwise
 */
bool equalizer_save_settings(const char* filename);

/**
 * Load equalizer settings from file
 * @param filename File to load from
 * @return true if successful, false otherwise
 */
bool equalizer_load_settings(const char* filename);

/**
 * Get preset name
 * @param preset Preset enum value
 * @return Preset name string
 */
const char* equalizer_get_preset_name(eq_preset_t preset);

/**
 * Get band frequency
 * @param band Band index
 * @return Center frequency in Hz
 */
float equalizer_get_band_frequency(uint8_t band);

/**
 * Export frequency response to CSV
 * @param filename Output filename
 * @param freq_start Start frequency (Hz)
 * @param freq_end End frequency (Hz)
 * @param num_points Number of frequency points
 * @return true if successful, false otherwise
 */
bool equalizer_export_response(const char* filename, float freq_start, float freq_end, uint32_t num_points);

#ifdef __cplusplus
}
#endif

#endif /* EQUALIZER_H */