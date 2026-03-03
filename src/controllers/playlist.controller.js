const playlistModel = require('../models/playlist.model');

const getUserPlaylists = async (req, res, next) => {
  try {
    const { data, error } = await playlistModel.getByUser(req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { data, error } = await playlistModel.findById(req.params.id);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Playlist not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, theme_color } = req.body;
    const { data, error } = await playlistModel.create({
      name,
      description,
      theme_color,
      user_id: req.user.id
    });
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const addTrack = async (req, res, next) => {
  try {
    const { track_id, position } = req.body;
    const { data, error } = await playlistModel.addTrack(
      req.params.id,
      track_id,
      position
    );
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const removeTrack = async (req, res, next) => {
  try {
    const { error } = await playlistModel.removeTrack(
      req.params.id,
      req.params.trackId
    );
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const deletePlaylist = async (req, res, next) => {
  try {
    const { error } = await playlistModel.delete(req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserPlaylists,
  getById,
  create,
  addTrack,
  removeTrack,
  delete: deletePlaylist
};