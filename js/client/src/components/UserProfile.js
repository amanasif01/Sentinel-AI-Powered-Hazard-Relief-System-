import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import EmergencyContacts from './EmergencyContacts';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? You will be redirected to the home page.')) {
      logout();
      setIsDropdownOpen(false);
      // Show logout notification
      showNotification('Successfully logged out. Redirecting to home...', 'info');
    }
  };

  const showNotification = (message, type = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleEmergencyContacts = () => {
    setShowEmergencyContacts(true);
    setIsDropdownOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="user-profile" ref={dropdownRef}>
        <button className="user-profile-button" onClick={toggleDropdown}>
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <span className="user-username">{user.username}</span>
          <i className={`fas fa-chevron-down dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}></i>
        </button>

        {isDropdownOpen && (
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="user-info">
                <div className="user-avatar-large">
                  <i className="fas fa-user"></i>
                </div>
                <div className="user-details">
                  <div className="user-username-large">{user.username}</div>
                  <div className="user-joined">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="dropdown-menu">

              <button className="dropdown-item">
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </button>

              <button className="dropdown-item">
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
              </button>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showEmergencyContacts && (
        <EmergencyContacts 
          userEmail={user.email}
          username={user.username}
          onClose={() => setShowEmergencyContacts(false)} 
        />
      )}
    </>
  );
};

export default UserProfile;
