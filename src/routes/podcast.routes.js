const express = require('express');
const router = express.Router();
const podcastController = require('../controllers/podcast.controller');

// ============ Local Database Routes ============

router.get('/', podcastController.getAll);
router.get('/:id', podcastController.getById);

// ============ Podcast Discovery Routes (External APIs) ============

// API status check
router.get('/status/apis', podcastController.getApiStatus);

// Combined discovery (ListenNotes + PodcastIndex)
router.get('/discover/search', podcastController.discoverPodcasts);
router.get('/discover/trending', podcastController.getTrending);
router.get('/discover/episodes', podcastController.discoverEpisodes);
router.get('/discover/recent', podcastController.getRecentEpisodes);
router.get('/discover/categories', podcastController.getCategories);
router.get('/discover/podcast/:id', podcastController.getPodcastDetails);
router.get('/discover/podcast/:id/episodes', podcastController.getPodcastEpisodes);
router.get('/discover/episode/:id', podcastController.getEpisodeDetails);

// Direct ListenNotes access
router.get('/listennotes/search', podcastController.searchListenNotes);
router.get('/listennotes/best', podcastController.getBestPodcasts);
router.get('/listennotes/podcast/:id', podcastController.getListenNotesPodcast);
router.get('/listennotes/episode/:id', podcastController.getListenNotesEpisode);

// Direct PodcastIndex access
router.get('/podcastindex/search', podcastController.searchPodcastIndex);
router.get('/podcastindex/trending', podcastController.getPodcastIndexTrending);
router.get('/podcastindex/podcast/:id', podcastController.getPodcastIndexPodcast);

module.exports = router;