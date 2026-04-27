/**
 * Disaster Kit Recommendation Service
 * Rule-based system to recommend disaster preparedness items based on environmental data
 */
const config = require('../config');

class DisasterKitService {

    /**
     * Calculate flood risk score (0-1)
     */
    calculateFloodRisk(data) {
        let score = 0;
        let factors = 0;

        // Rainfall contribution (40%)
        if (data.rainfall && data.rainfall.totalRainfall !== undefined) {
            const rainfall = data.rainfall.totalRainfall;
            if (rainfall > 150) score += 0.4;
            else if (rainfall > 100) score += 0.3;
            else if (rainfall > 50) score += 0.2;
            else if (rainfall > 25) score += 0.1;
            factors++;
        }

        // Waterbody proximity (30%)
        if (data.waterbody && data.waterbody.distanceMeters !== undefined) {
            const distance = data.waterbody.distanceMeters;
            if (distance < 1000) score += 0.3;
            else if (distance < 2000) score += 0.2;
            else if (distance < 5000) score += 0.1;
            else if (distance < 10000) score += 0.05;
            factors++;
        }

        // Elevation contribution (20%)
        if (data.terrain && data.terrain.elevation !== undefined) {
            const elevation = data.terrain.elevation;
            if (elevation < 100) score += 0.2;
            else if (elevation < 300) score += 0.15;
            else if (elevation < 500) score += 0.1;
            else if (elevation < 800) score += 0.05;
            factors++;
        }

        // Slope contribution (10%)
        if (data.terrain && data.terrain.slopeCategory) {
            const slope = data.terrain.slopeCategory;
            if (slope === 'flat') score += 0.1;
            else if (slope === 'gentle') score += 0.05;
            factors++;
        }

        return factors > 0 ? Math.min(score, 1) : 0;
    }

    /**
     * Calculate heat/weather risk score (0-1)
     */
    calculateHeatRisk(data) {
        let score = 0;
        let factors = 0;

        // Temperature contribution (60%)
        if (data.weather && data.weather.forecasts && data.weather.forecasts.length > 0) {
            const avgTemp = data.weather.forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / data.weather.forecasts.length;

            if (avgTemp > 40) score += 0.6;
            else if (avgTemp > 35) score += 0.4;
            else if (avgTemp > 30) score += 0.2;
            else if (avgTemp < 5) score += 0.3; // Cold weather
            else if (avgTemp < 10) score += 0.2;
            factors++;
        }

        // Rainfall in forecast (40%)
        if (data.weather && data.weather.forecasts) {
            const rainyDays = data.weather.forecasts.filter(f => f.hasRain).length;
            if (rainyDays >= 4) score += 0.4;
            else if (rainyDays >= 2) score += 0.2;
            else if (rainyDays >= 1) score += 0.1;
            factors++;
        }

        return factors > 0 ? Math.min(score, 1) : 0;
    }

    /**
     * Calculate terrain risk score (0-1)
     */
    calculateTerrainRisk(data) {
        let score = 0;
        let factors = 0;

        // Slope contribution (60%)
        if (data.terrain && data.terrain.slopeCategory) {
            const slope = data.terrain.slopeCategory;
            if (slope === 'steep') score += 0.6;
            else if (slope === 'moderate') score += 0.4;
            else if (slope === 'gentle') score += 0.2;
            factors++;
        }

        // Elevation contribution (40%)
        if (data.terrain && data.terrain.elevation !== undefined) {
            const elevation = data.terrain.elevation;
            if (elevation > 2000) score += 0.4;
            else if (elevation > 1500) score += 0.3;
            else if (elevation > 1000) score += 0.2;
            else if (elevation > 500) score += 0.1;
            factors++;
        }

        return factors > 0 ? Math.min(score, 1) : 0;
    }

