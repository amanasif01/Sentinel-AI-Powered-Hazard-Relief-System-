const OsmWaterbodyService = require('./src/OsmWaterbodyService');

async function checkIslamabad() {
    console.log("=== Checking Water Level for Islamabad (33.729, 73.093) ===");

    // 1. Initialize Service
    const osmService = new OsmWaterbodyService();

    // 2. Fetch Waterbody + Level
    try {
        // Islamabad coordinates (near Rawal Lake)
        const lat = 33.729;
        const lon = 73.093;

        console.log("Fetching nearest waterbody...");
        const result = await osmService.getWaterbodyWithLevel(lat, lon);

        console.log("\n=== RESULT ===");
        console.log(`Found: ${result.found}`);
        if (result.found) {
            console.log(`Waterbody: ${result.name}`);
            console.log(`Type: ${result.type}`);
            console.log(`Distance: ${Math.round(result.distanceMeters)} meters`);
            console.log(`Water Level: ${result.waterLevel} mm (${(result.waterLevel / 1000).toFixed(2)} meters)`);
            console.log(`Risk Level: ${result.waterLevel.riskLevel || 'N/A'}`);
        } else {
            console.log("No waterbody found nearby.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkIslamabad();
