/**
 * @file hal.h
 * Hardware Abstraction Layer for LVGL PC Simulator
 */

#ifndef HAL_H
#define HAL_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdbool.h>
#include <stdint.h>

/**
 * Initialize the Hardware Abstraction Layer
 * @return true if successful, false otherwise
 */
bool hal_init(void);

/**
 * Main HAL loop - process events and update display
 * @return true to continue running, false to exit
 */
bool hal_loop(void);

/**
 * Cleanup HAL resources
 */
void hal_deinit(void);

/**
 * Get display horizontal resolution
 * @return horizontal resolution in pixels
 */
int hal_get_hor_res(void);

/**
 * Get display vertical resolution
 * @return vertical resolution in pixels
 */
int hal_get_ver_res(void);

/**
 * Check if window is still open
 * @return true if window is open, false if closed
 */
bool hal_is_window_open(void);

#ifdef __cplusplus
}
#endif

#endif /* HAL_H */