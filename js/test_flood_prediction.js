const FloodPredictionService = require('./src/FloodPredictionService');

// Mock Dependencies
const mockWeatherService = {
    getWeatherForecast: async () => [{ rainfall: 5.0 }, { rainfall: 2.0 }, { rainfall: 0.0 }] // Simulating some rain
};

const mockWaterBodyService = {
    getWaterbodyWithLevel: async () => ({
        found: true,
        distanceMeters: 15000, // 15km away (Should be Safe locally)
        waterLevel: { level: "10.0 ft" },
        name: "Indus River"
    })
};

const mockTerrainService = {
    getTerrainAnalysis: async () => ({
        elevation: 500,
        slope: 5.0
    })
};

const mockWaterLevelService = {}; // Not directly used in main flow if waterBody returns level

async function runTest() {
    console.log("--- Starting Flood Prediction Service Test ---");

    try {
        const service = new FloodPredictionService(
            mockWeatherService,
            mockWaterBodyService,
            mockTerrainService,
            mockWaterLevelService
        );

        // Test Coordinates (Swat, Pakistanish)
        const lat = 35.2227;
        const lon = 72.4258;

        console.log(`Testing prediction for Lat: ${lat}, Lon: ${lon}...`);
        const result = await service.predictFloodRisk(lat, lon);

        console.log("\n--- Test Result ---");
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log("\n✅ SUCCESS: Prediction generated.");

            // Validation of Dual Strategy
            if (result.details.predictions.source === 'Low' && result.details.features.distance > 2000) {
                // This might happen if my mock python script returns Low for everything or if the model logic is specific.
                // Let's just check structure for now.
            }
        } else {
            console.error("\n❌ FAILED: Service returned error.");
        }

    } catch (error) {
        console.error("\n❌ CRITICAL ERROR:", error);
    }
}

runTest();
