const { Schema, model } = require('mongoose');
const crypto = require('crypto');

const integrationSchema = new Schema({
    // Basic integration info
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['amazon', 'ebay', 'facebook', 'etsy', 'shopify', 'walmart', 'custom'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'error', 'pending', 'revoked'],
        default: 'pending'
    },

    // Authentication
    credentials: {
        // Encrypted credentials
        accessToken: {
            iv: String,
            content: String
        },
        refreshToken: {
            iv: String,
            content: String
        },
        apiKey: {
            iv: String,
            content: String
        },
        secretKey: {
            iv: String,
            content: String
        },
        additionalKeys: [{
            key: String,
            iv: String,
            content: String
        }]
    },

    // Connection details
    connection: {
        endpoint: String,
        apiVersion: String,
        sandbox: {
            type: Boolean,
            default: false
        },
        rateLimit: {
            requests: Number,
            interval: String
        },
        lastSync: Date,
        nextSync: Date
    },

    // Permissions
    permissions: {
        scopes: [String],
        roles: [String],
        restrictions: [String],
        customPermissions: Schema.Types.Mixed
    },

    // Sync configuration
    syncConfig: {
        enabled: {
            type: Boolean,
            default: true
        },
        interval: {
            type: String,
            enum: ['realtime', '5min', '15min', '30min', '1hour', '4hour', '12hour', 'daily'],
            default: '15min'
        },
        direction: {
            type: String,
            enum: ['push', 'pull', 'bidirectional'],
            default: 'bidirectional'
        },
        entities: [{
            type: {
                type: String,
                enum: ['product', 'inventory', 'order', 'customer', 'category', 'custom'],
                required: true
            },
            enabled: {
                type: Boolean,
                default: true
            },
            mapping: Schema.Types.Mixed,
            filters: Schema.Types.Mixed,
            transformations: Schema.Types.Mixed
        }]
    },

    // Performance metrics
    metrics: {
        uptime: {
            type: Number,
            default: 100
        },
        errorRate: {
            type: Number,
            default: 0
        },
        responseTime: {
            type: Number,
            default: 0
        },
        syncSuccess: {
            type: Number,
            default: 0
        },
        lastMetricsUpdate: Date
    },

    // Error tracking
    errors: [{
        code: String,
        message: String,
        timestamp: Date,
        details: Schema.Types.Mixed,
        resolved: {
            type: Boolean,
            default: false
        },
        resolvedAt: Date,
        resolution: String
    }],

    // Sync history
    syncHistory: [{
        startTime: Date,
        endTime: Date,
        status: {
            type: String,
            enum: ['success', 'partial', 'failed']
        },
        entities: {
            processed: Number,
            succeeded: Number,
            failed: Number
        },
        errors: [{
            entity: String,
            error: String,
            details: Schema.Types.Mixed
        }]
    }],

    // Webhook configuration
    webhooks: [{
        url: String,
        events: [String],
        active: {
            type: Boolean,
            default: true
        },
        secret: String,
        headers: Schema.Types.Mixed
    }],

    // Rate limiting
    rateLimiting: {
        current: {
            requests: Number,
            timestamp: Date
        },
        limits: {
            maxRequests: Number,
            interval: String
        }
    },

    // Metadata
    metadata: {
        version: String,
        environment: {
            type: String,
            enum: ['production', 'staging', 'development'],
            default: 'production'
        },
        customFields: Schema.Types.Mixed,
        tags: [String]
    }
}, {
    timestamps: true
});

// Indexes
integrationSchema.index({ 'user': 1, 'platform': 1 }, { unique: true });
integrationSchema.index({ status: 1 });
integrationSchema.index({ 'connection.lastSync': 1 });

// Methods
integrationSchema.methods = {
    // Encrypt sensitive data
    async encryptCredential(value) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
            iv
        );
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            iv: iv.toString('hex'),
            content: encrypted
        };
    },

    // Decrypt sensitive data
    async decryptCredential(encrypted) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
            Buffer.from(encrypted.iv, 'hex')
        );
        
        let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    },

    // Test connection
    async testConnection() {
        try {
            // Implementation depends on platform
            const result = await this.makeTestRequest();
            return {
                success: true,
                responseTime: result.responseTime,
                details: result.details
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Update metrics
    async updateMetrics(metrics) {
        this.metrics = {
            ...this.metrics,
            ...metrics,
            lastMetricsUpdate: new Date()
        };
        await this.save();
    },

    // Check rate limits
    async checkRateLimit() {
        const now = new Date();
        const { maxRequests, interval } = this.rateLimiting.limits;
        const intervalMs = ms(interval);
        
        if (!this.rateLimiting.current.timestamp ||
            (now - this.rateLimiting.current.timestamp) > intervalMs) {
            this.rateLimiting.current = {
                requests: 1,
                timestamp: now
            };
        } else {
            this.rateLimiting.current.requests++;
        }
        
        await this.save();
        
        return this.rateLimiting.current.requests <= maxRequests;
    },

    // Record sync attempt
    async recordSync(syncResult) {
        this.syncHistory.push({
            startTime: syncResult.startTime,
            endTime: new Date(),
            status: syncResult.status,
            entities: syncResult.entities,
            errors: syncResult.errors
        });
        
        this.connection.lastSync = new Date();
        this.connection.nextSync = this.calculateNextSync();
        
        await this.save();
    }
};

// Statics
integrationSchema.statics = {
    // Get integration health
    async getIntegrationHealth(userId) {
        return this.aggregate([
            { $match: { user: userId } },
            { $group: {
                _id: '$platform',
                avgUptime: { $avg: '$metrics.uptime' },
                avgErrorRate: { $avg: '$metrics.errorRate' },
                avgResponseTime: { $avg: '$metrics.responseTime' },
                totalSyncs: { $sum: { $size: '$syncHistory' } }
            }}
        ]);
    },

    // Get sync statistics
    async getSyncStats(timeframe = '24h') {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - parseInt(timeframe));

        return this.aggregate([
            { $unwind: '$syncHistory' },
            { $match: {
                'syncHistory.startTime': { $gte: startDate }
            }},
            { $group: {
                _id: '$platform',
                totalSyncs: { $sum: 1 },
                successfulSyncs: {
                    $sum: {
                        $cond: [
                            { $eq: ['$syncHistory.status', 'success'] },
                            1,
                            0
                        ]
                    }
                },
                averageProcessingTime: {
                    $avg: {
                        $subtract: [
                            '$syncHistory.endTime',
                            '$syncHistory.startTime'
                        ]
                    }
                }
            }}
        ]);
    }
};

module.exports = model('Integration', integrationSchema);
