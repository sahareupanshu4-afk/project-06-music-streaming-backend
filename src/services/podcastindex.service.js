/**
 * PodcastIndex API Service
 * Open index of podcasts and episodes
 * Documentation: https://podcastindex-org.github.io/docs-api/
 * 
 * No API key required (uses API key + secret for authentication)
 * Free and open podcast index
 */

const axios = require('axios');
const crypto = require('crypto');

// PodcastIndex API base URL
const PODCASTINDEX_BASE_URL = 'https://api.podcastindex.org/api/1.0';

// API credentials from environment variables
const PODCASTINDEX_API_KEY = process.env.PODCASTINDEX_API_KEY;
const PODCASTINDEX_API_SECRET = process.env.PODCASTINDEX_API_SECRET;

// Create axios instance
const podcastindexClient = axios.create({
  baseURL: PODCASTINDEX_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'SoundVerseMusicApp/1.0.0'
  }
});

// Add authentication headers to requests
podcastindexClient.interceptors.request.use(config => {
  if (PODCASTINDEX_API_KEY && PODCASTINDEX_API_SECRET) {
    const time = Math.floor(Date.now() / 1000);
    const authString = PODCASTINDEX_API_KEY + PODCASTINDEX_API_SECRET + time;
    const hash = crypto.createHash('sha1').update(authString).digest('hex');
    
    config.headers['X-Auth-Key'] = PODCASTINDEX_API_KEY;
    config.headers['X-Auth-Date'] = time;
    config.headers['Authorization'] = hash;
  }
  return config;
});

class PodcastIndexService {
  /**
   * Check if API credentials are configured
   */
  isConfigured() {
    return !!(PODCASTINDEX_API_KEY && PODCASTINDEX_API_SECRET);
  }

