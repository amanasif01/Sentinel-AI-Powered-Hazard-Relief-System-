# Pakistan Rainfall App - JavaScript Version

A Node.js application that fetches rainfall data for any location in the world using NASA POWER API and OpenStreetMap geocoding.

## Features

- **Global Location Search**: Search for any location worldwide using OpenStreetMap Nominatim API
- **Historical Rainfall Data**: Fetch 7-day rainfall data from NASA POWER API
- **Weather Forecasts**: Get 7-day weather predictions using OpenWeatherMap API
- **Waterbody Information**: Find nearest rivers, lakes, or water bodies using OpenStreetMap Overpass API
- **Interactive CLI**: User-friendly command-line interface with location selection

## Prerequisites

- Node.js 14.0.0 or higher
- Internet connection for API calls

## Installation

1. Navigate to the JavaScript directory:
   ```bash
   cd js
   ```

2. The application uses only Node.js built-in modules, so no additional dependencies need to be installed.

## Usage

### Basic Usage

Run the application:
```bash
npm start
```

Or directly with Node.js:
```bash
node src/PakistanRainfallApp.js
```

### Configuration (Optional)

For weather forecasts, you can optionally set up an OpenWeatherMap API key:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set it as an environment variable:
   ```bash
   export OPENWEATHER_API_KEY=your_api_key_here
   ```
   
   Or create a `config.properties` file in the project root:
   ```
   openweathermap.api.key=your_api_key_here
   ```

## Example Usage

```
=== Global Rainfall Data Fetcher ===
Using NASA POWER API + OpenStreetMap Geocoding

You can search for any location in the world!
Examples: Swat, Pakistan | Murree, Pakistan | New York, USA

Enter location name: Swat, Pakistan

Searching for location: Swat, Pakistan

Found location: Swat, Khyber Pakhtunkhwa, Pakistan

Fetching rainfall data for: Swat, Khyber Pakhtunkhwa, Pakistan
Coordinates: 35.2156°N, 72.5719°E
Data for 7 days (2024-01-15 to 2024-01-21):

=== Rainfall Data for Swat, Khyber Pakhtunkhwa, Pakistan ===
Location: 35.2156°N, 72.5719°E

Date         Rainfall (mm)   Description
==================================================
2024-01-15   0.00           No rain
2024-01-16   2.34           Light rain
2024-01-17   0.00           No rain
2024-01-18   5.67           Moderate rain
2024-01-19   0.00           No rain
2024-01-20   1.23           Light rain
2024-01-21   0.00           No rain

=== Summary ===
Total rainfall (7 days): 9.24 mm
Average daily rainfall: 1.32 mm
Days with rain: 3
Maximum daily rainfall: 5.67 mm

Nearest waterbody (within 50 km): 
1234 m - Swat River (river)

============================================================
FETCHING FUTURE WEATHER PREDICTIONS (Next 7 Days)
============================================================

=== Weather Forecast for Swat, Khyber Pakhtunkhwa, Pakistan (Next 7 Days) ===

Date         Temperature        Humidity        Rainfall        Weather
=====================================================================================
2024-01-22   5.2°C - 12.8°C   75%             0.0 mm          clear sky
2024-01-23   4.1°C - 11.5°C   78%             1.2 mm          light rain
2024-01-24   3.8°C - 10.2°C   82%             3.5 mm          moderate rain
2024-01-25   2.5°C - 9.1°C    85%             0.8 mm          light rain
2024-01-26   1.9°C - 8.7°C    80%             0.0 mm          clear sky
2024-01-27   2.3°C - 9.3°C    77%             0.0 mm          clear sky
2024-01-28   3.1°C - 10.1°C   79%             0.5 mm          light rain

=== Forecast Summary ===
Days with rain: 4 out of 7
Average temperature: 6.8°C
Average humidity: 79%
```

## API Services Used

1. **OpenStreetMap Nominatim API**: For geocoding (converting location names to coordinates)
2. **NASA POWER API**: For historical rainfall data
3. **OpenWeatherMap API**: For weather forecasts (optional)
4. **OpenStreetMap Overpass API**: For finding nearby water bodies

## File Structure

```
js/
├── package.json
├── README.md
└── src/
    ├── PakistanRainfallApp.js      # Main application
    ├── DateUtils.js                # Date utility functions
    ├── LocationResult.js           # Location data class
    ├── DailyRainfall.js            # Daily rainfall data class
    ├── RainfallData.js             # Rainfall data container
    ├── WeatherForecast.js          # Weather forecast data class
    ├── GeocodingService.js         # OpenStreetMap geocoding service
    ├── NasaPowerApiClient.js       # NASA POWER API client
    ├── OsmWaterbodyService.js      # OpenStreetMap water body service
    └── WeatherForecastService.js   # OpenWeatherMap forecast service
```

## Error Handling

The application includes comprehensive error handling for:
- Network connectivity issues
- API rate limiting
- Invalid location names
- Missing API keys
- Malformed responses

## Notes

- The NASA POWER API has a 2-3 day delay for current data
- Weather forecasts require an OpenWeatherMap API key (free tier available)
- All APIs used are free and don't require authentication (except OpenWeatherMap)
- The application respects API rate limits and includes retry logic

## License

ISC License
