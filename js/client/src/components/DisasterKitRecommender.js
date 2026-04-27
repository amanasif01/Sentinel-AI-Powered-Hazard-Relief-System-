import React, { useState, useEffect } from 'react';
import SearchContainer from './SearchContainer';
import './DisasterKitRecommender.css';

const DisasterKitRecommender = ({ selectedLocation, onLocationSelect, onBack }) => {
    const [kitData, setKitData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedLocation) {
            loadKitRecommendations(selectedLocation.lat, selectedLocation.lon);
        }
    }, [selectedLocation]);

    const loadKitRecommendations = async (lat, lon) => {
        setLoading(true);
        setError('');

        try {
            const locationName = encodeURIComponent(selectedLocation?.name || 'Unknown Location');
            const response = await fetch(`/api/disaster-kit?lat=${lat}&lon=${lon}&name=${locationName}`);
            const data = await response.json();

            console.log('🎯 Received disaster kit data:', {
                success: data.success,
                hasDescription: !!data.areaDescription,
                description: data.areaDescription,
                totalItems: data.totalItems,
                weatherItemsCount: data.recommendations?.weather?.length || 0
            });

            if (data.success) {
                setKitData(data);
            } else {
                setError(data.error || 'Failed to load recommendations');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Error loading disaster kit:', err);
        } finally {
            setLoading(false);
        }
    };

    // No location selected view
    if (!selectedLocation) {
        return (
            <div className="disaster-kit-recommender">
                <div className="kit-header">
                    <div className="header-content">
                        <h1><i className="fas fa-briefcase-medical"></i> DISASTER KIT RECOMMENDER</h1>
                        <p>Personalized emergency preparedness recommendations</p>
                    </div>
                </div>

                <div className="search-section-container">
                    <div className="search-section-header">
                        <i className="fas fa-map-marker-alt"></i>
                        <h4>Select Location for Analysis</h4>
                        <p>Choose a location to receive personalized disaster kit recommendations</p>
                    </div>

                    <div className="search-input-wrapper">
                        <div className="search-input-container">
                            <SearchContainer onLocationSelect={onLocationSelect} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="disaster-kit-recommender">
                <div className="kit-header">
                    <div className="header-content">
                        <h1><i className="fas fa-briefcase-medical"></i> DISASTER KIT RECOMMENDER</h1>
                    </div>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Analyzing location data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="disaster-kit-recommender">
                <div className="kit-header">
                    <div className="header-content">
                        <h1><i className="fas fa-briefcase-medical"></i> DISASTER KIT RECOMMENDER</h1>
                    </div>
                </div>
                <div className="error-container">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={() => onLocationSelect(null)}>
                        Select Different Location
                    </button>
                </div>
            </div>
        );
    }

    // Main content with recommendations
    return (
        <div className="disaster-kit-recommender">
            <div className="kit-header">
                <div className="header-content">
                    <h1><i className="fas fa-briefcase-medical"></i> DISASTER KIT RECOMMENDER</h1>
                    <p>Emergency preparedness recommendations for your location</p>

                    <div className="location-header">
                        <div className="current-location">
                            <i className="fas fa-map-marker-alt"></i>
                            <span className="location-name">{selectedLocation.name}</span>
                            <span className="location-coords">
                                {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
                            </span>
                        </div>

                        <button
                            className="location-change-btn"
                            onClick={() => onLocationSelect(null)}
                            title="Change Location"
                        >
                            <i className="fas fa-exchange-alt"></i>
                            <span>Change Location</span>
                        </button>
                    </div>
                </div>
            </div>

            {kitData && (
                <div className="kit-content">
                    {/* Area Description */}
                    <div className="area-description">
                        <div className="area-info">
                            <i className="fas fa-info-circle"></i>
                            <h2>About {selectedLocation.name}</h2>
                        </div>
                        <p className="description-text">
                            {kitData.areaDescription || 'Loading area information...'}
                        </p>
                    </div>

                    {/* Recommended Items */}
                    <div className="recommendations-section">
                        <div className="section-header">
                            <h2>Recommended Items</h2>
                            <span className="item-count">{kitData.totalItems} Items</span>
                        </div>

                        {/* Critical Items */}
                        {kitData.recommendations.critical.length > 0 && (
                            <div className="category-section critical">
                                <h3><i className="fas fa-exclamation-circle"></i> Critical Items (Always Essential)</h3>
                                <div className="items-grid">
                                    {kitData.recommendations.critical.map((item, index) => (
                                        <div key={index} className={`item-card ${item.priority}`}>
                                            <i className={`fas ${item.icon}`}></i>
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flood-Specific Items */}
                        {kitData.recommendations.flood.length > 0 && (
                            <div className="category-section flood">
                                <h3><i className="fas fa-water"></i> Flood Protection Items</h3>
                                <div className="items-grid">
                                    {kitData.recommendations.flood.map((item, index) => (
                                        <div key={index} className={`item-card ${item.priority}`}>
                                            <i className={`fas ${item.icon}`}></i>
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weather Items */}
                        {kitData.recommendations.weather.length > 0 && (
                            <div className="category-section weather">
                                <h3><i className="fas fa-cloud-sun"></i> Weather Protection Items</h3>
                                <div className="items-grid">
                                    {kitData.recommendations.weather.map((item, index) => (
                                        <div key={index} className={`item-card ${item.priority}`}>
                                            <i className={`fas ${item.icon}`}></i>
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Terrain Items */}
                        {kitData.recommendations.terrain.length > 0 && (
                            <div className="category-section terrain">
                                <h3><i className="fas fa-mountain"></i> Terrain-Specific Items</h3>
                                <div className="items-grid">
                                    {kitData.recommendations.terrain.map((item, index) => (
                                        <div key={index} className={`item-card ${item.priority}`}>
                                            <i className={`fas ${item.icon}`}></i>
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Communication Items */}
                        {kitData.recommendations.communication.length > 0 && (
                            <div className="category-section communication">
                                <h3><i className="fas fa-broadcast-tower"></i> Communication & Safety</h3>
                                <div className="items-grid">
                                    {kitData.recommendations.communication.map((item, index) => (
                                        <div key={index} className={`item-card ${item.priority}`}>
                                            <i className={`fas ${item.icon}`}></i>
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisasterKitRecommender;
