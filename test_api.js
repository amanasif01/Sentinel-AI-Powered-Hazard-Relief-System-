const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/predict-flood?lat=33.6844&lon=73.0479', // Islamabad
    method: 'GET'
};

console.log('Testing flood prediction API...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n--- Response ---');
        console.log('Status Code:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));

            if (parsed.success) {
                console.log('\n✅ API is working!');
                console.log('Verdict:', parsed.verdict);
                console.log('Risk Score:', parsed.riskScore);
            } else {
                console.log('\n❌ API returned error:', parsed.error);
            }
        } catch (e) {
            console.log('Raw response:', data);
            console.log('Parse error:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.error('Make sure the server is running on port 3000');
});

req.end();
