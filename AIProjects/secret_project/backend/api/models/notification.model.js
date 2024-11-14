const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
    // Recipient
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Notification content
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            // System notifications
            'system_alert',
            'system_maintenance',
            'system_update',
            
            // User notifications
            'account_update',
            'security_alert',
            'payment_update',
            'subscription_update',
            
            // Feature notifications
            'feature_announcement',
            'feature_update',
            'feature_deprecation',
            
            // Integration notifications
            'integration_error',
            'integration_sync',
            'integration_auth',
            
            // Listing notifications
            'listing_update',
            'listing_performance',
            'listing_error',
            
            // Marketing notifications
            'promotion',
            'newsletter',
            'product_update',
            
            // Audit notifications
            'security_audit',
            'compliance_update',
            'policy_change',
            
            // Custom notifications
            'custom'
        ],
        required: true
    },

    // Priority and categorization
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['system', 'account', 'feature', 'integration', 'listing', 'marketing', 'audit', 'custom'],
        required: true
    },

    // Delivery status
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
        default: 'pending'
    },

    // Delivery channels
    channels: [{
        type: {
            type: String,
            enum: ['email', 'push', 'in_app', 'sms', 'webhook'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed'],
            default: 'pending'
        },
        sentAt: Date,
        deliveredAt: Date,
        failureReason: String,
        retryCount: {
            type: Number,
            default: 0
        }
    }],

    // Action data
    action: {
        type: {
            type: String,
            enum: ['link', 'button', 'deep_link', 'custom'],
            required: function() {
                return this.action !== undefined;
            }
        },
        url: String,
        label: String,
        data: Schema.Types.Mixed
    },

    // Rich content
    content: {
        html: String,
        template: String,
        variables: Schema.Types.Mixed,
        attachments: [{
            type: String,
            url: String,
            name: String,
            size: Number
        }]
    },

    // Scheduling
    schedule: {
        sendAt: Date,
        expiresAt: Date,
        timezone: String,
        recurring: {
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly', 'custom']
            },
            pattern: String,
            lastSent: Date,
            nextSend: Date
        }
    },

    // User interaction
    interaction: {
        read: {
            type: Boolean,
            default: false
        },
        readAt: Date,
        clicked: {
            type: Boolean,
            default: false
        },
        clickedAt: Date,
        dismissed: {
            type: Boolean,
            default: false
        },
        dismissedAt: Date
    },

    // Related entities
    references: [{
        model: {
            type: String,
            enum: ['User', 'Listing', 'Integration', 'Experiment', 'Analytics']
        },
        id: Schema.Types.ObjectId
    }],

    // Metadata
    metadata: {
        source: {
            type: String,
            enum: ['system', 'user', 'integration', 'marketing', 'audit'],
            default: 'system'
        },
        tags: [String],
        campaign: String,
        customData: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, status: 1 });
notificationSchema.index({ 'schedule.sendAt': 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ type: 1, priority: 1 });

// Methods
notificationSchema.methods = {
    // Mark as read
    async markAsRead() {
        this.status = 'read';
        this.interaction.read = true;
        this.interaction.readAt = new Date();
        await this.save();
    },

    // Mark as sent
    async markAsSent(channel) {
        const channelConfig = this.channels.find(c => c.type === channel);
        if (channelConfig) {
            channelConfig.status = 'sent';
            channelConfig.sentAt = new Date();
            await this.save();
        }
    },

    // Handle delivery status
    async updateDeliveryStatus(channel, status, details = {}) {
        const channelConfig = this.channels.find(c => c.type === channel);
        if (channelConfig) {
            channelConfig.status = status;
            if (status === 'delivered') {
                channelConfig.deliveredAt = new Date();
            } else if (status === 'failed') {
                channelConfig.failureReason = details.reason;
                channelConfig.retryCount += 1;
            }
            await this.save();
        }
    },

    // Check if expired
    isExpired() {
        if (!this.schedule.expiresAt) return false;
        return new Date() > this.schedule.expiresAt;
    },

    // Get next send time for recurring notifications
    calculateNextSendTime() {
        if (!this.schedule.recurring) return null;
        // Implementation depends on recurring pattern
        return null;
    }
};

// Statics
notificationSchema.statics = {
    // Get unread notifications
    async getUnreadNotifications(userId) {
        return this.find({
            user: userId,
            'interaction.read': false,
            $or: [
                { 'schedule.expiresAt': { $gt: new Date() } },
                { 'schedule.expiresAt': null }
            ]
        }).sort({ createdAt: -1 });
    },

    // Get notification statistics
    async getNotificationStats(userId, timeframe = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);

        return this.aggregate([
            {
                $match: {
                    user: userId,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: 1 },
                    read: {
                        $sum: {
                            $cond: ['$interaction.read', 1, 0]
                        }
                    },
                    clicked: {
                        $sum: {
                            $cond: ['$interaction.clicked', 1, 0]
                        }
                    }
                }
            }
        ]);
    },

    // Get delivery success rate
    async getDeliveryStats(timeframe = 24) {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - timeframe);

        return this.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $unwind: '$channels'
            },
            {
                $group: {
                    _id: '$channels.type',
                    total: { $sum: 1 },
                    delivered: {
                        $sum: {
                            $cond: [
                                { $eq: ['$channels.status', 'delivered'] },
                                1,
                                0
                            ]
                        }
                    },
                    failed: {
                        $sum: {
                            $cond: [
                                { $eq: ['$channels.status', 'failed'] },
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

module.exports = model('Notification', notificationSchema);
