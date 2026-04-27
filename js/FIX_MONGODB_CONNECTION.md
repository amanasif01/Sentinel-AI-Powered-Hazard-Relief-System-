# Fix MongoDB Connection Issue

## Current Problem

The server is failing to connect to MongoDB Atlas with this error:
```
Failed to connect to MongoDB Atlas: Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.9zkpi.mongodb.net
```

## What I Fixed

1. **Server now starts even if database fails** - The server will start on port 3000 even if MongoDB connection fails
2. **Better error messages** - Clear messages about what's wrong
3. **Health check endpoint** - Check server status at http://localhost:3000/api/health
4. **Removed deprecated warnings** - Cleaned up MongoDB connection options

## How to Fix MongoDB Connection

### Step 1: Check Your Internet Connection
Make sure you have internet access. MongoDB Atlas requires an active internet connection.

### Step 2: Verify MongoDB Atlas Cluster Status

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in with your account
3. Check if your cluster is **running** (not paused)
   - If paused, click "Resume" to start it
   - Wait 2-5 minutes for it to fully start

### Step 3: Check IP Whitelist

1. In MongoDB Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Either:
   - Add your current IP address
   - Or for development: Add `0.0.0.0/0` (allows all IPs - **only for development!**)
4. Wait 1-2 minutes for changes to take effect

### Step 4: Verify Connection String

Check `js/config.js` - your connection string should look like:
```javascript
MONGODB_URI: 'mongodb+srv://username:password@cluster0.9zkpi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
```

**Important:**
- Replace `username` with your MongoDB Atlas username
- Replace `password` with your MongoDB Atlas password
- Make sure there are no spaces or special characters that need encoding

### Step 5: Test Connection

1. Restart the server: `npm run dev` or run `dev_react.bat`
2. Check the console - you should see:
   ```
   ✅ Connected to MongoDB Atlas database: Sentinel
   ```
3. Test the health endpoint: http://localhost:3000/api/health
   - Should show `"database": "connected"`

### Step 6: Common Issues

#### Issue: "querySrv ENOTFOUND"
**Cause**: DNS resolution failure
**Solutions**:
- Check internet connection
- Try using a different DNS server (8.8.8.8 or 1.1.1.1)
- Check if MongoDB cluster exists and is running
- Verify connection string is correct

#### Issue: "Authentication failed"
**Cause**: Wrong username/password
**Solutions**:
- Reset password in MongoDB Atlas
- Update connection string in `js/config.js`
- Make sure password doesn't contain special characters that need URL encoding

#### Issue: "IP not whitelisted"
**Cause**: Your IP address is not in the whitelist
**Solutions**:
- Add your current IP to MongoDB Atlas Network Access
- Or temporarily use `0.0.0.0/0` for development (NOT for production!)

## Testing After Fix

1. **Start the server**: Run `dev_react.bat`
2. **Check console output**: Should see `✅ Connected to MongoDB Atlas`
3. **Test health endpoint**: http://localhost:3000/api/health
4. **Try login**: Should work now!

## Current Status

After my changes:
- ✅ Server starts even if database fails
- ✅ Clear error messages
- ✅ Health check endpoint available
- ⚠️  Authentication won't work until MongoDB is connected

The server will now start and show you exactly what's wrong with the database connection, making it easier to fix!

