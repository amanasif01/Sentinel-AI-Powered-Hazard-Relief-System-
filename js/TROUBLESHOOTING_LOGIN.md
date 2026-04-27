# Troubleshooting Login "Network Error"

## Problem
You're getting "Network error. Please check your connection and try again." when trying to login.

## Root Cause
The backend server (port 3000) is not running or not accessible. The React app (port 3001) needs the backend server to handle login requests.

## Solution

### Step 1: Start the Backend Server

You need to start the backend server on port 3000. You have two options:

#### Option A: Run Both Frontend and Backend Together (Recommended)
```bash
cd js
npm run dev
```
This will start:
- Backend server on http://localhost:3000
- React frontend on http://localhost:3001

#### Option B: Run Backend Separately
In one terminal:
```bash
cd js
npm run server
```

In another terminal (for the React app):
```bash
cd js
npm run client
```

### Step 2: Verify Server is Running

1. **Check the console output** - You should see:
   ```
   ✅ Sentinel server running on http://localhost:3000
   ✅ Connected to MongoDB Atlas database: Sentinel
   ```

2. **Test the health endpoint** - Open in browser:
   ```
   http://localhost:3000/api/health
   ```
   You should see: `{"success":true,"message":"Server is running",...}`

3. **Test database connection** - Open in browser:
   ```
   http://localhost:3000/api/test-db
   ```
   You should see database connection status.

### Step 3: Check Database Connection

If the server fails to start, check:

1. **MongoDB Atlas Connection String** - Check `js/config.js`:
   ```javascript
   MONGODB_URI: 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/...'
   ```

2. **IP Whitelist** - In MongoDB Atlas:
   - Go to Network Access
   - Add your current IP address (or use 0.0.0.0/0 for development)
   - Wait a few minutes for changes to propagate

3. **Database Credentials** - Verify username and password are correct

4. **Internet Connection** - MongoDB Atlas requires internet access

### Step 4: Check Proxy Configuration

The React app uses a proxy to forward `/api/*` requests to the backend. This is configured in:
- `js/client/src/setupProxy.js` - Only proxies `/api` requests to port 3000

If you see proxy errors, make sure:
- The backend server is running on port 3000
- No firewall is blocking the connection
- Port 3000 is not being used by another application

## Common Issues

### Issue 1: "Cannot connect to server"
**Solution**: Backend server is not running. Start it with `npm run server` or `npm run dev`

### Issue 2: "Server is still initializing"
**Solution**: Wait a few seconds and try again. The server needs time to connect to MongoDB.

### Issue 3: "Database connection failed"
**Solution**: 
- Check MongoDB Atlas connection string
- Verify IP is whitelisted
- Check internet connection
- Verify credentials

### Issue 4: Port 3000 already in use
**Solution**: 
- Find what's using port 3000: `netstat -ano | findstr :3000` (Windows)
- Kill the process or change the port in `js/config.js`

## Quick Test

1. Start backend: `cd js && npm run server`
2. Wait for: `✅ Sentinel server running on http://localhost:3000`
3. Test: Open http://localhost:3000/api/health in browser
4. Try login again in the React app

## Still Having Issues?

1. Check browser console (F12) for detailed error messages
2. Check backend server console for error messages
3. Verify both servers are running:
   - Backend: http://localhost:3000/api/health
   - Frontend: http://localhost:3001
4. Check network tab in browser DevTools to see the actual request/response

