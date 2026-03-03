const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlist.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, playlistController.getUserPlaylists);
router.get('/:id', playlistController.getById);
router.post('/', protect, playlistController.create);
router.post('/:id/tracks', protect, playlistController.addTrack);
router.delete('/:id/tracks/:trackId', protect, playlistController.removeTrack);
router.delete('/:id', protect, playlistController.delete);

module.exports = router;