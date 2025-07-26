import { supabase } from '../services/arabicFamilyService';

export const getCurrentUserLevel = async (): Promise<string> => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        approval_status,
        roles!inner(name)
      `)
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    
    if (!profile || profile.approval_status !== 'approved') {
      throw new Error('User not approved');
    }

    return profile.roles.name;
  } catch (error) {
    console.error('Error getting user level:', error);
    return '';
  }
};

export const checkUserPermission = async (requiredLevel: string): Promise<boolean> => {
  try {
    const userLevel = await getCurrentUserLevel();
    
    // Define permission hierarchy
    const permissions: Record<string, string[]> = {
      family_secretary: ['family_secretary', 'level_manager', 'content_writer', 'family_member', 'admin', 'editor', 'viewer'],
      level_manager: ['level_manager', 'family_member'],
      content_writer: ['content_writer'],
      family_member: ['family_member'],
      admin: ['admin', 'editor', 'viewer'], // Legacy
      editor: ['editor', 'viewer'], // Legacy
      viewer: ['viewer'] // Legacy
    };

    return permissions[userLevel]?.includes(requiredLevel) || false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

export const getUserDisplayName = (userLevel: string): string => {
  const displayNames: Record<string, string> = {
    family_secretary: 'أمين العائلة',
    level_manager: 'مدير فرع',
    content_writer: 'كاتب محتوى',
    family_member: 'عضو عائلة',
    admin: 'مدير (قديم)',
    editor: 'محرر (قديم)',
    viewer: 'مشاهد (قديم)'
  };

  return displayNames[userLevel] || userLevel;
};