    /**
     * Get recommended disaster kit items based on risk profile
     */
    getRecommendations(riskProfile) {
        const items = {
            critical: [],
            flood: [],
            weather: [],
            terrain: [],
            communication: []
        };

        // CRITICAL ITEMS (always included)
        items.critical = [
            { name: 'First Aid Kit', icon: 'fa-medkit', priority: 'critical' },
            { name: 'Bottled Water (3-day supply)', icon: 'fa-tint', priority: 'critical' },
            { name: 'Non-perishable Food', icon: 'fa-shopping-basket', priority: 'critical' },
            { name: 'Flashlight & Extra Batteries', icon: 'fa-lightbulb', priority: 'critical' },
            { name: 'Lighter or Waterproof Matches', icon: 'fa-fire', priority: 'critical' },
            { name: 'Emergency Whistle', icon: 'fa-bell', priority: 'critical' },
            { name: 'Dust Masks', icon: 'fa-head-side-mask', priority: 'critical' },
            { name: 'Personal Hygiene Items', icon: 'fa-pump-soap', priority: 'critical' },
            { name: 'Copies of Important Documents', icon: 'fa-file-alt', priority: 'critical' }
        ];

        // FLOOD-SPECIFIC ITEMS
        if (riskProfile.floodRisk > 0.3) {
            items.flood.push(
                { name: 'Waterproof Bags/Containers', icon: 'fa-box', priority: 'high' },
                { name: 'Life Jacket/Flotation Device', icon: 'fa-life-ring', priority: 'high' },
                { name: 'Rubber Boots', icon: 'fa-shoe-prints', priority: 'medium' },
                { name: 'Rope (50ft minimum)', icon: 'fa-link', priority: 'medium' }
            );
        }
        if (riskProfile.floodRisk > 0.6) {
            items.flood.push(
                { name: 'Water Purification Tablets', icon: 'fa-prescription-bottle', priority: 'high' },
                { name: 'Emergency Raft Info', icon: 'fa-info-circle', priority: 'medium' },
                { name: 'Plastic Sheeting', icon: 'fa-stop', priority: 'medium' }
            );
        }

        // WEATHER/HEAT ITEMS
        if (riskProfile.heatRisk > 0.3) {
            items.weather.push(
                { name: 'Extra Water Supply', icon: 'fa-water', priority: 'high' },
                { name: 'Sun Protection (hat, sunscreen)', icon: 'fa-sun', priority: 'medium' }
            );
        }
        if (riskProfile.heatRisk > 0.5) {
            items.weather.push(
                { name: 'Cooling Towels', icon: 'fa-snowflake', priority: 'medium' },
                { name: 'Electrolyte Packets', icon: 'fa-capsules', priority: 'medium' }
            );
        }

        // Rain-specific items
        if (riskProfile.rainyDays > 0) {
            items.weather.push(
                { name: 'Umbrella or Raincoat', icon: 'fa-umbrella', priority: 'high' },
                { name: 'Waterproof Boots', icon: 'fa-shoe-prints', priority: 'medium' }
            );
        }
        if (riskProfile.rainyDays >= 3) {
            items.weather.push(
                { name: 'Firewood or Heating Fuel', icon: 'fa-fire-alt', priority: 'medium' },
                { name: 'Extra Dry Clothing', icon: 'fa-tshirt', priority: 'medium' }
            );
        }

        // Cold weather items
        if (riskProfile.coldWeather) {
            items.weather.push(
                { name: 'Thermal Blankets', icon: 'fa-blanket', priority: 'high' },
                { name: 'Warm Clothing Layers', icon: 'fa-tshirt', priority: 'high' },
                { name: 'Hand/Foot Warmers', icon: 'fa-fire', priority: 'medium' }
            );
        }
        if (riskProfile.coldWeather && riskProfile.rainyDays > 0) {
            items.weather.push(
                { name: 'Snow Gear (if below freezing)', icon: 'fa-snowflake', priority: 'high' }
            );
        }

        // TERRAIN-SPECIFIC ITEMS
        if (riskProfile.terrainRisk > 0.3) {
            items.terrain.push(
                { name: 'Sturdy Hiking Boots', icon: 'fa-hiking', priority: 'high' },
                { name: 'Map & Compass', icon: 'fa-map-marked-alt', priority: 'medium' },
                { name: 'Emergency Shelter/Tent', icon: 'fa-campground', priority: 'medium' }
            );
        }
        if (riskProfile.terrainRisk > 0.6) {
            items.terrain.push(
                { name: 'Climbing Rope & Carabiners', icon: 'fa-mountain', priority: 'high' },
                { name: 'Emergency Sleeping Bag', icon: 'fa-bed', priority: 'medium' }
            );
        }

        // COMMUNICATION & SAFETY (always important)
        items.communication = [
            { name: 'Battery-powered Radio', icon: 'fa-broadcast-tower', priority: 'high' },
            { name: 'Portable Phone Charger', icon: 'fa-battery-three-quarters', priority: 'high' },
            { name: 'Emergency Contact List', icon: 'fa-address-book', priority: 'high' },
            { name: 'Local Emergency Numbers', icon: 'fa-phone-alt', priority: 'medium' },
            { name: 'Two-way Radios', icon: 'fa-walkie-talkie', priority: 'medium' }
        ];

        return items;
    }

