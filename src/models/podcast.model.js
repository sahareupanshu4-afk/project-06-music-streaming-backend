const { getSupabase } = require('../config/db');

class PodcastModel {
  constructor() {
    this.tableName = 'podcasts';
  }

  async findAll(options = {}) {
    const supabase = getSupabase();
    let query = supabase.from(this.tableName).select('*');
    
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    
    return query;
  }

  async findById(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('id', id).single();
  }

  async create(podcastData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).insert(podcastData).select().single();
  }

  async update(id, podcastData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).update(podcastData).eq('id', id).select().single();
  }

  async delete(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).delete().eq('id', id);
  }
}

module.exports = new PodcastModel();