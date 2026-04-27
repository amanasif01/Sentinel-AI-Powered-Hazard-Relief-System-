const fs = require('fs');
const path = require('path');

/**
 * Practical water level service using your existing CSV dataset
 * This uses REAL data instead of simulated APIs
 */
class PracticalWaterLevelService {
    constructor() {
        this.datasetPath = path.join(__dirname, '../datasets/THESIS - GIS DATA - FLOOD SCENARIOS_UPDATED.csv');
        this.waterLevelData = null;
        this.cache = new Map();
        this.cacheTTL = 300000; // 5 minutes
    }

    /**
     * Load water level data from CSV
     */
    async loadDataset() {
        if (this.waterLevelData) return this.waterLevelData;

        try {
            console.log('Loading water level dataset...');
            const csvContent = fs.readFileSync(this.datasetPath, 'utf8');
            const lines = csvContent.split('\n');
            
            // Skip header row
            const dataLines = lines.slice(1).filter(line => line.trim());
            
            this.waterLevelData = dataLines.map((line, index) => {
                const columns = line.split(',');
                return {
                    id: index,
                    rainfall: parseFloat(columns[0]) || 0,
                    waterLevel: parseFloat(columns[1]) || 0,
                    elevation: parseFloat(columns[2]) || 0,
                    slope: parseFloat(columns[3]) || 0,
                    distanceFromRiver: parseFloat(columns[4]) || 0,
                    floodStatus: columns[5]?.trim() || 'Unknown'
                };
            });

            console.log(`Loaded ${this.waterLevelData.length} water level records`);
            return this.waterLevelData;
        } catch (error) {
            console.error('Error loading dataset:', error);
            return [];
        }
    }

    /**
     * Get water level for a specific location using nearest neighbor approach
     */
    async getWaterLevelForLocation(latitude, longitude) {
        const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }

        await this.loadDataset();
        
        if (!this.waterLevelData || this.waterLevelData.length === 0) {
            return this.getFallbackWaterLevel();
        }

        // Find nearest data points based on elevation and distance from river
        // Since we don't have exact lat/lon for each record, we'll use elevation as a proxy
        const elevation = this.estimateElevation(latitude, longitude);
        
        // Find records with similar elevation (±100m) and distance from river
        const nearbyRecords = this.waterLevelData.filter(record => 
            Math.abs(record.elevation - elevation) < 100 &&
            record.distanceFromRiver < 1000 // Within 1km of river
        );

        if (nearbyRecords.length === 0) {
            // Fallback to any records with similar elevation
            const elevationRecords = this.waterLevelData.filter(record => 
                Math.abs(record.elevation - elevation) < 200
            );
            
            if (elevationRecords.length > 0) {
                const avgWaterLevel = elevationRecords.reduce((sum, r) => sum + r.waterLevel, 0) / elevationRecords.length;
                const result = this.createWaterLevelResponse(avgWaterLevel, 'elevation-based', elevationRecords.length);
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            }
        } else {
            // Use nearby records
            const avgWaterLevel = nearbyRecords.reduce((sum, r) => sum + r.waterLevel, 0) / nearbyRecords.length;
            const result = this.createWaterLevelResponse(avgWaterLevel, 'dataset-based', nearbyRecords.length);
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        }

        return this.getFallbackWaterLevel();
    }

    /**
     * Estimate elevation based on coordinates (rough approximation for Pakistan)
     */
    estimateElevation(latitude, longitude) {
        // Rough elevation estimation for Pakistan regions
        if (latitude > 35) return 3000; // Northern mountains
        if (latitude > 34) return 2000; // Northern hills
        if (latitude > 33) return 1000; // Central hills
        if (latitude > 32) return 500;  // Central plains
        if (latitude > 31) return 200; // Southern plains
        return 50; // Coastal areas
    }

    /**
     * Create standardized water level response
     */
    createWaterLevelResponse(waterLevel, source, recordCount) {
        const riskLevel = this.getRiskLevel(waterLevel);
        
        return {
            level: Math.round(waterLevel),
            confidence: Math.min(0.9, 0.5 + (recordCount * 0.1)), // Higher confidence with more records
            isRealTime: false,
            isDatasetBased: true,
            source: source,
            recordCount: recordCount,
            factors: {
                dataSource: 'CSV Dataset',
                recordCount: recordCount,
                method: source
            },
            riskLevel: riskLevel,
            status: this.getStatus(riskLevel),
            lastUpdated: new Date()
        };
    }

    /**
     * Get risk level based on water level
     */
    getRiskLevel(waterLevel) {
        if (waterLevel < 1000) return 'Low';
        if (waterLevel < 2000) return 'Medium';
        if (waterLevel < 3000) return 'High';
        return 'Critical';
    }

    /**
     * Get status description
     */
    getStatus(riskLevel) {
        const statuses = {
            'Low': 'Normal water levels - minimal flood risk',
            'Medium': 'Elevated water levels - moderate flood risk',
            'High': 'High water levels - significant flood risk',
            'Critical': 'Critical water levels - immediate flood danger'
        };
        return statuses[riskLevel] || 'Status unknown';
    }

    /**
     * Fallback when no data is available
     */
    getFallbackWaterLevel() {
        return {
            level: 1500,
            confidence: 0.3,
            isRealTime: false,
            isDatasetBased: false,
            source: 'Fallback',
            factors: {
                dataSource: 'Fallback Estimation',
                method: 'default'
            },
            riskLevel: 'Medium',
            status: 'Using default estimation - no data available',
            lastUpdated: new Date()
        };
    }

    /**
     * Get dataset statistics
     */
    getDatasetStats() {
        if (!this.waterLevelData) return null;
        
        const waterLevels = this.waterLevelData.map(r => r.waterLevel);
        const elevations = this.waterLevelData.map(r => r.elevation);
        
        return {
            totalRecords: this.waterLevelData.length,
            avgWaterLevel: waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length,
            minWaterLevel: Math.min(...waterLevels),
            maxWaterLevel: Math.max(...waterLevels),
            avgElevation: elevations.reduce((a, b) => a + b, 0) / elevations.length,
            floodRecords: this.waterLevelData.filter(r => r.floodStatus === 'High').length
        };
    }
}

module.exports = PracticalWaterLevelService;
