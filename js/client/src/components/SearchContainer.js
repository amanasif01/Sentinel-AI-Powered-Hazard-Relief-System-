import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SearchContainer.css';

// Function to prioritize and filter search results
const prioritizeSearchResults = (results, query) => {
  if (!results || results.length === 0) return [];

  const queryLower = query.toLowerCase().trim();

  // Known major cities in Pakistan with their correct coordinates
  const majorCities = {
    'islamabad': { lat: 33.6844, lon: 73.0479, priority: 1000 },
    'karachi': { lat: 24.8607, lon: 67.0011, priority: 1000 },
    'lahore': { lat: 31.5204, lon: 74.3587, priority: 1000 },
    'faisalabad': { lat: 31.4504, lon: 73.1350, priority: 1000 },
    'rawalpindi': { lat: 33.5651, lon: 73.0169, priority: 1000 },
    'multan': { lat: 30.1575, lon: 71.5249, priority: 1000 },
    'peshawar': { lat: 34.0151, lon: 71.5249, priority: 1000 },
    'quetta': { lat: 30.1798, lon: 66.9750, priority: 1000 },
    'sialkot': { lat: 32.4945, lon: 74.5229, priority: 1000 },
    'gujranwala': { lat: 32.1617, lon: 74.1883, priority: 1000 }
  };

  // Score and rank results
  const scoredResults = results.map(result => {
    let score = 0;
    const displayName = (result.displayName || '').toLowerCase();
    const country = (result.country || '').toLowerCase();
    const state = (result.state || '').toLowerCase();
    const lat = result.latitude;
    const lon = result.longitude;
    const fullText = `${displayName} ${state} ${country}`;

    // Check if this is a known major city
    if (majorCities[queryLower]) {
      const cityData = majorCities[queryLower];
      const distance = Math.sqrt(
        Math.pow(lat - cityData.lat, 2) + Math.pow(lon - cityData.lon, 2)
      );
      if (distance < 0.1) { // Within ~11km of known coordinates
        score += cityData.priority;
      }
    }

    // Exact match with city name
    const cityName = displayName.split(',')[0].trim();
    if (cityName === queryLower) {
      score += 500;
    }

    // Pakistan results get high priority
    if (country === 'pakistan') {
      score += 300;
    } else {
      score -= 200; // Penalize non-Pakistan results
    }

    // Capital city bonus (Islamabad)
    if (cityName === 'islamabad' && country === 'pakistan') {
      score += 200;
    }

    // Exact "City, Pakistan" format gets bonus
    if (displayName.includes(queryLower) && displayName.includes('pakistan')) {
      score += 150;
    }

    // State/Province matches
    if (state && state.includes(queryLower)) {
      score += 100;
    }

    // Special handling for mountain / northern tourist locations like Fairy Meadows
    if (queryLower.includes('fairy meadows') || queryLower.includes('nanga parbat')) {
      const isNorthernPakistan =
        fullText.includes('gilgit') ||
        fullText.includes('gilgit-baltistan') ||
        fullText.includes('gilgit baltistan') ||
        fullText.includes('nanga parbat');

      const isBigCityPlain =
        fullText.includes('lahore') ||
        fullText.includes('karachi') ||
        fullText.includes('rawalpindi') ||
        fullText.includes('multan') ||
        fullText.includes('faisalabad') ||
        fullText.includes('gujranwala');

      if (isNorthernPakistan) {
        // Strongly boost northern Pakistan matches for these queries
        score += 600;
      }
      if (isBigCityPlain && !isNorthernPakistan) {
        // Strongly penalize unrelated big plains cities for mountain queries
        score -= 400;
      }
    }

    // Penalize results far from expected coordinates for major cities
    if (majorCities[queryLower]) {
      const cityData = majorCities[queryLower];
      const distance = Math.sqrt(
        Math.pow(lat - cityData.lat, 2) + Math.pow(lon - cityData.lon, 2)
      );
      if (distance > 0.5) { // More than ~55km away
        score -= 300;
      }
    }

    return { ...result, _score: score };
  });

  // Sort by score (highest first)
  scoredResults.sort((a, b) => b._score - a._score);

  // For major cities, if we have a high-scoring Pakistan result, limit to top 3-5
  if (majorCities[queryLower] && scoredResults.length > 0 && scoredResults[0]._score > 500) {
    // Return top results, prioritizing Pakistan
    const topResults = scoredResults.slice(0, 5);
    return topResults;
  }

  // For other queries, return top 10
  return scoredResults.slice(0, 10);
};

