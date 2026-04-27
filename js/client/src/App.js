import React, { useState, useEffect } from 'react';
import './App.css';
import { UserProvider, useUser } from './contexts/UserContext';
import Navigation from './components/Navigation';
import HomeScreenWithProfileCards from './components/HomeScreenWithProfileCards';
import RiskAssessmentScreen from './components/RiskAssessmentScreen';
import Community from './components/Community';
import Modal from './components/Modal';
import AuthModal from './components/AuthModal';
import FloatingParticles from './components/FloatingParticles';
import Footer from './components/Footer';
import EmergencyContacts from './components/EmergencyContacts';
import NearbyHospitals from './components/NearbyHospitals';
import DisasterKitRecommender from './components/DisasterKitRecommender';

// Inner component that has access to UserContext
function AppContent() {
  const { navigateToHome, setNavigateToHome, user } = useUser();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentModal, setCurrentModal] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFeature, setAuthFeature] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [disasterKitLocation, setDisasterKitLocation] = useState(null);

  // Handle logout navigation
  useEffect(() => {
    if (navigateToHome) {
      setCurrentScreen('home');
      setNavigateToHome(false); // Reset the navigation trigger

      // Close any open modals when logging out
      setCurrentModal(null);
      setShowAuthModal(false);
    }
  }, [navigateToHome, setNavigateToHome]);

  const showHome = () => {
    setCurrentScreen('home');
    // Don't clear location when going home - keep it for continuity
  };

  const showRiskAssessment = () => {
    setCurrentScreen('riskAssessment');
  };

  const showCommunity = () => {
    setCurrentScreen('community');
  };

  const showEmergencyContacts = () => {
    setCurrentScreen('emergency');
  };

  const openModal = (type) => {
    setCurrentModal(type);
  };

  const closeModal = () => {
    setCurrentModal(null);
  };

  const openAuthModal = (feature = null) => {
    setAuthFeature(feature);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthFeature(null);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const showNearbyHospitals = () => {
    setCurrentScreen('hospitals');
  };

  const showDisasterKit = () => {
    setCurrentScreen('disasterKit');
  };

  return (
    <div className="App">
      <FloatingParticles />

      <Navigation
        onHomeClick={showHome}
        onRiskAssessmentClick={showRiskAssessment}
        onLoginClick={openAuthModal}
      />

      <div className="container">
        <div className="main-content">
          {currentScreen === 'home' && (
            <HomeScreenWithProfileCards
              onRiskAssessmentClick={showRiskAssessment}
              onCommunityClick={showCommunity}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              onAuthModalOpen={openAuthModal}
              onEmergencyClick={showEmergencyContacts}
              onNearbyHospitalsClick={showNearbyHospitals}
              onDisasterKitClick={showDisasterKit}
            />
          )}

          {currentScreen === 'riskAssessment' && (
            <RiskAssessmentScreen
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              onModalOpen={openModal}
              onAuthModalOpen={openAuthModal}
            />
          )}

          {currentScreen === 'community' && (
            <Community />
          )}

          {currentScreen === 'emergency' && (
            <EmergencyContacts
              userEmail={user?.email}
              username={user?.username}
              onClose={showHome}
              isPage={true}
            />
          )}

          {currentScreen === 'hospitals' && (
            <NearbyHospitals
              onBack={showHome}
              isPage={true}
            />
          )}

          {currentScreen === 'disasterKit' && (
            <DisasterKitRecommender
              selectedLocation={disasterKitLocation}
              onLocationSelect={setDisasterKitLocation}
              onBack={showHome}
            />
          )}
        </div>
      </div>

      {currentModal && (
        <Modal
          type={currentModal}
          location={selectedLocation}
          onClose={closeModal}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={closeAuthModal} feature={authFeature} />
      )}

      <Footer />
    </div>
  );
}

// Main App component that provides UserContext
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
