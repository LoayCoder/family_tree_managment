import { createClient } from '@supabase/supabase-js';

// Check if environment variables are properly set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create client if both URL and key are provided and valid
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'family-tree-app'
        }
      },
      // Add retry configuration
      db: {
        schema: 'public'
      },
      // Configure realtime to handle connection issues
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
  }
}

export { supabase };

// Types for Arabic Family Tree System
export interface Location {
  معرف_الموقع: number;
  الدولة: string;
  المنطقة?: string;
  المدينة?: string;
  تفاصيل_إضافية?: string;
  تاريخ_الإنشاء?: string;
  تاريخ_التحديث?: string;
}

export interface Branch {
  معرف_الفرع: number;
  اسم_الفرع: string;
  وصف_الفرع?: string;
  الفرع_الأصل?: number;
  معرف_الموقع?: number;
  تاريخ_التأسيس?: string;
  مسار_الفرع?: string;
  ملاحظات?: string;
  تاريخ_الإنشاء?: string;
  تاريخ_التحديث?: string;
}

interface Person {
  id: number;
  الاسم_الأول: string;
  is_root?: boolean;
  تاريخ_الميلاد?: string;
  تاريخ_الوفاة?: string;
  مكان_الميلاد?: number;
  مكان_الوفاة?: number;
  رقم_هوية_وطنية?: string;
  الجنس?: 'ذكر' | 'أنثى';
  الحالة_الاجتماعية?: 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
  المنصب?: string;
  مستوى_التعليم?: string;
  father_id?: number;
  mother_id?: number;
  معرف_الفرع?: number;
  path: string;
  صورة_شخصية?: string;
  ملاحظات?: string;
  تاريخ_الإنشاء?: string;
  تاريخ_التحديث?: string;
}

interface Woman {
  id: number;
  الاسم_الأول: string;
  اسم_الأب?: string;
  اسم_العائلة?: string;
  تاريخ_الميلاد?: string;
  تاريخ_الوفاة?: string;
  مكان_الميلاد?: number;
  مكان_الوفاة?: number;
  رقم_هوية_وطنية?: string;
  الحالة_الاجتماعية?: 'عزباء' | 'متزوجة' | 'مطلقة' | 'أرملة';
  المنصب?: string;
  مستوى_التعليم?: string;
  معرف_الفرع?: number;
  صورة_شخصية?: string;
  ملاحظات?: string;
  تاريخ_الإنشاء?: string;
  تاريخ_التحديث?: string;
}

export interface PersonWithDetails extends Person {
  الاسم_الكامل: string;
  مستوى_الجيل: number;
  اسم_الأب?: string;
  اسم_الجد?: string;
  اسم_العائلة?: string;
  اسم_الفرع?: string;
  مكان_الميلاد?: string;
  مكان_الوفاة?: string;
  // Notable information
  is_notable?: boolean;
  notable_id?: number;
  notable_category?: string;
  notable_biography?: string;
  notable_education?: string;
  notable_positions?: string;
  notable_publications?: string;
  notable_contact_info?: string;
  notable_legacy?: string;
  notable_profile_picture_url?: string;
}

