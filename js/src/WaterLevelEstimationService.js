const DateUtils = require('./DateUtils');
const ActualRealTimeWaterLevelService = require('./ActualRealTimeWaterLevelService');
const NasaPowerApiClient = require('./NasaPowerApiClient');
const OpenMeteoService = require('./OpenMeteoService');

/**
 * Service for estimating water levels based on rainfall, season, and waterbody characteristics
 * Now uses ACTUAL real-time data sources for Pakistan
 */
class WaterLevelEstimationService {
    constructor() {
        this.realTimeService = new ActualRealTimeWaterLevelService();
        this.nasaClient = new NasaPowerApiClient();
        this.openMeteo = new OpenMeteoService();

        // Base water levels for different waterbody types (in mm)
        // REVERTED TO MINIMAL VALUES - NO HARDCODING
        // Water levels will be driven by API Data (Discharge/Rainfall)
        this.BASE_LEVELS = {
            'river': 100,
            'lake': 100,
            'reservoir': 100,
            'ocean': 0,
            'sea': 0,
            'stream': 50,
            'pond': 50,
            'canal': 100
        };

        // Seasonal adjustment factors
        this.SEASONAL_FACTORS = {
            'monsoon': 1.5,      // June-September (high water levels)
            'post-monsoon': 1.2,  // October-November
            'winter': 0.8,        // December-February (lowest levels)
            'pre-monsoon': 1.0    // March-May
        };

        // Rainfall impact factors (mm of water level increase per mm of rainfall)
        this.RAINFALL_IMPACT = {
            'river': 0.8,        // Rivers respond quickly to rainfall
            'lake': 0.3,         // Lakes have more storage capacity
            'reservoir': 0.5,    // Reservoirs are managed
            'ocean': 0.0,        // Ocean levels don't change with rainfall
            'sea': 0.0,
            'stream': 1.2,       // Small streams respond very quickly
            'pond': 0.6,
            'canal': 0.4
        };

        // Distance impact (closer to source = higher impact)
        this.DISTANCE_IMPACT = {
            'very_close': 1.3,   // 0-100m
            'close': 1.1,        // 100-500m
            'moderate': 1.0,     // 500-2000m
            'far': 0.9,          // 2000-5000m
            'very_far': 0.8      // 5000m+
        };
    }

