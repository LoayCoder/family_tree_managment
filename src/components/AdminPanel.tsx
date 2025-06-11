import React, { useState, useEffect } from 'react';
import { Shield, User, CheckCircle, XCircle, Clock, ArrowLeft, Search, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_level: 'admin' | 'editor' | 'viewer';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    setProcessingUser(userId);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase.rpc('approve_user', {
        user_id: userId,
        approver_id: currentUserId
      });

      if (error) throw error;
      
      // Refresh user list
      loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('حدث خطأ أثناء الموافقة على المستخدم');
    } finally {
      setProcessingUser(null);
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
      
      // Refresh user list
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

  const filteredUsers = users.filter(user => {
    // Apply status filter
    if (filter !== 'all' && user.approval_status !== filter) {
      return false;
    }
    
    // Apply search filter
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

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'admin':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
            مدير
          </span>
        );
      case 'editor':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
            محرر
          </span>
        );
      case 'viewer':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
            مشاهد
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
            {level}
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
                          onClick={() => approveUser(user.id)}
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
                        {getLevelBadge(user.user_level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        {user.approval_status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveUser(user.id)}
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
    </div>
  );
}