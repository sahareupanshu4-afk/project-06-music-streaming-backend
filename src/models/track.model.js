const { getSupabase } = require('../config/db');

class TrackModel {
  constructor() {
    this.tableName = 'tracks';
  }

  async findAll(options = {}) {
    const supabase = getSupabase();
    let query = supabase.from(this.tableName).select('*');
    
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    if (options.realm) query = query.eq('realm', options.realm);
    if (options.energy) query = query.eq('energy_level', options.energy);
    if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    
    return query;
  }

  async findById(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('id', id).single();
  }

  async search(query) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`);
  }

  async getByRealm(realm) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('realm', realm);
  }

  async getByEnergy(energy) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('energy_level', energy);
  }

  async getTopPlayed(limit = 10) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .select('*')
      .order('play_count', { ascending: false })
      .limit(limit);
  }

  async incrementPlayCount(id) {
    const supabase = getSupabase();
    const { data: track } = await supabase.from(this.tableName).select('play_count').eq('id', id).single();
    if (track) {
      return supabase.from(this.tableName)
        .update({ play_count: (track.play_count || 0) + 1 })
        .eq('id', id);
    }
  }

  async create(trackData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).insert(trackData).select().single();
  }

  async update(id, trackData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).update(trackData).eq('id', id).select().single();
  }

  async delete(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).delete().eq('id', id);
  }
}

module.exports = new TrackModel();