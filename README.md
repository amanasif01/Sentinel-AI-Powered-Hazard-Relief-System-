# Global Rainfall Data Fetcher

A Java application that fetches rainfall data for any location in the world using the NASA POWER API and OpenStreetMap geocoding. The application retrieves rainfall data for the past 7 days and provides detailed statistics.

## Features

- **Any Location Worldwide**: Search for any city, town, or location using OpenStreetMap geocoding
- **Smart Location Search**: Handles multiple search results and lets you choose the exact location
- **NASA POWER API Integration**: Uses NASA's Prediction of Worldwide Energy Resources (POWER) API for accurate rainfall data
- **Past 7 Days Data**: Automatically fetches rainfall data for the last 7 days
- **Detailed Statistics**: Provides total rainfall, average daily rainfall, days with rain, and maximum daily rainfall
- **User-Friendly Interface**: Interactive command-line interface with location search

## Prerequisites

- Java 11 or higher (JDK recommended)
- Maven 3.6 or higher (for dependency management)
- Internet connection (for API calls)

### Installing Maven (if not already installed)

**Windows:**
1. Download Maven from: https://maven.apache.org/download.cgi
2. Extract to a directory (e.g., `C:\Program Files\Apache\maven`)
3. Add Maven bin directory to your PATH environment variable
4. Verify installation: `mvn -version`

**macOS/Linux:**
```bash
# Using Homebrew (macOS)
brew install maven

# Using apt (Ubuntu/Debian)
sudo apt update
sudo apt install maven

# Using yum (CentOS/RHEL)
sudo yum install maven
```

## Installation

1. **Clone or download the project**:
   ```bash
   git clone <repository-url>
   cd pakistan-rainfall
   ```

2. **Build the project**:
   ```bash
   mvn clean compile
   ```

### Alternative: Compilation without Maven

If you don't have Maven installed, you can compile manually:

1. **Download required JAR files** to a `lib` directory:
   - Apache HttpClient: https://mvnrepository.com/artifact/org.apache.httpcomponents/httpclient
   - Jackson Databind: https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-databind
   - SLF4J Simple: https://mvnrepository.com/artifact/org.slf4j/slf4j-simple

2. **Compile using javac**:
   ```bash
   # Windows
   compile.bat
   
   # Linux/macOS
   javac -d target/classes -cp "lib/*" src/main/java/com/nasa/power/*.java
   ```

3. **Run the application**:
   ```bash
   java -cp "target/classes;lib/*" com.nasa.power.PakistanRainfallApp
   ```

## Usage

### Running the Application

1. **Compile and run**:
   ```bash
   mvn clean compile exec:java -Dexec.mainClass="com.nasa.power.PakistanRainfallApp"
   ```

2. **Or build and run the JAR**:
   ```bash
   mvn clean package
   java -jar target/pakistan-rainfall-1.0.0.jar
   ```

### Using the Application

1. Enter any location name (city, town, or specific place)
2. Examples:
   - "Swat, Pakistan"
   - "Murree, Pakistan"
   - "New York, USA"
   - "London, UK"
   - "Tokyo, Japan"
3. If multiple locations are found, select the exact one you want
4. The application will fetch rainfall data for the past 7 days
5. Results will show:
   - Daily rainfall data with descriptions
   - Summary statistics
   - Total and average rainfall

### Example Output

```
=== Global Rainfall Data Fetcher ===
Using NASA POWER API + OpenStreetMap Geocoding

You can search for any location in the world!
Examples: Swat, Pakistan | Murree, Pakistan | New York, USA

Enter location name: Swat, Pakistan

Searching for location: Swat, Pakistan

Found location: Swat, Khyber Pakhtunkhwa, Pakistan

Fetching rainfall data for: Swat, Khyber Pakhtunkhwa, Pakistan
Coordinates: 34.7500°N, 72.3500°E
Data for the past 7 days:

=== Rainfall Data for Swat, Khyber Pakhtunkhwa, Pakistan ===
Location: 34.7500°N, 72.3500°E

Date         Rainfall (mm)   Description
==================================================
2024-01-15   0.00           No rain
2024-01-16   2.34           Light rain
2024-01-17   0.00           No rain
...

=== Summary ===
Total rainfall (7 days): 15.67 mm
Average daily rainfall: 2.24 mm
Days with rain: 3
Maximum daily rainfall: 8.45 mm
```

## Location Search

The application can search for any location worldwide using OpenStreetMap's comprehensive database. You can search for:

- **Cities and Towns**: "Karachi, Pakistan", "New York, USA", "London, UK"
- **Specific Areas**: "Swat Valley, Pakistan", "Central Park, New York"
- **Landmarks**: "Eiffel Tower, Paris", "Mount Everest, Nepal"
- **Coordinates**: The app will automatically find the nearest named location

### Search Tips

- Include country name for better accuracy: "Swat, Pakistan" instead of just "Swat"
- Use specific area names: "Murree Hills, Pakistan"
- For multiple results, the app will let you choose the exact location

## API Information

This application uses two APIs:

### NASA POWER API
- **Purpose**: Rainfall data retrieval
- **Base URL**: https://power.larc.nasa.gov/api/
- **Parameter**: PRECTOTCORR (Precipitation corrected)
- **Data Source**: MERRA-2 reanalysis data
- **Spatial Resolution**: 0.5° x 0.625° (approximately 50km)
- **Temporal Resolution**: Daily

### OpenStreetMap Nominatim API
- **Purpose**: Location geocoding (converting place names to coordinates)
- **Base URL**: https://nominatim.openstreetmap.org/
- **Features**: Free, no API key required
- **Coverage**: Worldwide location database
- **Rate Limit**: 1 request per second (respected by the application)

## Project Structure

```
src/main/java/com/nasa/power/
├── PakistanRainfallApp.java    # Main application class
├── NasaPowerApiClient.java     # NASA POWER API client
├── GeocodingService.java       # OpenStreetMap geocoding service
├── LocationResult.java         # Location search results
├── RainfallData.java           # Rainfall data container
└── DailyRainfall.java          # Daily rainfall record
```

## Dependencies

- **Apache HttpClient**: For HTTP requests to NASA API
- **Jackson**: For JSON parsing
- **SLF4J**: For logging
- **Java Time**: For date/time handling

## Error Handling

The application includes comprehensive error handling for:
- Invalid city names
- Network connectivity issues
- API response errors
- JSON parsing errors

## Contributing

Feel free to contribute by:
- Adding more cities
- Improving error handling
- Adding new features
- Fixing bugs

## License

This project is open source and available under the MIT License.

## Disclaimer

This application uses NASA's POWER API for rainfall data. The accuracy and availability of data depend on NASA's services. The application is for educational and informational purposes only. 



Necessary Downloads:
Location checking and power api:

Java:
Download Link: https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
Exact File: jdk-11.0.21_windows-x64_bin.exe
Version: JDK 11.0.21
Architecture: x64 (64-bit)


Maven - Required Version
Apache Maven 3.9.x
Download Link: https://maven.apache.org/download.cgi
Exact File: apache-maven-3.9.6-bin.zip
Version: 3.9.6 (latest stable)
Package: Binary zip archive







api calls:
openweather: next 7 days
nasa: previous 7 days
openstreet map: nearest waterbody



server url
mongodb+srv://amanasif01:icecream123@cluster0.9zkpi.mongodb.net/?retryWrites=true&w=majority
&appName=Cluster0


imp for community:: 
npm install bcrypt multer



