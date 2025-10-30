import { supabase } from '../config/supabase';
import type { CreateUserDTO, User } from '../types/user';

export const userService = {
  async createUser(userData: CreateUserDTO) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async listUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
  }
};