cmake_minimum_required(VERSION 3.16)
project(xtouch_lvgl_simulator)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Find required packages
find_package(PkgConfig REQUIRED)
pkg_check_modules(SDL2 REQUIRED sdl2)

# LVGL configuration
set(LV_CONF_PATH ${CMAKE_CURRENT_SOURCE_DIR}/lv_conf.h CACHE STRING "" FORCE)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../../src
    ${CMAKE_CURRENT_SOURCE_DIR}/../../resources
    ${SDL2_INCLUDE_DIRS}
)

# Add LVGL as subdirectory (you'll need to clone LVGL repo here)
add_subdirectory(lvgl)

# Source files
file(GLOB_RECURSE SOURCES 
    "src/*.c"
    "src/*.cpp"
    "../../src/ui/*.c"
    "../../src/ui/**/*.c"
)

# Exclude ESP32-specific files
list(FILTER SOURCES EXCLUDE REGEX ".*main\\.cpp$")
list(FILTER SOURCES EXCLUDE REGEX ".*devices/.*")
list(FILTER SOURCES EXCLUDE REGEX ".*xtouch/.*")

# Add executable
add_executable(${PROJECT_NAME} 
    ${SOURCES}
    src/main.cpp
    src/hal.cpp
    src/mouse_cursor_icon.c
)

# Link libraries
target_link_libraries(${PROJECT_NAME} 
    lvgl
    ${SDL2_LIBRARIES}
    pthread
    m
)

# Compiler flags
target_compile_options(${PROJECT_NAME} PRIVATE
    ${SDL2_CFLAGS_OTHER}
    -DLV_CONF_INCLUDE_SIMPLE
    -D__LVGL_PC_SIM__
)

# Copy assets to build directory
file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/../../readme-assets 
     DESTINATION ${CMAKE_BINARY_DIR})

# Install target
install(TARGETS ${PROJECT_NAME} DESTINATION bin)