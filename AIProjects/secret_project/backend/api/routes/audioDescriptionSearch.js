const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Vosk } = require('vosk');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');
const config = require('../../config/config');
const router = express.Router();

// Configure rate limiting
const audioSearchLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many audio search requests, please try again later'
});

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/audio');
        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only WAV and MP3 files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize
    }
});

// Validation middleware
const validateAudioUpload = [
    upload.single('audio'),
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        next();
    }
];

// Audio description search endpoint
router.post('/audio-description-search',
    audioSearchLimiter,
    validateAudioUpload,
    async (req, res) => {
        const audioPath = req.file.path;
        const audioFile = fs.createReadStream(audioPath);
        let recognizer;

        try {
            // Initialize Vosk recognizer
            const model = new Vosk.Model(config.vosk.modelPath);
            recognizer = new Vosk.Recognizer({ model: model, sampleRate: 16000 });

            let transcript = '';
            
            await new Promise((resolve, reject) => {
                audioFile.on('data', (data) => {
                    try {
                        if (recognizer.acceptWaveform(data)) {
                            transcript += recognizer.result().text + ' ';
                        }
                    } catch (error) {
                        reject(error);
                    }
                });

                audioFile.on('end', () => {
                    // Get final result
                    transcript += recognizer.finalResult().text;
                    resolve();
                });

                audioFile.on('error', (error) => {
                    reject(error);
                });
            });

            // Log successful transcription
            logger.info('Audio transcription completed successfully', {
                fileSize: req.file.size,
                duration: Date.now() - req.file.timestamp,
                transcriptLength: transcript.length
            });

            // Return transcript to the client
            res.json({
                success: true,
                transcript: transcript.trim(),
                metadata: {
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    processingTime: Date.now() - req.file.timestamp
                }
            });

        } catch (error) {
            logger.error('Error during audio transcription:', {
                error: error.message,
                stack: error.stack,
                fileInfo: req.file
            });

            res.status(500).json({
                success: false,
                error: 'Failed to process audio file',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });

        } finally {
            // Cleanup
            if (recognizer) {
                recognizer.free();
            }

            // Clean up the uploaded file
            fs.unlink(audioPath, (err) => {
                if (err) {
                    logger.error('Error deleting uploaded file:', {
                        error: err.message,
                        path: audioPath
                    });
                }
            });

            // Close the audio file stream if it's still open
            if (audioFile && !audioFile.closed) {
                audioFile.destroy();
            }
        }
    }
);

module.exports = router;
