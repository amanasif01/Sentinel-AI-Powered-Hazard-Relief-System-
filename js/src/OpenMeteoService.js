const https = require('https');

/**
 * Service to fetch comprehensive weather data (History + Current + Forecast) from Open-Meteo
 * Open-Meteo provides excellent free data with no API key required for non-commercial use.
 * It fills the "recent history" gap that NASA Power has.
 */
class OpenMeteoService {
    constructor() {
        this.BASE_URL = "https://api.open-meteo.com/v1/forecast";
        this.HISTORY_URL = "https://archive-api.open-meteo.com/v1/archive";
    }

    /**
     * Get current weather conditions (Temperature, Rain)
     * @param {number} latitude 
     * @param {number} longitude 
     */
    async getCurrentWeather(latitude, longitude) {
        try {
            // Fetch current temperature, rain, relative humidity, and soil moisture
            const url = `${this.BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,weather_code,relative_humidity_2m&hourly=soil_moisture_0_to_1cm&timezone=auto`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.current) {
                return { rain: 0, temp: 0, humidity: 70, soilMoisture: 40 };
            }

            // Get current hour for soil moisture (hourly array)
            let currentSoilMoisture = 40;
            if (data.hourly && data.hourly.soil_moisture_0_to_1cm && data.hourly.soil_moisture_0_to_1cm.length > 0) {
                // The current hour is roughly the first item in the hourly array, or we can just grab index 0 as proxy
                currentSoilMoisture = data.hourly.soil_moisture_0_to_1cm[0] * 100; // Convert typical 0.0-1.0 m3/m3 to percentage
            }

            return {
                rain: data.current.rain || 0,
                temp: data.current.temperature_2m || 0,
                code: data.current.weather_code || 0,
                humidity: data.current.relative_humidity_2m || 70,
                soilMoisture: currentSoilMoisture
            };
        } catch (error) {
            console.warn(`[OpenMeteoService] Current weather fetch failed: ${error.message}`);
            return { rain: 0, temp: 0, humidity: 70, soilMoisture: 40 };
        }
    }

    /**
     * Get elevation for a coordinate
     * @param {number} latitude 
     * @param {number} longitude 
     */
    async getElevation(latitude, longitude) {
        try {
            const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.elevation || data.elevation.length === 0) {
                return { elevation: 500 }; // Default
            }

            return {
                elevation: data.elevation[0]
            };
        } catch (error) {
            console.warn(`[OpenMeteoService] Elevation fetch failed: ${error.message}`);
            return { elevation: 500 }; // Default fallback
        }
    }

    /**
     * Get precipitation sum for a specific date range
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {Date} startDate 
     * @param {Date} endDate 
     */
    async getPrecipitationSum(latitude, longitude, startDate, endDate) {
        try {
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            // For recent past (up to today/forecast), use the forecast API which often includes recent history
            // Actually, for past days, using the archive API is safer if it's far back, 
            // but for "recent" (last 3-5 days), forecast API usually covers it or we use the specific history endpoint.
            // Open-Meteo forecast API allows 'past_days' parameter up to 92 days.

            const url = `${this.BASE_URL}?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&timezone=auto&start_date=${startStr}&end_date=${endStr}`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.daily || !data.daily.precipitation_sum) {
                return 0;
            }

            // Sum up the precipitation
            const total = data.daily.precipitation_sum.reduce((sum, val) => sum + (val || 0), 0);
            return total;

        } catch (error) {
            console.warn(`OpenMeteo precipitation fetch failed: ${error.message}`);
            return 0; // Fail gracefully
        }
    }

    /**
     * Get daily rainfall details for analysis (History + Forecast)
     * @param {number} latitude 
     * @param {number} longitude 
     * @param {number} pastDays Number of past days to include
     * @param {number} forecastDays Number of forecast days to include
     */
    async getDailyRainfallAnalysis(latitude, longitude, pastDays = 7, forecastDays = 7) {
        try {
            const url = `${this.BASE_URL}?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,precipitation_probability_max&timezone=auto&past_days=${pastDays}&forecast_days=${forecastDays}`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.daily || !data.daily.time) {
                console.warn('[OpenMeteoService] "daily" or "daily.time" missing in response:', JSON.stringify(data).substring(0, 200));
                return [];
            }

            const results = data.daily.time.map((date, index) => ({
                date: date,
                rainfall: data.daily.precipitation_sum[index] || 0,
                probability: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[index] : null,
                isForecast: new Date(date) > new Date()
            }));

            // Filter out today (duplicated in past_days and forecast_days sometimes)
            return results;

        } catch (error) {
            console.warn(`[OpenMeteoService] analysis fetch failed for ${latitude},${longitude}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get hourly forecast for the next 48 hours
     * @param {number} latitude 
     * @param {number} longitude 
     */
    async getHourlyForecast(latitude, longitude) {
        try {
            const url = `${this.BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=3`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.hourly || !data.hourly.time) {
                return [];
            }

            const results = data.hourly.time.map((time, index) => ({
                time: time,
                temperature: data.hourly.temperature_2m[index],
                humidity: data.hourly.relative_humidity_2m[index],
                precipitationProbability: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[index] : 0,
                weatherCode: data.hourly.weather_code ? data.hourly.weather_code[index] : 0
            }));

            // Filter for future times only (next 48 hours)
            const now = new Date();
            const futureForecasts = results.filter(f => new Date(f.time) >= now).slice(0, 48);

            return futureForecasts;

        } catch (error) {
            console.warn(`[OpenMeteoService] hourly fetch failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Get River Discharge Forecast (Flood API)
     * @param {number} latitude 
     * @param {number} longitude 
     */
    async getFloodData(latitude, longitude) {
        try {
            // Open-Meteo Flood API endpoint
            const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge,river_discharge_median&forecast_days=7`;

            const response = await this.makeHttpRequest(url);
            const data = JSON.parse(response);

            if (!data.daily || !data.daily.river_discharge) {
                return null;
            }

            // Return the discharge for "today" (index 0)
            return {
                discharge: data.daily.river_discharge[0] || 0,
                median: data.daily.river_discharge_median[0] || 0,
                unit: data.daily_units.river_discharge || 'm³/s',
                date: data.daily.time[0]
            };

        } catch (error) {
            console.warn(`[OpenMeteoService] Flood data fetch failed: ${error.message}`);
            return null;
        }
    }

    async makeHttpRequest(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`API Error: ${res.statusCode}`));
                    }
                });
            }).on('error', (err) => reject(err));
        });
    }
}

module.exports = OpenMeteoService;
