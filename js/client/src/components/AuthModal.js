import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthModal = ({ onClose, feature }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const switchToSignup = () => {
    setAuthMode('signup');
  };

  const switchToLogin = () => {
    setAuthMode('login');
  };

  return (
    <>
      {authMode === 'login' ? (
        <Login 
          onSwitchToSignup={switchToSignup}
          onClose={onClose}
        />
      ) : (
        <Signup 
          onSwitchToLogin={switchToLogin}
          onClose={onClose}
          feature={feature}
        />
      )}
    </>
  );
};

export default AuthModal;
