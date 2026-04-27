import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigateToHome, setNavigateToHome] = useState(false);

  // Fetch user data from database
  const fetchUserData = async (id) => {
    if (!id) return null;
    
    try {
      const response = await fetch(`/api/auth/user/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data.user;
      } else {
        console.error('Failed to fetch user data:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check if user ID is stored in localStorage
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
      // Fetch user data from database
      fetchUserData(savedUserId).then(userData => {
        if (userData) {
          setUser(userData);
          console.log('Restored user from database:', userData.username);
        } else {
          // User not found in database, clear localStorage
          localStorage.removeItem('userId');
          setUserId(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (userData) => {
    // Store only the user ID
    setUserId(userData._id);
    setUser(userData);
    localStorage.setItem('userId', userData._id);
    console.log('User logged in:', userData.username);
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setUserId(null);
    localStorage.removeItem('userId');
    setNavigateToHome(true);
  };

  const updateUser = async () => {
    // Refresh user data from database
    if (userId) {
      const userData = await fetchUserData(userId);
      if (userData) {
        setUser(userData);
      }
    }
  };

  const value = {
    user,
    userId,
    isLoggedIn: !!userId,
    login,
    logout,
    updateUser,
    isLoading,
    navigateToHome,
    setNavigateToHome
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
