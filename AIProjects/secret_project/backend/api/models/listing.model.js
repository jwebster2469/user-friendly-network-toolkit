const { Schema, model } = require('mongoose');
const slugify = require('slugify');
const config = require('../../../config/config');

const listingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        original: { type: String, required: true },
        optimized: String,
        aiSuggestions: [{
            text: String,
            confidence: Number,
            usedAt: Date
        }]
    },
    description: {
        original: { type: String, required: true },
        optimized: String,
        aiSuggestions: [{
            text: String,
            confidence: Number,
            usedAt: Date
        }]
    },
    slug: {
        type: String,
        unique: true
    },
    category: {
        primary: { type: String, required: true },
        secondary: [String],
        attributes: Schema.Types.Mixed
    },
    price: {
        current: { type: Number, required: true },
        original: Number,
        currency: { type: String, default: 'USD' },
        history: [{
            value: Number,
            date: Date
        }],
        aiSuggestions: [{
            value: Number,
            confidence: Number,
            reasoning: String,
            date: Date
        }]
    },
    inventory: {
        quantity: { type: Number, required: true },
        sku: String,
        barcode: String,
        location: String,
        threshold: Number,
        restockDate: Date
    },
    media: {
        images: [{
            url: { type: String, required: true },
            alt: String,
            primary: Boolean,
            optimized: {
                url: String,
                quality: Number,
                size: Number
            },
            aiAnalysis: {
                tags: [String],
                quality: Number,
                suggestions: [String]
            }
        }],
        videos: [{
            url: String,
            thumbnail: String,
            duration: Number
        }]
    },
    marketplaces: [{
        platform: {
            type: String,
            enum: ['amazon', 'ebay', 'facebook', 'etsy', 'shopify'],
            required: true
        },
        status: {
            type: String,
            enum: ['draft', 'pending', 'active', 'paused', 'ended'],
            default: 'draft'
        },
        externalId: String,
        url: String,
        performance: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
            saves: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            inquiries: { type: Number, default: 0 },
            sales: { type: Number, default: 0 },
            revenue: { type: Number, default: 0 }
        },
        sync: {
            lastSync: Date,
            status: String,
            errors: [{
                message: String,
                date: Date
            }]
        }
    }],
    seo: {
        keywords: [String],
        metaTitle: String,
        metaDescription: String,
        canonicalUrl: String,
        structuredData: Schema.Types.Mixed
    },
    analytics: {
        views: { type: Number, default: 0 },
        uniqueViews: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        averageTimeOnPage: Number,
        bounceRate: Number,
        searchImpressions: { type: Number, default: 0 },
        searchClicks: { type: Number, default: 0 },
        searchPosition: Number
    },
    optimization: {
        score: { type: Number, default: 0 },
        suggestions: [{
            type: String,
            description: String,
            impact: Number,
            implemented: Boolean,
            implementedAt: Date
        }],
        tests: [{
            type: String,
            variant: String,
            startDate: Date,
            endDate: Date,
            results: Schema.Types.Mixed
        }]
    },
    marketAnalysis: {
        competitivePricing: [{
            platform: String,
            averagePrice: Number,
            lowestPrice: Number,
            highestPrice: Number,
            date: Date
        }],
        demandMetrics: [{
            score: Number,
            trend: String,
            date: Date
        }],
        seasonality: {
            peak: [String],
            low: [String],
            factors: [String]
        }
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'paused', 'ended', 'deleted'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'private'
    },
    flags: {
        featured: { type: Boolean, default: false },
        promoted: { type: Boolean, default: false },
        needsReview: { type: Boolean, default: false },
        hasIssues: { type: Boolean, default: false }
    },
    metadata: {
        source: String,
        importId: String,
        batch: String,
        tags: [String],
        customFields: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
listingSchema.index({ slug: 1 });
listingSchema.index({ 'category.primary': 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ createdAt: 1 });
listingSchema.index({ 'marketplaces.platform': 1, 'marketplaces.status': 1 });
listingSchema.index({ 'price.current': 1 });

// Pre-save middleware
listingSchema.pre('save', async function(next) {
    if (this.isModified('title.original')) {
        this.slug = await this.generateUniqueSlug();
    }
    next();
});

// Methods
listingSchema.methods = {
    // Generate unique slug
    async generateUniqueSlug() {
        const baseSlug = slugify(this.title.original, { lower: true });
        let slug = baseSlug;
        let counter = 1;
        
        while (await this.constructor.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        return slug;
    },

    // Update marketplace performance
    async updatePerformance(platform, metrics) {
        const marketplace = this.marketplaces.find(m => m.platform === platform);
        if (marketplace) {
            Object.assign(marketplace.performance, metrics);
            await this.save();
        }
    },

    // Calculate optimization score
    calculateOptimizationScore() {
        let score = 0;
        const weights = config.optimizationWeights;

        // Title optimization
        if (this.title.optimized) score += weights.title;
        
        // Description optimization
        if (this.description.optimized) score += weights.description;
        
        // Images optimization
        const optimizedImages = this.media.images.filter(img => img.optimized).length;
        score += (optimizedImages / this.media.images.length) * weights.images;
        
        // Price optimization
        if (this.price.aiSuggestions.length > 0) score += weights.price;
        
        // SEO optimization
        if (this.seo.keywords.length > 0) score += weights.seo;

        return Math.min(score, 100);
    },

    // Get market insights
    async getMarketInsights() {
        return {
            pricing: await this.getCompetitivePricing(),
            demand: await this.getDemandMetrics(),
            seasonality: this.marketAnalysis.seasonality
        };
    },

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            totalViews: this.marketplaces.reduce((sum, m) => sum + m.performance.views, 0),
            totalSales: this.marketplaces.reduce((sum, m) => sum + m.performance.sales, 0),
            totalRevenue: this.marketplaces.reduce((sum, m) => sum + m.performance.revenue, 0),
            conversionRate: this.analytics.conversionRate,
            platformMetrics: this.marketplaces.map(m => ({
                platform: m.platform,
                metrics: m.performance
            }))
        };
    }
};

// Statics
listingSchema.statics = {
    // Get top performing listings
    async getTopPerforming(criteria = {}, limit = 10) {
        return this.aggregate([
            { $match: criteria },
            { $addFields: {
                totalRevenue: {
                    $sum: '$marketplaces.performance.revenue'
                }
            }},
            { $sort: { totalRevenue: -1 } },
            { $limit: limit }
        ]);
    },

    // Get category insights
    async getCategoryInsights(category) {
        return this.aggregate([
            { $match: { 'category.primary': category } },
            { $group: {
                _id: null,
                averagePrice: { $avg: '$price.current' },
                totalListings: { $sum: 1 },
                totalSales: { 
                    $sum: {
                        $sum: '$marketplaces.performance.sales'
                    }
                }
            }}
        ]);
    }
};

module.exports = model('Listing', listingSchema);
