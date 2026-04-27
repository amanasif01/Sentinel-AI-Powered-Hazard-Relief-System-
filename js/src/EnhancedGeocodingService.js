const https = require('https');
const http = require('http');
const { URL } = require('url');
const LocationResult = require('./LocationResult');

/**
 * Enhanced Geocoding Service with multiple APIs and comprehensive search
 */
class EnhancedGeocodingService {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 3600000; // 1 hour cache
        this.agent = new https.Agent({
            keepAlive: true,
            maxSockets: 30,
            maxFreeSockets: 15,
            timeout: 8000,
            freeSocketTimeout: 20000
        });

        // Consider only extremely generic names (country/province/territory level) as candidates
        // for replacement so real cities that MapTiler returns stay visible in the UI.
        this.genericDisplayNamePatterns = [
            /^pakistan$/i,
            /^(punjab|sindh|balochistan|khyber pakhtunkhwa|kpk|gilgit baltistan|azad jammu(?: &| and) kashmir)$/i,
            /^(punjab|sindh|balochistan|khyber pakhtunkhwa|kpk|gilgit baltistan|azad jammu(?: &| and) kashmir),\s*pakistan$/i,
            /^islamabad (?:capital )?territory$/i,
            /^islamabad (?:capital )?territory,\s*pakistan$/i,
            /^location \(/i
        ];

        // Multiple geocoding APIs for comprehensive coverage
        // MapTiler: Free tier 100k requests/month, fast & accurate for sectors/neighborhoods
        // Get free API key at: https://cloud.maptiler.com/
        // Prefer MAPTILER_API_KEY from environment, then fall back to config.js
        try {
            const config = require('../config');
            this.mapTilerApiKey = process.env.MAPTILER_API_KEY || config.MAPTILER_API_KEY || '';
        } catch (e) {
            this.mapTilerApiKey = process.env.MAPTILER_API_KEY || '';
        }

        // Rely solely on MapTiler for geocoding to provide consistent data quality
        // and predictable naming (fewer provider-to-provider discrepancies).
        this.apis = [
            {
                name: 'MapTiler',
                baseUrl: 'https://api.maptiler.com/geocoding',
                userAgent: 'SentinelApp/1.0',
                priority: 1,
                requiresKey: true,
                apiKey: this.mapTilerApiKey
            }
        ];
    }

    /**
     * Comprehensive location search using multiple APIs
     */
    async searchLocation(query) {
        const cacheKey = query.toLowerCase().trim();
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            console.log(`Using cached result for: ${query}`);
            return cached.results;
        }

        console.log(`Enhanced search for location: ${query}`);

        // Try APIs in priority order - MapTiler first if available
        const searchPromises = this.apis
            .filter(api => {
                // Skip APIs that require keys but don't have them
                if (api.requiresKey && (!api.apiKey || api.apiKey === '')) {
                    return false;
                }
                return true;
            })
            .map(api =>
                this.searchWithAPI(api, query).catch(error => {
                    console.warn(`${api.name} API failed:`, error.message);
                    return [];
                })
            );

