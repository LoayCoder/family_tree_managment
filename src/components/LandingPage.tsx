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
              
              {/* Mobile buttons */}
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
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 sm:mb-8 leading-tight">
                تراث بني عمير
                <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  أصالة وعراقة
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-10 sm:mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
                قبيلة بني عمير العريقة، صاحبة التاريخ المجيد والأصالة الضاربة في عمق التراث العربي. 
                نحتفي بماضينا العريق ونوثق إنجازات أجدادنا للأجيال القادمة، فخراً بانتمائنا وحفاظاً على تراثنا الأصيل
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

      {/* Heritage Section */}
      <section className="py-16 sm:py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
              مآثر وإنجازات بني عمير
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              تاريخ حافل بالإنجازات والمواقف النبيلة التي خلدت اسم بني عمير في سجل التاريخ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Achievement 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl w-fit mb-6">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                قيادة وحكمة
              </h4>
              <p className="text-gray-600 leading-relaxed">
                برز من بني عمير قادة حكماء وشيوخ مؤثرون، قادوا قبائلهم بالحكمة والعدل، وكانوا مرجعاً في الفصل بين الناس وحل النزاعات
              </p>
            </div>

            {/* Achievement 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                فروسية وشجاعة
              </h4>
              <p className="text-gray-600 leading-relaxed">
                اشتهر فرسان بني عمير بشجاعتهم وإقدامهم في الدفاع عن الأرض والعرض، وكانوا مضرب المثل في النجدة والمروءة
              </p>
            </div>

            {/* Achievement 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl w-fit mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                علم وأدب
              </h4>
              <p className="text-gray-600 leading-relaxed">
                أنجبت بني عمير علماء وشعراء وأدباء، ساهموا في إثراء الثقافة العربية بإبداعاتهم وعلومهم المتنوعة
              </p>
            </div>

            {/* Achievement 4 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl w-fit mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                كرم وضيافة
              </h4>
              <p className="text-gray-600 leading-relaxed">
                عُرفت بيوت بني عمير بالكرم والضيافة، وكانت مضارب القبيلة ملاذاً للضيوف وعابري السبيل من جميع أنحاء الجزيرة العربية
              </p>
            </div>

            {/* Achievement 5 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl w-fit mb-6">
                <Mountain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                حفظ التراث
              </h4>
              <p className="text-gray-600 leading-relaxed">
                حافظت الأجيال المتعاقبة من بني عمير على التراث والعادات الأصيلة، ونقلوها للأجيال اللاحقة بأمانة وإخلاص
              </p>
            </div>

            {/* Achievement 6 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl w-fit mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                وحدة وتلاحم
              </h4>
              <p className="text-gray-600 leading-relaxed">
                تميزت بني عمير بالتلاحم والوحدة، حيث وقف أفراد القبيلة صفاً واحداً في الشدائد والملمات، مما جعلها قوة لا يُستهان بها
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Family Values Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">
              قيم وتقاليد راسخة
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              قيم أصيلة توارثتها الأجيال وحافظت عليها عبر التاريخ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Honor */}
            <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-3xl p-8 text-center border-2 border-emerald-200">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full w-fit mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">
                الشرف والنزاهة
              </h4>
              <p className="text-gray-600 leading-relaxed">
                التمسك بالمبادئ النبيلة والأخلاق الحميدة، والحفاظ على سمعة العائلة وشرفها عبر الأجيال
              </p>
            </div>

            {/* Unity - Highlighted */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-8 text-center border-2 border-emerald-300 transform scale-105 shadow-2xl">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full w-fit mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                الوحدة والتلاحم
              </h4>
              <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-4 inline-block">
                القيمة الأساسية
              </div>
              <p className="text-gray-600 leading-relaxed">
                قوة الرابطة العائلية والوقوف معاً في السراء والضراء، فالعائلة الواحدة كالجسد الواحد
              </p>
            </div>

            {/* Heritage */}
            <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-3xl p-8 text-center border-2 border-emerald-200">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-fit mx-auto mb-6">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">
                الحفاظ على التراث
              </h4>
              <p className="text-gray-600 leading-relaxed">
                تقدير الماضي العريق والحفاظ على العادات والتقاليد الأصيلة، ونقلها للأجيال القادمة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
                كن جزءاً من تاريخ بني عمير العريق
              </h3>
              <p className="text-xl sm:text-2xl text-emerald-100 mb-8 sm:mb-10 leading-relaxed">
                انضم إلى عائلتك الكبيرة واحتفِ بانتمائك لهذه القبيلة العريقة
              </p>
              
              <button
                onClick={() => onShowAuth('signup')}
                className="inline-flex items-center gap-4 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
              >
                <Heart className="w-7 h-7" />
                سجل انتماءك لبني عمير
                <ArrowRight className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold">بني عمير</h4>
                <p className="text-gray-400">أصالة وعراقة</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-lg">
                فخر الانتماء لقبيلة بني عمير العريقة
              </p>
              <p className="text-gray-400 text-sm mt-2">
                © 2025 جميع الحقوق محفوظة لأبناء بني عمير
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}