# How to Get a New MongoDB Atlas Connection String

## The Problem

Your MongoDB connection is failing with `ENOTFOUND` error, which means:
- The cluster hostname cannot be resolved
- The cluster might be paused, deleted, or the connection string is wrong

## Solution: Get a Fresh Connection String

### Step 1: Log into MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Log in with your MongoDB Atlas account
3. Make sure you're in the correct organization/project

### Step 2: Check Your Cluster Status

1. Look at your cluster list
2. Check if your cluster `cluster0` exists
3. **If cluster is PAUSED:**
   - Click on the cluster
   - Click "Resume" button
   - Wait 2-5 minutes for it to fully start
   - The status should change to "Running"

4. **If cluster doesn't exist:**
   - You need to create a new cluster
   - Or the cluster was deleted
   - Check if you're in the right project

### Step 3: Get Connection String

1. Click on your cluster (should be named something like "Cluster0")
2. Click the **"Connect"** button (green button)
3. Choose **"Connect your application"**
4. Select:
   - **Driver:** Node.js
   - **Version:** 5.5 or later (or latest)
5. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 4: Update Your Connection String

1. Open `js/config.js`
2. Replace the `MONGODB_URI` line with your new connection string:

```javascript
MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
```

**Important:**
- Replace `YOUR_USERNAME` with your MongoDB Atlas username
- Replace `YOUR_PASSWORD` with your MongoDB Atlas password
- If your password has special characters, you may need to URL encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - `%` becomes `%25`
  - `&` becomes `%26`
  - `+` becomes `%2B`
  - `=` becomes `%3D`

### Step 5: Check IP Whitelist

1. In MongoDB Atlas, go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Either:
   - Add your current IP address
   - Or for development: Add `0.0.0.0/0` (allows all IPs - **only for development!**)
4. Wait 1-2 minutes for changes to take effect

### Step 6: Test the Connection

Run the test script:
```bash
cd js
node test_mongodb_connection.js
```

You should see:
```
✅ Successfully connected to MongoDB Atlas!
✅ Database: Sentinel
✅ Connection test successful!
```

### Step 7: Restart Your Server

After updating the connection string:
1. Stop the current server (Ctrl+C)
2. Run `dev_react.bat` again
3. Check the console - you should see:
   ```
   ✅ Connected to MongoDB Atlas database: Sentinel
   ```

## Common Issues

### Issue: "Cluster not found"
**Solution:** 
- Check if you're logged into the correct MongoDB Atlas account
- Verify the cluster name in the connection string matches your actual cluster
- The cluster might have been deleted - create a new one

### Issue: "Cluster is paused"
**Solution:**
- Click "Resume" on the cluster
- Wait 2-5 minutes for it to start
- Free tier clusters auto-pause after 1 hour of inactivity

### Issue: "Authentication failed"
**Solution:**
- Reset your database user password in MongoDB Atlas
- Update the connection string with the new password
- Make sure username is correct

### Issue: "IP not whitelisted"
**Solution:**
- Go to Network Access in MongoDB Atlas
- Add your IP address or use `0.0.0.0/0` for development
- Wait 1-2 minutes for changes to take effect

## Quick Checklist

- [ ] Logged into MongoDB Atlas
- [ ] Cluster exists and is running (not paused)
- [ ] Got new connection string from "Connect" → "Connect your application"
- [ ] Updated `js/config.js` with new connection string
- [ ] IP address is whitelisted in Network Access
- [ ] Tested connection with `node test_mongodb_connection.js`
- [ ] Restarted server with `dev_react.bat`

## Still Having Issues?

1. **Check your internet connection** - MongoDB Atlas requires internet
2. **Try a different DNS server** - Sometimes DNS issues can cause this
3. **Check firewall settings** - Make sure port 27017 isn't blocked
4. **Verify MongoDB Atlas account** - Make sure you're using the correct account
5. **Check MongoDB Atlas status page** - https://status.mongodb.com/

