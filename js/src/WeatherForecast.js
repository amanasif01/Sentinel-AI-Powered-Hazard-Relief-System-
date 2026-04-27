/**
 * Data class to hold weather forecast information for a specific date
 */
class WeatherForecast {
    constructor(date) {
        this.date = date;
        this.temperatures = [];
        this.humidityLevels = [];
        this.descriptions = [];
        this.rainfallAmounts = [];
    }
    
    updateForecast(temperature, humidity, description, rainfall) {
        this.temperatures.push(temperature);
        this.humidityLevels.push(humidity);
        this.descriptions.push(description);
        this.rainfallAmounts.push(rainfall);
    }
    
    getDate() {
        return this.date;
    }
    
    getAverageTemperature() {
        if (this.temperatures.length === 0) return 0.0;
        return this.temperatures.reduce((sum, temp) => sum + temp, 0) / this.temperatures.length;
    }
    
    getMinTemperature() {
        if (this.temperatures.length === 0) return 0.0;
        return Math.min(...this.temperatures);
    }
    
    getMaxTemperature() {
        if (this.temperatures.length === 0) return 0.0;
        return Math.max(...this.temperatures);
    }
    
    getAverageHumidity() {
        if (this.humidityLevels.length === 0) return 0.0;
        return this.humidityLevels.reduce((sum, humidity) => sum + humidity, 0) / this.humidityLevels.length;
    }
    
    getTotalRainfall() {
        return this.rainfallAmounts.reduce((sum, rain) => sum + rain, 0);
    }
    
    getMostCommonDescription() {
        if (this.descriptions.length === 0) return "Unknown";
        
        // Find the most frequent description
        let mostCommon = this.descriptions[0];
        let maxCount = 1;
        
        for (const desc of this.descriptions) {
            const count = this.descriptions.filter(d => d === desc).length;
            if (count > maxCount) {
                maxCount = count;
                mostCommon = desc;
            }
        }
        
        return mostCommon;
    }
    
    hasRain() {
        return this.rainfallAmounts.some(rain => rain > 0);
    }
    
    getTemperatureRange() {
        if (this.temperatures.length === 0) return "N/A";
        return `${this.getMinTemperature().toFixed(1)}°C - ${this.getMaxTemperature().toFixed(1)}°C`;
    }
}

module.exports = WeatherForecast;
