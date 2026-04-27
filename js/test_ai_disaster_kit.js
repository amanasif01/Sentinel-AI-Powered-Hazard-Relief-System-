const DisasterKitService = require('./src/DisasterKitService');

// Mock data
const mockData = {
    rainfall: {
        totalRainfall: 120, // High rainfall
        daysWithRain: 4
    },
    waterbody: {
        distanceMeters: 500, // Close to water
        found: true
    },
    weather: {
        forecasts: [
            { averageTemperature: 35, hasRain: true },
            { averageTemperature: 36, hasRain: true },
            { averageTemperature: 34, hasRain: false }
        ]
    },
    terrain: {
        elevation: 50, // Low elevation
        slopeCategory: 'flat'
    }
};

const service = new DisasterKitService();

async function runTest() {
    console.log('🧪 Starting AI Disaster Kit Verification');
    console.log('----------------------------------------');

    const result = await service.analyzeLocation(mockData, 'Test Location (Flood Prone)');

    console.log('\n📊 Analysis Result:');
    console.log('Success:', result.success);
    console.log('Is AI Generated:', result.isAiGenerated);
    console.log('Total Items:', result.totalItems);

    if (result.isAiGenerated) {
        console.log('\n✅ AI Recommendations (Sample):');
        console.log('Critical Items:', result.recommendations.critical.slice(0, 3).map(i => i.name));
        const fs = require('fs');
        fs.writeFileSync('result_log.txt', JSON.stringify(result, null, 2));
    } else {
        console.log('\n⚠️ Using Rule-Based Fallback (Expected if no API key)');
        console.log('Critical Items:', result.recommendations.critical.slice(0, 3).map(i => i.name));
    }

    console.log('\n----------------------------------------');
    console.log('Test Complete');
}

runTest().catch(console.error);
