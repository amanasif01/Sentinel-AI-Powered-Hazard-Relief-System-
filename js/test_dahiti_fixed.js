const DahitiApiService = require('./src/DahitiApiService');
const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function testDahitiApi() {
    console.log('🌊 Testing Fixed DAHITI API Integration\n');
    
    // Test 1: Test DAHITI service directly
    console.log('=== Test 1: DAHITI Service Direct Test ===');
    const dahitiService = new DahitiApiService();
    
    try {
        // Test connection
        const connectionTest = await dahitiService.testConnection();
        console.log(`Connection test: ${connectionTest ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        // Test listing Pakistan rivers
        console.log('\n--- Listing Pakistan Rivers ---');
        const rivers = await dahitiService.listPakistanRivers();
        console.log(`Found ${rivers.length} rivers:`);
        rivers.slice(0, 5).forEach(river => {
            console.log(`  - ${river.river_name} (${river.location_name}): ID ${river.dahiti_id}`);
        });
        
        // Test getting water level data for Chenab River
        console.log('\n--- Testing Chenab River Water Level ---');
        const chenabData = await dahitiService.getWaterLevelData('chenab', 'qadirabad');
        console.log(`Chenab River (Qadirabad): ${chenabData.waterLevel}mm`);
        console.log(`Timestamp: ${chenabData.timestamp}`);
        console.log(`Source: ${chenabData.source}`);
        console.log(`Confidence: ${chenabData.confidence}`);
        
    } catch (error) {
        console.error('❌ DAHITI Service test failed:', error.message);
    }
    
    // Test 2: Test through ActualRealTimeWaterLevelService
    console.log('\n\n=== Test 2: Integration with Water Level Service ===');
    const waterLevelService = new ActualRealTimeWaterLevelService();
    
    try {
        // Test Chenab River area (Qadirabad Headworks)
        const chenabCoords = {
            name: 'Qadirabad Headworks (Chenab River)',
            lat: 32.5,
            lon: 73.5
        };
        
        console.log(`📍 Testing ${chenabCoords.name}: ${chenabCoords.lat}, ${chenabCoords.lon}`);
        console.log('   ' + '─'.repeat(60));
        
        const result = await waterLevelService.getRealTimeWaterLevel(
            chenabCoords.lat, 
            chenabCoords.lon, 
            'Chenab River'
        );
        
        console.log(`   ✅ Water Level: ${result.level}mm`);
        console.log(`   📊 Risk Level: ${result.riskLevel}`);
        console.log(`   🕒 Is Real-Time: ${result.isRealTime}`);
        console.log(`   💧 Is Real Water Level: ${result.isRealWaterLevel || false}`);
        console.log(`   📋 Data Type: ${result.factors?.dataType || 'unknown'}`);
        console.log(`   🔍 Sources: ${result.sources.join(', ')}`);
        
        if (result.level > 2000) {
            console.log(`   ✅ GOOD: High water level for Chenab River (${result.level}mm)`);
        } else if (result.level > 1000) {
            console.log(`   ⚠️ MEDIUM: Moderate water level for Chenab River (${result.level}mm)`);
        } else {
            console.log(`   ❌ LOW: Water level seems too low for Chenab River (${result.level}mm)`);
        }
        
        console.log(`   📈 Station Count: ${result.stations.length}`);
        
        // Show individual station data
        console.log('\n   📊 Individual Station Data:');
        result.stations.forEach((station, index) => {
            console.log(`      ${index + 1}. ${station.stationName}: ${station.waterLevel}mm`);
            if (station.isRealWaterLevel) {
                console.log(`         ✅ REAL satellite data from ${station.source}`);
            } else {
                console.log(`         ⚠️ Estimated data from ${station.source}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Water Level Service test failed:', error.message);
    }
    
    // Test 3: Test different rivers
    console.log('\n\n=== Test 3: Testing Different Rivers ===');
    
    const testRivers = [
        { name: 'Indus River (Tarbela)', lat: 34.0889, lon: 72.7017, river: 'indus' },
        { name: 'Ravi River (Balloki)', lat: 31.2167, lon: 74.1333, river: 'ravi' },
        { name: 'Jhelum River (Mangla)', lat: 33.1500, lon: 73.6500, river: 'jhelum' }
    ];
    
    for (const testRiver of testRivers) {
        try {
            console.log(`\n--- Testing ${testRiver.name} ---`);
            const result = await waterLevelService.getRealTimeWaterLevel(
                testRiver.lat, 
                testRiver.lon, 
                testRiver.river
            );
            
            console.log(`   Water Level: ${result.level}mm`);
            console.log(`   Real Water Level: ${result.isRealWaterLevel || false}`);
            console.log(`   Sources: ${result.sources.join(', ')}`);
            
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        }
    }
    
    console.log('\n🎉 DAHITI API testing completed!');
}

// Run the test
if (require.main === module) {
    testDahitiApi().catch(console.error);
}

module.exports = { testDahitiApi };
