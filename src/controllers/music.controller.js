const trackModel = require('../models/track.model');
const musicDiscoveryService = require('../services/musicDiscovery.service');
const musicbrainzService = require('../services/musicbrainz.service');
const audiodbService = require('../services/audiodb.service');

// ============ Local Database Operations ============

const getAllTracks = async (req, res, next) => {
  try {
    const { limit, offset, realm, energy } = req.query;
    const { data, error } = await trackModel.findAll({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      realm,
      energy,
      orderBy: 'created_at',
      ascending: false
    });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTrack = async (req, res, next) => {
  try {
    const { data, error } = await trackModel.findById(req.params.id);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Track not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const searchTracks = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });
    const { data, error } = await trackModel.search(q);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getByRealm = async (req, res, next) => {
  try {
    const { data, error } = await trackModel.getByRealm(req.params.realm);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getByEnergy = async (req, res, next) => {
  try {
    const { data, error } = await trackModel.getByEnergy(req.params.energy);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getTopPlayed = async (req, res, next) => {
  try {
    const { data, error } = await trackModel.getTopPlayed(20);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const recordPlay = async (req, res, next) => {
  try {
    await trackModel.incrementPlayCount(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ============ External API - Music Discovery ============

/**
 * Search music across external APIs (MusicBrainz + TheAudioDB)
 * Returns artists, tracks, and albums
 */
const discoverMusic = async (req, res, next) => {
  try {
    const { q, type, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await musicDiscoveryService.search(q, {
      type: type || 'all',
      limit: parseInt(limit) || 10
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for artists using external APIs
 */
const discoverArtists = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await musicDiscoveryService.searchArtists(q, parseInt(limit) || 10);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for albums using external APIs
 */
const discoverAlbums = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await musicDiscoveryService.searchAlbums(q, parseInt(limit) || 10);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get artist details with discography
 */
const getArtistDetails = async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Artist name required' });
    }

    const result = await musicDiscoveryService.getArtistDetails(name);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get album details with tracks
 */
const getAlbumDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Album ID required' });
    }

    const result = await musicDiscoveryService.getAlbumDetails(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular tracks for an artist
 */
const getArtistPopularTracks = async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Artist name required' });
    }

    const result = await musicDiscoveryService.getArtistPopularTracks(name);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ============ Direct API Access ============

/**
 * Search MusicBrainz directly
 */
const searchMusicBrainz = async (req, res, next) => {
  try {
    const { q, type, limit, offset } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    let result;
    switch (type) {
      case 'artist':
        result = await musicbrainzService.searchArtists(q, parseInt(limit) || 10, parseInt(offset) || 0);
        break;
      case 'release':
      case 'album':
        result = await musicbrainzService.searchReleases(q, parseInt(limit) || 10, parseInt(offset) || 0);
        break;
      case 'recording':
      case 'track':
        result = await musicbrainzService.searchRecordings(q, parseInt(limit) || 20, parseInt(offset) || 0);
        break;
      default:
        result = await musicbrainzService.combinedSearch(q, parseInt(limit) || 5);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get MusicBrainz entity by ID
 */
const getMusicBrainzEntity = async (req, res, next) => {
  try {
    const { type, mbid } = req.params;
    
    let result;
    switch (type) {
      case 'artist':
        result = await musicbrainzService.getArtistById(mbid);
        break;
      case 'release':
      case 'album':
        result = await musicbrainzService.getReleaseById(mbid);
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity type. Use: artist, release' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search TheAudioDB directly
 */
const searchAudioDB = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    let result;
    switch (type) {
      case 'artist':
        result = await audiodbService.searchArtist(q);
        break;
      case 'album':
        result = await audiodbService.searchAlbums(q);
        break;
      case 'track':
        const { track } = req.query;
        result = await audiodbService.searchTrack(q, track || '');
        break;
      case 'discography':
        result = await audiodbService.getDiscography(q);
        break;
      default:
        result = await audiodbService.searchArtist(q);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get TheAudioDB entity by ID
 */
const getAudioDBEntity = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    
    let result;
    switch (type) {
      case 'artist':
        result = await audiodbService.getArtistById(id);
        break;
      case 'album':
        result = await audiodbService.getAlbumById(id);
        break;
      case 'tracks':
        result = await audiodbService.getAlbumTracks(id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid entity type. Use: artist, album, tracks' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Local database
  getAllTracks,
  getTrack,
  searchTracks,
  getByRealm,
  getByEnergy,
  getTopPlayed,
  recordPlay,
  
  // Music discovery (combined APIs)
  discoverMusic,
  discoverArtists,
  discoverAlbums,
  getArtistDetails,
  getAlbumDetails,
  getArtistPopularTracks,
  
  // Direct API access
  searchMusicBrainz,
  getMusicBrainzEntity,
  searchAudioDB,
  getAudioDBEntity
};