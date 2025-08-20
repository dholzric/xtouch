/**
 * @file hal.cpp
 * Hardware Abstraction Layer for LVGL PC Simulator
 */

#include "hal.h"
#include <iostream>
#include <SDL2/SDL.h>
#include "lvgl/lvgl.h"

// Display configuration
#define SDL_HOR_RES     240
#define SDL_VER_RES     320
#define SDL_ZOOM        2
#define SDL_WINDOW_TITLE "xtouch ESP32-2432S028R Simulator"

// Static variables
static SDL_Window *window;
static SDL_Renderer *renderer;
static SDL_Texture *texture;
static uint32_t *tft_fb;
static bool window_open = true;

// LVGL display buffer
static lv_disp_draw_buf_t disp_buf;
static lv_color_t buf_1[SDL_HOR_RES * SDL_VER_RES / 4];
static lv_color_t buf_2[SDL_HOR_RES * SDL_VER_RES / 4];

// LVGL input device
static lv_indev_t *indev_mouse;

// Forward declarations
static void sdl_display_flush(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p);
static void sdl_mouse_read(lv_indev_drv_t *indev_drv, lv_indev_data_t *data);
static void monitor_sdl_clean_up(void);
static void window_create(void);
static void window_update(void);

/**
 * Initialize the Hardware Abstraction Layer
 */
bool hal_init(void) {
    // Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        std::cerr << "SDL_Init failed: " << SDL_GetError() << std::endl;
        return false;
    }
    
    std::cout << "[HAL] SDL initialized" << std::endl;
    
    // Create window and renderer
    window_create();
    
    // Initialize LVGL display
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    
    disp_drv.hor_res = SDL_HOR_RES;
    disp_drv.ver_res = SDL_VER_RES;
    disp_drv.flush_cb = sdl_display_flush;
    
    lv_disp_draw_buf_init(&disp_buf, buf_1, buf_2, SDL_HOR_RES * SDL_VER_RES / 4);
    disp_drv.draw_buf = &disp_buf;
    
    lv_disp_t *disp = lv_disp_drv_register(&disp_drv);
    if (!disp) {
        std::cerr << "[HAL] Failed to register display driver" << std::endl;
        return false;
    }
    
    std::cout << "[HAL] Display driver registered (" << SDL_HOR_RES << "x" << SDL_VER_RES << ")" << std::endl;
    
    // Initialize LVGL input device (mouse)
    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = sdl_mouse_read;
    
    indev_mouse = lv_indev_drv_register(&indev_drv);
    if (!indev_mouse) {
        std::cerr << "[HAL] Failed to register input device" << std::endl;
        return false;
    }
    
    std::cout << "[HAL] Input device registered (mouse as touch)" << std::endl;
    
    // Set up mouse cursor (optional)
    LV_IMG_DECLARE(mouse_cursor_icon);
    lv_obj_t *cursor_obj = lv_img_create(lv_scr_act());
    lv_img_set_src(cursor_obj, &mouse_cursor_icon);
    lv_indev_set_cursor(indev_mouse, cursor_obj);
    
    std::cout << "[HAL] Initialization complete" << std::endl;
    return true;
}

/**
 * Main HAL loop - process SDL events
 */
bool hal_loop(void) {
    SDL_Event event;
    
    while (SDL_PollEvent(&event)) {
        switch (event.type) {
            case SDL_QUIT:
                std::cout << "[HAL] Window close requested" << std::endl;
                window_open = false;
                return false;
                
            case SDL_WINDOWEVENT:
                if (event.window.event == SDL_WINDOWEVENT_CLOSE) {
                    std::cout << "[HAL] Window closed" << std::endl;
                    window_open = false;
                    return false;
                }
                break;
                
            case SDL_KEYDOWN:
                if (event.key.keysym.sym == SDLK_ESCAPE) {
                    std::cout << "[HAL] Escape key pressed" << std::endl;
                    window_open = false;
                    return false;
                }
                // Add more keyboard shortcuts here
                if (event.key.keysym.sym == SDLK_r) {
                    std::cout << "[HAL] Reset requested (R key)" << std::endl;
                    // Could trigger a system reset simulation
                }
                break;
        }
    }
    
    window_update();
    return window_open;
}

/**
 * Cleanup HAL resources
 */
void hal_deinit(void) {
    std::cout << "[HAL] Cleaning up..." << std::endl;
    monitor_sdl_clean_up();
    SDL_Quit();
    std::cout << "[HAL] Cleanup complete" << std::endl;
}

/**
 * Create SDL window and renderer
 */
