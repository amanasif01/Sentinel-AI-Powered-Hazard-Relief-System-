// Load environment variables from .env if present
try { require('dotenv').config(); } catch (_) { }
const express = require('express');
const path = require('path');
const cors = require('cors');
const GeocodingService = require('./src/GeocodingService');
const EnhancedGeocodingService = require('./src/EnhancedGeocodingService');
const NasaPowerApiClient = require('./src/NasaPowerApiClient');
const OsmWaterbodyService = require('./src/OsmWaterbodyService');
const WeatherForecastService = require('./src/WeatherForecastService');
const TerrainService = require('./src/TerrainService');
const DisasterKitService = require('./src/DisasterKitService');
const DateUtils = require('./src/DateUtils');
const DatabaseConnection = require('./src/DatabaseConnection');
const AuthService = require('./src/AuthService');
const config = require('./config');
const nodemailer = require('nodemailer');

// Helper to create and verify a mail transporter from environment variables
async function createVerifiedTransporter() {
    // Prefer explicit SMTP configuration
    if ((process.env.SMTP_HOST || config.SMTP_HOST) && (process.env.SMTP_USER || config.SMTP_USER) && (process.env.SMTP_PASS || config.SMTP_PASS)) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || config.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || config.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || config.SMTP_SECURE || 'false') === 'true',
            auth: {
                user: process.env.SMTP_USER || config.SMTP_USER,
                pass: process.env.SMTP_PASS || config.SMTP_PASS
            },
            pool: true,
            maxConnections: 3,
            connectionTimeout: 10000,
            socketTimeout: 20000
        });
        await transporter.verify();
        return transporter;
    }

    // Gmail configuration ONLY if explicitly provided via env
    if ((process.env.GMAIL_USER || config.GMAIL_USER) && (process.env.GMAIL_PASS || config.GMAIL_PASS)) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || config.GMAIL_USER,
                pass: process.env.GMAIL_PASS || config.GMAIL_PASS
            },
            pool: true,
            maxConnections: 3
        });
        await transporter.verify();
        return transporter;
    }

    // No valid SMTP configuration found
    return null;
}

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize services
const geocodingService = new GeocodingService();
const enhancedGeocodingService = new EnhancedGeocodingService();
const nasaApiClient = new NasaPowerApiClient();
const osmService = new OsmWaterbodyService();
const weatherService = new WeatherForecastService();
const terrainService = new TerrainService();
const disasterKitService = new DisasterKitService();
const HospitalService = require('./src/HospitalService');
const FloodPredictionService = require('./src/FloodPredictionService');
const LandslidePredictionService = require('./src/LandslidePredictionService');
const OpenMeteoService = require('./src/OpenMeteoService');
const dbConnection = new DatabaseConnection();
const hospitalService = new HospitalService();
const openMeteoService = new OpenMeteoService();
const floodPredictionService = new FloodPredictionService(openMeteoService);
const landslidePredictionService = new LandslidePredictionService(openMeteoService);
const MedibotService = require('./src/MedibotService');
const medibotService = new MedibotService(hospitalService);
let authService;



// Request deduplication for search endpoint
const activeSearchRequests = new Map();

// API Routes

// Health check endpoint (works even if database is not connected)
app.get('/api/health', (req, res) => {
    const dbStatus = dbConnection.db ? 'connected' : 'not connected';
    const authStatus = authService ? 'available' : 'unavailable';

    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        authentication: authStatus,
        warning: !dbConnection.db ? 'Database not connected - authentication features disabled' : null
    });
});

// Authentication Routes
// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        if (!authService) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected. Cannot register users. Please check MongoDB connection and restart the server.'
            });
        }

        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                error: 'Email, username, and password are required'
            });
        }

        const result = await authService.registerUser(email, password, username);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        if (!authService) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected. Cannot authenticate users. Please check MongoDB connection and restart the server.'
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const result = await authService.loginUser(email, password);

        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Reverse geocoding endpoint
