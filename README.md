# 🌱 AgriNova – Smart AI + IoT Farming Assistant

## 🚨 Problem Statement
Farmers in India often face challenges such as:
- ❌ Incorrect crop selection
- ❌ Lack of real-time market price awareness
- ❌ Poor soil monitoring
- ❌ Dependence on traditional guesswork

This leads to **low productivity, reduced profit, and high risk of crop failure**.

---

## 💡 Proposed Solution
**AgriNova** is an AI-powered smart farming system that integrates:
- 📡 IoT sensors (real-time soil & environmental data)
- 🌦️ Weather APIs
- 📊 Market price APIs
- 🤖 AI-based decision-making

👉 It helps farmers **choose the most profitable crop** based on real-time conditions.

---

## 🎯 Key Features
- 🌱 Smart Crop Recommendation
- 📊 Real-time Soil Monitoring
- 🌦️ Weather-based Suggestions
- 💰 Profit Optimization using Market Data
- 📡 IoT Integration (ESP32 + Sensors)
- 🌐 Web Dashboard for Visualization

---

## 🧠 Agent-Based System (Core Innovation)

AgriNova uses multiple intelligent agents:

### 🟢 Soil Intelligence Agent
- Analyzes soil moisture & quality
- Determines soil suitability

### 🔵 Weather Intelligence Agent
- Uses weather API
- Predicts environmental conditions

### 🟡 Market Intelligence Agent
- Fetches mandi prices using APIs
- Suggests most profitable crops

👉 Final output = Combined decision from all agents

---

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, Pydantic.
- **Frontend:** HTML5, Vanilla CSS3, JavaScript (ES6+), FontAwesome.
- **Data:** CSV-based crop reference library.

### 🔹 Hardware
- ESP32 / NodeMCU
- Soil Moisture Sensor
- DHT11 (Temperature & Humidity)

### 🔹 Software
- Frontend: HTML, CSS, JavaScript
- Backend: Python / Node.js
- APIs:
  - Weather API
  - Agmarknet (Mandi Prices)

### 🔹 Deployment
- GitHub
- Netlify

---

## 🔄 System Workflow

1. Sensors collect real-time data (soil moisture, temperature)
2. ESP32 sends data to backend via WiFi
3. Backend fetches:
   - Weather data
   - Market prices
4. AI model processes all inputs
5. System outputs:
   👉 Best crop recommendation  
   👉 Profit insights  
6. Results displayed on web dashboard

---

## 📡 Hardware Integration

### Components:
- ESP32
- Soil Moisture Sensor
- DHT11 Sensor

### Working:
- Sensors → ESP32 → WiFi → Backend API → Dashboard

---
## 📖 How to Demo
Follow these steps for a perfect demonstration of AgriNova's capabilities:

### **Scenario 1: High-Yield Banana Recommendation (Expert Force)**
*   **Inputs:** N: 100, P: 80, K: 200, pH: 6.0
*   **Environment:** Set `Rainfall (mm)` to 180 and `Humidity (%)` to 85 in simulation.
*   **Outcome:** Expect a high-confidence (**97%+**) recommendation for Banana, utilizing the Expert Model override.

### **Scenario 2: Dry-Condition Chickpea Advice**
*   **Inputs:** N: 40, P: 65, K: 80, pH: 7.0
*   **Environment:** Set `Humidity (%)` to 20 and `Temperature (°C)` to 22.
*   **Outcome:** Expect a Chickpea recommendation, highlighting the system's sensitivity to low moisture.

---
**AgriNova – Future-Proofing Agriculture, One Crop at a Time.**

## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/Shivilyadav/AgriNova.git
cd AgriNova
