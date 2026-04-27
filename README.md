# 🛡️ Sentinel: AI-Powered Disaster Management & Early Warning System

Sentinel is a comprehensive, multi-platform ecosystem designed for real-time disaster monitoring, flood/landslide prediction, and community-driven emergency response. It integrates satellite data, AI-driven predictive modeling, and a robust community hub to provide a 360-degree safety net for high-risk areas.

---

## 🚀 Key Modules

### 1. 🧠 AI Prediction Engine (Python)
The brains of Sentinel. Using historical weather patterns, terrain data, and soil moisture levels, this module predicts potential hazards with high accuracy.
- **Flood Prediction**: Multi-layer neural networks analyzing rainfall intensity and river proximity.
- **Landslide Prediction**: Specialized models assessing terrain slope, soil type, and saturation levels.
- **Automated Training**: Scripts for regularized model training and synthetic data generation.

### 2. 🌐 Sentinel Core API (Node.js/Express)
A robust backend that orchestrates data flow between the AI engine, satellite APIs, and the user interface.
- **Real-time Monitoring**: Integrates NASA POWER and OpenMeteo APIs for precise weather tracking.
- **SOS System**: One-click distress alerts sent to verified emergency contacts with live GPS coordinates.
- **Hospital Locator**: Intelligent mapping of nearby healthcare facilities in disaster zones.
- **Medibot**: An AI-driven health assistant for immediate first-aid guidance.

### 3. 🌧️ Satellite Data Fetcher (Java/Maven)
A high-performance utility designed to pull granular environmental data for any coordinate globally.
- **NASA Integration**: Fetches 7-day historical rainfall data.
- **Global Reach**: Powered by OpenStreetMap geocoding for precise location targeting.
- **Statistical Analysis**: Provides daily rainfall metrics, averages, and peak intensity logs.

### 4. 🤝 Community Sentinel Hub (React/Web)
A community-driven platform for crowd-sourced intelligence.
- **Hazard Reporting**: Users can report floods, road blocks, or landslides with photos and addresses.
- **Live Feed**: A real-time map showing verified hazard reports from the community.
- **Emergency Networking**: Manage verified emergency contacts and respond to SOS requests.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express, Java (Spring/Maven) |
| **Database** | MongoDB Atlas |
| **AI/ML** | Python, TensorFlow, Scikit-learn, Pandas |
| **Frontend** | React.js, Vanilla CSS |
| **APIs** | NASA POWER, OpenMeteo, OpenStreetMap, Nominatim |

---

## 📦 Project Structure

```bash
Sentinel/
├── ai_models/           # Trained ML models and Python inference scripts
├── js/                  # Node.js Backend & React Frontend source
│   ├── server.js        # Main API Entry point
│   ├── src/             # Backend service logic
│   └── client/          # React application source
├── src/                 # Java Rainfall Fetcher source (Maven structure)
├── datasets/            # Training data for AI models
├── tools/               # Automation and utility scripts
└── .gitignore           # Optimized for Java, Node, and Python
```

---

## 🚦 Getting Started

### Prerequisites
- **Java 11+** & **Maven 3.9+**
- **Node.js 18+**
- **Python 3.10+** (with `pip install tensorflow scikit-learn pandas`)
- **MongoDB Atlas** account

### Setup & Run
1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your API keys and MongoDB URI.
2. **Automated Setup**: Run `COMPLETE_SETUP.bat` to initialize dependencies and environment.
2. **Launch Application**: Execute `run_application.bat` to start the backend and frontend services.
3. **Training AI**: Navigate to the root and run `python train_model.py` to refresh prediction models.

---

## 📡 API Integration
- **NASA POWER**: Historical environmental data.
- **OpenMeteo**: High-precision weather forecasts.
- **OpenStreetMap**: Geocoding and nearest-waterbody mapping.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed as a Final Year Project (FYP) for Sentinel Systems.*
