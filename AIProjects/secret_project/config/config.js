const dotenv = require('dotenv');
const joi = require('joi');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Configuration schema validation
const envVarsSchema = joi.object({
    NODE_ENV: joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
    PORT: joi.number().default(3000),
    API_VERSION: joi.string().default('v1'),
    
    // Database
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().default(5432),
    DB_NAME: joi.string().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    
    // JWT Configuration
    JWT_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRATION: joi.number().default(3600),
    JWT_REFRESH_EXPIRATION: joi.number().default(2592000),
    
    // External APIs
    TINEYE_API_KEY: joi.string().required(),
    OPENAI_API_KEY: joi.string().required(),
    
    // Square Payment Processing
    SQUARE_ACCESS_TOKEN: joi.string().required(),
    SQUARE_LOCATION_ID: joi.string().required(),
    SQUARE_APPLICATION_ID: joi.string().required(),
    SQUARE_ENVIRONMENT: joi.string().valid('sandbox', 'production').required(),
    
    // Redis Cache
    REDIS_HOST: joi.string().default('localhost'),
    REDIS_PORT: joi.number().default(6379),
    REDIS_PASSWORD: joi.string().allow('').default(''),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW: joi.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: joi.number().default(100),
    
    // Logging
    LOG_LEVEL: joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info'),
    
    // CORS
    CORS_ORIGIN: joi.string().default('*'),
    
    // File Upload
    MAX_FILE_SIZE: joi.number().default(5242880),
    ALLOWED_FILE_TYPES: joi.string().default('image/jpeg,image/png,image/webp,audio/wav,audio/mp3'),
    
    // Marketplace Integration
    FACEBOOK_APP_ID: joi.string().required(),
    FACEBOOK_APP_SECRET: joi.string().required(),
    EBAY_APP_ID: joi.string().required(),
    EBAY_CERT_ID: joi.string().required(),
    
    // Monitoring
    SENTRY_DSN: joi.string().required(),
    NEW_RELIC_LICENSE_KEY: joi.string().required(),

    // Vosk Configuration
    VOSK_MODEL_PATH: joi.string().required(),

    // UI Configuration
    THEME_PRIMARY_COLOR: joi.string().default('#1976d2'),
    THEME_SECONDARY_COLOR: joi.string().default('#dc004e'),
    THEME_SUCCESS_COLOR: joi.string().default('#4caf50'),
    THEME_ERROR_COLOR: joi.string().default('#f44336'),
    THEME_WARNING_COLOR: joi.string().default('#ff9800'),
    THEME_INFO_COLOR: joi.string().default('#2196f3'),
    ENABLE_DARK_MODE: joi.boolean().default(true),
    ENABLE_RTL: joi.boolean().default(false),
}).unknown();

const { error, value: envVars } = envVarsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    apiVersion: envVars.API_VERSION,
    
    database: {
        host: envVars.DB_HOST,
        port: envVars.DB_PORT,
        name: envVars.DB_NAME,
        user: envVars.DB_USER,
        password: envVars.DB_PASSWORD,
    },
    
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationSeconds: envVars.JWT_ACCESS_EXPIRATION,
        refreshExpirationSeconds: envVars.JWT_REFRESH_EXPIRATION,
    },
    
    externalApis: {
        tineye: {
            apiKey: envVars.TINEYE_API_KEY,
        },
        openai: {
            apiKey: envVars.OPENAI_API_KEY,
        },
    },

    square: {
        accessToken: envVars.SQUARE_ACCESS_TOKEN,
        locationId: envVars.SQUARE_LOCATION_ID,
        applicationId: envVars.SQUARE_APPLICATION_ID,
        environment: envVars.SQUARE_ENVIRONMENT,
    },
    
    redis: {
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
        password: envVars.REDIS_PASSWORD,
    },
    
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW,
        max: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    
    logging: {
        level: envVars.LOG_LEVEL,
    },
    
    cors: {
        origin: envVars.CORS_ORIGIN,
    },
    
    upload: {
        maxFileSize: envVars.MAX_FILE_SIZE,
        allowedFileTypes: envVars.ALLOWED_FILE_TYPES.split(','),
    },
    
    marketplace: {
        facebook: {
            appId: envVars.FACEBOOK_APP_ID,
            appSecret: envVars.FACEBOOK_APP_SECRET,
        },
        ebay: {
            appId: envVars.EBAY_APP_ID,
            certId: envVars.EBAY_CERT_ID,
        },
    },
    
    monitoring: {
        sentryDsn: envVars.SENTRY_DSN,
        newRelicLicenseKey: envVars.NEW_RELIC_LICENSE_KEY,
    },

    vosk: {
        modelPath: envVars.VOSK_MODEL_PATH,
    },

    ui: {
        theme: {
            primaryColor: envVars.THEME_PRIMARY_COLOR,
            secondaryColor: envVars.THEME_SECONDARY_COLOR,
            successColor: envVars.THEME_SUCCESS_COLOR,
            errorColor: envVars.THEME_ERROR_COLOR,
            warningColor: envVars.THEME_WARNING_COLOR,
            infoColor: envVars.THEME_INFO_COLOR,
        },
        features: {
            darkMode: envVars.ENABLE_DARK_MODE,
            rtl: envVars.ENABLE_RTL,
        },
    },
};

module.exports = config;
