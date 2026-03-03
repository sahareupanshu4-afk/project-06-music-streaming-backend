const express = require('express');
const router = express.Router();
const axios = require('axios');

// Audio proxy endpoint - bypasses CORS by fetching audio server-side
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Decode the URL
    const audioUrl = decodeURIComponent(url);
    console.log('Audio proxy request:', audioUrl);

    // Prepare headers for the request
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity'
    };

    // Forward range header for seeking support
    if (req.headers.range) {
      requestHeaders['Range'] = req.headers.range;
    }

    // Fetch the audio file
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: requestHeaders,
      maxRedirects: 5
    });

    console.log('Audio proxy response:', response.status, response.headers['content-type']);

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Forward content-length and content-range if present
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    // Set status code to match the response (206 for partial content, 200 for full)
    res.status(response.status);

    // Pipe the audio stream to response
    response.data.pipe(res);

  } catch (error) {
    console.error('Audio proxy error:', error.message, error.response?.status);
    if (!res.headersSent) {
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch audio' });
    }
  }
});

// Handle OPTIONS for CORS preflight
router.options('/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.status(200).end();
});

// Test endpoint with a working audio file
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Audio proxy is working',
    usage: 'Use /api/audio/proxy?url=<encoded-audio-url> to stream audio'
  });
});

module.exports = router;