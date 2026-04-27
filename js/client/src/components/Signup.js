import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import './Signup.css';

const Signup = ({ onSwitchToLogin, onClose, feature }) => {
  const { login } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    emergencyContactEmail: '',
    emergencyContactName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
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

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Emergency contact validation (only for SOS feature)
    if (feature === 'SOS') {
      if (!formData.emergencyContactEmail.trim()) {
        newErrors.emergencyContactEmail = 'Emergency contact email is required for SOS';
      } else if (!emailRegex.test(formData.emergencyContactEmail)) {
        newErrors.emergencyContactEmail = 'Please enter a valid emergency contact email';
      } else if (formData.emergencyContactEmail.toLowerCase() === formData.email.toLowerCase()) {
        newErrors.emergencyContactEmail = 'Emergency contact email cannot be the same as your email';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();
      console.log('🔍 SIGNUP: Server response:', data);

      if (data.success) {
        let userData = {
          _id: data.userId,
          email: data.email,
          username: data.username,
          createdAt: new Date(),
          emergencyContacts: []
        };

        // If this is SOS signup, add the emergency contact
        if (feature === 'SOS' && formData.emergencyContactEmail) {
          try {
            const contactResponse = await fetch('/api/auth/emergency-contact', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: formData.email,
                contactEmail: formData.emergencyContactEmail,
                contactName: formData.emergencyContactName
              }),
            });

            const contactData = await contactResponse.json();
            if (contactData.success) {
              userData.emergencyContacts = contactData.user.emergencyContacts;
            }
          } catch (contactError) {
            console.error('Error adding emergency contact:', contactError);
            // Continue with registration even if emergency contact fails
          }
        }
        
        console.log('🔍 SIGNUP: User data being stored:', userData);
        console.log('🔍 SIGNUP: Username value:', userData.username);
        
        // Use the login function from UserContext
        login(userData);
        console.log('Registration successful:', userData);
        onClose();
        
        // Show success notification
        if (feature === 'SOS') {
          showNotification('SOS Account created successfully! Emergency contact added.');
        } else {
          showNotification('Account created successfully! Welcome to Sentinel.');
        }
      } else {
        setServerError(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join SENTINEL today</p>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {serverError && (
            <div className="error-message" style={{ 
              color: '#e74c3c', 
              backgroundColor: '#fdf2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              {serverError}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-container">
              <i className="fas fa-user input-icon"></i>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                className={`auth-input ${errors.username ? 'error' : ''}`}
              />
            </div>
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <i className="fas fa-envelope input-icon"></i>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className={`auth-input ${errors.email ? 'error' : ''}`}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <i className="fas fa-lock input-icon"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                className={`auth-input ${errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-container">
              <i className="fas fa-lock input-icon"></i>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Emergency Contact Fields - Only show for SOS feature */}
          {feature === 'SOS' && (
            <>
              <div className="emergency-section">
                <h3><i className="fas fa-phone-alt"></i> Emergency Contact</h3>
                <p className="section-description">
                  Add a trusted contact who will be notified in case of emergency
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="emergencyContactEmail">Emergency Contact Email *</label>
                <div className="input-container">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="emergencyContactEmail"
                    name="emergencyContactEmail"
                    value={formData.emergencyContactEmail}
                    onChange={handleInputChange}
                    placeholder="Enter emergency contact's email"
                    required
                    className={`auth-input ${errors.emergencyContactEmail ? 'error' : ''}`}
                  />
                </div>
                {errors.emergencyContactEmail && <span className="error-message">{errors.emergencyContactEmail}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContactName">Emergency Contact Name (Optional)</label>
                <div className="input-container">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Enter emergency contact's name"
                    className="auth-input"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-options">
            <label className="terms-agreement">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
            </label>
          </div>

          <button 
            type="submit" 
            className={`auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Create Account
              </>
            )}
          </button>

          <div className="auth-switch">
            <p>Already have an account? 
              <button 
                type="button" 
                className="switch-link"
                onClick={onSwitchToLogin}
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