app.get('/api/geocode/reverse', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const address = await enhancedGeocodingService.reverseGeocode(parseFloat(lat), parseFloat(lon));

        if (address) {
            res.json({
                success: true,
                address: address
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// SOS: send distress email to approved emergency contacts
app.post('/api/sos', async (req, res) => {
    try {
        const { email, latitude, longitude, accuracy } = req.body;
        if (!email || typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ success: false, error: 'email, latitude and longitude are required' });
        }

        // Load user and approved contacts
        const userProfile = await authService.getUserProfile(email);
        if (!userProfile.success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const profile = userProfile.profile;
        const approvedContacts = (profile.emergencyContacts || []).filter(c => (c?.status || 'pending') === 'approved' && c.email);
        if (approvedContacts.length === 0) {
            return res.status(400).json({ success: false, error: 'No approved emergency contacts found' });
        }

        // IMPROVEMENT: Reverse geocode to get human-readable address
        let locationAddress = 'Unknown address';
        try {
            const address = await enhancedGeocodingService.reverseGeocode(latitude, longitude);
            if (address) {
                locationAddress = address;
            }
        } catch (geoError) {
            console.error('SOS reverse geocode error:', geoError);
            // Continue sending SOS even if geocoding fails
        }

        // Prepare transporter using env configuration; avoid hardcoded creds
        let transporter;
        try {
            transporter = await createVerifiedTransporter();
        } catch (verifyError) {
            console.error('SOS mail transporter verify failed:', verifyError);
            return res.status(500).json({
                success: false,
                error: 'Email transporter verification failed',
                detail: verifyError?.message || String(verifyError)
            });
        }
        if (!transporter) {
            const missing = [
                (process.env.SMTP_HOST || config.SMTP_HOST) ? null : 'SMTP_HOST',
                (process.env.SMTP_USER || config.SMTP_USER) ? null : 'SMTP_USER',
                (process.env.SMTP_PASS || config.SMTP_PASS) ? null : 'SMTP_PASS'
            ].filter(Boolean);
            console.error('SOS error: No SMTP configuration provided. Missing:', missing.join(','));
            return res.status(500).json({
                success: false,
                error: 'Email is not configured on the server',
                detail: missing.length ? `Missing: ${missing.join(', ')}` : 'Set SMTP_* or GMAIL_* configuration'
            });
        }

        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const subject = `SOS Alert from ${profile.profile?.displayName || profile.username || profile.email}`;

        const text = `Emergency SOS alert
        
Sender: ${profile.profile?.displayName || profile.username || profile.email}
Email: ${profile.email}

Location:
Address: ${locationAddress}
Latitude: ${latitude}
Longitude: ${longitude}
Accuracy: ${typeof accuracy === 'number' ? `${Math.round(accuracy)}m` : 'unknown'}
Google Maps: ${mapsLink}

Time: ${new Date().toISOString()}

If you know this person, please reach out and notify local emergency services if necessary.`;

        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#222">
            <h2 style="margin:0 0 12px;color:#d32f2f">Emergency SOS alert</h2>
            <p><strong>Sender:</strong> ${profile.profile?.displayName || profile.username || profile.email}<br/>
               <strong>Email:</strong> ${profile.email}</p>
            <div style="background:#f9f9f9;border-left:4px solid #d32f2f;padding:10px 15px;margin:15px 0">
                <h3 style="margin:0 0 8px;color:#333">Current Location</h3>
                <p style="margin:0 0 5px;font-size:16px;font-weight:bold">${locationAddress}</p>
                <p style="margin:0;color:#666">
                   Lat: ${latitude}<br/>
                   Lon: ${longitude}<br/>
                   Accuracy: ${typeof accuracy === 'number' ? `${Math.round(accuracy)} meters` : 'unknown'}
                </p>
            </div>
            <p><a href="${mapsLink}" target="_blank" style="display:inline-block;background:#d32f2f;color:#fff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:bold">Open Google Maps</a></p>
            <p style="font-size:12px;color:#666">Time: ${new Date().toISOString()}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
            <p>If you know this person, please reach out and consider notifying local emergency services.</p>
          </div>`;

        const fromAddress = process.env.SMTP_USER || config.SMTP_USER || process.env.GMAIL_USER || config.GMAIL_USER;
        const results = await Promise.allSettled(
            approvedContacts.map(c => transporter.sendMail({
                from: fromAddress,
                to: c.email,
                subject,
                text,
                html,
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high',
                    'List-Unsubscribe': `<mailto:${fromAddress}?subject=UNSUBSCRIBE>`
                },
                replyTo: profile.email
            }))
        );

        const detail = results.map((r, idx) => ({
            to: approvedContacts[idx]?.email,
            status: r.status,
            error: r.status === 'rejected' ? (r.reason?.message || r.reason?.code || r.reason?.response || String(r.reason)) : undefined
        }));
        const sent = detail.filter(d => d.status === 'fulfilled').length;
        const failed = detail.length - sent;

        if (failed > 0) {
            console.error('SOS send details (some failures):', detail);
        }

        return res.json({
            success: true,
            message: `SOS sent to ${sent} contacts${failed ? `, ${failed} failed` : ''}. Location: ${locationAddress}`,
            sent,
            total: approvedContacts.length,
            detail,
            address: locationAddress
        });
    } catch (error) {
        console.error('SOS error:', error);
        return res.status(500).json({ success: false, error: 'Failed to send SOS', detail: error?.message || String(error) });
    }
});

// SOS mail configuration self-test (no email sent)
app.get('/api/sos/selftest', async (req, res) => {
    try {
        const present = {
            SMTP_HOST: !!(process.env.SMTP_HOST || config.SMTP_HOST),
            SMTP_USER: !!(process.env.SMTP_USER || config.SMTP_USER),
            SMTP_PASS: !!(process.env.SMTP_PASS || config.SMTP_PASS),
            GMAIL_USER: !!(process.env.GMAIL_USER || config.GMAIL_USER),
            GMAIL_PASS: !!(process.env.GMAIL_PASS || config.GMAIL_PASS)
        };
        let transporter;
        let verified = false;
        let verifyDetail = null;
        try {
            transporter = await createVerifiedTransporter();
            verified = !!transporter;
        } catch (e) {
            verifyDetail = e?.message || String(e);
        }
        const fromAddress = process.env.SMTP_USER || config.SMTP_USER || process.env.GMAIL_USER || config.GMAIL_USER || null;
        res.json({ success: true, present, verified, fromAddress, detail: verifyDetail });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Selftest failed', detail: error?.message || String(error) });
    }
});

// Session Management Routes
// Create anonymous session
app.post('/api/session/create', async (req, res) => {
    try {
        const { username } = req.body;

        const result = await authService.createAnonymousSession(username);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get session user
app.get('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        const result = await authService.getSessionUser(sessionId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update session username
app.put('/api/session/:sessionId/username', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { username } = req.body;

        if (!sessionId || !username) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and username are required'
            });
        }

        const result = await authService.updateSessionUsername(sessionId, username);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update session username error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const userCount = await authService.usersCollection.countDocuments();
        res.json({
            success: true,
            message: 'Database connection working',
            userCount: userCount,
            collectionName: 'user_accounts'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// Get user profile by email
app.get('/api/auth/profile/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        const result = await authService.getUserProfile(email);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get user by ID
app.get('/api/auth/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const result = await authService.getUserById(userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Add emergency contact
app.post('/api/auth/emergency-contact', async (req, res) => {
    try {
        const { email, contactEmail, contactName } = req.body;

        if (!email || !contactEmail) {
            return res.status(400).json({
                success: false,
                error: 'User email and emergency contact email are required'
            });
        }

        const result = await authService.addEmergencyContact(email, contactEmail, contactName);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Add emergency contact error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Remove emergency contact
app.delete('/api/auth/emergency-contact', async (req, res) => {
    try {
        const { email, contactEmail } = req.body;

        if (!email || !contactEmail) {
            return res.status(400).json({
                success: false,
                error: 'User email and emergency contact email are required'
            });
        }

        const result = await authService.removeEmergencyContact(email, contactEmail);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Remove emergency contact error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update emergency contact status
app.put('/api/auth/emergency-contact/status', async (req, res) => {
    try {
        const { email, contactEmail, status } = req.body;

        if (!email || !contactEmail || !status) {
            return res.status(400).json({
                success: false,
                error: 'User email, contact email, and status are required'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status must be one of: pending, approved, rejected'
            });
        }

        const result = await authService.updateEmergencyContactStatus(email, contactEmail, status);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update emergency contact status error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Incoming emergency contact requests for approver
app.get('/api/auth/emergency-requests/incoming/:approverEmail', async (req, res) => {
    try {
        const { approverEmail } = req.params;
        if (!approverEmail) {
            return res.status(400).json({ success: false, error: 'Approver email is required' });
        }
        const result = await authService.getIncomingEmergencyRequests(approverEmail);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Get incoming emergency requests error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Respond to an emergency contact request
app.post('/api/auth/emergency-requests/respond', async (req, res) => {
    try {
        const { approverEmail, requesterEmail, action } = req.body;
        if (!approverEmail || !requesterEmail || !action) {
            return res.status(400).json({ success: false, error: 'Approver, requester, and action are required' });
        }
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Action must be approved or rejected' });
        }
        const result = await authService.respondToEmergencyRequest(approverEmail, requesterEmail, action);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Respond to emergency request error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Community Routes
// Get all reports
app.get('/api/community/reports', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const hazardType = req.query.hazardType || null;

        const result = await authService.getAllReports(page, limit, hazardType);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Create new report
app.post('/api/community/reports', async (req, res) => {
    try {
        const { userId, hazardType, title, description, address, imageUrl } = req.body;

        console.log('Creating report with data:', { userId, hazardType, title, description, address, imageUrl });

        if (!userId || !hazardType || !title || !description || !address) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const result = await authService.createReport(userId, {
            hazardType,
            title,
            description,
            address,
            imageUrl
        });

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get user reports
app.get('/api/community/reports/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const result = await authService.getUserReports(userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update report
app.put('/api/community/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId, title, description, hazardType } = req.body;

        if (!reportId || !userId || !title || !description || !hazardType) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const result = await authService.updateReport(reportId, userId, {
            title,
            description,
            hazardType
        });

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Delete report
app.delete('/api/community/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId } = req.body;

        if (!reportId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Report ID and User ID are required'
            });
        }

        const result = await authService.deleteReport(reportId, userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Add comment to report
app.post('/api/community/reports/:reportId/comments', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId, username, commentText } = req.body;

        if (!reportId || !userId || !commentText) {
            return res.status(400).json({
                success: false,
                error: 'Report ID, User ID, and comment text are required'
            });
        }

        const result = await authService.addComment(reportId, userId, commentText, username);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get report comments
app.get('/api/community/reports/:reportId/comments', async (req, res) => {
    try {
        const { reportId } = req.params;

        if (!reportId) {
            return res.status(400).json({
                success: false,
                error: 'Report ID is required'
            });
        }

        const result = await authService.getReportComments(reportId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Delete individual comment
app.delete('/api/community/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId } = req.body;

        if (!commentId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Comment ID and User ID are required'
            });
        }

        const result = await authService.deleteComment(commentId, userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Like/Unlike report
app.post('/api/community/reports/:reportId/like', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId } = req.body;

        if (!reportId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Report ID and User ID are required'
            });
        }

        const result = await authService.likeReport(reportId, userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Like report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const collections = await db.listCollections().toArray();

        res.json({
            success: true,
            message: 'Database connection successful!',
            database: config.DB_NAME,
            collections: collections.length,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Search locations
app.get('/api/search', async (req, res) => {
    const query = req.query.q;

    if (!query || query.trim().length < 1) {
        return res.json({
            success: false,
            error: 'Search query must be at least 1 character long'
        });
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Check if there's already an active request for this query
    if (activeSearchRequests.has(normalizedQuery)) {
        console.log(`Deduplicating request for: ${query}`);
        try {
            const results = await activeSearchRequests.get(normalizedQuery);
            return res.json({
                success: true,
                results: results
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Search failed'
            });
        }
    }

    let responseSent = false;

    // Set a timeout for the entire request
    const timeout = setTimeout(() => {
        if (!responseSent) {
            responseSent = true;
            activeSearchRequests.delete(normalizedQuery);
            res.status(408).json({ success: false, error: 'Request timeout' });
        }
    }, 8000); // Increased timeout to 8 seconds for better reliability

    // Create a promise for this search request with enhanced geocoding
    const searchPromise = (async () => {
        try {
            let results;

            // Try the reliable Nominatim geocoding service first
            try {
                results = await geocodingService.searchLocation(query);
                console.log(`Nominatim geocoding found ${results.length} results for: ${query}`);

                if (!results || results.length === 0) {
                    throw new Error("No results from Nominatim, trying fallback");
                }
            } catch (error) {
                console.warn(`Nominatim geocoding failed or returned empty for: ${query}, trying enhanced fallback:`, error.message);

                // Fallback to EnhancedGeocodingService
                results = await enhancedGeocodingService.searchLocation(query);
                console.log(`Enhanced geocoding found ${results.length} results for: ${query}`);
            }

            // Convert to frontend format
            const formattedResults = results.map(result => ({
                displayName: result.getDisplayName(),
                latitude: result.getLatitude(),
                longitude: result.getLongitude(),
                country: result.getCountry(),
                state: result.getState()
            }));

            return formattedResults;
        } catch (error) {
            throw error;
        } finally {
            // Clean up the active request
            activeSearchRequests.delete(normalizedQuery);
        }
    })();

    // Store the promise for deduplication
    activeSearchRequests.set(normalizedQuery, searchPromise);

    try {
        const results = await searchPromise;

        if (!responseSent) {
            clearTimeout(timeout);
            responseSent = true;
            res.json({
                success: true,
                results: results
            });
        }

    } catch (error) {
        if (!responseSent) {
            clearTimeout(timeout);
            responseSent = true;
            console.error('Search error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Search failed'
            });
        }
    }
});

// Get rainfall data
app.get('/api/rainfall', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        // Use OpenMeteoService for seamless history + current + forecast
        // This solves the issue of missing "recent 3 days" (NASA Power lag)
        const OpenMeteoService = require('./src/OpenMeteoService');
        const openMeteo = new OpenMeteoService();

        // Get analysis: 7 days history + today + 7 days forecast
        const analysisData = await openMeteo.getDailyRainfallAnalysis(lat, lon, 7, 7);

        // Calculate statistics based on the returned data
        const totalRainfall = analysisData.reduce((sum, day) => sum + (day.rainfall || 0), 0);
        const daysWithRain = analysisData.filter(day => day.rainfall > 0.1).length;
        const maxRainfall = analysisData.reduce((max, day) => Math.max(max, day.rainfall || 0), 0);
        const averageRainfall = totalRainfall / (analysisData.length || 1);

        // Convert to frontend format matching expected structure
        const formattedData = {
            latitude: lat,
            longitude: lon,
            totalRainfall: totalRainfall,
            averageRainfall: averageRainfall,
            daysWithRain: daysWithRain,
            maxRainfall: maxRainfall,
            dailyData: analysisData.map(daily => ({
                date: daily.date,
                rainfall: daily.rainfall,
                isForecast: daily.isForecast,
                probability: daily.probability
            }))
        };

        res.json({
            success: true,
            rainfallData: formattedData
        });

    } catch (error) {
        console.error('Rainfall data error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Get waterbody data
app.get('/api/waterbody', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        // Get rainfall data for water level estimation
        const rainfallData = await nasaApiClient.getRainfallData(lat, lon,
            DateUtils.minusDays(DateUtils.now(), 7),
            DateUtils.now()).catch(() => null);

        const waterbodyData = await osmService.getWaterbodyWithLevel(lat, lon, rainfallData);

        res.json({
            success: true,
            waterbody: waterbodyData
        });

    } catch (error) {
        console.error('Waterbody data error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Get weather forecast
app.get('/api/weather', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        const forecasts = await weatherService.getWeatherForecast(lat, lon);
        let hourlyForecasts = [];
        try {
            hourlyForecasts = await openMeteoService.getHourlyForecast(lat, lon);
        } catch (e) {
            console.error('Failed to get hourly forecast', e);
        }

        // Convert to frontend format
        const formattedForecasts = forecasts.map(forecast => ({
            date: forecast.getDate(),
            averageTemperature: forecast.getAverageTemperature(),
            averageHumidity: forecast.getAverageHumidity(),
            totalRainfall: forecast.getTotalRainfall(),
            mostCommonDescription: forecast.getMostCommonDescription(),
            hasRain: forecast.hasRain()
        }));

        res.json({
            success: true,
            forecasts: formattedForecasts,
            hourly: hourlyForecasts
        });

    } catch (error) {
        console.error('Weather data error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Terrain analysis endpoint
app.get('/api/terrain', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        const terrainData = await terrainService.getTerrainAnalysis(lat, lon);
        res.json(terrainData);

    } catch (error) {
        console.error('Terrain data error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Disaster kit recommendations endpoint
app.get('/api/disaster-kit', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        const locationName = req.query.name || 'this location';

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        console.log(`Disaster kit request for: ${locationName} (${lat}, ${lon})`);

        // Calculate date range (past 7 days)
        const endDate = DateUtils.minusDays(DateUtils.now(), 3);
        const startDate = DateUtils.minusDays(endDate, 6);

        // Helper function to retry API calls
        const retryWithDelay = async (fn, maxRetries = 3, delay = 1000) => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        };

        // Fetch all data with retries - WAIT for ALL to succeed
        console.log('⏳ Fetching all disaster kit data...');
        const [rainfallResult, waterbodyResult, weatherResult, terrainResult] = await Promise.all([
            retryWithDelay(() =>
                nasaApiClient.getRainfallData(lat, lon, startDate, endDate).then(data => ({
                    success: true,
                    rainfallData: {
                        latitude: data.getLatitude(),
                        longitude: data.getLongitude(),
                        totalRainfall: data.getTotalRainfall(),
                        averageRainfall: data.getAverageRainfall(),
                        daysWithRain: data.getDaysWithRain(),
                        maxRainfall: data.getMaxRainfall()
                    }
                }))
            ).catch(err => {
                console.warn('⚠️ Rainfall data failed after retries, using fallback');
                return { success: true, rainfallData: null };
            }),

            retryWithDelay(() =>
                osmService.getWaterbodyWithLevel(lat, lon, null).then(waterbody => ({
                    success: true,
                    waterbody: waterbody
                }))
            ).catch(err => {
                console.warn('⚠️ Waterbody data failed after retries, using fallback');
                return { success: true, waterbody: null };
            }),

            retryWithDelay(() =>
                weatherService.getWeatherForecast(lat, lon).then(forecasts => ({
                    success: true,
                    forecasts: forecasts.map(f => ({
                        date: f.getDate(),
                        averageTemperature: f.getAverageTemperature(),
                        averageHumidity: f.getAverageHumidity(),
                        totalRainfall: f.getTotalRainfall(),
                        mostCommonDescription: f.getMostCommonDescription(),
                        hasRain: f.hasRain()
                    }))
                }))
            ).catch(err => {
                console.warn('⚠️ Weather data failed after retries, using fallback');
                return { success: true, forecasts: [] };
            }),

            retryWithDelay(() =>
                terrainService.getTerrainAnalysis(lat, lon)
                , 5, 1500).catch(err => {
                    console.warn('⚠️ Terrain data failed after retries, using fallback');
                    return { success: true, elevation: null, slopeCategory: null };
                })
        ]);

        console.log('✅ All disaster kit data loaded');

        // Prepare data object
        const data = {
            rainfall: rainfallResult.rainfallData,
            waterbody: waterbodyResult.waterbody,
            weather: weatherResult,
            terrain: terrainResult
        };

        console.log('Disaster kit data collected:', {
            hasRainfall: !!data.rainfall,
            hasWaterbody: !!data.waterbody,
            hasWeather: !!data.weather?.forecasts?.length,
            hasTerrain: !!data.terrain?.elevation
        });

        // Analyze and get recommendations with location name
        const analysis = await disasterKitService.analyzeLocation(data, locationName);
        res.json(analysis);

    } catch (error) {
        console.error('Disaster kit analysis error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Find nearby hospitals
app.get('/api/hospitals', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);
        const radius = parseInt(req.query.radius) || 10000; // Default 10km

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        const hospitals = await hospitalService.findHospitals(lat, lon, radius);

        res.json({
            success: true,
            hospitals: hospitals,
            count: hospitals.length,
            location: { latitude: lat, longitude: lon },
            radius: radius
        });

    } catch (error) {
        console.error('Hospitals search error:', error);
        res.json({
            success: false,
            error: error.message || 'Failed to find hospitals'
        });
    }
});

// Medibot Chat Endpoint
app.post('/api/medibot/chat', async (req, res) => {
    try {
        const { query, context } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const result = await medibotService.getMedicalAdvice(query, context);
        res.json({ success: true, ...result });

    } catch (error) {
        console.error('Medibot chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Calculate flood risk assessment
app.get('/api/risk', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lon = parseFloat(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        // Get all data for risk calculation
        const [rainfallData, forecasts] = await Promise.allSettled([
            nasaApiClient.getRainfallData(lat, lon,
                DateUtils.minusDays(DateUtils.now(), 9),
                DateUtils.minusDays(DateUtils.now(), 3)),
            weatherService.getWeatherForecast(lat, lon)
        ]);

        // Get waterbody data with water level estimation
        const rainfallDataValue = rainfallData.status === 'fulfilled' ? rainfallData.value : null;
        const waterbodyData = await osmService.getWaterbodyWithLevel(lat, lon, rainfallDataValue);

        // Calculate risk based on multiple factors
        const risk = calculateFloodRisk(
            rainfallDataValue,
            waterbodyData,
            forecasts.status === 'fulfilled' ? forecasts.value : null,
            lat, lon
        );

        res.json({
            success: true,
            risk: risk
        });

    } catch (error) {
        console.error('Risk calculation error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Risk calculation function
function calculateFloodRisk(rainfallData, waterbodyData, forecasts, lat, lon) {
    let riskScore = 0;
    const factors = {
        rainfall: 'Low',
        proximity: 'Low',
        waterLevel: 'Low',
        seasonal: 'Low'
    };

    // Rainfall factor (0-30 points)
    if (rainfallData) {
        const totalRainfall = rainfallData.getTotalRainfall();
        const avgRainfall = rainfallData.getAverageRainfall();
        const daysWithRain = rainfallData.getDaysWithRain();

        if (totalRainfall > 100) {
            riskScore += 30;
            factors.rainfall = 'Very High';
        } else if (totalRainfall > 50) {
            riskScore += 25;
            factors.rainfall = 'High';
        } else if (totalRainfall > 20) {
            riskScore += 15;
            factors.rainfall = 'Medium';
        } else if (totalRainfall > 5) {
            riskScore += 10;
            factors.rainfall = 'Low';
        }
    }

    // Water level factor (0-40 points) - NEW!
    if (waterbodyData && waterbodyData.waterLevel) {
        const waterLevel = waterbodyData.waterLevel;
        const riskLevel = waterLevel.riskLevel;

        if (riskLevel === 'Critical') {
            riskScore += 40;
            factors.waterLevel = 'Critical';
        } else if (riskLevel === 'High') {
            riskScore += 30;
            factors.waterLevel = 'High';
        } else if (riskLevel === 'Medium') {
            riskScore += 20;
            factors.waterLevel = 'Medium';
        } else {
            riskScore += 5;
            factors.waterLevel = 'Low';
        }
    }

    // Waterbody proximity factor (0-20 points) - Reduced weight
    if (waterbodyData && waterbodyData.found) {
        const distanceKm = waterbodyData.distanceMeters / 1000;
        const waterType = waterbodyData.type;

        if (distanceKm < 5) {
            riskScore += 20;
            factors.proximity = 'Very High';
        } else if (distanceKm < 15) {
            riskScore += 15;
            factors.proximity = 'High';
        } else if (distanceKm < 30) {
            riskScore += 10;
            factors.proximity = 'Medium';
        } else if (distanceKm < 50) {
            riskScore += 5;
            factors.proximity = 'Low';
        }

        // Bonus for major water bodies
        if (waterType === 'river' || waterType === 'sea' || waterType === 'ocean') {
            riskScore += 3;
        }
    }

    // Seasonal factor (0-10 points) - Reduced weight
    const currentMonth = new Date().getMonth(); // 0-11
    const isMonsoonSeason = currentMonth >= 6 && currentMonth <= 9; // July-October
    const isPreMonsoon = currentMonth >= 3 && currentMonth <= 5; // April-June

    if (isMonsoonSeason) {
        riskScore += 10;
        factors.seasonal = 'Very High';
    } else if (isPreMonsoon) {
        riskScore += 5;
        factors.seasonal = 'High';
    } else {
        factors.seasonal = 'Low';
    }

    // Determine risk level
    let level, percentage;
    if (riskScore >= 70) {
        level = 'HIGH';
        percentage = Math.min(95, 70 + (riskScore - 70) * 0.5);
    } else if (riskScore >= 40) {
        level = 'MEDIUM';
        percentage = 40 + (riskScore - 40) * 1.5;
    } else {
        level = 'LOW';
        percentage = Math.max(5, riskScore);
    }

    return {
        level,
        percentage: Math.round(percentage),
        score: riskScore,
        factors,
        waterLevel: waterbodyData?.waterLevel || null
    };
}

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// NEW: AI Flood Prediction Endpoint
app.get('/api/predict-flood', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    try {
        // 1. Fetch Rainfall Data (for water level estimation context)
        // We reuse the nasaApiClient available in scope
        const rainfallData = await nasaApiClient.getRainfallData(
            parseFloat(lat),
            parseFloat(lon),
            DateUtils.minusDays(DateUtils.now(), 7),
            DateUtils.now()
        ).catch(err => {
            console.warn("Rainfall fetch failed for prediction context, proceeding without:", err.message);
            return null;
        });

        // 2. Fetch Waterbody Context WITH Level
        console.log(`[API] Fetching waterbody info with level for ${lat}, ${lon}`);
        // CRITICAL FIX: Use getWaterbodyWithLevel instead of findNearestWaterbody
        // This ensures "Risk Assessment" gets the actual calculated water level (not 0)
        const waterBodyData = await osmService.getWaterbodyWithLevel(parseFloat(lat), parseFloat(lon), rainfallData);

        // 3. Run Prediction with full context
        const result = await floodPredictionService.predictFloodRisk(parseFloat(lat), parseFloat(lon), waterBodyData);
        res.json(result);
    } catch (error) {
        console.error('Flood prediction API error:', error);
        res.status(500).json({ error: 'Failed to generate prediction' });
    }
});

// NEW: AI Landslide Prediction Endpoint
app.get('/api/predict-landslide', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    try {
        console.log(`[API] Starting landslide prediction for ${lat}, ${lon}`);
        const result = await landslidePredictionService.predictLandslideRisk(parseFloat(lat), parseFloat(lon));
        res.json(result);
    } catch (error) {
        console.error('Landslide prediction API error:', error);
        res.status(500).json({ error: 'Failed to generate landslide prediction' });
    }
});

// Start server with MongoDB connection
async function startServer() {
    console.log('Starting Sentinel server...');

    // Try to connect to MongoDB Atlas, but don't fail if it doesn't work
    let dbConnected = false;
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        await dbConnection.connect();

        // Initialize auth service
        authService = new AuthService(dbConnection);

        // Create database indexes for better performance
        await dbConnection.createIndexes();
        await authService.createIndexes();

        dbConnected = true;
        console.log(`✅ Connected to MongoDB Atlas database: ${config.DB_NAME}`);
    } catch (error) {
        console.error('\n⚠️  WARNING: Failed to connect to MongoDB Atlas:', error.message);
        console.error('\nTroubleshooting MongoDB connection:');
        console.error('1. Check if MongoDB Atlas connection string is correct in config.js');
        console.error('2. Verify your IP is whitelisted in MongoDB Atlas (Network Access)');
        console.error('3. Check your internet connection');
        console.error('4. Verify MongoDB credentials are correct');
        console.error('5. Check if the MongoDB cluster is running (not paused)');
        console.error('\n⚠️  Server will start WITHOUT database connection.');
        console.error('⚠️  Authentication and database features will NOT work until connection is established.\n');

        // Initialize authService as null so routes can check
        authService = null;
    }

    // Start the server regardless of database connection status
    try {
        app.listen(PORT, () => {
            console.log(`\n✅ Sentinel server running on http://localhost:${PORT}`);
            if (dbConnected) {
                console.log(`✅ Database: Connected to MongoDB Atlas (${config.DB_NAME})`);
                console.log('✅ Authentication endpoints available at /api/auth/*');
            } else {
                console.log(`❌ Database: NOT CONNECTED - Authentication will fail`);
                console.log('⚠️  To fix: Check MongoDB connection and restart server');
            }
            console.log('✅ Health check: http://localhost:3000/api/health');
            console.log('✅ API test: http://localhost:3000/api/test-db');
            console.log('\nPress Ctrl+C to stop the server\n');
        });
    } catch (error) {
        console.error('\n❌ Failed to start HTTP server:', error.message);
        process.exit(1);
    }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    geocodingService.close();
    nasaApiClient.close();
    osmService.close();
    weatherService.close();
    await dbConnection.close();
    process.exit(0);
});