    /**
     * Generate personalized area description
     */
    generateAreaDescription(data, locationName) {
        const parts = [];

        // Elevation and terrain
        if (data.terrain && data.terrain.elevation !== null) {
            const elevation = Math.round(data.terrain.elevation);
            const slope = data.terrain.slopeCategory || 'unknown';

            if (elevation < 100) {
                parts.push(`This low-lying area sits at ${elevation}m elevation with ${slope} terrain.`);
            } else if (elevation < 500) {
                parts.push(`This moderately elevated area at ${elevation}m features ${slope} terrain.`);
            } else if (elevation < 1000) {
                parts.push(`This elevated location at ${elevation}m has ${slope} slopes.`);
            } else {
                parts.push(`This high-altitude area at ${elevation}m elevation has ${slope} mountainous terrain.`);
            }
        }

        // Temperature and weather
        if (data.weather && data.weather.forecasts && data.weather.forecasts.length > 0) {
            const avgTemp = Math.round(
                data.weather.forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / data.weather.forecasts.length
            );

            if (avgTemp > 35) {
                parts.push(`Expect very hot conditions with average temperatures around ${avgTemp}°C.`);
            } else if (avgTemp > 25) {
                parts.push(`The climate is warm with average temperatures around ${avgTemp}°C.`);
            } else if (avgTemp > 15) {
                parts.push(`Moderate temperatures around ${avgTemp}°C are expected.`);
            } else if (avgTemp > 5) {
                parts.push(`Cool conditions prevail with temperatures around ${avgTemp}°C.`);
            } else {
                parts.push(`Cold weather with temperatures around ${avgTemp}°C requires extra warm clothing.`);
            }
        }

        // Rainfall (past)
        if (data.rainfall && data.rainfall.totalRainfall !== undefined) {
            const rainfall = data.rainfall.totalRainfall;
            if (rainfall > 100) {
                parts.push(`Recent heavy rainfall (${Math.round(rainfall)}mm) increases flood risk.`);
            } else if (rainfall > 50) {
                parts.push(`Moderate recent rainfall (${Math.round(rainfall)}mm) recorded.`);
            } else if (rainfall > 10) {
                parts.push(`Light rainfall (${Math.round(rainfall)}mm) in the past week.`);
            }
        }

        // Rainfall forecast (future) - ALWAYS MENTION
        if (data.weather && data.weather.forecasts && data.weather.forecasts.length > 0) {
            const rainyDays = data.weather.forecasts.filter(f => f.hasRain).length;
            const totalForecastRain = data.weather.forecasts.reduce((sum, f) => sum + (f.totalRainfall || 0), 0);

            console.log('🌧️ Weather forecast data:', {
                forecastCount: data.weather.forecasts.length,
                rainyDays,
                totalForecastRain,
                forecasts: data.weather.forecasts.map(f => ({ date: f.date, hasRain: f.hasRain, rain: f.totalRainfall }))
            });

            if (rainyDays >= 4) {
                parts.push(`Heavy rain expected over the next ${rainyDays} days (${Math.round(totalForecastRain)}mm total).`);
            } else if (rainyDays >= 2) {
                parts.push(`Rain forecast for ${rainyDays} of the coming days (${Math.round(totalForecastRain)}mm total).`);
            } else if (rainyDays === 1) {
                parts.push(`Minor rainfall expected (${Math.round(totalForecastRain)}mm over 1 day).`);
            } else {
                parts.push(`No significant rainfall expected in the next 5 days.`);
            }
        } else {
            console.log('⚠️ No weather forecast data available');
            parts.push(`Weather forecast data unavailable.`);
        }

        // Waterbody proximity
        if (data.waterbody && data.waterbody.distanceMeters) {
            const distance = Math.round(data.waterbody.distanceMeters / 1000);
            if (distance < 1) {
                parts.push(`Located very close to a water body, requiring extra flood preparedness.`);
            } else if (distance < 5) {
                parts.push(`A water body is nearby (${distance}km away).`);
            }
        }

        return parts.length > 0 ? parts.join(' ') : 'Prepare for various emergency scenarios with this comprehensive disaster kit.';
    }

