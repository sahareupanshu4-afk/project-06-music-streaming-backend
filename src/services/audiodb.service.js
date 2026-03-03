/**
 * TheAudioDB API Service
 * Free music data and artwork API
 * Documentation: https://www.theaudiodb.com/api_guide.php
 * 
 * Free tier available with basic API key
 * Provides album artwork, artist images, track info
 */

const axios = require('axios');

// TheAudioDB API base URL
const AUDIODB_BASE_URL = 'https://theaudiodb.com/api/v1/json';

// Free API key for TheAudioDB (can be replaced with your own)
const AUDIODB_API_KEY = process.env.AUDIODB_API_KEY || '2';

// Create axios instance
const audiodbClient = axios.create({
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

class AudioDBService {
  /**
   * Search for artists by name
   * @param {string} artistName - Artist name to search
   */
  async searchArtist(artistName) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/search.php`,
        {
          params: { s: artistName }
        }
      );

      const artists = response.data.artists || [];
      return {
        success: true,
        data: artists.map(this.formatArtist)
      };
    } catch (error) {
      console.error('AudioDB artist search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get artist by ID
   * @param {string} artistId - TheAudioDB artist ID
   */
  async getArtistById(artistId) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/artist.php`,
        {
          params: { i: artistId }
        }
      );

      const artist = response.data.artists?.[0];
      return {
        success: !!artist,
        data: artist ? this.formatArtist(artist) : null
      };
    } catch (error) {
      console.error('AudioDB get artist error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Search for albums by artist name
   * @param {string} artistName - Artist name
   */
  async searchAlbums(artistName) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/searchalbum.php`,
        {
          params: { s: artistName }
        }
      );

      const albums = response.data.album || [];
      return {
        success: true,
        data: albums.map(this.formatAlbum)
      };
    } catch (error) {
      console.error('AudioDB album search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get album by ID
   * @param {string} albumId - TheAudioDB album ID
   */
  async getAlbumById(albumId) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/album.php`,
        {
          params: { m: albumId }
        }
      );

      const album = response.data.album?.[0];
      return {
        success: !!album,
        data: album ? this.formatAlbum(album) : null
      };
    } catch (error) {
      console.error('AudioDB get album error:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Search for tracks by artist and track name
   * @param {string} artistName - Artist name
   * @param {string} trackName - Track name
   */
  async searchTrack(artistName, trackName) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/searchtrack.php`,
        {
          params: { 
            s: artistName,
            t: trackName
          }
        }
      );

      const tracks = response.data.track || [];
      return {
        success: true,
        data: tracks.map(this.formatTrack)
      };
    } catch (error) {
      console.error('AudioDB track search error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get tracks for a specific album
   * @param {string} albumId - TheAudioDB album ID
   */
  async getAlbumTracks(albumId) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/track.php`,
        {
          params: { m: albumId }
        }
      );

      const tracks = response.data.track || [];
      return {
        success: true,
        data: tracks.map(this.formatTrack)
      };
    } catch (error) {
      console.error('AudioDB album tracks error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get popular tracks for an artist
   * @param {string} artistName - Artist name
   */
  async getArtistPopularTracks(artistName) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/track-top10.php`,
        {
          params: { s: artistName }
        }
      );

      const tracks = response.data.track || [];
      return {
        success: true,
        data: tracks.map(this.formatTrack)
      };
    } catch (error) {
      console.error('AudioDB popular tracks error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get music videos for an artist
   * @param {string} artistName - Artist name
   */
  async getMusicVideos(artistName) {
    try {
      const response = await audiodbClient.get(
        `${AUDIODB_BASE_URL}/${AUDIODB_API_KEY}/mvid.php`,
        {
          params: { i: artistName }
        }
      );

      const videos = response.data.mvids || [];
      return {
        success: true,
        data: videos.map(video => ({
          id: video.idTrack,
          title: video.strTrack,
          artist: video.strArtist,
          thumbnail: video.strTrackThumb,
          videoUrl: video.strMusicVid,
          views: video.intMusicVidViews || 0,
          youtubeId: this.extractYoutubeId(video.strMusicVid)
        }))
      };
    } catch (error) {
      console.error('AudioDB music videos error:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get artist discography
   * @param {string} artistName - Artist name
   */
  async getDiscography(artistName) {
    try {
      const [artistResult, albumsResult] = await Promise.all([
        this.searchArtist(artistName),
        this.searchAlbums(artistName)
      ]);

      return {
        success: true,
        data: {
          artist: artistResult.data?.[0] || null,
          albums: albumsResult.data || []
        }
      };
    } catch (error) {
      console.error('AudioDB discography error:', error.message);
      return {
        success: false,
        error: error.message,
        data: { artist: null, albums: [] }
      };
    }
  }

  /**
   * Format artist data for consistent structure
   */
  formatArtist(artist) {
    return {
      id: artist.idArtist,
      name: artist.strArtist,
      alternateName: artist.strArtistAlternate || null,
      genre: artist.strGenre || null,
      style: artist.strStyle || null,
      biography: artist.strBiographyEN || artist.strBiographyDE || null,
      formed: artist.intFormedYear || null,
      born: artist.intBornYear || null,
      died: artist.intDiedYear || null,
      country: artist.strCountry || null,
      location: artist.strLocation || null,
      website: artist.strWebsite || null,
      thumbnail: artist.strArtistThumb || null,
      logo: artist.strArtistLogo || null,
      banner: artist.strArtistBanner || null,
      fanart: artist.strArtistFanart || null,
      fanart2: artist.strArtistFanart2 || null,
      clearart: artist.strArtistClearart || null,
      wideThumb: artist.strArtistWideThumb || null,
      facebook: artist.strFacebook || null,
      twitter: artist.strTwitter || null,
      source: 'audiodb'
    };
  }

  /**
   * Format album data for consistent structure
   */
  formatAlbum(album) {
    return {
      id: album.idAlbum,
      title: album.strAlbum,
      artist: album.strArtist,
      artistId: album.idArtist || null,
      year: album.intYearReleased || null,
      genre: album.strGenre || null,
      style: album.strStyle || null,
      label: album.strLabel || null,
      description: album.strDescriptionEN || null,
      sales: album.intSales || null,
      score: album.intScore || null,
      scoreVotes: album.intScoreVotes || null,
      thumbnail: album.strAlbumThumb || null,
      thumbnailHQ: album.strAlbumThumbHQ || null,
      spine: album.strAlbumSpine || null,
      back: album.strAlbumBack || null,
      cdArt: album.strAlbumCDart || null,
      source: 'audiodb'
    };
  }

  /**
   * Format track data for consistent structure
   */
  formatTrack(track) {
    return {
      id: track.idTrack,
      title: track.strTrack,
      artist: track.strArtist,
      artistId: track.idArtist || null,
      album: track.strAlbum || null,
      albumId: track.idAlbum || null,
      genre: track.strGenre || null,
      description: track.strDescriptionEN || null,
      duration: track.intDuration ? Math.floor(track.intDuration / 1000) : null,
      bpm: track.intBPM || null,
      number: track.intTrackNumber || null,
      rating: track.intTotalRating || null,
      thumbnail: track.strTrackThumb || null,
      musicVideo: track.strMusicVid || null,
      source: 'audiodb'
    };
  }

  /**
   * Extract YouTube video ID from URL
   */
  extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }
}

module.exports = new AudioDBService();