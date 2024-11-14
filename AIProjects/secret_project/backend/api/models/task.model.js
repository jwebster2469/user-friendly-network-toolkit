const { Schema, model } = require('mongoose');

const taskSchema = new Schema({
    // Basic task information
    name: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            // Data processing tasks
            'data_sync',
            'data_import',
            'data_export',
            'data_cleanup',
            
            // Integration tasks
            'marketplace_sync',
            'inventory_update',
            'price_update',
            'order_sync',
            
            // Media processing
            'image_optimization',
            'video_processing',
            'file_conversion',
            
            // AI/ML tasks
            'model_training',
            'prediction_generation',
            'content_generation',
            'trend_analysis',
            
            // System tasks
            'system_backup',
            'system_maintenance',
            'cache_cleanup',
            'log_rotation',
            
            // User tasks
            'report_generation',
            'notification_dispatch',
            'email_campaign',
            'user_onboarding',
            
            // Custom tasks
            'custom'
        ],
        required: true
    },

    // Task status
    status: {
        type: String,
        enum: [
            'pending',
            'scheduled',
            'running',
            'paused',
            'completed',
            'failed',
            'cancelled',
            'timeout'
        ],
        default: 'pending',
        index: true
    },

    // Priority and scheduling
    priority: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    schedule: {
        startAt: Date,
        timeout: Number,
        retryLimit: {
            type: Number,
            default: 3
        },
        retryDelay: {
            type: Number,
            default: 300 // 5 minutes in seconds
        },
        recurring: {
            pattern: String, // Cron pattern
            timezone: String,
            lastRun: Date,
            nextRun: Date
        }
    },

    // Task configuration
    config: {
        queue: {
            type: String,
            default: 'default'
        },
        concurrency: {
            type: Number,
            default: 1
        },
        timeout: {
            type: Number,
            default: 3600 // 1 hour in seconds
        },
        retryStrategy: {
            type: String,
            enum: ['exponential', 'linear', 'fixed'],
            default: 'exponential'
        }
    },

    // Task data
    data: {
        input: Schema.Types.Mixed,
        output: Schema.Types.Mixed,
        params: Schema.Types.Mixed,
        state: Schema.Types.Mixed
    },

    // Progress tracking
    progress: {
        current: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        steps: [{
            name: String,
            status: String,
            startTime: Date,
            endTime: Date,
            duration: Number
        }]
    },

    // Error handling
    errors: [{
        code: String,
        message: String,
        stack: String,
        timestamp: Date,
        attempt: Number,
        handled: Boolean
    }],

    // Performance metrics
    metrics: {
        duration: Number,
        memory: {
            start: Number,
            peak: Number,
            end: Number
        },
        cpu: {
            usage: Number,
            system: Number,
            user: Number
        }
    },

    // Dependencies
    dependencies: [{
        taskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        },
        type: {
            type: String,
            enum: ['hard', 'soft']
        },
        status: String
    }],

    // Ownership and access
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignee: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    visibility: {
        type: String,
        enum: ['private', 'public', 'system'],
        default: 'private'
    },

    // Logging and monitoring
    logs: [{
        level: {
            type: String,
            enum: ['debug', 'info', 'warn', 'error']
        },
        message: String,
        timestamp: Date,
        metadata: Schema.Types.Mixed
    }],
    monitoring: {
        alerts: [{
            type: String,
            message: String,
            timestamp: Date,
            acknowledged: Boolean
        }],
        checkpoints: [{
            name: String,
            status: String,
            timestamp: Date
        }]
    },

    // Metadata
    metadata: {
        source: {
            type: String,
            enum: ['user', 'system', 'integration', 'scheduled'],
            default: 'user'
        },
        tags: [String],
        environment: {
            type: String,
            enum: ['production', 'staging', 'development'],
            default: 'production'
        },
        version: String,
        customData: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
taskSchema.index({ status: 1, priority: -1 });
taskSchema.index({ 'schedule.startAt': 1 });
taskSchema.index({ owner: 1 });
taskSchema.index({ type: 1 });

// Methods
taskSchema.methods = {
    // Start task execution
    async start() {
        this.status = 'running';
        this.progress.steps.push({
            name: 'start',
            status: 'completed',
            startTime: new Date(),
            endTime: new Date(),
            duration: 0
        });
        await this.save();
    },

    // Update task progress
    async updateProgress(current, total) {
        this.progress.current = current;
        this.progress.total = total;
        this.progress.percentage = (current / total) * 100;
        await this.save();
    },

    // Log task message
    async log(level, message, metadata = {}) {
        this.logs.push({
            level,
            message,
            timestamp: new Date(),
            metadata
        });
        await this.save();
    },

    // Handle task error
    async handleError(error) {
        this.errors.push({
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message,
            stack: error.stack,
            timestamp: new Date(),
            attempt: this.errors.length + 1,
            handled: false
        });

        if (this.errors.length >= this.schedule.retryLimit) {
            this.status = 'failed';
        }

        await this.save();
    },

    // Complete task
    async complete(output = null) {
        this.status = 'completed';
        this.data.output = output;
        this.metrics.duration = Date.now() - this.createdAt;
        await this.save();
    }
};

// Statics
taskSchema.statics = {
    // Get queue metrics
    async getQueueMetrics() {
        return this.aggregate([
            {
                $group: {
                    _id: '$config.queue',
                    total: { $sum: 1 },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
                        }
                    },
                    running: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'running'] }, 1, 0]
                        }
                    },
                    failed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                        }
                    },
                    avgDuration: { $avg: '$metrics.duration' }
                }
            }
        ]);
    },

    // Get task statistics
    async getTaskStats(timeframe = 24) {
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
                    _id: '$type',
                    total: { $sum: 1 },
                    successful: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    failed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                        }
                    },
                    avgDuration: { $avg: '$metrics.duration' }
                }
            }
        ]);
    }
};

module.exports = model('Task', taskSchema);
