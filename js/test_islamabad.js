const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function testIslamabad() {
    console.log('🌊 Testing Water Level for Islamabad\n');
    
    const waterLevelService = new ActualRealTimeWaterLevelService();
    
    // Test Islamabad coordinates (33.6844, 73.0479)
    console.log('📍 Testing Islamabad (33.6844, 73.0479):');
    try {
        const result = await waterLevelService.getRealTimeWaterLevel(33.6844, 73.0479, 'Indus River');
        
        console.log(`   Water Level: ${result.level}mm`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Is Real Water Level: ${result.isRealWaterLevel}`);
        console.log(`   Sources: ${result.sources.join(', ')}`);
        console.log(`   Station Count: ${result.stations.length}`);
        
        // Check if water level is realistic (should be 50-3000mm range)
        if (result.level >= 50 && result.level <= 3000) {
            console.log(`   ✅ GOOD: Water level is realistic (${result.level}mm)`);
        } else {
            console.log(`   ❌ BAD: Water level is unrealistic (${result.level}mm)`);
        }
        
        // Show individual station data
        console.log('\n   📊 Individual Station Data:');
        result.stations.forEach((station, index) => {
            console.log(`      ${index + 1}. ${station.stationName} (${station.riverName}): ${station.waterLevel}mm`);
            if (station.isRealWaterLevel) {
                console.log(`         ✅ REAL satellite data from ${station.source}`);
            } else {
                console.log(`         📊 Estimated data from ${station.source}`);
            }
        });
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🎉 Islamabad test completed!');
}

// Run the test
if (require.main === module) {
    testIslamabad().catch(console.error);
}

module.exports = { testIslamabad };