    /**
     * Get ACTUAL real-time water level data for Pakistan rivers
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @param {string} riverName - Optional river name for targeted search
     * @returns {Promise<Object>} Real-time water level data from actual sources
     */
    async getRealTimeWaterLevel(latitude, longitude, riverName = null) {
        try {
            console.log(`Getting ACTUAL real-time water level data for ${latitude}, ${longitude}...`);
            const realTimeData = await this.realTimeService.getRealTimeWaterLevel(latitude, longitude, riverName);

            // Determine if we truly have real water level data (not estimates)
            const hasRealWaterLevelData = Array.isArray(realTimeData.waterLevels) &&
                realTimeData.waterLevels.some(s =>
                    s.isRealWaterLevel === true &&
                    (s.source === 'DAHITI' || s.source.includes('FFC') || s.source.includes('PMD'))
                );

            // Check if we have any API data (even estimates)
            const hasAnyAPIData = Array.isArray(realTimeData.waterLevels) &&
                realTimeData.waterLevels.some(s =>
                    (s.source === 'DAHITI' || s.source.includes('OpenWeatherMap') || s.source.includes('Open-Meteo')) &&
                    !String(s.source).toLowerCase().includes('fallback') &&
                    !String(s.source).toLowerCase().includes('simulated')
                );

            // --- ADJUST WATER LEVEL BASED ON RAINFALL HISTORY IF DATA IS OLD ---
            let finalWaterLevel = realTimeData.averageWaterLevel;
            let rainfallAdjustment = 0;
            let daysGap = 0;
            let accumulatedRainfall = 0;

            if (realTimeData.lastUpdated) {
                const lastUpdatedDate = new Date(realTimeData.lastUpdated);
                const now = new Date();
                const diffTime = Math.abs(now - lastUpdatedDate);
                daysGap = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // If data is older than 2 days, fetch rainfall history
                if (daysGap > 2) {
                    console.log(`Water level data is ${daysGap} days old. Fetching rainfall history via Open-Meteo for adjustment...`);
                    try {
                        // Use Open-Meteo for accurate recent rainfall (NASA Power has lag)
                        accumulatedRainfall = await this.openMeteo.getPrecipitationSum(latitude, longitude, lastUpdatedDate, now);

                        const impactFactor = this.RAINFALL_IMPACT['river'];
                        rainfallAdjustment = accumulatedRainfall * impactFactor;

                        console.log(`Adjusting water level: +${rainfallAdjustment.toFixed(1)}mm (Rain: ${accumulatedRainfall.toFixed(1)}mm over ${daysGap} days)`);
                        finalWaterLevel += rainfallAdjustment;
                        finalWaterLevel = Math.max(0, Math.min(8000, finalWaterLevel));
                    } catch (rainfallError) {
                        console.warn('Failed to fetch historical rainfall for adjustment:', rainfallError.message);
                    }
                }
            }

            // VALIDATION: If level is 0 or invalid, consider it a fetch failure and fall back
            if (!finalWaterLevel || finalWaterLevel <= 0 || isNaN(finalWaterLevel)) {
                console.warn("Real-time service returned 0/invalid level, falling back to estimation.");
                return this.estimateWaterLevel(null, null, 0, latitude, longitude);
            }

            return {
                level: finalWaterLevel,
                confidence: realTimeData.confidence,
                isRealTime: Boolean(hasAnyAPIData),
                isRealWaterLevel: Boolean(hasRealWaterLevelData),
                sources: realTimeData.sources,
                lastUpdated: realTimeData.lastUpdated,
                stations: realTimeData.waterLevels,
                factors: {
                    dataSource: hasRealWaterLevelData ? 'Real Water Level APIs' :
                        hasAnyAPIData ? 'Weather-Based Estimates' : 'Simulated/Fallback',
                    stationCount: realTimeData.waterLevels.length,
                    averageConfidence: realTimeData.confidence,
                    sources: realTimeData.sources,
                    dataType: hasRealWaterLevelData ? 'actual_measurements' :
                        hasAnyAPIData ? 'weather_estimates' : 'simulated',
                    rainfallAdjustment: rainfallAdjustment,
                    historicalRainfall: accumulatedRainfall,
                    daysSinceLastUpdate: daysGap
                },
                riskLevel: this.getWaterLevelRiskLevel(finalWaterLevel),
                status: this.getWaterLevelStatus(finalWaterLevel, 'river')
            };
        } catch (error) {
            console.warn('Real-time water level fetch failed, falling back to estimation:', error.message);
            return this.estimateWaterLevel(null, null, 0, latitude, longitude);
        }
    }

