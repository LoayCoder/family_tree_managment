import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LogIn, UserPlus, Eye, EyeOff, TreePine, ArrowLeft, User, Mail, Lock, Shield, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
  userLevel?: 'admin' | 'editor' | 'viewer';
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AuthFormData>({
    defaultValues: {
      userLevel: 'editor'
    }
  });

  const watchPassword = watch('password');

  const getErrorMessage = (error: any): string => {
    if (!error) return 'حدث خطأ غير معروف';
    const message = error.message || error.error_description || error.msg || '';

    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return 'بيانات تسجيل الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.';
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
      return 'خطأ في قاعدة البيانات أثناء إنشاء المستخدم. يرجى التحقق من إعدادات قاعدة البيانات.';
    }
    if (message.includes('حسابك قيد المراجعة')) {
      return message;
    }

    return message || 'حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.';
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('خدمة المصادقة غير متاحة. يرجى التحقق من إعدادات النظام.');
      }

      if (mode === 'signup') {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              user_level: data.userLevel
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              email: authData.user.email,
              full_name: data.fullName,
              user_level: data.userLevel || 'viewer',
              approval_status: 'pending'
            }]);

          if (profileError) {
            throw new Error('فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.');
          }

          setSignupSuccess(true);
        }
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (signInError) throw signInError;

        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileError || !profile) {
            throw new Error('لم يتم العثور على ملف المستخدم. يرجى التواصل مع المدير.');
          }

          if (profile.approval_status !== 'approved') {
            throw new Error('حسابك قيد المراجعة. سيتم إعلامك عند الموافقة عليه.');
          }

          onSuccess({
            id: authData.user.id,
            email: authData.user.email,
            full_name: profile.full_name,
            user_level: profile.user_level || 'viewer',
            approval_status: profile.approval_status
          });
        }
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ بقية الكود كما هو (واجهة المستخدم وواجهة النجاح) بدون تعديل

  return (
    // مكون تسجيل الدخول أو إنشاء الحساب كما هو بدون زر إعداد المدير
  );
}
