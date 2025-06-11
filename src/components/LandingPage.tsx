import React from 'react';
import { TreePine, Users, Database, Shield, Star, ArrowRight, LogIn, UserPlus } from 'lucide-react';

interface LandingPageProps {
  onShowAuth: (mode: 'login' | 'signup') => void;
}

export default function LandingPage({ onShowAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
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
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => onShowAuth('login')}
                className="flex items-center gap-2 px-6 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors font-semibold"
              >
                <LogIn className="w-5 h-5" />
                تسجيل الدخول
              </button>
              <button
                onClick={() => onShowAuth('signup')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
              تاريخ آل عمير
              <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                للأجيال القادمة
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              نظام شامل ومتطور لإدارة شجرة آل عمير والأنساب، وتوثيق تاريخ القبيلة 
              وحفظ ذكرياتها وقصصها و مأثرها في مكان واحد آمن ومنظم
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => onShowAuth('signup')}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-bold text-lg shadow-xl transform hover:scale-105"
              >
                <UserPlus className="w-6 h-6" />
                ابدأ رحلتك الآن
                <ArrowRight className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => onShowAuth('login')}
                className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all duration-200 font-bold text-lg shadow-lg border-2 border-emerald-200"
              >
                <LogIn className="w-6 h-6" />
                لديك حساب؟ سجل دخولك
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">
              مميزات النظام
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نظام متكامل يوفر جميع الأدوات اللازمة لإدارة شجرة آل عمير بطريقة احترافية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl w-fit mb-6">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">شجرة آل عمير التفاعلية</h4>
              <p className="text-gray-600 leading-relaxed">
                عرض تفاعلي لشجرة آل عمير مع إمكانية التنقل بين الأجيال والفروع المختلفة
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">إدارة شاملة للأعضاء</h4>
              <p className="text-gray-600 leading-relaxed">
                إضافة وتعديل معلومات أفراد آل عمير مع إمكانية ربط العلاقات والمناسبات
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl w-fit mb-6">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">قاعدة بيانات متقدمة</h4>
              <p className="text-gray-600 leading-relaxed">
                نظام قاعدة بيانات قوي يدعم البحث المتقدم والإحصائيات التفصيلية لقبيلة آل عمير
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl w-fit mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">أمان وخصوصية</h4>
              <p className="text-gray-600 leading-relaxed">
                نظام صلاحيات متدرج يضمن حماية بيانات آل عمير وخصوصية المعلومات
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl w-fit mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">أرشيف رقمي</h4>
              <p className="text-gray-600 leading-relaxed">
                حفظ الصور والوثائق والتسجيلات الصوتية المرتبطة بأفراد آل عمير
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl w-fit mb-6">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">تصدير واستيراد</h4>
              <p className="text-gray-600 leading-relaxed">
                إمكانية تصدير بيانات آل عمير إلى Excel واستيراد البيانات من ملفات خارجية
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Levels Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">
              مستويات المستخدمين
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نظام صلاحيات متدرج يضمن الأمان والتنظيم المناسب لكل مستخدم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Viewer Level */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-fit mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">مشاهد</h4>
              <ul className="text-gray-600 space-y-2 text-right">
                <li>• عرض شجرة آل عمير</li>
                <li>• البحث في البيانات</li>
                <li>• عرض الإحصائيات</li>
                <li>• تصفح دليل آل عمير</li>
              </ul>
            </div>

            {/* Editor Level */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-200 text-center transform scale-105">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-fit mx-auto mb-6">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">محرر</h4>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                الأكثر شيوعاً
              </div>
              <ul className="text-gray-600 space-y-2 text-right">
                <li>• جميع صلاحيات المشاهد</li>
                <li>• إضافة أعضاء جدد</li>
                <li>• تعديل البيانات</li>
                <li>• رفع الصور والوثائق</li>
                <li>• تصدير واستيراد البيانات</li>
              </ul>
            </div>

            {/* Admin Level */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full w-fit mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">مدير</h4>
              <ul className="text-gray-600 space-y-2 text-right">
                <li>• جميع صلاحيات المحرر</li>
                <li>• حذف البيانات</li>
                <li>• إدارة المستخدمين</li>
                <li>• تعديل الإعدادات</li>
                <li>• النسخ الاحتياطية</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold text-white mb-6">
              ابدأ في بناء شجرة آل عمير اليوم
            </h3>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              انضم إلى آلاف العائلات التي تستخدم نظامنا لحفظ تاريخها وذكرياتها
            </p>
            
            <button
              onClick={() => onShowAuth('signup')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-600 rounded-2xl hover:bg-emerald-50 transition-all duration-200 font-bold text-lg shadow-xl transform hover:scale-105"
            >
              <UserPlus className="w-6 h-6" />
              إنشاء حساب مجاني
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-6 md:mb-0">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold">شجرة آل عمير</h4>
                <p className="text-gray-400">حافظ على تراث قبيلتك</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2025 شجرة آل عمير. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}