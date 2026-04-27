// Test MongoDB Atlas Connection
const { MongoClient } = require('mongodb');
const config = require('./config');

async function testConnection() {
    console.log('Testing MongoDB Atlas Connection...\n');
    console.log('Connection String:', config.MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    console.log('Database Name:', config.DB_NAME);
    console.log('\nAttempting to connect...\n');

    const client = new MongoClient(config.MONGODB_URI);

    try {
        // Set a timeout for connection
        const connectionPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        const db = client.db(config.DB_NAME);
        const collections = await db.listCollections().toArray();
        
        console.log(`✅ Database: ${config.DB_NAME}`);
        console.log(`✅ Collections found: ${collections.length}`);
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Test a simple query
        const testCollection = db.collection('user_accounts');
        const count = await testCollection.countDocuments();
        console.log(`✅ User accounts collection: ${count} documents`);
        
        await client.close();
        console.log('\n✅ Connection test successful!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Connection failed!\n');
        console.error('Error Details:');
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);
        console.error('  Hostname:', error.hostname || 'N/A');
        
        console.error('\n🔍 Troubleshooting:');
        
        if (error.code === 'ENOTFOUND' || error.message.includes('ENOTFOUND')) {
            console.error('  ❌ DNS Resolution Failed');
            console.error('  Possible causes:');
            console.error('    1. MongoDB cluster does not exist or has been deleted');
            console.error('    2. MongoDB cluster is paused (check MongoDB Atlas dashboard)');
            console.error('    3. Connection string is incorrect');
            console.error('    4. Internet connection issue');
            console.error('\n  Solutions:');
            console.error('    1. Go to https://cloud.mongodb.com/ and check if cluster exists');
            console.error('    2. If cluster is paused, click "Resume" and wait 2-5 minutes');
            console.error('    3. Verify connection string in js/config.js');
            console.error('    4. Get new connection string from MongoDB Atlas:');
            console.error('       - Click "Connect" on your cluster');
            console.error('       - Choose "Connect your application"');
            console.error('       - Copy the connection string');
        } else if (error.code === 'EAUTH' || error.message.includes('authentication')) {
            console.error('  ❌ Authentication Failed');
            console.error('  Possible causes:');
            console.error('    1. Wrong username or password');
            console.error('    2. Password contains special characters that need URL encoding');
            console.error('    3. User account has been deleted');
            console.error('\n  Solutions:');
            console.error('    1. Reset password in MongoDB Atlas');
            console.error('    2. Update connection string in js/config.js');
            console.error('    3. URL encode special characters in password (e.g., @ becomes %40)');
        } else if (error.message.includes('timeout')) {
            console.error('  ❌ Connection Timeout');
            console.error('  Possible causes:');
            console.error('    1. IP address not whitelisted in MongoDB Atlas');
            console.error('    2. Firewall blocking connection');
            console.error('    3. Network connectivity issue');
            console.error('\n  Solutions:');
            console.error('    1. Go to MongoDB Atlas → Network Access');
            console.error('    2. Add your current IP address (or 0.0.0.0/0 for development)');
            console.error('    3. Wait 1-2 minutes for changes to take effect');
        } else {
            console.error('  ❌ Unknown Error');
            console.error('  Check the error message above for details');
        }
        
        await client.close();
        process.exit(1);
    }
}

testConnection();

