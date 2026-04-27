import React from 'react';
import { useUser } from '../contexts/UserContext';
import './LoginPrompt.css';

const LoginPrompt = ({ onLogin, onSignup, feature, onClose }) => {
  const { isLoggedIn } = useUser();

  if (isLoggedIn) {
    return null; // Don't show prompt if user is already logged in
  }

  return (
    <div className="login-prompt-overlay">
      <div className="login-prompt-container">
        {/* Background Elements */}
        <div className="prompt-bg-elements">
          <div className="prompt-bg-circle prompt-bg-circle-1"></div>
          <div className="prompt-bg-circle prompt-bg-circle-2"></div>
          <div className="prompt-bg-circle prompt-bg-circle-3"></div>
          <div className="prompt-bg-grid"></div>
        </div>

        {/* Close Button */}
        <button className="prompt-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {/* Header */}
        <div className="login-prompt-header">
          <div className="prompt-logo">
            <div className="prompt-logo-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Authentication Required</h3>
            <p>Please sign in to access <span className="feature-name">{feature}</span></p>
          </div>
        </div>

        {/* Content */}
        <div className="login-prompt-content">
          <div className="feature-benefits">
            <h4>Why sign in?</h4>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="benefit-text">
                  <h5>Secure Access</h5>
                  <p>Protected emergency features</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="benefit-text">
                  <h5>Emergency Contacts</h5>
                  <p>Manage your safety network</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <i className="fas fa-history"></i>
                </div>
                <div className="benefit-text">
                  <h5>Personal History</h5>
                  <p>Save preferences & data</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">
                  <i className="fas fa-bell"></i>
                </div>
                <div className="benefit-text">
                  <h5>Smart Alerts</h5>
                  <p>Receive important notifications</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-prompt-actions">
            <button 
              className="prompt-login-btn"
              onClick={onLogin}
            >
              <div className="btn-content">
                <i className="fas fa-sign-in-alt"></i>
                <span>Sign In</span>
              </div>
              <div className="btn-glow"></div>
            </button>
            
            <button 
              className="prompt-signup-btn"
              onClick={onSignup}
            >
              <div className="btn-content">
                <i className="fas fa-user-plus"></i>
                <span>Create Account</span>
              </div>
              <div className="btn-glow"></div>
            </button>
          </div>

          <div className="login-prompt-footer">
            <p>Don't have an account? 
              <button onClick={onSignup} className="prompt-link-btn">
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;
