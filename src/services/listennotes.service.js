/**
 * ListenNotes API Service
 * Podcast search and metadata API
 * Documentation: https://www.listennotes.com/api/
 * 
 * Requires free API key (easy signup)
 * Great for podcast browsing and playback metadata
 */

const axios = require('axios');

// ListenNotes API base URL
const LISTENNOTES_BASE_URL = 'https://listen-api.listennotes.com/api/v2';

// API key from environment variable
const LISTENNOTES_API_KEY = process.env.LISTENNOTES_API_KEY;

// Create axios instance
const listennotesClient = axios.create({
  baseURL: LISTENNOTES_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  }
});

// Add API key to requests if available
listennotesClient.interceptors.request.use(config => {
  if (LISTENNOTES_API_KEY) {
    config.headers['X-ListenAPI-Key'] = LISTENNOTES_API_KEY;
  }
  return config;
});

class ListenNotesService {
  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!LISTENNOTES_API_KEY;
  }

  /**
   * Search podcasts and episodes
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const params = {
        q: query,
        type: options.type || 'podcast', // 'podcast', 'episode', or 'curated'
        offset: options.offset || 0,
        len_min: options.minDuration || null,
        len_max: options.maxDuration || null,
        published_after: options.publishedAfter || null,
        only_in: options.onlyIn || null, // 'title,description,audio'
        language: options.language || 'English',
        safe_mode: options.safeMode !== false ? 1 : 0
      };

      // Remove null values
      Object.keys(params).forEach(key => {
        if (params[key] === null) delete params[key];
      });

      const response = await listennotesClient.get('/search', { params });

      return {
        success: true,
        data: {
          count: response.data.count,
          total: response.data.total,
          results: response.data.results.map(this.formatSearchResult)
        }
      };
    } catch (error) {
      console.error('ListenNotes search error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast details
   * @param {string} podcastId - ListenNotes podcast ID
   */
  async getPodcast(podcastId) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const response = await listennotesClient.get(`/podcasts/${podcastId}`, {
        params: {
          next_episode_pub_date: null,
          episodes: 10 // Number of episodes to include
        }
      });

      return {
        success: true,
        data: this.formatPodcast(response.data)
      };
    } catch (error) {
      console.error('ListenNotes get podcast error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get episode details
   * @param {string} episodeId - ListenNotes episode ID
   */
  async getEpisode(episodeId) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const response = await listennotesClient.get(`/episodes/${episodeId}`);
      return {
        success: true,
        data: this.formatEpisode(response.data)
      };
    } catch (error) {
      console.error('ListenNotes get episode error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get episodes for a podcast
   * @param {string} podcastId - ListenNotes podcast ID
   * @param {number} page - Page number
   */
  async getPodcastEpisodes(podcastId, page = 1) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const response = await listennotesClient.get(`/podcasts/${podcastId}/episodes`, {
        params: {
          page,
          per_page: 20
        }
      });

      return {
        success: true,
        data: {
          count: response.data.count,
          total: response.data.total,
          page: response.data.page,
          episodes: response.data.episodes.map(this.formatEpisode)
        }
      };
    } catch (error) {
      console.error('ListenNotes get episodes error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get best podcasts by genre
   * @param {string} genreId - Genre ID (optional)
   * @param {number} page - Page number
   */
  async getBestPodcasts(genreId = null, page = 1) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const params = {
        page,
        region: 'us'
      };
      if (genreId) params.genre_id = genreId;

      const response = await listennotesClient.get('/best_podcasts', { params });

      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          podcasts: response.data.podcasts.map(this.formatPodcastBrief)
        }
      };
    } catch (error) {
      console.error('ListenNotes best podcasts error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast genres
   */
  async getGenres() {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const response = await listennotesClient.get('/genres', {
        params: { type: 'podcast' }
      });

      return {
        success: true,
        data: response.data.genres
      };
    } catch (error) {
      console.error('ListenNotes genres error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get trending podcasts
   * @param {array} genres - Genre IDs to filter
   */
  async getTrending(genres = []) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ListenNotes API key not configured',
        data: null
      };
    }

    try {
      const params = {
        page: 1,
        region: 'us'
      };
      if (genres.length > 0) params.genre_ids = genres.join(',');

      const response = await listennotesClient.get('/trending_podcasts', { params });

      return {
        success: true,
        data: response.data.podcasts.map(this.formatPodcastBrief)
      };
    } catch (error) {
      console.error('ListenNotes trending error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Format search result
   */
  formatSearchResult(result) {
    if (result.type === 'episode') {
      return this.formatEpisode(result);
    }
    return this.formatPodcastBrief(result);
  }

  /**
   * Format podcast brief (from search/listings)
   */
  formatPodcastBrief(podcast) {
    return {
      id: podcast.id,
      title: podcast.title_original || podcast.title,
      description: podcast.description_original || podcast.description,
      thumbnail: podcast.thumbnail || podcast.image,
      publisher: podcast.publisher_original || podcast.publisher,
      highlight: podcast.highlight_text || null,
      totalEpisodes: podcast.total_episodes || null,
      listenScore: podcast.listen_score || null,
      listenScoreGlobal: podcast.listen_score_global_rank || null,
      website: podcast.website || null,
      rss: podcast.rss || null,
      genreIds: podcast.genre_ids || [],
      source: 'listennotes'
    };
  }

  /**
   * Format full podcast details
   */
  formatPodcast(podcast) {
    return {
      id: podcast.id,
      title: podcast.title,
      description: podcast.description || podcast.description_original,
      thumbnail: podcast.image,
      publisher: podcast.publisher,
      website: podcast.website,
      rss: podcast.rss,
      email: podcast.email,
      language: podcast.language,
      explicit: podcast.explicit_content,
      totalEpisodes: podcast.total_episodes,
      listenScore: podcast.listen_score,
      listenScoreGlobal: podcast.listen_score_global_rank,
      genreIds: podcast.genre_ids,
      episodes: (podcast.episodes || []).map(this.formatEpisode),
      source: 'listennotes'
    };
  }

  /**
   * Format episode details
   */
  formatEpisode(episode) {
    return {
      id: episode.id,
      title: episode.title_original || episode.title,
      description: episode.description_original || episode.description,
      thumbnail: episode.thumbnail || episode.image,
      podcastId: episode.podcast_id,
      podcastTitle: episode.podcast_title,
      publisher: episode.podcast_publisher || episode.publisher,
      audioUrl: episode.audio,
      audioLength: episode.audio_length_sec || episode.audio_length,
      publishDate: episode.pub_date_ms || episode.pub_date,
      explicit: episode.explicit_content,
      listenNotesUrl: episode.listennotes_url,
      source: 'listennotes'
    };
  }
}

module.exports = new ListenNotesService();