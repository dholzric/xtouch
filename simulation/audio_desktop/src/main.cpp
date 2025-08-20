/**
 * @file main.cpp
 * Main entry point for xtouch Audio Desktop Simulator
 */

#include <iostream>
#include <chrono>
#include <thread>
#include <signal.h>
#include <string>
#include <vector>
#include <cstring>

#include "audio_engine.h"
#include "equalizer.h"
#include "file_manager.h"
#include "performance_monitor.h"
#include "test_runner.h"

// Global state
static bool running = true;
static bool interactive_mode = true;

// Signal handler
void signal_handler(int signal) {
    std::cout << "\nReceived signal " << signal << ", shutting down..." << std::endl;
    running = false;
}

// Print usage information
void print_usage(const char* program_name) {
    std::cout << "xtouch Audio Desktop Simulator" << std::endl;
    std::cout << "Usage: " << program_name << " [options] [audio_file]" << std::endl;
    std::cout << std::endl;
    std::cout << "Options:" << std::endl;
    std::cout << "  -h, --help          Show this help message" << std::endl;
    std::cout << "  -t, --test          Run automated tests" << std::endl;
    std::cout << "  -b, --benchmark     Run performance benchmarks" << std::endl;
    std::cout << "  -i, --interactive   Interactive mode (default)" << std::endl;
    std::cout << "  -q, --quiet         Quiet mode (minimal output)" << std::endl;
    std::cout << "  --eq-preset NAME    Apply equalizer preset" << std::endl;
    std::cout << "  --volume LEVEL      Set initial volume (0.0-1.0)" << std::endl;
    std::cout << std::endl;
    std::cout << "Examples:" << std::endl;
    std::cout << "  " << program_name << " test_audio/sample.wav" << std::endl;
    std::cout << "  " << program_name << " --test" << std::endl;
    std::cout << "  " << program_name << " --eq-preset rock sample.wav" << std::endl;
}

