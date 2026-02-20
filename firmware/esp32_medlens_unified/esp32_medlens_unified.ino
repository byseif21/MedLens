 #include "esp_camera.h"
 #include <WiFi.h>
 #include <WiFiManager.h>
 #include <HTTPClient.h>
 #include <WiFiClientSecure.h>
 #include "esp_timer.h"
 #include "img_converters.h"
 #include "Arduino.h"
 #include "fb_gfx.h"
 #include "soc/soc.h"
 #include "soc/rtc_cntl_reg.h"
 #include "esp_http_server.h"
 #include <Wire.h>
 #include <Adafruit_GFX.h>
 #include <Adafruit_SSD1306.h>
 #include <Preferences.h>
 
 #define PWDN_GPIO_NUM -1
 #define RESET_GPIO_NUM -1
 #define XCLK_GPIO_NUM 21
 #define SIOD_GPIO_NUM 26
 #define SIOC_GPIO_NUM 27
 #define Y9_GPIO_NUM 35
 #define Y8_GPIO_NUM 34
 #define Y7_GPIO_NUM 39
 #define Y6_GPIO_NUM 36
 #define Y5_GPIO_NUM 19
 #define Y4_GPIO_NUM 18
 #define Y3_GPIO_NUM 5
 #define Y2_GPIO_NUM 4
 #define VSYNC_GPIO_NUM 25
 #define HREF_GPIO_NUM 23
 #define PCLK_GPIO_NUM 22
 #define LED_GPIO_NUM 2
 
 #define OLED_SDA_PIN 33
 #define OLED_SCL_PIN 32
 #define OLED_WIDTH 128
 #define OLED_HEIGHT 64
 #define OLED_RESET_PIN -1
 
 const int SYNC_INTERVAL_MS = 200;
 const unsigned long APP_DISCONNECT_TIMEOUT = 15000;
 const char* DEFAULT_DEVICE_ID = "GLASS_001";
 const char* DEFAULT_BACKEND_URL = "http://YOUR_BACKEND_URL_HERE/api/glass/sync";
 
 enum AppMode { MODE_LOCAL = 0, MODE_CLOUD = 1 };
 
 Adafruit_SSD1306 oled(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET_PIN);
 Preferences prefs;
 
 httpd_handle_t camera_httpd = NULL;
 
 struct AppConfig {
   AppMode mode;
   String deviceId;
   String backendUrl;
 };
 
 AppConfig appConfig;
 
 String lastDisplayMessage = "Ready";
 bool isAlert = false;
 
 char currentLine1[32] = "MedLens";
 char currentLine2[32] = "";
 char currentInfo[64] = "";
 bool hasDisplayFrame = false;
 bool headerVisible = true;
 bool waitingForAppConnection = false;
 unsigned long lastBlinkMillis = 0;
 unsigned long lastStatusMillis = 0;
 unsigned long lastSyncTime = 0;
 
 char modeParamValue[8];
 char deviceIdParamValue[32];
 char backendUrlParamValue[128];
 
 void loadAppConfig() {
   prefs.begin("medlens", true);
   uint8_t storedMode = prefs.getUChar("mode", 0);
   String storedDeviceId = prefs.getString("deviceId", DEFAULT_DEVICE_ID);
   String storedBackend = prefs.getString("backend", DEFAULT_BACKEND_URL);
   prefs.end();
   if (storedMode == 1) {
     appConfig.mode = MODE_CLOUD;
   } else {
     appConfig.mode = MODE_LOCAL;
   }
   if (storedDeviceId.length() == 0) {
     storedDeviceId = DEFAULT_DEVICE_ID;
   }
   if (storedBackend.length() == 0) {
     storedBackend = DEFAULT_BACKEND_URL;
   }
   appConfig.deviceId = storedDeviceId;
   appConfig.backendUrl = storedBackend;
 }
 
 void saveAppConfig() {
   prefs.begin("medlens", false);
   prefs.putUChar("mode", appConfig.mode == MODE_CLOUD ? 1 : 0);
   prefs.putString("deviceId", appConfig.deviceId);
   prefs.putString("backend", appConfig.backendUrl);
   prefs.end();
 }
 
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
 
 void showIpScreen() {
   IPAddress ip = WiFi.localIP();
   char ipBuf[24];
   snprintf(ipBuf, sizeof(ipBuf), "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
   oled.clearDisplay();
   oled.setTextSize(1);
   oled.setTextColor(SSD1306_WHITE);
   oled.setCursor(0, 0);
   oled.println("Glass IP:");
   oled.setCursor(0, 16);
   oled.println(ipBuf);
   oled.setCursor(0, 32);
   oled.println("Use in MedLens app");
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
   oled.println(appConfig.deviceId);
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
 
 static esp_err_t capture_handler(httpd_req_t* req) {
   camera_fb_t* fb = NULL;
   esp_err_t res = ESP_OK;
   int64_t fr_start = esp_timer_get_time();
   fb = esp_camera_fb_get();
   if (!fb) {
     httpd_resp_send_500(req);
     return ESP_FAIL;
   }
   httpd_resp_set_type(req, "image/jpeg");
   httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   res = httpd_resp_send(req, (const char*)fb->buf, fb->len);
   esp_camera_fb_return(fb);
   int64_t fr_end = esp_timer_get_time();
   uint32_t elapsed = (uint32_t)((fr_end - fr_start) / 1000);
   Serial.printf("JPG: %uB %ums\n", (uint32_t)(fb->len), elapsed);
   return res;
 }
 
 #define PART_BOUNDARY "123456789000000000000987654321"
 static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
 static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
 static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";
 
 static esp_err_t stream_handler(httpd_req_t* req) {
   camera_fb_t* fb = NULL;
   esp_err_t res = ESP_OK;
   size_t _jpg_buf_len = 0;
   uint8_t* _jpg_buf = NULL;
   char* part_buf[64];
   res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
   if (res != ESP_OK) return res;
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   while (true) {
     fb = esp_camera_fb_get();
     if (!fb) {
       Serial.println("Camera capture failed");
       res = ESP_FAIL;
     } else {
       if (fb->format != PIXFORMAT_JPEG) {
         bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
         esp_camera_fb_return(fb);
         fb = NULL;
         if (!jpeg_converted) {
           Serial.println("JPEG compression failed");
           res = ESP_FAIL;
         }
       } else {
         _jpg_buf_len = fb->len;
         _jpg_buf = fb->buf;
       }
     }
     if (res == ESP_OK) {
       size_t hlen = snprintf((char*)part_buf, 64, _STREAM_PART, _jpg_buf_len);
       res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
       if (res == ESP_OK) {
         res = httpd_resp_send_chunk(req, (const char*)part_buf, hlen);
       }
       if (res == ESP_OK) {
         res = httpd_resp_send_chunk(req, (const char*)_jpg_buf, _jpg_buf_len);
       }
     }
     if (fb) {
       esp_camera_fb_return(fb);
       fb = NULL;
       _jpg_buf = NULL;
     } else if (_jpg_buf) {
       free(_jpg_buf);
       _jpg_buf = NULL;
     }
     if (res != ESP_OK) {
       break;
     }
   }
   return res;
 }
 
 static esp_err_t status_handler(httpd_req_t* req) {
   httpd_resp_set_type(req, "application/json");
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   int battery = 100;
   char json_response[120];
   snprintf(json_response, sizeof(json_response), "{\"status\":\"ok\",\"battery\":%d,\"display\":\"%s\"}", battery, lastDisplayMessage.c_str());
   lastStatusMillis = millis();
   if (waitingForAppConnection) {
     waitingForAppConnection = false;
     showDisplayMessage("MedLens Ready", "", "", false);
   }
   return httpd_resp_send(req, json_response, strlen(json_response));
 }
 
 static esp_err_t display_handler(httpd_req_t* req) {
   char content[128];
   size_t recv_size = req->content_len < sizeof(content) - 1 ? req->content_len : sizeof(content) - 1;
   int ret = httpd_req_recv(req, content, recv_size);
   if (ret <= 0) {
     if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
       httpd_resp_send_408(req);
     }
     return ESP_FAIL;
   }
   content[recv_size] = 0;
   Serial.printf("Received Display Data: %s\n", content);
   char line1[32];
   char line2[32];
   char info[48];
   extractStringField(content, "line1", line1, sizeof(line1));
   extractStringField(content, "line2", line2, sizeof(line2));
   extractStringField(content, "info", info, sizeof(info));
   bool alert = extractBoolField(content, "alert");
   if (line1[0] == 0) {
     strncpy(line1, "MedLens", sizeof(line1) - 1);
     line1[sizeof(line1) - 1] = 0;
   }
   lastDisplayMessage = String(line1) + " " + String(line2) + " " + String(info);
   isAlert = alert;
   showDisplayMessage(line1, line2, info, alert);
   lastStatusMillis = millis();
   waitingForAppConnection = false;
   if (alert) {
     digitalWrite(LED_GPIO_NUM, HIGH);
     delay(200);
     digitalWrite(LED_GPIO_NUM, LOW);
   }
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   const char* resp = "{\"success\":true}";
   httpd_resp_send(req, resp, strlen(resp));
   return ESP_OK;
 }
 
 static esp_err_t reset_wifi_handler(httpd_req_t* req) {
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   const char* resp = "Resetting WiFi settings... Device will restart in AP mode (MedLens-Glass-Setup).";
   httpd_resp_send(req, resp, strlen(resp));
   Serial.println("Manual WiFi Reset Requested.");
   delay(500);
   WiFiManager wm;
   wm.resetSettings();
   ESP.restart();
   return ESP_OK;
 }
 
 static esp_err_t options_handler(httpd_req_t* req) {
   httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
   httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
   httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
   httpd_resp_send(req, NULL, 0);
   return ESP_OK;
 }
 
 void startCameraServer() {
   httpd_config_t config = HTTPD_DEFAULT_CONFIG();
   config.server_port = 80;
   httpd_uri_t capture_uri = {
     .uri = "/capture",
     .method = HTTP_GET,
     .handler = capture_handler,
     .user_ctx = NULL};
   httpd_uri_t stream_uri = {
     .uri = "/stream",
     .method = HTTP_GET,
     .handler = stream_handler,
     .user_ctx = NULL};
   httpd_uri_t status_uri = {
     .uri = "/status",
     .method = HTTP_GET,
     .handler = status_handler,
     .user_ctx = NULL};
   httpd_uri_t display_uri = {
     .uri = "/display",
     .method = HTTP_POST,
     .handler = display_handler,
     .user_ctx = NULL};
   httpd_uri_t reset_wifi_uri = {
     .uri = "/reset_wifi",
     .method = HTTP_GET,
     .handler = reset_wifi_handler,
     .user_ctx = NULL};
   httpd_uri_t options_uri = {
     .uri = "/display",
     .method = HTTP_OPTIONS,
     .handler = options_handler,
     .user_ctx = NULL};
   if (httpd_start(&camera_httpd, &config) == ESP_OK) {
     httpd_register_uri_handler(camera_httpd, &capture_uri);
     httpd_register_uri_handler(camera_httpd, &stream_uri);
     httpd_register_uri_handler(camera_httpd, &status_uri);
     httpd_register_uri_handler(camera_httpd, &display_uri);
     httpd_register_uri_handler(camera_httpd, &reset_wifi_uri);
     httpd_register_uri_handler(camera_httpd, &options_uri);
   }
 }
 
 bool initCamera() {
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
   if (psramFound()) {
     if (appConfig.mode == MODE_CLOUD) {
       config.frame_size = FRAMESIZE_VGA;
       config.jpeg_quality = 10;
       config.fb_count = 2;
     } else {
       config.frame_size = FRAMESIZE_UXGA;
       config.jpeg_quality = 10;
       config.fb_count = 2;
     }
   } else {
     config.frame_size = FRAMESIZE_SVGA;
     config.jpeg_quality = 12;
     config.fb_count = 1;
   }
   esp_err_t err = esp_camera_init(&config);
   if (err != ESP_OK) {
     Serial.printf("Camera init failed with error 0x%x", err);
     return false;
   }
   return true;
 }
 
 bool configureWifi() {
   WiFiManager wifiManager;
   snprintf(deviceIdParamValue, sizeof(deviceIdParamValue), "%s", appConfig.deviceId.c_str());
   snprintf(backendUrlParamValue, sizeof(backendUrlParamValue), "%s", appConfig.backendUrl.c_str());
   snprintf(modeParamValue, sizeof(modeParamValue), "%s", appConfig.mode == MODE_CLOUD ? "cloud" : "local");
   WiFiManagerParameter modeParam("mode", "mode (local/cloud)", modeParamValue, sizeof(modeParamValue));
   WiFiManagerParameter deviceParam("device_id", "Device ID", deviceIdParamValue, sizeof(deviceIdParamValue));
   WiFiManagerParameter backendParam("backend_url", "Backend URL", backendUrlParamValue, sizeof(backendUrlParamValue));
   wifiManager.addParameter(&modeParam);
   wifiManager.addParameter(&deviceParam);
   wifiManager.addParameter(&backendParam);
   bool res = wifiManager.autoConnect("MedLens-Glass-Setup", "12345678");
   if (!res) {
     Serial.println("Failed to connect");
     return false;
   }
   String m = modeParam.getValue();
   m.toLowerCase();
   if (m == "cloud") {
     appConfig.mode = MODE_CLOUD;
   } else {
     appConfig.mode = MODE_LOCAL;
   }
   appConfig.deviceId = String(deviceParam.getValue());
   appConfig.backendUrl = String(backendParam.getValue());
   if (appConfig.deviceId.length() == 0) {
     appConfig.deviceId = DEFAULT_DEVICE_ID;
   }
   if (appConfig.backendUrl.length() == 0) {
     appConfig.backendUrl = DEFAULT_BACKEND_URL;
   }
   saveAppConfig();
   return true;
 }
 
 void sendHeartbeat() {
   if (WiFi.status() != WL_CONNECTED) return;
   camera_fb_t* fb = esp_camera_fb_get();
   if (!fb) {
     Serial.println("Camera capture failed");
     return;
   }
   HTTPClient http;
   bool useTls = appConfig.backendUrl.startsWith("https");
   WiFiClientSecure secureClient;
   if (useTls) {
     secureClient.setInsecure();
     http.begin(secureClient, appConfig.backendUrl);
   } else {
     http.begin(appConfig.backendUrl);
   }
   String boundary = "------------------------735323031399963166993862";
   String head = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
   String tail = "\r\n--" + boundary + "--\r\n";
   String extra = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"device_id\"\r\n\r\n" + appConfig.deviceId + "\r\n";
   extra += "--" + boundary + "\r\nContent-Disposition: form-data; name=\"battery\"\r\n\r\n85\r\n";
   size_t allLen = extra.length() + head.length() + fb->len + tail.length();
   http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
   http.addHeader("Content-Length", String(allLen));
   uint8_t* buffer = (uint8_t*)ps_malloc(allLen);
   if (!buffer) {
     Serial.println("Malloc failed");
     esp_camera_fb_return(fb);
     return;
   }
   size_t offset = 0;
   memcpy(buffer + offset, extra.c_str(), extra.length());
   offset += extra.length();
   memcpy(buffer + offset, head.c_str(), head.length());
   offset += head.length();
   memcpy(buffer + offset, fb->buf, fb->len);
   offset += fb->len;
   memcpy(buffer + offset, tail.c_str(), tail.length());
   offset += tail.length();
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
 
 void setup() {
   WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
   Serial.begin(115200);
   Serial.println();
   Serial.println("Starting MedLens Unified Firmware...");
   pinMode(LED_GPIO_NUM, OUTPUT);
   digitalWrite(LED_GPIO_NUM, LOW);
   loadAppConfig();
   if (!initCamera()) {
     return;
   }
   if (!configureWifi()) {
     ESP.restart();
   }
   initOled();
   if (appConfig.mode == MODE_LOCAL) {
     startCameraServer();
     Serial.print("Camera Ready! Use 'http://");
     Serial.print(WiFi.localIP());
     Serial.println("' to connect");
     showIpScreen();
     waitingForAppConnection = true;
     lastStatusMillis = millis();
   } else {
     showDeviceIdScreen();
     lastSyncTime = millis();
   }
 }
 
 void loop() {
   unsigned long now = millis();
   if (appConfig.mode == MODE_CLOUD) {
     if (now - lastSyncTime > SYNC_INTERVAL_MS) {
       sendHeartbeat();
       lastSyncTime = now;
     }
   }
   if (hasDisplayFrame) {
     unsigned long interval = isAlert ? 300 : 800;
     if (now - lastBlinkMillis >= interval) {
       lastBlinkMillis = now;
       headerVisible = !headerVisible;
       drawDisplayFrame(headerVisible);
     }
   }
   if (appConfig.mode == MODE_LOCAL && !waitingForAppConnection) {
     if (now - lastStatusMillis > APP_DISCONNECT_TIMEOUT) {
       waitingForAppConnection = true;
       hasDisplayFrame = false;
       showIpScreen();
     }
   }
   delay(10);
 }
