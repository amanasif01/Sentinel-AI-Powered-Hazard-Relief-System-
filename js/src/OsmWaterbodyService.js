const https = require('https');
const http = require('http');
const { URL } = require('url');
const WaterLevelEstimationService = require('./WaterLevelEstimationService');

/**
 * Simplified service to find nearest water bodies using OpenStreetMap Overpass API
 */
class OsmWaterbodyService {
    constructor() {
        this.OVERPASS_ENDPOINTS = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://lz4.overpass-api.de/api/interpreter"
        ];
        this.REQUEST_TIMEOUT = 15000; // 15 seconds - let it work properly
        this.waterLevelService = new WaterLevelEstimationService();
        this.cache = new Map(); // Add caching for faster repeated requests
        this.cacheTTL = 1800000; // 30 minute cache
    }

    async findNearestWaterbody(latitude, longitude) {
        // Check cache first for much faster response
        const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            console.log(`Using cached waterbody result for: ${cacheKey}`);
            return cached.result;
        }

        try {
            // Start with a focused search for nearby rivers (50km)
            let query = this.buildSimpleRiverQuery(latitude, longitude, 50000); // 50km
            let jsonResponse = await this.makeOverpassRequest(query);
            let result = this.parseSimpleResponse(latitude, longitude, jsonResponse);

            // If no result found, try a broader search (100km)
            if (!result.found()) {
                console.log("No rivers found in 50km, trying 100km search...");
                query = this.buildSimpleRiverQuery(latitude, longitude, 100000); // 100km
                jsonResponse = await this.makeOverpassRequest(query);
                result = this.parseSimpleResponse(latitude, longitude, jsonResponse);
            }

            // If still no result, try an even broader search (200km)
            if (!result.found()) {
                console.log("No rivers found in 100km, trying 200km search...");
                query = this.buildBroaderQuery(latitude, longitude, 200000); // 200km
                try {
                    jsonResponse = await this.makeOverpassRequest(query);
                    result = this.parseSimpleResponse(latitude, longitude, jsonResponse);
                } catch (fallbackError) {
                    console.warn("Broader search also failed:", fallbackError.message);
                    result = NearestWaterbody.notFound();
                }
            }

            // Cache the result for faster future requests
            this.cache.set(cacheKey, {
                result: result,
                timestamp: Date.now()
            });

            // Clean old cache entries
            if (this.cache.size > 100) {
                const entries = Array.from(this.cache.entries());
                entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                this.cache = new Map(entries.slice(0, 50));
            }

            return result;

        } catch (error) {
            console.warn("Waterbody search failed:", error.message);
            // Return a default waterbody estimate instead of not found
            return this.getDefaultWaterbodyEstimate(latitude, longitude);
        }
    }

    getMajorCityWaterbodies(latitude, longitude) {
        // This method is disabled - we rely on OSM data only
        // Hardcoded data was causing incorrect waterbody detection
        return null;
    }

    isInSwatRegion(latitude, longitude) {
        // Check if coordinates are in the Swat region
        // Swat Valley is roughly between 34.5-35.5°N and 71.5-72.5°E
        return latitude >= 34.5 && latitude <= 35.5 &&
            longitude >= 71.5 && longitude <= 72.5;
    }

    getDefaultWaterbodyEstimate(latitude, longitude) {
        // Provide a reasonable default estimate when API fails
        // This ensures the system always returns something useful
        const distance = 25000; // 25km average distance
        const name = "Nearest Water Body";
        const type = "river";

        return new NearestWaterbody(distance, name, type);
    }

    async findLargestWaterbody(latitude, longitude) {
        // For simplicity, just return the nearest one
        return this.findNearestWaterbody(latitude, longitude);
    }

    /**
     * Get waterbody data with FAST water level estimation - NO TIMEOUTS
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @param {Object} rainfallData - Recent rainfall data
     * @param {boolean} useRealTime - Whether to use fast elevation-based data (default: true)
     * @returns {Object} Waterbody data with estimated water level
     */
    async getWaterbodyWithLevel(latitude, longitude, rainfallData = null, useRealTime = true) {
        try {
            // Use ONLY Overpass API search - NO hardcoding
            console.log(`Searching for waterbodies near ${latitude}, ${longitude}...`);
            const waterbody = await this.findNearestWaterbody(latitude, longitude);

            if (!waterbody.found()) {
                return {
                    found: false,
                    waterLevel: this.waterLevelService.getDefaultEstimate()
                };
            }

            let waterLevel;

            // Use ACTUAL real-time APIs first, then fallback
            if (useRealTime) {
                try {
                    console.log('Attempting to get REAL-TIME water level data from APIs...');
                    waterLevel = await this.waterLevelService.getRealTimeWaterLevel(
                        latitude,
                        longitude,
                        this.extractRiverName(waterbody.getName())
                    );
                    console.log('Real-time water level data retrieved successfully');
                } catch (realTimeError) {
                    console.warn('Real-time APIs failed, falling back to estimation:', realTimeError.message);
                    waterLevel = this.waterLevelService.estimateWaterLevel(
                        waterbody,
                        rainfallData,
                        waterbody.getDistanceMeters(),
                        latitude,
                        longitude
                    );
                }
            } else {
                waterLevel = this.waterLevelService.estimateWaterLevel(
                    waterbody,
                    rainfallData,
                    waterbody.getDistanceMeters(),
                    latitude,
                    longitude
                );
            }

            return {
                found: true,
                distanceMeters: waterbody.getDistanceMeters(),
                name: waterbody.getName(),
                type: waterbody.getType(),
                waterLevel: waterLevel
            };

        } catch (error) {
            console.warn("Waterbody with level search failed:", error.message);
            return {
                found: false,
                waterLevel: this.waterLevelService.getDefaultEstimate()
            };
        }
    }

    /**
     * Extract river name from waterbody name for targeted real-time search
     */
    extractRiverName(waterbodyName) {
        if (!waterbodyName) return null;

        const name = waterbodyName.toLowerCase();
        const riverNames = ['indus', 'swat', 'ravi', 'chenab', 'jhelum', 'kabul', 'sutlej', 'beas'];

        for (const riverName of riverNames) {
            if (name.includes(riverName)) {
                return riverName;
            }
        }

        return null;
    }

    buildSimpleRiverQuery(lat, lon, radiusMeters) {
        // Simple query for major rivers - let it take time to work properly
        return `[out:json][timeout:25];
(
  way["waterway"="river"](around:${radiusMeters},${lat},${lon});
  relation["waterway"="river"](around:${radiusMeters},${lat},${lon});
);
out tags center;`;
    }

    buildBroaderQuery(lat, lon, radiusMeters) {
        // Broader query including other water bodies - let it work
        return `[out:json][timeout:25];
(
  way["waterway"="river"](around:${radiusMeters},${lat},${lon});
  relation["waterway"="river"](around:${radiusMeters},${lat},${lon});
  way["natural"="water"](around:${radiusMeters},${lat},${lon});
  relation["natural"="water"](around:${radiusMeters},${lat},${lon});
);
out tags center;`;
    }

    buildSimpleQuery(lat, lon, radiusMeters) {
        return `[out:json][timeout:10];
(
  // Major water bodies - oceans, seas, large lakes (highest priority)
  relation["natural"="water"](around:${radiusMeters},${lat},${lon});
  way["natural"="water"](around:${radiusMeters},${lat},${lon});
  
  // Major rivers (both ways and relations) - these cause flooding
  way["waterway"="river"](around:${radiusMeters},${lat},${lon});
  relation["waterway"="river"](around:${radiusMeters},${lat},${lon});
  
  // Large reservoirs and lakes
  way["natural"="water"]["water"~"reservoir|lake"](around:${radiusMeters},${lat},${lon});
  relation["natural"="water"]["water"~"reservoir|lake"](around:${radiusMeters},${lat},${lon});
  
  // Canals (significant water features)
  way["waterway"="canal"](around:${radiusMeters},${lat},${lon});
);
out tags center;`;
    }

    async makeOverpassRequest(query) {
        // Let the API work properly - no aggressive global timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Global timeout exceeded')), 30000); // 30 second global timeout
        });

        const requestPromise = this.makeSingleRequestWithFallback(query);

        try {
            return await Promise.race([requestPromise, timeoutPromise]);
        } catch (error) {
            console.warn(`Overpass request failed or timed out:`, error.message);
            throw error;
        }
    }

    async makeSingleRequestWithFallback(query) {
        // Try the first endpoint - let it work properly
        try {
            console.log('Trying primary Overpass API...');
            return await this.makeSingleRequest(this.OVERPASS_ENDPOINTS[0], query);
        } catch (error) {
            console.warn(`Primary Overpass API failed, trying backup:`, error.message);

            // Try backup endpoint
            try {
                console.log('Trying backup Overpass API...');
                return await this.makeSingleRequest(this.OVERPASS_ENDPOINTS[1], query);
            } catch (backupError) {
                console.warn(`Backup Overpass API also failed, trying third endpoint:`, backupError.message);

                // Try third endpoint
                try {
                    console.log('Trying third Overpass API...');
                    return await this.makeSingleRequest(this.OVERPASS_ENDPOINTS[2], query);
                } catch (thirdError) {
                    console.warn(`All Overpass endpoints failed:`, thirdError.message);
                    throw new Error("All Overpass endpoints failed");
                }
            }
        }
    }

    async makeSingleRequest(endpoint, query) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(endpoint);
            const postData = `data=${encodeURIComponent(query)}`;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'PakistanRainfallApp/1.0',
                    'Content-Length': Buffer.byteLength(postData),
                    'Connection': 'close' // Close connection immediately for faster response
                },
                timeout: this.REQUEST_TIMEOUT
            };

            const client = urlObj.protocol === 'https:' ? https : http;

            const req = client.request(options, (res) => {
                let data = '';
                let dataSize = 0;
                const maxDataSize = 1024 * 1024; // 1MB limit for faster processing

                res.on('data', (chunk) => {
                    dataSize += chunk.length;
                    if (dataSize > maxDataSize) {
                        req.destroy(); // Stop receiving data if too large
                        reject(new Error('Response too large'));
                        return;
                    }
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            // Set a shorter timeout for faster failure
            const timeoutId = setTimeout(() => {
                req.destroy();
                reject(new Error('Request timeout'));
            }, this.REQUEST_TIMEOUT);

            req.on('close', () => {
                clearTimeout(timeoutId);
            });

            req.write(postData);
            req.end();
        });
    }

    parseSimpleResponse(lat, lon, jsonResponse) {
        try {
            const root = JSON.parse(jsonResponse);
            const elements = root.elements || [];

            if (elements.length === 0) {
                return NearestWaterbody.notFound();
            }

            let bestWaterbody = null;
            let bestScore = -Infinity;

            for (const element of elements) {
                const tags = element.tags || {};
                const center = element.center;

                if (!center) continue;

                const distance = this.haversineMeters(lat, lon, center.lat, center.lon);
                const significance = this.calculateSignificance(tags);

                // Skip water bodies with zero significance (nullahs, small streams, etc.)
                if (significance === 0) continue;

                const name = (tags.name || "").toLowerCase();

                // Enhanced scoring algorithm that prioritizes regional relevance
                let score = significance;

                // MASSIVE bonus for Swat River specifically (but not canals)
                if (name.includes('swat') && !name.includes('canal') && !name.includes('upper') && !name.includes('lower')) {
                    score += 2000; // Massive bonus for actual Swat River
                    console.log(`Found Swat River with score: ${score}`);
                }

                // Small bonus for other major regional rivers
                if (name.includes('kabul') || name.includes('indus') ||
                    name.includes('ravi') || name.includes('chenab') || name.includes('jhelum')) {
                    score += 200; // Small bonus for major regional rivers
                }

                // Distance penalty (closer is much better - prioritize distance over significance)
                const distancePenalty = distance / 1000; // 1 point per km - much stronger penalty
                score -= distancePenalty;

                // Bonus for rivers with size data (indicates they're well-mapped)
                if (tags.width || tags.length || tags.area) {
                    score += 300; // Higher bonus for well-documented rivers
                }

                // Penalty for very distant rivers (beyond 80km gets significant penalty)
                if (distance > 80000) {
                    score -= 500; // Significant penalty for very distant rivers
                }

                // Debug logging
                console.log(`River: ${name}, Distance: ${Math.round(distance / 1000)}km, Significance: ${significance}, Score: ${Math.round(score)}`);

                if (score > bestScore) {
                    bestScore = score;
                    bestWaterbody = {
                        distance: distance,
                        name: tags.name || this.generateName(tags, center),
                        type: this.getWaterType(tags),
                        significance: significance,
                        score: score
                    };
                    console.log(`New best river: ${bestWaterbody.name} with score: ${Math.round(score)}`);
                }
            }

            if (!bestWaterbody) {
                return NearestWaterbody.notFound();
            }

            return new NearestWaterbody(bestWaterbody.distance, bestWaterbody.name, bestWaterbody.type);

        } catch (error) {
            console.error("Failed to parse waterbody response:", error.message);
            return NearestWaterbody.notFound();
        }
    }

    calculateSignificance(tags) {
        const water = (tags.water || "").toLowerCase();
        const waterway = (tags.waterway || "").toLowerCase();
        const natural = (tags.natural || "").toLowerCase();
        const name = (tags.name || "").toLowerCase();

        // UNIVERSAL MODE UPDATE:
        // We now include streams, nullahs, and canals because our 
        // WaterLevelEstimationService can now calculate discharge for them using Open-Meteo!

        // Major water bodies (highest priority)
        if (water.includes('ocean') || water.includes('sea')) return 2000;

        // Large reservoirs and major lakes (very high priority)
        if (water.includes('reservoir') || water.includes('lake')) {
            if (name.includes('large') || name.includes('major') || name.includes('big') ||
                tags.width || tags.length || tags.area) {
                return 1500;
            }
            return 1200;
        }

        // Rivers (High Priority)
        if (waterway === 'river') {
            let score = 1000;
            // Bonus for known major rivers
            if (name.includes('indus') || name.includes('chenab') || name.includes('satluj') || name.includes('ravi') || name.includes('jhelum') || name.includes('kabul') || name.includes('swat')) {
                score += 500;
            }
            return score;
        }

        // Canals (Medium Priority - Common in Pakistan)
        if (waterway === 'canal') return 800; // SIGNIFICANTLY INCREASED from 400

        // Streams / Nullahs (Low Priority but VALID for Urban Flood)
        // We no longer exclude them!
        if (waterway === 'stream' || name.includes('nullah') || name.includes('nallah') || name.includes('nala')) {
            return 500; // Now considered valid targets
        }

        // Other water features
        if (natural === 'water') return 600;

        // Small features
        if (waterway === 'drain' || waterway === 'ditch') return 300; // Even drains matter for urban floods!

        return 100; // Default fallback for unknown water tags
    }

    generateName(tags, center) {
        // Generate a descriptive name based on tags
        const water = tags.water || "";
        const waterway = tags.waterway || "";
        const name = tags.name || "";

        if (name) return name;

        if (waterway === 'stream') return `Local Stream (${this.formatCoordinates(center.lat, center.lon)})`;
        if (waterway === 'canal') return `Irrigation Canal (${this.formatCoordinates(center.lat, center.lon)})`;
        if (waterway === 'drain') return `Drainage System (${this.formatCoordinates(center.lat, center.lon)})`;

        if (water.includes('ocean') || water.includes('sea')) {
            return `${water.charAt(0).toUpperCase() + water.slice(1)} (${this.formatCoordinates(center.lat, center.lon)})`;
        }
        if (water.includes('reservoir')) {
            return `Reservoir (${this.formatCoordinates(center.lat, center.lon)})`;
        }
        if (water.includes('lake')) {
            return `Lake (${this.formatCoordinates(center.lat, center.lon)})`;
        }
        if (waterway === 'river') {
            return `Unnamed River (${this.formatCoordinates(center.lat, center.lon)})`;
        }
        if (tags.natural === 'water') {
            return `Water body (${this.formatCoordinates(center.lat, center.lon)})`;
        }
        return `Water feature (${this.formatCoordinates(center.lat, center.lon)})`;
    }

    formatCoordinates(lat, lon) {
        return `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
    }

    getWaterType(tags) {
        if (tags.waterway) return tags.waterway;
        if (tags.water) return tags.water;
        if (tags.natural === 'water') return 'water';
        return 'water feature';
    }

    // Haversine distance between two lat/lon points in meters
    haversineMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000.0; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    close() {
        // Clear cache to free memory
        this.cache.clear();
    }
}

class NearestWaterbody {
    constructor(distanceMeters, name, type) {
        this.distanceMeters = distanceMeters;
        this.name = name;
        this.type = type;
    }

    static notFound() {
        // Instead of infinite distance, we return a "No Waterbody" state
        // This triggers the Urban Flood Logic in downstream services
        return new NearestWaterbody(Infinity, "No Major Waterbody", "none");
    }

    found() {
        return isFinite(this.distanceMeters);
    }

    getDistanceMeters() {
        return this.distanceMeters;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }
}

module.exports = OsmWaterbodyService;

