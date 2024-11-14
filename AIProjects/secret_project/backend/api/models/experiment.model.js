const { Schema, model } = require('mongoose');

const experimentSchema = new Schema({
    // Basic experiment info
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['a/b_test', 'multivariate', 'feature_flag', 'rollout'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'running', 'paused', 'completed', 'archived'],
        default: 'draft'
    },

    // Targeting
    audience: {
        segments: [{
            type: {
                type: String,
                enum: ['user_type', 'subscription', 'usage', 'location', 'custom'],
                required: true
            },
            value: Schema.Types.Mixed,
            operator: {
                type: String,
                enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']
            }
        }],
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        }
    },

    // Variants
    variants: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        weight: {
            type: Number,
            default: 50
        },
        config: Schema.Types.Mixed,
        isControl: {
            type: Boolean,
            default: false
        }
    }],

    // Goals and metrics
    goals: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['conversion', 'revenue', 'engagement', 'custom'],
            required: true
        },
        metric: String,
        targetValue: Number,
        importance: {
            type: String,
            enum: ['primary', 'secondary'],
            default: 'primary'
        }
    }],

    // Schedule
    schedule: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: Date,
        timezone: String
    },

    // Results tracking
    results: {
        participants: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            variant: String,
            firstSeen: Date,
            lastSeen: Date,
            events: [{
                type: String,
                timestamp: Date,
                data: Schema.Types.Mixed
            }]
        }],
        metrics: [{
            name: String,
            variant: String,
            value: Number,
            confidence: Number,
            sampleSize: Number
        }],
        winner: {
            variant: String,
            confidence: Number,
            improvement: Number,
            declaredAt: Date
        }
    },

    // Feature flags specific
    featureFlag: {
        key: String,
        defaultValue: Schema.Types.Mixed,
        rules: [{
            condition: Schema.Types.Mixed,
            value: Schema.Types.Mixed,
            priority: Number
        }]
    },

    // Metadata
    metadata: {
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        team: String,
        tags: [String],
        hypothesis: String,
        expectedOutcome: String,
        risks: [String],
        notes: String
    }
}, {
    timestamps: true
});

// Indexes
experimentSchema.index({ name: 1 });
experimentSchema.index({ status: 1 });
experimentSchema.index({ 'schedule.startDate': 1 });
experimentSchema.index({ 'metadata.creator': 1 });

// Methods
experimentSchema.methods = {
    // Get experiment results
    async getResults() {
        const results = {
            summary: this.calculateResultsSummary(),
            variantPerformance: this.calculateVariantPerformance(),
            statisticalSignificance: this.calculateStatisticalSignificance(),
            recommendations: this.generateRecommendations()
        };
        return results;
    },

    // Calculate results summary
    calculateResultsSummary() {
        const summary = {
            totalParticipants: this.results.participants.length,
            variantDistribution: this.calculateVariantDistribution(),
            overallImprovement: this.calculateOverallImprovement(),
            confidence: this.calculateConfidenceLevel()
        };
        return summary;
    },

    // Calculate variant performance
    calculateVariantPerformance() {
        const performance = {};
        this.variants.forEach(variant => {
            const variantMetrics = this.results.metrics.filter(m => m.variant === variant.name);
            performance[variant.name] = {
                participants: this.results.participants.filter(p => p.variant === variant.name).length,
                metrics: variantMetrics,
                improvement: this.calculateVariantImprovement(variant.name)
            };
        });
        return performance;
    },

    // Check if user is in experiment
    async isUserInExperiment(userId) {
        // Check if user matches targeting criteria
        const user = await model('User').findById(userId);
        if (!user) return false;

        return this.audience.segments.every(segment => {
            return this.evaluateSegment(segment, user);
        });
    },

    // Assign variant to user
    assignVariant(userId) {
        // Consistent hashing to ensure same user gets same variant
        const hash = this.generateHash(`${userId}-${this.name}`);
        const normalizedHash = hash % 100;

        let cumulative = 0;
        for (const variant of this.variants) {
            cumulative += variant.weight;
            if (normalizedHash < cumulative) {
                return variant.name;
            }
        }
        return this.variants[0].name; // Fallback to first variant
    },

    // Track event
    async trackEvent(userId, eventType, eventData) {
        const participant = this.results.participants.find(p => p.userId.equals(userId));
        if (!participant) return;

        participant.events.push({
            type: eventType,
            timestamp: new Date(),
            data: eventData
        });
        participant.lastSeen = new Date();

        await this.save();
    }
};

// Statics
experimentSchema.statics = {
    // Get active experiments for user
    async getActiveExperimentsForUser(userId) {
        const experiments = await this.find({
            status: 'running',
            'schedule.startDate': { $lte: new Date() },
            $or: [
                { 'schedule.endDate': { $gt: new Date() } },
                { 'schedule.endDate': null }
            ]
        });

        return experiments.filter(async exp => await exp.isUserInExperiment(userId));
    },

    // Get experiment insights
    async getExperimentInsights(timeframe = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);

        return this.aggregate([
            {
                $match: {
                    status: { $in: ['running', 'completed'] },
                    'schedule.startDate': { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgImprovement: { $avg: '$results.winner.improvement' },
                    successRate: {
                        $avg: {
                            $cond: [
                                { $gt: ['$results.winner.improvement', 0] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
    }
};

module.exports = model('Experiment', experimentSchema);
