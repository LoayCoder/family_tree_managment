import { supabase } from './arabicFamilyService';

export interface ChildCard {
  id: number;
  parentId: number;
  displayData: {
    name: string;
    birthYear: number;
    currentAge?: number;
    status: 'alive' | 'deceased';
    primaryTitle: string;
    thumbnail?: string;
  };
  quickStats: {
    hasChildren: boolean;
    childrenCount: number;
    achievementsCount: number;
    isMarried: boolean;
    spouse?: string;
  };
  visualTheme: {
    inheritedColor: string;
    generationLevel: number;
    branchIndicator: string;
  };
  fullData: {
    birthDate?: string;
    deathDate?: string;
    location?: string;
    nationalId?: string;
    position?: string;
    education?: string;
    notes?: string;
  };
}

export interface ChildrenDisplayState {
  isExpanded: boolean;
  showingChildren: boolean;
  childrenLoadState: 'idle' | 'loading' | 'loaded' | 'error';
  displayMode: 'count' | 'preview' | 'full' | 'tree';
  maxPreview: number;
}

export const childrenService = {
  // Get children with comprehensive stats
  async getPersonChildrenWithStats(personId: number): Promise<ChildCard[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Get direct children
      const { data: children, error } = await supabase
        .from('عرض_الأشخاص_كامل')
        .select(`
          id,
          الاسم_الكامل,
          الاسم_الأول,
          تاريخ_الميلاد,
          تاريخ_الوفاة,
          المنصب,
          مستوى_التعليم,
          اسم_الفرع,
          مكان_الميلاد,
          رقم_هوية_وطنية,
          مستوى_الجيل,
          ملاحظات
        `)
        .eq('father_id', personId)
        .order('تاريخ_الميلاد', { ascending: true });

      if (error) throw error;

      if (!children || children.length === 0) {
        return [];
      }

      // Get additional stats for each child
      const childrenWithStats = await Promise.all(
        children.map(async (child) => {
          // Get grandchildren count
          const { count: grandchildrenCount } = await supabase
            .from('الأشخاص')
            .select('id', { count: 'exact', head: true })
            .eq('father_id', child.id);

          // Get achievements count
          const { count: achievementsCount } = await supabase
            .from('الأحداث')
            .select('معرف_الحدث', { count: 'exact', head: true })
            .eq('معرف_الشخص', child.id);

          // Get spouse information
          const { data: spouseData } = await supabase
            .from('ارتباط_النساء')
            .select(`
              النساء!inner(الاسم_الأول, اسم_الأب, اسم_العائلة)
            `)
            .eq('person_id', child.id)
            .eq('نوع_الارتباط', 'زوجة')
            .limit(1);

          const spouse = spouseData?.[0]?.النساء;
          const spouseName = spouse 
            ? `${spouse.الاسم_الأول} ${spouse.اسم_الأب || ''} ${spouse.اسم_العائلة || ''}`.trim()
            : undefined;

          // Calculate age
          const birthDate = child.تاريخ_الميلاد ? new Date(child.تاريخ_الميلاد) : null;
          const deathDate = child.تاريخ_الوفاة ? new Date(child.تاريخ_الوفاة) : null;
          const currentAge = birthDate 
            ? Math.floor((deathDate || new Date()).getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
            : undefined;

          // Generate color based on generation
          const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
          ];
          const colorIndex = (child.مستوى_الجيل - 1) % colors.length;

          return {
            id: child.id,
            parentId: personId,
            displayData: {
              name: child.الاسم_الكامل || child.الاسم_الأول,
              birthYear: birthDate ? birthDate.getFullYear() : 0,
              currentAge: currentAge ? Math.floor(currentAge) : undefined,
              status: child.تاريخ_الوفاة ? 'deceased' as const : 'alive' as const,
              primaryTitle: child.المنصب || 'غير محدد',
              thumbnail: undefined // Will be handled by UI
            },
            quickStats: {
              hasChildren: (grandchildrenCount || 0) > 0,
              childrenCount: grandchildrenCount || 0,
              achievementsCount: achievementsCount || 0,
              isMarried: !!spouseName,
              spouse: spouseName
            },
            visualTheme: {
              inheritedColor: colors[colorIndex],
              generationLevel: child.مستوى_الجيل,
              branchIndicator: child.اسم_الفرع || 'الفرع الرئيسي'
            },
            fullData: {
              birthDate: child.تاريخ_الميلاد,
              deathDate: child.تاريخ_الوفاة,
              location: child.مكان_الميلاد,
              nationalId: child.رقم_هوية_وطنية,
              position: child.المنصب,
              education: child.مستوى_التعليم,
              notes: child.ملاحظات
            }
          } as ChildCard;
        })
      );

      return childrenWithStats;
    } catch (error) {
      console.error('Error fetching children with stats:', error);
      throw error;
    }
  },

  // Get descendants tree (multi-generation)
  async getDescendantsTree(rootPersonId: number, maxDepth: number = 3): Promise<any[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase.rpc('get_descendants_tree', {
        root_person_id: rootPersonId,
        max_depth: maxDepth
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching descendants tree:', error);
      return [];
    }
  },

  // Get children count only (for quick display)
  async getChildrenCount(personId: number): Promise<number> {
    if (!supabase) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('الأشخاص')
        .select('id', { count: 'exact', head: true })
        .eq('father_id', personId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching children count:', error);
      return 0;
    }
  }
};