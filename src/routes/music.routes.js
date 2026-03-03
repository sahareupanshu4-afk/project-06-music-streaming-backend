const express = require('express');
const router = express.Router();
const musicController = require('../controllers/music.controller');
const { protect } = require('../middlewares/auth.middleware');

// ============ Local Database Routes ============

// Public routes
router.get('/', musicController.getAllTracks);
router.get('/search', musicController.searchTracks);
router.get('/realm/:realm', musicController.getByRealm);
router.get('/energy/:energy', musicController.getByEnergy);
router.get('/top', musicController.getTopPlayed);
router.get('/:id', musicController.getTrack);

// Protected routes
router.post('/:id/play', protect, musicController.recordPlay);

// ============ Music Discovery Routes (External APIs) ============

// Combined discovery (MusicBrainz + TheAudioDB)
router.get('/discover/search', musicController.discoverMusic);
router.get('/discover/artists', musicController.discoverArtists);
router.get('/discover/albums', musicController.discoverAlbums);
router.get('/discover/artist/:name', musicController.getArtistDetails);
router.get('/discover/album/:id', musicController.getAlbumDetails);
router.get('/discover/artist/:name/popular', musicController.getArtistPopularTracks);

// Direct MusicBrainz access
router.get('/musicbrainz/search', musicController.searchMusicBrainz);
router.get('/musicbrainz/:type/:mbid', musicController.getMusicBrainzEntity);

// Direct TheAudioDB access
router.get('/audiodb/search', musicController.searchAudioDB);
router.get('/audiodb/:type/:id', musicController.getAudioDBEntity);

module.exports = router;