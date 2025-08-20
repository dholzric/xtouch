/**
 * @file spotify_client.h
 * @brief Spotify Web API client for ESP32 boombox
 * 
 * Provides Spotify Connect functionality:
 * - Device registration as Spotify Connect speaker
 * - Playback control (play/pause/skip/volume)
 * - Track info and metadata
 * - Playlist browsing
 * 
 * Requires Spotify Developer Account and Client ID/Secret
 */

#pragma once

#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>
#include <base64.h>
#include "net.h"
#include "types.h"

// Spotify API endpoints
#define SPOTIFY_ACCOUNTS_URL "https://accounts.spotify.com"
#define SPOTIFY_API_URL "https://api.spotify.com/v1"
#define SPOTIFY_TOKEN_URL "https://accounts.spotify.com/api/token" 
#define SPOTIFY_AUTHORIZE_URL "https://accounts.spotify.com/authorize"

// Local web server for OAuth callback
#define SPOTIFY_CALLBACK_PORT 8888
#define SPOTIFY_CALLBACK_PATH "/callback"

// Spotify scopes needed for boombox functionality
#define SPOTIFY_SCOPES "streaming,user-read-playback-state,user-modify-playback-state,playlist-read-private,user-library-read"

class SpotifyClient {
private:
    // OAuth credentials (set these in provisioning.json)
    String client_id;
    String client_secret;
    String device_name = "XTouch Boombox";
    String device_id;
    
    // Authentication tokens
    String access_token;
    String refresh_token;
    unsigned long token_expires = 0;
    
    // Local web server for OAuth
    WebServer* callback_server = nullptr;
    
    // Current playback state
    struct {
        bool is_playing = false;
        String track_name = "";
        String artist_name = "";
        String album_name = "";
        String track_uri = "";
        int progress_ms = 0;
        int duration_ms = 0;
        int volume_percent = 70;
        String playlist_name = "";
    } current_playback;
    
public:
    /**
     * Initialize Spotify client with credentials
     */
    bool init() {
        ConsoleInfo.println(F("[SPOTIFY] Initializing Spotify Web API client..."));
        
        // Load credentials from provisioning.json
        if (!loadCredentials()) {
            ConsoleError.println(F("[SPOTIFY] Missing Spotify credentials in provisioning.json"));
            return false;
        }
        
        // Generate unique device ID
        device_id = "xtouch_boombox_" + WiFi.macAddress();
        device_id.replace(":", "");
        
        ConsoleInfo.printf("[SPOTIFY] Device ID: %s\n", device_id.c_str());
        ConsoleInfo.printf("[SPOTIFY] Device Name: %s\n", device_name.c_str());
        
        return true;
    }
    
    /**
     * Load Spotify credentials from provisioning.json
     */
    bool loadCredentials() {
        DynamicJsonDocument config = xtouch_load_config();
        if (config.isNull() || !config.containsKey("spotify")) {
            return false;
        }
        
        auto spotify = config["spotify"];
        if (!spotify.containsKey("client_id") || !spotify.containsKey("client_secret")) {
            return false;
        }
        
        client_id = spotify["client_id"].as<String>();
        client_secret = spotify["client_secret"].as<String>();
        
        // Optional: load saved tokens
        if (spotify.containsKey("access_token")) {
            access_token = spotify["access_token"].as<String>();
            refresh_token = spotify.containsKey("refresh_token") ? 
                           spotify["refresh_token"].as<String>() : "";
            token_expires = spotify.containsKey("expires") ? 
                           spotify["expires"].as<unsigned long>() : 0;
        }
        
        return true;
    }
    
    /**
     * Start OAuth flow - shows QR code and starts local server
     */
    void startAuth() {
        ConsoleInfo.println(F("[SPOTIFY] Starting Spotify authentication..."));
        
        // Start local callback server
        if (callback_server) delete callback_server;
        callback_server = new WebServer(SPOTIFY_CALLBACK_PORT);
        
        callback_server->on(SPOTIFY_CALLBACK_PATH, [this]() {
            handleAuthCallback();
        });
        
        callback_server->begin();
        ConsoleInfo.printf("[SPOTIFY] Callback server started on port %d\n", SPOTIFY_CALLBACK_PORT);
        
        // Build authorization URL
        String auth_url = String(SPOTIFY_AUTHORIZE_URL) + 
                         "?client_id=" + client_id +
                         "&response_type=code" +
                         "&redirect_uri=" + getCallbackUrl() +
                         "&scope=" + urlEncode(SPOTIFY_SCOPES) +
                         "&show_dialog=true";
        
        ConsoleInfo.println(F("[SPOTIFY] To authorize this device:"));
        ConsoleInfo.println(F("[SPOTIFY] 1. Open Spotify on your phone"));
        ConsoleInfo.println(F("[SPOTIFY] 2. Go to Settings > Devices"));
        ConsoleInfo.println(F("[SPOTIFY] 3. Look for 'XTouch Boombox'"));
        ConsoleInfo.println(F("[SPOTIFY] 4. Or scan this QR code:"));
        
        // Show QR code on display for easy phone setup
        show_spotify_qr(auth_url);
        
        ConsoleInfo.printf("[SPOTIFY] Auth URL: %s\n", auth_url.c_str());
    }
    
