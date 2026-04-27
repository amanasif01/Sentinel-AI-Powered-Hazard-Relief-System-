const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const WeatherForecast = require('./WeatherForecast');

/**
 * Service to fetch future weather predictions using OpenWeatherMap API
 */
class WeatherForecastService {
    constructor() {
        this.OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";
        this.API_KEY = this.loadApiKey();
        this.agent = new https.Agent({ 
            keepAlive: true, 
            maxSockets: 10,
            maxFreeSockets: 5,
            timeout: 60000,
            freeSocketTimeout: 30000
        });
    }
    
    /**
     * Fetch 7-day weather forecast for a location
     */
    async getWeatherForecast(latitude, longitude) {
        try {
            const url = `${this.OPENWEATHER_BASE_URL}?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}&appid=${this.API_KEY}&units=metric&cnt=40`;
            
            console.log("Fetching weather forecast from OpenWeatherMap API");
            
            const jsonResponse = await this.makeHttpRequest(url);
            return this.parseWeatherForecast(jsonResponse);
            
        } catch (error) {
            console.error("Error fetching weather forecast", error);
            throw new Error(`Failed to fetch weather forecast: ${error.message}`);
        }
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
                        const snippet = data ? data.substring(0, Math.min(data.length, 500)) : "";
                        console.error(`OpenWeatherMap API error (status ${res.statusCode}): ${snippet}`);
                        reject(new Error(`Weather API request failed (${res.statusCode}) - ${snippet}`));
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
    
    parseWeatherForecast(jsonResponse) {
        try {
            const root = JSON.parse(jsonResponse);
            const list = root.list;
            
            const forecasts = [];
            let currentDate = null;
            let dailyForecast = null;
            
            for (const item of list) {
                const dateTime = item.dt_txt;
                const dateStr = dateTime.substring(0, 10);
                const date = new Date(dateStr);
                
                if (!currentDate || date.getTime() !== currentDate.getTime()) {
                    if (dailyForecast) {
                        forecasts.push(dailyForecast);
                    }
                    
                    currentDate = date;
                    dailyForecast = new WeatherForecast(date);
                }
                
                // Update daily forecast with hourly data
                const main = item.main;
                const weather = item.weather[0];
                const rain = item.rain;
                
                const temp = main.temp;
                const humidity = main.humidity;
                const description = weather.description;
                const rainfall = rain ? (rain['3h'] || 0.0) : 0.0;
                
                dailyForecast.updateForecast(temp, humidity, description, rainfall);
            }
            
            if (dailyForecast) {
                forecasts.push(dailyForecast);
            }
            
            return forecasts;
            
        } catch (error) {
            console.error("Error parsing weather forecast", error);
            throw new Error(`Failed to parse weather forecast: ${error.message}`);
        }
    }
    
    close() {
        // Clean up HTTP agent
        if (this.agent) {
            this.agent.destroy();
        }
    }
    
    loadApiKey() {
        // 1) Environment variable override
        const envKey = process.env.OPENWEATHER_API_KEY;
        if (envKey && envKey.trim() !== '') {
            console.log("Loaded OpenWeather API key from environment variable");
            return envKey;
        }

        // 2) Try multiple possible config locations relative to working dir and script dir
        const candidatePaths = [
            "config.properties",
            "./config.properties",
            "../config.properties",
            path.join(this.getScriptDirSafe(), "config.properties")
        ];

        for (const configPath of candidatePaths) {
            if (!configPath || configPath.trim() === '') continue;
            try {
                if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
                    continue;
                }
                
                const content = fs.readFileSync(configPath, 'utf8');
                const lines = content.split('\n');
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('openweathermap.api.key=')) {
                        const apiKey = trimmedLine.substring('openweathermap.api.key='.length).trim();
                        if (apiKey && apiKey !== '' && apiKey !== 'YOUR_API_KEY_HERE') {
                            console.log(`Loaded OpenWeather API key from: ${path.resolve(configPath)}`);
                            return apiKey;
                        }
                    }
                }
            } catch (error) {
                // Try next candidate
            }
        }

        console.warn("OpenWeatherMap API key not found. Set OPENWEATHER_API_KEY env var or add openweathermap.api.key to config.properties");
        return "DEMO_KEY";
    }

    getScriptDirSafe() {
        try {
            return path.dirname(require.main.filename);
        } catch (error) {
            return "";
        }
    }
}

module.exports = WeatherForecastService;