export const arabicFamilyService = {
  // Location Services
  async getAllLocations(): Promise<Location[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('المواقع')
      .select('*')
      .order('الدولة, المنطقة, المدينة');

    if (error) throw error;
    return data || [];
  },

  async addLocation(location: Omit<Location, 'معرف_الموقع' | 'تاريخ_الإنشاء' | 'تاريخ_التحديث'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('المواقع')
      .insert([location])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Branch Services
  async getAllBranches(): Promise<Branch[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('الفروع')
      .select('*')
      .order('اسم_الفرع');

    if (error) throw error;
    return data || [];
  },

  async addBranch(branch: Omit<Branch, 'معرف_الفرع' | 'تاريخ_الإنشاء' | 'تاريخ_التحديث'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('الفروع')
      .insert([branch])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Person Services
  async getAllPersons(): Promise<Person[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('الأشخاص')
      .select('*')
      .order('path');

    if (error) throw error;
    return data || [];
  },

  async getPersonsWithDetails(): Promise<PersonWithDetails[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Join with notables table to get notable information
    const { data, error } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select(`
        *,
        notables (
          id,
          category,
          biography,
          education,
          positions,
          publications,
          contact_info,
          legacy,
          profile_picture_url
        )
      `)
      .order('path');

    if (error) throw error;
    
    // Transform the data to include notable information
    const transformedData = (data || []).map(person => ({
      ...person,
      is_notable: !!person.notables,
      notable_id: person.notables?.id,
      notable_category: person.notables?.category,
      notable_biography: person.notables?.biography,
      notable_education: person.notables?.education,
      notable_positions: person.notables?.positions,
      notable_publications: person.notables?.publications,
      notable_contact_info: person.notables?.contact_info,
      notable_legacy: person.notables?.legacy,
      notable_profile_picture_url: person.notables?.profile_picture_url
    }));
    
    return transformedData;
  },

  async addPerson(person: Omit<Person, 'id' | 'path' | 'تاريخ_الإنشاء' | 'تاريخ_التحديث'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // The path will be automatically generated by the trigger
    const { data, error } = await supabase
      .from('الأشخاص')
      .insert([{ ...person, path: '0' }]) // Temporary path, will be updated by trigger
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePerson(id: number, updates: Partial<Person>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('الأشخاص')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePerson(id: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('الأشخاص')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Notable Services
  async addNotable(notableData: {
    person_id: number;
    category: string;
    biography?: string;
    education?: string;
    positions?: string;
    publications?: string;
    contact_info?: string;
    legacy?: string;
    profile_picture_url?: string;
  }) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('notables')
      .insert([notableData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNotable(notableId: number, updates: {
    category?: string;
    biography?: string;
    education?: string;
    positions?: string;
    publications?: string;
    contact_info?: string;
    legacy?: string;
    profile_picture_url?: string;
  }) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('notables')
      .update(updates)
      .eq('id', notableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNotable(notableId: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('notables')
      .delete()
      .eq('id', notableId);

    if (error) throw error;
  },

  // National ID Validation Services
  async isPersonNationalIdUnique(nationalId: string, excludePersonId?: number): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!nationalId || nationalId.trim() === '') {
      return true; // Empty national ID is allowed
    }

    let query = supabase
      .from('الأشخاص')
      .select('id')
      .eq('رقم_هوية_وطنية', nationalId.trim());

    // If we're updating an existing person, exclude their current record
    if (excludePersonId) {
      query = query.neq('id', excludePersonId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return !data || data.length === 0;
  },

  async isWomanNationalIdUnique(nationalId: string, excludeWomanId?: number): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!nationalId || nationalId.trim() === '') {
      return true; // Empty national ID is allowed
    }

    let query = supabase
      .from('النساء')
      .select('id')
      .eq('رقم_هوية_وطنية', nationalId.trim());

    // If we're updating an existing woman, exclude their current record
    if (excludeWomanId) {
      query = query.neq('id', excludeWomanId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return !data || data.length === 0;
  },

  // Woman Services
  async getAllWomen(): Promise<Woman[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('النساء')
      .select('*')
      .order('الاسم_الأول');

    if (error) throw error;
    return data || [];
  },

  async addWoman(woman: Omit<Woman, 'id' | 'تاريخ_الإنشاء' | 'تاريخ_التحديث'>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('النساء')
      .insert([woman])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Search Services
  async searchByNationalIdMen(nationalId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select('*')
      .eq('رقم_هوية_وطنية', nationalId);

    if (error) throw error;
    return data || [];
  },

  async searchByNationalIdWomen(nationalId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('النساء')
      .select('*')
      .eq('رقم_هوية_وطنية', nationalId);

    if (error) throw error;
    return data || [];
  },

  async getDescendants(personId: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('get_descendants', { person_id: personId });

    if (error) throw error;
    return data || [];
  },

  async getAncestors(personId: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('get_ancestors', { person_id: personId });

    if (error) throw error;
    return data || [];
  },

  async getSiblings(personId: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('get_siblings', { person_id: personId });

    if (error) throw error;
    return data || [];
  },

  // Statistics Services
  async getFamilyStatistics() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get total counts
    const [menCount, womenCount, branchCount, locationCount] = await Promise.all([
      supabase.from('الأشخاص').select('id', { count: 'exact', head: true }),
      supabase.from('النساء').select('id', { count: 'exact', head: true }),
      supabase.from('الفروع').select('معرف_الفرع', { count: 'exact', head: true }),
      supabase.from('المواقع').select('معرف_الموقع', { count: 'exact', head: true })
    ]);

    // Get generation statistics
    const { data: generationStats, error: genError } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select('مستوى_الجيل')
      .not('مستوى_الجيل', 'is', null);

    if (genError) throw genError;

    const generationCounts = generationStats?.reduce((acc: any, person: any) => {
      const level = person.مستوى_الجيل;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      totalMen: menCount.count || 0,
      totalWomen: womenCount.count || 0,
      totalBranches: branchCount.count || 0,
      totalLocations: locationCount.count || 0,
      generationCounts,
      maxGeneration: Math.max(...Object.keys(generationCounts).map(Number), 0)
    };
  },

  // Advanced Query Services
  async searchPersons(searchTerm: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select('*')
      .or(`الاسم_الأول.ilike.%${searchTerm}%,الاسم_الكامل.ilike.%${searchTerm}%,رقم_هوية_وطنية.ilike.%${searchTerm}%`)
      .order('مستوى_الجيل, الاسم_الأول');

    if (error) throw error;
    return data || [];
  },

  async getPersonsByGeneration(generation: number) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select('*')
      .eq('مستوى_الجيل', generation)
      .order('الاسم_الأول');

    if (error) throw error;
    return data || [];
  },

  async getPersonsByBranchName(branchName: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('عرض_الأشخاص_كامل')
      .select('*')
      .eq('اسم_الفرع', branchName)
      .order('مستوى_الجيل, الاسم_الأول');

    if (error) throw error;
    return data || [];
  }
};