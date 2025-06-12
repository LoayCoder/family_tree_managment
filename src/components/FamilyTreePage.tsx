import React from 'react';
import { TreePine, ArrowLeft, Home } from 'lucide-react';
import FamilyTreeEntryForm from './FamilyTreeEntryForm';
import App from '../App';

export default function FamilyTreePage() {
  const [showMainApp, setShowMainApp] = React.useState(false);

  if (showMainApp) {
    return <App />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowMainApp(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>العودة للنظام الرئيسي</span>
          </button>
          
          <button
            onClick={() => setShowMainApp(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Home className="w-5 h-5" />
            <span>الصفحة الرئيسية</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <TreePine className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            شجرة آل عمير
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            أدخل معلومات العائلة بالتفصيل لبناء شجرة العائلة الخاصة بك
          </p>
        </div>

        {/* Form */}
        <FamilyTreeEntryForm />
      </div>
    </div>
  );
}