// src/components/AuthForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authService, AuthUser } from '../services/authService';

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
  const [requestedRole, setRequestedRole] = useState<'family_member' | 'content_writer' | 'level_manager' | 'viewer' | 'editor'>('family_member');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        const result = await authService.signUp(email, password, fullName, requestedRole);
        
        if (result.user) {
          setSuccess('تم إنشاء الحساب بنجاح! يرجى انتظار الموافقة من المدير.');
          // Don't call onSuccess here as the user needs approval
          
          // Clear form
          setEmail('');
          setPassword('');
          setFullName('');
          setRequestedRole('family_member');
          
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
    