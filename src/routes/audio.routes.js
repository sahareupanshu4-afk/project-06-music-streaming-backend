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

    // Fetch the audio file
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
      timeout: 30000
    });

    console.log('Audio proxy response:', response.status, response.headers['content-type']);

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Pipe the audio stream to response
    response.data.pipe(res);

  } catch (error) {
    console.error('Audio proxy error:', error.message, error.response?.status);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
});

// Test endpoint with a working audio file
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Audio proxy is working',
    usage: 'Use /api/audio/proxy?url=<encoded-audio-url> to stream audio'
  });
});

module.exports = router;