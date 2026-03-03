# Music & Podcast Discovery API Services

This directory contains service modules for integrating with external music and podcast metadata APIs. These services provide comprehensive data for music discovery, artist information, album artwork, and podcast search functionality.

## 📁 File Structure

```
services/
├── musicbrainz.service.js      # MusicBrainz API integration
├── audiodb.service.js          # TheAudioDB API integration
├── listennotes.service.js      # ListenNotes Podcast API integration
├── podcastindex.service.js     # PodcastIndex API integration
├── musicDiscovery.service.js   # Combined music discovery service
├── podcastDiscovery.service.js # Combined podcast discovery service
└── README.md                   # This documentation
```

## 🎵 Music APIs

### MusicBrainz (Free - No API Key Required)

**Documentation:** https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2

MusicBrainz provides open music metadata including artists, recordings, releases, and labels.

**Features:**
- Search artists, recordings (tracks), releases (albums)
- Get detailed entity information by MBID (MusicBrainz ID)
- Combined search across all entity types
- Rate limited to 1 request per second

**Usage:**
```javascript
const musicbrainzService = require('./services/musicbrainz.service');

// Search for artists
const artists = await musicbrainzService.searchArtists('Coldplay', 10);

// Search for recordings/tracks
const tracks = await musicbrainzService.searchRecordings('Yellow', 20);

// Search for releases/albums
const albums = await musicbrainzService.searchReleases('Parachutes', 10);

// Get artist by MBID
const artist = await musicbrainzService.getArtistById('cc197bad-dc9c-440d-a5b5-d52ba2e14234');

// Combined search
const results = await musicbrainzService.combinedSearch('Coldplay', 5);
```

### TheAudioDB (Free Tier Available)

**Documentation:** https://www.theaudiodb.com/api_guide.php

TheAudioDB provides album artwork, artist images, and detailed music information.

**Features:**
- Artist search with images and biography
- Album search with cover art
- Track search with metadata
- Popular tracks per artist
- Music videos

**Configuration:**
Add to your `.env` file:
```
AUDIODB_API_KEY=2  # Default free key, or get your own
```

**Usage:**
```javascript
const audiodbService = require('./services/audiodb.service');

// Search for artists
const artists = await audiodbService.searchArtist('Coldplay');

// Get artist discography
const discography = await audiodbService.getDiscography('Coldplay');

// Search for albums
const albums = await audiodbService.searchAlbums('Coldplay');

// Get album tracks
const tracks = await audiodbService.getAlbumTracks('album-id');

// Get popular tracks
const popular = await audiodbService.getArtistPopularTracks('Coldplay');
```

### Music Discovery Service (Combined)

This service combines MusicBrainz and TheAudioDB for comprehensive music search.

**Usage:**
```javascript
const musicDiscoveryService = require('./services/musicDiscovery.service');

// Search across all sources
const results = await musicDiscoveryService.search('Coldplay', { type: 'all', limit: 10 });
// Returns: { tracks: [], artists: [], albums: [] }

// Search specific types
const artists = await musicDiscoveryService.searchArtists('Coldplay');
const albums = await musicDiscoveryService.searchAlbums('Parachutes');

// Get detailed artist info with discography
const artistDetails = await musicDiscoveryService.getArtistDetails('Coldplay');

// Get album details with tracks
const albumDetails = await musicDiscoveryService.getAlbumDetails('album-id');
```

## 🎙️ Podcast APIs

### ListenNotes (Free Tier Available)

**Documentation:** https://www.listennotes.com/api/

ListenNotes provides podcast search, episodes, and metadata across millions of shows.

**Features:**
- Search podcasts and episodes
- Get podcast details with episodes
- Best podcasts by genre
- Trending podcasts

**Configuration:**
Add to your `.env` file:
```
LISTENNOTES_API_KEY=your_api_key_here
```

**Usage:**
```javascript
const listennotesService = require('./services/listennotes.service');

// Check if configured
if (listennotesService.isConfigured()) {
  // Search podcasts
  const results = await listennotesService.search('technology', { type: 'podcast' });
  
  // Get podcast details
  const podcast = await listennotesService.getPodcast('podcast-id');
  
  // Get episodes
  const episodes = await listennotesService.getPodcastEpisodes('podcast-id');
  
  // Get best podcasts
  const best = await listennotesService.getBestPodcasts();
  
  // Get trending
  const trending = await listennotesService.getTrending();
}
```

### PodcastIndex (Free - Requires API Key + Secret)

**Documentation:** https://podcastindex-org.github.io/docs-api/

PodcastIndex is an open index of podcasts with simple API endpoints.

**Features:**
- Search podcasts and episodes
- Get trending podcasts
- Get podcasts by category
- Recent episodes

**Configuration:**
Add to your `.env` file:
```
PODCASTINDEX_API_KEY=your_api_key
PODCASTINDEX_API_SECRET=your_api_secret
```

