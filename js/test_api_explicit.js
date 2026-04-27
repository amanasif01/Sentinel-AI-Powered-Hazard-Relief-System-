const OpenMeteoService = require('./src/OpenMeteoService');

async function testApi() {
    console.log("=== EXPLICIT API TEST ===");
    console.log("Fetching LIVE data from Open-Meteo Flood API...");

    const service = new OpenMeteoService();
    // Karachi Coordinates
    const lat = 24.860;
    const lon = 67.001;

    try {
        const data = await service.getFloodData(lat, lon);
        console.log("\nRAW API RESPONSE FOR KARACHI:");
        console.log(JSON.stringify(data, null, 2));

        if (data && data.discharge !== undefined) {
            console.log(`\n✅ API SUCCESS. Discharge: ${data.discharge} ${data.unit}`);
            if (data.discharge === 0) {
                console.log("Note: 0 m³/s means the river is currently dry or flow is too low to measure (Common for Lyari/Malir).");
            }
        } else {
            console.log("\n❌ API returned no data.");
        }
    } catch (e) {
        console.error("API ERROR:", e);
    }
}

testApi();
