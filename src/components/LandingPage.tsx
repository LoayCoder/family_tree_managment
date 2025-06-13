
import React from 'react';
import { TreePine, Users, Crown, Shield, Star, ArrowRight, LogIn, UserPlus, Heart, Mountain } from 'lucide-react';

interface LandingPageProps {
  onShowAuth: (mode: 'login' | 'signup') => void;
}

export default function LandingPage({ onShowAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                  <TreePine className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    بني عمير
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">قبيلة عريقة بتاريخ مجيد</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => onShowAuth('login')}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-emerald-600 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-all font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  الدخول
                </button>
                <button
                  onClick={() => onShowAuth('signup')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  <UserPlus className="w-5 h-5" />
                  انضم لنا
                </button>
              </div>

              <div className="sm:hidden flex items-center gap-2">
                <button
                  onClick={() => onShowAuth('login')}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <LogIn className="w-6 h-6" />
                </button>
                <button
                  onClick={() => onShowAuth('signup')}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <UserPlus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 leading-tight">
                <span className="block">الأشراف بني عمير</span>
                <span className="block mt-6 mb-6 sm:mb-8 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  شرف النسب وعراقة التاريخ
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-10 sm:mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
                من الأغصان السامية في نسب الأشراف، أصحاب النسب الطاهر المتصل برسول الله صلى الله عليه وسلم. 
                قبيلة شريفة حسنية النسب، موثقة الأصول، ساكنة الجرادية في جازان المباركة، 
                نحتفي بشرف الانتماء ونحافظ على تراث الأجداد الأطهار
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                <button
                  onClick={() => onShowAuth('signup')}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <Heart className="w-6 h-6" />
                  انضم لعائلتك الكبيرة
                  <ArrowRight className="w-6 h-6" />
                </button>

                <button
                  onClick={() => onShowAuth('login')}
                  className="flex items-center gap-3 px-8 py-4 border-2 border-emerald-500 text-emerald-700 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all"
                >
                  <LogIn className="w-6 h-6" />
                  عضو في القبيلة؟ ادخل هنا
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