**Usage:**
```javascript
const podcastindexService = require('./services/podcastindex.service');

// Check if configured
if (podcastindexService.isConfigured()) {
  // Search podcasts
  const results = await podcastindexService.search('technology');
  
  // Get podcast by ID
  const podcast = await podcastindexService.getPodcast('podcast-id');
  
  // Get episodes
  const episodes = await podcastindexService.getEpisodes('podcast-id');
  
  // Get trending
  const trending = await podcastindexService.getTrending(20);
  
  // Get categories
  const categories = await podcastindexService.getCategories();
}
```

### Podcast Discovery Service (Combined)

This service combines ListenNotes and PodcastIndex for comprehensive podcast search.

**Usage:**
```javascript
const podcastDiscoveryService = require('./services/podcastDiscovery.service');

// Check if any API is configured
if (podcastDiscoveryService.isConfigured()) {
  // Search across all sources
  const results = await podcastDiscoveryService.search('technology', { type: 'podcast' });
  
  // Get trending podcasts
  const trending = await podcastDiscoveryService.getTrending(20);
  
  // Get podcast details
  const podcast = await podcastDiscoveryService.getPodcast('id', 'listennotes');
  
  // Get episodes
  const episodes = await podcastDiscoveryService.getEpisodes('id', 'listennotes');
  
  // Search episodes
  const episodes = await podcastDiscoveryService.searchEpisodes('javascript');
}
```

## 🔌 API Endpoints

### Music Discovery Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/music/discover/search` | GET | Search music across all sources |
| `/api/music/discover/artists` | GET | Search artists |
| `/api/music/discover/albums` | GET | Search albums |
| `/api/music/discover/artist/:name` | GET | Get artist details |
| `/api/music/discover/album/:id` | GET | Get album details |
| `/api/music/discover/artist/:name/popular` | GET | Get artist's popular tracks |
| `/api/music/musicbrainz/search` | GET | Direct MusicBrainz search |
| `/api/music/musicbrainz/:type/:mbid` | GET | Get MusicBrainz entity |
| `/api/music/audiodb/search` | GET | Direct TheAudioDB search |
| `/api/music/audiodb/:type/:id` | GET | Get TheAudioDB entity |

### Podcast Discovery Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/podcasts/status/apis` | GET | Check API configuration status |
| `/api/podcasts/discover/search` | GET | Search podcasts |
| `/api/podcasts/discover/trending` | GET | Get trending podcasts |
| `/api/podcasts/discover/episodes` | GET | Search episodes |
| `/api/podcasts/discover/podcast/:id` | GET | Get podcast details |
| `/api/podcasts/discover/podcast/:id/episodes` | GET | Get podcast episodes |
| `/api/podcasts/listennotes/search` | GET | Direct ListenNotes search |
| `/api/podcasts/podcastindex/search` | GET | Direct PodcastIndex search |

## 🔧 Environment Variables

Add these to your `backend/.env` file:

```env
# TheAudioDB (Optional - has default free key)
AUDIODB_API_KEY=2

# ListenNotes (Optional - get free key at listennotes.com)
LISTENNOTES_API_KEY=your_key_here

# PodcastIndex (Optional - get free key at podcastindex.org)
PODCASTINDEX_API_KEY=your_key_here
PODCASTINDEX_API_SECRET=your_secret_here
```

## 📝 Example API Calls

### Search for Music
```bash
# Combined search
curl "http://localhost:5000/api/music/discover/search?q=Coldplay&type=all&limit=10"

# Search artists
curl "http://localhost:5000/api/music/discover/artists?q=Coldplay&limit=5"

# Get artist details
curl "http://localhost:5000/api/music/discover/artist/Coldplay"
```

### Search for Podcasts
```bash
# Search podcasts
curl "http://localhost:5000/api/podcasts/discover/search?q=technology&type=podcast"

# Get trending
curl "http://localhost:5000/api/podcasts/discover/trending?limit=10"

# Check API status
curl "http://localhost:5000/api/podcasts/status/apis"
```

## ⚠️ Rate Limits & Best Practices

1. **MusicBrainz**: Maximum 1 request per second. The service includes built-in rate limiting.

2. **TheAudioDB**: Be respectful of their free tier limits. Consider getting your own API key for production.

3. **ListenNotes**: Free tier has monthly request limits. Monitor your usage.

4. **PodcastIndex**: Generally generous limits, but be reasonable.

## 🔄 Response Format

All services return a consistent response format:

```javascript
{
  success: true/false,
  data: { ... } or [ ... ],
  error: "Error message if failed"
}
```

## 🎯 Frontend Integration

The frontend uses the `discoveryApi.js` client to communicate with these backend endpoints:

```javascript
import { musicDiscoveryApi, podcastDiscoveryApi, combinedSearch } from '../lib/discoveryApi';

// Search music
const musicResults = await musicDiscoveryApi.search('Coldplay');

// Search podcasts
const podcastResults = await podcastDiscoveryApi.search('technology');

// Combined search
const allResults = await combinedSearch('Coldplay');
```

## 📚 Additional Resources

- [MusicBrainz API Docs](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2)
- [TheAudioDB API Guide](https://www.theaudiodb.com/api_guide.php)
- [ListenNotes API Docs](https://www.listennotes.com/api/)
- [PodcastIndex API Docs](https://podcastindex-org.github.io/docs-api/)