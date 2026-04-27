const DailyRainfall = require('./DailyRainfall');

/**
 * Data class to hold rainfall data for a location
 */
class RainfallData {
    constructor(latitude, longitude, dailyData) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.dailyData = dailyData;
    }
    
    getLatitude() {
        return this.latitude;
    }
    
    getLongitude() {
        return this.longitude;
    }
    
    getDailyData() {
        return this.dailyData;
    }
    
    /**
     * Calculate total rainfall for the period
     */
    getTotalRainfall() {
        return this.dailyData.reduce((sum, daily) => sum + daily.getRainfall(), 0);
    }
    
    /**
     * Calculate average daily rainfall
     */
    getAverageRainfall() {
        if (this.dailyData.length === 0) {
            return 0.0;
        }
        return this.getTotalRainfall() / this.dailyData.length;
    }
    
    /**
     * Count days with rainfall > 0
     */
    getDaysWithRain() {
        return this.dailyData.filter(daily => daily.getRainfall() > 0).length;
    }
    
    /**
     * Get maximum daily rainfall
     */
    getMaxRainfall() {
        if (this.dailyData.length === 0) {
            return 0.0;
        }
        return Math.max(...this.dailyData.map(daily => daily.getRainfall()));
    }
    
    /**
     * Get minimum daily rainfall
     */
    getMinRainfall() {
        if (this.dailyData.length === 0) {
            return 0.0;
        }
        return Math.min(...this.dailyData.map(daily => daily.getRainfall()));
    }
    
    /**
     * Get rainfall for a specific date
     */
    getRainfallForDate(date) {
        const DateUtils = require('./DateUtils');
        const daily = this.dailyData.find(daily => DateUtils.equals(daily.getDate(), date));
        return daily ? daily.getRainfall() : 0.0;
    }
}

module.exports = RainfallData;
