#include "globals_minimal.h"

XTouchConfig xTouchConfig;

void xtouch_globals_init() {
    xTouchConfig.initialized = true;
    xTouchConfig.volume = 70;
    xTouchConfig.wifi_enabled = false;
    Serial.println("Globals initialized");
}

bool xtouch_sdcard_setup() {
    Serial.println("SD card setup (mock)");
    return true;
}

bool xtouch_wifi_setup() {
    Serial.println("WiFi setup (mock)");
    return false; // Return false for offline mode
}

void xtouch_settings_loadSettings() {
    Serial.println("Settings loaded (mock)");
}

void xtouch_touch_setup() {
    Serial.println("Touch setup (mock)");
}

void xtouch_screen_setupScreenTimer() {
    Serial.println("Screen timer setup (mock)");
}