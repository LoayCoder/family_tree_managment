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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`*, roles!inner(name)`)
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
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

          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || null,
              role_id: defaultRole.id,
              approval_status: 'pending'
            }])
            .select(`*, roles(name)`)
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
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = () => setRefreshTrigger(prev => prev + 1);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
    setActiveView('landing');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveView('landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const canAccess = (requiredLevel: User['role_name']) => {
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
      <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>
    );
  }

  if (user?.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        حسابك قيد المراجعة. سيتم إعلامك عند الموافقة عليه.
        <button onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    );
  }

  if (user?.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        تم رفض حسابك. يرجى التواصل مع مدير النظام.
        <button onClick={handleLogout}>تسجيل الخروج</button>
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
    <div className="min-h-screen">
      <ResponsiveHeader user={user} onLogout={handleLogout} onNavigate={setActiveView} />
      <ResponsiveContainer>
        {activeView === 'arabic' && <ArabicFamilyTreeDemo />}
        {activeView === 'data-entry' && canAccess('editor') && <DataEntryManager />}
        {activeView === 'tree' && <FamilyTree refreshTrigger={refreshTrigger} />}
        {activeView === 'directory' && <FamilyDirectory refreshTrigger={refreshTrigger} />}
        {activeView === 'news' && <NewsPage onBack={() => setActiveView('landing')} user={user} />}
        {activeView === 'events' && <div>صفحة المناسبات - قيد التطوير</div>}
        {activeView === 'gallery' && <div>صفحة المعرض - قيد التطوير</div>}
      </ResponsiveContainer>
      <ResponsiveFooter />
    </div>
  );
}

export default App;
