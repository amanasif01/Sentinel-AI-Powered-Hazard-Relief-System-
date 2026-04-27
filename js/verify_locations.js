const OsmWaterbodyService = require('./src/OsmWaterbodyService');

async function verifyLocations() {
    const osmService = new OsmWaterbodyService();

    const locations = [
        { name: "Karachi (Coastal)", lat: 24.8607, lon: 67.0011 },
        { name: "Lahore (Ravi River)", lat: 31.5497, lon: 74.3436 },
        { name: "Multan (Chenab River)", lat: 30.1575, lon: 71.5249 },
        { name: "Sukkur (Indus River)", lat: 27.7131, lon: 68.8492 }
    ];

    console.log("=== WATER LEVEL VERIFICATION ACROSS PAKISTAN ===\n");

    for (const loc of locations) {
        console.log(`--- Testing ${loc.name} [${loc.lat}, ${loc.lon}] ---`);
        try {
            const result = await osmService.getWaterbodyWithLevel(loc.lat, loc.lon);

            if (result.found) {
                console.log(`✅ Waterbody Found: ${result.name}`);
                console.log(`   Type: ${result.type}`);
                console.log(`   Distance: ${(result.distanceMeters / 1000).toFixed(2)} km`);

                // Format Water Level
                const levelMeters = (result.waterLevel.level / 1000).toFixed(2);
                console.log(`   Water Level: ${levelMeters} m (${result.waterLevel.level} mm)`);

                // Source Info
                const isReal = result.waterLevel.isRealWaterLevel ||
                    (result.waterLevel.sources && result.waterLevel.sources.some(s => s.includes('DAHITI')));

                const sourceName = isReal ? "🛰️ SATELLITE / LIVE SENSOR (DAHITI)" : "💻 HYDROLOGICAL MODEL (Predicted)";
                console.log(`   Source: ${sourceName}`);
                console.log(`   Risk: ${result.waterLevel.riskLevel}\n`);
            } else {
                console.log("❌ No significant waterbody found nearby.\n");
            }
        } catch (error) {
            console.error(`   Error testing ${loc.name}: ${error.message}\n`);
        }
    }

    // cleanup
    // process.exit(0);
}

verifyLocations();
