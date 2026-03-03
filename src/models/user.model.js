const { getSupabase } = require('../config/db');

class UserModel {
  constructor() {
    this.tableName = 'users';
  }

  async findById(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('id', id).single();
  }

  async findByEmail(email) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('*').eq('email', email).single();
  }

  async create(userData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).insert(userData).select().single();
  }

  async update(id, userData) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).update(userData).eq('id', id).select().single();
  }

  async updateSoundDNA(id, soundDNA) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .update({ sound_dna_json: soundDNA })
      .eq('id', id)
      .select()
      .single();
  }

  async delete(id) {
    const supabase = getSupabase();
    return supabase.from(this.tableName).delete().eq('id', id);
  }

  async getAll(limit = 50, offset = 0) {
    const supabase = getSupabase();
    return supabase.from(this.tableName)
      .select('id, email, name, role, created_at')
      .range(offset, offset + limit - 1);
  }

  async count() {
    const supabase = getSupabase();
    return supabase.from(this.tableName).select('id', { count: 'exact', head: true });
  }
}

module.exports = new UserModel();