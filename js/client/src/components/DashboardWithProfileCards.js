import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import ProfileCard from './ProfileCard';
import LoginPrompt from './LoginPrompt';
import './DashboardWithProfileCards.css';

const DashboardWithProfileCards = ({ data, onModalOpen, onAuthModalOpen }) => {
  const { isLoggedIn } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptFeature, setPromptFeature] = useState('');
  const getRainfallValue = () => {
    if (!data.rainfall || !data.rainfall.success) return '--';
    return `${data.rainfall.rainfallData.totalRainfall.toFixed(1)}mm`;
  };

  const getWaterbodyValue = () => {
    if (!data.waterbody || !data.waterbody.success) return '--';
    if (!data.waterbody.waterbody.found) return '--';
    const distanceMeters = data.waterbody.waterbody.distanceMeters;
    if (!distanceMeters || distanceMeters === 0) return 'Unknown';
    const distanceKm = (distanceMeters / 1000).toFixed(1);
    return `${distanceKm}km`;
  };

  const getWeatherValue = () => {
    if (!data.weather || !data.weather.success || !data.weather.forecasts.length) return '--';
    const avgTemp = data.weather.forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / data.weather.forecasts.length;
    return `${avgTemp.toFixed(1)}°C`;
  };

  const getAIValue = () => {
    if (!data.prediction || !data.prediction.success) return 'Pending...';
    // Display the merged verdict or risk score
    return data.prediction.verdict || 'Scanning';
  };

  const getRiskColor = () => {
    if (!data.prediction || !data.prediction.success) return '#aa00ff'; // Default purple
    const v = data.prediction.verdict;
    if (v === 'CRITICAL') return '#ff0000'; // Red
    if (v === 'WARNING') return '#ff8800'; // Orange
    if (v === 'CAUTION') return '#ffcc00'; // Yellow
    return '#00cc44'; // Green
  };

  // Helper to format the hydrological info for the subtitle/tooltip
  const getHydroInfo = () => {
    const waterDist = getWaterbodyValue();
    // We can try to grab water level from the prediction details if available, 
    // or just show distance for now as requested.
    return `Dist: ${waterDist}`;
  };

  const getTerrainValue = () => {
    if (!data.terrain || !data.terrain.success) return 'Loading...';
    if (data.terrain.elevation === null || data.terrain.elevation === undefined) return 'N/A';
    return `${Math.round(data.terrain.elevation)}m`;
  };

  const getSlopeValue = () => {
    if (!data.terrain || !data.terrain.success) return '...';
    if (data.terrain.slope === null || data.terrain.slope === undefined) return 'N/A';
    return data.terrain.slopeCategory || 'flat';
  };

  const handleCardClick = (type) => {
    // Check if this is a protected feature that requires login
    const protectedFeatures = ['SOS', 'HAZARD COMMUNITY'];

    if (protectedFeatures.includes(type) && !isLoggedIn) {
      setPromptFeature(type);
      setShowLoginPrompt(true);
      return;
    }

    onModalOpen(type);
  };

  const handleLoginPrompt = () => {
    setShowLoginPrompt(false);
    onAuthModalOpen();
  };

  const handleSignupPrompt = () => {
    setShowLoginPrompt(false);
    onAuthModalOpen();
  };

  const getStatsString = () => {
    if (!data.prediction || !data.prediction.success || !data.prediction.details) return 'Analyzing...';

    // Extract features
    const features = data.prediction.details.features;
    if (!features) return 'Analyzing...';

    // Format stats
    const wl = features.waterLevel !== undefined ? features.waterLevel.toFixed(0) : '--';
    const dist = features.distance !== undefined ? (features.distance / 1000).toFixed(1) : '--';

    return `WL: ${wl}mm • Dist: ${dist}km`;
  };

  return (
    <div className="dashboard-with-profile-cards">
      <h2>Weather & Risk Analysis Dashboard</h2>

      <div className="profile-cards-grid">
        {/* Rainfall Analysis Card */}
        <div className="profile-card-container" onClick={() => handleCardClick('rainfall')}>
          <ProfileCard
            name="RAINFALL ANALYSIS"
            title={`${getRainfallValue()} Total Precipitation`}
            handle="precipitation-data"
            status="Active"
            contactText="View Details"
            avatarUrl="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=400&fit=crop&crop=center"
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGradient="radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(200,100%,90%,var(--card-opacity)) 4%,hsla(200,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(200,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(200,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00aaffc4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00aaffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#00aaffff 0%,#07aaffff 40%,#07aaffff 60%,#00aaffff 100%)"
            innerGradient="linear-gradient(145deg,#60aaff22 0%,#71aaff11 100%)"
            onContactClick={() => handleCardClick('rainfall')}
          />
        </div>

        {/* Waterbody Card REMOVED - Merged into Risk Assessment */}

        {/* Weather Forecast Card */}
        <div className="profile-card-container" onClick={() => handleCardClick('weather')}>
          <ProfileCard
            name="WEATHER FORECAST"
            title={`${getWeatherValue()} Average Temperature`}
            handle="weather-data"
            status="Updated"
            contactText="View Forecast"
            avatarUrl="https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&h=400&fit=crop&crop=center"
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGradient="radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(40,100%,90%,var(--card-opacity)) 4%,hsla(40,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(40,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(40,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#ffaa00c4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#ffaa00ff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#ffaa00ff 0%,#ffaa00ff 40%,#ffaa00ff 60%,#ffaa00ff 100%)"
            innerGradient="linear-gradient(145deg,#ffaa0022 0%,#ffaa0011 100%)"
            onContactClick={() => handleCardClick('weather')}
          />
        </div>

        {/* Terrain Analysis Card */}
        <div className="profile-card-container" onClick={() => handleCardClick('terrain')}>
          <ProfileCard
            name="TERRAIN ANALYSIS"
            title={`${getTerrainValue()} Elevation • ${getSlopeValue()} slope`}
            handle="terrain-data"
            status="Active"
            contactText="View Details"
            avatarUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGradient="radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(120,100%,90%,var(--card-opacity)) 4%,hsla(120,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(120,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(120,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ff88c4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00ff88ff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#00ff88ff 0%,#07ff88ff 40%,#07ff88ff 60%,#00ff88ff 100%)"
            innerGradient="linear-gradient(145deg,#60ff8822 0%,#71ff8811 100%)"
            onContactClick={() => handleCardClick('terrain')}
          />
        </div>

        {/* AI Analysis Card */}
        <div className="profile-card-container" onClick={() => handleCardClick('ai')}>
          <ProfileCard
            name="FLOOD RISK"
            title={`${getAIValue()} • ${getStatsString()}`}
            handle="ai-insights"
            status={data.prediction ? "Analyzed" : "Processing"}
            contactText="View Safety Report"
            avatarUrl="/riskassessment.jpg"
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            // Use dynamic color based on risk
            behindGradient={`radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(0,0%,100%,0.2) 4%,hsla(0,0%,100%,0.1) 10%,transparent 50%), radial-gradient(circle at 50% 50%, ${getRiskColor()} 0%, transparent 70%)`}
            innerGradient="linear-gradient(145deg,rgba(255,255,255,0.1) 0%,rgba(0,0,0,0.1) 100%)"
            onContactClick={() => handleCardClick('ai')}
          />
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPrompt
          feature={promptFeature}
          onLogin={handleLoginPrompt}
          onSignup={handleSignupPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
};

export default DashboardWithProfileCards;
