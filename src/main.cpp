#include <Arduino.h>
#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI();

void setup() {
    Serial.begin(115200);
    Serial.println("XTouch Boombox v2.0.0-beta - ESP32-2432S028R");
    
    // Initialize display
    tft.init();
    tft.setRotation(1); // Landscape mode for boombox
    tft.fillScreen(TFT_BLACK);
    
    // Display boombox info
    tft.setTextColor(TFT_GREEN);
    tft.setTextSize(2);
    tft.drawString("XTouch Boombox", 50, 50);
    tft.setTextSize(1);
    tft.setTextColor(TFT_WHITE);
    tft.drawString("v2.0.0-beta", 50, 80);
    tft.drawString("ESP32-2432S028R Ready", 50, 100);
    tft.drawString("Hardware: Cheap Yellow Display", 50, 120);
    tft.drawString("Audio: WIHZI ZK-1001B", 50, 140);
    tft.drawString("Features: 10-band EQ, Bluetooth", 50, 160);
    tft.drawString("Status: Firmware loaded successfully!", 50, 180);
    
    // Draw a simple frame
    tft.drawRect(10, 10, 300, 220, TFT_CYAN);
    
    Serial.println("Boombox firmware loaded - ready for audio features!");
}

void loop() {
    // Simple heartbeat
    static unsigned long lastBlink = 0;
    static bool ledState = false;
    
    if (millis() - lastBlink > 1000) {
        ledState = !ledState;
        if (ledState) {
            tft.fillCircle(300, 30, 5, TFT_GREEN);
        } else {
            tft.fillCircle(300, 30, 5, TFT_BLACK);
        }
        lastBlink = millis();
        Serial.println("Boombox heartbeat");
    }
    
    delay(10);
}