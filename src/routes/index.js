const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const musicRoutes = require('./music.routes');
const podcastRoutes = require('./podcast.routes');
const playlistRoutes = require('./playlist.routes');
const adminRoutes = require('./admin.routes');
const audioRoutes = require('./audio.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/music', musicRoutes);
router.use('/podcasts', podcastRoutes);
router.use('/playlists', playlistRoutes);
router.use('/admin', adminRoutes);
router.use('/audio', audioRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'SoundVerse API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      music: '/api/music',
      podcasts: '/api/podcasts',
      playlists: '/api/playlists',
      admin: '/api/admin'
    }
  });
});

module.exports = router;