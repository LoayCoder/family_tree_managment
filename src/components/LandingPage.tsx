import React from 'react';
import { TreePine, Users, Database, Shield, Star, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import ResponsiveFlex from './responsive/ResponsiveFlex';
import ResponsiveGrid from './responsive/ResponsiveGrid';
import ResponsiveButton from './responsive/ResponsiveButton';
import ResponsiveText from './responsive/ResponsiveText';

interface LandingPageProps {
  onShowAuth: (mode: 'login' | 'signup') => void;
}

export default function LandingPage({ onShowAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
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
              
              <ResponsiveFlex gap="sm" className="hide-on-mobile">
                <ResponsiveButton 
                  onClick={() => onShowAuth('login')}
                  variant="outline"
                  size="md"
                  icon={<LogIn className="w-4 h-4 sm:w-5 sm:h-5" />}
                >
                  تسجيل الدخول
                </ResponsiveButton>
                <ResponsiveButton
                  onClick={() => onShowAuth('signup')}
                  variant="primary"
                  size="md"
                  icon={<UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />}
                >
                  إنشاء حساب
                </ResponsiveButton>
              </ResponsiveFlex>
              
              {/* Mobile buttons */}
              <div className="show-on-mobile">
                <ResponsiveFlex gap="xs">
                  <button
                    onClick={() => onShowAuth('login')}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onShowAuth('signup')}
                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </ResponsiveFlex>
              </div>
            </ResponsiveFlex>
          </div>
        </ResponsiveContainer>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <ResponsiveContainer>
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <ResponsiveText as="h2" size="4xl" weight="bold" color="gray-800" className="mb-4 sm:mb-6 leading-tight">
                تاريخ آل عمير
                <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  للأجيال القادمة
                </span>
              </ResponsiveText>
              <ResponsiveText size="lg" color="gray-600" className="mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                نظام شامل ومتطور لإدارة شجرة آل عمير والأنساب، وتوثيق تاريخ القبيلة 
                وحفظ ذكرياتها وقصصها و مأثرها في مكان واحد آمن ومنظم
              </ResponsiveText>
              
              <ResponsiveFlex 
                direction={{ xs: 'col', sm: 'row' }} 
                justify="center" 
                gap="md" 
                className="w-full"
              >
                <ResponsiveButton
                  onClick={() => onShowAuth('signup')}
                  variant="primary"
                  size="lg"
                  icon={<UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />}
                  iconPosition="left"
                  className="transform hover:scale-105 shadow-xl"
                >
                  ابدأ رحلتك الآن
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                </ResponsiveButton>
                
                <ResponsiveButton
                  onClick={() => onShowAuth('login')}
                  variant="outline"
                  size="lg"
                  icon={<LogIn className="w-5 h-5 sm:w-6 sm:h-6" />}
                  className="shadow-lg border-2 border-emerald-200"
                >
                  لديك حساب؟ سجل دخولك
                </ResponsiveButton>
              </ResponsiveFlex>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white/50">
        <ResponsiveContainer>
          <div className="text-center mb-10 sm:mb-16">
            <ResponsiveText as="h3" size="3xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
              مميزات النظام
            </ResponsiveText>
            <ResponsiveText size="lg" color="gray-600" className="max-w-2xl mx-auto">
              نظام متكامل يوفر جميع الأدوات اللازمة لإدارة شجرة آل عمير بطريقة احترافية
            </ResponsiveText>
          </div>

          <ResponsiveGrid 
            cols={{ xs: 1, sm: 2, lg: 3 }}
            gap="lg"
          >
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <TreePine className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                شجرة آل عمير التفاعلية
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                عرض تفاعلي لشجرة آل عمير مع إمكانية التنقل بين الأجيال والفروع المختلفة
              </ResponsiveText>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                إدارة شاملة للأعضاء
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                إضافة وتعديل معلومات أفراد آل عمير مع إمكانية ربط العلاقات والمناسبات
              </ResponsiveText>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <Database className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                قاعدة بيانات متقدمة
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                نظام قاعدة بيانات قوي يدعم البحث المتقدم والإحصائيات التفصيلية لقبيلة آل عمير
              </ResponsiveText>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                أمان وخصوصية
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                نظام صلاحيات متدرج يضمن حماية بيانات آل عمير وخصوصية المعلومات
              </ResponsiveText>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                أرشيف رقمي
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                حفظ الصور والوثائق والتسجيلات الصوتية المرتبطة بأفراد آل عمير
              </ResponsiveText>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                تصدير واستيراد
              </ResponsiveText>
              <ResponsiveText color="gray-600" className="leading-relaxed">
                إمكانية تصدير بيانات آل عمير إلى Excel واستيراد البيانات من ملفات خارجية
              </ResponsiveText>
            </div>
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>

      {/* User Levels Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <ResponsiveContainer>
          <div className="text-center mb-10 sm:mb-16">
            <ResponsiveText as="h3" size="3xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
              مستويات المستخدمين
            </ResponsiveText>
            <ResponsiveText size="lg" color="gray-600" className="max-w-2xl mx-auto">
              نظام صلاحيات متدرج يضمن الأمان والتنظيم المناسب لكل مستخدم
            </ResponsiveText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Viewer Level */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 text-center">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-fit mx-auto mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                مشاهد
              </ResponsiveText>
              <ul className="text-sm sm:text-base text-gray-600 space-y-1.5 sm:space-y-2 text-right">
                <li>• عرض شجرة آل عمير</li>
                <li>• البحث في البيانات</li>
                <li>• عرض الإحصائيات</li>
                <li>• تصفح دليل آل عمير</li>
              </ul>
            </div>

            {/* Editor Level */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-200 text-center transform scale-105 md:scale-105 z-10 relative">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-fit mx-auto mb-4 sm:mb-6">
                <Database className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-2 sm:mb-3">
                محرر
              </ResponsiveText>
              <div className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 inline-block">
                الأكثر شيوعاً
              </div>
              <ul className="text-sm sm:text-base text-gray-600 space-y-1.5 sm:space-y-2 text-right">
                <li>• جميع صلاحيات المشاهد</li>
                <li>• إضافة أعضاء جدد</li>
                <li>• تعديل البيانات</li>
                <li>• رفع الصور والوثائق</li>
                <li>• تصدير واستيراد البيانات</li>
              </ul>
            </div>

            {/* Admin Level */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 text-center">
              <div className="p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full w-fit mx-auto mb-4 sm:mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ResponsiveText as="h4" size="xl" weight="bold" color="gray-800" className="mb-3 sm:mb-4">
                مدير
              </ResponsiveText>
              <ul className="text-sm sm:text-base text-gray-600 space-y-1.5 sm:space-y-2 text-right">
                <li>• جميع صلاحيات المحرر</li>
                <li>• حذف البيانات</li>
                <li>• إدارة المستخدمين</li>
                <li>• تعديل الإعدادات</li>
                <li>• النسخ الاحتياطية</li>
              </ul>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <ResponsiveContainer>
          <div className="text-center">
            <div className="max-w-3xl mx-auto">
              <ResponsiveText as="h3" size="3xl" weight="bold" color="white" className="mb-4 sm:mb-6">
                ابدأ في التعرف على شجرة آل عمير اليوم
              </ResponsiveText>
              <ResponsiveText size="lg" color="emerald-100" className="mb-6 sm:mb-8 leading-relaxed">
                تعرف على اول نظام عربي سعودي في إدارة الانساب و التاريخ القبلي
              </ResponsiveText>
              
              <ResponsiveButton
                onClick={() => onShowAuth('signup')}
                variant="outline"
                size="lg"
                icon={<UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />}
                className="bg-white text-emerald-600 border-0 hover:bg-emerald-50 transform hover:scale-105 shadow-xl mx-auto"
              >
                إنشاء حساب مجاني
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              </ResponsiveButton>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <ResponsiveContainer>
          <ResponsiveFlex 
            direction={{ xs: 'col', md: 'row' }} 
            justify="between" 
            align="center" 
            className="gap-4 sm:gap-6"
          >
            <ResponsiveFlex gap="sm" className="mb-4 md:mb-0">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl">
                <TreePine className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold">شجرة آل عمير</h4>
                <p className="text-sm sm:text-base text-gray-400">مباركة طيبة</p>
              </div>
            </ResponsiveFlex>
            
            <div className="text-center md:text-right">
              <p className="text-sm sm:text-base text-gray-400">
                © 2025 شجرة آل عمير. جميع الحقوق محفوظة.
              </p>
            </div>
          </ResponsiveFlex>
        </ResponsiveContainer>
      </footer>
    </div>
  );
}