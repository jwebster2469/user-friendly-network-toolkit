const winston = require('winston');
const Sentry = require('@sentry/node');
const config = require('../../config/config');

// Initialize Sentry
Sentry.init({
    dsn: config.monitoring.sentryDsn,
    environment: config.env,
    tracesSampleRate: 1.0,
});

// Custom format for winston
const customFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create winston logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: customFormat,
    defaultMeta: { service: 'listing-assistant' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ]
});

// If we're not in production, log to console as well
if (config.env !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create a stream object for Morgan
logger.stream = {
    write: (message) => logger.info(message.trim())
};

// Extend logger to include Sentry reporting for errors
const originalError = logger.error;
logger.error = (message, meta) => {
    // Send error to Sentry
    if (meta && meta.error instanceof Error) {
        Sentry.captureException(meta.error);
    } else {
        Sentry.captureMessage(message);
    }
    
    // Call original error logger
    originalError.call(logger, message, meta);
};

module.exports = logger;