  /**
   * Search podcasts
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    try {
      const params = {
        q: query,
        max: options.max || 20,
        offset: options.offset || 0,
        clean: options.clean !== false,
        fulltext: options.fulltext || 'description'
      };

      const response = await podcastindexClient.get('/search/byterm', { params });

      return {
        success: true,
        data: {
          count: response.data.count,
          feeds: (response.data.feeds || []).map(this.formatPodcast)
        }
      };
    } catch (error) {
      console.error('PodcastIndex search error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Search podcasts by title
   * @param {string} title - Podcast title
   */
  async searchByTitle(title) {
    try {
      const response = await podcastindexClient.get('/search/bytitle', {
        params: {
          q: title,
          max: 20
        }
      });

      return {
        success: true,
        data: {
          count: response.data.count,
          feeds: (response.data.feeds || []).map(this.formatPodcast)
        }
      };
    } catch (error) {
      console.error('PodcastIndex title search error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast by ID
   * @param {number} podcastId - PodcastIndex podcast ID
   */
  async getPodcast(podcastId) {
    try {
      const response = await podcastindexClient.get('/podcasts/byfeedid', {
        params: { id: podcastId }
      });

      const feed = response.data.feed;
      return {
        success: !!feed,
        data: feed ? this.formatPodcast(feed) : null
      };
    } catch (error) {
      console.error('PodcastIndex get podcast error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast by feed URL
   * @param {string} feedUrl - RSS feed URL
   */
  async getPodcastByFeedUrl(feedUrl) {
    try {
      const response = await podcastindexClient.get('/podcasts/byfeedurl', {
        params: { url: feedUrl }
      });

      const feed = response.data.feed;
      return {
        success: !!feed,
        data: feed ? this.formatPodcast(feed) : null
      };
    } catch (error) {
      console.error('PodcastIndex get podcast by URL error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get episodes for a podcast
   * @param {number} podcastId - PodcastIndex podcast ID
   * @param {number} limit - Number of episodes
   */
  async getEpisodes(podcastId, limit = 20) {
    try {
      const response = await podcastindexClient.get('/episodes/byfeedid', {
        params: {
          id: podcastId,
          max: limit,
          fulltext: 'description'
        }
      });

      return {
        success: true,
        data: {
          count: response.data.count,
          items: (response.data.items || []).map(this.formatEpisode)
        }
      };
    } catch (error) {
      console.error('PodcastIndex get episodes error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get episode by ID
   * @param {number} episodeId - PodcastIndex episode ID
   */
  async getEpisode(episodeId) {
    try {
      const response = await podcastindexClient.get('/episodes/byid', {
        params: {
          id: episodeId,
          fulltext: 'description'
        }
      });

      const episode = response.data.episode;
      return {
        success: !!episode,
        data: episode ? this.formatEpisode(episode) : null
      };
    } catch (error) {
      console.error('PodcastIndex get episode error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get trending podcasts
   * @param {number} limit - Number of podcasts
   * @param {string} category - Category filter
   */
  async getTrending(limit = 20, category = null) {
    try {
      const params = { max: limit };
      if (category) params.category = category;

      const response = await podcastindexClient.get('/podcasts/trending', { params });

      return {
        success: true,
        data: (response.data.feeds || []).map(this.formatPodcast)
      };
    } catch (error) {
      console.error('PodcastIndex trending error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast categories
   */
  async getCategories() {
    try {
      const response = await podcastindexClient.get('/categories/list');
      return {
        success: true,
        data: response.data.categories || []
      };
    } catch (error) {
      console.error('PodcastIndex categories error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get podcasts by category
   * @param {number} categoryId - Category ID
   * @param {number} limit - Number of podcasts
   */
  async getByCategory(categoryId, limit = 20) {
    try {
      const response = await podcastindexClient.get('/podcasts/bycategory', {
        params: {
          id: categoryId,
          max: limit
        }
      });

      return {
        success: true,
        data: (response.data.feeds || []).map(this.formatPodcast)
      };
    } catch (error) {
      console.error('PodcastIndex category error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Get recent episodes
   * @param {number} limit - Number of episodes
   */
  async getRecentEpisodes(limit = 20) {
    try {
      const response = await podcastindexClient.get('/recent/episodes', {
        params: {
          max: limit,
          excludeString: '',
          before: null
        }
      });

      return {
        success: true,
        data: (response.data.items || []).map(this.formatEpisode)
      };
    } catch (error) {
      console.error('PodcastIndex recent episodes error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Search episodes
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   */
  async searchEpisodes(query, limit = 20) {
    try {
      const response = await podcastindexClient.get('/search/byterm', {
        params: {
          q: query,
          max: limit
        }
      });

      return {
        success: true,
        data: (response.data.items || []).map(this.formatEpisode)
      };
    } catch (error) {
      console.error('PodcastIndex episode search error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        data: null
      };
    }
  }

  /**
   * Format podcast data
   */
  formatPodcast(feed) {
    return {
      id: feed.id,
      title: feed.title,
      description: feed.description,
      author: feed.author,
      ownerName: feed.ownerName,
      thumbnail: feed.image || feed.artwork,
      cover: feed.artwork,
      rss: feed.url || feed.link,
      website: feed.link,
      language: feed.language,
      categories: feed.categories || [],
      explicit: feed.explicit,
      episodeCount: feed.episodeCount,
      newestEpisode: feed.newestItemPubdate ? new Date(feed.newestItemPubdate * 1000).toISOString() : null,
      itunesId: feed.itunesId,
      trendingRank: feed.trendScore || null,
      source: 'podcastindex'
    };
  }

  /**
   * Format episode data
   */
  formatEpisode(item) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnail: item.image || item.feedImage,
      podcastId: item.feedId,
      podcastTitle: item.feedTitle,
      audioUrl: item.enclosureUrl,
      audioType: item.enclosureType,
      audioLength: item.enclosureLength,
      duration: item.duration ? Math.floor(item.duration / 60) : null,
      publishDate: item.datePublished ? new Date(item.datePublished * 1000).toISOString() : null,
      explicit: item.explicit,
      episode: item.episode,
      season: item.season,
      transcriptUrl: item.transcriptUrl,
      chaptersUrl: item.chaptersUrl,
      source: 'podcastindex'
    };
  }
}

module.exports = new PodcastIndexService();