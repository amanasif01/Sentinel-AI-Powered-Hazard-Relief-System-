import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchContainer from './SearchContainer';
import './NearbyHospitals.css';

const RADIUS_OPTIONS = [5, 10, 20, 30, 50];

const getDistanceMeters = (hospital) => {
  if (!hospital) return null;
  if (typeof hospital.distance === 'number' && !isNaN(hospital.distance)) {
    return hospital.distance;
  }
  if (typeof hospital.distance === 'string' && hospital.distance.trim() !== '') {
    const meters = parseFloat(hospital.distance);
    if (!isNaN(meters)) return meters;
  }
  if (typeof hospital.distanceKm === 'number' && !isNaN(hospital.distanceKm)) {
    return hospital.distanceKm * 1000;
  }
  if (typeof hospital.distanceKm === 'string' && hospital.distanceKm.trim() !== '') {
    const km = parseFloat(hospital.distanceKm);
    if (!isNaN(km)) return km * 1000;
  }
  return null;
};

const getDistanceKm = (hospital) => {
  const meters = getDistanceMeters(hospital);
  return meters !== null ? meters / 1000 : null;
};

const formatDistanceKm = (hospital) => {
  const km = getDistanceKm(hospital);
  if (km === null) return '—';
  return km < 10 ? km.toFixed(1) : km.toFixed(0);
};

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center updates
function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  return null;
}

