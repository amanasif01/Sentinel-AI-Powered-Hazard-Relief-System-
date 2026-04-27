const readline = require('readline');
const GeocodingService = require('./GeocodingService');
const NasaPowerApiClient = require('./NasaPowerApiClient');
const OsmWaterbodyService = require('./OsmWaterbodyService');
const WeatherForecastService = require('./WeatherForecastService');
const DateUtils = require('./DateUtils');

/**
 * Main application class for fetching rainfall data for any location
 * using NASA POWER API and OpenStreetMap geocoding
 */
class PakistanRainfallApp {
    static async main() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log("=== Global Rainfall Data Fetcher ===");
        console.log("Using NASA POWER API + OpenStreetMap Geocoding");
        console.log();
        console.log("You can search for any location in the world!");
        console.log("Examples: Swat, Pakistan | Murree, Pakistan | New York, USA");
        console.log();
        
        try {
            // Get user input
            const locationName = await this.question(rl, "Enter location name: ");
            
            if (!locationName || locationName.trim() === '') {
                console.log("Location name cannot be empty.");
                return;
            }
            
            console.log();
            console.log("Searching for location: " + locationName);
            console.log();
            
            // Create geocoding service
            const geocodingService = new GeocodingService();
            
            // Search for the location
            const searchResults = await geocodingService.searchLocation(locationName);
            
            if (searchResults.length === 0) {
                console.log("No locations found for: " + locationName);
                console.log("Please try a different search term.");
                return;
            }
            
            // Display search results if multiple found
            let selectedLocation;
            if (searchResults.length === 1) {
                selectedLocation = searchResults[0];
                console.log("Found location: " + selectedLocation.getDisplayName());
            } else {
                console.log("Multiple locations found. Please select one:");
                console.log();
                
                for (let i = 0; i < searchResults.length; i++) {
                    const result = searchResults[i];
                    console.log(`${i + 1}. ${result.getDisplayName()}`);
                }
                console.log();
                
                const selection = await this.question(rl, `Enter selection (1-${searchResults.length}): `);
                
                try {
                    const index = parseInt(selection) - 1;
                    if (index >= 0 && index < searchResults.length) {
                        selectedLocation = searchResults[index];
                    } else {
                        console.log("Invalid selection.");
                        return;
                    }
                } catch (error) {
                    console.log("Invalid selection. Please enter a number.");
                    return;
                }
            }
            
            // Calculate date range (past 7 days from last available data)
            // NASA POWER API typically has a 2-3 day delay for current data
            const endDate = DateUtils.minusDays(DateUtils.now(), 3); // Go back 3 days to ensure data availability
            const startDate = DateUtils.minusDays(endDate, 6);
            
            console.log();
            console.log("Fetching rainfall data for: " + selectedLocation.getDisplayName());
            console.log("Coordinates: " + selectedLocation.getLatitude() + "°N, " + 
                       selectedLocation.getLongitude() + "°E");
            console.log("Data for 7 days (" + DateUtils.format(startDate, 'YYYY-MM-DD') + " to " + DateUtils.format(endDate, 'YYYY-MM-DD') + "):");
            console.log();
            
            // OPTIMIZATION: Run ALL API calls in parallel for maximum speed
            console.log("Fetching all data in parallel for maximum speed...");
            console.log();
            
            const [rainfallResult, waterbodyResult, forecastResult] = await Promise.allSettled([
                // Rainfall data (highest priority - show first)
                (async () => {
                    const apiClient = new NasaPowerApiClient();
                    try {
                        const rainfallData = await apiClient.getRainfallData(
                            selectedLocation.getLatitude(), 
                            selectedLocation.getLongitude(), 
                            startDate, 
                            endDate
                        );
                        return { rainfallData, apiClient };
                    } catch (error) {
                        apiClient.close();
                        throw error;
                    }
                })(),
                
                // Water body search
                (async () => {
                    const osmService = new OsmWaterbodyService();
                    try {
                        const largest = await osmService.findNearestWaterbody(
                            selectedLocation.getLatitude(),
                            selectedLocation.getLongitude()
                        );
                        return { largest, osmService };
                    } catch (error) {
                        osmService.close();
                        throw error;
                    }
                })(),
                
                // Weather forecast
                (async () => {
                    const forecastService = new WeatherForecastService();
                    try {
                        const forecasts = await forecastService.getWeatherForecast(
                            selectedLocation.getLatitude(), 
                            selectedLocation.getLongitude()
                        );
                        return { forecasts, forecastService };
                    } catch (error) {
                        forecastService.close();
                        throw error;
                    }
                })()
            ]);
            
            // Display rainfall results first (most important)
            if (rainfallResult.status === 'fulfilled') {
                const { rainfallData, apiClient } = rainfallResult.value;
                this.displayRainfallData(selectedLocation.getDisplayName(), rainfallData);
                apiClient.close();
            } else {
                console.error("Error: Could not fetch rainfall data: " + rainfallResult.reason.message);
                return;
            }
            
            // Display water body results
            if (waterbodyResult.status === 'fulfilled') {
                const { largest, osmService } = waterbodyResult.value;
                if (largest.found()) {
                    console.log();
                    console.log("Nearest waterbody (within 50 km): ");
                    console.log(`${Math.round(largest.getDistanceMeters())} m - ${largest.getName() || 'Unnamed'} (${largest.getType() || 'water'})`);
                } else {
                    console.log();
                    console.log("Nearest waterbody: None found within 50 km");
                }
                osmService.close();
            } else {
                console.error("Warning: Could not fetch waterbody info: " + waterbodyResult.reason.message);
            }

            // Display weather forecast results
            console.log();
            console.log("=".repeat(60));
            console.log("FETCHING FUTURE WEATHER PREDICTIONS (Next 7 Days)");
            console.log("=".repeat(60));
            
            if (forecastResult.status === 'fulfilled') {
                const { forecasts, forecastService } = forecastResult.value;
                this.displayWeatherForecast(selectedLocation.getDisplayName(), forecasts);
                forecastService.close();
            } else {
                console.error("Warning: Could not fetch weather predictions: " + forecastResult.reason.message);
                console.error("Note: You need to get a free API key from OpenWeatherMap");
                console.error("Visit: https://openweathermap.org/api to get your API key");
            }
            
            // Close services
            geocodingService.close();
            
        } catch (error) {
            console.error("Error: " + error.message);
            if (error.message.includes("geocoding")) {
                console.error("Please check your internet connection and try again.");
            }
        } finally {
            rl.close();
        }
    }
    
    static question(rl, prompt) {
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    
    static displayRainfallData(city, rainfallData) {
        console.log("=== Rainfall Data for " + city + " ===");
        console.log("Location: " + rainfallData.getLatitude() + "°N, " + 
                   rainfallData.getLongitude() + "°E");
        console.log();
        
        console.log("Date         Rainfall (mm)   Description");
        console.log("=".repeat(50));
        
        for (const daily of rainfallData.getDailyData()) {
            const dateStr = DateUtils.format(daily.getDate(), 'YYYY-MM-DD');
            const rainfallStr = daily.getRainfall().toFixed(2);
            const description = this.getRainfallDescription(daily.getRainfall());
            
            console.log(`${dateStr.padEnd(12)} ${rainfallStr.padEnd(15)} ${description}`);
        }
        
        console.log();
        console.log("=== Summary ===");
        console.log(`Total rainfall (7 days): ${rainfallData.getTotalRainfall().toFixed(2)} mm`);
        console.log(`Average daily rainfall: ${rainfallData.getAverageRainfall().toFixed(2)} mm`);
        console.log(`Days with rain: ${rainfallData.getDaysWithRain()}`);
        console.log(`Maximum daily rainfall: ${rainfallData.getMaxRainfall().toFixed(2)} mm`);
    }
    
    static getRainfallDescription(rainfall) {
        if (rainfall === 0) {
            return "No rain";
        } else if (rainfall < 2.5) {
            return "Light rain";
        } else if (rainfall < 7.5) {
            return "Moderate rain";
        } else if (rainfall < 50) {
            return "Heavy rain";
        } else {
            return "Very heavy rain";
        }
    }
    
    static displayWeatherForecast(city, forecasts) {
        console.log("=== Weather Forecast for " + city + " (Next 7 Days) ===");
        console.log();
        
        console.log("Date         Temperature        Humidity        Rainfall        Weather");
        console.log("=".repeat(85));
        
        for (const forecast of forecasts) {
            const dateStr = DateUtils.format(forecast.getDate(), 'YYYY-MM-DD');
            const tempStr = forecast.getTemperatureRange();
            const humidityStr = `${Math.round(forecast.getAverageHumidity())}%`;
            const rainfallStr = `${forecast.getTotalRainfall().toFixed(1)} mm`;
            const weatherStr = forecast.getMostCommonDescription();
            
            console.log(`${dateStr.padEnd(12)} ${tempStr.padEnd(20)} ${humidityStr.padEnd(15)} ${rainfallStr.padEnd(15)} ${weatherStr}`);
        }
        
        console.log();
        console.log("=== Forecast Summary ===");
        
        const daysWithRain = forecasts.filter(forecast => forecast.hasRain()).length;
        const avgTemp = forecasts.reduce((sum, forecast) => sum + forecast.getAverageTemperature(), 0) / forecasts.length;
        const avgHumidity = forecasts.reduce((sum, forecast) => sum + forecast.getAverageHumidity(), 0) / forecasts.length;
        
        console.log(`Days with rain: ${daysWithRain} out of ${forecasts.length}`);
        console.log(`Average temperature: ${avgTemp.toFixed(1)}°C`);
        console.log(`Average humidity: ${Math.round(avgHumidity)}%`);
    }
}

// Run the application if this file is executed directly
if (require.main === module) {
    PakistanRainfallApp.main().catch(console.error);
}

module.exports = PakistanRainfallApp;
