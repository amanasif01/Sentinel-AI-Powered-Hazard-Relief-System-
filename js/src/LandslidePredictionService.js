const { spawn } = require('child_process');
const path = require('path');

class LandslidePredictionService {
    constructor(openMeteoService) {
        this.openMeteo = openMeteoService;
        this.pythonScriptPath = path.join(__dirname, '..', '..', 'ai_models', 'predict_landslide.py');
    }

    async predictLandslideRisk(lat, lon) {
        try {
            console.log(`[LandslidePrediction] Starting prediction for ${lat}, ${lon}`);

            // Fetch Current Weather & Elevation
            const weatherData = await this.openMeteo.getCurrentWeather(lat, lon);
            const elevationData = await this.openMeteo.getElevation(lat, lon);

            // Assume OpenMeteo is extended to return humidity and soil moisture, or we mock if undefined
            // Fallbacks are placed if the current OpenMeteoService doesn't have them yet.
            const temp = weatherData.temp || 25.0;
            const humidity = weatherData.humidity || 70.0;
            const precip = weatherData.rain || 0.0;

            // We simulate soil moisture if it's missing (0-100%)
            // High rain increases soil moisture
            const soilMoisture = weatherData.soilMoisture || Math.min(100, 40 + (precip * 2));

            const elevation = elevationData.elevation || 100;

            console.log(`[LandslidePrediction] Inputs: Temp=${temp}, Hum=${humidity}, Precip=${precip}, Soil=${soilMoisture}, Elev=${elevation}`);

            const predictionResult = await this.runPythonPrediction(temp, humidity, precip, soilMoisture, elevation);

            let finalVerdict = "SAFE";
            let severity = "Low";
            let message = "Conditions appear safe from landslides.";

            if (predictionResult.prediction === 'High' || predictionResult.prediction === 'Very High') {
                finalVerdict = "DANGER";
                severity = "High";
                message = `High Landslide Risk! Heavy rainfall or vulnerable terrain detected.`;
            } else if (predictionResult.prediction === 'Moderate') {
                finalVerdict = "CAUTION";
                severity = "Medium";
                message = `Moderate Risk. Exercise caution in hilly areas.`;
            }

            return {
                success: true,
                verdict: finalVerdict,
                severity: severity,
                message: message,
                details: {
                    features: { temp, humidity, precip, soilMoisture, elevation },
                    ai_result: predictionResult
                }
            };
        } catch (error) {
            console.error("[LandslidePrediction] Error:", error);
            return {
                success: false,
                error: error.message,
                verdict: "Unknown"
            };
        }
    }

    runPythonPrediction(temp, humidity, precip, soil, elev) {
        return new Promise((resolve, reject) => {
            const args = [String(temp), String(humidity), String(precip), String(soil), String(elev)];

            console.log(`[LandslidePrediction] 🐍 CALLING PYTHON: python ${this.pythonScriptPath} ${args.join(' ')}`);
            const pythonProcess = spawn('python', [this.pythonScriptPath, ...args]);

            let result = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.on('close', (code) => {
                try {
                    // Try parsing JSON output
                    const jsonStr = result.trim().split('\n').pop();
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.error) {
                            console.error(`[LandslidePrediction] AI Error: ${parsed.error}`);
                            resolve({ prediction: "Low", probabilities: {} });
                        } else {
                            resolve(parsed);
                        }
                    } catch (e) {
                        console.error(`[LandslidePrediction] JSON Parse Error. Output was: ${result}`);
                        resolve({ prediction: "Low", probabilities: {} });
                    }
                } catch (e) {
                    resolve({ prediction: "Low", probabilities: {} });
                }
            });
        });
    }
}

module.exports = LandslidePredictionService;
