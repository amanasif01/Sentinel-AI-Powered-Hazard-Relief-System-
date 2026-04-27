const MedibotService = require('./src/MedibotService');

// Mock HospitalService
const mockHospitalService = {
    findHospitals: async (lat, lon, radius) => {
        console.log(`[Mock] Finding hospitals at ${lat}, ${lon} within ${radius}m`);
        return [
            { name: "City General Hospital", distanceKm: 1.2 },
            { name: "Community Clinic", distanceKm: 2.5 }
        ];
    }
};

const service = new MedibotService(mockHospitalService);

async function runTest() {
    console.log('🧪 Starting Medibot Verification');
    console.log('--------------------------------');

    // Test 1: General Medical Advice
    console.log('\n📝 Test 1: General Advice ("I have a headache")');
    const result1 = await service.getMedicalAdvice("I have a bad headache, what should I do?", { location: { lat: 0, lon: 0 } });
    console.log('Result:', result1.text.substring(0, 100) + '...');

    if (!result1.isError && result1.text.length > 10) {
        console.log('✅ Test 1 Passed');
    } else {
        console.error('❌ Test 1 Failed');
    }

    // Test 2: Hospital Search
    console.log('\n📝 Test 2: Hospital Search ("Find nearest hospital")');
    const result2 = await service.getMedicalAdvice("Find nearest hospital", { location: { lat: 10, lon: 10 } });
    console.log('Result:', result2.text);

    if (result2.relatedAction === 'OPEN_HOSPITALS') {
        console.log('✅ Test 2 Passed (Action triggered)');
    } else {
        console.error('❌ Test 2 Failed');
    }

    console.log('\n--------------------------------');
}

runTest();
