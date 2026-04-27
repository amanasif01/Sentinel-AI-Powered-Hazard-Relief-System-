const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');
const DahitiApiService = require('./src/DahitiApiService');

async function testRiverMapping() {
    console.log('🌊 Testing River Mapping for DAHITI Coverage\n');
    
    const waterLevelService = new ActualRealTimeWaterLevelService();
    const dahitiService = new DahitiApiService();
    
    // Test stations - mix of DAHITI-covered and non-covered
    const testStations = [
        // DAHITI-covered stations (should use real satellite data)
        { id: 'TARBELA', name: 'Tarbela Dam', lat: 34.0889, lon: 72.7017, type: 'dam' },
        { id: 'CHASHMA', name: 'Chashma Barrage', lat: 32.4333, lon: 71.3333, type: 'barrage' },
        { id: 'QADIRABAD', name: 'Qadirabad Headworks', lat: 31.7500, lon: 73.2500, type: 'headworks' },
        { id: 'MARALA', name: 'Marala Headworks', lat: 32.2833, lon: 74.3500, type: 'headworks' },
        { id: 'MANGLA', name: 'Mangla Dam', lat: 33.1500, lon: 73.6500, type: 'dam' },
        { id: 'BALLOKI', name: 'Balloki Headworks', lat: 31.2167, lon: 74.1333, type: 'headworks' },
        { id: 'SULEMANKI', name: 'Sulemanki Headworks', lat: 30.6833, lon: 73.0167, type: 'headworks' },
        { id: 'NOWSHERA', name: 'Nowshera', lat: 34.0167, lon: 71.9833, type: 'city' },
        { id: 'KALAM', name: 'Kalam', lat: 35.4833, lon: 72.5833, type: 'city' },
        
        // Non-DAHITI stations (should use estimation)
        { id: 'UNKNOWN1', name: 'Unknown River Station', lat: 30.0, lon: 70.0, type: 'station' },
        { id: 'UNKNOWN2', name: 'Some Other Location', lat: 31.0, lon: 71.0, type: 'station' }
    ];
    
    console.log('=== Testing DAHITI Coverage Detection ===');
    
    for (const station of testStations) {
        const isCovered = waterLevelService.isDahitiCoveredStation(station);
        const riverName = waterLevelService.extractRiverNameFromStation(station);
        const locationName = waterLevelService.extractLocationNameFromStation(station);
        
        console.log(`\n📍 ${station.name}:`);
        console.log(`   DAHITI Covered: ${isCovered ? '✅ YES' : '❌ NO'}`);
        console.log(`   River Name: ${riverName || 'null'}`);
        console.log(`   Location Name: ${locationName || 'null'}`);
        
        if (isCovered) {
            // Test DAHITI service directly
            try {
                const isDahitiCovered = dahitiService.isDahitiCovered(riverName, locationName);
                console.log(`   DAHITI Service Check: ${isDahitiCovered ? '✅ COVERED' : '❌ NOT COVERED'}`);
                
                if (isDahitiCovered) {
                    const dahitiId = dahitiService.getDahitiId(riverName, locationName);
                    console.log(`   DAHITI ID: ${dahitiId}`);
                }
            } catch (error) {
                console.log(`   DAHITI Service Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n\n=== Testing Water Level Service Integration ===');
    
    // Test with Chenab River area (should find DAHITI stations)
    console.log('\n🌊 Testing Chenab River area (32.5, 73.5):');
    try {
        const result = await waterLevelService.getRealTimeWaterLevel(32.5, 73.5, 'Chenab River');
        
        console.log(`   Water Level: ${result.level}mm`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Is Real Water Level: ${result.isRealWaterLevel}`);
        console.log(`   Sources: ${result.sources.join(', ')}`);
        console.log(`   Station Count: ${result.stations.length}`);
        
        // Check if any stations used DAHITI
        const dahitiStations = result.stations.filter(s => s.isRealWaterLevel);
        console.log(`   DAHITI Stations: ${dahitiStations.length}`);
        
        if (dahitiStations.length > 0) {
            console.log('   ✅ SUCCESS: Found real DAHITI satellite data!');
            dahitiStations.forEach(station => {
                console.log(`      - ${station.stationName}: ${station.waterLevel}mm (${station.source})`);
            });
        } else {
            console.log('   ⚠️ WARNING: No DAHITI data found - using estimation');
        }
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Test with a non-DAHITI area (should use estimation)
    console.log('\n🌊 Testing non-DAHITI area (25.0, 65.0):');
    try {
        const result = await waterLevelService.getRealTimeWaterLevel(25.0, 65.0, 'Unknown River');
        
        console.log(`   Water Level: ${result.level}mm`);
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Is Real Water Level: ${result.isRealWaterLevel}`);
        console.log(`   Sources: ${result.sources.join(', ')}`);
        console.log(`   Station Count: ${result.stations.length}`);
        
        // Check if any stations used DAHITI
        const dahitiStations = result.stations.filter(s => s.isRealWaterLevel);
        console.log(`   DAHITI Stations: ${dahitiStations.length}`);
        
        if (dahitiStations.length === 0) {
            console.log('   ✅ SUCCESS: Correctly used estimation for non-DAHITI area');
        } else {
            console.log('   ❌ ERROR: Should not have DAHITI data for non-covered area');
        }
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🎉 River mapping test completed!');
}

// Run the test
if (require.main === module) {
    testRiverMapping().catch(console.error);
}

module.exports = { testRiverMapping };
