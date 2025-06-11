import { createClient } from '@supabase/supabase-js';
import { FamilyMember, FamilyMemberWithLevel } from '../types/FamilyMember';

// Check if environment variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create client if both URL and key are provided and valid
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
  }
}

export { supabase };

export const familyService = {
  // Add a new family member
  async addMember(memberData: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert([{
        ...memberData,
        parent_id: memberData.parent_id || null,
        birth_date: memberData.birth_date || null,
        gender: memberData.gender || null,
        phone: memberData.phone || null,
        notes: memberData.notes || null,
        is_alive: memberData.is_alive ?? true,
        date_of_death: memberData.date_of_death || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all family members
  async getAllMembers(): Promise<FamilyMember[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get family tree with levels using recursive CTE
  async getFamilyTree(): Promise<FamilyMemberWithLevel[]> {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning empty array.');
      return [];
    }

    const { data, error } = await supabase.rpc('get_family_tree');

    if (error) {
      console.error('Error fetching family tree:', error);
      // Fallback to simple query if RPC function doesn't exist
      return this.getFamilyTreeFallback();
    }

    return data || [];
  },

  // Fallback method to build family tree manually
  async getFamilyTreeFallback(): Promise<FamilyMemberWithLevel[]> {
    if (!supabase) {
      return [];
    }

    const members = await this.getAllMembers();
    const membersWithLevel: FamilyMemberWithLevel[] = [];

    // Function to calculate level recursively
    const calculateLevel = (member: FamilyMember, visited = new Set()): number => {
      if (visited.has(member.id)) return 0; // Prevent infinite recursion
      visited.add(member.id);

      if (!member.parent_id) return 0;
      
      const parent = members.find(m => m.id === member.parent_id);
      if (!parent) return 0;
      
      return calculateLevel(parent, visited) + 1;
    };

    // Calculate levels for all members
    members.forEach(member => {
      const level = calculateLevel(member);
      membersWithLevel.push({ ...member, level });
    });

    return membersWithLevel.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'ar'));
  },

  // Update a family member
  async updateMember(id: string, updates: Partial<FamilyMember>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a family member
  async deleteMember(id: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};