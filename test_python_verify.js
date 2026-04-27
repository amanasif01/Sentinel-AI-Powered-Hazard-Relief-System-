// Quick single-location test with detailed logging
const http = require('http');

const testLocation = { name: 'Islamabad', lat: 33.6844, lon: 73.0479 };

console.log(`\n${'='.repeat(80)}`);
console.log(`TESTING: ${testLocation.name} (${testLocation.lat}, ${testLocation.lon})`);
console.log(`Looking for Python execution logs...`);
console.log('='.repeat(80) + '\n');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/predict-flood?lat=${testLocation.lat}&lon=${testLocation.lon}`,
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const result = JSON.parse(data);

            console.log('\n📊 API RESPONSE:');
            console.log(JSON.stringify(result, null, 2));

            if (result.success) {
                console.log('\n✅ SUCCESS - Check server logs for:');
                console.log('  🐍 CALLING PYTHON: ... (should appear)');
                console.log('  ✅ PYTHON RESULT: ... (should appear)');
                console.log('  ❌ If you see "FALLBACK" logs, Python is NOT working!');
            }
        } catch (e) {
            console.error('Parse error:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('Request failed:', error.message);
});

req.end();
