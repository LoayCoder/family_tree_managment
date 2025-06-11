import React, { useState, useEffect } from 'react';
import { Download, Upload, FileText, Save, X, Database, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/arabicFamilyService';
import * as XLSX from 'xlsx';

interface ExcelImportExportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TableInfo {
  name: string;
  count: number;
  selected: boolean;
  description: string;
}

export default function ExcelImportExport({ onSuccess, onCancel }: ExcelImportExportProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'template'>('export');
  const [selectAll, setSelectAll] = useState(true);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');

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
      if (tableData.length > 0) {
        setSelectedTable(tableData[0].name);
      }
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

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const selectedTables = tables.filter(table => table.selected);
      
      if (selectedTables.length === 0) {
        throw new Error('يرجى اختيار جدول واحد على الأقل للتصدير');
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Export data from each selected table
      for (const table of selectedTables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Create worksheet
          const worksheet = XLSX.utils.json_to_sheet(data);
          
          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, table.name);
        }
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-tree-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      alert(`حدث خطأ أثناء التصدير: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('يرجى اختيار ملف Excel بتنسيق .xlsx أو .xls');
      return;
    }
    
    setImportFile(file);
    setImportError(null);
    setImportSuccess(null);
    setImportPreview(null);
  };

  const handlePreviewImport = async () => {
    if (!importFile) {
      setImportError('يرجى اختيار ملف للاستيراد');
      return;
    }
    
    if (!selectedTable) {
      setImportError('يرجى اختيار الجدول المستهدف للاستيراد');
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setImportError('الملف لا يحتوي على بيانات');
            return;
          }
          
          // Show preview (first 5 records)
          setImportPreview(jsonData.slice(0, 5));
          setImportError(null);
        } catch (error: any) {
          console.error('Error parsing Excel file:', error);
          setImportError(`خطأ في قراءة ملف Excel: ${error.message}`);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
    } catch (error: any) {
      console.error('Error previewing import:', error);
      setImportError(`حدث خطأ: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!importFile || !selectedTable) {
      setImportError('يرجى اختيار ملف وجدول للاستيراد');
      return;
    }
    
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setImportError('الملف لا يحتوي على بيانات');
            setImportLoading(false);
            return;
          }
          
          // Import data in batches
          const batchSize = 100;
          let importedCount = 0;
          
          for (let i = 0; i < jsonData.length; i += batchSize) {
            const batch = jsonData.slice(i, i + batchSize);
            
            // Clean data (remove timestamps)
            const cleanedBatch = batch.map((record: any) => {
              const cleaned = { ...record };
              
              // Remove timestamps if they exist
              if (cleaned.تاريخ_الإنشاء) delete cleaned.تاريخ_الإنشاء;
              if (cleaned.تاريخ_التحديث) delete cleaned.تاريخ_التحديث;
              if (cleaned.created_at) delete cleaned.created_at;
              if (cleaned.updated_at) delete cleaned.updated_at;
              
              return cleaned;
            });
            
            // Insert data
            const { error } = await supabase!
              .from(selectedTable)
              .upsert(cleanedBatch, {
                onConflict: getPrimaryKeyForTable(selectedTable),
                ignoreDuplicates: false
              });
            
            if (error) {
              throw error;
            }
            
            importedCount += batch.length;
          }
          
          setImportSuccess(`تم استيراد ${importedCount} سجل بنجاح إلى جدول ${selectedTable}`);
          loadTables(); // Refresh table counts
          setImportLoading(false);
        } catch (error: any) {
          console.error('Error importing data:', error);
          setImportError(`فشل استيراد البيانات: ${error.message}`);
          setImportLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
    } catch (error: any) {
      console.error('Error in import process:', error);
      setImportError(`حدث خطأ: ${error.message}`);
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

  const downloadTemplate = () => {
    if (!selectedTable) {
      alert('يرجى اختيار جدول لتنزيل القالب');
      return;
    }
    
    try {
      // Create template based on table structure
      const templateData: any[] = [];
      
      // Add one empty row with column headers
      const templateRow: any = {};
      
      // Get column names based on table
      const columnNames = getColumnsForTable(selectedTable);
      
      // Create empty row with all columns
      columnNames.forEach(column => {
        templateRow[column] = '';
      });
      
      templateData.push(templateRow);
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Add instructions sheet
      const instructionsData = [
        { 'تعليمات الاستخدام': 'قالب لاستيراد البيانات إلى جدول ' + selectedTable },
        { 'تعليمات الاستخدام': '1. املأ البيانات في الأعمدة المناسبة' },
        { 'تعليمات الاستخدام': '2. لا تغير أسماء الأعمدة' },
        { 'تعليمات الاستخدام': '3. يمكنك إضافة صفوف جديدة حسب الحاجة' },
        { 'تعليمات الاستخدام': '4. احفظ الملف بتنسيق .xlsx' },
        { 'تعليمات الاستخدام': '5. قم بتحميل الملف في صفحة الاستيراد' },
        { 'تعليمات الاستخدام': '' },
        { 'تعليمات الاستخدام': 'ملاحظات هامة:' },
        { 'تعليمات الاستخدام': '- تأكد من صحة التواريخ بتنسيق YYYY-MM-DD' },
        { 'تعليمات الاستخدام': '- تأكد من صحة المعرفات الخارجية (foreign keys)' },
      ];
      
      const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'تعليمات');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${selectedTable}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error creating template:', error);
      alert(`حدث خطأ أثناء إنشاء القالب: ${error.message}`);
    }
  };

  const getColumnsForTable = (tableName: string): string[] => {
    // Define columns for each table
    const tableColumns: Record<string, string[]> = {
      'الأشخاص': [
        'الاسم_الأول', 'is_root', 'تاريخ_الميلاد', 'تاريخ_الوفاة', 'مكان_الميلاد', 'مكان_الوفاة',
        'رقم_هوية_وطنية', 'الجنس', 'الحالة_الاجتماعية', 'المنصب', 'مستوى_التعليم',
        'father_id', 'mother_id', 'معرف_الفرع', 'صورة_شخصية', 'ملاحظات'
      ],
      'النساء': [
        'الاسم_الأول', 'اسم_الأب', 'اسم_العائلة', 'تاريخ_الميلاد', 'تاريخ_الوفاة',
        'مكان_الميلاد', 'مكان_الوفاة', 'رقم_هوية_وطنية', 'الحالة_الاجتماعية',
        'المنصب', 'مستوى_التعليم', 'معرف_الفرع', 'صورة_شخصية', 'ملاحظات'
      ],
      'المواقع': [
        'الدولة', 'المنطقة', 'المدينة', 'تفاصيل_إضافية'
      ],
      'الفروع': [
        'اسم_الفرع', 'وصف_الفرع', 'الفرع_الأصل', 'معرف_الموقع', 'تاريخ_التأسيس', 'ملاحظات'
      ],
      'الأحداث': [
        'معرف_الشخص', 'معرف_المرأة', 'نوع_الحدث', 'عنوان_الحدث', 'وصف_الحدث',
        'تاريخ_الحدث', 'مكان_الحدث', 'أهمية_الحدث', 'هو_عام'
      ],
      'ارتباط_النساء': [
        'woman_id', 'person_id', 'نوع_الارتباط', 'السبب_أو_الحدث',
        'تاريخ_الحدث', 'مكان_الحدث', 'أهمية_الحدث', 'تفاصيل_إضافية'
      ]
    };
    
    return tableColumns[tableName] || [];
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
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">
                  تصدير واستيراد بيانات Excel
                </h1>
                <p className="text-gray-600">إدارة البيانات باستخدام ملفات Excel</p>
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
                  تصدير إلى Excel
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
                  استيراد من Excel
                </div>
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 py-4 px-6 text-center font-medium text-lg transition-colors ${
                  activeTab === 'template'
                    ? 'bg-gray-100 text-gray-800 border-b-2 border-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  تنزيل قالب Excel
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
                        يمكنك تصدير البيانات من الجداول المختارة إلى ملف Excel.
                        سيتم إنشاء ورقة عمل منفصلة لكل جدول في ملف Excel واحد.
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
                    onClick={handleExportToExcel}
                    disabled={exportLoading || tables.filter(t => t.selected).length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {exportLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        تصدير إلى Excel
                      </>
                    )}
                  </button>
                </div>
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
                  <h3 className="text-lg font-semibold text-gray-800">استيراد البيانات من Excel</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Database className="w-4 h-4" />
                      اختر الجدول المستهدف
                    </label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                    >
                      <option value="">اختر الجدول</option>
                      {tables.map((table) => (
                        <option key={table.name} value={table.name}>
                          {table.name} - {table.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Upload className="w-4 h-4" />
                      اختر ملف Excel للاستيراد
                    </label>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200
                        file:cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">يمكنك رفع ملف Excel بتنسيق .xlsx أو .xls</p>
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handlePreviewImport}
                      disabled={!importFile || !selectedTable}
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
                      <h3 className="text-lg font-semibold text-gray-800">معاينة البيانات ({importPreview.length} سجل)</h3>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              {Object.keys(importPreview[0]).map((key) => (
                                <th key={key} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {importPreview.map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value: any, i) => (
                                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {value?.toString() || ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-center mt-4">
                        <button
                          onClick={handleImport}
                          disabled={importLoading}
                          className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {importLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

            {/* Template Tab Content */}
            {activeTab === 'template' && (
              <div className="p-6 space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mt-1">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-indigo-800 font-medium text-lg">قوالب Excel</h3>
                      <p className="text-indigo-700 mt-1">
                        يمكنك تنزيل قوالب Excel جاهزة لكل جدول في قاعدة البيانات. تحتوي هذه القوالب على أسماء الأعمدة الصحيحة
                        وتعليمات للاستخدام، مما يسهل عملية إدخال البيانات وتجنب الأخطاء عند الاستيراد.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">اختر الجدول لتنزيل القالب</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Database className="w-4 h-4" />
                      الجدول
                    </label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">اختر الجدول</option>
                      {tables.map((table) => (
                        <option key={table.name} value={table.name}>
                          {table.name} - {table.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center mt-6">
                    <button
                      onClick={downloadTemplate}
                      disabled={!selectedTable}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      تنزيل قالب Excel
                    </button>
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">تعليمات استخدام القوالب:</h4>
                  <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                    <li>قم بتنزيل القالب للجدول المطلوب</li>
                    <li>افتح الملف في برنامج Excel أو ما يشابهه</li>
                    <li>أدخل البيانات في الأعمدة المناسبة، مع الالتزام بالتنسيق المطلوب</li>
                    <li>احفظ الملف بتنسيق .xlsx</li>
                    <li>استخدم تبويب "استيراد من Excel" لرفع الملف</li>
                    <li>قم بمعاينة البيانات قبل الاستيراد النهائي</li>
                  </ol>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>ملاحظة:</strong> تأكد من استخدام المعرفات الصحيحة للعلاقات بين الجداول (مثل معرف_الفرع، معرف_الموقع، إلخ).
                      يمكنك تصدير البيانات الحالية أولاً للاطلاع على المعرفات الموجودة.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}