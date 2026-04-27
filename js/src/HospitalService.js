const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Hospital Service using OpenStreetMap Overpass API
 * Free, no API key required
 */
class HospitalService {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 3600000; // 1 hour cache
        this.overpassUrl = 'https://overpass-api.de/api/interpreter';
        this.requestTimeout = 60000; // 60 seconds
    }

    /**
     * Find hospitals near a location
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} radius - Search radius in meters (default: 10000 = 10km)
     * @returns {Promise<Array>} Array of hospital objects
     */
    async findHospitals(latitude, longitude, radius = 5000) {
        const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radius}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            console.log(`Using cached hospitals for: ${latitude}, ${longitude}`);
            return cached.hospitals;
        }

        try {
            console.log(`Searching for hospitals near ${latitude}, ${longitude} (radius: ${radius}m)`);

            // Overpass QL query to find hospitals, clinics, and medical facilities
            // Increased timeout to 90s to avoid 504 errors
            const query = `
                [out:json][timeout:90];
                (
                  node["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:${radius},${latitude},${longitude});
                  way["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:${radius},${latitude},${longitude});
                  relation["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](around:${radius},${latitude},${longitude});
                );
                out center meta;
            `.replace(/\s+/g, ' ').trim();

            const hospitals = await this.queryOverpassWithRetry(query);

            // Process and format results
            const formattedHospitals = hospitals
                .map(hospital => this.formatHospital(hospital, latitude, longitude))
                .filter(hospital => hospital !== null)
                .sort((a, b) => a.distance - b.distance); // Sort by distance

            // Cache results
            this.cache.set(cacheKey, {
                hospitals: formattedHospitals,
                timestamp: Date.now()
            });

            // Clean old cache entries
            this.cleanCache();

            console.log(`Found ${formattedHospitals.length} hospitals`);
            return formattedHospitals;

        } catch (error) {
            console.error('Error finding hospitals:', error);
            throw new Error(`Failed to find hospitals: ${error.message}`);
        }
    }

    /**
     * Query Overpass API with Retry Logic
     */
    async queryOverpassWithRetry(query, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await this.queryOverpass(query);
            } catch (error) {
                console.warn(`Overpass attempt ${i + 1} failed: ${error.message}`);

                // If it's a 504 or 429 (Too Many Requests), wait and retry
                if ((error.message.includes('504') || error.message.includes('429')) && i < retries) {
                    const delay = 2000 * (i + 1); // Linear backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // If it's the last attempt, throw the error
                if (i === retries) throw error;
            }
        }
    }

    /**
     * Query Overpass API
     */
    async queryOverpass(query) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.overpassUrl);
            const postData = query;

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'SentinelApp/1.0'
                },
                timeout: this.requestTimeout
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`Overpass API returned status ${res.statusCode}`));
                            return;
                        }

                        const result = JSON.parse(data);

                        if (result.elements && Array.isArray(result.elements)) {
                            resolve(result.elements);
                        } else {
                            resolve([]);
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse Overpass response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Overpass API request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Overpass API request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Format hospital data from Overpass result
     */
    formatHospital(element, userLat, userLon) {
        try {
            const tags = element.tags || {};

            // Get coordinates
            let lat, lon;
            if (element.type === 'node') {
                lat = element.lat;
                lon = element.lon;
            } else if (element.center) {
                lat = element.center.lat;
                lon = element.center.lon;
            } else if (element.lat && element.lon) {
                lat = element.lat;
                lon = element.lon;
            } else {
                return null; // Skip if no coordinates
            }

            // Calculate distance
            const distance = this.calculateDistance(userLat, userLon, lat, lon);

            // Determine hospital type
            const amenity = tags.amenity || '';
            let hospitalType = 'Medical Facility';
            if (amenity === 'hospital') {
                hospitalType = 'Hospital';
            } else if (amenity === 'clinic') {
                hospitalType = 'Clinic';
            } else if (amenity === 'doctors') {
                hospitalType = 'Doctor\'s Office';
            } else if (amenity === 'pharmacy') {
                hospitalType = 'Pharmacy';
            }

            return {
                id: element.id || `${lat}_${lon}`,
                name: tags.name || tags['name:en'] || 'Unnamed Medical Facility',
                type: hospitalType,
                latitude: lat,
                longitude: lon,
                distance: distance, // in meters
                distanceKm: (distance / 1000).toFixed(2),
                address: tags['addr:full'] ||
                    [tags['addr:street'], tags['addr:city'], tags['addr:state']]
                        .filter(Boolean)
                        .join(', ') ||
                    'Address not available',
                phone: tags.phone || tags['contact:phone'] || null,
                website: tags.website || tags['contact:website'] || null,
                emergency: tags.emergency === 'yes' || tags.emergency === 'emergency_room_entrance',
                openingHours: tags.opening_hours || null,
                wheelchair: tags.wheelchair === 'yes' || tags.wheelchair === 'limited',
                amenity: amenity
            };
        } catch (error) {
            console.error('Error formatting hospital:', error);
            return null;
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Clean old cache entries
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.cache.delete(key);
            }
        }
    }
}

module.exports = HospitalService;

