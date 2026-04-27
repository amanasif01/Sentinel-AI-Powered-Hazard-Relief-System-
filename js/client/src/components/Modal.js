import React, { useState, useEffect } from 'react';
import './Modal.css';

const Modal = ({ type, location, onClose }) => {
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location) {
      loadModalData();
    }
  }, [type, location]);

  const loadModalData = async () => {
    setIsLoading(true);

    try {
      const { lat, lon } = location;
      let data = null;

      switch (type) {
        case 'rainfall':
          data = await loadRainfallData(lat, lon);
          break;
        case 'waterbody':
          data = await loadWaterbodyData(lat, lon);
          break;
        case 'weather':
          data = await loadWeatherData(lat, lon);
          break;
        case 'terrain':
          data = await loadTerrainData(lat, lon);
          break;
        case 'ai':
          data = await loadAIData(lat, lon);
          break;
        default:
          data = null;
      }

      setModalData(data);
    } catch (error) {
      console.error('Error loading modal data:', error);
      setModalData({ error: true });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRainfallData = async (lat, lon) => {
    const response = await fetch(`/api/rainfall?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.success ? data.rainfallData : null;
  };

  const loadWaterbodyData = async (lat, lon) => {
    const response = await fetch(`/api/waterbody?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.success ? data.waterbody : null;
  };

  const loadWeatherData = async (lat, lon) => {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.success ? data.forecasts : null;
  };

  const loadTerrainData = async (lat, lon) => {
    const response = await fetch(`/api/terrain?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.success ? data : null;
  };

  const loadAIData = async (lat, lon) => {
    const response = await fetch(`/api/predict-flood?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data.success ? data : null;
  };

  const getModalTitle = () => {
    switch (type) {
      case 'rainfall': return 'Rainfall Analysis';
      case 'waterbody': return 'Hydrological Analysis';
      case 'weather': return 'Weather Forecast';
      case 'terrain': return 'Terrain Analysis';
      case 'ai': return 'AI Analysis';
      default: return 'Analysis';
    }
  };

  const renderModalContent = () => {
    if (isLoading) {
      return (
        <div className="loading">
          <i className="fas fa-spinner"></i>
          <p>Loading {type} data...</p>
        </div>
      );
    }

    if (!modalData || modalData.error) {
      return (
        <div className="loading">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Failed to load {type} data</p>
        </div>
      );
    }

    switch (type) {
      case 'rainfall':
        return renderRainfallContent(modalData);
      case 'waterbody':
        return renderWaterbodyContent(modalData);
      case 'weather':
        return renderWeatherContent(modalData);
      case 'terrain':
        return renderTerrainContent(modalData);
      case 'ai':
        return renderAIContent(modalData);
      default:
        return <div>Unknown analysis type</div>;
    }
  };

  const renderRainfallContent = (rainfallData) => {
    const { totalRainfall, averageRainfall, daysWithRain, maxRainfall, dailyData } = rainfallData;

    return (
      <>
        <div className="data-grid">
          <div className="data-item">
            <div className="data-value">{totalRainfall.toFixed(1)}</div>
            <div className="data-label">Total Rainfall (mm)</div>
          </div>
          <div className="data-item">
            <div className="data-value">{averageRainfall.toFixed(1)}</div>
            <div className="data-label">Average Daily (mm)</div>
          </div>
          <div className="data-item">
            <div className="data-value">{daysWithRain}</div>
            <div className="data-label">Days with Rain</div>
          </div>
          <div className="data-item">
            <div className="data-value">{maxRainfall.toFixed(1)}</div>
            <div className="data-label">Maximum Daily (mm)</div>
          </div>
        </div>
        <div className="chart-container">
          <h3 style={{
            marginBottom: '20px',
            color: 'var(--primary)',
            textAlign: 'center',
            fontSize: '1.3rem',
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.5px'
          }}>
            Daily Rainfall Distribution
          </h3>
          {createRainfallChart(dailyData)}
        </div>
      </>
    );
  };

  const renderWaterbodyContent = (waterbody) => {
    if (waterbody && waterbody.found) {
      // Handle both old and new data structures
      const distanceMeters = waterbody.distanceMeters || 0;
      const distanceKm = distanceMeters > 0 ? (distanceMeters / 1000).toFixed(1) : 'Unknown';
      const waterLevel = waterbody.waterLevel;

      // Get risk level color
      const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
          case 'Critical': return '#ff4444';
          case 'High': return '#ff8800';
          case 'Medium': return '#ffaa00';
          case 'Low': return '#44ff44';
          default: return '#888888';
        }
      };

      return (
        <>
          {/* Clean Analysis Type Badge */}
          {waterLevel && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '25px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: waterLevel.sources && waterLevel.sources.includes('DAHITI')
                    ? '#4fc3f7'
                    : '#66bb6a'
                }}></div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: 'var(--light)',
                  letterSpacing: '0.3px'
                }}>
                  {(() => {
                    if (waterLevel.sources && waterLevel.sources.includes('DAHITI')) {
                      return 'DAHITI Satellite Analysis';
                    } else if (waterLevel.sources && waterLevel.sources.includes('DAHITI Satellite Data')) {
                      return 'DAHITI Satellite Analysis';
                    } else if (waterLevel.sources && waterLevel.sources.some(source => source.includes('DAHITI'))) {
                      return 'DAHITI Satellite Analysis';
                    } else {
                      return 'Predictive Water Level Analysis';
                    }
                  })()}
                </span>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--primary)' }}>
              <i className="fas fa-water"></i>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '10px', color: 'var(--light)' }}>
              {waterbody.name || 'Unnamed Waterbody'}
            </div>
            <div style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
              {waterbody.type || 'Water feature'}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'var(--light)',
              padding: '20px',
              borderRadius: '15px',
              fontSize: '1.5rem',
              fontWeight: '700',
              display: 'inline-block'
            }}>
              {distanceKm} km away
            </div>
          </div>


          {/* Water Level Information */}
          {waterLevel && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px',
              border: `2px solid ${getRiskColor(waterLevel.riskLevel)}`
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: getRiskColor(waterLevel.riskLevel),
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                <i className="fas fa-tint" style={{ marginRight: '10px' }}></i>
                {waterLevel.isElevationBased ? 'Elevation-Based' : waterLevel.isDatasetBased ? 'Dataset-Based' : waterLevel.isRealTime ? 'Real-Time' : 'Estimated'} Water Level: {(waterLevel.level / 1000).toFixed(2)}m
              </div>

              {/* Professional Data Source Disclaimer */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#4fc3f7' }}></i>
                  Data Source Information
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4'
                }}>
                  {waterLevel.sources && (waterLevel.sources.includes('DAHITI') || waterLevel.sources.includes('DAHITI Satellite Data') || waterLevel.sources.some(source => source.includes('DAHITI'))) ? (
                    <>
                      <strong>DAHITI Satellite Analysis:</strong> Water level data derived from satellite altimetry measurements.
                      This represents actual satellite observations of water surface elevation.
                    </>
                  ) : (waterLevel.isRealTime || (waterLevel.sources && waterLevel.sources.length > 0)) ? (
                    <>
                      <strong>Real-Time API Data:</strong> Water level estimates calculated using live weather and hydrological data
                      from multiple monitoring sources. Data accuracy may vary based on station proximity and conditions.
                    </>
                  ) : waterLevel.isElevationBased ? (
                    <>
                      <strong>Elevation-Based Estimation:</strong> Water level calculated using topographic elevation data and
                      seasonal patterns. This is a computational estimate and may not reflect actual current conditions.
                    </>
                  ) : waterLevel.isDatasetBased ? (
                    <>
                      <strong>Historical Dataset Analysis:</strong> Water level calculated using historical flood data patterns.
                      This is a statistical estimate based on past observations and may not reflect actual current conditions.
                    </>
                  ) : (
                    <>
                      <strong>Computational Estimation:</strong> Water level calculated using meteorological and geographical
                      modeling algorithms. This is a fallback estimation method and may not reflect actual current conditions.
                    </>
                  )}
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                marginBottom: '15px',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: getRiskColor(waterLevel.riskLevel)
              }}>
                {waterLevel.riskLevel || 'Unknown'} Risk
              </div>

              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {waterLevel.status || 'Status unavailable'}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{
                  width: '200px',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (waterLevel.level / 5000) * 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${getRiskColor(waterLevel.riskLevel)}, ${getRiskColor(waterLevel.riskLevel)}aa)`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center'
              }}>
                Confidence: {Math.round(waterLevel.confidence * 100)}%
              </div>
            </div>
          )}

          <div className="data-grid">
            <div className="data-item">
              <div className="data-value">{distanceKm}</div>
              <div className="data-label">Distance (km)</div>
            </div>
            <div className="data-item">
              <div className="data-value">{waterbody.type || 'Unknown'}</div>
              <div className="data-label">Water Type</div>
            </div>
            {waterLevel && (
              <>
                <div className="data-item">
                  <div className="data-value" style={{ color: getRiskColor(waterLevel.riskLevel) }}>
                    {(waterLevel.level / 1000).toFixed(2)}m
                  </div>
                  <div className="data-label">Water Level</div>
                </div>
                <div className="data-item">
                  <div className="data-value" style={{ color: getRiskColor(waterLevel.riskLevel) }}>
                    {waterLevel.riskLevel}
                  </div>
                  <div className="data-label">Risk Level</div>
                </div>
              </>
            )}
          </div>
        </>
      );
    } else {
      return (
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
            <i className="fas fa-times-circle"></i>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '10px' }}>
            No significant waterbody found
          </div>
          <div>Within 100 km radius</div>
        </div>
      );
    }
  };

  const renderWeatherContent = (forecasts) => {
    const avgTemp = forecasts.reduce((sum, f) => sum + f.averageTemperature, 0) / forecasts.length;
    const avgHumidity = forecasts.reduce((sum, f) => sum + f.averageHumidity, 0) / forecasts.length;
    const daysWithRain = forecasts.filter(f => f.hasRain).length;

    return (
      <>
        <div className="data-grid">
          <div className="data-item">
            <div className="data-value">{avgTemp.toFixed(1)}°C</div>
            <div className="data-label">Average Temperature</div>
          </div>
          <div className="data-item">
            <div className="data-value">{Math.round(avgHumidity)}%</div>
            <div className="data-label">Average Humidity</div>
          </div>
          <div className="data-item">
            <div className="data-value">{daysWithRain}</div>
            <div className="data-label">Days with Rain</div>
          </div>
        </div>
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>7-Day Forecast</h3>
          <div className="data-grid">
            {forecasts.slice(0, 7).map((forecast, index) => {
              const date = new Date(forecast.date);
              return (
                <div key={index} className="data-item">
                  <div className="data-value">{forecast.averageTemperature.toFixed(1)}°C</div>
                  <div className="data-label">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '5px' }}>
                    {forecast.mostCommonDescription}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const renderTerrainContent = (terrainData) => {
    const { elevation, slope, slopeCategory, aspect } = terrainData;

    return (
      <>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--primary)' }}>
            <i className="fas fa-mountain"></i>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '10px', color: 'var(--light)' }}>
            {Math.round(elevation)}m
          </div>
          <div style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Elevation Above Sea Level
          </div>
        </div>

        <div className="data-grid">
          <div className="data-item">
            <div className="data-value">{slope ? slope.toFixed(1) : 0}°</div>
            <div className="data-label">Slope Angle</div>
          </div>
          <div className="data-item">
            <div className="data-value" style={{ textTransform: 'capitalize' }}>{slopeCategory || 'Flat'}</div>
            <div className="data-label">Terrain Type</div>
          </div>
          <div className="data-item">
            <div className="data-value">{aspect ? aspect.toFixed(0) : '--'}°</div>
            <div className="data-label">Aspect (Facing)</div>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Topographic Insight</h4>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.8)' }}>
            {slope > 15 ?
              "Steep terrain detected. High runoff potential during heavy rainfall, increasing flash flood risk downhill." :
              "Relatively flat terrain. Water may pool in this area during flooding events."}
          </p>
        </div>
      </>
    );
  };

  const renderAIContent = (aiData) => {
    if (!aiData) return <div>No AI Analysis available</div>;

    const { verdict, riskScore, message, details } = aiData;

    const getVerdictColor = (v) => {
      if (v === 'CRITICAL') return '#ff4444';
      if (v === 'WARNING') return '#ff8800';
      if (v === 'CAUTION') return '#ffcc00';
      return '#00cc44';
    };

    const color = getVerdictColor(verdict);

    return (
      <div className="ai-analysis-content" style={{ padding: '10px' }}>
        {/* Main Verdict Header */}
        <div style={{
          textAlign: 'center',
          padding: '30px',
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          borderRadius: '16px',
          border: `1px solid ${color}44`,
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
            FLOOD SAFETY VERDICT
          </div>
          <div style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            color: color,
            textShadow: `0 0 20px ${color}66`,
            marginBottom: '15px'
          }}>
            {verdict}
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--light)', maxWidth: '80%', margin: '0 auto' }}>
            {message}
          </div>
        </div>

        {/* Risk Gauge */}
        <div style={{ marginBottom: '40px', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>Safe</span>
            <span>Critical</span>
          </div>
          <div style={{
            height: '12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${riskScore}%`,
              height: '100%',
              background: `linear-gradient(90deg, #00cc44, #ffcc00, #ff4444)`,
              borderRadius: '6px',
              transition: 'width 1s ease-out'
            }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: '8px', color: color, fontWeight: 'bold' }}>
            Flood Risk Score: {riskScore}/100
          </div>
        </div>

        {/* Nearest Waterbody Indicator */}
        {details?.waterbodyName && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 20px',
            background: 'rgba(0, 102, 255, 0.15)',
            borderLeft: '4px solid #0066ff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{ fontSize: '1.5rem', color: '#0066ff' }}>
              <i className="fas fa-water"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Nearest Detected Waterbody</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{details.waterbodyName}</div>
            </div>
          </div>
        )}

        {/* AI-Powered Visit Outlook */}
        {details?.visitOutlook && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--light)', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <i className="fas fa-calendar-alt" style={{ marginRight: '10px', color: '#00cc44' }}></i>
              Visitation Safety Outlook
            </h3>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '20px',
              borderLeft: `5px solid ${details.visitOutlook.color || '#00cc44'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: details.visitOutlook.color || '#white',
                textTransform: 'uppercase'
              }}>
                {details.visitOutlook.verdict}
              </div>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                {details.visitOutlook.message}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Metrics Grid */}
        <h3 style={{ color: 'var(--primary)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <i className="fas fa-microchip" style={{ marginRight: '10px' }}></i>
          Analysis Factors
        </h3>

        <div className="data-grid" style={{ marginBottom: '30px' }}>
          <div className="data-item">
            <div className="data-value">{details?.features?.distance ? (details.features.distance / 1000).toFixed(1) : '--'} km</div>
            <div className="data-label">Distance to Water</div>
          </div>
          <div className="data-item">
            <div className="data-value">{details?.features?.waterLevel ? (details.features.waterLevel / 1000).toFixed(2) : '--'} m</div>
            <div className="data-label">Est. Water Level</div>
          </div>
          <div className="data-item">
            <div className="data-value">{details?.features?.rainfall?.toFixed(1) || '--'} mm</div>
            <div className="data-label">Recent Rainfall</div>
          </div>
          <div className="data-item">
            <div className="data-value">{details?.features?.slope?.toFixed(1) || '--'}°</div>
            <div className="data-label">Terrain Slope</div>
          </div>
        </div>

        {/* Professional Impact Assessment */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '20px',
          borderRadius: '12px',
          borderLeft: `4px solid ${color}`
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--light)' }}>Impact Assessment</h4>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {verdict === 'Critical' || verdict === 'CRITICAL' ? (
              <>
                <p style={{ marginBottom: '10px' }}><strong>Immediate Action Required:</strong> Water levels are at critical thresholds. Evacuation protocols may be effective.</p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Extreme flood risk detected based on current hydrological data.</li>
                  <li>Water levels ({details?.features?.waterLevel ? (details.features.waterLevel / 1000).toFixed(2) : '--'}m) exceed safety limits.</li>
                </ul>
              </>
            ) : verdict === 'Warning' || verdict === 'WARNING' ? (
              <>
                <p style={{ marginBottom: '10px' }}><strong>High Alert:</strong> Significant flood risk indicated.</p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>River overflow potential is high due to rainfall/water level combination.</li>
                  <li>Avoid all low-lying areas near the waterbody.</li>
                </ul>
              </>
            ) : verdict === 'Caution' || verdict === 'CAUTION' ? (
              <>
                <p style={{ marginBottom: '10px' }}><strong>Situational Awareness:</strong> Conditions are stable but warrant attention.</p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Water levels are elevated but not currently flooding.</li>
                  <li>Exercise caution near river banks.</li>
                </ul>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '10px' }}><strong>Normal Conditions:</strong> No flood anomalies detected.</p>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Environmental indicators (Rainfall, Slope, Water Level) are within safe ranges.</li>
                  <li>Area remains accessible for standard activities.</li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Professional Disclaimer */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          <p style={{ marginBottom: '5px' }}><strong>DISCLAIMER: ESTUARIAL MODEL ESTIMATION</strong></p>
          <p>
            AI-Generated Safety Estimation. While this analysis utilizes advanced topographical and meteorological modeling to predict flood risks, it remains a probabilistic estimation.
            Real-time conditions may vary. This tool should be used for informational purposes only and not as a sole substitute for official government advisories or professional on-site assessment.
          </p>
        </div>
      </div>
    );
  };

  const createRainfallChart = (dailyData) => {
    const maxRainfall = Math.max(...dailyData.map(d => d.rainfall));
    const chartHeight = 200;

    return (
      <>
        <div style={{
          display: 'flex',
          alignItems: 'end',
          height: `${chartHeight}px`,
          gap: '8px',
          padding: '20px 0',
          width: '100%'
        }}>
          {dailyData.map((day, index) => {
            const height = maxRainfall > 0 ? (day.rainfall / maxRainfall) * chartHeight : 0;
            // Use blue colors for all bars
            const color = day.rainfall > 10 ? '#0066cc' : day.rainfall > 5 ? '#0099ff' : '#66b3ff';

            return (
              <div key={index} style={{
                flex: 1,
                display: 'flex',
                cursor: 'pointer',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '100%',
                  height: `${height}px`,
                  background: `linear-gradient(to top, ${color}, ${color}dd)`,
                  borderRadius: '6px 6px 0 0',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 8px ${color}40`,
                  border: `1px solid ${color}60`,
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = `0 0 12px ${color}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = `0 0 8px ${color}40`;
                  }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Rainfall amounts below bars */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '12px',
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.9)',
          padding: '0 10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600'
        }}>
          {dailyData.map((day, index) => (
            <div key={index} style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.85rem'
            }}>
              {day.rainfall.toFixed(1)}
            </div>
          ))}
        </div>

        {/* Date labels at the bottom */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          padding: '0 10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500'
        }}>
          {dailyData.map((day, index) => {
            const date = new Date(day.date);
            return (
              <span key={index} style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.8rem'
              }}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{getModalTitle()}</div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          {renderModalContent()}
        </div>
      </div>
    </div>
  );
};

export default Modal;
