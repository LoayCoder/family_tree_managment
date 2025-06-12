// Re-export the consolidated Supabase client and services from arabicFamilyService
export { supabase } from './arabicFamilyService';

// Legacy compatibility types - map to Arabic service types
export interface FamilyMember {
  id: string;
  name: string;
  parent_id?: string | null;
  birth_date?: string | null;
  gender?: 'ذكر' | 'أنثى' | null;
  phone?: string | null;
  notes?: string | null;
  is_alive?: boolean;
  date_of_death?: string | null;
  created_at?: string;
  updated_at?: string;
  level?: number;
}

export interface FamilyMemberWithLevel extends FamilyMember {
  level: number;
  children_count?: number;
}

// Custom error class for deletion constraints
export class DeletionConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeletionConstraintError';
  }
}

// Adapter functions to maintain compatibility with existing components
export const legacyFamilyService = {
  async addMember(memberData: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>) {
    const { supabase } = await import('./arabicFamilyService');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Convert legacy format to Arabic format
    const arabicMemberData = {
      الاسم_الأول: memberData.name,
      father_id: memberData.parent_id ? parseInt(memberData.parent_id) : null,
      تاريخ_الميلاد: memberData.birth_date || null,
      الجنس: memberData.gender || null,
      ملاحظات: memberData.notes || null,
      تاريخ_الوفاة: memberData.date_of_death || null,
    };

    const { data, error } = await supabase
      .from('الأشخاص')
      .insert([arabicMemberData])
      .select()
      .single();

    if (error) throw error;
    
    // Convert back to legacy format
    return {
      id: data.id.toString(),
      name: data.الاسم_الأول,
      parent_id: data.father_id?.toString() || null,
      birth_date: data.تاريخ_الميلاد,
      gender: data.الجنس,
      notes: data.ملاحظات,
      is_alive: !data.تاريخ_الوفاة,
      date_of_death: data.تاريخ_الوفاة,
      created_at: data.تاريخ_الإنشاء,
      updated_at: data.تاريخ_التحديث
    };
  },

  async getAllMembers(): Promise<FamilyMember[]> {
    const { arabicFamilyService } = await import('./arabicFamilyService');
    const persons = await arabicFamilyService.getAllPersons();
    
    return persons.map(person => ({
      id: person.id.toString(),
      name: person.الاسم_الأول,
      parent_id: person.father_id?.toString() || null,
      birth_date: person.تاريخ_الميلاد,
      gender: person.الجنس,
      notes: person.ملاحظات,
      is_alive: !person.تاريخ_الوفاة,
      date_of_death: person.تاريخ_الوفاة,
      created_at: person.تاريخ_الإنشاء,
      updated_at: person.تاريخ_التحديث
    }));
  },

  async getFamilyTree(): Promise<FamilyMemberWithLevel[]> {
    const { arabicFamilyService } = await import('./arabicFamilyService');
    const personsWithDetails = await arabicFamilyService.getPersonsWithDetails();
    
    return personsWithDetails.map(person => ({
      id: person.id.toString(),
      name: person.الاسم_الكامل || person.الاسم_الأول,
      parent_id: person.father_id?.toString() || null,
      birth_date: person.تاريخ_الميلاد,
      gender: person.الجنس,
      notes: person.ملاحظات,
      is_alive: !person.تاريخ_الوفاة,
      date_of_death: person.تاريخ_الوفاة,
      created_at: person.تاريخ_الإنشاء,
      updated_at: person.تاريخ_التحديث,
      level: person.مستوى_الجيل || 0
    }));
  },

  async updateMember(id: string, updates: Partial<FamilyMember>) {
    const { supabase } = await import('./arabicFamilyService');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Convert legacy format to Arabic format
    const arabicUpdates: any = {};
    if (updates.name) arabicUpdates.الاسم_الأول = updates.name;
    if (updates.parent_id !== undefined) arabicUpdates.father_id = updates.parent_id ? parseInt(updates.parent_id) : null;
    if (updates.birth_date !== undefined) arabicUpdates.تاريخ_الميلاد = updates.birth_date;
    if (updates.gender !== undefined) arabicUpdates.الجنس = updates.gender;
    if (updates.notes !== undefined) arabicUpdates.ملاحظات = updates.notes;
    if (updates.date_of_death !== undefined) arabicUpdates.تاريخ_الوفاة = updates.date_of_death;

    const { data, error } = await supabase
      .from('الأشخاص')
      .update(arabicUpdates)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    
    // Convert back to legacy format
    return {
      id: data.id.toString(),
      name: data.الاسم_الأول,
      parent_id: data.father_id?.toString() || null,
      birth_date: data.تاريخ_الميلاد,
      gender: data.الجنس,
      notes: data.ملاحظات,
      is_alive: !data.تاريخ_الوفاة,
      date_of_death: data.تاريخ_الوفاة,
      created_at: data.تاريخ_الإنشاء,
      updated_at: data.تاريخ_التحديث
    };
  },

  async deleteMember(id: string) {
    const { supabase } = await import('./arabicFamilyService');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const memberId = parseInt(id);

    // First, check if this member has any children
    const { data: children, error: childrenError } = await supabase
      .from('الأشخاص')
      .select('id, الاسم_الأول')
      .eq('father_id', memberId);

    if (childrenError) {
      throw childrenError;
    }

    // If children exist, prevent deletion
    if (children && children.length > 0) {
      const childrenNames = children.map(child => child.الاسم_الأول).join('، ');
      throw new DeletionConstraintError(
        `لا يمكن حذف هذا العضو لأنه والد لأعضاء آخرين في العائلة: ${childrenNames}. يجب حذف الأطفال أولاً أو تغيير والدهم قبل حذف هذا العضو.`
      );
    }

    // Also check if this member is referenced as a mother
    const { data: childrenAsMother, error: motherError } = await supabase
      .from('الأشخاص')
      .select('id, الاسم_الأول')
      .eq('mother_id', memberId);

    if (motherError) {
      throw motherError;
    }

    if (childrenAsMother && childrenAsMother.length > 0) {
      const childrenNames = childrenAsMother.map(child => child.الاسم_الأول).join('، ');
      throw new DeletionConstraintError(
        `لا يمكن حذف هذا العضو لأنه والدة لأعضاء آخرين في العائلة: ${childrenNames}. يجب حذف الأطفال أولاً أو تغيير والدتهم قبل حذف هذا العضو.`
      );
    }

    // If no children, proceed with deletion
    const { error } = await supabase
      .from('الأشخاص')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }
};

// Export the legacy service as the default familyService for backward compatibility
export const familyService = legacyFamilyService;