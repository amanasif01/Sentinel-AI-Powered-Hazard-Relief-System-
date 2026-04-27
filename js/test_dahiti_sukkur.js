const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function testDahitiSpecific() {
    console.log("=== TESTING DAHITI FOR SUKKUR BARRAGE ===");

    const service = new ActualRealTimeWaterLevelService();

    // Sukkur Barrage - should be DAHITI covered
    const lat = 27.6833;
    const lon = 68.8500;

    console.log(`Testing: Sukkur Barrage (${lat}, ${lon})`);
    console.log("This location SHOULD have DAHITI satellite coverage.\n");

    try {
        const result = await service.getRealTimeWaterLevel(lat, lon, "indus");

        console.log("RESULT:");
        console.log(`- Water Level: ${result.level}mm (${(result.level / 1000).toFixed(2)}m)`);
        console.log(`- Is Real Water Level: ${result.isRealWaterLevel}`);
        console.log(`- Sources: ${result.sources}`);
        console.log(`- Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`- Last Updated: ${result.lastUpdated}`);

        if (result.sources && result.sources.includes('DAHITI')) {
            console.log("\n✅ SUCCESS: DAHITI satellite data is working!");
        } else {
            console.log("\n⚠️  WARNING: DAHITI data not found, using fallback");
            console.log("This may be because:");
            console.log("1. DAHITI API is rate-limited or down");
            console.log("2. No recent satellite pass over this location");
            console.log("3. Data is too old (system fell back to estimation)");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
    }
}

testDahitiSpecific();
