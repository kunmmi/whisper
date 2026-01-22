/**
 * Upload routes
 * Handles file upload endpoints
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/upload/image
 * Upload an image file
 * Requires: multipart/form-data with 'image' field
 */
router.post('/image', authenticateToken, uploadController.upload, uploadController.uploadImage);

/**
 * POST /api/upload/audio
 * Upload an audio file
 * Requires: multipart/form-data with 'audio' field
 */
router.post('/audio', authenticateToken, uploadController.uploadAudio, uploadController.uploadAudioFile);

module.exports = router;

