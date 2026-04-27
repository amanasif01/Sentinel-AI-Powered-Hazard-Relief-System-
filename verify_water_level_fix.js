const WaterLevelEstimationService = require('./js/src/WaterLevelEstimationService');
const ActualRealTimeWaterLevelService = require('./js/src/ActualRealTimeWaterLevelService');

async function verifyFix() {
    console.log("=== Verifying Water Level Fix ===");
    console.log("Testing for deterministic values (no random variation)");

    // Test ActualRealTimeWaterLevelService directly
    const realTimeService = new ActualRealTimeWaterLevelService();

    // Coordinates for Marala Headworks (Chenab)
    const lat = 32.25;
    const lon = 74.25;

    console.log(`\nTesting ActualRealTimeWaterLevelService for Marala (${lat}, ${lon})...`);

    // We expect OpenMeteo or DAHITI or Fallback (Fixed)
    // Run multiple times to check for variation
    const results = [];
    for (let i = 0; i < 3; i++) {
        const result = await realTimeService.getRealTimeWaterLevel(lat, lon, 'Chenab River');
        results.push(result.averageWaterLevel || (result.waterLevels && result.waterLevels[0].waterLevel));
        console.log(`Run ${i + 1}: ${results[i]}`);
    }

    const allSame = results.every(val => val === results[0]);
    if (allSame) {
        console.log("✅ SUCCESS: Values are deterministic (consistent). Randomness removed.");
    } else {
        console.error("❌ FAILURE: Values are varying. Randomness still present!");
    }

    // Test Estimation Service
    const estService = new WaterLevelEstimationService();
    console.log(`\nTesting WaterLevelEstimationService...`);
    // This calls getRealTimeWaterLevel internally
    const estResult = await estService.getRealTimeWaterLevel(lat, lon, 'Chenab River');
    console.log(`Estimation Result Level: ${estResult.level}`);
    console.log(`Source: ${estResult.factors.dataSource}`);

}

verifyFix().catch(console.error);
