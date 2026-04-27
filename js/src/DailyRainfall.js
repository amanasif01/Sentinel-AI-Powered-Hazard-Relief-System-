/**
 * Data class to hold daily rainfall information
 */
class DailyRainfall {
    constructor(date, rainfall) {
        this.date = date;
        this.rainfall = rainfall;
    }
    
    getDate() {
        return this.date;
    }
    
    getRainfall() {
        return this.rainfall;
    }
    
    toString() {
        return `DailyRainfall{date=${this.date}, rainfall=${this.rainfall.toFixed(2)} mm}`;
    }
}

module.exports = DailyRainfall;
