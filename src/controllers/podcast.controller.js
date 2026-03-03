const podcastModel = require('../models/podcast.model');
const podcastDiscoveryService = require('../services/podcastDiscovery.service');
const listennotesService = require('../services/listennotes.service');
const podcastindexService = require('../services/podcastindex.service');

// ============ Local Database Operations ============

const getAll = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const { data, error } = await podcastModel.findAll({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { data, error } = await podcastModel.findById(req.params.id);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Podcast not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// ============ External API - Podcast Discovery ============

/**
 * Search podcasts across external APIs (ListenNotes + PodcastIndex)
 */
const discoverPodcasts = async (req, res, next) => {
  try {
    const { q, type, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await podcastDiscoveryService.search(q, {
      type: type || 'podcast',
      limit: parseInt(limit) || 20
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending podcasts
 */
const getTrending = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await podcastDiscoveryService.getTrending(parseInt(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get podcast details from external API
 */
const getPodcastDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Podcast ID required' });
    }

    const result = await podcastDiscoveryService.getPodcast(id, source || 'listennotes');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get episodes for a podcast
 */
const getPodcastEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source, limit } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Podcast ID required' });
    }

    const result = await podcastDiscoveryService.getEpisodes(
      id, 
      source || 'listennotes',
      parseInt(limit) || 20
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get episode details
 */
const getEpisodeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { source } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Episode ID required' });
    }

    const result = await podcastDiscoveryService.getEpisode(id, source || 'listennotes');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search podcast episodes
 */
const discoverEpisodes = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await podcastDiscoveryService.searchEpisodes(q, parseInt(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent episodes
 */
const getRecentEpisodes = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await podcastDiscoveryService.getRecentEpisodes(parseInt(limit) || 20);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get podcast categories/genres
 */
const getCategories = async (req, res, next) => {
  try {
    const result = await podcastDiscoveryService.getCategories();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============ Direct API Access ============

/**
 * Search ListenNotes directly
 */
const searchListenNotes = async (req, res, next) => {
  try {
    const { q, type, offset } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    if (!listennotesService.isConfigured()) {
      return res.status(503).json({ 
        error: 'ListenNotes API not configured',
        hint: 'Add LISTENNOTES_API_KEY to environment variables'
      });
    }

    const result = await listennotesService.search(q, {
      type: type || 'podcast',
      offset: parseInt(offset) || 0
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ListenNotes podcast by ID
 */
const getListenNotesPodcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!listennotesService.isConfigured()) {
      return res.status(503).json({ 
        error: 'ListenNotes API not configured',
        hint: 'Add LISTENNOTES_API_KEY to environment variables'
      });
    }

    const result = await listennotesService.getPodcast(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ListenNotes episode by ID
 */
const getListenNotesEpisode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!listennotesService.isConfigured()) {
      return res.status(503).json({ 
        error: 'ListenNotes API not configured',
        hint: 'Add LISTENNOTES_API_KEY to environment variables'
      });
    }

    const result = await listennotesService.getEpisode(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ListenNotes best podcasts
 */
const getBestPodcasts = async (req, res, next) => {
  try {
    const { genreId, page } = req.query;
    
    if (!listennotesService.isConfigured()) {
      return res.status(503).json({ 
        error: 'ListenNotes API not configured',
        hint: 'Add LISTENNOTES_API_KEY to environment variables'
      });
    }

    const result = await listennotesService.getBestPodcasts(genreId || null, parseInt(page) || 1);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search PodcastIndex directly
 */
const searchPodcastIndex = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    if (!podcastindexService.isConfigured()) {
      return res.status(503).json({ 
        error: 'PodcastIndex API not configured',
        hint: 'Add PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET to environment variables'
      });
    }

    const result = await podcastindexService.search(q, { max: parseInt(limit) || 20 });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get PodcastIndex podcast by ID
 */
const getPodcastIndexPodcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!podcastindexService.isConfigured()) {
      return res.status(503).json({ 
        error: 'PodcastIndex API not configured',
        hint: 'Add PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET to environment variables'
      });
    }

    const result = await podcastindexService.getPodcast(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get PodcastIndex trending podcasts
 */
const getPodcastIndexTrending = async (req, res, next) => {
  try {
    const { limit, category } = req.query;
    
    if (!podcastindexService.isConfigured()) {
      return res.status(503).json({ 
        error: 'PodcastIndex API not configured',
        hint: 'Add PODCASTINDEX_API_KEY and PODCASTINDEX_API_SECRET to environment variables'
      });
    }

    const result = await podcastindexService.getTrending(
      parseInt(limit) || 20,
      category || null
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check API configuration status
 */
const getApiStatus = async (req, res, next) => {
  try {
    res.json({
      listennotes: {
        configured: listennotesService.isConfigured()
      },
      podcastindex: {
        configured: podcastindexService.isConfigured()
      },
      combined: {
        configured: podcastDiscoveryService.isConfigured()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Local database
  getAll,
  getById,
  
  // Podcast discovery (combined APIs)
  discoverPodcasts,
  getTrending,
  getPodcastDetails,
  getPodcastEpisodes,
  getEpisodeDetails,
  discoverEpisodes,
  getRecentEpisodes,
  getCategories,
  
  // Direct API access - ListenNotes
  searchListenNotes,
  getListenNotesPodcast,
  getListenNotesEpisode,
  getBestPodcasts,
  
  // Direct API access - PodcastIndex
  searchPodcastIndex,
  getPodcastIndexPodcast,
  getPodcastIndexTrending,
  
  // API status
  getApiStatus
};