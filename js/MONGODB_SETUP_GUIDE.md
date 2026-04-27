# MongoDB Authentication Setup Guide

## Overview
Your Sentinel application now has full MongoDB authentication with user management and emergency contacts. Here's how to run it:

## Running the Application

### Option 1: Using the Bat File (Recommended)
Simply run your existing `dev_react.bat` file. This will:
- Start the backend server on port 3000 (with MongoDB)
- Start the React frontend on port 3001
- Both will run simultaneously

### Option 2: Manual Setup
If you prefer to run manually:

1. **Start the Backend Server:**
   ```bash
   cd js
   npm install
   node server.js
   ```

2. **Start the Frontend (in a new terminal):**
   ```bash
   cd js/client
   npm install
   npm start
   ```

## Features Added

### 🔐 User Authentication
- **Registration**: Users can create accounts with email and password
- **Login**: Secure login with password validation
- **Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### 👤 User Profile Management
- **Profile Dropdown**: Shows user email when logged in
- **Emergency Contacts**: Add/remove emergency contact emails
- **Professional UI**: Clean, modern interface

### 🛡️ Protected Features
- **SOS**: Requires login to access emergency features
- **Hazard Community**: Requires login to access community features
- **Login Prompts**: Professional prompts when accessing protected features

### 🗄️ Database Structure
- **Database Name**: `Sentinel`
- **Collection**: `user_accounts`
- **User Schema**:
  ```javascript
  {
    email: String (unique),
    username: String (unique),
    password: String (hashed),
    emergencyContacts: [
      {
        email: String,
        name: String,
        addedAt: Date
      }
    ],
    profile: {
      displayName: String,
      avatar: String,
      preferences: Object
    },
    createdAt: Date,
    updatedAt: Date
  }
  ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:email` - Get user profile

### Emergency Contacts
- `POST /api/auth/emergency-contact` - Add emergency contact
- `DELETE /api/auth/emergency-contact` - Remove emergency contact

## Testing the Setup

1. **Start the application** using `dev_react.bat`
2. **Open your browser** to `http://localhost:3001`
3. **Try to access SOS or Hazard Community** - you should see a login prompt
4. **Create an account** and test the features
5. **Check the user profile dropdown** for emergency contacts management

## Troubleshooting

### "Network error" when signing up/login
- Make sure the backend server is running on port 3000
- Check that MongoDB connection is working
- Verify the server console shows "Sentinel server running on http://localhost:3000"

### Database connection issues
- Check your MongoDB Atlas connection string in `js/config.js`
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify the database name is set to "Sentinel"

## Security Features

- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Email uniqueness validation
- ✅ Professional error messages
- ✅ Input validation and sanitization
- ✅ CORS enabled for development

## Next Steps

The authentication system is now fully functional! Users can:
- Register and login securely
- Manage emergency contacts
- Access protected features after authentication
- See their profile information in the navigation

The system is ready for production use with proper environment variables for the MongoDB connection string.
