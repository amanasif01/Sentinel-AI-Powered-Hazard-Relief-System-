// MongoDB Atlas Configuration
// Replace these values with your actual MongoDB Atlas credentials

module.exports = {
    // MongoDB Atlas connection string
    // Format: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://amanasif01:icecream123@cluster0.9zkpi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    
    // Database name
    DB_NAME: process.env.DB_NAME || 'Sentinel',
    
    // Server configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // SMTP configuration (can be set via env or here)
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '',
    SMTP_SECURE: process.env.SMTP_SECURE || '',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'Sentinel SOS <sentinel.sos.alert@gmail.com>',

    // Optional Gmail configuration
    GMAIL_USER: process.env.GMAIL_USER || 'sentinel.sos.alert@gmail.com',
    GMAIL_PASS: process.env.GMAIL_PASS || 'ktlg birb cavk oqpx',

    // MapTiler configuration for high-accuracy geocoding and maps
    // You can also override this via the MAPTILER_API_KEY environment variable
    MAPTILER_API_KEY: process.env.MAPTILER_API_KEY || 'rO1P1yhWiD9MUQ4t8Lrk'
};
