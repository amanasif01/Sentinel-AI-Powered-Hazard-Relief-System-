const https = require('https');
const http = require('http');
const { URL } = require('url');
const RainfallData = require('./RainfallData');
const DailyRainfall = require('./DailyRainfall');

/**
 * Client for NASA POWER API to fetch rainfall data
 */
class NasaPowerApiClient {
    constructor() {
        this.BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
        this.PARAMETERS = "PRECTOTCORR"; // Precipitation corrected
        this.COMMUNITY = "RE";
        this.FORMAT = "JSON";
        this.agent = new https.Agent({ 
            keepAlive: true, 
            maxSockets: 10,
            maxFreeSockets: 5,
            timeout: 60000,
            freeSocketTimeout: 30000
        });
    }
    
    /**
     * Fetch rainfall data for a specific location and date range
     */
    async getRainfallData(latitude, longitude, startDate, endDate) {
        const url = this.buildApiUrl(latitude, longitude, startDate, endDate);
        console.log(`Fetching data from URL: ${url}`);
        
        try {
            const jsonResponse = await this.makeHttpRequest(url);
            return this.parseRainfallData(jsonResponse, latitude, longitude);
        } catch (error) {
            console.error("Error fetching rainfall data", error);
            throw new Error(`Failed to fetch rainfall data: ${error.message}`);
        }
    }
    
    buildApiUrl(latitude, longitude, startDate, endDate) {
        const DateUtils = require('./DateUtils');
        const startDateStr = DateUtils.format(startDate, 'YYYYMMDD');
        const endDateStr = DateUtils.format(endDate, 'YYYYMMDD');
        
        return `${this.BASE_URL}?parameters=${this.PARAMETERS}&community=${this.COMMUNITY}&longitude=${longitude.toFixed(4)}&latitude=${latitude.toFixed(4)}&start=${startDateStr}&end=${endDateStr}&format=${this.FORMAT}`;
    }
    
    async makeHttpRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Connection': 'keep-alive',
                    'Accept': 'application/json'
                },
                agent: this.agent
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`HTTP request failed with status code: ${res.statusCode}. Response: ${data}`));
                    } else {
                        resolve(data);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.end();
        });
    }
    
    parseRainfallData(jsonResponse, latitude, longitude) {
        try {
            const rootNode = JSON.parse(jsonResponse);
            
            // Navigate to the data - point endpoint has different structure
            const parametersNode = rootNode.properties?.parameter;
            const prectotcorrNode = parametersNode?.[this.PARAMETERS];
            
            const dailyData = [];
            
            // Parse daily rainfall data - point endpoint returns key-value pairs
            if (prectotcorrNode && typeof prectotcorrNode === 'object') {
                for (const [dateKey, rainfallValue] of Object.entries(prectotcorrNode)) {
                    const rainfall = parseFloat(rainfallValue);
                    
                    // Skip NASA's fill value (-999.0) which indicates no data
                    if (rainfall !== -999.0) {
                        // Parse date from format "yyyyMMdd"
                        const year = parseInt(dateKey.substring(0, 4));
                        const month = parseInt(dateKey.substring(4, 6));
                        const day = parseInt(dateKey.substring(6, 8));
                        const date = new Date(year, month - 1, day); // month is 0-indexed in JS
                        dailyData.push(new DailyRainfall(date, rainfall));
                    }
                }
            }
            
            // Sort daily data by date to ensure chronological order
            dailyData.sort((d1, d2) => d1.getDate() - d2.getDate());
            
            return new RainfallData(latitude, longitude, dailyData);
            
        } catch (error) {
            console.error("Error parsing JSON response", error);
            throw new Error(`Failed to parse rainfall data: ${error.message}`);
        }
    }
    
    close() {
        // Clean up HTTP agent
        if (this.agent) {
            this.agent.destroy();
        }
    }
}

module.exports = NasaPowerApiClient;
