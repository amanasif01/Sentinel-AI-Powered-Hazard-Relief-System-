const WaterLevelEstimationService = require('./js/src/WaterLevelEstimationService');
const OsmWaterbodyService = require('./js/src/OsmWaterbodyService');

async function debugWaterLevel() {
    console.log("=== Debugging Water Level Display ===");

    // Test Case: Lai Nallah (Islamabad/Rawalpindi)
    const lat = 33.60;
    const lon = 73.04;

    console.log(`\nTesting Lai Nallah at ${lat}, ${lon}...`);

    const osmService = new OsmWaterbodyService();
    const waterLevelService = new WaterLevelEstimationService();

    try {
        // 1. Check Waterbody Finding
        const waterbody = await osmService.getNearestWaterbody(lat, lon);
        console.log(`Waterbody: ${waterbody.getName()} (Type: ${waterbody.getType()})`);

        // 2. Check Water Level Calculation
        // Simulate rainfall data (0mm)
        const rainfallData = { dailyRainfall: [] };
        const distance = waterbody.getDistanceMeters();

        console.log(`Calculating level...`);
        const result = await waterLevelService.estimateWaterLevel(
            waterbody,
            rainfallData,
            distance,
            lat,
            lon
        );

        console.log("Result Object:", JSON.stringify(result, null, 2));

        if (typeof result.level === 'number' && !isNaN(result.level)) {
            console.log(`✅ Level is valid number: ${result.level}`);
        } else {
            console.error(`❌ Level is INVALID: ${result.level}`);
        }

    } catch (e) {
        console.error("Error:", e);
    }

    osmService.close();
}

debugWaterLevel();
