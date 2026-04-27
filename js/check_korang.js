const ActualRealTimeWaterLevelService = require('./src/ActualRealTimeWaterLevelService');

async function checkKorang() {
    console.log("=== Checking Direct Data for Korang River (33.68, 73.12) ===");

    const service = new ActualRealTimeWaterLevelService();

    // Coordinates for Korang River (near Lohi Bher / Islamabad Expressway)
    const lat = 33.68;
    const lon = 73.12;

    try {
        console.log("Fetching data...");
        // Request specifically for 'Korang River' if possible, or just by location
        const result = await service.getRealTimeWaterLevel(lat, lon, "Korang River");

        console.log("\n=== RAW RESULT ===");
        console.log("Is Real Water Level?", result.isRealWaterLevel);
        console.log("Confidence:", result.confidence);
        console.log("Sources:", result.sources);
        console.log("Water Level Value:", result.level);

        console.log("\n=== FACTORS USED ===");
        console.log(JSON.stringify(result.factors, null, 2));

        if (result.isRealWaterLevel) {
            console.log("\n✅ CONCLUSION: Using LIVE SENSOR/SATELLITE data.");
        } else {
            console.log("\n⚠️ CONCLUSION: Using HYDROLOGICAL MODEL (Rainfall-Based). No live sensor found.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkKorang();