    /**
     * Get AI-powered personalized recommendations using Google Gemini
     * Falls back to rule-based system if API fails or key is missing
     */
    async getAIRecommendations(riskProfile, data, locationName) {
        if (!config.GROQ_API_KEY || config.GROQ_API_KEY.includes('YourGroqKeyHere')) {
            console.log('⚠️ No Groq API Key found, using rule-based recommendations');
            return null;
        }

        try {
            console.log('🤖 Requesting AI recommendations (Llama 3) for:', locationName);

            // Construct context for the AI
            const context = {
                location: locationName,
                risks: {
                    flood: Math.round(riskProfile.floodRisk * 100) + '%',
                    heat: Math.round(riskProfile.heatRisk * 100) + '%',
                    terrain: Math.round(riskProfile.terrainRisk * 100) + '%',
                    overall: Math.round(riskProfile.overallRisk * 100) + '%'
                },
                weather: {
                    cold: riskProfile.coldWeather,
                    rainyDays: riskProfile.rainyDays,
                    avgTemp: data.weather?.forecasts ?
                        Math.round(data.weather.forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / data.weather.forecasts.length) + '°C' : 'Unknown'
                },
                terrain: {
                    elevation: data.terrain?.elevation ? Math.round(data.terrain.elevation) + 'm' : 'Unknown',
                    slope: data.terrain?.slopeCategory || 'Unknown'
                },
                waterbody: data.waterbody ? {
                    distance: data.waterbody.distanceMeters ? Math.round(data.waterbody.distanceMeters) + 'm' : 'Unknown',
                    found: data.waterbody.found
                } : 'None'
            };

            const systemPrompt = `You are an expert disaster preparedness advisor. Generate a personalized disaster survival kit list.
            Output MUST be valid JSON with this exact structure:
            {
                "critical": [{ "name": "Item Name", "icon": "fa-icon-name", "priority": "critical", "reason": "Short reason" }],
                "flood": [{ "name": "Item Name", "icon": "fa-icon-name", "priority": "high/medium/low", "reason": "Short reason" }],
                "weather": [{ "name": "Item Name", "icon": "fa-icon-name", "priority": "high/medium/low", "reason": "Short reason" }],
                "terrain": [{ "name": "Item Name", "icon": "fa-icon-name", "priority": "high/medium/low", "reason": "Short reason" }],
                "communication": [{ "name": "Item Name", "icon": "fa-icon-name", "priority": "high/medium/low", "reason": "Short reason" }]
            }
            Use FontAwesome 5 icon names. Prioritize items based on specific risks. Keep descriptions concise.`;

            const userPrompt = `Location conditions: ${JSON.stringify(context, null, 2)}`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile", // Using 70B for better reasoning, can use 8b for speed
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${errText}`);
            }

            const result = await response.json();
            const text = result.choices[0].message.content;
            const recommendations = JSON.parse(text);

            console.log('✅ AI Recommendations (Llama 3) received successfully');
            return recommendations;

        } catch (error) {
            console.error('❌ AI Recommendation failed:', error.message);
            const fs = require('fs');
            fs.writeFileSync('error_log.txt', `Error: ${error.message}\nStack: ${error.stack}\n`);
            return null; // Fallback to rule-based
        }
    }

    /**
     * Generate complete disaster kit analysis
     */
    async analyzeLocation(data, locationName) {
        // Calculate risk scores
        const floodRisk = this.calculateFloodRisk(data);
        const heatRisk = this.calculateHeatRisk(data);
        const terrainRisk = this.calculateTerrainRisk(data);

        // Check for cold weather and rainy days
        let coldWeather = false;
        let rainyDays = 0;
        if (data.weather && data.weather.forecasts && data.weather.forecasts.length > 0) {
            const avgTemp = data.weather.forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / data.weather.forecasts.length;
            coldWeather = avgTemp < 10;
            rainyDays = data.weather.forecasts.filter(f => f.hasRain).length;
        }

        // Overall risk
        const overallRisk = (floodRisk * 0.5) + (heatRisk * 0.3) + (terrainRisk * 0.2);

        // Risk profile
        const riskProfile = {
            floodRisk,
            heatRisk,
            terrainRisk,
            overallRisk,
            coldWeather,
            rainyDays
        };

        // Get recommendations (Try AI first, then fallback)
        let recommendations = await this.getAIRecommendations(riskProfile, data, locationName);
        let isAiGenerated = true;

        if (!recommendations) {
            recommendations = this.getRecommendations(riskProfile);
            isAiGenerated = false;
        }

        // Generate area description
        const areaDescription = this.generateAreaDescription(data, locationName);

        console.log('📋 Disaster Kit Analysis Complete:', {
            locationName,
            isAiGenerated,
            rainyDays,
            coldWeather,
            totalItems: Object.values(recommendations).reduce((sum, category) => sum + category.length, 0)
        });

        // Count total items
        const totalItems = Object.values(recommendations).reduce((sum, category) => sum + category.length, 0);

        return {
            success: true,
            riskProfile,
            recommendations,
            areaDescription,
            totalItems,
            isAiGenerated,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = DisasterKitService;
