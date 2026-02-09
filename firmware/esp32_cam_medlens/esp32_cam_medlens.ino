#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "fb_gfx.h"
#include "soc/soc.h" //disable brownout problems
#include "soc/rtc_cntl_reg.h"  //disable brownout problems
#include "esp_http_server.h"

// ===================
// Select Camera Model
// ===================
//#define CAMERA_MODEL_AI_THINKER // Has PSRAM
//#include "camera_pins.h"

// ----------------------------------------------------------------------
// OPTION 1: AI THINKER ESP32-CAM (Standard cheap board) - COMMENTED OUT
// ----------------------------------------------------------------------
/*
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM     0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM       5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
*/

// ----------------------------------------------------------------------
// OPTION 2: ESP32 WROVER DEV / FREENOVE (Newer boards with USB) - ACTIVE
// ----------------------------------------------------------------------
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

// LED Pin (2 is standard onboard LED for Wrover, 4 is usually used for Camera Data 2 on Wrover!)
#define LED_GPIO_NUM      2

// ===================
// Server Configuration
// ===================
httpd_handle_t camera_httpd = NULL;
httpd_handle_t stream_httpd = NULL;

// ===================
// Status Variables
// ===================
String lastDisplayMessage = "Ready";
bool isAlert = false;

// ===================
// Camera Handler (Capture)
// ===================
static esp_err_t capture_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;
    int64_t fr_start = esp_timer_get_time();

    fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Camera capture failed");
        httpd_resp_send_500(req);
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "image/jpeg");
    httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=capture.jpg");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
    esp_camera_fb_return(fb);
    
    int64_t fr_end = esp_timer_get_time();
    Serial.printf("JPG: %uB %ums\n", (uint32_t)(fb->len), (uint32_t)((fr_end - fr_start)/1000));
    return res;
}

// ===================
// Stream Handler
// ===================
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

static esp_err_t stream_handler(httpd_req_t *req) {
    camera_fb_t * fb = NULL;
    esp_err_t res = ESP_OK;
    size_t _jpg_buf_len = 0;
    uint8_t * _jpg_buf = NULL;
    char * part_buf[64];

    res = httpd_resp_set_type(req, _STREAM_CONTENT_TYPE);
    if(res != ESP_OK) return res;

    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

    while(true){
        fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("Camera capture failed");
            res = ESP_FAIL;
        } else {
            if(fb->format != PIXFORMAT_JPEG){
                bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
                esp_camera_fb_return(fb);
                fb = NULL;
                if(!jpeg_converted){
                    Serial.println("JPEG compression failed");
                    res = ESP_FAIL;
                }
            } else {
                _jpg_buf_len = fb->len;
                _jpg_buf = fb->buf;
            }
        }
        if(res == ESP_OK){
            size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
            res = httpd_resp_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
            if(res == ESP_OK){
                res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
            }
            if(res == ESP_OK){
                res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
            }
        }
        if(fb){
            esp_camera_fb_return(fb);
            fb = NULL;
            _jpg_buf = NULL;
        } else if(_jpg_buf){
            free(_jpg_buf);
            _jpg_buf = NULL;
        }
        if(res != ESP_OK){
            break;
        }
    }
    return res;
}

// ===================
// Status Handler
// ===================
static esp_err_t status_handler(httpd_req_t *req) {
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    
    int battery = 100; 
    
    char json_response[100];
    snprintf(json_response, sizeof(json_response), "{\"status\":\"ok\",\"battery\":%d,\"display\":\"%s\"}", battery, lastDisplayMessage.c_str());
    
    return httpd_resp_send(req, json_response, strlen(json_response));
}