static void window_create(void) {
    int window_width = SDL_HOR_RES * SDL_ZOOM;
    int window_height = SDL_VER_RES * SDL_ZOOM;
    
    window = SDL_CreateWindow(
        SDL_WINDOW_TITLE,
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        window_width,
        window_height,
        SDL_WINDOW_SHOWN | SDL_WINDOW_RESIZABLE
    );
    
    if (!window) {
        std::cerr << "[HAL] Failed to create window: " << SDL_GetError() << std::endl;
        exit(1);
    }
    
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!renderer) {
        std::cerr << "[HAL] Failed to create renderer: " << SDL_GetError() << std::endl;
        exit(1);
    }
    
    texture = SDL_CreateTexture(
        renderer,
        SDL_PIXELFORMAT_ARGB8888,
        SDL_TEXTUREACCESS_STREAMING,
        SDL_HOR_RES,
        SDL_VER_RES
    );
    
    if (!texture) {
        std::cerr << "[HAL] Failed to create texture: " << SDL_GetError() << std::endl;
        exit(1);
    }
    
    // Allocate framebuffer
    tft_fb = (uint32_t*)malloc(SDL_HOR_RES * SDL_VER_RES * sizeof(uint32_t));
    if (!tft_fb) {
        std::cerr << "[HAL] Failed to allocate framebuffer" << std::endl;
        exit(1);
    }
    
    // Clear framebuffer
    memset(tft_fb, 0x00, SDL_HOR_RES * SDL_VER_RES * sizeof(uint32_t));
    
    std::cout << "[HAL] Window created (" << window_width << "x" << window_height << ")" << std::endl;
}

/**
 * Update SDL window
 */
static void window_update(void) {
    SDL_UpdateTexture(texture, NULL, tft_fb, SDL_HOR_RES * sizeof(uint32_t));
    SDL_RenderClear(renderer);
    SDL_RenderCopy(renderer, texture, NULL, NULL);
    SDL_RenderPresent(renderer);
}

/**
 * LVGL display flush callback
 */
static void sdl_display_flush(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    (void)disp_drv;
    
    // Copy LVGL buffer to SDL framebuffer
    for (int y = area->y1; y <= area->y2; y++) {
        for (int x = area->x1; x <= area->x2; x++) {
            uint32_t pixel_index = y * SDL_HOR_RES + x;
            
            // Convert LVGL color to ARGB8888
            lv_color_t lv_color = *color_p;
            uint32_t sdl_color = 0xFF000000 | 
                                (lv_color.ch.red << 19) | 
                                (lv_color.ch.green << 10) | 
                                (lv_color.ch.blue << 3);
            
            tft_fb[pixel_index] = sdl_color;
            color_p++;
        }
    }
    
    // Tell LVGL that flushing is done
    lv_disp_flush_ready(disp_drv);
}

/**
 * LVGL mouse input callback
 */
static void sdl_mouse_read(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    (void)indev_drv;
    
    int mouse_x, mouse_y;
    uint32_t mouse_state = SDL_GetMouseState(&mouse_x, &mouse_y);
    
    // Get window size for scaling
    int window_width, window_height;
    SDL_GetWindowSize(window, &window_width, &window_height);
    
    // Scale mouse coordinates to display resolution
    data->point.x = (mouse_x * SDL_HOR_RES) / window_width;
    data->point.y = (mouse_y * SDL_VER_RES) / window_height;
    
    // Check if mouse is pressed
    if (mouse_state & SDL_BUTTON(SDL_BUTTON_LEFT)) {
        data->state = LV_INDEV_STATE_PRESSED;
    } else {
        data->state = LV_INDEV_STATE_RELEASED;
    }
    
    // Clamp coordinates to display bounds
    if (data->point.x < 0) data->point.x = 0;
    if (data->point.x >= SDL_HOR_RES) data->point.x = SDL_HOR_RES - 1;
    if (data->point.y < 0) data->point.y = 0;
    if (data->point.y >= SDL_VER_RES) data->point.y = SDL_VER_RES - 1;
}

/**
 * Cleanup SDL resources
 */
static void monitor_sdl_clean_up(void) {
    if (tft_fb) {
        free(tft_fb);
        tft_fb = NULL;
    }
    
    if (texture) {
        SDL_DestroyTexture(texture);
        texture = NULL;
    }
    
    if (renderer) {
        SDL_DestroyRenderer(renderer);
        renderer = NULL;
    }
    
    if (window) {
        SDL_DestroyWindow(window);
        window = NULL;
    }
}

/**
 * Get current tick count (for LVGL timing)
 */
extern "C" uint32_t custom_tick_get(void);

/**
 * Get display horizontal resolution
 */
int hal_get_hor_res(void) {
    return SDL_HOR_RES;
}

/**
 * Get display vertical resolution
 */
int hal_get_ver_res(void) {
    return SDL_VER_RES;
}

/**
 * Check if window is still open
 */
bool hal_is_window_open(void) {
    return window_open;
}