        try {
            const allResults = await Promise.all(searchPromises);

            // Combine and deduplicate results
            const combinedResults = this.combineAndDeduplicateResults(allResults.flat());

            // Prioritize and rank results
            const prioritizedResults = this.prioritizeResults(combinedResults, query);

            // Cache results
            this.cache.set(cacheKey, {
                results: prioritizedResults,
                timestamp: Date.now()
            });

            // Clean cache
            this.cleanCache();

            return prioritizedResults;

        } catch (error) {
            console.error(`Enhanced search failed for: ${query}`, error);
            throw new Error(`Failed to search location: ${error.message}`);
        }
    }

    /**
     * Search using a specific API with enhanced query processing
     */
    async searchWithAPI(api, query) {
        // Enhanced query processing for better results
        const processedQueries = this.processQuery(query);
        const allResults = [];

        for (const processedQuery of processedQueries) {
            const encodedQuery = encodeURIComponent(processedQuery);
            let searchUrl;

            switch (api.name) {
                case 'MapTiler':
                    // MapTiler Geocoding API - Fast and accurate for sectors/neighborhoods
                    // Free tier: 100,000 requests/month
                    if (!api.apiKey || api.apiKey === '') {
                        throw new Error('MapTiler API key not configured');
                    }
                    // Focus on Pakistan for better results
                    searchUrl = `${api.baseUrl}/${encodedQuery}.json?key=${api.apiKey}&limit=3&country=pk&language=en`;
                    break;
                case 'Nominatim':
                    // Enhanced Nominatim search with better parameters
                    searchUrl = `${api.baseUrl}?q=${encodedQuery}&format=json&limit=20&addressdetails=1&accept-language=en&extratags=1&namedetails=1&bounded=0&dedupe=1&polygon_geojson=1`;
                    break;
                case 'Photon':
                    // Enhanced Photon search
                    searchUrl = `${api.baseUrl}?q=${encodedQuery}&limit=20&lang=en&osm_tag=tourism&osm_tag=natural&osm_tag=place`;
                    break;
                case 'MapBox':
                    // Note: Would need API key in production
                    searchUrl = `${api.baseUrl}/${encodedQuery}.json?access_token=YOUR_TOKEN&limit=20&types=place,poi,locality,neighborhood,address`;
                    break;
                default:
                    throw new Error(`Unknown API: ${api.name}`);
            }

            try {
                const response = await this.makeHttpRequest(searchUrl, api.userAgent);
                const results = this.parseAPIResponse(response, api.name, query);
                allResults.push(...results);
            } catch (error) {
                console.warn(`API ${api.name} failed for query "${processedQuery}":`, error.message);
            }
        }

        return allResults;
    }

    /**
     * Process query to create multiple search variations for better results
     */
    processQuery(query) {
        const queries = [query]; // Start with original query

        // Add variations for better matching
        const variations = this.generateQueryVariations(query);
        queries.push(...variations);

        // Add specific place name enhancements
        const enhancedQueries = this.enhancePlaceNameQueries(query);
        queries.push(...enhancedQueries);

        // Remove duplicates and return
        return [...new Set(queries)];
    }

    /**
     * Generate query variations for better matching
     */
    generateQueryVariations(query) {
        const variations = [];
        const lowerQuery = query.toLowerCase();

        // Add common place name variations
        const placeVariations = {
            'fairy meadows': ['fairy meadow', 'fairy meadows pakistan', 'fairy meadows gilgit', 'fairy meadows nanga parbat'],
            'nanga parbat': ['nanga parbat base camp', 'nanga parbat pakistan', 'diamer'],
            'hunza': ['hunza valley', 'hunza pakistan', 'hunza karimabad'],
            'skardu': ['skardu pakistan', 'skardu valley', 'skardu baltistan'],
            'gilgit': ['gilgit pakistan', 'gilgit baltistan', 'gilgit city'],
            'chitral': ['chitral pakistan', 'chitral valley', 'chitral district'],
            'swat': ['swat pakistan', 'swat valley', 'swat district', 'malam jabba'],
            'murree': ['murree pakistan', 'murree hills', 'murree station'],
            'nathia gali': ['nathia gali pakistan', 'nathia gali hills', 'nathia gali station'],
            'kaghan': ['kaghan valley', 'kaghan pakistan', 'kaghan naran'],
            'naran': ['naran pakistan', 'naran kaghan', 'naran valley'],
            'shogran': ['shogran pakistan', 'shogran kaghan', 'shogran valley'],
            'siri paye': ['siri paye pakistan', 'siri paye meadows', 'siri paye shogran'],
            'lalazar': ['lalazar pakistan', 'lalazar meadows', 'lalazar kaghan'],
            'saif ul malook': ['saif ul malook lake', 'saif ul malook pakistan', 'saif ul malook kaghan'],
            'kumrat': ['kumrat valley', 'kumrat pakistan', 'kumrat dir'],
            'kalash': ['kalash valley', 'kalash pakistan', 'kalash chitral'],
            'deosai': ['deosai plains', 'deosai pakistan', 'deosai national park'],
            'shangrila': ['shangrila resort', 'shangrila skardu', 'shangrila pakistan'],
            'attabad': ['attabad lake', 'attabad pakistan', 'attabad hunza'],
            'rush lake': ['rush lake pakistan', 'rush lake hunza', 'rush lake trek'],
            'baltoro': ['baltoro glacier', 'baltoro pakistan', 'baltoro trek'],
            'concordia': ['concordia pakistan', 'concordia base camp', 'concordia k2'],
            'k2': ['k2 pakistan', 'k2 base camp', 'k2 mountain'],
            'gasherbrum': ['gasherbrum pakistan', 'gasherbrum base camp', 'gasherbrum peaks'],
            'broad peak': ['broad peak pakistan', 'broad peak base camp', 'broad peak trek'],
            'masherbrum': ['masherbrum pakistan', 'masherbrum peak', 'masherbrum trek'],
            'trango': ['trango towers', 'trango pakistan', 'trango peaks'],
            'baltit': ['baltit fort', 'baltit hunza', 'baltit pakistan'],
            'altit': ['altit fort', 'altit hunza', 'altit pakistan'],
            'khunjerab': ['khunjerab pass', 'khunjerab pakistan', 'khunjerab border'],
            'muztagh': ['muztagh ata', 'muztagh pakistan', 'muztagh pass'],
            'shimshal': ['shimshal valley', 'shimshal pakistan', 'shimshal hunza'],
            'gojal': ['gojal valley', 'gojal hunza', 'gojal pakistan'],
            'phander': ['phander lake', 'phander pakistan', 'phander gilgit'],
            'rush phari': ['rush phari pakistan', 'rush phari hunza', 'rush phari trek'],
            'batura': ['batura glacier', 'batura pakistan', 'batura hunza'],
            'hispar': ['hispar glacier', 'hispar pakistan', 'hispar hunza'],
            'baltoro': ['baltoro glacier', 'baltoro pakistan', 'baltoro trek'],
            'biafo': ['biafo glacier', 'biafo pakistan', 'biafo trek'],
            'snow lake': ['snow lake pakistan', 'snow lake trek', 'snow lake hispar'],
            'snow lake': ['snow lake pakistan', 'snow lake trek', 'snow lake hispar'],
            'snow lake': ['snow lake pakistan', 'snow lake trek', 'snow lake hispar']
        };

        // Check for exact matches in place variations
        if (placeVariations[lowerQuery]) {
            variations.push(...placeVariations[lowerQuery]);
        }

        // Add generic variations
        variations.push(`${query} pakistan`);
        variations.push(`${query} northern pakistan`);
        variations.push(`${query} gilgit baltistan`);
        variations.push(`${query} kpk`);
        variations.push(`${query} punjab`);
        variations.push(`${query} sindh`);
        variations.push(`${query} balochistan`);

        return variations.slice(0, 5); // Limit to 5 variations to avoid too many requests
    }

    /**
     * Enhance place name queries with specific terms
     */
    enhancePlaceNameQueries(query) {
        const enhanced = [];
        const lowerQuery = query.toLowerCase();

        // Add specific terms for better matching
        if (lowerQuery.includes('meadow') || lowerQuery.includes('valley') || lowerQuery.includes('lake')) {
            enhanced.push(`${query} northern pakistan`);
            enhanced.push(`${query} gilgit baltistan`);
        }

        if (lowerQuery.includes('peak') || lowerQuery.includes('mountain') || lowerQuery.includes('glacier')) {
            enhanced.push(`${query} pakistan`);
            enhanced.push(`${query} karakoram`);
            enhanced.push(`${query} himalaya`);
        }

        if (lowerQuery.includes('fort') || lowerQuery.includes('palace') || lowerQuery.includes('monument')) {
            enhanced.push(`${query} pakistan`);
            enhanced.push(`${query} historical`);
        }

        return enhanced;
    }

    /**
     * Make HTTP request with proper error handling
     */
    async makeHttpRequest(url, userAgent) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/json',
                    'Accept-Language': 'en'
                    // NOTE: Do NOT send Accept-Encoding here; Node's https client does not
                    // automatically decompress gzip/deflate, which caused invalid JSON when
                    // parsing MapTiler responses. Let the server send plain JSON.
                },
                agent: this.agent,
                timeout: 8000
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else if (res.statusCode === 429) {
                        // Rate limited
                        reject(new Error('Rate limited'));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Parse API response based on API type
     */
    parseAPIResponse(response, apiName, originalQuery = '') {
        try {
            const data = JSON.parse(response);

            switch (apiName) {
                case 'MapTiler':
                    return this.parseMapTilerResponse(data, originalQuery);
                case 'Nominatim':
                    return this.parseNominatimResponse(data);
                case 'Photon':
                    return this.parsePhotonResponse(data);
                case 'MapBox':
                    return this.parseMapBoxResponse(data);
                default:
                    return [];
            }
        } catch (error) {
            console.warn(`Failed to parse ${apiName} response:`, error.message);
            return [];
        }
    }

    /**
     * Parse MapTiler API response - Fast and accurate for sectors/neighborhoods
     */
    parseMapTilerResponse(data, originalQuery = '') {
        const results = [];

        if (data.features && Array.isArray(data.features)) {
            for (const feature of data.features) {
                const result = this.parseMapTilerFeature(feature, originalQuery);
                if (result) results.push(result);
            }
        }

        return results;
    }

    /**
     * Parse individual MapTiler feature
     * Prefer MapTiler's own human-readable labels (formatted/label/place_name)
     * so places like housing societies or towns keep their correct names.
     */
    parseMapTilerFeature(feature, originalQuery = '') {
        try {
            const coords = feature.geometry.coordinates;
            const lon = coords[0]; // MapTiler uses [lon, lat]
            const lat = coords[1];

            const properties = feature.properties || {};
            // MapTiler context is usually an array (similar to Mapbox), not a nested object
            const contextArray = Array.isArray(feature.context) ? feature.context : [];

            const getContextText = (prefix) => {
                const item = contextArray.find(c => typeof c.id === 'string' && c.id.startsWith(prefix));
                return item && (item.text || item.name) ? (item.text || item.name) : '';
            };

            const name = properties.name || properties.text || '';
            const country = properties.country || getContextText('country');
            const state = properties.state || getContextText('region');
            const city =
                properties.city ||
                properties.place ||
                properties.locality ||
                getContextText('place') ||
                getContextText('locality');

            // Start from the most specific name MapTiler gives this feature (often the sector / society)
            let displayName = name || '';

            // If there is a formatted/label/place_name value, append it if it adds extra context
            const providerLabel =
                properties.formatted ||
                properties.label ||
                feature.place_name ||
                '';

            if (providerLabel && !providerLabel.toLowerCase().includes(displayName.toLowerCase())) {
                displayName = displayName
                    ? `${displayName}, ${providerLabel}`
                    : providerLabel;
            }

            // If the combined label is still missing city/state/country, append them
            if (city && !displayName.toLowerCase().includes(city.toLowerCase())) {
                displayName = displayName ? `${displayName}, ${city}` : city;
            }
            if (state && !displayName.toLowerCase().includes(state.toLowerCase())) {
                displayName = displayName ? `${displayName}, ${state}` : state;
            }
            if (country && !displayName.toLowerCase().includes(country.toLowerCase())) {
                displayName = displayName ? `${displayName}, ${country}` : country;
            }

            // Final safety fallback if everything above failed
            if (!displayName || displayName.trim() === '') {
                displayName = `Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`;
            }

            // Skip extremely generic results instead of fabricating names from user input
            if (this.shouldReplaceDisplayName(displayName)) {
                return null;
            }

            return new LocationResult(displayName, lat, lon, country || '', state || '');
        } catch (error) {
            console.warn('Failed to parse MapTiler feature:', error.message);
            return null;
        }
    }

    shouldReplaceDisplayName(displayName) {
        if (!displayName) {
            return false;
        }

        const normalizedDisplay = displayName.toLowerCase().trim();

        return this.genericDisplayNamePatterns.some(pattern => pattern.test(normalizedDisplay));
    }

    /**
     * Parse Nominatim API response
     */
    parseNominatimResponse(data) {
        const results = [];

        if (Array.isArray(data)) {
            for (const item of data) {
                const result = this.parseNominatimItem(item);
                if (result) results.push(result);
            }
        }

        return results;
    }

    /**
     * Parse individual Nominatim item
     */
    parseNominatimItem(item) {
        try {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const displayName = item.display_name;

            const address = item.address || {};
            const country = address.country || '';
            const state = address.state || address.region || '';
            const city = address.city || address.town || address.village || address.hamlet || '';

            const cleanDisplayName = this.createDisplayName(city, state, country, displayName);

            return new LocationResult(cleanDisplayName, lat, lon, country, state);
        } catch (error) {
            console.warn('Failed to parse Nominatim item:', error.message);
            return null;
        }
    }

    /**
     * Parse Photon API response
     */
    parsePhotonResponse(data) {
        const results = [];

        if (data.features && Array.isArray(data.features)) {
            for (const feature of data.features) {
                const result = this.parsePhotonFeature(feature);
                if (result) results.push(result);
            }
        }

        return results;
    }

    /**
     * Parse individual Photon feature
     */
    parsePhotonFeature(feature) {
        try {
            const coords = feature.geometry.coordinates;
            const lat = coords[1];
            const lon = coords[0];

            const properties = feature.properties || {};
            const name = properties.name || '';
            const country = properties.country || '';
            const state = properties.state || properties.county || '';
            const city = properties.city || properties.town || properties.village || '';

            const cleanDisplayName = this.createDisplayName(city || name, state, country, name);

            return new LocationResult(cleanDisplayName, lat, lon, country, state);
        } catch (error) {
            console.warn('Failed to parse Photon feature:', error.message);
            return null;
        }
    }

    /**
     * Parse MapBox API response
     */
    parseMapBoxResponse(data) {
        const results = [];

        if (data.features && Array.isArray(data.features)) {
            for (const feature of data.features) {
                const result = this.parseMapBoxFeature(feature);
                if (result) results.push(result);
            }
        }

        return results;
    }

    /**
     * Parse individual MapBox feature
     */
    parseMapBoxFeature(feature) {
        try {
            const coords = feature.center || feature.geometry.coordinates;
            const lat = coords[1];
            const lon = coords[0];

            const context = feature.context || [];
            const country = context.find(c => c.id.startsWith('country'))?.text || '';
            const state = context.find(c => c.id.startsWith('region'))?.text || '';
            const city = context.find(c => c.id.startsWith('place'))?.text || feature.text || '';

            const cleanDisplayName = this.createDisplayName(city, state, country, feature.place_name);

            return new LocationResult(cleanDisplayName, lat, lon, country, state);
        } catch (error) {
            console.warn('Failed to parse MapBox feature:', error.message);
            return null;
        }
    }

    /**
     * Create clean display name
     */
    createDisplayName(city, state, country, fallback) {
        if (city && state && country) {
            return `${city}, ${state}, ${country}`;
        } else if (city && country) {
            return `${city}, ${country}`;
        } else if (state && country) {
            return `${state}, ${country}`;
        } else if (city) {
            return city;
        } else if (fallback) {
            return fallback;
        } else {
            return 'Unknown Location';
        }
    }

    /**
     * Calculate fuzzy match score between two strings
     */
    calculateFuzzyScore(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();

        if (s1 === s2) return 1.0;
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;

        // Levenshtein distance based scoring
        const distance = this.levenshteinDistance(s1, s2);
        const maxLength = Math.max(s1.length, s2.length);

        if (maxLength === 0) return 0;

        return 1 - (distance / maxLength);
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Combine and deduplicate results from multiple APIs
     */
    combineAndDeduplicateResults(allResults) {
        const seen = new Set();
        const uniqueResults = [];

        for (const result of allResults) {
            const key = `${result.getLatitude().toFixed(4)},${result.getLongitude().toFixed(4)}`;

            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
        }

        return uniqueResults;
    }

    /**
     * Prioritize and rank results with enhanced matching
     */
    prioritizeResults(results, query) {
        const queryLower = query.toLowerCase().trim();
        const queryWords = queryLower.split(' ').filter(word => word.length > 1);

        const scoredResults = results.map(result => {
            let score = 0;
            const displayName = result.getDisplayName().toLowerCase();
            const country = result.getCountry().toLowerCase();
            const city = displayName.split(',')[0].trim();
            const fullDisplayName = displayName;

            // Enhanced exact match scoring
            if (city === queryLower) {
                score += 1000; // Highest priority for exact city match
            } else if (city.startsWith(queryLower)) {
                score += 800;
            } else if (city.includes(queryLower)) {
                score += 600;
            } else if (fullDisplayName.includes(queryLower)) {
                score += 400; // Full display name contains query
            } else {
                // Enhanced word matching with fuzzy scoring
                let wordMatches = 0;
                let fuzzyScore = 0;

                for (const word of queryWords) {
                    if (fullDisplayName.includes(word)) {
                        wordMatches++;
                        score += 50; // Higher score per word match
                    } else {
                        // Try fuzzy matching for each word
                        const fuzzyMatch = this.calculateFuzzyScore(word, city);
                        if (fuzzyMatch > 0.6) { // 60% similarity threshold
                            fuzzyScore += fuzzyMatch * 30; // Fuzzy match bonus
                        }
                    }
                }

                // Add fuzzy score
                score += fuzzyScore;

                // Bonus for multiple word matches
                if (wordMatches === queryWords.length) {
                    score += 200; // Perfect word match bonus
                } else if (wordMatches > 0) {
                    score += 100; // Partial word match bonus
                }

                // Overall fuzzy match bonus
                const overallFuzzy = this.calculateFuzzyScore(queryLower, city);
                if (overallFuzzy > 0.7) {
                    score += overallFuzzy * 200; // High fuzzy match bonus
                }
            }

            // Specific place name bonuses
            const specificPlaces = [
                'fairy meadows', 'nanga parbat', 'hunza', 'skardu', 'gilgit', 'chitral',
                'swat', 'murree', 'nathia gali', 'kaghan', 'naran', 'shogran',
                'siri paye', 'lalazar', 'saif ul malook', 'kumrat', 'kalash',
                'deosai', 'shangrila', 'attabad', 'rush lake', 'baltoro', 'concordia',
                'k2', 'gasherbrum', 'broad peak', 'masherbrum', 'trango', 'baltit',
                'altit', 'khunjerab', 'muztagh', 'shimshal', 'gojal', 'phander',
                'rush phari', 'batura', 'hispar', 'biafo', 'snow lake'
            ];

            for (const place of specificPlaces) {
                if (fullDisplayName.includes(place) && queryLower.includes(place.split(' ')[0])) {
                    score += 500; // High bonus for specific places
                    break;
                }
            }

            // Country bonuses
            if (country === 'pakistan') {
                score += 100; // Higher Pakistan bonus
            } else if (['india', 'bangladesh', 'afghanistan', 'iran'].includes(country)) {
                score += 50;
            }

            // Geographic region bonuses
            if (fullDisplayName.includes('gilgit baltistan') || fullDisplayName.includes('northern pakistan')) {
                score += 150;
            } else if (fullDisplayName.includes('kpk') || fullDisplayName.includes('khyber pakhtunkhwa')) {
                score += 100;
            } else if (fullDisplayName.includes('punjab')) {
                score += 80;
            } else if (fullDisplayName.includes('sindh')) {
                score += 60;
            } else if (fullDisplayName.includes('balochistan')) {
                score += 70;
            }

            // Tourism and natural feature bonuses
            if (fullDisplayName.includes('valley') || fullDisplayName.includes('meadow') ||
                fullDisplayName.includes('lake') || fullDisplayName.includes('peak') ||
                fullDisplayName.includes('mountain') || fullDisplayName.includes('glacier') ||
                fullDisplayName.includes('fort') || fullDisplayName.includes('national park')) {
                score += 100;
            }

            // International results (lower priority)
            if (['united states', 'united kingdom', 'canada', 'australia'].includes(country)) {
                score += 20;
            }

            return { result, score };
        });

        // Sort by score and return top results
        return scoredResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 25) // Return more results for better selection
            .map(item => item.result);
    }

    /**
     * Clean old cache entries
     */
    cleanCache() {
        if (this.cache.size > 200) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            this.cache = new Map(entries.slice(0, 100));
        }
    }

    /**
     * Get coordinates for a specific location
     */
    async getCoordinates(locationName) {
        const results = await this.searchLocation(locationName);

        if (results.length === 0) {
            throw new Error(`No coordinates found for location: ${locationName}`);
        }

        return results[0];
    }

    /**
     * Reverse geocode coordinates to get a human-readable address
     * @param {number} lat Latitude
     * @param {number} lon Longitude
     * @returns {Promise<string>} Human readable address or null
     */
    async reverseGeocode(lat, lon) {
        if (!this.mapTilerApiKey) {
            console.warn('MapTiler API key not configured for reverse geocoding');
            return null;
        }

        try {
            // MapTiler Geocoding API (Reverse)
            // URL format: https://api.maptiler.com/geocoding/{lon},{lat}.json?key={key}
            const url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${this.mapTilerApiKey}&language=en`;

            const response = await this.makeHttpRequest(url, 'SentinelApp/1.0');
            const data = JSON.parse(response);

            if (data.features && data.features.length > 0) {
                // Return the place_name of the most relevant feature (first one)
                return data.features[0].place_name || null;
            }

            return null;
        } catch (error) {
            console.error('Reverse geocoding failed:', error.message);
            return null;
        }
    }

    /**
     * Get coordinates for a specific location
     */
    async getCoordinates(locationName) {
        const results = await this.searchLocation(locationName);

        if (results.length === 0) {
            throw new Error(`No coordinates found for location: ${locationName}`);
        }

        return results[0];
    }

    close() {
        if (this.agent) {
            this.agent.destroy();
        }
        this.cache.clear();
    }
}

module.exports = EnhancedGeocodingService;
