/**
 * MusicBrainz API Service
 * Free music metadata API - No API key required
 * Documentation: https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2
 * 
 * Rate Limit: 1 request per second
 * Requires descriptive User-Agent header
 */

const axios = require('axios');

// MusicBrainz API base URL
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';

// Create axios instance with proper headers for MusicBrainz
const musicbrainzClient = axios.create({
  baseURL: MUSICBRAINZ_BASE_URL,
  timeout: 10000,
  headers: {
    'User-Agent': 'SoundVerseMusicApp/1.0.0 (ashay@soundverse.app)',
    'Accept': 'application/json'
  }
});

// Rate limiting - MusicBrainz requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

const rateLimitedRequest = async (requestFn) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return requestFn();
};

class MusicBrainzService {
  /**
   * Search for artists
   * @param {string} query - Search query
   * @param {number} limit - Number of results (default: 10)
   * @param {number} offset - Offset for pagination
   */
  async searchArtists(query, limit = 10, offset = 0) {
    try {
      return await rateLimitedRequest(async () => {
        const response = await musicbrainzClient.get('/artist', {
          params: {
            query: `artist:${query}`,
            fmt: 'json',
            limit,
            offset
          }
        });
        return {
          success: true,
          data: response.data.artists || [],
          count: response.data.count || 0,
          offset: response.data.offset || 0
        };
      });
    } catch (error) {
      console.error('MusicBrainz artist search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search for recordings/tracks
   * @param {string} query - Search query
   * @param {number} limit - Number of results (default: 20)
   * @param {number} offset - Offset for pagination
   */
  async searchRecordings(query, limit = 20, offset = 0) {
    try {
      return await rateLimitedRequest(async () => {
        const response = await musicbrainzClient.get('/recording', {
          params: {
            query: `recording:${query}`,
            fmt: 'json',
            limit,
            offset
          }
        });
        return {
          success: true,
          data: this.formatRecordings(response.data.recordings || []),
          count: response.data.count || 0,
          offset: response.data.offset || 0
        };
      });
    } catch (error) {
      console.error('MusicBrainz recording search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search for releases (albums)
   * @param {string} query - Search query
   * @param {number} limit - Number of results (default: 10)
   * @param {number} offset - Offset for pagination
   */
  async searchReleases(query, limit = 10, offset = 0) {
    try {
      return await rateLimitedRequest(async () => {
        const response = await musicbrainzClient.get('/release', {
          params: {
            query: `release:${query}`,
            fmt: 'json',
            limit,
            offset
          }
        });
        return {
          success: true,
          data: this.formatReleases(response.data.releases || []),
          count: response.data.count || 0,
          offset: response.data.offset || 0
        };
      });
    } catch (error) {
      console.error('MusicBrainz release search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get artist by MusicBrainz ID
   * @param {string} mbid - MusicBrainz ID
   * @param {array} includes - Related data to include
   */
  async getArtistById(mbid, includes = ['releases', 'recordings']) {
    try {
      return await rateLimitedRequest(async () => {
        const response = await musicbrainzClient.get(`/artist/${mbid}`, {
          params: {
            fmt: 'json',
            inc: includes.join('+')
          }
        });
        return {
          success: true,
          data: response.data
        };
      });
    } catch (error) {
      console.error('MusicBrainz get artist error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get release (album) by MusicBrainz ID
   * @param {string} mbid - MusicBrainz ID
   * @param {array} includes - Related data to include
   */
  async getReleaseById(mbid, includes = ['recordings', 'artist-credits']) {
    try {
      return await rateLimitedRequest(async () => {
        const response = await musicbrainzClient.get(`/release/${mbid}`, {
          params: {
            fmt: 'json',
            inc: includes.join('+')
          }
        });
        return {
          success: true,
          data: response.data
        };
      });
    } catch (error) {
      console.error('MusicBrainz get release error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Combined search - searches artists, recordings, and releases
   * @param {string} query - Search query
   * @param {number} limit - Results per category
   */
  async combinedSearch(query, limit = 5) {
    try {
      const [artists, recordings, releases] = await Promise.all([
        this.searchArtists(query, limit),
        this.searchRecordings(query, limit),
        this.searchReleases(query, limit)
      ]);

      return {
        success: true,
        data: {
          artists: artists.data || [],
          tracks: recordings.data || [],
          albums: releases.data || []
        }
      };
    } catch (error) {
      console.error('MusicBrainz combined search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: { artists: [], tracks: [], albums: [] }
      };
    }
  }

  /**
   * Format recordings data for consistent structure
   */
  formatRecordings(recordings) {
    return recordings.map(rec => ({
      id: rec.id,
      mbid: rec.id,
      title: rec.title,
      artist: rec['artist-credit']?.[0]?.name || 'Unknown Artist',
      artistMbid: rec['artist-credit']?.[0]?.artist?.id || null,
      album: rec.releases?.[0]?.title || null,
      albumMbid: rec.releases?.[0]?.id || null,
      duration: rec.length ? Math.floor(rec.length / 1000) : null,
      position: rec.releases?.[0]?.media?.[0]?.position || null,
      disambiguation: rec.disambiguation || null,
      tags: rec.tags?.map(t => t.name) || [],
      source: 'musicbrainz'
    }));
  }

  /**
   * Format releases data for consistent structure
   */
  formatReleases(releases) {
    return releases.map(rel => ({
      id: rel.id,
      mbid: rel.id,
      title: rel.title,
      artist: rel['artist-credit']?.[0]?.name || 'Various Artists',
      artistMbid: rel['artist-credit']?.[0]?.artist?.id || null,
      date: rel.date || null,
      year: rel.date ? parseInt(rel.date.split('-')[0]) : null,
      country: rel.country || null,
      trackCount: rel['track-count'] || 0,
      status: rel.status || null,
      packaging: rel.packaging || null,
      source: 'musicbrainz'
    }));
  }
}

module.exports = new MusicBrainzService();