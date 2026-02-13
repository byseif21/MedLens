#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ==========================================
// CONFIGURATION
// ==========================================
const char* DEVICE_ID = "GLASS_001"; // Unique ID for this device
const char* BACKEND_URL = "http://YOUR_BACKEND_URL_HERE/api/glass/sync"; // UPDATE THIS for Prod!
const int SYNC_INTERVAL_MS = 200; // Time between frames (200ms = ~5fps)

// ==========================================
// PIN DEFINITIONS (ESP32 WROVER DEV)
// ==========================================
#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    21
#define SIOD_GPIO_NUM    26
#define SIOC_GPIO_NUM    27
#define Y9_GPIO_NUM      35
#define Y8_GPIO_NUM      34
#define Y7_GPIO_NUM      39
#define Y6_GPIO_NUM      36
#define Y5_GPIO_NUM      19
#define Y4_GPIO_NUM      18
#define Y3_GPIO_NUM      5
#define Y2_GPIO_NUM      4
#define VSYNC_GPIO_NUM   25
#define HREF_GPIO_NUM    23
#define PCLK_GPIO_NUM    22
#define LED_GPIO_NUM      2 // Onboard LED

// ==========================================
// GLOBALS
// ==========================================
unsigned long lastSyncTime = 0;

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  Serial.begin(115200);
  Serial.println();
  Serial.println("Starting MedLens Cloud Relay Firmware...");

  pinMode(LED_GPIO_NUM, OUTPUT);
  digitalWrite(LED_GPIO_NUM, LOW);

  // 1. Initialize Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // 2. WiFi Connection (WiFiManager)
  WiFiManager wm;
  // wm.resetSettings(); // Uncomment to wipe saved WiFi credentials
  
  bool res = wm.autoConnect("MedLens-Glass-Setup"); // AP Name
  if(!res) {
      Serial.println("Failed to connect");
      ESP.restart();
  } 
  Serial.println("WiFi Connected!");
  
  // Flash LED to indicate success
  for(int i=0; i<3; i++) {
    digitalWrite(LED_GPIO_NUM, HIGH);
    delay(100);
    digitalWrite(LED_GPIO_NUM, LOW);
    delay(100);
  }
}

void loop() {
  if (millis() - lastSyncTime > SYNC_INTERVAL_MS) {
    sendHeartbeat();
    lastSyncTime = millis();
  }
}

void sendHeartbeat() {
  if(WiFi.status() != WL_CONNECTED) return;

  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  HTTPClient http;
  bool useTls = String(BACKEND_URL).startsWith("https");
  WiFiClientSecure secureClient;
  if (useTls) {
    secureClient.setInsecure();
    http.begin(secureClient, BACKEND_URL);
  } else {
    http.begin(BACKEND_URL);
  }
  // Prepare Multipart Data
  String boundary = "------------------------735323031399963166993862";
  String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--" + boundary + "--\r\n";
  
  // Extra fields (device_id, battery)
  String extra = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n" + DEVICE_ID + "\r\n";
  extra += "--" + boundary + "\r\nContent-Disposition: form-data; name=\"battery\"\r\n\r\n85\r\n"; // Hardcoded battery for now

  size_t allLen = extra.length() + head.length() + fb->len + tail.length();

  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  http.addHeader("Content-Length", String(allLen));

  // Send Data
  // Note: HTTPClient in standard ESP32 lib doesn't support stream sending easily without custom implementation
  // So we will try a simpler approach: POST only if we have a small buffer, or use a custom stream.
  // Ideally, we construct the full body in a buffer, but that eats RAM.
  // For simplicity in this V1, we will try to use the collect-and-send approach or just send metadata if image is too big?
  // Actually, let's use the .POST(uint8_t * payload, size_t size) but we need to concatenate.
  
  // OPTIMIZED APPROACH:
  // Since we can't easily stream with basic HTTPClient, we will construct the buffer.
  // PSRAM is available on Wrover, so we have ~4MB.
  
  uint8_t *buffer = (uint8_t *) ps_malloc(allLen);
  if(!buffer) {
     Serial.println("Malloc failed");
     esp_camera_fb_return(fb);
     return;
  }

  size_t offset = 0;
  memcpy(buffer + offset, extra.c_str(), extra.length()); offset += extra.length();
  memcpy(buffer + offset, head.c_str(), head.length()); offset += head.length();
  memcpy(buffer + offset, fb->buf, fb->len); offset += fb->len;
  memcpy(buffer + offset, tail.c_str(), tail.length()); offset += tail.length();

  int httpResponseCode = http.POST(buffer, allLen);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("Sync response: %d\n", httpResponseCode);
    // Serial.println(httpResponseCode);
    // Serial.println(response);
    
    // Simple Command Parsing
    if (response.indexOf("RESET_WIFI") != -1) {
        Serial.println("!!! WiFi Reset Command Received !!!");
        digitalWrite(LED_GPIO_NUM, HIGH);
        delay(1000);
        digitalWrite(LED_GPIO_NUM, LOW);
        
        WiFiManager wm;
        wm.resetSettings();
        ESP.restart();
    }
    
    if (response.indexOf("blink") != -1 || response.indexOf("alert") != -1 || response.indexOf("DISPLAY_TEXT") != -1) {
        digitalWrite(LED_GPIO_NUM, HIGH);
        delay(100);
        digitalWrite(LED_GPIO_NUM, LOW);
    }
  } else {
    Serial.printf("Error on sending POST: %d\n", httpResponseCode);
  }

  free(buffer);
  http.end();
  esp_camera_fb_return(fb);
}
