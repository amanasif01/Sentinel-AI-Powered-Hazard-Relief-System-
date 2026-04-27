const https = require('https');
const http = require('http');
const { URL } = require('url');
const LocationResult = require('./LocationResult');

/**
 * Service to convert location names to coordinates using OpenStreetMap Nominatim API
 */
class GeocodingService {
    constructor() {
        this.NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
        this.USER_AGENT = "PakistanRainfallApp/1.0";
        this.cache = new Map(); // Enhanced cache with TTL
        this.cacheTTL = 7200000; // 2 hour cache TTL (increased for better performance)
        this.agent = new https.Agent({ 
            keepAlive: true, 
            maxSockets: 20, // Increased for better concurrent performance
            maxFreeSockets: 10,
            timeout: 5000, // Reduced from 10s to 5s for faster failure
            freeSocketTimeout: 15000 // Reduced for better resource management
        });
    }
    
    /**
     * Search for coordinates of a location
     */
    async searchLocation(query) {
        // Check cache first for faster repeated searches
        const cacheKey = query.toLowerCase().trim();
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            console.log(`Using cached result for: ${query}`);
            return cached.results;
        }
        
        // Enhanced search with better Pakistan focus and faster response
        const encodedQuery = encodeURIComponent(query);
        
        // First, try a Pakistan-focused search with reduced limit for speed
        let searchUrl = `${this.NOMINATIM_BASE_URL}?q=${encodedQuery}&format=json&limit=8&addressdetails=1&accept-language=en&countrycodes=pk&bounded=1&viewbox=60,40,80,20`;
        
        console.log(`Searching for location: ${query}`);
        
