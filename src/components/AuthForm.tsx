import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LogIn, UserPlus, Eye, EyeOff, TreePine, ArrowLeft, User, Mail, Lock, Shield, CheckCircle, Clock, AlertCircle, Info, Settings } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
  userLevel?: 'admin' | 'editor' | 'viewer' | 'family_secretary' | 'level_manager' | 'content_writer' | 'family_member';
}

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess: (user: any) => void;
  onCancel: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

export default function AuthForm({ mode, onSuccess, onCancel, onSwitchMode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AuthFormData>({
    defaultValues: {
      userLevel: 'family_member'
    }
  });

  const watchPassword = watch('password');

  const getErrorMessage = (error: any): string => {
    if (!error) return 'حدث خطأ غير معروف';
    
    const message = error.message || error.error_description || error.msg || '';
    
    // Handle specific Supabase auth errors
    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return 'بيانات تسجيل الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور. إذا كنت تحاول الدخول للمرة الأولى، يرجى إنشاء حساب المدير أولاً.';
    }
    
    if (message.includes('Email not confirmed')) {
      return 'يرجى تأكيد بريدك الإلكتروني أولاً من خلال الرابط المرسل إليك.';
    }
    
    if (message.includes('User not found')) {
      return 'لم يتم العثور على حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد.';
    }
    
    if (message.includes('Password should be at least')) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
    }
    
    if (message.includes('User already registered')) {
      return 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل. يرجى تسجيل الدخول.';
    }
    
    if (message.includes('Email rate limit exceeded')) {
      return 'تم تجاوز الحد المسموح لإرسال الرسائل. يرجى المحاولة لاحقاً.';
    }
    
    if (message.includes('Signup is disabled')) {
      return 'إنشاء الحسابات الجديدة معطل حالياً. يرجى التواصل مع المدير.';
    }

    if (message.includes('Database error saving new user')) {
      return 'خطأ في قاعدة البيانات أثناء إنشاء المستخدم. يرجى التحقق من إعدادات قاعدة البيانات أو التواصل مع المدير.';
    }

    if (message.includes('حسابك قيد المراجعة')) {
      return message;
    }
    
    // Return the original message if no specific handling
    return message || 'حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.';
  };

  const createAdminUser = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('خدمة المصادقة غير متاحة. يرجى التحقق من إعدادات النظام.');
      }

      // First, try to sign in with existing admin credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: '1st.arabcoder@gmail.com',
        password: 'Admin@123456'
      });

      if (!signInError && signInData.user) {
        // User exists and can sign in, check/create profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking profile:', profileError);
        }

        if (!profile) {
          // Create admin profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              id: signInData.user.id,
              email: '1st.arabcoder@gmail.com',
              full_name: 'مدير النظام',
              user_level: 'admin',
              approval_status: 'approved'
            }]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw new Error('فشل في إنشاء ملف المدير. يرجى التحقق من صلاحيات قاعدة البيانات.');
          }
        } else if (profile.user_level !== 'admin' || profile.approval_status !== 'approved') {
          // Update to admin
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              user_level: 'admin',
              approval_status: 'approved',
              approved_by: signInData.user.id,
              approved_at: new Date().toISOString()
            })
            .eq('id', signInData.user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            throw new Error('فشل في تحديث صلاحيات المدير.');
          }
        }

        onSuccess({
          id: signInData.user.id,
          email: signInData.user.email,
          full_name: 'مدير النظام',
          user_level: 'admin',
          approval_status: 'approved'
        });
        return;
      }

      // If sign in failed, try to create the user
      if (signInError && !signInError.message.includes('Invalid login credentials')) {
        throw signInError;
      }

      // Create admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: '1st.arabcoder@gmail.com',
        password: 'Admin@123456',
        options: {
          data: {
            full_name: 'مدير النظام',
            user_level: 'admin'
          }
        }
      });

      if (signUpError) {
        // If user already exists, that's expected - we already tried to sign in above
        if (signUpError.message.includes('User already registered')) {
          throw new Error('المستخدم موجود بالفعل ولكن فشل تسجيل الدخول. يرجى التحقق من كلمة المرور أو إعدادات قاعدة البيانات.');
        } else {
          throw signUpError;
        }
      }

      if (authData.user) {
        // User was created successfully
        alert('تم إنشاء حساب المدير بنجاح! يمكنك الآن تسجيل الدخول باستخدام:\nالبريد الإلكتروني: 1st.arabcoder@gmail.com\nكلمة المرور: Admin@123456');
        setShowAdminSetup(false);
      }
    } catch (error: any) {
      console.error('Admin setup error:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('خدمة المصادقة غير متاحة. يرجى التحقق من إعدادات النظام.');
      }

      if (mode === 'signup') {
        // Sign up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role_name: data.userLevel
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Get the role ID for the selected user level
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', data.userLevel || 'family_member')
            .single();

          if (roleError) {
            console.error('Error fetching role:', roleError);
            throw new Error('خطأ في تحديد نوع المستخدم. يرجى المحاولة مرة أخرى.');
          }

          // Create user profile explicitly
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              email: authData.user.email,
              full_name: data.fullName,
              role_id: roleData.id,
              approval_status: 'pending'
            }]);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw new Error('فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.');
          }

          // Show success message instead of logging in
          setSignupSuccess(true);
        }
      } else {
        // Sign in
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (signInError) throw signInError;

        if (authData.user) {
          // Get user profile with role - use maybeSingle() to handle missing profiles gracefully
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
              *,
              roles!inner(name)
            `)
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            throw new Error('خطأ في الوصول إلى ملف المستخدم. يرجى المحاولة مرة أخرى.');
          }

          if (!profile) {
            throw new Error('لم يتم العثور على ملف المستخدم. يرجى التواصل مع المدير.');
          }

          // Check if user is approved
          if (profile?.approval_status !== 'approved') {
            throw new Error('حسابك قيد المراجعة. سيتم إعلامك عند الموافقة عليه.');
          }

          onSuccess({
            id: authData.user.id,
            email: authData.user.email,
            full_name: profile?.full_name,
            role_name: profile?.roles?.name || 'viewer',
            approval_status: profile?.approval_status
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      
      // If login failed and it's about invalid credentials, suggest admin setup
      if (mode === 'login' && errorMessage.includes('بيانات تسجيل الدخول غير صحيحة')) {
        setTimeout(() => {
          setShowAdminSetup(true);
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If signup was successful, show success message
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">تم إرسال الطلب بنجاح</h3>
            </div>
          </div>
          
          <div className="p-8 space-y-6 text-center">
            <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto">
              <Clock className="w-12 h-12 text-emerald-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800">طلب إنشاء الحساب قيد المراجعة</h2>
            
            <p className="text-gray-600 leading-relaxed">
              تم إرسال طلب إنشاء حسابك بنجاح. سيقوم مدير النظام بمراجعة طلبك والموافقة عليه قريباً.
              سيتم إعلامك عبر البريد الإلكتروني عند الموافقة على طلبك.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-right">
              <p className="text-blue-700 text-sm">
                <strong>البريد الإلكتروني:</strong> سيتم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.
              </p>
            </div>
            
            <button
              onClick={onCancel}
              className="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl transition-all duration-200 font-semibold text-lg"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للصفحة الرئيسية
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
              <TreePine className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              شجرة آل عمير
            </h1>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'أدخل بياناتك للوصول إلى حسابك' 
              : 'أنشئ حساباً جديداً للبدء في استخدام النظام'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className={`p-6 bg-gradient-to-r ${mode === 'login' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600'}`}>
            <div className="flex items-center gap-3 text-white">
              {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              <h3 className="text-xl font-bold">
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                    {mode === 'login' && error.includes('بيانات تسجيل الدخول غير صحيحة') && (
                      <p className="text-red-600 text-xs mt-2">
                        إذا لم يكن لديك حساب، يرجى إنشاء حساب جديد أولاً أو إنشاء حساب المدير.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800 text-sm">
                    <p className="font-medium mb-1">تسجيل الدخول للمرة الأولى؟</p>
                    <p>
                      إذا لم يكن لديك حساب، يرجى إنشاء حساب جديد أولاً. 
                      بعد إنشاء الحساب، ستحتاج إلى انتظار موافقة المدير قبل تسجيل الدخول.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm flex items-start gap-2">
                  <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>ملاحظة هامة:</strong> بعد إنشاء الحساب، سيتم مراجعة طلبك من قبل مدير النظام. 
                    سيتم إعلامك عبر البريد الإلكتروني عند الموافقة على طلبك.
                  </span>
                </p>
              </div>
            )}

            {/* Full Name (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  الاسم الكامل *
                </label>
                <input
                  {...register('fullName', { 
                    required: mode === 'signup' ? 'الاسم الكامل مطلوب' : false 
                  })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل اسمك الكامل"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm">{errors.fullName.message}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني *
              </label>
              <input
                {...register('email', { 
                  required: 'البريد الإلكتروني مطلوب',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'البريد الإلكتروني غير صحيح'
                  }
                })}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="أدخل بريدك الإلكتروني"
                dir="ltr"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* User Level (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="w-4 h-4" />
                  مستوى المستخدم *
                </label>
                <select
                  {...register('userLevel', { required: 'نوع المستخدم مطلوب' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                >
                  <option value="family_member">عضو عائلة - عرض البيانات المعتمدة</option>
                  <option value="content_writer">كاتب محتوى - إنشاء المقالات والأخبار</option>
                  <option value="level_manager">مدير فرع - إدارة بيانات فرع معين</option>
                  <option value="family_secretary">أمين العائلة - صلاحيات كاملة</option>
                  <option value="viewer">مشاهد (قديم) - عرض البيانات فقط</option>
                  <option value="editor">محرر (قديم) - إضافة وتعديل البيانات</option>
                  <option value="admin">مدير (قديم) - صلاحيات كاملة</option>
                </select>
                {errors.userLevel && (
                  <p className="text-red-500 text-sm">{errors.userLevel.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4" />
                كلمة المرور *
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'كلمة المرور مطلوبة',
                    minLength: {
                      value: 6,
                      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4" />
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', { 
                      required: mode === 'signup' ? 'تأكيد كلمة المرور مطلوب' : false,
                      validate: (value) => {
                        if (mode === 'signup' && value !== watchPassword) {
                          return 'كلمات المرور غير متطابقة';
                        }
                      }
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="أعد إدخال كلمة المرور"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 bg-gradient-to-r ${
                mode === 'login' ? 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
              } text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري المعالجة...
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                </>
              )}
            </button>

            {/* Switch Mode */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-3">
                {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              </p>
              <button
                type="button"
                onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                {mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}