// ===================
// Display Handler (Receive Data)
// ===================
static esp_err_t display_handler(httpd_req_t *req) {
    char content[100];
    size_t recv_size = (req->content_len < sizeof(content)) ? req->content_len : sizeof(content);
    int ret = httpd_req_recv(req, content, recv_size);
    
    if (ret <= 0) {
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            httpd_resp_send_408(req);
        }
        return ESP_FAIL;
    }
    content[recv_size] = 0; // Null terminate

    // TODO: Parse JSON here. For now, just print the raw body
    Serial.printf("Received Display Data: %s\n", content);
    lastDisplayMessage = String(content);
    
    // Blink LED if "alert" is in content
    if (strstr(content, "alert")) {
        digitalWrite(LED_GPIO_NUM, HIGH); // Flash Flashlight/LED
        delay(200);
        digitalWrite(LED_GPIO_NUM, LOW);
    }

    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    const char* resp = "{\"success\":true}";
    httpd_resp_send(req, resp, strlen(resp));
    return ESP_OK;
}

// ===================
// Reset WiFi Handler
// ===================
static esp_err_t reset_wifi_handler(httpd_req_t *req) {
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

// ===================
// Options Handler (CORS)
// ===================
static esp_err_t options_handler(httpd_req_t *req) {
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
        .uri       = "/capture",
        .method    = HTTP_GET,
        .handler   = capture_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t stream_uri = {
        .uri       = "/stream",
        .method    = HTTP_GET,
        .handler   = stream_handler,
        .user_ctx  = NULL
    };
    
    httpd_uri_t status_uri = {
        .uri       = "/status",
        .method    = HTTP_GET,
        .handler   = status_handler,
        .user_ctx  = NULL
    };
    
    httpd_uri_t display_uri = {
        .uri       = "/display",
        .method    = HTTP_POST,
        .handler   = display_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t reset_wifi_uri = {
        .uri       = "/reset_wifi",
        .method    = HTTP_GET,
        .handler   = reset_wifi_handler,
        .user_ctx  = NULL
    };

    httpd_uri_t options_uri = {
        .uri       = "/display",
        .method    = HTTP_OPTIONS,
        .handler   = options_handler,
        .user_ctx  = NULL
    };

    if (httpd_start(&camera_httpd, &config) == ESP_OK) {
        httpd_register_uri_handler(camera_httpd, &capture_uri);
        httpd_register_uri_handler(camera_httpd, &stream_uri);
        httpd_register_uri_handler(camera_httpd, &status_uri);
        httpd_register_uri_handler(camera_httpd, &display_uri);
        httpd_register_uri_handler(camera_httpd, &reset_wifi_uri);
        httpd_register_uri_handler(camera_httpd, &options_uri);
    }
}

void setup() {
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); //disable brownout detector
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.println();

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
        config.frame_size = FRAMESIZE_UXGA;
        config.jpeg_quality = 10;
        config.fb_count = 2;
    } else {
        config.frame_size = FRAMESIZE_SVGA;
        config.jpeg_quality = 12;
        config.fb_count = 1;
    }

    // Camera init
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x", err);
        return;
    }

    // ===================
    // WiFi Connection (WiFiManager)
    // ===================
    WiFiManager wifiManager;
    
    // Uncomment to reset settings for testing:
    // wifiManager.resetSettings();
    
    // Custom IP configuration (optional, defaults to DHCP)
    // wifiManager.setSTAStaticIPConfig(IPAddress(192,168,1,99), IPAddress(192,168,1,1), IPAddress(255,255,255,0));

    // Connect to WiFi or create AP "MedLens-Glass-Setup" if connection fails
    bool res = wifiManager.autoConnect("MedLens-Glass-Setup", "12345678"); // AP Name, AP Password

    if(!res) {
        Serial.println("Failed to connect");
        ESP.restart();
    } 
    else {
        // if you get here you have connected to the WiFi    
        Serial.println("WiFi connected...yeey :)");
    }
    
    startCameraServer();
    
    Serial.print("Camera Ready! Use 'http://");
    Serial.print(WiFi.localIP());
    Serial.println("' to connect");
    
    // Flash LED to indicate ready
    pinMode(LED_GPIO_NUM, OUTPUT);
    digitalWrite(LED_GPIO_NUM, HIGH);
    delay(100);
    digitalWrite(LED_GPIO_NUM, LOW);
}

void loop() {
    delay(10000);
}