    /**
     * Estimate water level for a given waterbody and conditions
     * Now uses Open-Meteo Flood API for GLOBAL RIVER DISCHARGE modeling
     * @param {Object} waterbody - Waterbody data from OSM
     * @param {Object} rainfallData - Recent rainfall data
     * @param {number} distanceMeters - Distance to waterbody in meters
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @returns {Object} Estimated water level data
     */
    async estimateWaterLevel(waterbody, rainfallData, distanceMeters, latitude, longitude) {
        // Defaults if no waterbody found (Urban Flood Mode check happens later)
        if (!waterbody || !waterbody.found()) {
            return this.getDefaultEstimate();
        }

        const waterbodyType = this.getWaterbodyType(waterbody);
        let estimatedLevel = 0;
        let method = 'hydraulic_model';
        let confidence = 0.7;

        // 1. TRY GLOBAL HYDRAULIC MODEL (Open-Meteo Flood/Discharge API)
        // This works for ANY coordinate, even small streams (Korang Nadi)
        try {
            console.log(`[HydraulicModel] Fetching global discharge for ${latitude}, ${longitude}...`);
            const floodData = await this.openMeteo.getFloodData(latitude, longitude);

            if (floodData && floodData.discharge !== null) {
                // We have real physics-based flow data!
                const discharge = floodData.discharge; // m³/s

                // Convert Discharge (m³/s) to Depth (mm) using Rating Curve
                // Depth = c * Q^f  (Typical river hydraulic formula)
                estimatedLevel = this.calculateDepthFromDischarge(discharge, waterbodyType);

                console.log(`[HydraulicModel] Discharge: ${discharge.toFixed(2)} m³/s -> Calculated Depth: ${estimatedLevel} mm`);

                // Add recent rainfall impact (surface runoff addition)
                const rainRunoff = this.calculateRecentRainfall(rainfallData) * 0.5;
                estimatedLevel += rainRunoff;

                confidence = 0.85; // High confidence in physics model
            } else {
                throw new Error("No discharge data available");
            }
        } catch (modelError) {
            console.warn(`[HydraulicModel] Failed, falling back to basic estimation: ${modelError.message}`);

            // 2. FALLBACK: Basic Estimation (Season + Static Base)
            method = 'basic_estimation';
            estimatedLevel = this.getRealisticBaseLevel(waterbodyType); // e.g. 1200

            // Ensure we have a valid number start
            if (isNaN(estimatedLevel)) estimatedLevel = 1000;

            const season = this.getCurrentSeason(latitude);
            const seasonalFactor = this.SEASONAL_FACTORS[season] || 1.0;
            const rainfallImpact = this.calculateRecentRainfall(rainfallData) * (this.RAINFALL_IMPACT[waterbodyType] || 0.5);

            estimatedLevel = (estimatedLevel * seasonalFactor) + rainfallImpact;
            confidence = 0.5;
        }

        // Apply distance scaling (if needed, though mostly relevant for risk, not level)
        // We keep level as "River Level", risk logic handles distance.

        // Ensure realistic bounds (0 - 15000mm)
        // CRITICAL FIX: Ensure it's a valid number even if calculation failed somewhere
        if (isNaN(estimatedLevel) || estimatedLevel === null || estimatedLevel === undefined) {
            estimatedLevel = 500; // Safe fallback
        }

        estimatedLevel = Math.max(0, Math.min(15000, Math.round(estimatedLevel)));

        return {
            level: estimatedLevel,
            confidence: confidence,
            factors: {
                method: method,
                waterbodyType: waterbodyType,
                season: this.getCurrentSeason(latitude),
                recentRainfall: this.calculateRecentRainfall(rainfallData)
            },
            riskLevel: this.getRiskLevel(estimatedLevel, waterbodyType),
            status: this.getWaterLevelStatus(estimatedLevel, waterbodyType)
        };
    }

    /**
     * Convert River Discharge (m³/s) to Water Level Depth (mm)
     * Using simplified Manning's Equation / Rating Curve: y = c * Q^0.4
     */
    calculateDepthFromDischarge(discharge, type) {
        // Coefficients based on channel width/roughness assumptions
        // Wider rivers rise slower for same discharge
        let coefficient = 0.5;

        switch (type) {
            case 'river':
                coefficient = 0.45; // Standard river
                break;
            case 'stream':
                coefficient = 0.8; // Narrow channel -> Rises fast!
                break;
            case 'canal':
                coefficient = 0.6;
                break;
            case 'nullah':
                coefficient = 1.0; // Flashy!
                break;
            default:
                coefficient = 0.5;
        }

        // Formula: Depth (m) = coeff * (Q ^ 0.4)
        // Small discharge (e.g. 2 m³/s stream) -> 0.8 * 1.3 = 1.04m depth (reasonable)
        // Large discharge (e.g. 5000 m³/s Indus) -> 0.45 * 30 = 13.5m depth (reasonable)
        const depthMeters = coefficient * Math.pow(Math.max(0.5, discharge), 0.4);

        return Math.round(depthMeters * 1000); // Return in mm
    }

    /**
     * Get realistic base level for fallback (Dry Season Average)
     */
    getRealisticBaseLevel(type) {
        switch (type) {
            case 'river': return 1200; // 1.2m
            case 'stream': return 500;  // 0.5m
            case 'canal': return 1500; // 1.5m (controlled)
            case 'lake': return 2000;  // 2.0m
            case 'reservoir': return 5000; // 5.0m
            default: return 800; // 0.8m
        }
    }

    /**
     * Get waterbody type from OSM data
     */
    getWaterbodyType(waterbody) {
        const type = waterbody.getType().toLowerCase();

        if (type.includes('ocean') || type.includes('sea')) return 'ocean';
        if (type.includes('reservoir') || type.includes('dam')) return 'reservoir';
        if (type.includes('lake') || type.includes('pond')) return 'lake';
        if (type.includes('river') || type.includes('stream')) return 'river';
        if (type.includes('canal')) return 'canal';

        return 'river'; // Default
    }

