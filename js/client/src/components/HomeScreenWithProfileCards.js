import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import ProfileCard from './ProfileCard';
import SearchContainer from './SearchContainer';
import LoginPrompt from './LoginPrompt';
import EmergencyContacts from './EmergencyContacts';
import NearbyHospitals from './NearbyHospitals';
import FloatingParticles from './FloatingParticles';
import './HomeScreenWithProfileCards.css';

const HomeScreenWithProfileCards = ({ onRiskAssessmentClick, selectedLocation, onLocationSelect, onAuthModalOpen, onCommunityClick, onEmergencyClick, onNearbyHospitalsClick, onDisasterKitClick }) => {
  const { isLoggedIn, user } = useUser();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptFeature, setPromptFeature] = useState('');
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);


  const carouselRef = useRef(null);

  // Preload images on component mount
  useEffect(() => {
    const imageUrls = [
      '/riskassessment.jpg',
      '/MEDIBOT.jpg',
      '/hazard community.jpg',
      '/SOS.jpg',
      '/nearby hospitals.jpg',
      '/survival kits.jpeg'
    ];

    // Preload all images
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        console.log(`Preloaded image: ${url}`);
      };
      img.onerror = () => {
        console.error(`Failed to preload image: ${url}`);
      };
    });
  }, []);

  // All cards data
  const cards = [
    {
      name: "RISK ASSESSMENT",
      title: "Flood Risk Analysis & Weather Intelligence",
      handle: "sentinel-risk",
      status: "Active",
      contactText: "Launch Analysis",
      avatarUrl: "/riskassessment.jpg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(200,100%,90%,var(--card-opacity)) 4%,hsla(200,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(200,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(200,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#0066ffc4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#0066ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#0066ffff 0%,#0066ffff 40%,#0066ffff 60%,#0066ffff 100%)",
      innerGradient: "linear-gradient(145deg,#0066ff22 0%,#0066ff11 100%)",
      onClick: onRiskAssessmentClick
    },
    {
      name: "MEDIBOT",
      title: "AI First Aid Guidance & Medical Support",
      handle: "ai-medical",
      status: "Online",
      contactText: "Get Help",
      avatarUrl: "/MEDIBOT.jpg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(120,100%,90%,var(--card-opacity)) 4%,hsla(120,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(120,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(120,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ff66c4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00ff66ff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#00ff66ff 0%,#00ff66ff 40%,#00ff66ff 60%,#00ff66ff 100%)",
      innerGradient: "linear-gradient(145deg,#00ff6622 0%,#00ff6611 100%)"
    },
    {
      name: "HAZARD COMMUNITY",
      title: "Community Forum & Hazard Reports",
      handle: "community-forum",
      status: "Active",
      contactText: "Join Discussion",
      avatarUrl: "/hazard community.jpg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(40,100%,90%,var(--card-opacity)) 4%,hsla(40,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(40,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(40,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#ffaa00c4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#ffaa00ff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#ffaa00ff 0%,#ffaa00ff 40%,#ffaa00ff 60%,#ffaa00ff 100%)",
      innerGradient: "linear-gradient(145deg,#ffaa0022 0%,#ffaa0011 100%)"
    },
    {
      name: "SOS",
      title: "Emergency Alert & Rescue Coordination",
      handle: "emergency-sos",
      status: "Standby",
      contactText: "Send Alert",
      avatarUrl: "/SOS.jpg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(0,100%,90%,var(--card-opacity)) 4%,hsla(0,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(0,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(0,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#ff0000c4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#ff0000ff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#ff0000ff 0%,#ff0000ff 40%,#ff0000ff 60%,#ff0000ff 100%)",
      innerGradient: "linear-gradient(145deg,#ff000022 0%,#ff000011 100%)",
      onClick: () => setShowEmergencyContacts(true)
    },
    {
      name: "NEARBY HOSPITALS",
      title: "Medical Facilities & Emergency Services",
      handle: "medical-locations",
      status: "Updated",
      contactText: "Find Hospitals",
      avatarUrl: "/nearby hospitals.jpg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(280,100%,90%,var(--card-opacity)) 4%,hsla(280,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(280,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(280,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#aa00ffc4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#aa00ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#aa00ffff 0%,#aa00ffff 40%,#aa00ffff 60%,#aa00ffff 100%)",
      innerGradient: "linear-gradient(145deg,#aa00ff22 0%,#aa00ff11 100%)",
      onClick: onNearbyHospitalsClick
    },
    {
      name: "SURVIVAL KITS",
      title: "Emergency Supplies & Preparedness",
      handle: "survival-gear",
      status: "Available",
      contactText: "View Kits",
      avatarUrl: "/survival kits.jpeg",
      gradient: "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(180,100%,90%,var(--card-opacity)) 4%,hsla(180,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(180,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(180,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffffc4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00ffffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#00ffffff 0%,#00ffffff 60%,#00ffffff 60%,#00ffffff 100%)",
      innerGradient: "linear-gradient(145deg,#00ffff22 0%,#00ffff11 100%)"
    }
  ];

  const cardsPerSlide = 3;
  const totalSlides = Math.ceil(cards.length / cardsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Pause auto-scroll on hover
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let interval;

    if (!isHovering) {
      interval = setInterval(() => {
        nextSlide();
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isHovering]);

  // Get cards for current slide
  const getCardsForSlide = (slideIndex) => {
    const startIndex = slideIndex * cardsPerSlide;
    return cards.slice(startIndex, startIndex + cardsPerSlide);
  };

  // Handle card click with authentication check
  const handleCardClick = (card) => {
    console.log('Card clicked:', card?.name);
    // Check if this is a protected feature that requires login
    const protectedFeatures = ['SOS', 'HAZARD COMMUNITY'];

    if (protectedFeatures.includes(card.name) && !isLoggedIn) {
      setPromptFeature(card.name);
      setShowLoginPrompt(true);
      return;
    }

    // Handle specific card actions
    if (card.name === 'HAZARD COMMUNITY' && isLoggedIn) {
      onCommunityClick();
      return;
    }

    if (card.name === 'SOS' && isLoggedIn) {
      onEmergencyClick?.();
      return;
    }

    if (card.name === 'NEARBY HOSPITALS') {
      if (onNearbyHospitalsClick) {
        onNearbyHospitalsClick();
      }
      return;
    }

    if (card.name === 'SURVIVAL KITS') {
      console.log('Survival Kits clicked! onDisasterKitClick:', onDisasterKitClick);
      if (onDisasterKitClick) {
        onDisasterKitClick();
      }
      return;
    }

    // If it has an onClick handler, call it
    if (card.onClick) {
      card.onClick();
    }
  };

  const handleLoginPrompt = () => {
    setShowLoginPrompt(false);
    onAuthModalOpen(promptFeature);
  };

  const handleSignupPrompt = () => {
    setShowLoginPrompt(false);
    onAuthModalOpen(promptFeature);
  };

  return (
    <div className="home-screen-with-profile-cards">
      {/* Floating Particles */}
      <FloatingParticles />

      <div className="header">
        <h1><i className="fas fa-satellite"></i> SENTINEL</h1>
        <p>Advanced Meteorological Analysis & Predictive Systems</p>


      </div>

      <div className="hero-description">
        Welcome to Sentinel, your comprehensive platform for advanced weather analysis,
        flood risk assessment, and predictive meteorological insights. Our cutting-edge
        technology combines real-time data with AI-powered analytics to provide accurate
        forecasts and risk evaluations.
      </div>

      {/* Location Search Section */}
      <div className="location-search-section">
        <div className="search-header">
          <h2><i className="fas fa-map-marker-alt"></i> Select Location for Analysis</h2>
          <p>Choose a location to access Sentinel's comprehensive services</p>
        </div>

        <div className="search-container-wrapper">
          <SearchContainer onLocationSelect={onLocationSelect} />

          {/* Professional Location Change Button - Only visible when location is selected */}
          {selectedLocation && (
            <div className="location-change-section">
              <button
                className="location-change-btn-new"
                onClick={() => onLocationSelect(null)}
                title="Change Location"
              >
                <i className="fas fa-exchange-alt"></i>
                <span>Change Location</span>
              </button>
            </div>
          )}
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="selected-location-display">
            <div className="location-info">
              <i className="fas fa-check-circle"></i>
              <span className="location-name">{selectedLocation.name}</span>
              <span className="location-coords">
                {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Cards - Always Show, Not Dependent on Location */}
      <div className="services-header">
        <h2><i className="fas fa-tools"></i> Available Services</h2>
        <p>All services are available immediately. {selectedLocation ? `Enhanced analysis available for ${selectedLocation.name}` : 'Select a location above for enhanced location-specific analysis.'}</p>
      </div>

      {/* Professional Carousel */}
      <div
        className="carousel-container"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <button className="carousel-btn prev-btn" onClick={prevSlide}>
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="carousel-wrapper" ref={carouselRef}>
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {[...Array(totalSlides)].map((_, slideIndex) => (
              <div key={slideIndex} className="carousel-slide">
                <div className="cards-row">
                  {getCardsForSlide(slideIndex).map((card, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="profile-card-wrapper"
                      onClick={() => handleCardClick(card)}
                    >
                      <ProfileCard
                        name={card.name}
                        title={card.title}
                        handle={card.handle}
                        status={card.status}
                        contactText={card.contactText}
                        avatarUrl={card.avatarUrl}
                        showUserInfo={false}
                        enableTilt={true}
                        enableMobileTilt={false}
                        behindGradient={card.gradient}
                        innerGradient={card.innerGradient}
                        onContactClick={card.name === 'NEARBY HOSPITALS' ? (() => {
                          if (onNearbyHospitalsClick) {
                            onNearbyHospitalsClick();
                          } else {
                            setShowNearbyHospitals(true);
                          }
                        }) : card.onClick}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="carousel-btn next-btn" onClick={nextSlide}>
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {[...Array(totalSlides)].map((_, index) => (
            <button
              key={index}
              className={`indicator ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* No Location Selected Message - Only Show if No Location and User Tries to Use Location-Dependent Features */}
      {!selectedLocation && (
        <div className="no-location-message">
          <div className="message-content">
            <i className="fas fa-map-marker-alt"></i>
            <h3>Location Recommended</h3>
            <p>Select a location above for enhanced analysis and location-specific services. Some features may work without location selection.</p>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPrompt
          feature={promptFeature}
          onLogin={handleLoginPrompt}
          onSignup={handleSignupPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}

      {/* EmergencyContacts overlay removed here; now navigates to full page */}
    </div>
  );
};

export default HomeScreenWithProfileCards;
