import React, { useState, useEffect } from 'react';
import { Shield, User, CheckCircle, XCircle, Clock, ArrowLeft, Search, Filter, RefreshCw, FileText, Users, Calendar } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  role_name: 'admin' | 'editor' | 'viewer' | 'family_secretary' | 'level_manager' | 'content_writer' | 'family_member';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  assigned_branch_id?: number;
  branch_name?: string;
}

interface PendingChange {
  id: number;
  change_entity: 'person' | 'woman';
  change_type: 'insert' | 'update' | 'delete';
  entity_name: string;
  entity_id: number;
  submitted_by_user_id: string;
  submitted_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitter_name?: string;
}

interface PendingNewsPost {
  id: number;
  title: string;
  author_id: string;
  submitted_for_approval_at: string;
  author_name?: string;
}

interface Branch {
  معرف_الفرع: number;
  اسم_الفرع: string;
}

interface AdminPanelProps {
  onBack: () => void;
  currentUserId: string;
}

export default function AdminPanel({ onBack, currentUserId }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [userToReject, setUserToReject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'pending-changes' | 'pending-news'>('users');
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [pendingNews, setPendingNews] = useState<PendingNewsPost[]>([]);
  const [processingChange, setProcessingChange] = useState<number | null>(null);

  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [newLevel, setNewLevel] = useState<UserProfile['role_name']>('family_member');
  const [newBranchId, setNewBranchId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    loadUsers();
    loadPendingChanges();
    loadPendingNews();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get branch information for users with assigned branches
      const usersWithBranches = await Promise.all(
        (usersData || []).map(async (user) => {
          if (user.assigned_branch_id) {
            const { data: branchData } = await supabase
              .from('الفروع')
              .select('اسم_الفرع')
              .eq('معرف_الفرع', user.assigned_branch_id)
              .single();
            
            return {
              ...user,
              role_name: user.roles.name,
              branch_name: branchData?.اسم_الفرع
            };
          }
          return {
            ...user,
            role_name: user.roles.name
          };
        })
      );

      setUsers(usersWithBranches);

      const { data: branchesData, error: branchesError } = await supabase
        .from('الفروع')
        .select('معرف_الفرع, اسم_الفرع')
        .order('اسم_الفرع');
      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingChanges = async () => {
    try {
      if (!supabase) return;

      // Get pending person changes
      const { data: personChanges, error: personError } = await supabase
        .from('pending_person_changes')
        .select('*')
        .eq('approval_status', 'pending')
        .order('submitted_at', { ascending: false });

      if (personError) throw personError;

      // Get pending woman changes
      const { data: womanChanges, error: womanError } = await supabase
        .from('pending_woman_changes')
        .select('*')
        .eq('approval_status', 'pending')
        .order('submitted_at', { ascending: false });

      if (womanError) throw womanError;

      // Combine and format changes
      const allChanges = [
        ...(personChanges || []).map(change => ({ ...change, change_entity: 'person' as const })),
        ...(womanChanges || []).map(change => ({ ...change, change_entity: 'woman' as const }))
      ];

      // Get submitter names
      const changesWithNames = await Promise.all(
        allChanges.map(async (change) => {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', change.submitted_by_user_id)
            .single();
          
          return {
            ...change,
            submitter_name: userData?.full_name || userData?.email || 'غير معروف'
          };
        })
      );

      setPendingChanges(changesWithNames);
    } catch (error) {
      console.error('Error loading pending changes:', error);
    }
  };

  const loadPendingNews = async () => {
    try {
      if (!supabase) return;

      const { data: newsData, error } = await supabase
        .from('news_posts')
        .select('id, title, author_id, submitted_for_approval_at')
        .eq('status', 'pending_approval')
        .order('submitted_for_approval_at', { ascending: false });

      if (error) throw error;

      // Get author names
      const newsWithAuthors = await Promise.all(
        (newsData || []).map(async (post) => {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', post.author_id)
            .single();
          
          return {
            ...post,
            author_name: userData?.full_name || userData?.email || 'غير معروف'
          };
        })
      );

      setPendingNews(newsWithAuthors);
    } catch (error) {
      console.error('Error loading pending news:', error);
    }
  };

  const approveUser = async (userId: string, roleName: UserProfile['role_name'], branchId: number | null) => {
    setProcessingUser(userId);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get the role ID for the selected role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError) throw roleError;

      // Update user profile with role_id and approval
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role_id: roleData.id,
          approval_status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
          assigned_branch_id: branchId
        })
        .eq('id', userId);

      if (error) throw error;
      
      loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('حدث خطأ أثناء الموافقة على المستخدم');
    } finally {
      setProcessingUser(null);
    }
  };

  const approveChange = async (changeId: number, changeEntity: 'person' | 'woman') => {
    setProcessingChange(changeId);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      const functionName = changeEntity === 'person' ? 'approve_person_change' : 'approve_woman_change';
      const { error } = await supabase.rpc(functionName, {
        p_pending_id: changeId
      });

      if (error) throw error;
      
      loadPendingChanges();
    } catch (error) {
      console.error('Error approving change:', error);
      alert('حدث خطأ أثناء الموافقة على التغيير');
    } finally {
      setProcessingChange(null);
    }
  };

  const rejectChange = async (changeId: number, changeEntity: 'person' | 'woman', reason: string) => {
    setProcessingChange(changeId);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      const functionName = changeEntity === 'person' ? 'reject_person_change' : 'reject_woman_change';
      const { error } = await supabase.rpc(functionName, {
        p_pending_id: changeId,
        p_rejection_reason: reason
      });

      if (error) throw error;
      
      loadPendingChanges();
    } catch (error) {
      console.error('Error rejecting change:', error);
      alert('حدث خطأ أثناء رفض التغيير');
    } finally {
      setProcessingChange(null);
    }
  };

  const approveNewsPost = async (postId: number) => {
    setProcessingChange(postId);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error } = await supabase.rpc('approve_news_post', {
        p_post_id: postId
      });

      if (error) throw error;
      
      loadPendingNews();
    } catch (error) {
      console.error('Error approving news post:', error);
      alert('حدث خطأ أثناء الموافقة على المقال');
    } finally {
      setProcessingChange(null);
    }
  };

  const rejectNewsPost = async (postId: number, reason: string) => {
    setProcessingChange(postId);
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { error } = await supabase.rpc('reject_news_post', {
        p_post_id: postId,
        p_rejection_reason: reason
      });

      if (error) throw error;
      
      loadPendingNews();
    } catch (error) {
      console.error('Error rejecting news post:', error);
      alert('حدث خطأ أثناء رفض المقال');
    } finally {
      setProcessingChange(null);
    }
  };

  const openRejectModal = (userId: string) => {
    setUserToReject(userId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const rejectUser = async () => {
    if (!userToReject) return;
    
    setProcessingUser(userToReject);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.rpc('reject_user', {
        user_id: userToReject,
        approver_id: currentUserId,
        reason: rejectionReason || null
      });

      if (error) throw error;
      
      loadUsers();
      setShowRejectionModal(false);
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('حدث خطأ أثناء رفض المستخدم');
    } finally {
      setProcessingUser(null);
      setUserToReject(null);
    }
  };

  const openEditUserModal = (user: UserProfile) => {
    setUserToEdit(user);
    setNewLevel(user.role_name);
    setNewBranchId(user.assigned_branch_id || null);
    setShowEditUserModal(true);
  };

  const updateUserRole = async () => {
    if (!userToEdit) return;

    setProcessingUser(userToEdit.id);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get the role ID for the selected role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', newLevel)
        .single();

      if (roleError) throw roleError;

      // Update user profile with new role_id and branch
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role_id: roleData.id,
          assigned_branch_id: newBranchId
        })
        .eq('id', userToEdit.id);

      if (error) throw error;

      loadUsers();
      setShowEditUserModal(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('حدث خطأ أثناء تحديث صلاحيات المستخدم');
    } finally {
      setProcessingUser(null);
      setUserToEdit(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter !== 'all' && user.approval_status !== filter) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
            <Clock className="w-4 h-4" />
            قيد الانتظار
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            تمت الموافقة
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
            <XCircle className="w-4 h-4" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const getLevelBadge = (roleName: UserProfile['role_name']) => {
    switch (roleName) {
      case 'family_secretary':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
            أمين العائلة (مدير خارق)
          </span>
        );
      case 'admin':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
            مدير (قديم)
          </span>
        );
      case 'level_manager':
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
            مدير فرع
          </span>
        );
      case 'content_writer':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
            كاتب محتوى
          </span>
        );
      case 'editor':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
            محرر (قديم)
          </span>
        );
      case 'family_member':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
            عضو عائلة
          </span>
        );
      case 'viewer':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
            مشاهد (قديم)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            {roleName}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  لوحة تحكم المدير
                </h1>
                <p className="text-gray-600 text-sm">إدارة المستخدمين والموافقة على الحسابات</p>
              </div>
            </div>
            
            <button
              onClick={loadUsers}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="تحديث"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-red-50 text-red-700 border-b-2 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                إدارة المستخدمين
                {users.filter(u => u.approval_status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {users.filter(u => u.approval_status === 'pending').length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pending-changes')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'pending-changes'
                  ? 'bg-red-50 text-red-700 border-b-2 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                التغييرات المعلقة
                {pendingChanges.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingChanges.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pending-news')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'pending-news'
                  ? 'bg-red-50 text-red-700 border-b-2 border-red-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                المقالات المعلقة
                {pendingNews.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingNews.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h2>
            
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث عن مستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>
              
                <div className="relative">
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="pr-10 pl-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    <option value="all">جميع المستخدمين</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="approved">تمت الموافقة</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pending Requests Section */}
            {filter === 'all' && filteredUsers.some(user => user.approval_status === 'pending') && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-amber-200">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="text-xl font-bold text-amber-800">طلبات الانضمام قيد الانتظار</h3>
                </div>
              
                <div className="space-y-4">
                  {filteredUsers
                    .filter(user => user.approval_status === 'pending')
                    .map(user => (
                      <div key={user.id} className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <User className="w-5 h-5 text-amber-700" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{user.full_name}</h4>
                              <p className="text-gray-600 text-sm">{user.email}</p>
                            </div>
                          </div>
                        
                          <div className="flex flex-wrap gap-2 mt-2">
                            {getLevelBadge(user.user_level)}
                            {getStatusBadge(user.approval_status)}
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200 text-sm">
                              تاريخ الطلب: {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                      
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => openEditUserModal(user)}
                            disabled={processingUser === user.id}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {processingUser === user.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            موافقة
                          </button>
                        
                          <button
                            onClick={() => openRejectModal(user.id)}
                            disabled={processingUser === user.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستوى
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>لا توجد نتائج مطابقة</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className={user.approval_status === 'pending' ? 'bg-amber-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getLevelBadge(user.role_name)}
                          {user.role_name === 'level_manager' && user.branch_name && (
                            <div className="text-xs text-purple-600 mt-1 font-medium">
                              الفرع المسؤول: {user.branch_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.approval_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          {user.approval_status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditUserModal(user)}
                                disabled={processingUser === user.id}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                              >
                                {processingUser === user.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                موافقة
                              </button>
                            
                              <button
                                onClick={() => openRejectModal(user.id)}
                                disabled={processingUser === user.id}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                              >
                                <XCircle className="w-3 h-3" />
                                رفض
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                            >
                              تعديل الصلاحيات
                            </button>
                          )}
                        
                          {user.approval_status === 'rejected' && user.rejection_reason && (
                            <div className="text-xs text-red-600">
                              سبب الرفض: {user.rejection_reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Changes Tab */}
        {activeTab === 'pending-changes' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">التغييرات المعلقة</h2>
              <button
                onClick={loadPendingChanges}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="تحديث"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {pendingChanges.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد تغييرات معلقة</h3>
                <p className="text-gray-500">جميع التغييرات تمت الموافقة عليها أو رفضها</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingChanges.map(change => (
                  <div key={`${change.change_entity}-${change.id}`} className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Users className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">
                              {change.change_type === 'insert' ? 'إضافة' :
                               change.change_type === 'update' ? 'تعديل' : 'حذف'} 
                              {change.change_entity === 'person' ? ' شخص' : ' امرأة'}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {change.entity_name} - مقدم من: {change.submitter_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200 text-sm">
                            {change.change_entity === 'person' ? 'شخص' : 'امرأة'}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200 text-sm">
                            {change.change_type === 'insert' ? 'إضافة' :
                             change.change_type === 'update' ? 'تعديل' : 'حذف'}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200 text-sm">
                            {formatDate(change.submitted_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveChange(change.id, change.change_entity)}
                          disabled={processingChange === change.id}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {processingChange === change.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          موافقة
                        </button>
                        
                        <button
                          onClick={() => {
                            const reason = prompt('سبب الرفض (اختياري):');
                            if (reason !== null) {
                              rejectChange(change.id, change.change_entity, reason);
                            }
                          }}
                          disabled={processingChange === change.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          رفض
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending News Tab */}
        {activeTab === 'pending-news' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">المقالات المعلقة</h2>
              <button
                onClick={loadPendingNews}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="تحديث"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {pendingNews.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد مقالات معلقة</h3>
                <p className="text-gray-500">جميع المقالات تمت الموافقة عليها أو رفضها</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingNews.map(post => (
                  <div key={post.id} className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-700" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{post.title}</h4>
                            <p className="text-gray-600 text-sm">
                              كاتب: {post.author_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200 text-sm">
                            مقال إخباري
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200 text-sm">
                            {formatDate(post.submitted_for_approval_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveNewsPost(post.id)}
                          disabled={processingChange === post.id}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {processingChange === post.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          موافقة ونشر
                        </button>
                        
                        <button
                          onClick={() => {
                            const reason = prompt('سبب رفض المقال (اختياري):');
                            if (reason !== null) {
                              rejectNewsPost(post.id, reason);
                            }
                          }}
                          disabled={processingChange === post.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          رفض
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">رفض طلب المستخدم</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  سبب الرفض (اختياري)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                  placeholder="أدخل سبب رفض الطلب..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                
                <button
                  onClick={rejectUser}
                  disabled={processingUser === userToReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingUser === userToReject ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {userToEdit.approval_status === 'pending' ? 'موافقة وتعيين المستخدم' : 'تعديل صلاحيات المستخدم'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{userToEdit.full_name || userToEdit.email}</h4>
                  <p className="text-gray-600 text-sm">{userToEdit.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">المستوى الوظيفي</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as UserProfile['role_name'])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="family_member">عضو عائلة</option>
                  <option value="content_writer">كاتب محتوى</option>
                  <option value="level_manager">مدير فرع</option>
                  <option value="family_secretary">أمين العائلة (مدير خارق)</option>
                  <option value="viewer">مشاهد</option>
                  <option value="editor">محرر</option>
                  <option value="admin">مدير</option>
                </select>
              </div>
              
              {newLevel === 'level_manager' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الفرع المسؤول</label>
                  <select
                    value={newBranchId || ''}
                    onChange={(e) => setNewBranchId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">لا يوجد فرع محدد</option>
                    {branches.map(branch => (
                      <option key={branch.معرف_الفرع} value={branch.معرف_الفرع}>
                        {branch.اسم_الفرع}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                
                <button
                  onClick={userToEdit.approval_status === 'pending' ? () => approveUser(userToEdit.id, newLevel, newBranchId) : updateUserRole}
                  disabled={processingUser === userToEdit.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {processingUser === userToEdit.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {userToEdit.approval_status === 'pending' ? 'موافقة وتعيين' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}