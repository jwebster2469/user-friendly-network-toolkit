const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({ dest: 'uploads/' });

// TinEye API credentials from environment variables
const TINEYE_API_URL = 'https://api.tineye.com/rest/';
const TINEYE_API_KEY = process.env.TINEYE_API_KEY; // Use environment variable

// Reverse image search endpoint
router.post('/reverse-image-search', upload.single('image'), async (req, res) => {
    try {
        const imagePath = req.file.path;

        // Call TinEye API for reverse image search
        const response = await axios.post(`${TINEYE_API_URL}search`, {
            image: imagePath,
            api_key: TINEYE_API_KEY
        });

        // Clean up the uploaded file
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });

        // Return search results to the client
        res.json(response.data);
    } catch (error) {
        console.error('Error during reverse image search:', error);
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data });
        }
        res.status(500).json({ error: 'Failed to perform reverse image search' });
    }
});

module.exports = router;
