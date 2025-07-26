import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Save, X, Calendar, Globe, Tag, Image, Trash2, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/arabicFamilyService';
import { getCurrentUserLevel } from '../../utils/userUtils';

interface NewsPostFormData {
  title: string;
  summary: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  tags: string;
  featured_image_url: string;
  published_at: string;
}

interface NewsPostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any; // News post data for editing
  isContentSubmission?: boolean; // Flag to indicate if this is a content submission form
}

export default function NewsPostForm({ onSuccess, onCancel, editData, isContentSubmission = false }: NewsPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contentPreview, setContentPreview] = useState(false);
  const [userLevel, setUserLevel] = useState<string>('');
  const [pendingSubmission, setPendingSubmission] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NewsPostFormData>({
    defaultValues: editData ? {
      title: editData.title,
      summary: editData.summary || '',
      content: editData.content,
      status: editData.status || 'draft',
      is_public: editData.is_public !== false,
      tags: editData.tags ? editData.tags.join(', ') : '',
      featured_image_url: editData.featured_image_url || '',
      published_at: editData.published_at ? new Date(editData.published_at).toISOString().split('T')[0] : ''
    } : {
      status: 'draft',
      is_public: true,
      summary: '',
      tags: '',
      featured_image_url: '',
      published_at: new Date().toISOString().split('T')[0]
    }
  });

  const watchStatus = watch('status');
  const watchIsPublic = watch('is_public');
  const watchImageUrl = watch('featured_image_url');
  const watchContent = watch('content');

  useEffect(() => {
    getCurrentUser();
    checkUserLevel();
  }, []);

  const checkUserLevel = async () => {
    try {
      const level = await getCurrentUserLevel();
      setUserLevel(level);
    } catch (error) {
      console.error('Error getting user level:', error);
    }
  };

  // Update image preview when URL changes
  useEffect(() => {
    if (watchImageUrl) {
      setImagePreview(watchImageUrl);
    } else {
      setImagePreview(null);
    }
  }, [watchImageUrl]);

  const getCurrentUser = async () => {
    try {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      alert('يرجى اختيار صورة بتنسيق JPG أو PNG فقط');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    try {
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setValue('featured_image_url', result);
      };
      reader.readAsDataURL(file);

      // Note: Supabase storage upload is commented out until the 'images' bucket is created
      // To enable storage upload, create an 'images' bucket in your Supabase project dashboard
      /*
      if (supabase) {
        const fileName = `news_${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`news/${fileName}`, file);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(`news/${fileName}`);

        setValue('featured_image_url', publicUrlData.publicUrl);
        setImagePreview(publicUrlData.publicUrl);
      }
      */
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    }
  };

  const clearImage = () => {
    setValue('featured_image_url', '');
    setImagePreview(null);
  };

  const onSubmit = async (data: NewsPostFormData) => {
    setIsSubmitting(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!currentUser) {
        throw new Error('يجب تسجيل الدخول لإنشاء المقالات');
      }

      // Convert tags string to array
      const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      // Determine status based on user level and form type
      let postStatus = data.status;
      if (isContentSubmission || (userLevel === 'content_writer' && data.status === 'published')) {
        postStatus = 'pending_approval';
      }

      // Combine summary and content if summary is provided
      let finalContent = data.content;
      if (data.summary && data.summary.trim()) {
        finalContent = `**ملخص:**\n${data.summary.trim()}\n\n**المحتوى الكامل:**\n${data.content}`;
      }

      const newsPostData = {
        title: data.title,
        content: finalContent,
        author_id: currentUser.id,
        status: postStatus,
        is_public: isContentSubmission ? false : data.is_public, // Content submissions are private by default
        tags: tagsArray.length > 0 ? tagsArray : null,
        featured_image_url: data.featured_image_url || null,
        published_at: postStatus === 'published' ? (data.published_at || new Date().toISOString()) : null,
        submitted_for_approval_at: postStatus === 'pending_approval' ? new Date().toISOString() : null
      };

      if (editData) {
        const { error } = await supabase
          .from('news_posts')
          .update(newsPostData)
          .eq('id', editData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_posts')
          .insert([newsPostData]);
        
        if (error) throw error;
      }

      // Show pending submission message for content writers
      if (isContentSubmission || (userLevel === 'content_writer' && data.status === 'published')) {
        setPendingSubmission(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving news post:', error);
      alert('حدث خطأ أثناء حفظ المقال');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {isContentSubmission ? 'إرسال محتوى للموافقة' : (editData ? 'تعديل المقال' : 'إضافة مقال جديد')}
                </h1>
                <p className="text-gray-600">
                  {isContentSubmission ? 'إرسال محتوى جديد لأمين العائلة للموافقة عليه' : 'إنشاء محتوى إخباري للعائلة'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
              <h2 className="text-2xl font-bold text-white">تفاصيل المقال</h2>
              <p className="text-blue-100 mt-2">
                {isContentSubmission ? 'أدخل تفاصيل المحتوى المراد إرساله للموافقة' : 'أدخل معلومات المقال أو الخبر'}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Pending Submission Message */}
              {pendingSubmission && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-4">
                    <FileText className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-800 mb-2">تم إرسال المحتوى للموافقة</h3>
                  <p className="text-amber-700">
                    تم إرسال المحتوى إلى أمين العائلة للموافقة على نشره.
                    ستتلقى إشعاراً عند الموافقة على المحتوى أو رفضه.
                  </p>
                </div>
              )}

              {/* Author Info */}
              {currentUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-blue-800">الكاتب: </span>
                      <span className="text-blue-700">{currentUser.full_name || currentUser.email}</span>
                      {userLevel && (
                        <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {userLevel === 'family_secretary' ? 'أمين العائلة' :
                           userLevel === 'content_writer' ? 'كاتب محتوى' : userLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  {userLevel === 'content_writer' && (
                    <p className="text-blue-600 text-sm mt-2">
                      {isContentSubmission 
                        ? 'سيتم إرسال هذا المحتوى إلى أمين العائلة للموافقة عليه قبل النشر.'
                        : 'جميع المقالات التي تقوم بنشرها ستُرسل إلى أمين العائلة للموافقة عليها قبل النشر.'
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  المعلومات الأساسية
                </h3>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    {isContentSubmission ? 'عنوان المحتوى *' : 'عنوان المقال *'}
                  </label>
                  <input
                    {...register('title', { required: isContentSubmission ? 'عنوان المحتوى مطلوب' : 'عنوان المقال مطلوب' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={isContentSubmission ? 'أدخل عنواناً واضحاً للمحتوى' : 'أدخل عنواناً جذاباً للمقال'}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                  )}
                </div>

                {/* Summary Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4" />
                    ملخص المحتوى {isContentSubmission ? '*' : '(اختياري)'}
                  </label>
                  <textarea
                    {...register('summary', { required: isContentSubmission ? 'ملخص المحتوى مطلوب' : false })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder={isContentSubmission 
                      ? 'اكتب ملخصاً موجزاً للمحتوى (2-3 جمل)' 
                      : 'اكتب ملخصاً موجزاً للمقال (اختياري)'
                    }
                  />
                  {errors.summary && (
                    <p className="text-red-500 text-sm">{errors.summary.message}</p>
                  )}
                  {isContentSubmission && (
                    <p className="text-sm text-blue-600">
                      الملخص سيساعد أمين العائلة على فهم المحتوى بسرعة قبل الموافقة عليه
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      {isContentSubmission ? 'المحتوى الكامل *' : 'محتوى المقال *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setContentPreview(!contentPreview)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      {contentPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {contentPreview ? 'إخفاء المعاينة' : 'معاينة'}
                    </button>
                  </div>
                  <textarea
                    {...register('content', { required: isContentSubmission ? 'المحتوى الكامل مطلوب' : 'محتوى المقال مطلوب' })}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder={isContentSubmission 
                      ? 'اكتب المحتوى الكامل هنا... يمكنك استخدام النص العادي أو HTML البسيط'
                      : 'اكتب محتوى المقال هنا... يمكنك استخدام النص العادي أو HTML البسيط'
                    }
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm">{errors.content.message}</p>
                  )}
                  
                  {/* Content Preview */}
                  {contentPreview && watchContent && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <h4 className="font-medium text-gray-700 mb-2">معاينة المحتوى:</h4>
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                        {watchContent}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Publication Settings */}
              {!isContentSubmission && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  إعدادات النشر
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      حالة المقال
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={userLevel === 'content_writer'}
                    >
                      <option value="draft">مسودة</option>
                      <option value="published">
                        {userLevel === 'content_writer' ? 'إرسال للنشر' : 'منشور'}
                      </option>
                      <option value="archived">مؤرشف</option>
                    </select>
                    {userLevel === 'content_writer' && (
                      <p className="text-sm text-blue-600">
                        عند اختيار "إرسال للنشر" سيتم إرسال المقال لأمين العائلة للموافقة عليه
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      تاريخ النشر
                    </label>
                    <input
                      {...register('published_at')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Globe className="w-4 h-4" />
                      الرؤية
                    </label>
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          {...register('is_public')}
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-700">مقال عام</span>
                          <p className="text-sm text-gray-500">متاح لجميع زوار الموقع</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    watchStatus === 'draft' ? 'bg-amber-50 border-amber-200' :
                    watchStatus === 'published' ? 'bg-green-50 border-green-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        watchStatus === 'draft' ? 'bg-amber-500' :
                        watchStatus === 'published' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="font-medium text-gray-700">حالة المقال</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {watchStatus === 'draft' && 'المقال في حالة مسودة ولن يظهر للزوار'}
                      {watchStatus === 'published' && 'المقال منشور ومتاح للقراءة'}
                      {watchStatus === 'archived' && 'المقال مؤرشف ولا يظهر في القوائم الرئيسية'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    watchIsPublic ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className={`w-4 h-4 ${watchIsPublic ? 'text-blue-600' : 'text-orange-600'}`} />
                      <span className="font-medium text-gray-700">مستوى الرؤية</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {watchIsPublic ? 'متاح لجميع زوار الموقع' : 'متاح لأعضاء العائلة المسجلين فقط'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-700">الكاتب</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {currentUser?.full_name || 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag className="w-4 h-4" />
                  {isContentSubmission ? 'الفئة والعلامات' : 'العلامات والكلمات المفتاحية'}
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={isContentSubmission 
                    ? 'أدخل الفئة والعلامات مفصولة بفواصل (مثل: أخبار، إنجازات، مناسبات)'
                    : 'أدخل العلامات مفصولة بفواصل (مثل: أخبار، إنجازات، مناسبات)'
                  }
                />
                <p className="text-sm text-gray-500">
                  {isContentSubmission 
                    ? 'استخدم الفواصل للفصل بين الفئات والعلامات. هذا يساعد أمين العائلة في تصنيف المحتوى.'
                    : 'استخدم الفواصل للفصل بين العلامات. هذه العلامات تساعد في تصنيف المقالات وتسهيل البحث.'
                  }
                </p>
              </div>

              {/* Featured Image */}
              {!isContentSubmission && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Image className="w-4 h-4" />
                  الصورة المميزة
                </label>
                
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Image Preview */}
                  <div className="w-full md:w-1/3">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="معاينة الصورة المميزة" 
                          className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                          style={{ maxHeight: '200px' }}
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                        <Image className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Options */}
                  <div className="w-full md:w-2/3 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">رفع صورة جديدة</label>
                      <input
                        type="file"
                        accept="image/jpeg, image/png"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          file:cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">يمكنك رفع صورة بتنسيق JPG أو PNG بحجم أقصى 5 ميجابايت</p>
                      <p className="text-xs text-amber-600">ملاحظة: يتم حفظ الصورة محلياً حالياً. لتفعيل رفع الصور إلى التخزين السحابي، يجب إنشاء bucket باسم 'images' في مشروع Supabase</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">أو أدخل رابط الصورة</label>
                      <input
                        {...register('featured_image_url')}
                        type="url"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="أدخل رابط الصورة المميزة"
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Publishing Guidelines */}
              {isContentSubmission ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  إرشادات إرسال المحتوى
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• تأكد من صحة المعلومات قبل الإرسال</li>
                  <li>• اكتب ملخصاً واضحاً ومفيداً</li>
                  <li>• استخدم عنواناً واضحاً ووصفياً</li>
                  <li>• أضف العلامات المناسبة لتسهيل التصنيف</li>
                  <li>• سيتم إرسال المحتوى إلى أمين العائلة للموافقة</li>
                  <li>• ستتلقى إشعاراً عند الموافقة أو الرفض</li>
                </ul>
              </div>
              ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  إرشادات النشر
                </h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• تأكد من صحة المعلومات قبل النشر</li>
                  <li>• استخدم عناوين واضحة وجذابة</li>
                  <li>• أضف صورة مميزة لجذب انتباه القراء</li>
                  <li>• استخدم العلامات لتسهيل البحث والتصنيف</li>
                  <li>• اختر حالة "منشور" عندما تكون جاهزاً للنشر</li>
                </ul>
              </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isContentSubmission || (userLevel === 'content_writer' && watchStatus === 'published') ? 'جاري الإرسال للموافقة...' : 'جاري الحفظ...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isContentSubmission 
                      ? 'إرسال للموافقة'
                      : userLevel === 'content_writer' && watchStatus === 'published' 
                        ? 'إرسال للموافقة والنشر'
                      : (editData ? 'تحديث المقال' : 'حفظ المقال')
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}