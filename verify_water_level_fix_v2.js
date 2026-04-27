const fs = require('fs');
const WaterLevelEstimationService = require('./js/src/WaterLevelEstimationService');
const ActualRealTimeWaterLevelService = require('./js/src/ActualRealTimeWaterLevelService');

const LOG_FILE = 'verification_results.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function verifyFix() {
    fs.writeFileSync(LOG_FILE, '=== Verifying Water Level Fix ===\r\n');
    log("Testing for deterministic values (no random variation)");

    // Test ActualRealTimeWaterLevelService directly
    const realTimeService = new ActualRealTimeWaterLevelService();

    // Coordinates for Marala Headworks (Chenab)
    const lat = 32.25;
    const lon = 74.25;

    log(`\nTesting ActualRealTimeWaterLevelService for Marala (${lat}, ${lon})...`);

    const results = [];
    for (let i = 0; i < 3; i++) {
        const result = await realTimeService.getRealTimeWaterLevel(lat, lon, 'Chenab River');
        const val = result.averageWaterLevel || (result.waterLevels && result.waterLevels[0].waterLevel) || result.waterLevel;
        results.push(val);
        log(`Run ${i + 1}: ${val} (Source: ${result.source || result.waterLevels?.[0]?.source})`);
    }

    const allSame = results.every(val => val === results[0]);
    if (results[0] === undefined) {
        log("❌ FAILURE: Could not retrieve water level.");
    } else if (allSame) {
        log("✅ SUCCESS: Values are deterministic (consistent). Randomness removed.");
    } else {
        log("❌ FAILURE: Values are varying. Randomness still present!");
    }

    // Test Estimation Service
    const estService = new WaterLevelEstimationService();
    log(`\nTesting WaterLevelEstimationService...`);
    // This calls getRealTimeWaterLevel internally
    const estResult = await estService.getRealTimeWaterLevel(lat, lon, 'Chenab River');
    log(`Estimation Result Level: ${estResult.level}`);
    log(`Source: ${estResult.factors ? estResult.factors.dataSource : 'Unknown'}`);

}

verifyFix().catch(err => log(err.message));
