#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

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

#define OLED_SDA_PIN 33
#define OLED_SCL_PIN 32
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_RESET_PIN -1

Adafruit_SSD1306 oled(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET_PIN);

char currentLine1[32] = "MedLens";
char currentLine2[32] = "";
char currentInfo[64] = "";
bool hasDisplayFrame = false;
bool headerVisible = true;
bool isAlert = false;
unsigned long lastBlinkMillis = 0;
unsigned long lastStatusMillis = 0;
bool waitingForAppConnection = true;

unsigned long lastSyncTime = 0;

void initOled() {
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    return;
  }
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.display();
}

void showDeviceIdScreen() {
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 0);
  oled.println("MedLens Cloud");
  oled.setCursor(0, 16);
  oled.println("Device ID:");
  oled.setCursor(0, 32);
  oled.println(DEVICE_ID);
  oled.display();
}

void drawDisplayFrame(bool showHeader) {
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  char shortName[32];
  shortName[0] = 0;
  if (currentLine2[0] != 0) {
    int spaces = 0;
    size_t i = 0;
    const char* p = currentLine2;
    while (*p && i < sizeof(shortName) - 1) {
      if (*p == ' ') {
        spaces++;
        if (spaces >= 2) {
          break;
        }
      }
      shortName[i++] = *p++;
    }
    shortName[i] = 0;
  }
  const char* nameToUse = (shortName[0] != 0) ? shortName : currentLine2;

  char decoratedName[40];
  if (nameToUse) {
    snprintf(decoratedName, sizeof(decoratedName), "> %s", nameToUse);
  } else {
    decoratedName[0] = 0;
  }

  char infoLine1[22];
  char infoLine2[22];
  infoLine1[0] = 0;
  infoLine2[0] = 0;

  if (currentInfo[0] != 0) {
    const char* sep = strchr(currentInfo, '|');
    if (sep) {
      size_t len1 = sep - currentInfo;
      if (len1 >= sizeof(infoLine1)) len1 = sizeof(infoLine1) - 1;
      memcpy(infoLine1, currentInfo, len1);
      infoLine1[len1] = 0;

      const char* right = sep + 1;
      while (*right == ' ') right++;
      size_t len2 = strlen(right);
      if (len2 >= sizeof(infoLine2)) len2 = sizeof(infoLine2) - 1;
      memcpy(infoLine2, right, len2);
      infoLine2[len2] = 0;
    } else {
      size_t len = strlen(currentInfo);
      if (len >= sizeof(infoLine1)) len = sizeof(infoLine1) - 1;
      memcpy(infoLine1, currentInfo, len);
      infoLine1[len] = 0;
    }
  }

  const char* info1 = (infoLine1[0] != 0) ? infoLine1 : nullptr;
  const char* info2 = (infoLine2[0] != 0) ? infoLine2 : nullptr;

  if (!info1 && isAlert) {
    info2 = "ALERT";
  }

  oled.setTextSize(1);
  oled.setCursor(0, 0);
  char headerBuf[32];
  if (isAlert) {
    const char* base = currentLine1;
    const char* tag = showHeader ? " CRITICAL" : "         ";
    snprintf(headerBuf, sizeof(headerBuf), "%s%s", base, tag);
    oled.println(headerBuf);
    if (showHeader) {
      int16_t criticalX = (strlen(base) + 1) * 6;
      oled.setCursor(criticalX, 0);
      oled.println("CRITICAL");
      oled.setCursor(criticalX + 1, 0);
      oled.println("CRITICAL");
    }
  } else {
    if (showHeader) {
      strncpy(headerBuf, currentLine1, sizeof(headerBuf) - 1);
      headerBuf[sizeof(headerBuf) - 1] = 0;
    } else {
      strncpy(headerBuf, "            ", sizeof(headerBuf) - 1);
      headerBuf[sizeof(headerBuf) - 1] = 0;
    }
    oled.println(headerBuf);
  }

  oled.setTextSize(1);
  const char* nameText = decoratedName[0] ? decoratedName : nameToUse;
  oled.setCursor(0, 16);
  oled.println(nameText);
  oled.setCursor(1, 16);
  oled.println(nameText);

  if (info1) {
    oled.setTextSize(1);
    oled.setCursor(0, 34);
    oled.println(info1);
  }

  if (info2) {
    oled.setTextSize(1);
    oled.setCursor(0, 46);
    oled.println(info2);
  }

  oled.display();
}

