const { validationResult } = require('express-validator');
const logger = require('../../utils/logger');

/**
 * Generic request validation middleware
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware function
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Request validation failed', {
                path: req.path,
                errors: errors.array(),
                body: req.body,
                params: req.params,
                query: req.query
            });

            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        next();
    };
};

/**
 * Common validation patterns
 */
const commonValidations = {
    // Pagination validation
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],

    // ID parameter validation
    idParam: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Invalid ID format')
    ],

    // Date range validation
    dateRange: [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid ISO 8601 date'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid ISO 8601 date')
            .custom((endDate, { req }) => {
                if (req.query.startDate && endDate < req.query.startDate) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],

    // File upload validation
    fileUpload: [
        body('file')
            .custom((value, { req }) => {
                if (!req.file) {
                    throw new Error('No file uploaded');
                }
                return true;
            })
    ],

    // Search query validation
    searchQuery: [
        query('q')
            .trim()
            .notEmpty()
            .withMessage('Search query cannot be empty')
            .isLength({ min: 2, max: 100 })
            .withMessage('Search query must be between 2 and 100 characters')
    ]
};

/**
 * Sanitization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].trim();
            }
        });
    }

    next();
};

/**
 * Error handling for validation middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationError = (err, req, res, next) => {
    if (err instanceof Error) {
        logger.error('Validation middleware error:', {
            error: err.message,
            stack: err.stack,
            path: req.path
        });

        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    next(err);
};

module.exports = {
    validateRequest,
    commonValidations,
    sanitizeInput,
    handleValidationError
};