    /**
     * Determine current season based on location and date
     */
    getCurrentSeason(latitude) {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12

        // Pakistan's climate zones
        if (latitude > 30) { // Northern Pakistan
            if (month >= 6 && month <= 9) return 'monsoon';
            if (month >= 10 && month <= 11) return 'post-monsoon';
            if (month >= 12 || month <= 2) return 'winter';
            return 'pre-monsoon';
        } else { // Southern Pakistan
            if (month >= 6 && month <= 9) return 'monsoon';
            if (month >= 10 && month <= 11) return 'post-monsoon';
            if (month >= 12 || month <= 2) return 'winter';
            return 'pre-monsoon';
        }
    }

    /**
     * Calculate recent rainfall impact
     */
    calculateRecentRainfall(rainfallData) {
        if (!rainfallData || !rainfallData.dailyRainfall) {
            return 0;
        }

        // Sum rainfall from last 7 days
        let totalRainfall = 0;
        rainfallData.dailyRainfall.forEach(day => {
            totalRainfall += day.rainfall || 0;
        });

        return totalRainfall;
    }

    /**
     * Get distance category for impact calculation
     */
    getDistanceCategory(distanceMeters) {
        if (distanceMeters <= 100) return 'very_close';
        if (distanceMeters <= 500) return 'close';
        if (distanceMeters <= 2000) return 'moderate';
        if (distanceMeters <= 5000) return 'far';
        return 'very_far';
    }

    /**
     * Get elevation correction factor
     */
    getElevationCorrection(latitude, longitude) {
        // High elevation areas actually often have FASTER and DEEPER flow during melt/rain, 
        // unlike the previous logic which assumed "standing water" decreases.
        // We will remove the penalty and instead return a small variance.
        return 0;
    }

    /**
     * Calculate confidence level for the estimate
     */
    calculateConfidence(waterbodyType, recentRainfall, distanceMeters) {
        let confidence = 0.7; // Base confidence

        // Higher confidence for major waterbodies
        if (['river', 'reservoir', 'lake'].includes(waterbodyType)) {
            confidence += 0.2;
        }

        // Higher confidence with recent rainfall data
        if (recentRainfall > 0) {
            confidence += 0.1;
        }

        // Higher confidence for closer waterbodies
        if (distanceMeters < 1000) {
            confidence += 0.1;
        }

        return Math.min(0.95, confidence);
    }

    /**
     * Get risk level based on water level
     */
    getRiskLevel(waterLevel, waterbodyType) {
        const thresholds = {
            'river': { low: 1500, medium: 3000, high: 4000 },
            'lake': { low: 1000, medium: 2000, high: 3000 },
            'reservoir': { low: 2000, medium: 4000, high: 4500 },
            'ocean': { low: 0, medium: 0, high: 0 },
            'sea': { low: 0, medium: 0, high: 0 },
            'stream': { low: 300, medium: 800, high: 1200 },
            'pond': { low: 500, medium: 1000, high: 1500 },
            'canal': { low: 800, medium: 1500, high: 2000 }
        };

        const threshold = thresholds[waterbodyType] || thresholds['river'];

        if (waterLevel <= threshold.low) return 'Low';
        if (waterLevel <= threshold.medium) return 'Medium';
        if (waterLevel <= threshold.high) return 'High';
        return 'Critical';
    }

    /**
     * Get water level risk level (alias for getRiskLevel for compatibility)
     */
    getWaterLevelRiskLevel(waterLevel) {
        return this.getRiskLevel(waterLevel, 'river');
    }

    /**
     * Get water level status description
     */
    getWaterLevelStatus(waterLevel, waterbodyType) {
        const riskLevel = this.getRiskLevel(waterLevel, waterbodyType);

        const statuses = {
            'Low': 'Normal water levels - minimal flood risk',
            'Medium': 'Elevated water levels - moderate flood risk',
            'High': 'High water levels - significant flood risk',
            'Critical': 'Critical water levels - immediate flood danger'
        };

        return statuses[riskLevel] || statuses['Low'];
    }

    /**
     * Get default estimate when no waterbody data is available
     */
    getDefaultEstimate() {
        return {
            level: 1500,
            confidence: 0.3,
            factors: {
                baseLevel: 1500,
                seasonalFactor: 1.0,
                rainfallContribution: 0,
                distanceFactor: 1.0,
                elevationCorrection: 0,
                season: 'unknown',
                waterbodyType: 'unknown',
                recentRainfall: 0
            },
            riskLevel: 'Low',
            status: 'No nearby water source detected'
        };
    }
}

module.exports = WaterLevelEstimationService;