void showDisplayMessage(const char* line1, const char* line2, const char* line3, bool alert) {
  strncpy(currentLine1, line1, sizeof(currentLine1) - 1);
  currentLine1[sizeof(currentLine1) - 1] = 0;

  if (line2) {
    strncpy(currentLine2, line2, sizeof(currentLine2) - 1);
    currentLine2[sizeof(currentLine2) - 1] = 0;
  } else {
    currentLine2[0] = 0;
  }

  if (line3) {
    strncpy(currentInfo, line3, sizeof(currentInfo) - 1);
    currentInfo[sizeof(currentInfo) - 1] = 0;
  } else {
    currentInfo[0] = 0;
  }

  isAlert = alert;
  hasDisplayFrame = true;
  headerVisible = true;
  lastBlinkMillis = millis();

  drawDisplayFrame(true);
}

void extractStringField(const char* json, const char* key, char* out, size_t outSize) {
  const char* p = strstr(json, key);
  if (!p) {
    out[0] = 0;
    return;
  }
  p = strchr(p, ':');
  if (!p) {
    out[0] = 0;
    return;
  }
  p++;
  while (*p == ' ' || *p == '\"') p++;
  size_t i = 0;
  while (*p && *p != '\"' && *p != ',' && *p != '}' && i < outSize - 1) {
    out[i++] = *p++;
  }
  out[i] = 0;
}

bool extractBoolField(const char* json, const char* key) {
  const char* p = strstr(json, key);
  if (!p) return false;
  p = strchr(p, ':');
  if (!p) return false;
  p++;
  while (*p == ' ') p++;
  if (strncmp(p, "true", 4) == 0) return true;
  return false;
}

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

  WiFiManager wm;
  bool res = wm.autoConnect("MedLens-Glass-Setup"); // AP Name
  if(!res) {
      Serial.println("Failed to connect");
      ESP.restart();
  } 
  Serial.println("WiFi Connected!");

  for(int i=0; i<3; i++) {
    digitalWrite(LED_GPIO_NUM, HIGH);
    delay(100);
    digitalWrite(LED_GPIO_NUM, LOW);
    delay(100);
  }

  initOled();
  showDeviceIdScreen();
}

void loop() {
  if (millis() - lastSyncTime > SYNC_INTERVAL_MS) {
    sendHeartbeat();
    lastSyncTime = millis();
  }

  if (hasDisplayFrame) {
    unsigned long now = millis();
    unsigned long interval = isAlert ? 200 : 800;
    if (now - lastBlinkMillis >= interval) {
      lastBlinkMillis = now;
      headerVisible = !headerVisible;
      drawDisplayFrame(headerVisible);
    }
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

    if (response.indexOf("RESET_WIFI") != -1) {
        digitalWrite(LED_GPIO_NUM, HIGH);
        delay(1000);
        digitalWrite(LED_GPIO_NUM, LOW);

        WiFiManager wm;
        wm.resetSettings();
        ESP.restart();
    }

    if (response.indexOf("DISPLAY_TEXT") != -1) {
        char line1[32];
        char line2[32];
        char info[64];
        extractStringField(response.c_str(), "line1", line1, sizeof(line1));
        extractStringField(response.c_str(), "line2", line2, sizeof(line2));
        extractStringField(response.c_str(), "info", info, sizeof(info));
        bool alert = extractBoolField(response.c_str(), "alert");

        if (line1[0] == 0) {
            strncpy(line1, "MedLens", sizeof(line1) - 1);
            line1[sizeof(line1) - 1] = 0;
        }

        showDisplayMessage(line1, line2, info, alert);
        lastStatusMillis = millis();
        waitingForAppConnection = false;

        if (alert) {
            digitalWrite(LED_GPIO_NUM, HIGH);
            delay(200);
            digitalWrite(LED_GPIO_NUM, LOW);
        }
    }
  } else {
    Serial.printf("Error on sending POST: %d\n", httpResponseCode);
  }

  free(buffer);
  http.end();
  esp_camera_fb_return(fb);
}
