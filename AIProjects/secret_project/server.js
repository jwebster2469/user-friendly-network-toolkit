require('newrelic'); // Performance monitoring
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');

const config = require('./config/config');
const logger = require('./backend/utils/logger');

// Initialize express app
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to MongoDB
mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    logger.info('Connected to MongoDB');
}).catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: logger.stream }));

// Static files
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/auth', require('./backend/api/routes/auth'));
app.use('/api/listings', require('./backend/api/routes/listings'));
app.use('/api/analytics', require('./backend/api/routes/analytics'));
app.use('/api/experiments', require('./backend/api/routes/experiments'));
app.use('/api/integrations', require('./backend/api/routes/integrations'));
app.use('/api/notifications', require('./backend/api/routes/notifications'));
app.use('/api/tasks', require('./backend/api/routes/tasks'));

// WebSocket handling for real-time updates
wss.on('connection', (ws) => {
    logger.info('New WebSocket connection');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            logger.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        logger.info('Client disconnected');
    });
});

// WebSocket message handler
async function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'subscribe_listings':
            // Handle listing updates subscription
            break;
        case 'subscribe_analytics':
            // Handle analytics updates subscription
            break;
        case 'subscribe_notifications':
            // Handle notifications subscription
            break;
        default:
            logger.warn('Unknown WebSocket message type:', data.type);
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.errors
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = config.port || 3000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    
    // Log startup metrics
    const startupMetrics = {
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
    };
    logger.info('Startup metrics:', startupMetrics);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    
    // Close server
    server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
