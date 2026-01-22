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
 * POST /api/upload/video
 * Upload a video file
 * Requires: multipart/form-data with 'video' field
 */
router.post('/video', authenticateToken, uploadController.uploadVideo, uploadController.uploadVideoFile);

module.exports = router;

