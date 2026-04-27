import React from 'react';
import { useUser } from '../contexts/UserContext';
import UserProfile from './UserProfile';
import './Navigation.css';

const Navigation = ({ onHomeClick, onRiskAssessmentClick, onCommunityClick, onLoginClick }) => {
  const { isLoggedIn } = useUser();

  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <a href="#" className="nav-brand" onClick={onHomeClick}>
          <i className="fas fa-satellite"></i>
          SENTINEL
        </a>
        <div className="nav-buttons">
          <button className="nav-button" onClick={onHomeClick}>
            <i className="fas fa-home"></i>
            Home
          </button>
          {isLoggedIn ? (
            <UserProfile />
          ) : (
            <button className="nav-button login-btn" onClick={onLoginClick}>
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
