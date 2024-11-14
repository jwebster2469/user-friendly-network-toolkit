const express = require('express');
const router = express.Router();
const axios = require('axios');

// OpenAI API credentials
const OPENAI_API_KEY = 'sk-proj-MRafFh5PRcp2OtkMFszdT3BlbkFJ4EEcH3GGCIphSsnFG2IE'; // Use your OpenAI API key

// Endpoint for AI-powered title generation
router.post('/generate-title', async (req, res) => {
    const { productDetails } = req.body;

    try {
        const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
            prompt: `Generate a catchy title for the following product: ${productDetails.name}`,
            max_tokens: 10,
            n: 1,
            stop: null,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const generatedTitle = response.data.choices[0].text.trim();
        res.json({ title: generatedTitle });
    } catch (error) {
        console.error('Error generating title:', error);
        res.status(500).json({ error: 'Failed to generate title' });
    }
});

module.exports = router;
