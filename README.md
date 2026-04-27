# 🛡️ Sentinel: AI-Powered Hazard Relief System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

**Sentinel** is a state-of-the-art, end-to-end disaster management and hazard relief platform. It leverages Artificial Intelligence, real-time meteorological data, and community-driven insights to predict, monitor, and mitigate the impact of natural disasters—with a primary focus on flood management and relief in regions like Pakistan.

---

## 🚀 Key Features

### 🧠 AI-Driven Flood Prediction
*   **Predictive Analytics**: Utilizes a Random Forest ML model trained on historical rainfall and geographic data to forecast flood risks with high accuracy.
*   **Historical Analysis**: Integrated Java-based engine that fetches and processes 30+ years of NASA POWER meteorological data.

### 🌊 Real-Time Monitoring
*   **Live Water Levels**: Real-time integration with **DAHITI** (Database for Hydrological Time Series) and **OpenMeteo** to monitor inland water bodies.
*   **Dynamic Risk Assessment**: Continuously evaluates risk based on current rainfall, terrain elevation, and proximity to water bodies (via OpenStreetMap).

### 🏥 Emergency Response & Relief
*   **SOS Alert System**: Rapid emergency signal broadcasting with precise location tracking.
*   **Resource Locator**: Intelligent search for nearby hospitals, emergency shelters, and relief centers.
*   **Community Support**: A platform for users to share real-time updates, verify hazard locations, and coordinate volunteer efforts.

### 🎒 Disaster Preparedness
*   **Smart Survival Kits**: AI-generated recommendations for disaster kits tailored to the specific risk level of the user's location.
*   **Interactive Maps**: High-fidelity Leaflet-based maps showing hazard zones and evacuation routes.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Leaflet.js, CSS3 (Modern Glassmorphism) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **Data Engine** | Java 11, Maven (NASA POWER Integration) |
| **AI/ML** | Python 3, Scikit-learn (Random Forest) |
| **APIs** | NASA POWER, OpenWeather, OpenStreetMap (Nominatim), DAHITI |

---

## 📋 Prerequisites

Ensure you have the following installed:
*   **Java**: JDK 11 or higher
*   **Node.js**: v16.x or higher
*   **Python**: 3.8+ with `pip`
*   **Maven**: 3.9.x
*   **MongoDB**: An active Atlas cluster URI

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/amanasif01/Sentinel-AI-Powered-Hazard-Relief-System-.git
cd FYP2
```

### 2. Backend & Frontend Setup
```bash
# Install Node.js dependencies
cd js
npm install

# Install Frontend dependencies
cd client
npm install
cd ..
```

### 3. Java Engine Setup
```bash
# Return to root and compile Java components
cd ..
mvn clean compile
```

### 4. Python Environment
```bash
# Install required ML libraries
pip install scikit-learn pandas numpy joblib
```

---

## 🏃 Running the Application

### Automated Run
The project includes convenient batch scripts for Windows:
*   **Complete Setup**: Run `COMPLETE_SETUP.bat` (Run as Administrator)
*   **Start Application**: Run `run_application.bat`

### Manual Run
1.  **Start the Backend**:
    ```bash
    cd js
    node server.js
    ```
2.  **Start the React Client**:
    ```bash
    cd js/client
    npm start
    ```
3.  **Run Flood Prediction Script** (Optional):
    ```bash
    python predict_flood.py
    ```

---

## 📂 Project Structure

```text
FYP2/
├── js/                    # Core Node.js Backend
│   ├── client/            # React.js Frontend
│   ├── src/               # Service Layer (Auth, Flood, Weather, etc.)
│   └── server.js          # Express Entry Point
├── src/main/java/         # Java Data Extraction Engine
├── models/                # Trained AI/ML Models (.pkl)
├── datasets/              # Training and Historical CSV Data
├── images/                # UI Assets and Documentation Media
├── pom.xml                # Maven Configuration
└── README.md              # Project Documentation
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Acknowledgments
*   NASA POWER API for providing critical meteorological data.
*   The DAHITI database for hydrological monitoring.
*   OpenStreetMap contributors for geographic data.

---
*Created with ❤️ by the Sentinel Team.*
