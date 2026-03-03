/**
 * Podcast Discovery Service
 * Combines ListenNotes and PodcastIndex APIs for comprehensive podcast data
 */

const listennotesService = require('./listennotes.service');
const podcastindexService = require('./podcastindex.service');

class PodcastDiscoveryService {
  /**
   * Search podcasts across multiple sources
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    const { limit = 20, type = 'podcast' } = options;
    const results = {
      podcasts: [],
      episodes: [],
      source: 'combined'
    };

    try {
      const promises = [];

      // Use ListenNotes if configured
      if (listennotesService.isConfigured()) {
        promises.push(
          listennotesService.search(query, { type, offset: 0 })
            .then(res => ({ source: 'listennotes', data: res.data }))
            .catch(err => ({ source: 'listennotes', error: err.message }))
        );
      }

      // Use PodcastIndex if configured
      if (podcastindexService.isConfigured()) {
        promises.push(
          podcastindexService.search(query, { max: limit })
            .then(res => ({ source: 'podcastindex', data: res.data }))
            .catch(err => ({ source: 'podcastindex', error: err.message }))
        );
      }

      // If no API is configured, return empty results
      if (promises.length === 0) {
        return {
          success: false,
          error: 'No podcast API configured. Please add ListenNotes or PodcastIndex credentials.',
          data: results
        };
      }

      const responses = await Promise.all(promises);

      // Process responses
      responses.forEach(response => {
        if (response.error) {
          console.warn(`${response.source} search error:`, response.error);
          return;
        }

        if (response.source === 'listennotes' && response.data) {
          if (type === 'episode' || type === 'all') {
            results.episodes.push(...(response.data.results || [])
              .filter(r => r.audioUrl)
              .map(this.formatListenNotesEpisode));
          }
          if (type === 'podcast' || type === 'all') {
            results.podcasts.push(...(response.data.results || [])
              .filter(r => !r.audioUrl)
              .map(this.formatListenNotesPodcast));
          }
        }

        if (response.source === 'podcastindex' && response.data) {
          results.podcasts.push(...(response.data.feeds || [])
            .map(this.formatPodcastIndexPodcast));
        }
      });

      // Deduplicate podcasts
      results.podcasts = this.deduplicatePodcasts(results.podcasts);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Podcast discovery search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: results
      };
    }
  }

  /**
   * Get trending podcasts
   * @param {number} limit - Number of results
   */
  async getTrending(limit = 20) {
    try {
      const promises = [];

      if (listennotesService.isConfigured()) {
        promises.push(
          listennotesService.getBestPodcasts(null, 1)
            .then(res => ({ source: 'listennotes', data: res.data }))
            .catch(err => ({ source: 'listennotes', error: err.message }))
        );
      }

      if (podcastindexService.isConfigured()) {
        promises.push(
          podcastindexService.getTrending(limit)
            .then(res => ({ source: 'podcastindex', data: res.data }))
            .catch(err => ({ source: 'podcastindex', error: err.message }))
        );
      }

      if (promises.length === 0) {
        return {
          success: false,
          error: 'No podcast API configured',
          data: []
        };
      }

      const responses = await Promise.all(promises);
      let podcasts = [];

      responses.forEach(response => {
        if (response.error) {
          console.warn(`${response.source} trending error:`, response.error);
          return;
        }

        if (response.source === 'listennotes' && response.data) {
          podcasts.push(...response.data.podcasts.map(this.formatListenNotesPodcast));
        }

        if (response.source === 'podcastindex' && response.data) {
          podcasts.push(...response.data.map(this.formatPodcastIndexPodcast));
        }
      });

      podcasts = this.deduplicatePodcasts(podcasts).slice(0, limit);

      return {
        success: true,
        data: podcasts
      };
    } catch (error) {
      console.error('Get trending podcasts error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get podcast details
   * @param {string} podcastId - Podcast ID
   * @param {string} source - Source identifier (listennotes/podcastindex)
   */
  async getPodcast(podcastId, source = 'listennotes') {
    try {
      if (source === 'listennotes' && listennotesService.isConfigured()) {
        const result = await listennotesService.getPodcast(podcastId);
        return {
          success: result.success,
          data: result.data ? this.formatListenNotesPodcast(result.data) : null
        };
      }

      if (source === 'podcastindex' && podcastindexService.isConfigured()) {
        const result = await podcastindexService.getPodcast(podcastId);
        return {
          success: result.success,
          data: result.data
        };
      }

      return {
        success: false,
        error: 'Podcast API not configured',
        data: null
      };
    } catch (error) {
      console.error('Get podcast error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get episodes for a podcast
   * @param {string} podcastId - Podcast ID
   * @param {string} source - Source identifier
   * @param {number} limit - Number of episodes
   */
  async getEpisodes(podcastId, source = 'listennotes', limit = 20) {
    try {
      if (source === 'listennotes' && listennotesService.isConfigured()) {
        const result = await listennotesService.getPodcastEpisodes(podcastId, 1);
        return {
          success: result.success,
          data: result.data?.episodes || []
        };
      }

      if (source === 'podcastindex' && podcastindexService.isConfigured()) {
        const result = await podcastindexService.getEpisodes(podcastId, limit);
        return {
          success: result.success,
          data: result.data?.items || []
        };
      }

      return {
        success: false,
        error: 'Podcast API not configured',
        data: []
      };
    } catch (error) {
      console.error('Get episodes error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get episode details
   * @param {string} episodeId - Episode ID
   * @param {string} source - Source identifier
   */
  async getEpisode(episodeId, source = 'listennotes') {
    try {
      if (source === 'listennotes' && listennotesService.isConfigured()) {
        const result = await listennotesService.getEpisode(episodeId);
        return result;
      }

      if (source === 'podcastindex' && podcastindexService.isConfigured()) {
        const result = await podcastindexService.getEpisode(episodeId);
        return result;
      }

      return {
        success: false,
        error: 'Podcast API not configured',
        data: null
      };
    } catch (error) {
      console.error('Get episode error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get podcast categories/genres
   */
  async getCategories() {
    try {
      if (listennotesService.isConfigured()) {
        const result = await listennotesService.getGenres();
        return result;
      }

      if (podcastindexService.isConfigured()) {
        const result = await podcastindexService.getCategories();
        return result;
      }

      return {
        success: false,
        error: 'Podcast API not configured',
        data: []
      };
    } catch (error) {
      console.error('Get categories error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search episodes specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   */
  async searchEpisodes(query, limit = 20) {
    try {
      if (listennotesService.isConfigured()) {
        const result = await listennotesService.search(query, { type: 'episode' });
        return {
          success: result.success,
          data: (result.data?.results || [])
            .filter(r => r.audioUrl)
            .slice(0, limit)
        };
      }

      if (podcastindexService.isConfigured()) {
        const result = await podcastindexService.searchEpisodes(query, limit);
        return result;
      }

      return {
        success: false,
        error: 'Podcast API not configured',
        data: []
      };
    } catch (error) {
      console.error('Search episodes error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get recent episodes
   * @param {number} limit - Number of episodes
   */
  async getRecentEpisodes(limit = 20) {
    try {
      if (podcastindexService.isConfigured()) {
        const result = await podcastindexService.getRecentEpisodes(limit);
        return result;
      }

      return {
        success: false,
        error: 'PodcastIndex API not configured',
        data: []
      };
    } catch (error) {
      console.error('Get recent episodes error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Format ListenNotes podcast
   */
  formatListenNotesPodcast(podcast) {
    return {
      id: podcast.id,
      source: 'listennotes',
      title: podcast.title,
      description: podcast.description,
      thumbnail: podcast.thumbnail,
      publisher: podcast.publisher,
      website: podcast.website,
      rss: podcast.rss,
      totalEpisodes: podcast.totalEpisodes,
      listenScore: podcast.listenScore,
      genreIds: podcast.genreIds,
      episodes: podcast.episodes || []
    };
  }

  /**
   * Format ListenNotes episode
   */
  formatListenNotesEpisode(episode) {
    return {
      id: episode.id,
      source: 'listennotes',
      title: episode.title,
      description: episode.description,
      thumbnail: episode.thumbnail,
      podcastId: episode.podcastId,
      podcastTitle: episode.podcastTitle,
      publisher: episode.publisher,
      audioUrl: episode.audioUrl,
      audioLength: episode.audioLength,
      publishDate: episode.publishDate,
      explicit: episode.explicit
    };
  }

  /**
   * Format PodcastIndex podcast
   */
  formatPodcastIndexPodcast(podcast) {
    return {
      id: podcast.id,
      source: 'podcastindex',
      title: podcast.title,
      description: podcast.description,
      thumbnail: podcast.thumbnail || podcast.cover,
      author: podcast.author,
      website: podcast.website,
      rss: podcast.rss,
      language: podcast.language,
      categories: podcast.categories,
      episodeCount: podcast.episodeCount,
      newestEpisode: podcast.newestEpisode,
      trendingRank: podcast.trendingRank
    };
  }

  /**
   * Deduplicate podcasts by title
   */
  deduplicatePodcasts(podcasts) {
    const seen = new Map();
    
    podcasts.forEach(podcast => {
      const key = podcast.title?.toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.set(key, podcast);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Check if any podcast API is configured
   */
  isConfigured() {
    return listennotesService.isConfigured() || podcastindexService.isConfigured();
  }
}

module.exports = new PodcastDiscoveryService();