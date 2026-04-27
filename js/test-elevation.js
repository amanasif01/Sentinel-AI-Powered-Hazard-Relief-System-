const https = require('https');

// Test Open-Elevation API
function testOpenElevation(lat, lon) {
    console.log(`\nTesting Open-Elevation API for: ${lat}, ${lon}`);
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    console.log(`URL: ${url}`);

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log('❌ Request timed out after 10 seconds');
            resolve(false);
        }, 10000);

        const startTime = Date.now();
        https.get(url, (response) => {
            clearTimeout(timeout);
            const elapsed = Date.now() - startTime;

            console.log(`Status Code: ${response.statusCode} (${elapsed}ms)`);

            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('✅ Response:', JSON.stringify(json, null, 2));
                    resolve(true);
                } catch (e) {
                    console.log('❌ Parse error:', e.message);
                    console.log('Raw response:', data);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.log('❌ Network error:', err.message);
            resolve(false);
        });
    });
}

// Test with Islamabad coordinates
async function runTests() {
    console.log('=== Testing Elevation APIs ===\n');

    // Test 1: Islamabad
    await testOpenElevation(33.6844, 73.0479);

    // Test 2: Different location
    await testOpenElevation(40.7128, -74.0060); // New York

    console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
