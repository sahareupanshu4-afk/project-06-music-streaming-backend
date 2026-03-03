const { getSupabase } = require('../config/db');

class PlaylistModel {
  constructor() {
    this.tableName = 'playlists';
    this.junctionTable = 'playlist_tracks';
  }

  async findById(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .select(`*, playlist_tracks(position, tracks(*))`)
      .eq('id', id)
      .single();
  }

  async getByUser(userId) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .select('*')
      .eq('user_id', userId);
  }

  async create(playlistData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).insert(playlistData).select().single();
  }

  async addTrack(playlistId, trackId, position) {
    const supabase = getSupabase();
    return supabase.from(this.junctionTable)
      .insert({ playlist_id: playlistId, track_id: trackId, position })
      .select()
      .single();
  }

  async removeTrack(playlistId, trackId) {
    const supabase = getSupabase();
    return supabase.from(this.junctionTable)
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);
  }

  async delete(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).delete().eq('id', id);
  }
}

module.exports = new PlaylistModel();