    /**
     * Handle OAuth callback from Spotify
     */
    void handleAuthCallback() {
        String code = callback_server->arg("code");
        String error = callback_server->arg("error");
        
        if (error.length() > 0) {
            ConsoleError.printf("[SPOTIFY] Auth error: %s\n", error.c_str());
            callback_server->send(400, "text/html", 
                "<h1>Spotify Auth Error</h1><p>" + error + "</p>");
            return;
        }
        
        if (code.length() == 0) {
            ConsoleError.println(F("[SPOTIFY] No authorization code received"));
            callback_server->send(400, "text/html", 
                "<h1>Missing Code</h1><p>No authorization code received</p>");
            return;
        }
        
        // Exchange code for tokens
        if (exchangeCodeForTokens(code)) {
            ConsoleInfo.println(F("[SPOTIFY] Successfully authenticated!"));
            callback_server->send(200, "text/html", 
                "<h1>Success!</h1><p>XTouch Boombox is now connected to Spotify</p>"
                "<script>window.close();</script>");
            
            // Register as Spotify Connect device
            registerDevice();
            
        } else {
            ConsoleError.println(F("[SPOTIFY] Failed to exchange code for tokens"));
            callback_server->send(500, "text/html", 
                "<h1>Auth Failed</h1><p>Failed to complete authentication</p>");
        }
    }
    
    /**
     * Exchange authorization code for access/refresh tokens
     */
    bool exchangeCodeForTokens(const String& code) {
        HTTPClient http;
        WiFiClientSecure client;
        client.setInsecure(); // For demo - in production, use proper certificates
        
        http.begin(client, SPOTIFY_TOKEN_URL);
        http.addHeader("Content-Type", "application/x-www-form-urlencoded");
        
        // Basic auth header
        String auth = base64::encode(client_id + ":" + client_secret);
        http.addHeader("Authorization", "Basic " + auth);
        
        // POST data
        String postData = "grant_type=authorization_code" +
                         String("&code=") + code +
                         "&redirect_uri=" + getCallbackUrl();
        
        int httpCode = http.POST(postData);
        
        if (httpCode == 200) {
            String payload = http.getString();
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, payload);
            
            access_token = doc["access_token"].as<String>();
            refresh_token = doc["refresh_token"].as<String>();
            int expires_in = doc["expires_in"].as<int>();
            token_expires = millis() + (expires_in * 1000);
            
            // Save tokens to config
            saveTokens();
            
            http.end();
            return true;
        }
        
