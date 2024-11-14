const { Schema, model } = require('mongoose');

const analyticsSchema = new Schema({
    // Time-based tracking
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    timeframe: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        required: true
    },

    // User metrics
    userMetrics: {
        totalUsers: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 },
        newUsers: { type: Number, default: 0 },
        churned: { type: Number, default: 0 },
        userSegments: [{
            segment: String,
            count: Number,
            growth: Number
        }],
        demographics: {
            industries: [{
                name: String,
                count: Number
            }],
            companySize: [{
                range: String,
                count: Number
            }],
            regions: [{
                name: String,
                count: Number
            }]
        }
    },

    // Revenue metrics
    revenueMetrics: {
        mrr: { type: Number, default: 0 },
        arr: { type: Number, default: 0 },
        growth: { type: Number, default: 0 },
        churn: { type: Number, default: 0 },
        subscriptions: {
            free: { type: Number, default: 0 },
            pro: { type: Number, default: 0 },
            enterprise: { type: Number, default: 0 }
        },
        revenueByPlan: {
            free: { type: Number, default: 0 },
            pro: { type: Number, default: 0 },
            enterprise: { type: Number, default: 0 }
        },
        ltv: { type: Number, default: 0 },
        cac: { type: Number, default: 0 },
        paybackPeriod: { type: Number, default: 0 }
    },

    // Usage metrics
    usageMetrics: {
        totalListings: { type: Number, default: 0 },
        activeListings: { type: Number, default: 0 },
        listingsByPlatform: [{
            platform: String,
            count: Number,
            growth: Number
        }],
        apiCalls: { type: Number, default: 0 },
        storageUsed: { type: Number, default: 0 },
        aiRequests: {
            total: { type: Number, default: 0 },
            byType: [{
                type: String,
                count: Number
            }]
        }
    },

    // Performance metrics
    performanceMetrics: {
        systemHealth: {
            uptime: Number,
            responseTime: Number,
            errorRate: Number,
            serverLoad: Number
        },
        apiPerformance: [{
            endpoint: String,
            calls: Number,
            avgResponseTime: Number,
            errorRate: Number
        }],
        databaseMetrics: {
            queryTime: Number,
            connections: Number,
            cacheHitRate: Number
        }
    },

    // Business metrics
    businessMetrics: {
        salesMetrics: {
            totalSales: { type: Number, default: 0 },
            averageOrderValue: { type: Number, default: 0 },
            conversionRate: { type: Number, default: 0 },
            platformBreakdown: [{
                platform: String,
                sales: Number,
                revenue: Number
            }]
        },
        marketingMetrics: {
            ctr: { type: Number, default: 0 },
            cpc: { type: Number, default: 0 },
            campaignPerformance: [{
                campaign: String,
                spend: Number,
                conversions: Number,
                roi: Number
            }]
        },
        customerSuccess: {
            ticketCount: { type: Number, default: 0 },
            resolutionTime: { type: Number, default: 0 },
            satisfaction: { type: Number, default: 0 },
            nps: { type: Number, default: 0 }
        }
    },

    // Feature usage
    featureUsage: [{
        feature: String,
        totalUses: Number,
        uniqueUsers: Number,
        avgTimeSpent: Number,
        completion: Number
    }],

    // Experiment results
    experiments: [{
        name: String,
        variant: String,
        participants: Number,
        conversions: Number,
        revenue: Number
    }],

    // Growth indicators
    growthMetrics: {
        virality: {
            k: Number,
            referrals: Number,
            invites: Number
        },
        retention: {
            day1: Number,
            day7: Number,
            day30: Number,
            day90: Number
        },
        engagement: {
            dau: Number,
            wau: Number,
            mau: Number,
            dauByPlatform: [{
                platform: String,
                count: Number
            }]
        }
    }
}, {
    timestamps: true
});

// Indexes
analyticsSchema.index({ timestamp: 1, timeframe: 1 });
analyticsSchema.index({ 'userMetrics.totalUsers': 1 });
analyticsSchema.index({ 'revenueMetrics.mrr': 1 });

// Methods
analyticsSchema.methods = {
    // Calculate key business metrics
    calculateBusinessMetrics() {
        const metrics = {
            revenueGrowth: this.calculateRevenueGrowth(),
            userGrowth: this.calculateUserGrowth(),
            unitEconomics: this.calculateUnitEconomics(),
            efficiency: this.calculateEfficiencyMetrics()
        };
        return metrics;
    },

    // Calculate revenue growth
    calculateRevenueGrowth() {
        return {
            mrrGrowth: this.revenueMetrics.growth,
            arrGrowth: (this.revenueMetrics.arr / this.revenueMetrics.mrr * 12) - 1,
            netRevenue: this.revenueMetrics.mrr - this.revenueMetrics.churn
        };
    },

    // Calculate user growth
    calculateUserGrowth() {
        return {
            netGrowth: this.userMetrics.newUsers - this.userMetrics.churned,
            growthRate: (this.userMetrics.newUsers / this.userMetrics.totalUsers) * 100,
            churnRate: (this.userMetrics.churned / this.userMetrics.totalUsers) * 100
        };
    },

    // Calculate unit economics
    calculateUnitEconomics() {
        return {
            ltvCacRatio: this.revenueMetrics.ltv / this.revenueMetrics.cac,
            paybackPeriod: this.revenueMetrics.paybackPeriod,
            grossMargin: this.calculateGrossMargin()
        };
    },

    // Calculate efficiency metrics
    calculateEfficiencyMetrics() {
        return {
            cashEfficiency: this.calculateCashEfficiency(),
            operatingEfficiency: this.calculateOperatingEfficiency(),
            salesEfficiency: this.calculateSalesEfficiency()
        };
    }
};

// Statics
analyticsSchema.statics = {
    // Get growth trends
    async getGrowthTrends(timeframe = 'monthly', limit = 12) {
        return this.aggregate([
            { $match: { timeframe } },
            { $sort: { timestamp: -1 } },
            { $limit: limit },
            { $project: {
                timestamp: 1,
                mrr: '$revenueMetrics.mrr',
                users: '$userMetrics.totalUsers',
                listings: '$usageMetrics.totalListings'
            }}
        ]);
    },

    // Get cohort analysis
    async getCohortAnalysis(cohortSize = 30) {
        return this.aggregate([
            { $group: {
                _id: {
                    cohort: {
                        $floor: {
                            $divide: [
                                { $subtract: ['$timestamp', new Date(0)] },
                                1000 * 60 * 60 * 24 * cohortSize
                            ]
                        }
                    }
                },
                retention: { $push: '$growthMetrics.retention' }
            }},
            { $sort: { '_id.cohort': -1 } }
        ]);
    },

    // Get platform performance
    async getPlatformPerformance(timeframe = 'monthly') {
        return this.aggregate([
            { $match: { timeframe } },
            { $unwind: '$businessMetrics.salesMetrics.platformBreakdown' },
            { $group: {
                _id: '$businessMetrics.salesMetrics.platformBreakdown.platform',
                totalSales: { $sum: '$businessMetrics.salesMetrics.platformBreakdown.sales' },
                totalRevenue: { $sum: '$businessMetrics.salesMetrics.platformBreakdown.revenue' }
            }}
        ]);
    }
};

module.exports = model('Analytics', analyticsSchema);
