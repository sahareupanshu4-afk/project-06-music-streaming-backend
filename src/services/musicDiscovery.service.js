/**
 * Music Discovery Service
 * Combines MusicBrainz and TheAudioDB APIs for comprehensive music metadata
 */

const musicbrainzService = require('./musicbrainz.service');
const audiodbService = require('./audiodb.service');

class MusicDiscoveryService {
  /**
   * Search for music across multiple sources
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    const { type = 'all', limit = 10 } = options;
    const results = {
      tracks: [],
      artists: [],
      albums: [],
      source: 'combined'
    };

    try {
      // Search MusicBrainz for metadata
      const mbPromise = musicbrainzService.combinedSearch(query, limit);

      // Search TheAudioDB for artwork and additional info
      const audiodbArtistPromise = audiodbService.searchArtist(query);
      const audiodbAlbumsPromise = audiodbService.searchAlbums(query);

      const [mbResults, audiodbArtists, audiodbAlbums] = await Promise.all([
        mbPromise,
        audiodbArtistPromise,
        audiodbAlbumsPromise
      ]);

      // Merge results
      if (type === 'all' || type === 'artists') {
        results.artists = this.mergeArtistResults(
          mbResults.data?.artists || [],
          audiodbArtists.data || []
        );
      }

      if (type === 'all' || type === 'tracks') {
        results.tracks = mbResults.data?.tracks || [];
      }

      if (type === 'all' || type === 'albums') {
        results.albums = this.mergeAlbumResults(
          mbResults.data?.albums || [],
          audiodbAlbums.data || []
        );
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Music discovery search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: results
      };
    }
  }

  /**
   * Search for tracks specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   */
  async searchTracks(query, limit = 20) {
    try {
      const [mbTracks, audiodbTracks] = await Promise.all([
        musicbrainzService.searchRecordings(query, limit),
        // Try to get track info from AudioDB if artist is specified
        Promise.resolve({ data: [] })
      ]);

      return {
        success: true,
        data: mbTracks.data || []
      };
    } catch (error) {
      console.error('Track search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search for artists
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   */
  async searchArtists(query, limit = 10) {
    try {
      const [mbArtists, audiodbArtists] = await Promise.all([
        musicbrainzService.searchArtists(query, limit),
        audiodbService.searchArtist(query)
      ]);

      return {
        success: true,
        data: this.mergeArtistResults(
          mbArtists.data || [],
          audiodbArtists.data || []
        )
      };
    } catch (error) {
      console.error('Artist search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search for albums
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   */
  async searchAlbums(query, limit = 10) {
    try {
      const [mbAlbums, audiodbAlbums] = await Promise.all([
        musicbrainzService.searchReleases(query, limit),
        audiodbService.searchAlbums(query)
      ]);

      return {
        success: true,
        data: this.mergeAlbumResults(
          mbAlbums.data || [],
          audiodbAlbums.data || []
        )
      };
    } catch (error) {
      console.error('Album search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get artist details with discography
   * @param {string} artistName - Artist name
   */
  async getArtistDetails(artistName) {
    try {
      const [mbArtist, audiodbDiscography] = await Promise.all([
        musicbrainzService.searchArtists(artistName, 1),
        audiodbService.getDiscography(artistName)
      ]);

      const mbArtistData = mbArtist.data?.[0];
      const audiodbArtist = audiodbDiscography.data?.artist;
      const audiodbAlbums = audiodbDiscography.data?.albums || [];

      return {
        success: true,
        data: {
          id: mbArtistData?.id || audiodbArtist?.id,
          name: artistName,
          mbid: mbArtistData?.id,
          audiodbId: audiodbArtist?.id,
          type: mbArtistData?.type,
          country: mbArtistData?.country || audiodbArtist?.country,
          genre: audiodbArtist?.genre,
          biography: audiodbArtist?.biography,
          formed: audiodbArtist?.formed,
          thumbnail: audiodbArtist?.thumbnail,
          banner: audiodbArtist?.banner,
          fanart: audiodbArtist?.fanart,
          website: audiodbArtist?.website,
          facebook: audiodbArtist?.facebook,
          twitter: audiodbArtist?.twitter,
          albums: audiodbAlbums,
          source: 'combined'
        }
      };
    } catch (error) {
      console.error('Get artist details error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get album details with tracks
   * @param {string} albumId - Album ID (TheAudioDB)
   */
  async getAlbumDetails(albumId) {
    try {
      const [albumDetails, tracks] = await Promise.all([
        audiodbService.getAlbumById(albumId),
        audiodbService.getAlbumTracks(albumId)
      ]);

      return {
        success: true,
        data: {
          ...albumDetails.data,
          tracks: tracks.data || []
        }
      };
    } catch (error) {
      console.error('Get album details error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get popular tracks for an artist
   * @param {string} artistName - Artist name
   */
  async getArtistPopularTracks(artistName) {
    try {
      const result = await audiodbService.getArtistPopularTracks(artistName);
      return result;
    } catch (error) {
      console.error('Get popular tracks error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Merge artist results from multiple sources
   */
  mergeArtistResults(mbArtists, audiodbArtists) {
    const merged = [];
    const seen = new Set();

    // Add MusicBrainz artists
    mbArtists.forEach(artist => {
      const key = artist.name?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: artist.id,
          mbid: artist.id,
          name: artist.name,
          type: artist.type,
          country: artist.country,
          disambiguation: artist.disambiguation,
          score: artist.score,
          source: 'musicbrainz'
        });
      }
    });

    // Add/enrich with TheAudioDB data
    audiodbArtists.forEach(artist => {
      const key = artist.name?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: artist.id,
          audiodbId: artist.id,
          name: artist.name,
          genre: artist.genre,
          style: artist.style,
          country: artist.country,
          biography: artist.biography,
          thumbnail: artist.thumbnail,
          banner: artist.banner,
          formed: artist.formed,
          source: 'audiodb'
        });
      } else if (key) {
        // Enrich existing artist with AudioDB data
        const existing = merged.find(a => a.name?.toLowerCase() === key);
        if (existing) {
          existing.audiodbId = artist.id;
          existing.thumbnail = artist.thumbnail;
          existing.banner = artist.banner;
          existing.biography = artist.biography;
          existing.genre = artist.genre;
          existing.formed = artist.formed;
          existing.source = 'combined';
        }
      }
    });

    return merged;
  }

  /**
   * Merge album results from multiple sources
   */
  mergeAlbumResults(mbAlbums, audiodbAlbums) {
    const merged = [];
    const seen = new Set();

    // Add MusicBrainz albums
    mbAlbums.forEach(album => {
      const key = `${album.title?.toLowerCase()}-${album.artist?.toLowerCase()}`;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: album.id,
          mbid: album.id,
          title: album.title,
          artist: album.artist,
          year: album.year,
          date: album.date,
          country: album.country,
          trackCount: album.trackCount,
          source: 'musicbrainz'
        });
      }
    });

    // Add/enrich with TheAudioDB data
    audiodbAlbums.forEach(album => {
      const key = `${album.title?.toLowerCase()}-${album.artist?.toLowerCase()}`;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({
          id: album.id,
          audiodbId: album.id,
          title: album.title,
          artist: album.artist,
          year: album.year,
          genre: album.genre,
          thumbnail: album.thumbnail,
          thumbnailHQ: album.thumbnailHQ,
          description: album.description,
          source: 'audiodb'
        });
      } else if (key) {
        // Enrich existing album with AudioDB data
        const existing = merged.find(a => 
          `${a.title?.toLowerCase()}-${a.artist?.toLowerCase()}` === key
        );
        if (existing) {
          existing.audiodbId = album.id;
          existing.thumbnail = album.thumbnail;
          existing.thumbnailHQ = album.thumbnailHQ;
          existing.description = album.description;
          existing.genre = album.genre;
          existing.source = 'combined';
        }
      }
    });

    return merged;
  }
}

module.exports = new MusicDiscoveryService();