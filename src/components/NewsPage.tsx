import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Tag, Search, Filter, Eye, ArrowLeft, Clock, Globe, Heart, ToggleLeft, ToggleRight, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/arabicFamilyService';

interface NewsPost {
  id: number;
  title: string;
  content: string;
  author_id: string;
  published_at: string;
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  tags: string[] | null;
  featured_image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    email: string;
  };
}

interface NewsPageProps {
  onBack: () => void;
  user?: any;
}

export default function NewsPage({ onBack, user }: NewsPageProps) {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [showMySubmissions, setShowMySubmissions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNewsPosts();
  }, [user]);

  const loadNewsPosts = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Add timeout and retry logic
      const maxRetries = 3;
      let retries = 0;
      let data = null;
      let error = null;

      // Build query based on user authentication
      let query = supabase
        .from('news_posts')
        .select(`
          *,
          user_profiles!inner(full_name, email)
        `)
        .order('published_at', { ascending: false });

      // Determine what posts to show based on user role and view mode
      if (!user) {
        // Unauthenticated users: only public published posts
        query = query
          .eq('status', 'published')
          .eq('is_public', true);
      } else if (user.role_name === 'family_secretary' || user.role_name === 'admin') {
        // Family secretary and admin: see all posts regardless of status
        // No additional filters needed
      } else if (user.role_name === 'content_writer') {
        if (showMySubmissions) {
          // Content writer viewing their submissions: all their posts regardless of status
          query = query.eq('author_id', user.id);
        } else {
          // Content writer viewing public news: only public published posts
          query = query
            .eq('status', 'published')
            .eq('is_public', true);
        }
      } else {
        // Other authenticated users (family_member, viewer, etc.): published posts (both public and family-only)
        query = query
          .eq('status', 'published');
      }

      // Retry logic for connection issues
      while (retries < maxRetries) {
        try {
          const result = await query;
          data = result.data;
          error = result.error;
          break;
        } catch (err) {
          retries++;
          if (err.message?.includes('message port closed') && retries < maxRetries) {
            console.warn(`Connection issue loading news, retrying... (${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      if (error) throw error;

      // Debug logging to see what data is being returned
      console.log('Raw data from Supabase:', data);
      console.log('User info:', user);
      console.log('Show my submissions:', showMySubmissions);

      // Format the data
      const formattedPosts = data?.map(post => ({
        ...post,
        author: post.user_profiles
      })) || [];

      console.log('Formatted posts:', formattedPosts);

      setNewsPosts(formattedPosts);

      // Extract unique tags
      const allTags = formattedPosts
        .flatMap(post => post.tags || [])
        .filter((tag, index, array) => array.indexOf(tag) === index)
        .sort();
      
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error loading news posts:', error);
      // Don't show error for connection issues, just log them
      if (!error.message?.includes('message port closed')) {
        // Show user-friendly error message
        console.error('Failed to load news posts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = newsPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, isPublic: boolean) => {
    if (status === 'pending_approval') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 text-xs">
          <Clock className="w-3 h-3" />
          قيد الانتظار
        </span>
      );
    } else if (status === 'published' && isPublic) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200 text-xs">
          <Globe className="w-3 h-3" />
          منشور عام
        </span>
      );
    } else if (status === 'published' && !isPublic) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200 text-xs">
          <Heart className="w-3 h-3" />
          منشور للعائلة
        </span>
      );
    } else if (status === 'draft') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 text-xs">
          <Clock className="w-3 h-3" />
          مسودة
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-200 text-xs">
          <XCircle className="w-3 h-3" />
          مرفوض
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200 text-xs">
          مؤرشف
        </span>
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNewsPosts();
    setRefreshing(false);
  };

  const toggleMySubmissions = () => {
    setShowMySubmissions(!showMySubmissions);
    // Clear search and filters when switching views
    setSearchTerm('');
    setSelectedTag('');
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  أخبار ومقالات آل عمير
                </h1>
                <p className="text-gray-600">جاري تحميل الأخبار...</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الأخبار والمقالات...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  أخبار ومقالات آل عمير
                </h1>
                <p className="text-gray-600">
                  {showMySubmissions ? 'مقالاتي ومحتوياتي المرسلة' : 'آخر الأخبار والمستجدات العائلية'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Content Writer Toggle */}
              {user && user.role_name === 'content_writer' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMySubmissions}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      showMySubmissions
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {showMySubmissions ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">
                      {showMySubmissions ? 'مقالاتي' : 'الأخبار العامة'}
                    </span>
                  </button>
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                title="تحديث"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="text-sm text-gray-600">
                {filteredPosts.length} مقال
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          {/* View Mode Indicator for Content Writers */}
          {user && user.role_name === 'content_writer' && showMySubmissions && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800">عرض مقالاتي</h3>
                  <p className="text-blue-600 text-sm">
                    تعرض هذه الصفحة جميع المقالات والمحتويات التي قمت بإرسالها، بما في ذلك المسودات والمقالات قيد الانتظار والمنشورة.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="البحث في الأخبار والمقالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="relative min-w-[200px]">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">جميع الفئات</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* News Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">لا توجد مقالات</h3>
            <p className="text-gray-500">
              {searchTerm || selectedTag ? 'لم يتم العثور على مقالات تطابق معايير البحث' : 
               showMySubmissions ? 'لم تقم بإرسال أي مقالات بعد' : 'لم يتم نشر أي مقالات بعد'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <User className="w-4 h-4" />
                        <span>{post.author?.full_name || 'كاتب غير معروف'}</span>
                        <span>•</span>
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at || post.created_at)}</span>
                        {/* Show submission date for pending posts */}
                        {post.status === 'pending_approval' && post.submitted_for_approval_at && (
                          <>
                            <span>•</span>
                            <span>{formatDate(post.submitted_for_approval_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(post.status, post.is_public)}
                  </div>

                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {truncateContent(post.content)}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Read More */}
                  <div className="flex justify-end">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                      <Eye className="w-4 h-4" />
                      قراءة المزيد
                    </button>
                  </div>
                  
                  {/* Additional info for content writers viewing their submissions */}
                  {showMySubmissions && user && user.role_name === 'content_writer' && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>تاريخ الإنشاء: {formatDate(post.created_at)}</span>
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <span>آخر تحديث: {formatDate(post.updated_at)}</span>
                        )}
                      </div>
                      {post.status === 'pending_approval' && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                          <p className="text-amber-700 text-xs">
                            المقال قيد المراجعة من قبل أمين العائلة. ستتلقى إشعاراً عند الموافقة أو الرفض.
                          </p>
                        </div>
                      )}
                      {post.status === 'rejected' && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-red-700 text-xs">
                            تم رفض هذا المقال. يرجى مراجعة المحتوى وإعادة الإرسال.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Full Post Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedPost.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{selectedPost.author?.full_name || 'كاتب غير معروف'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedPost.published_at || selectedPost.created_at)}</span>
                      </div>
                      {/* Show additional status info for pending/rejected posts */}
                      {selectedPost.status === 'pending_approval' && selectedPost.submitted_for_approval_at && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-4 h-4" />
                          <span>أُرسل للموافقة: {formatDate(selectedPost.submitted_for_approval_at)}</span>
                        </div>
                      )}
                      {getStatusBadge(selectedPost.status, selectedPost.is_public)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Featured Image */}
                {selectedPost.featured_image_url && (
                  <div className="mb-6">
                    <img
                      src={selectedPost.featured_image_url}
                      alt={selectedPost.title}
                      className="w-full h-auto rounded-xl border border-gray-200 object-cover"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                  {selectedPost.content}
                </div>

                {/* Tags */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">العلامات:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Status Information for Content Writers */}
                {user && user.role_name === 'content_writer' && selectedPost.author_id === user.id && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-medium text-blue-800 mb-2">معلومات الحالة</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-600">تاريخ الإنشاء:</span>
                          <span className="text-blue-800">{formatDate(selectedPost.created_at)}</span>
                        </div>
                        {selectedPost.updated_at && selectedPost.updated_at !== selectedPost.created_at && (
                          <div className="flex justify-between">
                            <span className="text-blue-600">آخر تحديث:</span>
                            <span className="text-blue-800">{formatDate(selectedPost.updated_at)}</span>
                          </div>
                        )}
                        {selectedPost.submitted_for_approval_at && (
                          <div className="flex justify-between">
                            <span className="text-blue-600">تاريخ الإرسال للموافقة:</span>
                            <span className="text-blue-800">{formatDate(selectedPost.submitted_for_approval_at)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-blue-600">الحالة الحالية:</span>
                          <span>{getStatusBadge(selectedPost.status, selectedPost.is_public)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}