        try {
            let response = await this.makeHttpRequest(searchUrl);
            let results = this.parseSearchResults(response);
            
            // If we don't have enough Pakistan results, try a broader search with reduced limit
            if (results.length < 3) {
                console.log(`Limited Pakistan results for: ${query}, trying broader search`);
                searchUrl = `${this.NOMINATIM_BASE_URL}?q=${encodedQuery}&format=json&limit=10&addressdetails=1&accept-language=en&countrycodes=pk,gb,us,ca,au,in&bounded=1&viewbox=60,40,80,20`;
                response = await this.makeHttpRequest(searchUrl);
                results = this.parseSearchResults(response);
            }
            
            // Prioritize results with enhanced filtering for better accuracy
            const prioritizedResults = this.prioritizePakistanResults(results, query);
            
            // Cache the results with timestamp for TTL
            this.cache.set(cacheKey, {
                results: prioritizedResults,
                timestamp: Date.now()
            });
            
            // Clean old cache entries (keep only last 100 entries for faster access)
            if (this.cache.size > 100) {
                const entries = Array.from(this.cache.entries());
                entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                this.cache = new Map(entries.slice(0, 75));
            }
            
            return prioritizedResults;
        } catch (error) {
            console.error(`Error searching for location: ${query}`, error);
            throw new Error(`Failed to search location: ${error.message}`);
        }
    }
    
    /**
     * Get coordinates for a specific location (first result)
     */
    async getCoordinates(locationName) {
        const results = await this.searchLocation(locationName);
        
        if (results.length === 0) {
            throw new Error(`No coordinates found for location: ${locationName}`);
        }
        
        return results[0];
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
                    'User-Agent': this.USER_AGENT,
                    'Connection': 'keep-alive',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate' // Add compression support
                },
                agent: this.agent,
                timeout: 5000 // Reduced from 10s to 5s for faster failure
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Geocoding request failed with status code: ${res.statusCode}`));
                    } else {
                        resolve(data);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    parseSearchResults(jsonResponse) {
        try {
            const rootNode = JSON.parse(jsonResponse);
            const results = [];
            
            if (Array.isArray(rootNode)) {
                for (const locationNode of rootNode) {
                    const result = this.parseLocationNode(locationNode);
                    if (result) {
                        results.push(result);
                    }
                }
            }
            
            return results;
            
        } catch (error) {
            console.error("Error parsing geocoding response", error);
            throw new Error(`Failed to parse geocoding response: ${error.message}`);
        }
    }
    
    parseLocationNode(locationNode) {
        try {
            const displayName = locationNode.display_name;
            const lat = parseFloat(locationNode.lat);
            const lon = parseFloat(locationNode.lon);
            
            // Extract country and state information
            let country = "";
            let state = "";
            let city = "";
            
            const addressNode = locationNode.address;
            if (addressNode) {
                country = addressNode.country || "";
                state = addressNode.state || "";
                city = addressNode.city || "";
                if (!city) {
                    city = addressNode.town || "";
                }
                if (!city) {
                    city = addressNode.village || "";
                }
            }
            
            // Create a cleaner display name that's more readable
            const cleanDisplayName = this.createCleanDisplayName(city, state, country, displayName, lat, lon);
            
            return new LocationResult(cleanDisplayName, lat, lon, country, state);
            
        } catch (error) {
            console.warn("Failed to parse location node", error);
            return null;
        }
    }
    
    /**
     * Create a cleaner display name that's more readable
     */
    createCleanDisplayName(city, state, country, originalDisplayName, lat, lon) {
        // Try to use English names when available
        if (city && city !== '' && state && state !== '' && country && country !== '') {
            return city + ", " + state + ", " + country;
        } else if (city && city !== '' && country && country !== '') {
            return city + ", " + country;
        } else if (state && state !== '' && country && country !== '') {
            return state + ", " + country;
        } else {
            // Fallback: create a simple name from coordinates
            return "Location (" + lat.toFixed(2) + "°N, " + lon.toFixed(2) + "°E)";
        }
    }

    /**
     * Prioritize Pakistan results and exact matches in the search results
     * Enhanced algorithm for better accuracy and relevance
     */
    prioritizePakistanResults(results, query) {
        const exactMatches = [];
        const pakistanResults = [];
        const otherResults = [];
        
        const queryLower = query.toLowerCase().trim();
        const queryWords = queryLower.split(' ').filter(word => word.length > 1);
        
        for (const result of results) {
            const displayName = result.getDisplayName().toLowerCase();
            const country = result.getCountry().toLowerCase();
            const city = displayName.split(',')[0].trim().toLowerCase();
            
            // Enhanced exact matching for better accuracy
            let matchScore = 0;
            
            // Check for exact city name match (highest priority)
            if (city === queryLower) {
                matchScore = 100;
            }
            // Check if city starts with query
            else if (city.startsWith(queryLower)) {
                matchScore = 80;
            }
            // Check if city contains query
            else if (city.includes(queryLower)) {
                matchScore = 60;
            }
            // Check if any query word is in the display name
            else {
                for (const word of queryWords) {
                    if (displayName.includes(word)) {
                        matchScore += 20;
                    }
                }
            }
            
            // Add bonus for Pakistan results
            if (country === 'pakistan') {
                matchScore += 30;
            }
            
            // Categorize results based on match score
            if (matchScore >= 80) {
                exactMatches.push({ result, score: matchScore });
            } else if (country === 'pakistan') {
                pakistanResults.push({ result, score: matchScore });
            } else if (matchScore >= 40) {
                otherResults.push({ result, score: matchScore });
            }
        }
        
        // Sort each category by score for better relevance
        exactMatches.sort((a, b) => b.score - a.score);
        pakistanResults.sort((a, b) => b.score - a.score);
        otherResults.sort((a, b) => b.score - a.score);
        
        // Return results in priority order, limit to 6 total for faster processing
        const prioritized = [
            ...exactMatches.map(item => item.result),
            ...pakistanResults.map(item => item.result),
            ...otherResults.map(item => item.result)
        ];
        
        return prioritized.slice(0, 6);
    }
    
    close() {
        // Clean up HTTP agent
        if (this.agent) {
            this.agent.destroy();
        }
        // Clear cache to free memory
        this.cache.clear();
    }
}

module.exports = GeocodingService;
