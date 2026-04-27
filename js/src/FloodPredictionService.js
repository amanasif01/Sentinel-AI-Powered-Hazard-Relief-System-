const { spawn } = require('child_process');
const path = require('path');

class FloodPredictionService {
    constructor(openMeteoService) {
        this.openMeteo = openMeteoService;
        // Path to the Python script - Assuming it's in the same parent directory or specific path
        this.pythonScriptPath = path.join(__dirname, '..', '..', 'ai model testing', 'run_test.py');
    }

    async predictFloodRisk(lat, lon, waterBodyData) {
        try {
            console.log(`[FloodPrediction] Starting prediction for ${lat}, ${lon}`);

            // 1. Fetch Live Environmental Data
            const weatherData = await this.openMeteo.getCurrentWeather(lat, lon);
            const rainfall = weatherData.rain || 0; // Current rainfall in mm

            // Use provided water body data
            const distance = waterBodyData.found ? waterBodyData.distanceMeters : 5000;
            const waterbodyName = waterBodyData.found ? (waterBodyData.name || "Unnamed Waterbody") : null;

            // 2. Water Level Strategy: TRUST THE SERVICE
            // The WaterLevelEstimationService now returns calculated levels in mm (model derived)
            let waterLevel = 0;
            if (waterBodyData.waterLevel && typeof waterBodyData.waterLevel.level === 'number') {
                waterLevel = waterBodyData.waterLevel.level;
                console.log(`[FloodPrediction] Using modelled water level: ${waterLevel}mm`);
            } else {
                // If service returned nothing (rare), assume 0
                waterLevel = 0;
            }

            // 3. Terrain Data
            const elevationData = await this.openMeteo.getElevation(lat, lon);
            const elevation = elevationData.elevation || 500;
            const slope = 2.5; // Placeholder until DEM integration

            console.log(`[FloodPrediction] Parameters: Rain=${rainfall}, Level=${waterLevel}, Elev=${elevation}, Slope=${slope}, Dist=${distance}`);

            // 4. Run AI Model (Python)
            const riskLocal = await this.runPythonPrediction(rainfall, waterLevel, elevation, slope, distance);
            const risksource = await this.runPythonPrediction(rainfall, waterLevel, elevation, slope, 50.0);

            console.log(`[FloodPrediction] Local Risk: ${riskLocal}, Source Risk: ${risksource}`);

            // 5. Intelligent Verdict Logic
            let finalVerdict = "SAFE";
            let severity = "Low";
            let riskScore = 5;
            let message = "Location appears safe.";

            // URBAN FLASH FLOOD LOGIC (For Islamabad/Cities)
            // If user is far from a river (>2km) BUT Heavy Rain + High Local Risk = Flash Flood
            const isUrbanFlashFlood = (distance > 2000 && rainfall > 30 && (riskLocal === 'High' || riskLocal === 'Very High'));

            if (isUrbanFlashFlood) {
                finalVerdict = "FLASH FLOOD WARNING";
                severity = "Critical";
                riskScore = 95;
                message = `URBAN FLASH FLOOD: Heavy rain (${rainfall}mm) causing flood risk at your location!`;
            } else if (riskLocal === 'High' || riskLocal === 'Very High') {
                finalVerdict = "CRITICAL";
                severity = "Critical";
                riskScore = 90;
                message = "CRITICAL: Flooding detectable at your exact location!";
            } else if (risksource === 'High' || risksource === 'Very High') {
                // Determine if river is relevant
                if (distance < 1000) {
                    finalVerdict = "WARNING";
                    severity = "High";
                    riskScore = 80;
                    message = `WARNING: Nearby ${waterbodyName || 'waterbody'} is overflowing.`;
                } else {
                    finalVerdict = "CAUTION";
                    severity = "Medium";
                    riskScore = 50;
                    message = `Caution: Nearby ${waterbodyName || 'river'} is high, stay away from banks.`;
                }
            } else if (waterLevel > 2000) {
                // High water level but model says safe (maybe elevation is high)
                finalVerdict = "ADVISORY";
                severity = "Medium";
                riskScore = 40;
                message = `Advisory: ${waterbodyName} levels are elevated (${waterLevel}mm).`;
            } else {
                finalVerdict = "SAFE";
                severity = "Low";
                riskScore = 5;
                message = "Conditions are normal.";
            }

            // 5. Calculate Weekly Visit Forecast (AI-POWERED)
            // Instead of a simple list, we predict the "Worst Case" scenario for the week
            let visitOutlook = {
                verdict: "Safe to Visit",
                color: "green",
                message: "No significant flood risks detected for the upcoming week."
            };

            try {
                // Fetch 7-day forecast
                const forecastData = await this.openMeteo.getDailyRainfallAnalysis(lat, lon, 0, 7);

                if (forecastData && forecastData.length > 0) {
                    // Find the day with the HIGHEST rainfall
                    const maxRainDay = forecastData.reduce((prev, current) =>
                        (prev.rainfall > current.rainfall) ? prev : current
                    );

                    console.log(`[FloodPrediction] Worst case scenario: ${maxRainDay.rainfall}mm on ${maxRainDay.date}`);

                    // AI CHECK: Run the prediction model for this specific future day
                    // We use the *future* rainfall but assume current water levels (or slightly elevated if rain is high)
                    const futureWaterLevel = waterLevel + (maxRainDay.rainfall * 10); // Rough estimation of rise
                    const futureRisk = await this.runPythonPrediction(
                        maxRainDay.rainfall,
                        futureWaterLevel,
                        elevation,
                        slope,
                        50.0 // Standard distance for safety check
                    );

                    console.log(`[FloodPrediction] Future AI Verdict: ${futureRisk}`);

                    // Formulate the Outlook Verdict based on AI result
                    if (futureRisk === "High" || futureRisk === "Very High") {
                        const dateObj = new Date(maxRainDay.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                        visitOutlook = {
                            verdict: "Avoid Travel",
                            color: "#ff4444", // Red
                            message: `AI Model predicts HIGH flood risk on ${dayName} due to forecasted storms (${maxRainDay.rainfall}mm).`
                        };
                    } else if (futureRisk === "Medium") {
                        const dateObj = new Date(maxRainDay.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                        visitOutlook = {
                            verdict: "Exercise Caution",
                            color: "#ff8800", // Orange
                            message: `Moderate risk detected around ${dayName}. Terrain analysis suggests possible water pooling.`
                        };
                    } else {
                        // Safe
                        visitOutlook = {
                            verdict: "Safe to Visit",
                            color: "#00cc44", // Green
                            message: "AI analysis confirmed safe conditions throughout the week."
                        };
                    }
                }
            } catch (e) {
                console.warn("[FloodPrediction] Failed to generate AI future outlook:", e);
            }

            return {
                success: true,
                verdict: finalVerdict,
                severity: severity,
                riskScore: riskScore,
                message: message,
                details: {
                    features: { rainfall, waterLevel, elevation, slope, distance },
                    predictions: { local: riskLocal, source: risksource },
                    waterbodyName: waterbodyName,
                    visitOutlook: visitOutlook // Return the smart summary
                }
            };

        } catch (error) {
            console.error("[FloodPrediction] Error:", error);
            return {
                success: false,
                error: error.message,
                verdict: "Unknown",
                riskScore: 0
            };
        }
    }

    /**
     * Spawns a python process to run the prediction
     */
    runPythonPrediction(rain, level, elev, slope, dist) {
        return new Promise((resolve, reject) => {
            // Arguments: [rainfall, water_level, elevation, slope, distance]
            const args = [String(rain), String(level), String(elev), String(slope), String(dist)];

            console.log(`[FloodPrediction] 🐍 CALLING PYTHON: python ${this.pythonScriptPath} ${args.join(' ')}`);
            const pythonProcess = spawn('python', [this.pythonScriptPath, ...args]);

            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('error', (err) => {
                console.error(`[FloodPrediction] ❌ PYTHON SPAWN FAILED: ${err.message}`);
                console.error(`[FloodPrediction] ⚠️ USING FALLBACK LOGIC`);
                // Fallback on spawn error
                if (dist < 200 && level > 20) resolve('High');
                else resolve('Low');
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[FloodPrediction] Python process exited with code ${code}`);
                    console.error(`[FloodPrediction] Stderr: ${error}`);
                    // Fallback on logic error (e.g. script crash)
                    if (dist < 200 && level > 20) resolve('High');
                    else resolve('Low');
                } else {
                    // Python script prints result to stdout. 
                    // Parse meaningful output. Assuming script prints "Prediction: High" or just "High"
                    const lines = result.trim().split('\n');
                    const lastLine = lines[lines.length - 1]; // Usually the return value
                    resolve(lastLine.replace('Prediction: ', '').trim());
                }
            });
        });
    }
}

module.exports = FloodPredictionService;
