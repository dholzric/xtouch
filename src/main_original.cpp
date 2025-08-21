#include <Arduino.h>
#include <ArduinoJson.h>

// Core XTouch includes
#include "xtouch/debug.h"
#include "xtouch/types.h"
#include "xtouch/globals.h"
#include "xtouch/filesystem.h"
#include "xtouch/sdcard.h"

// Display and UI
#if defined(__XTOUCH_SCREEN_28__)
#include "devices/2.8/screen.h"
#endif
#include "ui/ui.h"

// Boombox-specific includes
#include "xtouch/settings.h"
#include "xtouch/net.h"

void xtouch_intro_show(void)
{
  ui_introScreen_screen_init();
  lv_disp_load_scr(introScreen);
  lv_timer_handler();
}

void setup()
{
  Serial.begin(115200);
  Serial.println("XTouch Boombox v2.0.0-beta starting...");

  // Initialize core systems
  xtouch_globals_init();
  xtouch_screen_setup();
  xtouch_intro_show();
  
  // Initialize SD card
  while (!xtouch_sdcard_setup()) {
    Serial.println("Waiting for SD card...");
    delay(1000);
  }

  // Load settings
  xtouch_settings_loadSettings();

  // Initialize touch
  xtouch_touch_setup();

  // Setup WiFi (optional for boombox)
  if (xtouch_wifi_setup()) {
    Serial.println("WiFi connected");
  } else {
    Serial.println("WiFi not configured - running in offline mode");
  }

  // Setup screen timer
  xtouch_screen_setupScreenTimer();

  Serial.println("XTouch Boombox initialized successfully!");
}

void loop()
{
  lv_timer_handler();
  lv_task_handler();
  
  // Simple boombox main loop
  delay(10);
}
