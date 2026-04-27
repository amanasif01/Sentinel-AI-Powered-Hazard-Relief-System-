import React, { useState, useEffect } from 'react';
import DashboardWithProfileCards from './DashboardWithProfileCards';
import SearchContainer from './SearchContainer';
import './RiskAssessmentScreen.css';

const RiskAssessmentScreen = ({ selectedLocation, onLocationSelect, onModalOpen, onAuthModalOpen }) => {
  const [dashboardData, setDashboardData] = useState({
    rainfall: null,
    waterbody: null,
    weather: null,
    terrain: null,
    weather: null,
    terrain: null,
    prediction: null
  });

  useEffect(() => {
    if (selectedLocation) {
      loadLocationData(selectedLocation.lat, selectedLocation.lon);
    }
  }, [selectedLocation]);

  const loadLocationData = async (lat, lon) => {
    // Load all data in parallel
    const [rainfallData, waterbodyData, weatherData, terrainData, predictionData] = await Promise.allSettled([
      fetch(`/api/rainfall?lat=${lat}&lon=${lon}`).then(res => res.json()),
      fetch(`/api/waterbody?lat=${lat}&lon=${lon}`).then(res => res.json()),
      fetch(`/api/weather?lat=${lat}&lon=${lon}`).then(res => res.json()),
      fetch(`/api/terrain?lat=${lat}&lon=${lon}`).then(res => res.json()),
      fetch(`/api/predict-flood?lat=${lat}&lon=${lon}`).then(res => res.json())
    ]);

    setDashboardData({
      rainfall: rainfallData.status === 'fulfilled' ? rainfallData.value : null,
      waterbody: waterbodyData.status === 'fulfilled' ? waterbodyData.value : null,
      weather: weatherData.status === 'fulfilled' ? weatherData.value : null,
      terrain: terrainData.status === 'fulfilled' ? terrainData.value : null,
      prediction: (predictionData && predictionData.status === 'fulfilled') ? predictionData.value : null
    });
  };

  if (!selectedLocation) {
    return (
      <div className="risk-assessment-screen">
        <div className="header">
          <h1><i className="fas fa-shield-alt"></i> RISK ASSESSMENT</h1>
          <p>Comprehensive Flood Risk Analysis & Weather Intelligence</p>
        </div>

        {/* Professional Search Section - Matching the home page style */}
        <div className="search-section-container">
          <div className="search-section-header">
            <i className="fas fa-map-marker-alt"></i>
            <h4>Select Location for Risk Assessment</h4>
            <p>Choose a location to access comprehensive flood risk analysis and weather intelligence</p>
          </div>

          <div className="search-input-wrapper">
            <div className="search-input-container">
              <SearchContainer onLocationSelect={onLocationSelect} />
            </div>
          </div>

          {/* Change Location Button - Only visible when location is selected */}
          {selectedLocation && (
            <div className="change-location-section">
              <button
                className="change-location-btn"
                onClick={() => onLocationSelect(null)}
              >
                <i className="fas fa-exchange-alt"></i>
                <span>Change Location</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="risk-assessment-screen">
      <div className="header">
        <h1><i className="fas fa-shield-alt"></i> RISK ASSESSMENT</h1>
        <p>Comprehensive Flood Risk Analysis & Weather Intelligence</p>

        {/* Professional Location Display and Change Button */}
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

      <DashboardWithProfileCards
        data={dashboardData}
        onModalOpen={onModalOpen}
        onAuthModalOpen={onAuthModalOpen}
      />
    </div>
  );
};

export default RiskAssessmentScreen;
