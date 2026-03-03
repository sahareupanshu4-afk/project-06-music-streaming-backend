require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to database (Supabase)
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
  🎵 SoundVerse Backend Server Running!
  
  📍 Local:    http://localhost:${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📊 Health:   http://localhost:${PORT}/health
  
  📡 API Endpoints:
     - Auth:    /api/auth
     - Music:   /api/music
     - Podcast: /api/podcasts
     - Playlist: /api/playlists
     - Admin:   /api/admin
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();