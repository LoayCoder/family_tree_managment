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
                  <p className="text-xs sm:text-sm text-gray-600">رمز للفخر والانتماء</p>
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
                  انضم لنا
                </ResponsiveButton>
              </ResponsiveFlex>
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
                فخر آل عمير
                <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  وإرث يُروى للأجيال
                </span>
              </ResponsiveText>
              <ResponsiveText size="lg" color="gray-600" className="mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                هذا المشروع هو نافذتنا لحفظ النسب، وتخليد ذكرى الأجداد، واستذكار أمجاد قبيلة آل عمير بكل فخر ومحبة، وإهداء لكل فرد ينتمي لهذا الكيان العظيم.
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
                  كن جزءًا من شجرة المجد
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
    </div>
  );
}
