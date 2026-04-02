/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          AgriNova IoT Sensor Node - ESP32 Firmware          ║
 * ║         Sends real-time farm data to AgriNova Backend       ║
 * ║                    Version 3.0 - Fixed                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * WIRING GUIDE:
 * ┌─────────────────┬────────────┬─────────────────────────────────┐
 * │ Sensor          │ ESP32 Pin  │ Notes                           │
 * ├─────────────────┼────────────┼─────────────────────────────────┤
 * │ DHT11 Data      │ GPIO 4     │ 10K pull-up resistor to 3.3V   │
 * │ Soil Moisture   │ GPIO 36    │ Analog (A0), 0-4095 on ESP32   │
 * │ LDR (Light)     │ GPIO 34    │ Voltage divider with 10K ohm   │
 * │ Rain Sensor     │ GPIO 35    │ Analog rain detection           │
 * │ Built-in LED    │ GPIO 2     │ Status indicator (onboard)     │
 * └─────────────────┴────────────┴─────────────────────────────────┘
 *
 * REQUIRED LIBRARIES (Install via Arduino IDE > Tools > Library Manager):
 *   1. "DHT sensor library" by Adafruit
 *   2. "Adafruit Unified Sensor" by Adafruit (dependency)
 *   3. "ArduinoJson" by Benoit Blanchon (v6.x)
 *   4. WiFi & HTTPClient (built-in for ESP32 board package)
 *
 * BOARD SETUP (Arduino IDE):
 *   Tools > Board > ESP32 Arduino > "ESP32 Dev Module"
 *   Tools > Upload Speed > 115200
 *   Tools > Port > (your COM port)
 *
 * FOR NodeMCU (ESP8266) INSTEAD:
 *   Replace: #include <WiFi.h>       → #include <ESP8266WiFi.h>
 *   Replace: #include <HTTPClient.h> → #include <ESP8266HTTPClient.h>
 *   Replace: #include <WiFiClient.h> → (not needed for ESP8266)
 *   Analog pins: Only A0 available; soil, light, rain need multiplexer
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== CONFIGURATION (CHANGE THESE) ====================

// WiFi credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";       // <- apna WiFi naam daalein
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // <- apna WiFi password daalein

// AgriNova Backend URL
// Option A: Local network (laptop & ESP32 same WiFi)
//   1. Run 'ipconfig' in Windows CMD to find your laptop's IPv4 address
//   2. Replace 192.168.1.100 with your laptop's actual IP
//   3. Port MUST be 8007 (AgriNova runs on 8007)
const char* AGRINOVA_URL = "http://10.33.139.117:8007/api/sensor";

// Option B: Tunnel URL (for remote access via serveo/ngrok)
//   Uncomment the line below and paste your tunnel URL (from tunnel_url.txt)
//   Comment out Option A above
// const char* AGRINOVA_URL = "https://your-tunnel-url.serveo.net/api/sensor";

// Device name — shown in backend dashboard
const char* DEVICE_ID = "ESP32-AgriNova-01";

// How often to send data (milliseconds)
const unsigned long SEND_INTERVAL = 10000;  // 10 seconds

// ==================== PIN DEFINITIONS ====================
#define DHTPIN      4     // DHT11/DHT22 data pin
#define DHTTYPE     DHT11 // Change to DHT22 if you have DHT22
#define SOIL_PIN    36    // Soil moisture sensor analog output (GPIO36 = A0)
#define LDR_PIN     34    // Light dependent resistor analog output
#define RAIN_PIN    35    // Rain sensor analog output
#define LED_PIN     2     // Built-in LED (GPIO2 on most ESP32 boards)

// ==================== GLOBALS ====================
DHT dht(DHTPIN, DHTTYPE);
unsigned long lastSendTime = 0;
int successCount = 0;
int failCount    = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════╗");
  Serial.println("║    AgriNova IoT Sensor Node v3.0         ║");
  Serial.println("║    ESP32 → AgriNova Backend Bridge       ║");
  Serial.println("╚══════════════════════════════════════════╝");
  Serial.println();

  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // GPIO36 and GPIO34 are input-only pins, no need to set pinMode
  // pinMode(SOIL_PIN, INPUT);  // Optional, already input-only
  // pinMode(LDR_PIN, INPUT);   // Optional, already input-only

  // Initialize DHT sensor
  dht.begin();
  Serial.println("[SENSOR] DHT11 initialized on GPIO " + String(DHTPIN));

  // Connect to WiFi
  connectWiFi();
}

// ==================== MAIN LOOP ====================
void loop() {
  // Auto-reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection lost. Reconnecting...");
    connectWiFi();
    return;
  }

  // Send data at defined interval
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    readAndSend();
  }
}

