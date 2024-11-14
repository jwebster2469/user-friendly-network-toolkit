const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../../config/config');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'founder'],
        default: 'user'
    },
    company: {
        name: String,
        size: String,
        industry: String
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'inactive'
        },
        startDate: Date,
        endDate: Date,
        paymentMethod: {
            type: Schema.Types.ObjectId,
            ref: 'PaymentMethod'
        }
    },
    usage: {
        listings: {
            count: { type: Number, default: 0 },
            lastUsed: Date
        },
        apiCalls: {
            count: { type: Number, default: 0 },
            lastUsed: Date
        },
        storage: {
            used: { type: Number, default: 0 }, // in bytes
            limit: { type: Number, default: 1073741824 } // 1GB default
        }
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        marketplaces: [{
            name: String,
            enabled: Boolean,
            credentials: Schema.Types.Mixed
        }],
        theme: {
            mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
            color: String
        }
    },
    analytics: {
        lastLogin: Date,
        loginCount: { type: Number, default: 0 },
        deviceInfo: [{
            userAgent: String,
            ip: String,
            lastUsed: Date
        }],
        conversionRate: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
    },
    onboarding: {
        completed: { type: Boolean, default: false },
        steps: [{
            name: String,
            completed: Boolean,
            completedAt: Date
        }],
        lastStep: String
    },
    integrations: [{
        name: String,
        type: String,
        config: Schema.Types.Mixed,
        status: String,
        lastSync: Date
    }],
    feedback: [{
        type: String,
        content: String,
        rating: Number,
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'company.name': 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ createdAt: 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Methods
userSchema.methods = {
    // Generate JWT token
    generateToken() {
        return jwt.sign(
            { 
                id: this._id,
                role: this.role,
                subscription: this.subscription.plan
            },
            config.jwt.secret,
            { expiresIn: config.jwt.accessExpirationSeconds }
        );
    },

    // Compare password
    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    },

    // Update usage statistics
    async updateUsage(type, amount = 1) {
        const update = {};
        update[`usage.${type}.count`] = amount;
        update[`usage.${type}.lastUsed`] = new Date();
        
        await this.model('User').updateOne(
            { _id: this._id },
            { $inc: { [`usage.${type}.count`]: amount },
              $set: { [`usage.${type}.lastUsed`]: new Date() }
            }
        );
    },

    // Check subscription limits
    async checkUsageLimits() {
        const limits = config.subscriptionLimits[this.subscription.plan];
        return {
            listings: this.usage.listings.count < limits.listings,
            apiCalls: this.usage.apiCalls.count < limits.apiCalls,
            storage: this.usage.storage.used < limits.storage
        };
    },

    // Track analytics
    async trackAnalytics(data) {
        const update = {
            $set: {
                'analytics.lastLogin': new Date(),
            },
            $inc: {
                'analytics.loginCount': 1
            }
        };

        if (data.deviceInfo) {
            update.$push = {
                'analytics.deviceInfo': {
                    $each: [data.deviceInfo],
                    $slice: -5 // Keep only last 5 devices
                }
            };
        }

        await this.model('User').updateOne({ _id: this._id }, update);
    }
};

// Statics
userSchema.statics = {
    // Get user analytics
    async getAnalytics(filters = {}) {
        return this.aggregate([
            { $match: filters },
            { $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                averageRevenue: { $avg: '$analytics.revenue' },
                totalRevenue: { $sum: '$analytics.revenue' },
                conversionRate: { $avg: '$analytics.conversionRate' }
            }}
        ]);
    },

    // Get subscription metrics
    async getSubscriptionMetrics() {
        return this.aggregate([
            { $group: {
                _id: '$subscription.plan',
                count: { $sum: 1 },
                revenue: { $sum: '$analytics.revenue' }
            }}
        ]);
    }
};

module.exports = model('User', userSchema);
