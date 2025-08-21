#ifndef _XTOUCH_GLOBALS_MINIMAL_H
#define _XTOUCH_GLOBALS_MINIMAL_H

#include <Arduino.h>

// Minimal globals for boombox build
typedef struct {
    bool initialized;
    int volume;
    bool wifi_enabled;
} XTouchConfig;

extern XTouchConfig xTouchConfig;

// Minimal function declarations
void xtouch_globals_init();
bool xtouch_sdcard_setup();
bool xtouch_wifi_setup();
void xtouch_settings_loadSettings();
void xtouch_touch_setup();
void xtouch_screen_setupScreenTimer();

#endif