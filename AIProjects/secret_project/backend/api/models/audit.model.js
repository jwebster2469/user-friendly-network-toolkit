const { Schema, model } = require('mongoose');

const auditSchema = new Schema({
    // Event information
    eventType: {
        type: String,
        enum: [
            // Authentication events
            'user_login',
            'user_logout',
            'password_change',
            'mfa_enabled',
            'mfa_disabled',
            'token_refresh',
            
            // Data access events
            'data_access',
            'data_export',
            'data_import',
            'data_deletion',
            
            // User management
            'user_created',
            'user_updated',
            'user_deleted',
            'role_changed',
            
            // System events
            'system_config_change',
            'system_backup',
            'system_restore',
            'system_error',
            
            // Integration events
            'integration_connected',
            'integration_disconnected',
            'integration_auth_refresh',
            'integration_sync',
            
            // Security events
            'security_breach',
            'suspicious_activity',
            'rate_limit_exceeded',
            'ip_blocked',
            
            // Compliance events
            'compliance_check',
            'policy_acceptance',
            'data_retention_check',
            'gdpr_request',
            
            // Custom events
            'custom'
        ],
        required: true,
        index: true
    },

    // Actor information
    actor: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['user', 'system', 'integration', 'admin'],
            default: 'user'
        },
        email: String,
        role: String,
        ip: String,
        userAgent: String
    },

    // Target information
    target: {
        model: {
            type: String,
            enum: ['User', 'Listing', 'Integration', 'Experiment', 'Analytics', 'Notification', 'System'],
            required: true
        },
        id: Schema.Types.ObjectId,
        type: String,
        name: String,
        description: String
    },

    // Action details
    action: {
        name: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['success', 'failure', 'warning', 'info'],
            required: true
        },
        method: String,
        endpoint: String,
        parameters: Schema.Types.Mixed
    },

    // Changes tracking
    changes: {
        before: Schema.Types.Mixed,
        after: Schema.Types.Mixed,
        diff: Schema.Types.Mixed,
        fields: [String]
    },

    // Context information
    context: {
        location: {
            ip: String,
            country: String,
            region: String,
            city: String
        },
        device: {
            type: String,
            os: String,
            browser: String,
            version: String
        },
        session: {
            id: String,
            startTime: Date,
            duration: Number
        },
        request: {
            method: String,
            url: String,
            headers: Schema.Types.Mixed,
            body: Schema.Types.Mixed
        }
    },

    // Risk assessment
    risk: {
        level: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        factors: [{
            name: String,
            weight: Number,
            score: Number
        }],
        triggers: [String]
    },

    // Compliance information
    compliance: {
        regulations: [{
            name: String,
            status: String,
            details: Schema.Types.Mixed
        }],
        policies: [{
            name: String,
            version: String,
            accepted: Boolean
        }],
        retention: {
            period: String,
            expiryDate: Date
        }
    },

    // Response actions
    response: {
        automatic: [{
            action: String,
            status: String,
            timestamp: Date,
            details: Schema.Types.Mixed
        }],
        manual: [{
            action: String,
            performedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            timestamp: Date,
            notes: String
        }]
    },

    // Metadata
    metadata: {
        environment: {
            type: String,
            enum: ['production', 'staging', 'development'],
            default: 'production'
        },
        version: String,
        tags: [String],
        notes: String,
        customData: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
auditSchema.index({ eventType: 1, createdAt: 1 });
auditSchema.index({ 'actor.id': 1 });
auditSchema.index({ 'target.model': 1, 'target.id': 1 });
auditSchema.index({ 'risk.level': 1 });
auditSchema.index({ createdAt: 1 });

// Methods
auditSchema.methods = {
    // Assess risk level
    async assessRisk() {
        let riskScore = 0;
        const weights = {
            eventType: 0.3,
            actorType: 0.2,
            location: 0.15,
            time: 0.15,
            changes: 0.2
        };

        // Calculate risk based on event type
        const eventTypeRisk = this.calculateEventTypeRisk();
        riskScore += eventTypeRisk * weights.eventType;

        // Calculate risk based on actor
        const actorRisk = this.calculateActorRisk();
        riskScore += actorRisk * weights.actorType;

        // Calculate risk based on location
        const locationRisk = this.calculateLocationRisk();
        riskScore += locationRisk * weights.location;

        // Calculate risk based on time
        const timeRisk = this.calculateTimeRisk();
        riskScore += timeRisk * weights.time;

        // Calculate risk based on changes
        const changesRisk = this.calculateChangesRisk();
        riskScore += changesRisk * weights.changes;

        // Update risk assessment
        this.risk.score = riskScore;
        this.risk.level = this.getRiskLevel(riskScore);
        await this.save();

        return {
            score: riskScore,
            level: this.risk.level,
            factors: [
                { name: 'eventType', weight: weights.eventType, score: eventTypeRisk },
                { name: 'actorType', weight: weights.actorType, score: actorRisk },
                { name: 'location', weight: weights.location, score: locationRisk },
                { name: 'time', weight: weights.time, score: timeRisk },
                { name: 'changes', weight: weights.changes, score: changesRisk }
            ]
        };
    },

    // Generate compliance report
    async generateComplianceReport() {
        return {
            event: {
                type: this.eventType,
                timestamp: this.createdAt,
                status: this.action.status
            },
            actor: this.actor,
            target: this.target,
            changes: this.changes,
            compliance: this.compliance,
            risk: this.risk
        };
    }
};

// Statics
auditSchema.statics = {
    // Get security insights
    async getSecurityInsights(timeframe = 24) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - timeframe);

        return this.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    highRiskCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$risk.level', ['high', 'critical']] },
                                1,
                                0
                            ]
                        }
                    },
                    averageRiskScore: { $avg: '$risk.score' }
                }
            }
        ]);
    },

    // Get compliance status
    async getComplianceStatus(regulation) {
        return this.aggregate([
            {
                $match: {
                    'compliance.regulations.name': regulation
                }
            },
            {
                $group: {
                    _id: '$compliance.regulations.status',
                    count: { $sum: 1 }
                }
            }
        ]);
    },

    // Get activity timeline
    async getActivityTimeline(userId, timeframe = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);

        return this.find({
            'actor.id': userId,
            createdAt: { $gte: startDate }
        })
        .sort({ createdAt: -1 })
        .select('eventType action createdAt context risk');
    }
};

module.exports = model('Audit', auditSchema);