        ConsoleError.printf("[SPOTIFY] Token exchange failed: %d\n", httpCode);
        http.end();
        return false;
    }
    
    /**
     * Register device with Spotify Connect
     */
    bool registerDevice() {
        if (!isAuthenticated()) return false;
        
        DynamicJsonDocument deviceInfo(512);
        deviceInfo["device_ids"] = JsonArray();
        deviceInfo["device_ids"].add(device_id);
        
        String json;
        serializeJson(deviceInfo, json);
        
        HTTPClient http;
        WiFiClientSecure client;
        client.setInsecure();
        
        http.begin(client, String(SPOTIFY_API_URL) + "/me/player/devices");
        http.addHeader("Authorization", "Bearer " + access_token);
        http.addHeader("Content-Type", "application/json");
        
        int httpCode = http.PUT(json);
        http.end();
        
        if (httpCode == 200 || httpCode == 204) {
            ConsoleInfo.println(F("[SPOTIFY] Device registered successfully"));
            return true;
        }
        
        ConsoleError.printf("[SPOTIFY] Device registration failed: %d\n", httpCode);
        return false;
    }
    
    /**
     * Get current playback state
     */
    bool updatePlaybackState() {
        if (!isAuthenticated()) return false;
        
        HTTPClient http;
        WiFiClientSecure client;
        client.setInsecure();
        
        http.begin(client, String(SPOTIFY_API_URL) + "/me/player");
        http.addHeader("Authorization", "Bearer " + access_token);
        
        int httpCode = http.GET();
        
        if (httpCode == 200) {
            String payload = http.getString();
            DynamicJsonDocument doc(2048);
            deserializeJson(doc, payload);
            
            // Parse playback state
            current_playback.is_playing = doc["is_playing"].as<bool>();
            current_playback.progress_ms = doc["progress_ms"].as<int>();
            current_playback.volume_percent = doc["device"]["volume_percent"].as<int>();
            
            // Parse track info
            auto track = doc["item"];
            current_playback.track_name = track["name"].as<String>();
            current_playback.track_uri = track["uri"].as<String>();
            current_playback.duration_ms = track["duration_ms"].as<int>();
            current_playback.album_name = track["album"]["name"].as<String>();
            
            // Parse artists
            current_playback.artist_name = "";
            auto artists = track["artists"];
            for (size_t i = 0; i < artists.size(); i++) {
                if (i > 0) current_playback.artist_name += ", ";
                current_playback.artist_name += artists[i]["name"].as<String>();
            }
            
            http.end();
            
            // Update UI with new info
            update_spotify_display();
            return true;
        }
        
        http.end();
        return false;
    }
    
    /**
     * Playback controls
     */
    bool play() { return sendPlaybackCommand("play"); }
    bool pause() { return sendPlaybackCommand("pause"); }
    bool next() { return sendPlaybackCommand("next"); }
    bool previous() { return sendPlaybackCommand("previous"); }
    
    bool setVolume(int volume) {
        volume = constrain(volume, 0, 100);
        
        HTTPClient http;
        WiFiClientSecure client;
        client.setInsecure();
        
        String url = String(SPOTIFY_API_URL) + "/me/player/volume?volume_percent=" + String(volume);
        http.begin(client, url);
        http.addHeader("Authorization", "Bearer " + access_token);
        
        int httpCode = http.PUT("");
        http.end();
        
        if (httpCode == 204) {
            current_playback.volume_percent = volume;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get playback info for display
     */
    DynamicJsonDocument getPlaybackInfo() {
        DynamicJsonDocument info(512);
        info["connected"] = isAuthenticated();
        info["playing"] = current_playback.is_playing;
        info["track"] = current_playback.track_name;
        info["artist"] = current_playback.artist_name;
        info["album"] = current_playback.album_name;
        info["progress"] = current_playback.progress_ms;
        info["duration"] = current_playback.duration_ms;
        info["volume"] = current_playback.volume_percent;
        info["device"] = device_name;
        return info;
    }
    
    /**
     * Check if authenticated and token is valid
     */
    bool isAuthenticated() {
        if (access_token.isEmpty()) return false;
        if (millis() > token_expires) {
            return refreshAccessToken();
        }
        return true;
    }
    
private:
    String getCallbackUrl() {
        return "http://" + WiFi.localIP().toString() + ":" + 
               String(SPOTIFY_CALLBACK_PORT) + SPOTIFY_CALLBACK_PATH;
    }
    
    String urlEncode(const String& str) {
        String encoded = "";
        for (size_t i = 0; i < str.length(); i++) {
            char c = str[i];
            if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
                encoded += c;
            } else {
                encoded += "%" + String((unsigned char)c, HEX);
            }
        }
        return encoded;
    }
    
    bool sendPlaybackCommand(const String& command) {
        if (!isAuthenticated()) return false;
        
        HTTPClient http;
        WiFiClientSecure client;  
        client.setInsecure();
        
        String url = String(SPOTIFY_API_URL) + "/me/player/" + command;
        http.begin(client, url);
        http.addHeader("Authorization", "Bearer " + access_token);
        
        int httpCode = http.PUT("");
        http.end();
        
        return (httpCode == 204);
    }
    
    bool refreshAccessToken() {
        if (refresh_token.isEmpty()) return false;
        
        HTTPClient http;
        WiFiClientSecure client;
        client.setInsecure();
        
        http.begin(client, SPOTIFY_TOKEN_URL);
        http.addHeader("Content-Type", "application/x-www-form-urlencoded");
        
        String auth = base64::encode(client_id + ":" + client_secret);
        http.addHeader("Authorization", "Basic " + auth);
        
        String postData = "grant_type=refresh_token&refresh_token=" + refresh_token;
        
        int httpCode = http.POST(postData);
        
        if (httpCode == 200) {
            String payload = http.getString();
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, payload);
            
            access_token = doc["access_token"].as<String>();
            int expires_in = doc["expires_in"].as<int>();
            token_expires = millis() + (expires_in * 1000);
            
            saveTokens();
            
            http.end();
            return true;
        }
        
        http.end();
        return false;
    }
    
    void saveTokens() {
        // Save tokens to provisioning.json for persistence
        DynamicJsonDocument config = xtouch_load_config();
        if (config.isNull()) {
            config = DynamicJsonDocument(2048);
        }
        
        config["spotify"]["access_token"] = access_token;
        config["spotify"]["refresh_token"] = refresh_token;
        config["spotify"]["expires"] = token_expires;
        
        // Save to file (implement in main config system)
        xtouch_save_config(config);
    }
};

// Global instance
extern SpotifyClient spotify;

// Helper functions for UI updates
void show_spotify_qr(const String& url);
void update_spotify_display();