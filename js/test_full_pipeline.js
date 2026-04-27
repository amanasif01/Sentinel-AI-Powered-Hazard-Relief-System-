const OsmWaterbodyService = require('./src/OsmWaterbodyService');

async function fullDataPipelineTest() {
    console.log("=== COMPLETE DATA PIPELINE TEST ===");
    console.log("This will show you EXACTLY what real-time data is being used\n");

    const osmService = new OsmWaterbodyService();

    // Test Karachi
    const lat = 24.860;
    const lon = 67.001;

    console.log(`Testing: Karachi (${lat}, ${lon})`);
    console.log("─".repeat(60));

    try {
        console.log("\n1️⃣ STEP 1: Finding Nearest Water Body (OSM API)");
        const result = await osmService.getWaterbodyWithLevel(lat, lon);

        if (result.found) {
            console.log(`   ✅ Found: ${result.name}`);
            console.log(`   Type: ${result.type}`);
            console.log(`   Distance: ${(result.distanceMeters / 1000).toFixed(2)} km`);
        } else {
            console.log(`   ❌ No water body found`);
        }

        console.log("\n2️⃣  STEP 2: Water Level Data Source");
        if (result.waterLevel) {
            console.log(`   Raw Level: ${result.waterLevel.level} mm`);
            console.log(`   In Meters: ${(result.waterLevel.level / 1000).toFixed(2)} m`);
            console.log(`   Confidence: ${(result.waterLevel.confidence * 100).toFixed(0)}%`);
            console.log(`   Is Real-Time: ${result.waterLevel.isRealTime}`);
            console.log(`   Sources: ${result.waterLevel.sources || 'N/A'}`);

            if (result.waterLevel.factors) {
                console.log("\n3️⃣  STEP 3: How This Level Was Calculated");
                console.log(`   Data Source: ${result.waterLevel.factors.dataSource || 'Unknown'}`);
                console.log(`   Data Type: ${result.waterLevel.factors.dataType || 'Unknown'}`);

                if (result.waterLevel.factors.floodApi) {
                    console.log("\n   📊 REAL-TIME FLOOD API DATA:");
                    console.log(`      Discharge: ${result.waterLevel.factors.floodApi.discharge} m³/s`);
                    console.log(`      Date: ${result.waterLevel.factors.floodApi.date}`);
                    console.log("      ✅ This is REAL measured discharge converted to depth");
                }

                if (result.waterLevel.stations && result.waterLevel.stations.length > 0) {
                    console.log("\n   🛰️  MONITORING STATIONS:");
                    result.waterLevel.stations.forEach((station, i) => {
                        console.log(`      ${i + 1}. ${station.stationName}: ${station.waterLevel}mm`);
                        console.log(`         Source: ${station.source}`);
                        console.log(`         Real Water Level: ${station.isRealWaterLevel ? 'YES' : 'NO'}`);
                    });
                }
            }
        } else {
            console.log("   ❌ No water level data available");
        }

        console.log("\n" + "─".repeat(60));
        console.log("SUMMARY:");
        if (result.waterLevel && result.waterLevel.isRealTime) {
            console.log("✅ SUCCESS: This location is using REAL-TIME API data");
        } else {
            console.log("⚠️  This location is using modeled estimation");
            console.log("   Reason: No real-time gauges or satellites at this location");
        }

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.error(error.stack);
    }
}

fullDataPipelineTest();
