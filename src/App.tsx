import React, { useState, useEffect } from 'react';
import { TreePine, Heart, Database, Plus, LogIn, UserPlus, LogOut, User, Shield, Clock, XCircle, Calendar, Image, FileText } from 'lucide-react';
import ArabicFamilyTreeDemo from './components/ArabicFamilyTreeDemo';
import DataEntryManager from './components/DataEntry/DataEntryManager';
import FamilyTree from './components/FamilyTree';
import FamilyDirectory from './components/FamilyDirectory';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import AdminPanel from './components/AdminPanel';
import NewsPage from './components/NewsPage';
import { supabase } from './services/arabicFamilyService';
import ResponsiveHeader from './components/responsive/ResponsiveHeader';
import ResponsiveFooter from './components/responsive/ResponsiveFooter';
import ResponsiveContainer from './components/responsive/ResponsiveContainer';
import ResponsiveFlex from './components/responsive/ResponsiveFlex';
import ResponsiveButton from './components/responsive/ResponsiveButton';

interface User {
  id: string;
  email: string;
  role_name: 'admin' | 'editor' | 'viewer' | 'family_secretary' | 'level_manager' | 'content_writer' | 'family_member';
  full_name?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeView, setActiveView] = useState<'landing' | 'arabic' | 'data-entry' | 'tree' | 'directory' | 'events' | 'gallery' | 'news' | 'admin'>('landing');
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
          // Get user profile with role - use maybeSingle() to handle cases where profile doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
              *,
              roles!inner(name)
            `)
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
              role_name: profile.roles.name,
              full_name: profile.full_name,
              approval_status: profile.approval_status
            });
          } else {
            // Profile doesn't exist - this shouldn't happen in normal flow
          // Profile doesn't exist, create one
          console.log('Profile not found, creating new profile for user:', session.user.id);
          
          try {
            // Get the default 'family_member' role ID
            const { data: defaultRole, error: roleError } = await supabase
              .from('roles')
              .select('id')
              .eq('name', 'family_member')
              .single();
            
            if (roleError) {
              console.error('Error fetching default role:', roleError);
              await supabase.auth.signOut();
              setUser(null);
              return;
            }
            
            // Create new user profile
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert([{
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || null,
                role_id: defaultRole.id,
                approval_status: 'pending'
              }])
              .select(`
                *,
                roles(name)
              `)
              .single();
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
              await supabase.auth.signOut();
              setUser(null);
              return;
            }
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role_name: newProfile.roles.name,
              full_name: newProfile.full_name,
              approval_status: newProfile.approval_status
            });
            return;
            
          } catch (createError) {
            console.error('Error creating user profile:', createError);
            await supabase.auth.signOut();
            setUser(null);
            return;
          }
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
    }
  };

  const handleMemberAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
    setActiveView('landing');
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

  const canAccess = (requiredLevel: 'admin' | 'editor' | 'viewer' | 'family_secretary' | 'level_manager' | 'content_writer' | 'family_member') => {
    if (!user || user.approval_status !== 'approved') return false;
    
    const levels = { 
      viewer: 1, 
      family_member: 1,
      content_writer: 2,
      editor: 2, 
      level_manager: 3,
      admin: 3,
      family_secretary: 4
    };
    return levels[user.role_name] >= levels[requiredLevel];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base sm:text-lg font-medium text-gray-600">جاري التحميل...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show pending approval message
  if (user && user.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-3 sm:p-4 bg-amber-100 rounded-full w-fit mx-auto mb-4 sm:mb-6">
            <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-amber-600" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">حسابك قيد المراجعة</h2>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            شكراً لتسجيلك في نظام شجرة آل عمير. حسابك قيد المراجعة حالياً من قبل مدير النظام.
            سيتم إعلامك عبر البريد الإلكتروني عند الموافقة على حسابك.
          </p>
          
          <ResponsiveButton
            onClick={handleLogout}
            variant="secondary"
            size="md"
            icon={<LogOut className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="mx-auto"
          >
            تسجيل الخروج
          </ResponsiveButton>
        </div>
      </div>
    );
  }

  // Show rejected message
  if (user && user.approval_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 max-w-md w-full text-center">
          <div className="p-3 sm:p-4 bg-red-100 rounded-full w-fit mx-auto mb-4 sm:mb-6">
            <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">تم رفض طلب حسابك</h2>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            عذراً، تم رفض طلب إنشاء حسابك في نظام شجرة آل عمير.
            يرجى التواصل مع مدير النظام للحصول على مزيد من المعلومات.
          </p>
          
          <ResponsiveButton
            onClick={handleLogout}
            variant="secondary"
            size="md"
            icon={<LogOut className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="mx-auto"
          >
            تسجيل الخروج
          </ResponsiveButton>
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
    return (
      <LandingPage 
        onShowAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }}
        onNavigate={(view) => setActiveView(view)}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (activeView === 'admin') {
    return <AdminPanel onBack={() => setActiveView('arabic')} currentUserId={user?.id || ''} />;
  }

  if (activeView === 'news') {
    return <NewsPage onBack={() => setActiveView('landing')} user={user} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <ResponsiveContainer>
          <div className="py-3 sm:py-4">
            <ResponsiveFlex justify="between">
              <ResponsiveFlex gap="sm">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg">
                  <TreePine className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    شجرة آل عمير
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">نظام إدارة الأنساب والعائلات</p>
                </div>
              </ResponsiveFlex>
              
              {user && (
                <ResponsiveFlex gap="sm" className="hide-on-mobile">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span>مرحباً، {user.full_name || user.email}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.role_name === 'admin' || user.role_name === 'family_secretary' ? 'bg-red-100 text-red-700' :
                      user.role_name === 'editor' || user.role_name === 'level_manager' || user.role_name === 'content_writer' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.role_name === 'admin' ? 'مدير' :
                       user.role_name === 'family_secretary' ? 'أمين العائلة' :
                       user.role_name === 'level_manager' ? 'مدير فرع' :
                       user.role_name === 'content_writer' ? 'كاتب محتوى' :
                       user.role_name === 'editor' ? 'محرر' : 'مشاهد'}
                    </span>
                  </div>
                  
                  {(user.role_name === 'admin' || user.role_name === 'family_secretary') && (
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
                </ResponsiveFlex>
              )}
              
              {/* Mobile user menu */}
              {user && (
                <div className="show-on-mobile">
                  <ResponsiveFlex gap="xs">
                    {(user.role_name === 'admin' || user.role_name === 'family_secretary') && (
                      <button
                        onClick={() => setActiveView('admin')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="لوحة تحكم المدير"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="تسجيل الخروج"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </ResponsiveFlex>
                </div>
              )}
            </ResponsiveFlex>
          </div>
        </ResponsiveContainer>
      </header>

      {/* Main Content */}
      <ResponsiveContainer className="py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-4 sm:py-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
            أهلاً وسهلاً بكم في شجرة آل عمير
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            احتفظ بتاريخ عائلتك وأنسابها في مكان واحد آمن ومنظم، 
            وشارك ذكرياتكم وقصصكم مع الأجيال القادمة
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-4 sm:mb-6 overflow-x-auto pb-2">
          <div className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-lg border border-gray-200 flex flex-nowrap gap-1">
            <button
              onClick={() => setActiveView('arabic')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'arabic'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hide-on-mobile">النظام المتقدم</span>
              <span className="show-on-mobile">النظام</span>
            </button>
            
            {canAccess('editor') && (
              <button
                onClick={() => setActiveView('data-entry')}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                  activeView === 'data-entry'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hide-on-mobile">إدخال البيانات</span>
                <span className="show-on-mobile">البيانات</span>
              </button>
            )}
            
            <button
              onClick={() => setActiveView('tree')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'tree'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TreePine className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الشجرة</span>
            </button>
            
            <button
              onClick={() => setActiveView('news')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'news'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الأخبار</span>
            </button>
            
            <button
              onClick={() => setActiveView('directory')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'directory'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>الدليل</span>
            </button>
            
            <button
              onClick={() => setActiveView('events')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'events'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hide-on-mobile">المناسبات</span>
              <span className="show-on-mobile">المناسبات</span>
            </button>
            
            <button
              onClick={() => setActiveView('gallery')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                activeView === 'gallery'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Image className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hide-on-mobile">المعرض</span>
              <span className="show-on-mobile">المعرض</span>
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="content-container">
          {activeView === 'arabic' && <ArabicFamilyTreeDemo />}
          {activeView === 'data-entry' && canAccess('editor') && <DataEntryManager />}
          {activeView === 'tree' && <FamilyTree refreshTrigger={refreshTrigger} />}
          {activeView === 'directory' && <FamilyDirectory refreshTrigger={refreshTrigger} />}
          {activeView === 'news' && <NewsPage onBack={() => setActiveView('landing')} user={user} />}
          {activeView === 'events' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-800">صفحة المناسبات والأحداث - قيد التطوير</h2></div>}
          {activeView === 'gallery' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-800">معرض الصور والفيديوهات - قيد التطوير</h2></div>}
          
          {activeView === 'data-entry' && !canAccess('editor') && (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">غير مصرح</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  تحتاج إلى صلاحيات محرر أو مدير للوصول إلى هذا القسم
                </p>
              </div>
            </div>
          )}
        </div>
      </ResponsiveContainer>

      {/* Footer */}
      <ResponsiveFooter />
    </div>
  );
}

export default App;