import React, { useState, useEffect } from 'react';
import { TreePine, Heart, Database, Plus, LogIn, UserPlus, LogOut, User, Shield, Clock, XCircle } from 'lucide-react';
import ArabicFamilyTreeDemo from './components/ArabicFamilyTreeDemo';
import DataEntryManager from './components/DataEntry/DataEntryManager';
import FamilyTree from './components/FamilyTree';
import FamilyDirectory from './components/FamilyDirectory';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import { supabase } from './services/arabicFamilyService';

interface User {
  id: string;
  email: string;
  user_level: 'admin' | 'editor' | 'viewer';
  full_name?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeView, setActiveView] = useState<'landing' | 'arabic' | 'data-entry' | 'tree' | 'directory' | 'admin'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get user profile with level - use maybeSingle() to handle cases where profile doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // If there's an error fetching profile, sign out the user
            await supabase.auth.signOut();
            setUser(null);
            return;
          }
          
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              user_level: profile.user_level,
              full_name: profile.full_name,
              approval_status: profile.approval_status
            });
          } else {
            // Profile doesn't exist - this shouldn't happen in normal flow
            // Sign out the user and let them try again
            console.warn('User session exists but no profile found');
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // On any error, clear the user state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
    setActiveView('arabic');
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setActiveView('landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const canAccess = (requiredLevel: 'admin' | 'editor' | 'viewer') => {
    if (!user || user.approval_status !== 'approved') return false;
    
    const levels = { viewer: 1, editor: 2, admin: 3 };
    return levels[user.user_level] >= levels[requiredLevel];
  };

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

  // Show pending approval message
  if (user && user.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-4 bg-amber-100 rounded-full w-fit mx-auto mb-6">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">حسابك قيد المراجعة</h2>
          
          <p className="text-gray-600 mb-6">
            شكراً لتسجيلك في نظام شجرة آل عمير. حسابك قيد المراجعة حالياً من قبل مدير النظام.
            سيتم إعلامك عبر البريد الإلكتروني عند الموافقة على حسابك.
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

  // Show rejected message
  if (user && user.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">تم رفض طلب حسابك</h2>
          
          <p className="text-gray-600 mb-6">
            عذراً، تم رفض طلب إنشاء حسابك في نظام شجرة آل عمير.
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

  if (!user && activeView !== 'landing') {
    return <LandingPage onShowAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }} />;
  }

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

  if (activeView === 'landing') {
    return <LandingPage onShowAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }} />;
  }

  if (activeView === 'admin') {
    return <AdminPanel onBack={() => setActiveView('arabic')} currentUserId={user?.id || ''} />;
  }

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
                  شجرة آل عمير
                </h1>
                <p className="text-gray-600 text-sm">نظام إدارة الأنساب والعائلات</p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span>مرحباً، {user.full_name || user.email}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    user.user_level === 'admin' ? 'bg-red-100 text-red-700' :
                    user.user_level === 'editor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.user_level === 'admin' ? 'مدير' :
                     user.user_level === 'editor' ? 'محرر' : 'مشاهد'}
                  </span>
                </div>
                
                {user.user_level === 'admin' && (
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
            أهلاً وسهلاً بكم في شجرة آل عمير
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            احتفظ بتاريخ عائلتك وأنسابها في مكان واحد آمن ومنظم، 
            وشارك ذكرياتكم وقصصكم مع الأجيال القادمة
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
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
            
            {canAccess('editor') && (
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
            
            <button
              onClick={() => setActiveView('tree')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeView === 'tree'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TreePine className="w-5 h-5" />
              شجرة آل عمير
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
              دليل آل عمير
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="content-container">
          {activeView === 'arabic' && <ArabicFamilyTreeDemo />}
          {activeView === 'data-entry' && canAccess('editor') && <DataEntryManager />}
          {activeView === 'tree' && <FamilyTree refreshTrigger={refreshTrigger} />}
          {activeView === 'directory' && <FamilyDirectory refreshTrigger={refreshTrigger} />}
          
          {activeView === 'data-entry' && !canAccess('editor') && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <User className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
                <p className="text-gray-600">
                  تحتاج إلى صلاحيات محرر أو مدير للوصول إلى هذا القسم
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
              شجرة آل عمير - حافظ على تراث عائلتك
              <Heart className="w-4 h-4 text-red-500 fill-current" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;