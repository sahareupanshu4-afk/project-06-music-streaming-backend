const userModel = require('../models/user.model');
const trackModel = require('../models/track.model');
const { getSupabase } = require('../config/db');

const getStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    const [usersCount, tracksCount, playlistsCount, podcastsCount] = await Promise.all([
      userModel.count(),
      supabase.from('tracks').select('id', { count: 'exact', head: true }),
      supabase.from('playlists').select('id', { count: 'exact', head: true }),
      supabase.from('podcasts').select('id', { count: 'exact', head: true })
    ]);

    res.json({
      users: usersCount.count || 0,
      tracks: tracksCount.count || 0,
      playlists: playlistsCount.count || 0,
      podcasts: podcastsCount.count || 0
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const { data, error } = await userModel.getAll(
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    const [topTracks, realmStats] = await Promise.all([
      trackModel.getTopPlayed(10),
      supabase.from('tracks').select('realm, play_count')
    ]);

    const realmPopularity = {};
    (realmStats.data || []).forEach(track => {
      if (track.realm) {
        realmPopularity[track.realm] = (realmPopularity[track.realm] || 0) + (track.play_count || 0);
      }
    });

    res.json({
      topTracks: topTracks.data || [],
      realmPopularity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers, getAnalytics };