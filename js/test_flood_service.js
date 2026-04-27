const FloodPredictionService = require('./src/FloodPredictionService');
const OpenMeteoService = require('./src/OpenMeteoService');

async function test() {
    console.log("=== Starting FloodPredictionService Test ===");

    // 1. Initialize Services
    const openMeteo = new OpenMeteoService();
    const floodService = new FloodPredictionService(openMeteo);

    // 2. Define Mock Data
    const lat = 33.729; // Islamabad/Rawal Lake area
    const lon = 73.136;
    const waterBodyData = {
        found: true,
        distanceMeters: 50.0,
        name: "Rawal Lake",
        waterLevel: { level: 200, riskLevel: "Low" }
    };

    try {
        // 3. Run Prediction
        console.log(`Predicting for ${lat}, ${lon}...`);
        const result = await floodService.predictFloodRisk(lat, lon, waterBodyData);

        // 4. Log Results
        console.log("\n=== Prediction Result ===");
        console.log(JSON.stringify(result, null, 2));

        if (result.success && result.details.visitOutlook) {
            console.log("\n✅ SUCCESS: AI Data and Visit Outlook generated!");
        } else {
            console.error("\n❌ FAILURE: Missing AI Data or Visit Outlook.");
        }

    } catch (error) {
        console.error("\n❌ CRITICAL ERROR:", error);
    }
}

test();
