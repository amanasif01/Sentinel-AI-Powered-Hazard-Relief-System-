const OpenMeteoService = require('./src/OpenMeteoService');

async function debugFloodApi() {
    console.log("=== DEBUGGING OPEN-METEO FLOOD API ===");
    const openMeteo = new OpenMeteoService();

    // Locations to test
    const locations = [
        // { name: "Islamabad (Korang River)", lat: 33.729, lon: 73.093, baseLevel: 1500, minLevel: 400 },
        // { name: "Sukkur (Indus River)", lat: 27.713, lon: 68.849, baseLevel: 6500, minLevel: 2500 },
        { name: "Karachi (Lyari River)", lat: 24.860, lon: 67.001, baseLevel: 1200, minLevel: 300 }
    ];

    for (const loc of locations) {
        console.log(`\n--- Fetching Data for ${loc.name} [${loc.lat}, ${loc.lon}] ---`);
        try {
            // 1. RAW API CALL
            const floodData = await openMeteo.getFloodData(loc.lat, loc.lon);

            console.log("RAW API RESPONSE:");
            console.log(JSON.stringify(floodData, null, 2));

            if (floodData && floodData.discharge > 0) {
                // 2. REPLICATE MATH FROM ActualRealTimeWaterLevelService
                const Q = floodData.discharge;
                const widthFactor = loc.baseLevel / 500;

                console.log(`\nCALCULATION DETAILS:`);
                console.log(`Discharge (Q): ${Q} m³/s`);
                console.log(`Base Level (Proxy Width): ${loc.baseLevel}`);
                console.log(`Width Factor: ${widthFactor}`);

                // Formula: 0.5 * (Q / widthFactor)^0.4
                const term = Math.max(1, Q) / widthFactor;
                const flowDepthMeters = 0.5 * Math.pow(term, 0.4);

                console.log(`Math: 0.5 * (${term.toFixed(2)})^0.4 = ${flowDepthMeters.toFixed(4)} meters`);

                const calculatedLevel = Math.round(flowDepthMeters * 1000) + loc.minLevel;
                console.log(`Final Level (Depth + Min): ${calculatedLevel} mm (${(calculatedLevel / 1000).toFixed(2)} m)`);
            } else {
                console.log("⚠️ API returned 0 or null discharge. Fallback logic would trigger.");
            }

        } catch (error) {
            console.error("API Call Failed:", error);
        }
    }
}

debugFloodApi();
