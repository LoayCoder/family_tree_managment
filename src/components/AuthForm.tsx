// src/components/AuthForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authService, AuthUser, UserRole } from '../services/authService';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess: (user: AuthUser) => void;
  onCancel: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

export default function AuthForm({ mode, onSuccess, onCancel, onSwitchMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRoleId, setRequestedRoleId] = useState<string>('');
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load available roles when component mounts
  React.useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const roles = await authService.getAllRoles();
        setAvailableRoles(roles);
        
        // Set default role to 'family_member' if available
        const defaultRole = roles.find(role => role.name === 'family_member');
        if (defaultRole) {
          setRequestedRoleId(defaultRole.id);
        } else if (roles.length > 0) {
          setRequestedRoleId(roles[0].id);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        setError('فشل في تحميل الأدوار المتاحة');
      } finally {
        setRolesLoading(false);
      }
    };

    if (mode === 'signup') {
      loadRoles();
    }
  }, [mode]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return false;
    }
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    
    if (mode === 'signup' && !fullName.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return false;
    }
    
    if (mode === 'signup' && !requestedRoleId.trim()) {
      setError('يرجى اختيار نوع العضوية');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        // Sign up new user
        const result = await authService.signUp(email, password, fullName, requestedRoleId);
        
        if (result.user) {
          setSuccess('تم إنشاء الحساب بنجاح! يرجى انتظار الموافقة من المدير.');
          // Don't call onSuccess here as the user needs approval
          
          // Clear form
          setEmail('');
          setPassword('');
          setFullName('');
          // Reset to default role
          const defaultRole = availableRoles.find(role => role.name === 'family_member');
          if (defaultRole) {
            setRequestedRoleId(defaultRole.id);
          }
          
          // Switch to login mode after a delay
          setTimeout(() => {
            onSwitchMode('login');
          }, 3000);
        }
      } else {
        // Sign in existing user
        const result = await authService.signIn(email, password);
        
        if (result.user) {
          // Get user profile with role information
          const user = await authService.getCurrentUser();
          
          if (user) {
            // Check approval status
            if (user.approval_status === 'pending') {
              setError('حسابك قيد المراجعة. يرجى انتظار الموافقة من المدير.');
              return;
            } else if (user.approval_status === 'rejected') {
              setError('تم رفض طلب حسابك. يرجى التواصل مع المدير.');
              return;
            } else if (user.approval_status === 'approved') {
              setSuccess('تم تسجيل الدخول بنجاح!');
              onSuccess(user);
            }
          } else {
            throw new Error('لم يتم العثور على ملف المستخدم. يرجى التواصل مع المدير.');
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle specific error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.message?.includes('User already registered')) {
        setError('هذا البريد الإلكتروني مسجل مسبقاً');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('يرجى تأكيد البريد الإلكتروني أولاً');
      } else if (err.message?.includes('لم يتم العثور على ملف المستخدم')) {
        setError('لم يتم العثور على ملف المستخدم. يرجى التواصل مع المدير.');
      } else {
        setError(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
            {mode === 'login' ? (
              <LogIn className="w-8 h-8 text-emerald-600" />
            ) : (
              <UserPlus className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'أدخل بياناتك للوصول إلى النظام' 
              : 'املأ البيانات لإنشاء حساب جديد'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-12"
                placeholder="أدخل كلمة المرور"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع العضوية المطلوبة
              </label>
              {rolesLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-600">جاري تحميل الأدوار...</span>
                </div>
              ) : (
                <select
                  value={requestedRoleId}
                  onChange={(e) => setRequestedRoleId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={availableRoles.length === 0}
                >
                  <option value="">اختر نوع العضوية</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name === 'family_member' && 'عضو عائلة (Basic family member)'}
                      {role.name === 'content_writer' && 'كاتب محتوى (Content writer)'}
                      {role.name === 'level_manager' && 'مدير فرع (Branch manager)'}
                      {role.name === 'family_secretary' && 'أمين العائلة (Family secretary)'}
                      {role.name === 'viewer' && 'مشاهد (Viewer - legacy)'}
                      {role.name === 'editor' && 'محرر (Editor - legacy)'}
                      {role.name === 'admin' && 'مدير (Admin - legacy)'}
                      {!['family_member', 'content_writer', 'level_manager', 'family_secretary', 'viewer', 'editor', 'admin'].includes(role.name) && role.description}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                سيتم مراجعة طلبك وتحديد الصلاحيات النهائية من قبل مدير النظام
              </p>
              {availableRoles.length === 0 && !rolesLoading && (
                <p className="text-xs text-red-500 mt-1">
                  فشل في تحميل الأدوار المتاحة. يرجى إعادة تحميل الصفحة.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري المعالجة...
              </>
            ) : (
              <>
                {mode === 'login' ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    إنشاء الحساب
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button
              onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold mr-2"
            >
              {mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}