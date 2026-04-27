# How to Run the FYP2 Project

This project consists of two main components:
1. **Java Application** - Pakistan Rainfall Data Fetcher using NASA POWER API
2. **Node.js/React Application** - Sentinel Weather and Flood Risk Assessment System

## Prerequisites

Before running the application, you need to install the following:

### 1. Java JDK 11
- **Download**: https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
- **File**: `jdk-11.0.21_windows-x64_bin.exe`
- **Setup**: After installation, set `JAVA_HOME` environment variable and add `%JAVA_HOME%\bin` to PATH

### 2. Maven 3.9.6
- **Download**: https://maven.apache.org/download.cgi
- **File**: `apache-maven-3.9.6-bin.zip`
- **Setup**: Extract to `C:\Program Files\Apache\maven`, set `MAVEN_HOME` environment variable, and add `%MAVEN_HOME%\bin` to PATH

### 3. Node.js (includes npm)
- **Download**: https://nodejs.org/
- **Version**: LTS (Long Term Support) version
- **Setup**: The installer automatically adds Node.js and npm to PATH

## Quick Start

### Option 1: Automated Setup (Recommended)
1. **Run as Administrator**: Right-click on `INSTALL_PREREQUISITES.bat` and select "Run as administrator"
2. **Follow the prompts** to install all prerequisites
3. **Run the application**: Double-click `run_application.bat`

### Option 2: Manual Setup
1. **Install prerequisites** manually using the links above
2. **Verify installation** by opening Command Prompt and running:
   ```cmd
   java -version
   mvn -version
   node -v
   npm -v
   ```
3. **Run the application**: Double-click `run_application.bat`

## What the Application Does

### Java Component
- Fetches rainfall data for any location worldwide using NASA POWER API
- Uses OpenStreetMap for location geocoding
- Provides detailed rainfall statistics for the past 7 days

### Node.js/React Component
- **Frontend**: React application for weather and flood risk assessment
- **Backend**: Express.js server with MongoDB integration
- **Features**:
  - User authentication and registration
  - Real-time weather data
  - Flood risk assessment
  - Community features
  - Emergency contacts
  - Risk assessment tools

## Application URLs

When running, the application will be available at:
- **Frontend (React)**: http://localhost:3001
- **Backend API**: http://localhost:3000

## Troubleshooting

### Common Issues

1. **"java is not recognized"**
   - Java is not installed or not in PATH
   - Set JAVA_HOME environment variable
   - Add %JAVA_HOME%\bin to PATH

2. **"mvn is not recognized"**
   - Maven is not installed or not in PATH
   - Set MAVEN_HOME environment variable
   - Add %MAVEN_HOME%\bin to PATH

3. **"node is not recognized"**
   - Node.js is not installed or not in PATH
   - Reinstall Node.js from https://nodejs.org/

4. **"npm is not recognized"**
   - npm comes with Node.js
   - Reinstall Node.js if npm is missing

5. **Build failures**
   - Check internet connection (required for downloading dependencies)
   - Ensure all prerequisites are properly installed
   - Try running as administrator

### Environment Variables Setup

#### For Java:
```
JAVA_HOME = C:\Program Files\Java\jdk-11.0.21
PATH = ...;%JAVA_HOME%\bin
```

#### For Maven:
```
MAVEN_HOME = C:\Program Files\Apache\maven\apache-maven-3.9.6
PATH = ...;%MAVEN_HOME%\bin
```

#### For Node.js:
- Automatically set by the installer

## Manual Commands

If you prefer to run commands manually:

### Build Java Application:
```cmd
mvn clean compile
```

### Run Java Application:
```cmd
mvn exec:java -Dexec.mainClass="com.nasa.power.PakistanRainfallApp"
```

### Install Node.js Dependencies:
```cmd
cd js
npm install
cd client
npm install
cd ..
```

### Run Node.js Application:
```cmd
cd js
npm run dev
```

## Project Structure

```
FYP2/
├── src/main/java/com/nasa/power/     # Java application
├── js/                               # Node.js/React application
│   ├── client/                       # React frontend
│   ├── src/                          # Backend services
│   └── server.js                     # Main server file
├── datasets/                         # CSV data files
├── images/                           # Application images
├── run_application.bat               # Main run script
├── setup_and_run.bat                # Setup and run script
├── INSTALL_PREREQUISITES.bat        # Prerequisites installer
└── HOW_TO_RUN.md                    # This file
```

## Support

If you encounter any issues:
1. Check that all prerequisites are installed correctly
2. Verify environment variables are set
3. Ensure you're running from the correct directory
4. Try running as administrator
5. Check internet connection for dependency downloads

## Features Overview

### Weather Data
- Real-time weather information
- 7-day weather forecasts
- Historical rainfall data
- NASA POWER API integration

### Flood Risk Assessment
- Location-based risk analysis
- Water level monitoring
- Risk visualization
- Emergency alerts

### Community Features
- User registration and authentication
- Community posts and discussions
- Emergency contact sharing
- Risk assessment sharing

### Emergency Services
- SOS functionality
- Nearby hospital finder
- Emergency contact management
- Survival kit recommendations
