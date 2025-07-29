import React, { useState, useEffect } from 'react';
import {
  TreePine, Heart, Database, Plus, LogIn, UserPlus, LogOut, User,
  Shield, Clock, XCircle, Calendar, Image, FileText
} from 'lucide-react';

import ArabicFamilyTreeDemo from './components/ArabicFamilyTreeDemo';
import DataEntryManager from './components/DataEntry/DataEntryManager';
import FamilyTree from './components/FamilyTree';
import FamilyDirectory from './components/FamilyDirectory';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import NewsPage from './components/NewsPage';
import NewsPostForm from './components/DataEntry/NewsPostForm';
import { authService, AuthUser } from './services/authService';
import ResponsiveHeader from './components/responsive/ResponsiveHeader';
import ResponsiveFooter from './components/responsive/ResponsiveFooter';
import ResponsiveContainer from './components/responsive/ResponsiveContainer';
import ResponsiveFlex from './components/responsive/ResponsiveFlex';
import ResponsiveButton from './components/responsive/ResponsiveButton';

// Updated User interface to match the new role system
interface User {
  id: string;
  email: string;
  role_name: 'family_secretary' | 'family_member' | 'viewer' | 'editor' | 'admin' | 'content_writer' | 'level_manager';
  full_name?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeView, setActiveView] = useState<'landing' | 'arabic' | 'data-entry' | 'tree' | 'directory' | 'events' | 'gallery' | 'news' | 'admin' | 'submit-content'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only set up auth listener if supabase client is available
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    if (authService.supabase) {
      const { data } = authService.supabase.auth.onAuthStateChange(
        (_event, session) => {
          // This listener will automatically update the session and refresh tokens
          // No explicit action needed here, just ensuring the session is managed
          checkUser(); // Re-check user status on auth state change
        }
      );
      authListener = { subscription: data.subscription };
    }

    checkUser();
    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Updated checkUser function using authService
  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = () => setRefreshTrigger(prev => prev + 1);

  // Updated handleLogin function
  const handleLogin = (userData: AuthUser) => {
    setUser(userData);
    setShowAuth(false);
    setActiveView('landing');
  };

  // Updated handleLogout function using authService
  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setActiveView('landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Updated canAccess function with new role hierarchy
  const canAccess = (requiredRole: User['role_name']) => {
    if (!user || user.approval_status !== 'approved') return false;
    
    return authService.canAccess(user.role_name, requiredRole);
  };

  // Updated role display helper
  const getRoleDisplayName = (roleName: string) => {
    const roleNames = {
      family_secretary: 'أمين العائلة',
      admin: 'مدير (قديم)',
      level_manager: 'مدير فرع',
      content_writer: 'كاتب محتوى',
      family_member: 'عضو عائلة',
      editor: 'محرر (قديم)',
      viewer: 'مشاهد (قديم)'
    };
    return roleNames[roleName as keyof typeof roleNames] || roleName;
  };

  // Updated role styling helper
  const getRoleStyle = (roleName: string) => {
    const roleStyles = {
      family_secretary: 'bg-purple-100 text-purple-700',
      admin: 'bg-red-100 text-red-700',
      level_manager: 'bg-blue-100 text-blue-700',
      content_writer: 'bg-yellow-100 text-yellow-700',
      family_member: 'bg-green-100 text-green-700',
      editor: 'bg-orange-100 text-orange-700',
      viewer: 'bg-gray-100 text-gray-700'
    };
    return roleStyles[roleName as keyof typeof roleStyles] || 'bg-gray-100 text-gray-700';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-600">جاري التحميل...</span>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval state
  if (user && user.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-4 bg-amber-100 rounded-full w-fit mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">حسابك قيد المراجعة</h2>
          
          <p className="text-gray-600 mb-6">
            شكراً لتسجيلك في نظام شجرة العائلة. حسابك قيد المراجعة حالياً من قبل مدير النظام.
            سيتم إعلامك عبر البريد الإلكتروني عند الموافقة على حسابك.
          </p>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>الدور المطلوب:</strong> {getRoleDisplayName(user.role_name)}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // Rejected state
  if (user && user.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">تم رفض طلب حسابك</h2>
          
          <p className="text-gray-600 mb-6">
            عذراً، تم رفض طلب إنشاء حسابك في نظام شجرة العائلة.
            يرجى التواصل مع مدير النظام للحصول على مزيد من المعلومات.
          </p>
          
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated and trying to access protected routes
  if (!user && activeView !== 'landing') {
    return <LandingPage onShowAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }} />;
  }

  // Show auth form
  if (showAuth) {
    return (
      <AuthForm
        mode={authMode}
        onSuccess={handleLogin}
        onCancel={() => setShowAuth(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
      />
    );
  }

  // Landing page
  if (activeView === 'landing') {
    return (
      <LandingPage
        onShowAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }}
        onNavigate={(view) => setActiveView(view)}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Admin panel (only for family_secretary and admin)
  if (activeView === 'admin') {
    if (!canAccess('admin')) {
      return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md text-center">
            <div className="text-red-500 mb-4">
              <Shield className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
            <p className="text-gray-600 mb-4">
              تحتاج إلى صلاحيات مدير للوصول إلى هذا القسم
            </p>
            <button
              onClick={() => setActiveView('landing')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
    return <AdminPanel onBack={() => setActiveView('arabic')} currentUserId={user?.id || ''} />;
  }

  // Submit Content panel (only for content_writer and above)
  if (activeView === 'submit-content') {
    if (!canAccess('content_writer')) {
      return (
        <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md text-center">
            <div className="text-red-500 mb-4">
              <Shield className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
            <p className="text-gray-600 mb-4">
              تحتاج إلى صلاحيات كاتب محتوى أو أعلى للوصول إلى هذا القسم
            </p>
            <button
              onClick={() => setActiveView('landing')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }
    return (
      <NewsPostForm 
        onSuccess={() => {
          setActiveView('landing');
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
          successDiv.style.direction = 'rtl';
          successDiv.textContent = 'تم إرسال المحتوى للموافقة بنجاح!';
          document.body.appendChild(successDiv);
          setTimeout(() => successDiv.remove(), 5000);
        }} 
        onCancel={() => setActiveView('landing')} 
        isContentSubmission={true}
      />
    );
  }

  // News page
  if (activeView === 'news') {
    return <NewsPage onBack={() => setActiveView('landing')} user={user} />;
  }

  // Main authenticated application
  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  شجرة العائلة
                </h1>
                <p className="text-gray-600 text-sm">نظام إدارة الأنساب والعائلات</p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span>مرحباً، {user.full_name || user.email}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getRoleStyle(user.role_name)}`}>
                    {getRoleDisplayName(user.role_name)}
                  </span>
                </div>
                
                {/* Show admin panel button only for admin-level roles */}
                {(user.role_name === 'family_secretary' || user.role_name === 'admin') && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="لوحة تحكم المدير"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            أهلاً وسهلاً بكم في شجرة العائلة
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            احتفظ بتاريخ عائلتك وأنسابها في مكان واحد آمن ومنظم، 
            وشارك ذكرياتكم وقصصكم مع الأجيال القادمة
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('arabic')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'arabic'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Database className="w-5 h-5" />
              النظام المتقدم
            </button>
            
            {/* Data Entry - for content_writer and above */}
            {canAccess('content_writer') && (
              <button
                onClick={() => setActiveView('data-entry')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeView === 'data-entry'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-5 h-5" />
                إدخال البيانات
              </button>
            )}
            
            {/* Submit Content - for content_writer and above */}
            {canAccess('content_writer') && (
              <button
                onClick={() => setActiveView('submit-content')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeView === 'submit-content'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                إرسال محتوى
              </button>
            )}
            
            <button
              onClick={() => setActiveView('tree')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'tree'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TreePine className="w-5 h-5" />
              شجرة العائلة
            </button>
            
            <button
              onClick={() => setActiveView('directory')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'directory'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Heart className="w-5 h-5" />
              دليل العائلة
            </button>

            <button
              onClick={() => setActiveView('news')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'news'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              الأخبار
            </button>

            <button
              onClick={() => setActiveView('events')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'events'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              المناسبات
            </button>

            <button
              onClick={() => setActiveView('gallery')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'gallery'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Image className="w-5 h-5" />
              المعرض
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="content-container">
          {activeView === 'arabic' && <ArabicFamilyTreeDemo />}
          {activeView === 'data-entry' && canAccess('content_writer') && <DataEntryManager />}
          {activeView === 'tree' && <FamilyTree refreshTrigger={refreshTrigger} />}
          {activeView === 'directory' && <FamilyDirectory refreshTrigger={refreshTrigger} />}
          {activeView === 'events' && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">صفحة المناسبات</h3>
                <p className="text-gray-600">هذا القسم قيد التطوير</p>
              </div>
            </div>
          )}
          {activeView === 'gallery' && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto">
                <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">معرض الصور</h3>
                <p className="text-gray-600">هذا القسم قيد التطوير</p>
              </div>
            </div>
          )}
          
          {/* Access denied for data entry */}
          {activeView === 'data-entry' && !canAccess('content_writer') && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <User className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
                <p className="text-gray-600 mb-4">
                  تحتاج إلى صلاحيات كاتب محتوى أو أعلى للوصول إلى هذا القسم
                </p>
                <p className="text-sm text-gray-500">
                  دورك الحالي: {getRoleDisplayName(user?.role_name || '')}
                </p>
              </div>
            </div>
          )}
          
          {/* Access denied for submit content */}
          {activeView === 'submit-content' && !canAccess('content_writer') && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <User className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
                <p className="text-gray-600 mb-4">
                  تحتاج إلى صلاحيات كاتب محتوى أو أعلى للوصول إلى هذا القسم
                </p>
                <p className="text-sm text-gray-500">
                  دورك الحالي: {getRoleDisplayName(user?.role_name || '')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p className="flex items-center justify-center gap-2">
              <TreePine className="w-5 h-5" />
              شجرة العائلة - حافظ على تراث عائلتك
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;