// Interactive command processor
void process_interactive_commands() {
    std::cout << "\nInteractive Audio Simulator" << std::endl;
    std::cout << "Commands: play, pause, stop, load, volume, eq, info, stats, quit" << std::endl;
    std::cout << "Type 'help' for detailed command information" << std::endl;
    
    std::string input;
    while (running && std::getline(std::cin, input)) {
        if (input.empty()) continue;
        
        // Parse command
        std::vector<std::string> tokens;
        std::string token;
        for (char c : input) {
            if (c == ' ') {
                if (!token.empty()) {
                    tokens.push_back(token);
                    token.clear();
                }
            } else {
                token += c;
            }
        }
        if (!token.empty()) {
            tokens.push_back(token);
        }
        
        if (tokens.empty()) continue;
        
        std::string command = tokens[0];
        
        if (command == "quit" || command == "exit" || command == "q") {
            running = false;
            break;
        }
        else if (command == "help" || command == "h") {
            std::cout << "Available commands:" << std::endl;
            std::cout << "  play              - Start playback" << std::endl;
            std::cout << "  pause             - Pause playback" << std::endl;
            std::cout << "  stop              - Stop playback" << std::endl;
            std::cout << "  load <file>       - Load audio file" << std::endl;
            std::cout << "  volume <0.0-1.0>  - Set volume" << std::endl;
            std::cout << "  seek <time_ms>    - Seek to position" << std::endl;
            std::cout << "  eq <band> <gain>  - Set equalizer band gain" << std::endl;
            std::cout << "  eq preset <name>  - Apply equalizer preset" << std::endl;
            std::cout << "  eq reset          - Reset equalizer" << std::endl;
            std::cout << "  info              - Show current file info" << std::endl;
            std::cout << "  stats             - Show performance stats" << std::endl;
            std::cout << "  list              - List available files" << std::endl;
            std::cout << "  test              - Run quick tests" << std::endl;
        }
        else if (command == "play") {
            if (audio_engine_play()) {
                std::cout << "Playback started" << std::endl;
            } else {
                std::cout << "Failed to start playback" << std::endl;
            }
        }
        else if (command == "pause") {
            if (audio_engine_pause()) {
                std::cout << "Playback paused" << std::endl;
            } else {
                std::cout << "Failed to pause playback" << std::endl;
            }
        }
        else if (command == "stop") {
            if (audio_engine_stop()) {
                std::cout << "Playback stopped" << std::endl;
            } else {
                std::cout << "Failed to stop playback" << std::endl;
            }
        }
        else if (command == "load" && tokens.size() > 1) {
            if (audio_engine_load_file(tokens[1].c_str())) {
                std::cout << "Loaded: " << tokens[1] << std::endl;
            } else {
                std::cout << "Failed to load: " << tokens[1] << std::endl;
            }
        }
        else if (command == "volume" && tokens.size() > 1) {
            float volume = std::stof(tokens[1]);
            audio_engine_set_volume(volume);
            std::cout << "Volume set to: " << volume << std::endl;
        }
        else if (command == "seek" && tokens.size() > 1) {
            uint32_t position = std::stoul(tokens[1]);
            if (audio_engine_seek(position)) {
                std::cout << "Seeked to: " << position << "ms" << std::endl;
            } else {
                std::cout << "Failed to seek" << std::endl;
            }
        }
        else if (command == "eq") {
            if (tokens.size() >= 3 && tokens[1] == "preset") {
                eq_preset_t preset = EQ_PRESET_FLAT;
                std::string preset_name = tokens[2];
                
                if (preset_name == "rock") preset = EQ_PRESET_ROCK;
                else if (preset_name == "pop") preset = EQ_PRESET_POP;
                else if (preset_name == "jazz") preset = EQ_PRESET_JAZZ;
                else if (preset_name == "classical") preset = EQ_PRESET_CLASSICAL;
                else if (preset_name == "vocal") preset = EQ_PRESET_VOCAL;
                else if (preset_name == "bass") preset = EQ_PRESET_BASS_BOOST;
                else if (preset_name == "treble") preset = EQ_PRESET_TREBLE_BOOST;
                else if (preset_name == "flat") preset = EQ_PRESET_FLAT;
                
                if (equalizer_apply_preset(preset)) {
                    std::cout << "Applied preset: " << preset_name << std::endl;
                } else {
                    std::cout << "Failed to apply preset: " << preset_name << std::endl;
                }
            }
            else if (tokens.size() >= 2 && tokens[1] == "reset") {
                equalizer_reset();
                std::cout << "Equalizer reset to flat" << std::endl;
            }
            else if (tokens.size() >= 3) {
                uint8_t band = std::stoi(tokens[1]);
                float gain = std::stof(tokens[2]);
                if (equalizer_set_band_gain(band, gain)) {
                    std::cout << "Set band " << band << " to " << gain << " dB" << std::endl;
                } else {
                    std::cout << "Failed to set equalizer band" << std::endl;
                }
            }
        }
        else if (command == "info") {
            const audio_file_info_t* info = audio_engine_get_file_info();
            if (info) {
                std::cout << "File: " << info->filename << std::endl;
                std::cout << "Format: " << (info->format == AUDIO_FORMAT_WAV ? "WAV" : "Unknown") << std::endl;
                std::cout << "Sample Rate: " << info->sample_rate << " Hz" << std::endl;
                std::cout << "Channels: " << info->channels << std::endl;
                std::cout << "Duration: " << info->duration_ms << " ms" << std::endl;
                std::cout << "Position: " << audio_engine_get_position() << " ms" << std::endl;
                std::cout << "State: ";
                switch (audio_engine_get_state()) {
                    case PLAYBACK_STOPPED: std::cout << "Stopped"; break;
                    case PLAYBACK_PLAYING: std::cout << "Playing"; break;
                    case PLAYBACK_PAUSED: std::cout << "Paused"; break;
                }
                std::cout << std::endl;
            } else {
                std::cout << "No file loaded" << std::endl;
            }
        }
        else if (command == "stats") {
            const audio_stats_t* stats = audio_engine_get_stats();
            if (stats) {
                std::cout << "Audio Engine Statistics:" << std::endl;
                std::cout << "  Files loaded: " << stats->files_loaded << std::endl;
                std::cout << "  Total duration: " << stats->total_duration_ms << " ms" << std::endl;
                std::cout << "  Playback time: " << stats->playback_time_ms << " ms" << std::endl;
                std::cout << "  Buffer underruns: " << stats->buffer_underruns << std::endl;
                std::cout << "  Buffer overruns: " << stats->buffer_overruns << std::endl;
                std::cout << "  CPU usage: " << stats->cpu_usage_percent << "%" << std::endl;
                std::cout << "  Memory usage: " << stats->memory_usage_mb << " MB" << std::endl;
            }
            
            const eq_stats_t* eq_stats = equalizer_get_stats();
            if (eq_stats) {
                std::cout << "Equalizer Statistics:" << std::endl;
                std::cout << "  Samples processed: " << eq_stats->samples_processed << std::endl;
                std::cout << "  Total gain: " << eq_stats->total_gain << " dB" << std::endl;
                std::cout << "  CPU usage: " << eq_stats->cpu_usage_percent << "%" << std::endl;
            }
        }
        else if (command == "list") {
            std::cout << "Available test files:" << std::endl;
            // This would integrate with file_manager to list available files
            std::cout << "  test_audio/sample.wav" << std::endl;
            std::cout << "  test_audio/music.wav" << std::endl;
        }
        else if (command == "test") {
            std::cout << "Running quick tests..." << std::endl;
            test_runner_run_quick_tests();
        }
        else {
            std::cout << "Unknown command: " << command << std::endl;
            std::cout << "Type 'help' for available commands" << std::endl;
        }
        
        std::cout << "> ";
    }
}

