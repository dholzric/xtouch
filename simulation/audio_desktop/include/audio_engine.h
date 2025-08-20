/**
 * @file audio_engine.h
 * Audio Engine for Desktop Simulation
 */

#ifndef AUDIO_ENGINE_H
#define AUDIO_ENGINE_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include <portaudio.h>

// Audio configuration
#define SAMPLE_RATE 44100
#define BUFFER_SIZE 512
#define CHANNELS 2

// Audio formats
typedef enum {
    AUDIO_FORMAT_WAV,
    AUDIO_FORMAT_MP3,
    AUDIO_FORMAT_FLAC,
    AUDIO_FORMAT_UNKNOWN
} audio_format_t;

// Playback state
typedef enum {
    PLAYBACK_STOPPED,
    PLAYBACK_PLAYING,
    PLAYBACK_PAUSED
} playback_state_t;

// Audio file info
typedef struct {
    char filename[256];
    audio_format_t format;
    uint32_t sample_rate;
    uint32_t channels;
    uint32_t duration_ms;
    uint32_t bitrate;
    char title[128];
    char artist[128];
    char album[128];
} audio_file_info_t;

// Audio engine statistics
typedef struct {
    uint32_t files_loaded;
    uint32_t total_duration_ms;
    uint32_t playback_time_ms;
    uint32_t buffer_underruns;
    uint32_t buffer_overruns;
    float cpu_usage_percent;
    float memory_usage_mb;
} audio_stats_t;

// Callback function types
typedef void (*playback_position_callback_t)(uint32_t position_ms, uint32_t total_ms);
typedef void (*file_change_callback_t)(const audio_file_info_t* file_info);
typedef void (*error_callback_t)(const char* error_message);

/**
 * Initialize the audio engine
 * @return true if successful, false otherwise
 */
bool audio_engine_init(void);

/**
 * Shutdown the audio engine
 */
void audio_engine_shutdown(void);

/**
 * Load an audio file
 * @param filepath Path to the audio file
 * @return true if successful, false otherwise
 */
bool audio_engine_load_file(const char* filepath);

/**
 * Start playback
 * @return true if successful, false otherwise
 */
bool audio_engine_play(void);

/**
 * Pause playback
 * @return true if successful, false otherwise
 */
bool audio_engine_pause(void);

/**
 * Stop playback
 * @return true if successful, false otherwise
 */
bool audio_engine_stop(void);

/**
 * Seek to a specific position
 * @param position_ms Position in milliseconds
 * @return true if successful, false otherwise
 */
bool audio_engine_seek(uint32_t position_ms);

/**
 * Set volume (0.0 to 1.0)
 * @param volume Volume level
 */
void audio_engine_set_volume(float volume);

/**
 * Get current volume
 * @return Current volume level (0.0 to 1.0)
 */
float audio_engine_get_volume(void);

/**
 * Get current playback state
 * @return Current playback state
 */
playback_state_t audio_engine_get_state(void);

/**
 * Get current playback position
 * @return Position in milliseconds
 */
uint32_t audio_engine_get_position(void);

/**
 * Get current file information
 * @return Pointer to file info structure (NULL if no file loaded)
 */
const audio_file_info_t* audio_engine_get_file_info(void);

/**
 * Get audio engine statistics
 * @return Pointer to statistics structure
 */
const audio_stats_t* audio_engine_get_stats(void);

/**
 * Set playback position callback
 * @param callback Callback function
 */
void audio_engine_set_position_callback(playback_position_callback_t callback);

/**
 * Set file change callback
 * @param callback Callback function
 */
void audio_engine_set_file_callback(file_change_callback_t callback);

/**
 * Set error callback
 * @param callback Callback function
 */
void audio_engine_set_error_callback(error_callback_t callback);

/**
 * Process audio buffer (for real-time effects)
 * @param input Input buffer
 * @param output Output buffer
 * @param frame_count Number of frames to process
 */
void audio_engine_process_buffer(const float* input, float* output, uint32_t frame_count);

/**
 * Enable/disable equalizer
 * @param enabled True to enable, false to disable
 */
void audio_engine_set_equalizer_enabled(bool enabled);

/**
 * Check if equalizer is enabled
 * @return True if enabled, false otherwise
 */
bool audio_engine_is_equalizer_enabled(void);

/**
 * Simulate I2S output for ESP32 compatibility
 * @param data Audio data
 * @param size Data size in bytes
 * @return Number of bytes written
 */
int audio_engine_i2s_write(const void* data, size_t size);

/**
 * Update audio engine (call regularly from main loop)
 */
void audio_engine_update(void);

#ifdef __cplusplus
}
#endif

#endif /* AUDIO_ENGINE_H */