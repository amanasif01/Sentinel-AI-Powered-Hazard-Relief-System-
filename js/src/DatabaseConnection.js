const { MongoClient } = require('mongodb');
const config = require('../config');

class DatabaseConnection {
    constructor() {
        this.connectionString = config.MONGODB_URI;
        this.databaseName = config.DB_NAME;
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            console.log('Connecting to MongoDB Atlas...');
            
            // Create a new MongoClient (removed deprecated options)
            this.client = new MongoClient(this.connectionString);

            // Connect to the MongoDB cluster
            await this.client.connect();
            
            // Get the database
            this.db = this.client.db(this.databaseName);
            
            console.log('Successfully connected to MongoDB Atlas!');
            console.log(`Database: ${this.databaseName}`);
            
            // Test the connection
            await this.testConnection();
            
            return this.db;
        } catch (error) {
            console.error('Failed to connect to MongoDB Atlas:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            // Test the connection by listing collections
            const collections = await this.db.listCollections().toArray();
            console.log(`Found ${collections.length} collections in the database`);
            
            // Create a test collection if it doesn't exist
            const testCollection = this.db.collection('connection_test');
            await testCollection.insertOne({
                test: true,
                timestamp: new Date(),
                message: 'Connection test successful'
            });
            
            console.log('Database connection test successful!');
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    getCollection(collectionName) {
        return this.getDatabase().collection(collectionName);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('MongoDB connection closed.');
        }
    }

    // Helper method to create indexes for better performance
    async createIndexes() {
        try {
            const db = this.getDatabase();
            
            // Create indexes for common queries
            const locationsCollection = db.collection('locations');
            await locationsCollection.createIndex({ "latitude": 1, "longitude": 1 });
            await locationsCollection.createIndex({ "name": "text" });
            
            const rainfallCollection = db.collection('rainfall_data');
            await rainfallCollection.createIndex({ "latitude": 1, "longitude": 1, "date": 1 });
            await rainfallCollection.createIndex({ "date": 1 });
            
            console.log('Database indexes created successfully!');
        } catch (error) {
            console.error('Failed to create indexes:', error);
        }
    }
}

module.exports = DatabaseConnection;