const NearbyHospitals = ({ onClose, isPage = false }) => {
  const [locationMode, setLocationMode] = useState(null); // 'current' or 'manual'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchRadius, setSearchRadius] = useState(20); // Default 20km for better coverage
  const [showAllPins, setShowAllPins] = useState(true); // Default to showing all pins
  const mapRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Request current location
  const requestCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            name: 'Current Location'
          });
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 60000,        // 60s - give GPS time to acquire satellites
          maximumAge: 0          // Force fresh reading
        }
      );
    });
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    setError('');

    try {
      const location = await requestCurrentLocation();

      // Attempt to get a readable address for better accuracy confidence
      try {
        const addressResponse = await fetch(`/api/geocode/reverse?lat=${location.lat}&lon=${location.lon}`);
        const addressData = await addressResponse.json();

        if (addressData.success && addressData.address) {
          location.name = addressData.address;
          location.displayName = addressData.address;
        }
      } catch (e) {
        console.warn('Failed to reverse geocode current location:', e);
        // Fallback to "Current Location" is already set in requestCurrentLocation
      }

      setCurrentLocation(location);
      setLocationMode('current');
      setSearchRadius(20);
      await fetchHospitals(location.lat, location.lon, 20); // Use 20km for current location
    } catch (err) {
      setError(err.message || 'Failed to get your location. Please try manual entry.');
      setIsLoading(false);
    }
  };

  const fetchHospitals = useCallback(async (lat, lon, radiusKm = null) => {
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    setIsLoading(true);
    setError('');

    // Debounce the fetch slightly to avoid rapid calls
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const radiusToUse = typeof radiusKm === 'number' ? radiusKm : searchRadius;
        const radiusMeters = radiusToUse * 1000;
        const response = await fetch(`/api/hospitals?lat=${lat}&lon=${lon}&radius=${radiusMeters}`);
        const data = await response.json();

        if (data.success) {
          const filteredHospitals = (data.hospitals || [])
            .filter((hospital) => {
              const meters = getDistanceMeters(hospital);
              if (meters === null) return true; // If no distance provided, include by default
              return meters <= radiusMeters + 50; // 50m tolerance to avoid off-by rounding
            })
            .map((hospital) => {
              const meters = getDistanceMeters(hospital);
              const kmValue = meters !== null ? parseFloat((meters / 1000).toFixed(2)) : hospital.distanceKm;
              return {
                ...hospital,
                distance: meters ?? hospital.distance ?? null,
                distanceKm: kmValue ?? hospital.distanceKm
              };
            })
            .sort((a, b) => {
              const distA = getDistanceMeters(a);
              const distB = getDistanceMeters(b);
              return (distA ?? Infinity) - (distB ?? Infinity);
            });

          setHospitals(filteredHospitals);
          // Select the first hospital by default if available
          if (filteredHospitals.length > 0) {
            setSelectedHospitalId(filteredHospitals[0].id);
          }

          if (filteredHospitals.length === 0) {
            setError('No hospitals found within the selected radius. Try increasing the distance.');
          } else {
            setError('');
          }
        } else {
          setError(data.error || 'Failed to find hospitals');
        }
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    }, 100); // 100ms debounce
  }, [searchRadius]);

  const handleManualLocation = useCallback((location) => {
    // Normalize location object to ensure consistent structure
    let lat = location.lat || location.latitude;
    let lon = location.lon || location.longitude;

    // Validate coordinates are numbers
    lat = parseFloat(lat);
    lon = parseFloat(lon);

    // Check if coordinates might be swapped (common issue)
    // Pakistan is roughly: lat 24-37°N, lon 61-75°E
    // If lat > 75 or lon < 24, they might be swapped
    if ((lat > 75 || lat < 24) && (lon >= 24 && lon <= 37)) {
      console.warn('Coordinates appear to be swapped, correcting...');
      [lat, lon] = [lon, lat];
    }

    // Validate coordinates are within Pakistan bounds
    if (isNaN(lat) || isNaN(lon)) {
      setError('Invalid location selected - missing coordinates');
      console.error('Invalid location object:', location);
      return;
    }

    if (lat < 24 || lat > 37 || lon < 61 || lon > 75) {
      console.warn('Coordinates outside Pakistan bounds:', lat, lon);
      console.warn('Original location object:', location);
      // Still allow it, but warn
    }

    const normalizedLocation = {
      name: location.name || location.displayName || 'Selected Location',
      displayName: location.displayName || location.name || 'Selected Location',
      lat: lat,
      lon: lon,
      latitude: lat,
      longitude: lon
    };

    console.log('Selected location:', normalizedLocation);
    console.log('Coordinates (lat, lon):', lat, lon);
    console.log('Expected Islamabad: 33.6844, 73.0479');

    setSelectedLocation(normalizedLocation);
    setLocationMode('manual');
    setSearchRadius(30);
    // Use larger radius (30km) for manual searches to get more results
    fetchHospitals(lat, lon, 30);
  }, [fetchHospitals]);

  const handleRadiusChange = (newRadius) => {
    if (newRadius === searchRadius) {
      return;
    }
    setSearchRadius(newRadius);
    const location = currentLocation || selectedLocation;
    if (location) {
      const lat = location.lat || location.latitude;
      const lon = location.lon || location.longitude;
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        fetchHospitals(lat, lon, newRadius);
      }
    }
  };



  const handleHospitalClick = (hospital) => {
    setSelectedHospitalId(hospital.id);
    // Optionally center map on clicked hospital
    if (mapRef.current) {
      mapRef.current.setView([hospital.latitude, hospital.longitude], 14);
    }
  };

  const getMapCenter = () => {
    // If a hospital is selected, center on it? 
    // Or keep user location as center? 
    // Let's keep user location as center unless explicitly moved, 
    // but the `MapCenter` component updates view when center prop changes.
    // If we want to center on selected hospital, we can return its coords here.

    // For now, let's stick to the search center (user location) 
    // so the context of "nearby" is maintained.

    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lon];
    }
    if (selectedLocation) {
      const lat = selectedLocation.lat || selectedLocation.latitude;
      const lon = selectedLocation.lon || selectedLocation.longitude;
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        return [lat, lon];
      }
    }
    return [33.6844, 73.0479]; // Default to Islamabad, Pakistan
  };

  const getMapZoom = () => {
    const radius = searchRadius;
    if (radius <= 5) return 13;
    if (radius <= 10) return 12;
    if (radius <= 20) return 11;
    if (radius <= 30) return 10;
    return 9;
  };

  const withinFiveKmCount = hospitals.filter((hospital) => {
    const meters = getDistanceMeters(hospital);
    return meters !== null && meters <= 5000;
  }).length;

  const closestHospital = hospitals[0];
  const rawClosestDistance = closestHospital ? formatDistanceKm(closestHospital) : null;
  const closestHospitalDistance =
    rawClosestDistance && rawClosestDistance !== '—' ? `${rawClosestDistance} km` : '—';
  const closestHospitalLabel = closestHospital?.name || 'Closest Hospital';

  const mapKey = `${currentLocation?.lat ?? selectedLocation?.lat ?? 'default'}-${currentLocation?.lon ?? selectedLocation?.lon ?? 'default'}`;

  // Location choice modal
  if (!locationMode) {
    return (
      <div className={`nearby-hospitals ${isPage ? 'nearby-hospitals-page' : 'nearby-hospitals-modal'}`}>
        <div className="location-choice-modal" onClick={(e) => e.stopPropagation()}>
          <div className="location-choice-header">
            <button className="close-button" onClick={onClose}>&times;</button>
            <h2><i className="fas fa-hospital"></i> Find Nearby Hospitals</h2>
            <p>Choose how you'd like to find hospitals</p>
          </div>

          <div className="location-choice-options">
            <button
              className="location-choice-btn current-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
            >
              <div className="choice-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="choice-content">
                <h3>Use Current Location</h3>
                <p>Automatically detect your location and show nearby hospitals on a map</p>
              </div>
              {isLoading && <i className="fas fa-spinner fa-spin"></i>}
            </button>

            <div className="choice-divider">
              <span>OR</span>
            </div>

            <div className="location-choice-btn manual-location-btn">
              <div className="choice-icon">
                <i className="fas fa-search-location"></i>
              </div>
              <div className="choice-content">
                <h3>Enter Location Manually</h3>
                <p>Search for a specific location and find hospitals in that area</p>
              </div>
              <div className="manual-search-container" onClick={(e) => e.stopPropagation()}>
                <SearchContainer onLocationSelect={handleManualLocation} />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filter hospitals for map display
  const hospitalsToDisplay = showAllPins
    ? hospitals
    : hospitals.filter(h => h.id === selectedHospitalId);

  // Main hospitals view
  return (
    <div className={`nearby-hospitals ${isPage ? 'nearby-hospitals-page' : 'nearby-hospitals-modal'}`}>
      <div className="nearby-hospitals-container" onClick={(e) => e.stopPropagation()}>
        {/* Professional Header */}
        <div className="nearby-hospitals-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-hospital"></i>
            </div>
            <div className="header-text">
              <h1>Nearby Hospitals</h1>
              <div className="location-info">
                <i className="fas fa-map-marker-alt"></i>
                <span className="location-name">
                  {/* Show specific name if available (even for current location), otherwise fallback */}
                  {currentLocation?.name || currentLocation?.displayName || selectedLocation?.displayName || selectedLocation?.name || 'Selected Location'}
                </span>
                {(currentLocation || selectedLocation) && (() => {
                  const location = currentLocation || selectedLocation;
                  const lat = location.lat || location.latitude;
                  const lon = location.lon || location.longitude;
                  if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                    return (
                      <span className="coordinates">
                        {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="radius-selector">
              <label>
                <i className="fas fa-circle-notch"></i> Search Radius:
              </label>
              <div className="radius-pills">
                {RADIUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={`radius-pill ${searchRadius === option ? 'active' : ''}`}
                    onClick={() => handleRadiusChange(option)}
                    disabled={isLoading && searchRadius === option}
                  >
                    {option} km
                  </button>
                ))}
              </div>
            </div>

            {locationMode === 'manual' && (
              <button
                className="current-location-btn-small"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                title="Use Current Location"
              >
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crosshairs"></i>}
                Use Current Location
              </button>
            )}

            <button
              className={`pins-toggle-btn ${showAllPins ? 'active' : ''}`}
              onClick={() => setShowAllPins(!showAllPins)}
            >
              <i className={`fas ${showAllPins ? 'fa-map-marked-alt' : 'fa-map-pin'}`}></i>
              {showAllPins ? 'Show All Locations' : 'Show Selected Only'}
            </button>

            <button className="change-location-btn" onClick={() => {
              setLocationMode(null);
              setCurrentLocation(null);
              setSelectedLocation(null);
              setHospitals([]);
              setSelectedHospitalId(null);
            }}>
              <i className="fas fa-exchange-alt"></i> Change Location
            </button>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="nearby-hospitals-content">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
              <p>Searching for hospitals...</p>
              <p className="loading-subtitle">This may take a few seconds</p>
            </div>
          )}

          {/* Error Banner */}
          {error && !isLoading && (
            <div className="error-banner">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Bar */}
          {!isLoading && hospitals.length > 0 && (
            <div className="stats-bar">
              <div className="stat-item">
                <i className="fas fa-hospital"></i>
                <span className="stat-value">{hospitals.length}</span>
                <span className="stat-label">Hospitals Found</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-ruler"></i>
                <span className="stat-value">{searchRadius} km</span>
                <span className="stat-label">Search Radius</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-map-marker-alt"></i>
                <span className="stat-value">
                  {withinFiveKmCount}
                </span>
                <span className="stat-label">Within 5km</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-route"></i>
                <span className="stat-value">{closestHospitalDistance}</span>
                <span className="stat-label">{closestHospitalLabel}</span>
              </div>
            </div>
          )}

          {/* Map and List Layout */}
          <div className="hospitals-layout">
            {/* Map Section - Full Width on Top */}
            <div className="map-section">
              <MapContainer
                center={getMapCenter()}
                zoom={getMapZoom()}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                ref={mapRef}
                key={`map-${mapKey}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=rO1P1yhWiD9MUQ4t8Lrk"
                  maxZoom={20}
                />
                <MapCenter center={getMapCenter()} zoom={getMapZoom()} />

                {/* User location marker */}
                {(currentLocation || selectedLocation) && (() => {
                  const location = currentLocation || selectedLocation;
                  const lat = location.lat || location.latitude;
                  const lon = location.lon || location.longitude;

                  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
                    return null;
                  }

                  return (
                    <Marker
                      position={[lat, lon]}
                      icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                      })}
                    >
                      <Popup>
                        <strong>{location.name || location.displayName || 'Your Location'}</strong><br />
                        {lat.toFixed(6)}°N, {lon.toFixed(6)}°E
                      </Popup>
                    </Marker>
                  );
                })()}

                {/* Hospital markers */}
                {hospitalsToDisplay.map((hospital) => {
                  const distanceValue = formatDistanceKm(hospital);
                  const distanceDisplay = distanceValue === '—' ? '' : `${distanceValue} km`;
                  const isSelected = hospital.id === selectedHospitalId;

                  return (
                    <Marker
                      key={hospital.id}
                      position={[hospital.latitude, hospital.longitude]}
                      zIndexOffset={isSelected ? 1000 : 0}
                      icon={new L.Icon({
                        iconUrl: isSelected
                          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png'
                          : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                      eventHandlers={{
                        click: () => handleHospitalClick(hospital),
                      }}
                    >
                      <Popup>
                        <div className="hospital-popup">
                          <strong>{hospital.name}</strong>
                          {distanceDisplay && <div className="popup-distance">{distanceDisplay}</div>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Hospitals List Section */}
            <div className="hospitals-list-section">
              <div className="hospitals-list-header">
                <h3>
                  <i className="fas fa-list"></i>
                  Hospitals ({hospitals.length})
                </h3>
                <div className="list-controls">
                  <button
                    className="filter-btn"
                    onClick={() => {
                      const sorted = [...hospitals].sort((a, b) => {
                        const distA = getDistanceMeters(a);
                        const distB = getDistanceMeters(b);
                        return (distA ?? Infinity) - (distB ?? Infinity);
                      });
                      setHospitals(sorted);
                    }}
                  >
                    <i className="fas fa-sort-amount-down"></i> Sort by Distance
                  </button>
                </div>
              </div>

              <div className="hospitals-list">
                {hospitals.length === 0 && !isLoading && !error && (
                  <div className="no-hospitals">
                    <i className="fas fa-hospital"></i>
                    <p>No hospitals found in the selected radius</p>
                    <p className="hint">Try increasing the search radius</p>
                  </div>
                )}

                {hospitals.map((hospital) => {
                  const distanceValue = formatDistanceKm(hospital);
                  const distanceDisplay = distanceValue === '—' ? '—' : `${distanceValue} km`;
                  const typeLabel = hospital.type || 'Medical Facility';
                  const isSelected = hospital.id === selectedHospitalId;

                  return (
                    <div
                      key={hospital.id}
                      className={`hospital-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleHospitalClick(hospital)}
                    >
                      <div className="hospital-card-header">
                        <div className="hospital-icon">
                          <i className="fas fa-hospital"></i>
                        </div>
                        <div className="hospital-info">
                          <div className="hospital-title-row">
                            <h4>{hospital.name}</h4>
                            <span className="hospital-distance-chip">{distanceDisplay}</span>
                          </div>
                          <div className="hospital-meta-row">
                            <span className="hospital-type-chip">
                              <i className="fas fa-stethoscope"></i> {typeLabel}
                            </span>
                          </div>
                        </div>
                        {hospital.emergency && (
                          <div className="emergency-badge-small">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>Emergency</span>
                          </div>
                        )}
                      </div>

                      <div className="hospital-details">
                        {hospital.address && (
                          <div className="detail-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{hospital.address}</span>
                          </div>
                        )}
                        {hospital.phone && (
                          <div className="detail-item">
                            <i className="fas fa-phone"></i>
                            <a href={`tel:${hospital.phone}`} onClick={(e) => e.stopPropagation()}>{hospital.phone}</a>
                          </div>
                        )}
                        {hospital.website && (
                          <div className="detail-item">
                            <i className="fas fa-globe"></i>
                            <a href={hospital.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Visit Website</a>
                          </div>
                        )}
                        {hospital.wheelchair && (
                          <div className="detail-item">
                            <i className="fas fa-wheelchair"></i>
                            <span>Wheelchair Accessible</span>
                          </div>
                        )}
                      </div>

                      <div className="hospital-actions">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="directions-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fas fa-directions"></i> Get Directions
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyHospitals;
