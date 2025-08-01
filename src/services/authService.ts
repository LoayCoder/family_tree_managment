// src/services/authService.ts
import { supabase } from './arabicFamilyService';

export interface UserRole {
  id: string;
  name: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager';
  description: string;
  permissions: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role_id: string;
  role_name: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role_name: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager';
  full_name?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export const authService = {
  // Get current user with role information
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      // Get user profile with role information using the safe view
      const { data: profile, error } = await supabase
        .from('user_profile_safe')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (!profile) {
        throw new Error('لم يتم العثور على ملف المستخدم. يرجى التواصل مع المدير.');
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        role_name: profile.role_name,
        full_name: profile.full_name,
        approval_status: profile.approval_status
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  // Sign up new user
  async signUp(email: string, password: string, fullName: string, requestedRole: 'family_member' | 'content_writer' | 'level_manager' | 'viewer' | 'editor' = 'family_member') {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_level: requestedRole // This will be used by the trigger to set the role
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in user
  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Get the user profile to check approval status
      if (data.user) {
        const userProfile = await this.getCurrentUser();
        return { ...data, userProfile };
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get all user profiles (admin only)
  async getAllUserProfiles(): Promise<UserProfile[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('user_profile_safe')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all user profiles:', error);
      throw error;
    }
  },

  // Get pending user approvals (admin only)
  async getPendingApprovals(): Promise<UserProfile[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('user_profile_safe')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  },

  // Approve user (admin only)
  async approveUser(userId: string, approverId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase.rpc('approve_user', {
        user_id: userId,
        approver_id: approverId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  // Reject user (admin only)
  async rejectUser(userId: string, approverId: string, reason?: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase.rpc('reject_user', {
        user_id: userId,
        approver_id: approverId,
        reason: reason
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  },

  // Change user role (admin only)
  async changeUserRole(userId: string, newRoleName: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager', changerId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase.rpc('change_user_role', {
        user_id: userId,
        new_role_name: newRoleName,
        changer_id: changerId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  },

  // Get all available roles
  async getAllRoles(): Promise<UserRole[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // First delete the user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Then delete the auth user (this might require admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.warn('Could not delete auth user:', authError);
        // Don't throw here as the profile deletion is more important
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Check if user has specific permission
  hasPermission(userRole: string, permission: string): boolean {
    const rolePermissions = {
      family_secretary: ['*'], // Super admin has all permissions
      admin: ['*'], // Legacy admin role
      family_member: ['read', 'view_approved'],
      content_writer: ['read', 'write', 'create_content'],
      level_manager: ['read', 'write', 'manage_branch', 'edit_branch_data'],
      editor: ['read', 'write', 'edit'], // Legacy editor role
      viewer: ['read'] // Legacy viewer role
    };

    const permissions = rolePermissions[userRole as keyof typeof rolePermissions] || [];
    return permissions.includes('*') || permissions.includes(permission);
  },

  // Check if user can access feature
  canAccess(userRole: string, requiredRole: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager'): boolean {
    const roleLevels = { 
      viewer: 1, 
      family_member: 2, 
      content_writer: 3, 
      level_manager: 4,
      editor: 5, 
      admin: 6,
      family_secretary: 7 
    };
    const userLevel = roleLevels[userRole as keyof typeof roleLevels] || 0;
    const requiredLevel = roleLevels[requiredRole];
    
    return userLevel >= requiredLevel;
  }
};
