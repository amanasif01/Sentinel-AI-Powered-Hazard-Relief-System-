const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function testDahitiCoverage() {
    console.log("=== DAHITI SATELLITE COVERAGE MAP ===\n");

    const service = new ActualRealTimeWaterLevelService();

    // Test locations
    const locations = [
        { name: "Sukkur Barrage (Indus)", lat: 27.6833, lon: 68.8500, expectDahiti: true },
        { name: "Tarbela Dam (Indus)", lat: 34.0889, lon: 72.7017, expectDahiti: true },
        { name: "Mangla Dam (Jhelum)", lat: 33.1500, lon: 73.6500, expectDahiti: true },
        { name: "Islamabad (Korang River)", lat: 33.729, lon: 73.093, expectDahiti: false },
        { name: "Karachi (Lyari River)", lat: 24.860, lon: 67.001, expectDahiti: false },
        { name: "Lahore (Ravi River)", lat: 31.5497, lon: 74.3436, expectDahiti: false }
    ];

    console.log("Testing which locations have DAHITI satellite coverage:\n");

    for (const loc of locations) {
        console.log(`📍 ${loc.name}`);

        // Find nearest stations
        const stations = service.findNearestStations(loc.lat, loc.lon, null);
        const nearestStation = stations[0];

        if (nearestStation) {
            const isDahitiCovered = service.isDahitiCoveredStation(nearestStation);
            const symbol = isDahitiCovered ? "🛰️  YES" : "❌ NO ";
            const expected = loc.expectDahiti ? "(Expected)" : "(Not Expected)";

            console.log(`   DAHITI Coverage: ${symbol} ${expected}`);
            console.log(`   Nearest Station: ${nearestStation.name} (${(nearestStation.distance / 1000).toFixed(1)}km away)`);

            if (isDahitiCovered) {
                console.log(`   ✅ This location SHOULD receive satellite data`);
            } else {
                console.log(`   ℹ️  This location uses Global Flood API instead`);
            }
        } else {
            console.log(`   ⚠️  No monitoring station found`);
        }
        console.log();
    }

    console.log("\n=== DAHITI COVERAGE SUMMARY ===");
    console.log("DAHITI satellite monitoring is available ONLY for:");
    console.log("✓ Major dams (Tarbela, Mangla, Chashma)");
    console.log("✓ Major barrages (Sukkur, Guddu, Taunsa, etc.)");
    console.log("✓ Key headworks on Punjab rivers");
    console.log("\nFor all other locations, we use:");
    console.log("→ Global Flood API (river discharge data)");
    console.log("→ Hydrological estimation models\n");
}

testDahitiCoverage().catch(console.error);
