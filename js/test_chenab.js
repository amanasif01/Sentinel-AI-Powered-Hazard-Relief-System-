const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function testChenab() {
    console.log('🌊 Testing Water Level for Chenab River\n');
    
    const waterLevelService = new ActualRealTimeWaterLevelService();
    
    // Test Chenab River coordinates (near Qadirabad Headworks: 31.7500, 73.2500)
    console.log('📍 Testing Chenab River near Qadirabad Headworks (31.7500, 73.2500):');
    try {
        const result = await waterLevelService.getRealTimeWaterLevel(31.7500, 73.2500, 'Chenab River');
        
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
        
        // Check if it's using DAHITI data (should be true for Chenab)
        if (result.isRealWaterLevel) {
            console.log(`   ✅ GOOD: Using real DAHITI satellite data`);
        } else {
            console.log(`   ⚠️  WARNING: Not using real DAHITI data (should be for Chenab)`);
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
        
        // Check if Chenab River is properly identified
        const chenabStations = result.stations.filter(station => 
            station.riverName && station.riverName.toLowerCase().includes('chenab')
        );
        
        if (chenabStations.length > 0) {
            console.log(`   ✅ GOOD: Found ${chenabStations.length} Chenab River station(s)`);
        } else {
            console.log(`   ⚠️  WARNING: No Chenab River stations found`);
        }
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🌊 Testing Chenab River near Marala Headworks (32.2833, 74.3500):');
    try {
        const result2 = await waterLevelService.getRealTimeWaterLevel(32.2833, 74.3500, 'Chenab River');
        
        console.log(`   Water Level: ${result2.level}mm`);
        console.log(`   Risk Level: ${result2.riskLevel}`);
        console.log(`   Is Real Water Level: ${result2.isRealWaterLevel}`);
        console.log(`   Sources: ${result2.sources.join(', ')}`);
        console.log(`   Station Count: ${result2.stations.length}`);
        
        // Check if water level is realistic
        if (result2.level >= 50 && result2.level <= 3000) {
            console.log(`   ✅ GOOD: Water level is realistic (${result2.level}mm)`);
        } else {
            console.log(`   ❌ BAD: Water level is unrealistic (${result2.level}mm)`);
        }
        
        // Show individual station data
        console.log('\n   📊 Individual Station Data:');
        result2.stations.forEach((station, index) => {
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
    
    console.log('\n🎉 Chenab River test completed!');
}

// Run the test
if (require.main === module) {
    testChenab().catch(console.error);
}

module.exports = { testChenab };
