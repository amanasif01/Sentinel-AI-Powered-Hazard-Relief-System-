const https = require('https');

/**
 * Service to fetch terrain data (elevation and slope) using Open-Elevation API
 */
class TerrainService {
    /**
     * Get elevation at a specific lat/lon
     */
    async getElevation(lat, lon) {
        try {
            // Switch to Open-Meteo Elevation API (Much faster and more reliable)
            const openMeteoUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
            console.log(`Fetching elevation for ${lat}, ${lon} from Open-Meteo`);

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('Elevation API timeout');
                    resolve({ elevation: null, error: 'Request timeout' });
                }, 5000); // 5 second timeout

                https.get(openMeteoUrl, (response) => {
                    clearTimeout(timeout);

                    if (response.statusCode !== 200) {
                        console.log(`Elevation API returned status ${response.statusCode}`);
                        resolve({ elevation: null, error: 'Service unavailable' });
                        return;
                    }

                    let data = '';
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            // Open-Meteo returns { elevation: [123.4] }
                            if (json.elevation && json.elevation.length > 0) {
                                console.log(`Elevation: ${json.elevation[0]}m`);
                                resolve({ elevation: json.elevation[0] });
                            } else {
                                console.log('No elevation data in response');
                                resolve({ elevation: null, error: 'No data' });
                            }
                        } catch (e) {
                            console.error('Elevation parse error:', e.message);
                            resolve({ elevation: null, error: 'Parse error' });
                        }
                    });
                }).on('error', (err) => {
                    clearTimeout(timeout);
                    console.error('Elevation network error:', err.message);
                    resolve({ elevation: null, error: 'Network error' });
                });
            });
        } catch (error) {
            console.error('Elevation fetch error:', error);
            return { elevation: null, error: error.message };
        }
    }

    /**
     * Calculate slope by sampling elevations in 4 directions
     */
    async getSlope(lat, lon) {
        try {
            const offset = 0.001; // ~111 meters at equator

            // Get elevations at 5 points (center + 4 cardinal directions)
            const [center, north, south, east, west] = await Promise.all([
                this.getElevation(lat, lon),
                this.getElevation(lat + offset, lon),
                this.getElevation(lat - offset, lon),
                this.getElevation(lat, lon + offset),
                this.getElevation(lat, lon - offset)
            ]);

            if (!center.elevation || center.elevation === null) {
                return { slope: null, error: 'Could not calculate slope' };
            }

            // Calculate slope in both directions
            const elevations = [north, south, east, west].map(e => e.elevation).filter(e => e !== null);

            if (elevations.length < 2) {
                return { slope: 0, direction: 'flat' };
            }

            // Calculate max elevation difference
            const maxDiff = Math.max(...elevations.map(e => Math.abs(e - center.elevation)));

            // Distance between points (in meters, approximate)
            const distance = 111; // ~111 meters for 0.001 degrees

            // Slope in degrees
            const slopeRadians = Math.atan(maxDiff / distance);
            const slopeDegrees = slopeRadians * (180 / Math.PI);

            return {
                slope: slopeDegrees,
                direction: slopeDegrees < 2 ? 'flat' : slopeDegrees < 5 ? 'gentle' : slopeDegrees < 15 ? 'moderate' : 'steep'
            };
        } catch (error) {
            console.error('Slope calculation error:', error);
            return { slope: null, error: error.message };
        }
    }

    /**
     * Get complete terrain analysis for a location
     */
    async getTerrainAnalysis(lat, lon) {
        const [elevationData, slopeData] = await Promise.all([
            this.getElevation(lat, lon),
            this.getSlope(lat, lon)
        ]);

        return {
            success: true,
            location: { lat, lon },
            elevation: elevationData.elevation,
            elevationUnit: 'meters',
            slope: slopeData.slope,
            slopeUnit: 'degrees',
            slopeCategory: slopeData.direction,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = TerrainService;
