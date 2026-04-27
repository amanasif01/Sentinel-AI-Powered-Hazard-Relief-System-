# Weather API Setup Instructions

## To Enable Future Weather Predictions

Your rainfall application now supports **both historical data AND future weather predictions**! 

### Step 1: Get Free API Key
1. Go to: https://openweathermap.org/api
2. Click "Sign Up" and create a free account
3. After signing in, go to "My API Keys"
4. Copy your API key

### Step 2: Configure the API Key
1. Open `config.properties` file
2. Replace `YOUR_API_KEY_HERE` with your actual API key
3. Save the file

Example:
```properties
openweathermap.api.key=abc123def456ghi789jkl012mno345pqr678stu901
```

### Step 3: Run Your Enhanced App
```cmd
run_simple.bat
```

## What You'll Get:

### Historical Data (Past 7 Days):
- ✅ Rainfall measurements from NASA POWER API
- ✅ Daily breakdown with descriptions
- ✅ Statistical summaries

### Future Predictions (Next 7 Days):
- 🌤️ Temperature forecasts (min/max)
- 💧 Humidity predictions
- 🌧️ Rainfall probability
- ☁️ Weather descriptions
- 📊 Daily summaries

## Free API Limits:
- **1,000 calls per day** (more than enough for personal use)
- **5-day forecasts** with 3-hour intervals
- **Global coverage** for any location

## Example Output:
```
=== Rainfall Data for Islamabad (Past 7 Days) ===
Date         Rainfall (mm)   Description
2025-08-14   9.45            Heavy rain
...

=== Weather Forecast for Islamabad (Next 7 Days) ===
Date         Temperature        Humidity    Rainfall    Weather
2025-08-24   25.2°C - 32.1°C   65%         2.3 mm     Partly cloudy
2025-08-25   24.8°C - 31.5°C   70%         0.0 mm     Clear sky
...
```

Get your free API key and enjoy both historical and future weather data! 🌍🌤️🌧️