const SearchContainer = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false); // New state for waiting indicator
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [instantSuggestions, setInstantSuggestions] = useState([]);
  const searchTimeout = useRef(null);
  const searchInputRef = useRef(null);
  const searchCache = useRef(new Map());

  // No hardcoded places - rely entirely on API for accurate results

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Generate instant suggestions based on input (minimal local suggestions)
  // No instant suggestions - rely entirely on API for precise results
  const generateInstantSuggestions = useCallback((query) => {
    return []; // No hardcoded suggestions - API will provide all results
  }, []);

  const handleSearchInput = (e) => {
    const query = e.target.value; // Don't trim immediately to allow spaces
    setSearchQuery(query);
    setSelectedIndex(-1);

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 1) {
      setShowResults(false);
      setSearchResults([]);
      setInstantSuggestions([]);
      return;
    }

    // Do NOT show results immediately while typing (manual search only)
    // setShowResults(true);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Only search when user stops typing - wait for pause in typing
    /* Auto-search disabled to save API calls
    if (trimmedQuery.length >= 1) {
      setIsWaiting(true); // Show waiting indicator
      setIsLoading(false); // Not loading yet, just waiting
      
      // Wait for user to stop typing before searching
      searchTimeout.current = setTimeout(() => {
        setIsWaiting(false); // Hide waiting indicator
        setIsLoading(true); // Start loading
        searchLocations(trimmedQuery);
      }, 800); // Increased to 800ms to wait for user to stop typing
    }
    */
  };

  const searchLocations = async (query) => {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.current.has(cacheKey)) {
      const cached = searchCache.current.get(cacheKey);
      const isFresh = Date.now() - cached.timestamp < 300000; // 5 minute cache
      const hasUsableResults = Array.isArray(cached.results) && cached.results.length > 0;
      if (isFresh && hasUsableResults) {
        setSearchResults(cached.results);
        setIsLoading(false);
        return;
      }
      // If the cache only contains empty results, force a refresh instead of
      // repeatedly showing "No locations found".
      if (!hasUsableResults) {
        searchCache.current.delete(cacheKey);
      }
    }

    try {
      // Use AbortController for faster cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for enhanced search

      // Enhanced search query with comprehensive parameters
      const searchParams = new URLSearchParams({
        q: query
      });

      const response = await fetch(`/api/search?${searchParams.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        // Filter and prioritize results
        const prioritizedResults = prioritizeSearchResults(data.results, query);

        // Cache the prioritized results
        searchCache.current.set(cacheKey, {
          results: prioritizedResults,
          timestamp: Date.now()
        });

        // Limit cache size
        if (searchCache.current.size > 100) {
          const entries = Array.from(searchCache.current.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          searchCache.current = new Map(entries.slice(0, 50));
        }

        // For major cities, if there's a clear winner, show only top 1-3 results
        if (prioritizedResults.length > 0 && prioritizedResults[0]._score > 800) {
          const topResult = prioritizedResults[0];
          const cityName = (topResult.displayName || '').split(',')[0].trim().toLowerCase();
          const country = (topResult.country || '').toLowerCase();

          // If it's a major city match in Pakistan, show only top results
          if (cityName === queryLower && country === 'pakistan') {
            // Show only top 1-3 results for major cities
            setSearchResults(prioritizedResults.slice(0, 10));
            return;
          }
        }

        setSearchResults(prioritizedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
      } else {
        console.error('Search error:', error);
      }
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setIsWaiting(false); // Clear waiting state when search completes
    }
  };

  const [pendingLocation, setPendingLocation] = useState(null);

  const handleLocationSelect = (result) => {
    // Stage the location for confirmation
    const location = {
      name: result.displayName,
      lat: result.latitude,
      lon: result.longitude
    };
    setPendingLocation(location);
    setSearchQuery(result.displayName);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const confirmLocation = () => {
    if (pendingLocation) {
      onLocationSelect(pendingLocation);
      setPendingLocation(null);
    }
  };

  const cancelSelection = () => {
    setPendingLocation(null);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    const totalResults = instantSuggestions.length + searchResults.length;

    switch (e.key) {
      case 'ArrowDown':
        if (!showResults) return;
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < totalResults - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        if (!showResults) return;
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : totalResults - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (showResults && selectedIndex >= 0 && selectedIndex < totalResults) {
          const allResults = [...instantSuggestions, ...searchResults];
          handleLocationSelect(allResults[selectedIndex]);
        } else if (pendingLocation) {
          confirmLocation();
        } else if (searchQuery.trim().length >= 1) {
          // Trigger search immediately on Enter for any non-empty query
          const trimmedQuery = searchQuery.trim();
          setIsWaiting(false); // Clear waiting state
          setIsLoading(true);
          setShowResults(true);
          // Clear any pending timeout and search immediately
          if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
          }
          searchLocations(trimmedQuery);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        if (pendingLocation) cancelSelection();
        break;
    }
  };

  // ... (highlightText logic omitted as it's outside the target range details, keeping it same) ...
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    // ... logic ...
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <span key={index} className="highlighted-text">{part}</span> : part
    );
  };

  // Process results to prioritize searched name when there's a good match
  const processResults = (results) => results;

  const allResults = [...instantSuggestions, ...processResults(searchResults)];

  // Bug fix: Removed the block that overwrote result.displayName with searchQuery.
  // This prevents misleading labels (e.g. typing "New York" but getting "Gilgit" data with label "New York").

  return (
    <div className="search-container-new">
      <div className="search-input-wrapper-new" ref={searchInputRef}>
        <div className="search-input-container-new">
          <input
            type="text"
            className="search-input-new"
            placeholder="Enter location name (e.g., Karachi, Lahore)..."
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Don't show results on focus unless we have previous results
              if (searchQuery.trim().length >= 1 && searchResults.length > 0) {
                setShowResults(true);
              }
            }}
          />
          <i
            className="fas fa-search search-icon-new"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (searchQuery.trim().length >= 1) {
                setShowResults(true);
                setIsLoading(true);
                searchLocations(searchQuery.trim());
              }
            }}
          ></i>
        </div>

        {/* Map Preview and Confirmation Area */}
        {pendingLocation && (
          <div className="location-confirmation-panel" style={{
            marginTop: '15px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${pendingLocation.lon - 0.05},${pendingLocation.lat - 0.05},${pendingLocation.lon + 0.05},${pendingLocation.lat + 0.05}&layer=mapnik&marker=${pendingLocation.lat},${pendingLocation.lon}`}
                style={{ border: 0 }}
              ></iframe>
            </div>
            <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Verify Location:</div>
                <div style={{ fontWeight: 'bold' }}>{pendingLocation.name}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={cancelSelection}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLocation}
                  style={{
                    padding: '8px 16px',
                    background: '#0066ff',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Confirm <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {showResults && !pendingLocation && (
          <div className="search-results-new">
            {isWaiting ? (
              // This state is effectively unused now but kept for logic consistency
              <div className="search-result-item-new">
                <i className="fas fa-clock"></i> Waiting for search...
              </div>
            ) : isLoading && searchResults.length === 0 ? (
              <div className="search-result-item-new">
                <i className="fas fa-spinner fa-spin"></i> Searching...
              </div>
            ) : allResults.length === 0 ? (
              <div className="search-result-item-new">No locations found</div>
            ) : (
              allResults.map((result, index) => {
                const isPakistan = result.country && result.country.toLowerCase() === 'pakistan';
                const countryBadge = isPakistan ?
                  <span className="result-country-new pakistan">Pakistan</span> :
                  <span className="result-country-new">{result.country || 'Unknown'}</span>;

                const isSelected = index === selectedIndex;
                const isInstant = result.isInstant;

                return (
                  <div
                    key={index}
                    className={`search-result-item-new ${isSelected ? 'selected' : ''} ${isInstant ? 'instant' : ''}`}
                    onClick={() => handleLocationSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="result-name-new">
                      {highlightText(result.displayName, searchQuery)}
                      {countryBadge}
                      {isInstant && <span className="instant-badge-new">Quick</span>}
                    </div>
                    <div className="result-details-new">
                      {result.latitude.toFixed(6)}°N, {result.longitude.toFixed(6)}°E
                      {result.state && result.state !== result.country && (
                        <span style={{ marginLeft: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          • {result.state}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchContainer;
