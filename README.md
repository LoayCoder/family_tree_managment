# Arabic Family Tree System - نظام شجرة آل عمير العربية

A comprehensive Arabic family tree management system built with React, TypeScript, and Supabase. This system provides advanced genealogy management with hierarchical structure, geographic branches, and national ID support.

## Features - المميزات

### 🌳 Advanced Family Tree Structure
- **Hierarchical organization** using PostgreSQL ltree extension
- **Automatic path generation** for family lineage
- **Multi-generational support** with unlimited depth
- **Root family identification** and management

### 🔍 Advanced Search Capabilities
- **National ID search** for both men and women
- **Name-based search** with Arabic text support
- **Generation-level filtering**
- **Branch-based search**
- **Geographic location search**

### 🏛️ Geographic Branch Management
- **Multiple family branches** with geographic distribution
- **Location hierarchy** (Country → Region → City)
- **Branch-specific member management**
- **Historical establishment dates**

### 📊 Comprehensive Statistics
- **Generation analysis** with member counts
- **Branch distribution** statistics
- **Geographic spread** visualization
- **Family growth** tracking over time

### 🔐 Security & Performance
- **Row Level Security (RLS)** enabled
- **Optimized database indexes** for fast queries
- **Automatic timestamp management**
- **Data integrity constraints**

## Database Schema - هيكل قاعدة البيانات

### Core Tables - الجداول الأساسية

#### 1. المواقع (Locations)
```sql
- معرف_الموقع (Location ID)
- الدولة (Country)
- المنطقة (Region)
- المدينة (City)
- تفاصيل_إضافية (Additional Details)
```

#### 2. الفروع (Branches)
```sql
- معرف_الفرع (Branch ID)
- اسم_الفرع (Branch Name)
- وصف_الفرع (Branch Description)
- الفرع_الأصل (Parent Branch)
- معرف_الموقع (Location ID)
- تاريخ_التأسيس (Establishment Date)
- مسار_الفرع (Branch Path - ltree)
```

#### 3. الأشخاص (Persons - Men)
```sql
- id (Person ID)
- الاسم_الأول (First Name)
- is_root (Root Family Flag)
- تاريخ_الميلاد (Birth Date)
- تاريخ_الوفاة (Death Date)
- مكان_الميلاد (Birth Location)
- مكان_الوفاة (Death Location)
- رقم_هوية_وطنية (National ID)
- الجنس (Gender)
- الحالة_الاجتماعية (Marital Status)
- المنصب (Position/Title)
- مستوى_التعليم (Education Level)
- father_id (Father ID)
- mother_id (Mother ID)
- معرف_الفرع (Branch ID)
- path (Family Path - ltree)
- صورة_شخصية (Profile Picture)
- ملاحظات (Notes)
```

#### 4. النساء (Women)
```sql
- id (Woman ID)
- الاسم_الأول (First Name)
- اسم_الأب (Father's Name)
- اسم_العائلة (Family Name)
- تاريخ_الميلاد (Birth Date)
- تاريخ_الوفاة (Death Date)
- مكان_الميلاد (Birth Location)
- مكان_الوفاة (Death Location)
- رقم_هوية_وطنية (National ID)
- الحالة_الاجتماعية (Marital Status)
- المنصب (Position/Title)
- مستوى_التعليم (Education Level)
- معرف_الفرع (Branch ID)
- صورة_شخصية (Profile Picture)
- ملاحظات (Notes)
```

## Advanced Features - المميزات المتقدمة

### 🔄 Automatic Path Generation
The system automatically generates hierarchical paths using PostgreSQL triggers:
```sql
-- Example paths:
100                    -- Root family
100.101               -- First generation child
100.101.102           -- Second generation child
100.101.102.103       -- Third generation child
```

### 📋 Comprehensive View
The `عرض_الأشخاص_كامل` view provides complete family information:
- Full names with paternal lineage
- Generation levels
- Geographic information
- Branch affiliations
- Complete family relationships

### 🔍 Advanced Query Functions
```sql
-- Search by National ID
SELECT * FROM search_by_national_id_men('1234567890');
SELECT * FROM search_by_national_id_women('2234567890');

-- Get all descendants
SELECT * FROM get_descendants(100);

-- Get all ancestors
SELECT * FROM get_ancestors(105);

-- Get siblings
SELECT * FROM get_siblings(105);
```

### 📊 Statistical Analysis
```sql
-- Generation statistics
SELECT مستوى_الجيل, COUNT(*) as عدد_الأشخاص
FROM عرض_الأشخاص_كامل 
GROUP BY مستوى_الجيل 
ORDER BY مستوى_الجيل;

-- Branch statistics
SELECT اسم_الفرع, COUNT(*) as عدد_الأشخاص
FROM عرض_الأشخاص_كامل 
GROUP BY اسم_الفرع;
```

## Technology Stack - التقنيات المستخدمة

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hook Form** for form management

### Backend
- **Supabase** (PostgreSQL with real-time features)
- **PostgreSQL ltree** extension for hierarchical data
- **Row Level Security (RLS)** for data protection
- **Automatic triggers** for data consistency

### Database Features
- **GIST indexes** for ltree performance
- **Composite indexes** for search optimization
- **Foreign key constraints** for data integrity
- **Check constraints** for data validation
- **Automatic timestamp updates**

## Installation & Setup - التثبيت والإعداد

### 1. Clone the Repository
```bash
git clone <repository-url>
cd arabic-family-tree
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase
1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/create_arabic_family_tree_system.sql`
3. Set up environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application
```bash
npm run dev
```

## Usage Examples - أمثلة الاستخدام

### Adding a Root Family
```typescript
await arabicFamilyService.addPerson({
  الاسم_الأول: 'آل عمير',
  is_root: true,
  تاريخ_الميلاد: '1800-01-01',
  معرف_الفرع: 1,
  رقم_هوية_وطنية: '1000000001'
});
```

### Adding Children
```typescript
await arabicFamilyService.addPerson({
  الاسم_الأول: 'محمد',
  father_id: 100,
  تاريخ_الميلاد: '1830-01-01',
  معرف_الفرع: 1,
  رقم_هوية_وطنية: '1234567890'
});
```

### Searching by National ID
```typescript
const results = await arabicFamilyService.searchByNationalIdMen('1234567890');
```

### Getting Family Statistics
```typescript
const stats = await arabicFamilyService.getFamilyStatistics();
console.log(`Total family members: ${stats.totalMen + stats.totalWomen}`);
```

## Performance Optimizations - تحسينات الأداء

### Database Indexes
- **GIST indexes** on ltree columns for fast hierarchical queries
- **Composite indexes** on frequently searched columns
- **Partial indexes** on non-null values only
- **Text search indexes** for Arabic name searches

### Query Optimizations
- **Materialized views** for complex aggregations
- **Efficient ltree operators** for ancestor/descendant queries
- **Prepared statements** for repeated queries
- **Connection pooling** for better resource management

## Security Features - مميزات الأمان

### Row Level Security (RLS)
- **Table-level security** enabled on all tables
- **Flexible policies** for different user roles
- **Audit trail** with automatic timestamps
- **Data validation** through check constraints

### Data Integrity
- **Foreign key constraints** prevent orphaned records
- **Check constraints** ensure valid data values
- **Unique constraints** prevent duplicate national IDs
- **Trigger-based validation** for complex business rules

## Contributing - المساهمة

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License - الترخيص

This project is licensed under the MIT License - see the LICENSE file for details.

## Support - الدعم

For support and questions, please open an issue on GitHub or contact the development team.

---

**نظام شجرة آل عمير** - حافظ على تراث قبيلتك للأجيال القادمة