// Status update callback
void on_playback_position(uint32_t position_ms, uint32_t total_ms) {
    if (!interactive_mode) {
        static uint32_t last_update = 0;
        if (position_ms - last_update > 1000) { // Update every second
            std::cout << "\rPosition: " << position_ms / 1000 << "s / " 
                      << total_ms / 1000 << "s" << std::flush;
            last_update = position_ms;
        }
    }
}

// Error callback
void on_error(const char* error_message) {
    std::cerr << "Audio Error: " << error_message << std::endl;
}

int main(int argc, char* argv[]) {
    std::cout << "xtouch Audio Desktop Simulator" << std::endl;
    std::cout << "==============================" << std::endl;
    
    // Parse command line arguments
    std::string audio_file;
    bool run_tests = false;
    bool run_benchmark = false;
    bool quiet_mode = false;
    eq_preset_t initial_preset = EQ_PRESET_FLAT;
    float initial_volume = 0.7f;
    
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        
        if (arg == "-h" || arg == "--help") {
            print_usage(argv[0]);
            return 0;
        }
        else if (arg == "-t" || arg == "--test") {
            run_tests = true;
            interactive_mode = false;
        }
        else if (arg == "-b" || arg == "--benchmark") {
            run_benchmark = true;
            interactive_mode = false;
        }
        else if (arg == "-i" || arg == "--interactive") {
            interactive_mode = true;
        }
        else if (arg == "-q" || arg == "--quiet") {
            quiet_mode = true;
        }
        else if (arg == "--eq-preset" && i + 1 < argc) {
            std::string preset_name = argv[++i];
            if (preset_name == "rock") initial_preset = EQ_PRESET_ROCK;
            else if (preset_name == "pop") initial_preset = EQ_PRESET_POP;
            else if (preset_name == "jazz") initial_preset = EQ_PRESET_JAZZ;
            // Add more presets as needed
        }
        else if (arg == "--volume" && i + 1 < argc) {
            initial_volume = std::stof(argv[++i]);
        }
        else if (arg[0] != '-') {
            audio_file = arg;
        }
    }
    
    // Set up signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Initialize performance monitoring
    if (!performance_monitor_init()) {
        std::cerr << "Failed to initialize performance monitor" << std::endl;
        return 1;
    }
    
    // Initialize equalizer
    if (!equalizer_init(SAMPLE_RATE)) {
        std::cerr << "Failed to initialize equalizer" << std::endl;
        return 1;
    }
    
    // Initialize audio engine
    if (!audio_engine_init()) {
        std::cerr << "Failed to initialize audio engine" << std::endl;
        return 1;
    }
    
    // Set callbacks
    audio_engine_set_position_callback(on_playback_position);
    audio_engine_set_error_callback(on_error);
    
    // Apply initial settings
    audio_engine_set_volume(initial_volume);
    equalizer_apply_preset(initial_preset);
    
    if (!quiet_mode) {
        std::cout << "Audio engine initialized" << std::endl;
        std::cout << "Sample rate: " << SAMPLE_RATE << " Hz" << std::endl;
        std::cout << "Buffer size: " << BUFFER_SIZE << " frames" << std::endl;
        std::cout << "Channels: " << CHANNELS << std::endl;
    }
    
    // Load initial audio file if provided
    if (!audio_file.empty()) {
        if (audio_engine_load_file(audio_file.c_str())) {
            if (!quiet_mode) {
                std::cout << "Loaded: " << audio_file << std::endl;
            }
        } else {
            std::cerr << "Failed to load: " << audio_file << std::endl;
        }
    }
    
    // Run tests if requested
    if (run_tests) {
        std::cout << "Running audio tests..." << std::endl;
        bool test_result = test_runner_run_all_tests();
        
        // Cleanup
        audio_engine_shutdown();
        equalizer_shutdown();
        performance_monitor_shutdown();
        
        return test_result ? 0 : 1;
    }
    
    // Run benchmark if requested
    if (run_benchmark) {
        std::cout << "Running performance benchmark..." << std::endl;
        test_runner_run_performance_benchmark();
        
        // Cleanup
        audio_engine_shutdown();
        equalizer_shutdown();
        performance_monitor_shutdown();
        
        return 0;
    }
    
    // Run interactive mode
    if (interactive_mode) {
        std::thread command_thread(process_interactive_commands);
        
        // Main loop
        while (running) {
            audio_engine_update();
            performance_monitor_update();
            
            // Small delay to prevent 100% CPU usage
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
        
        command_thread.join();
    } else {
        // Non-interactive mode - just play the file if loaded
        if (!audio_file.empty()) {
            audio_engine_play();
            
            // Wait for playback to complete
            while (running && audio_engine_get_state() == PLAYBACK_PLAYING) {
                audio_engine_update();
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        }
    }
    
    std::cout << "\nShutting down..." << std::endl;
    
    // Cleanup
    audio_engine_shutdown();
    equalizer_shutdown();
    performance_monitor_shutdown();
    
    std::cout << "Audio simulator terminated." << std::endl;
    return 0;
}