// ==================== READ SENSORS & SEND ====================
void readAndSend() {
  // --- Read DHT11 ---
  float temperature = dht.readTemperature(); // Celsius
  float humidity    = dht.readHumidity();    // %

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[ERROR] DHT read failed! Check wiring: DATA→GPIO4, VCC→3.3V, GND→GND");
    blinkLED(5, 100); // Fast blink = sensor error
    return;
  }

  // --- Read Analog Sensors (ESP32 = 12-bit ADC, range 0-4095) ---
  int soilRaw  = analogRead(SOIL_PIN); // 0=wet, 4095=dry (most capacitive sensors)
  int lightRaw = analogRead(LDR_PIN);  // 0=dark, 4095=bright (with voltage divider)
  int rainRaw  = analogRead(RAIN_PIN); // 0=heavy rain, 4095=dry (most rain sensors)

  // Scale soil moisture to 0-1023 (backend /api/sensor expects this range
  // and converts it to percentage: (1023 - value) / 1023 * 100)
  int soilMoisture = map(soilRaw, 0, 4095, 0, 1023);

  // Scale light to 0-100%
  float lightLevel = map(lightRaw, 0, 4095, 0, 100);

  // Scale rain to 0-100 (inverted: 0 = heavy rain, 100 = dry on most modules)
  float rainLevel = map(rainRaw, 0, 4095, 0, 100);

  // --- Print to Serial Monitor ---
  Serial.println();
  Serial.println("─── AgriNova Sensor Reading ─────────────────");
  Serial.printf("  🌡  Temperature  : %.1f °C\n",   temperature);
  Serial.printf("  💧 Humidity     : %.1f %%\n",    humidity);
  Serial.printf("  🌱 Soil Moisture: %d (raw %d → %d/1023 for backend)\n", soilRaw, soilRaw, soilMoisture);
  Serial.printf("  ☀  Light Level  : %.0f %%\n",    lightLevel);
  Serial.printf("  🌧  Rain Level   : %.0f %%\n",   rainLevel);
  Serial.printf("  📡 Target URL   : %s\n",         AGRINOVA_URL);
  Serial.printf("  ✅ Success: %d  ❌ Fail: %d\n",  successCount, failCount);
  Serial.println("──────────────────────────────────────────────");

  // --- Send to AgriNova ---
  sendToAgriNova(temperature, humidity, soilMoisture, lightLevel, rainLevel);
}

// ==================== SEND DATA TO BACKEND ====================
void sendToAgriNova(float temp, float hum, int soilMoisture, float light, float rain) {
  WiFiClient wifiClient;
  HTTPClient http;

  http.begin(wifiClient, AGRINOVA_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000); // 8 second timeout

  // Build JSON payload — field names MUST match SensorPayload in main.py
  // Backend model: temperature, humidity, soil_moisture, light, rain, device_id
  StaticJsonDocument<256> doc;
  doc["temperature"]   = serialized(String(temp, 1));   // 1 decimal place
  doc["humidity"]      = serialized(String(hum, 1));
  doc["soil_moisture"] = soilMoisture;                  // 0-1023 raw (backend converts to %)
  doc["light"]         = (int)light;                    // 0-100
  doc["rain"]          = (int)rain;                     // 0-100
  doc["device_id"]     = DEVICE_ID;

  String payload;
  serializeJson(doc, payload);

  Serial.print("[HTTP] POSTing payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] ✅ Response %d: %s\n", httpCode, response.c_str());

    if (httpCode == 200 || httpCode == 201) {
      successCount++;
      blinkLED(2, 150); // Double blink = success
    } else {
      failCount++;
      Serial.printf("[HTTP] Unexpected code %d\n", httpCode);
    }
  } else {
    failCount++;
    Serial.printf("[HTTP] ❌ POST failed: %s\n", http.errorToString(httpCode).c_str());
    Serial.println("[HTTP] Troubleshooting:");
    Serial.println("  1. Is the AgriNova backend running? (python -m uvicorn app.main:app --port 8007)");
    Serial.println("  2. Is the IP correct? Run 'ipconfig' on your laptop");
    Serial.println("  3. Are both devices on the same WiFi?");
    blinkLED(3, 300); // Triple blink = HTTP error
  }

  http.end();
}

// ==================== WiFi CONNECTION ====================
void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink while connecting
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] ✅ Connected!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    digitalWrite(LED_PIN, HIGH); // Solid ON = connected
  } else {
    Serial.println("[WiFi] ❌ Could not connect. Check SSID/Password.");
    Serial.println("[WiFi] Retrying in 10 seconds...");
    digitalWrite(LED_PIN, LOW);
    delay(10000);
  }
}

// ==================== LED STATUS BLINKER ====================
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
  }
}
