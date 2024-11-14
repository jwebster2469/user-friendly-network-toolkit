const express = require('express');
const axios = require('axios');
const router = express.Router();

// Dashboard endpoint to fetch local opportunities and trending items
router.get('/opportunities', async (req, res) => {
    const { location } = req.query; // User's location for local searches

    try {
        // Fetch local opportunities using Google Places API
        const localOpportunities = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
            params: {
                location: location,
                radius: 5000, // 5 km radius
                key: process.env.GOOGLE_PLACES_API_KEY, // Use environment variable
            },
        });

        // Fetch trending items from Amazon or other platforms
        const trendingItems = await axios.get(`https://api.amazon.com/products`, {
            params: {
                api_key: process.env.AMAZON_API_KEY,
                associate_tag: process.env.AMAZON_ASSOCIATE_TAG,
            },
        });

        // Combine and analyze data for profitability (placeholder logic)
        const opportunities = localOpportunities.data.results.map(opportunity => {
            return {
                name: opportunity.name,
                address: opportunity.vicinity,
                // Placeholder for profitability calculation
                profitability: Math.random() * 100, // Replace with actual calculation
            };
        });

        res.json({ opportunities, trendingItems: trendingItems.data });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;
