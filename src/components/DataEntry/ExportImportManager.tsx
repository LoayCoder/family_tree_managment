import React, { useState, useEffect } from 'react';
import { Download, Upload, X, Database, FileText, Check, AlertCircle, Loader, ArrowRight, Copy, Trash2, Save } from 'lucide-react';
import { supabase } from '../../services/arabicFamilyService';

interface ExportImportManagerProps {
  onCancel: () => void;
}

interface TableInfo {
  name: string;
  count: number;
  selected: boolean;
  description: string;
}

export default function ExportImportManager({ onCancel }: ExportImportManagerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);
  const [importData, setImportData] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Define tables with descriptions
      const tableDescriptions: Record<string, string> = {
        'الأشخاص': 'بيانات الرجال في شجرة العائلة',
        'النساء': 'بيانات النساء المرتبطات بالعائلة',
        'المواقع': 'المواقع الجغرافية المرتبطة بالعائلة',
        'الفروع': 'فروع العائلة المختلفة',
        'الأحداث': 'الأحداث المهمة في تاريخ العائلة',
        'ارتباط_النساء': 'علاقات النساء بأفراد العائلة',
        'المراجع': 'المراجع والمصادر الموثقة',
        'الملفات_الصوتية': 'التسجيلات الصوتية المحفوظة',
        'النصوص_والوثائق': 'النصوص والوثائق المكتوبة'
      };

      // Get table counts
      const tableData: TableInfo[] = [];
      
      for (const tableName of Object.keys(tableDescriptions)) {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error getting count for ${tableName}:`, error);
          continue;
        }
        
        tableData.push({
          name: tableName,
          count: count || 0,
          selected: true,
          description: tableDescriptions[tableName] || ''
        });
      }
      
      setTables(tableData);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectAll(selected);
    setTables(tables.map(table => ({ ...table, selected })));
  };

  const handleSelectTable = (tableName: string, selected: boolean) => {
    setTables(tables.map(table => 
      table.name === tableName ? { ...table, selected } : table
    ));
    
    // Update selectAll state based on whether all tables are selected
    const allSelected = tables.every(table => 
      table.name === tableName ? selected : table.selected
    );
    setSelectAll(allSelected);
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportData(null);
    
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const selectedTables = tables.filter(table => table.selected);
      
      if (selectedTables.length === 0) {
        throw new Error('يرجى اختيار جدول واحد على الأقل للتصدير');
      }

      const exportObj: Record<string, any> = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          tables: selectedTables.map(t => t.name)
        },
        data: {}
      };

      // Export data from each selected table
      for (const table of selectedTables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*');
        
        if (error) {
          throw error;
        }
        
        exportObj.data[table.name] = data;
      }

      setExportData(JSON.stringify(exportObj, null, 2));
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(e.target.value);
    setImportPreview(null);
    setImportError(null);
    setImportSuccess(null);
  };

  const handlePreviewImport = () => {
    try {
      if (!importData.trim()) {
        setImportError('يرجى إدخال بيانات للاستيراد');
        return;
      }

      const parsedData = JSON.parse(importData);
      
      if (!parsedData.metadata || !parsedData.data) {
        setImportError('تنسيق البيانات غير صالح. يجب أن تحتوي البيانات على حقول metadata و data');
        return;
      }

      setImportPreview(parsedData);
      setImportError(null);
    } catch (error) {
      console.error('Error parsing import data:', error);
      setImportError('تنسيق JSON غير صالح. يرجى التحقق من البيانات المدخلة');
    }
  };

  const handleImport = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!importPreview) {
        throw new Error('يرجى معاينة البيانات أولاً قبل الاستيراد');
      }

      const { data, metadata } = importPreview;
      
      // Import data to each table
      for (const tableName of metadata.tables) {
        if (!data[tableName] || !Array.isArray(data[tableName])) {
          console.warn(`Skipping table ${tableName}: No data or invalid format`);
          continue;
        }

        if (data[tableName].length === 0) {
          console.log(`No data to import for table ${tableName}`);
          continue;
        }

        // Insert data in batches to avoid request size limitations
        const batchSize = 100;
        const records = data[tableName];
        
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          // For each record, remove any auto-generated fields that might cause conflicts
          const cleanedBatch = batch.map((record: any) => {
            const cleaned = { ...record };
            
            // Remove timestamps if they exist (they'll be auto-generated)
            if (cleaned.تاريخ_الإنشاء) delete cleaned.تاريخ_الإنشاء;
            if (cleaned.تاريخ_التحديث) delete cleaned.تاريخ_التحديث;
            if (cleaned.created_at) delete cleaned.created_at;
            if (cleaned.updated_at) delete cleaned.updated_at;
            
            return cleaned;
          });
          
          const { error } = await supabase
            .from(tableName)
            .upsert(cleanedBatch, { 
              onConflict: getPrimaryKeyForTable(tableName),
              ignoreDuplicates: false
            });
          
          if (error) {
            console.error(`Error importing data to ${tableName}:`, error);
            throw new Error(`فشل استيراد البيانات إلى جدول ${tableName}: ${error.message}`);
          }
        }
      }

      setImportSuccess('تم استيراد البيانات بنجاح!');
      // Reload tables to update counts
      loadTables();
    } catch (error: any) {
      console.error('Error importing data:', error);
      setImportError(error.message || 'حدث خطأ أثناء استيراد البيانات');
    } finally {
      setImportLoading(false);
    }
  };

  const getPrimaryKeyForTable = (tableName: string): string => {
    // Map table names to their primary key columns
    const primaryKeys: Record<string, string> = {
      'الأشخاص': 'id',
      'النساء': 'id',
      'المواقع': 'معرف_الموقع',
      'الفروع': 'معرف_الفرع',
      'الأحداث': 'معرف_الحدث',
      'ارتباط_النساء': 'id',
      'المراجع': 'معرف_المرجع',
      'الملفات_الصوتية': 'معرف_الملف_الصوتي',
      'النصوص_والوثائق': 'معرف_النص'
    };
    
    return primaryKeys[tableName] || 'id';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
      setImportPreview(null);
      setImportError(null);
      setImportSuccess(null);
    };
    reader.readAsText(file);
  };

  const downloadExportFile = () => {
    if (!exportData) return;
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-tree-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!exportData) return;
    
    navigator.clipboard.writeText(exportData)
      .then(() => {
        alert('تم نسخ البيانات إلى الحافظة');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('فشل نسخ البيانات إلى الحافظة');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل معلومات الجداول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">
                  تصدير واستيراد البيانات
                </h1>
                <p className="text-gray-600">إدارة نسخ البيانات واستيرادها</p>
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="bg-white rounded-t-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-4 px-6 text-center font-medium text-lg transition-colors ${
                  activeTab === 'export'
                    ? 'bg-gray-100 text-gray-800 border-b-2 border-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  تصدير البيانات
                </div>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-4 px-6 text-center font-medium text-lg transition-colors ${
                  activeTab === 'import'
                    ? 'bg-gray-100 text-gray-800 border-b-2 border-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  استيراد البيانات
                </div>
              </button>
            </div>

            {/* Export Tab Content */}
            {activeTab === 'export' && (
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-blue-800 font-medium text-lg">معلومات هامة</h3>
                      <p className="text-blue-700 mt-1">
                        يمكنك تصدير البيانات من الجداول المختارة لعمل نسخة احتياطية أو نقلها إلى نظام آخر.
                        سيتم تصدير البيانات بتنسيق JSON يمكن استيراده لاحقاً.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">اختر الجداول للتصدير</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="text-sm font-medium text-gray-700">تحديد الكل</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tables.map((table) => (
                      <div
                        key={table.name}
                        className={`p-4 border rounded-xl transition-colors ${
                          table.selected
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={table.selected}
                              onChange={(e) => handleSelectTable(table.name, e.target.checked)}
                              className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                            />
                            <div>
                              <h4 className="font-medium text-gray-800">{table.name}</h4>
                              <p className="text-sm text-gray-500">{table.description}</p>
                            </div>
                          </div>
                          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                            {table.count} سجل
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleExport}
                    disabled={exportLoading || tables.filter(t => t.selected).length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {exportLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        تصدير البيانات
                      </>
                    )}
                  </button>
                </div>

                {exportData && (
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">البيانات المصدرة</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-4 h-4" />
                          نسخ
                        </button>
                        <button
                          onClick={downloadExportFile}
                          className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          تنزيل
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-96">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap" dir="ltr">
                        {exportData}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Tab Content */}
            {activeTab === 'import' && (
              <div className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 mt-1">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-amber-800 font-medium text-lg">تنبيه هام</h3>
                      <p className="text-amber-700 mt-1">
                        استيراد البيانات قد يؤدي إلى تحديث أو استبدال البيانات الموجودة. يرجى التأكد من صحة البيانات المستوردة قبل المتابعة.
                        يفضل عمل نسخة احتياطية من البيانات الحالية قبل الاستيراد.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">استيراد البيانات</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Upload className="w-4 h-4" />
                      اختر ملف JSON للاستيراد
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200
                        file:cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4" />
                      أو الصق البيانات هنا
                    </label>
                    <textarea
                      value={importData}
                      onChange={handleImportDataChange}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors resize-none font-mono text-sm"
                      placeholder="الصق بيانات JSON هنا..."
                      dir="ltr"
                    />
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handlePreviewImport}
                      disabled={!importData.trim()}
                      className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      معاينة البيانات
                    </button>
                  </div>

                  {importError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600 mt-1">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-red-800 font-medium">خطأ في البيانات</h3>
                          <p className="text-red-700 mt-1">{importError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600 mt-1">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-green-800 font-medium">تم الاستيراد بنجاح</h3>
                          <p className="text-green-700 mt-1">{importSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importPreview && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">معاينة البيانات</h3>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-700">معلومات التصدير:</h4>
                            <p className="text-sm text-gray-600">
                              تاريخ التصدير: {new Date(importPreview.metadata.exportDate).toLocaleString('ar-SA')}
                            </p>
                            <p className="text-sm text-gray-600">
                              الإصدار: {importPreview.metadata.version}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-700">الجداول المتضمنة:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {importPreview.metadata.tables.map((tableName: string) => {
                                const recordCount = importPreview.data[tableName]?.length || 0;
                                return (
                                  <div key={tableName} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <span className="font-medium text-gray-700">{tableName}</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                                      {recordCount} سجل
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center mt-4">
                        <button
                          onClick={handleImport}
                          disabled={importLoading}
                          className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {importLoading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              جاري الاستيراد...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              استيراد البيانات
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">إرشادات وتعليمات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Download className="w-5 h-5 text-gray-600" />
                  تصدير البيانات
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>حدد الجداول التي ترغب في تصديرها</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>انقر على زر "تصدير البيانات" لإنشاء ملف JSON</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>يمكنك نسخ البيانات أو تنزيلها كملف</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>قم بحفظ الملف في مكان آمن كنسخة احتياطية</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gray-600" />
                  استيراد البيانات
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>اختر ملف JSON للاستيراد أو الصق البيانات مباشرة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>انقر على "معاينة البيانات" للتحقق من صحة البيانات</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>تأكد من أن البيانات المستوردة متوافقة مع هيكل قاعدة البيانات الحالية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>انقر على "استيراد البيانات" لإتمام عملية الاستيراد</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-700 mb-2">ملاحظة هامة:</h4>
              <p className="text-gray-600">
                عند استيراد البيانات، سيتم تحديث السجلات الموجودة بنفس المعرف وإضافة السجلات الجديدة.
                يفضل عمل نسخة احتياطية من البيانات الحالية قبل الاستيراد لتجنب فقدان البيانات.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}