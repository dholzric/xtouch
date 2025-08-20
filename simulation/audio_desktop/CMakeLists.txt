cmake_minimum_required(VERSION 3.16)
project(xtouch_audio_simulator)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Find required packages
find_package(PkgConfig REQUIRED)

# Find audio libraries
pkg_check_modules(PORTAUDIO portaudio-2.0)
pkg_check_modules(SNDFILE sndfile)
pkg_check_modules(FFTW3 fftw3f)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../src
    ${PORTAUDIO_INCLUDE_DIRS}
    ${SNDFILE_INCLUDE_DIRS}
    ${FFTW3_INCLUDE_DIRS}
)

# Source files
set(SOURCES
    src/main.cpp
    src/audio_engine.cpp
    src/equalizer.cpp
    src/file_manager.cpp
    src/dsp_processor.cpp
    src/performance_monitor.cpp
    src/i2s_simulator.cpp
    src/test_runner.cpp
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME}
    ${PORTAUDIO_LIBRARIES}
    ${SNDFILE_LIBRARIES}
    ${FFTW3_LIBRARIES}
    pthread
    m
)

# Compiler flags
target_compile_options(${PROJECT_NAME} PRIVATE
    ${PORTAUDIO_CFLAGS_OTHER}
    ${SNDFILE_CFLAGS_OTHER}
    ${FFTW3_CFLAGS_OTHER}
    -D__AUDIO_SIM__
    -DSAMPLE_RATE=44100
    -DBUFFER_SIZE=512
    -DCHANNELS=2
)

# Create test data directory
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/test_audio)

# Copy test audio files
file(GLOB TEST_AUDIO_FILES "${CMAKE_CURRENT_SOURCE_DIR}/test_data/*.wav")
if(TEST_AUDIO_FILES)
    file(COPY ${TEST_AUDIO_FILES} DESTINATION ${CMAKE_BINARY_DIR}/test_audio/)
endif()

# Enable testing
enable_testing()

# Add unit tests
add_executable(audio_tests
    tests/test_equalizer.cpp
    tests/test_dsp.cpp
    tests/test_file_manager.cpp
    src/equalizer.cpp
    src/dsp_processor.cpp
    src/file_manager.cpp
)

target_link_libraries(audio_tests
    ${SNDFILE_LIBRARIES}
    ${FFTW3_LIBRARIES}
    pthread
    m
)

add_test(NAME equalizer_tests COMMAND audio_tests equalizer)
add_test(NAME dsp_tests COMMAND audio_tests dsp)
add_test(NAME file_tests COMMAND audio_tests files)

# Install targets
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
install(DIRECTORY test_data/ DESTINATION share/xtouch_audio_sim/test_data)