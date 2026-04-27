const http = require('http');

// Test locations across Pakistan
const testLocations = [
    { name: 'Islamabad', lat: 33.6844, lon: 73.0479 },
    { name: 'Swat', lat: 35.2227, lon: 72.4258 },
    { name: 'Karachi', lat: 24.8607, lon: 67.0011 },
    { name: 'Lahore', lat: 31.5497, lon: 74.3436 },
    { name: 'Peshawar', lat: 34.0151, lon: 71.5249 }
];

async function testLocation(location) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/predict-flood?lat=${location.lat}&lon=${location.lon}`,
            method: 'GET'
        };

        console.log(`\n${'='.repeat(80)}`);
        console.log(`TESTING: ${location.name} (${location.lat}, ${location.lon})`);
        console.log('='.repeat(80));

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);

                    if (result.success) {
                        console.log('\n✅ API Response: SUCCESS\n');

                        // Display input features
                        console.log('📊 INPUT FEATURES (Sent to AI Model):');
                        console.log('─'.repeat(80));
                        console.log(`  Rainfall:     ${result.details.features.rainfall.toFixed(2)} mm`);
                        console.log(`  Water Level:  ${result.details.features.waterLevel.toFixed(2)} mm`);
                        console.log(`  Elevation:    ${result.details.features.elevation.toFixed(2)} m`);
                        console.log(`  Slope:        ${result.details.features.slope.toFixed(2)} degrees`);
                        console.log(`  Distance:     ${(result.details.features.distance / 1000).toFixed(2)} km (${result.details.features.distance} m)`);
                        console.log(`  Waterbody:    ${result.details.waterbodyName}`);

                        // Display AI predictions
                        console.log('\n🤖 AI MODEL PREDICTIONS:');
                        console.log('─'.repeat(80));
                        console.log(`  Local Risk:   ${result.details.predictions.local}`);
                        console.log(`  Source Risk:  ${result.details.predictions.source}`);

                        // Display final verdict
                        console.log('\n🎯 FINAL VERDICT:');
                        console.log('─'.repeat(80));
                        console.log(`  Verdict:      ${result.verdict}`);
                        console.log(`  Severity:     ${result.severity}`);
                        console.log(`  Risk Score:   ${result.riskScore}/100`);
                        console.log(`  Message:      ${result.message}`);

                        resolve(result);
                    } else {
                        console.log('\n❌ API Response: FAILED');
                        console.log(`  Error: ${result.error}`);
                        resolve(result);
                    }
                } catch (e) {
                    console.log('\n❌ Parse Error:', e.message);
                    console.log('Raw response:', data);
                    resolve({ error: e.message });
                }
            });
        });

        req.on('error', (error) => {
            console.log('\n❌ Request Failed:', error.message);
            resolve({ error: error.message });
        });

        req.setTimeout(30000, () => {
            console.log('\n❌ Request Timeout');
            req.destroy();
            resolve({ error: 'Timeout' });
        });

        req.end();
    });
}

async function runAllTests() {
    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + 'AI FLOOD PREDICTION - COMPREHENSIVE TEST' + ' '.repeat(17) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');

    const results = [];

    for (const location of testLocations) {
        const result = await testLocation(location);
        results.push({ location: location.name, result });

        // Wait 2 seconds between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.result.success);
    const failed = results.filter(r => !r.result.success);

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`Successful:  ${successful.length}`);
    console.log(`Failed:      ${failed.length}`);

    if (successful.length > 0) {
        console.log('\n✅ Successful Locations:');
        successful.forEach(r => {
            console.log(`  - ${r.location}: ${r.result.verdict} (${r.result.riskScore}/100)`);
        });
    }

    if (failed.length > 0) {
        console.log('\n❌ Failed Locations:');
        failed.forEach(r => {
            console.log(`  - ${r.location}: ${r.result.error || 'Unknown error'}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log('Test completed at:', new Date().toLocaleString());
    console.log('='.repeat(80) + '\n');
}

// Run the tests
console.log('Starting comprehensive AI test...');
console.log('Make sure the server is running on http://localhost:3000');
console.log('');

runAllTests().catch(console.error);
