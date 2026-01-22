/**
 * Upload controller
 * Handles file uploads (images, videos, files, audio)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Audio storage configuration
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

// Audio file filter
const audioFileFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|ogg|m4a|aac|webm|opus/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /audio/.test(file.mimetype);

  // Accept if it's an audio mimetype OR has an allowed extension
  // This handles cases where files are created from blobs
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed (mp3, wav, ogg, m4a, aac, webm, opus)'));
  }
};

// Audio upload middleware
const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for audio
  },
  fileFilter: audioFileFilter
});

// Video storage configuration
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// Video file filter
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|mov|avi|mkv|flv|wmv|m4v/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video/.test(file.mimetype);

  // Accept if it's a video mimetype OR has an allowed extension
  // This handles cases where files are created from blobs
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, mov, avi, mkv, flv, wmv, m4v)'));
  }
};

// Video upload middleware
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: videoFileFilter
});

/**
 * Upload an image
 * POST /api/upload/image
 */
function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL to access the image
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

/**
 * Upload a video file
 * POST /api/upload/video
 */
function uploadVideoFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Return the URL to access the video file
    const videoUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Video uploaded successfully',
      url: videoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
}

/**
 * Upload an audio file
 * POST /api/upload/audio
 */
function uploadAudioFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // Return the URL to access the audio file
    const audioUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Audio uploaded successfully',
      url: audioUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
}

module.exports = {
  uploadImage,
  upload: upload.single('image'), // Middleware for single image upload
  uploadVideoFile,
  uploadVideo: uploadVideo.single('video'), // Middleware for single video upload
  uploadAudioFile,
  uploadAudio: uploadAudio.single('audio') // Middleware for single audio upload
};
