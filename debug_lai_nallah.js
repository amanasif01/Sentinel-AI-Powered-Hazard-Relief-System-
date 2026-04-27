const WaterLevelEstimationService = require('./js/src/WaterLevelEstimationService');
const OsmWaterbodyService = require('./js/src/OsmWaterbodyService');

async function debugLaiNallah() {
    console.log("=== Debugging Lai Nallah (Islamabad) ===");

    // Coordinates for Lai Nallah
    const lat = 33.60;
    const lon = 73.04;

    const service = new WaterLevelEstimationService();

    try {
        console.log("Calling getRealTimeWaterLevel...");
        // This is the method called by FloodPredictionService
        const result = await service.getRealTimeWaterLevel(lat, lon, "Lai Nallah");

        console.log("Final Result:", JSON.stringify(result, null, 2));

        if (result.level === 0 || result.level === undefined || result.level === null || isNaN(result.level)) {
            console.error("❌ FAILURE: Level is invalid (0, null, undefined, or NaN)");
        } else {
            console.log(`✅ SUCCESS: Level is ${result.level} mm`);
        }

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

debugLaiNallah();
