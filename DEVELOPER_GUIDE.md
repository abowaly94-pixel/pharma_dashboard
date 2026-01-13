# دليل المطور - PharmaNow Dashboard

## 🎨 نظام التصميم

### الألوان

```typescript
// الألوان الأساسية
const colors = {
  primary: 'hsl(160, 84%, 39%)',      // أخضر نعناعي
  accent: 'hsl(217, 91%, 60%)',       // أزرق سماوي
  success: 'hsl(142, 76%, 36%)',      // أخضر
  warning: 'hsl(38, 92%, 50%)',       // برتقالي
  destructive: 'hsl(0, 84%, 60%)',    // أحمر
}

// ألوان حالات الطلبات
const orderStatusColors = {
  pending: '#f59e0b',     // Amber 500
  confirmed: '#3b82f6',   // Blue 500
  delivered: '#10b981',   // Green 500
  cancelled: '#ef4444',   // Red 500
}
```

### التدرجات اللونية

```css
/* تدرج أساسي */
.gradient-primary {
  background: linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(180, 70%, 40%) 100%);
}

/* تدرج ثانوي */
.gradient-accent {
  background: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(230, 80%, 55%) 100%);
}

/* تدرج البطاقات */
.gradient-card {
  background: linear-gradient(180deg, hsl(0, 0%, 100%) 0%, hsl(150, 20%, 98%) 100%);
}
```

### الظلال

```css
/* ظل صغير */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* ظل متوسط */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

/* ظل كبير */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* ظل البطاقات */
--shadow-card: 0 4px 20px -4px rgba(16, 185, 129, 0.15);
```

---

## 🧩 المكونات

### StatCard

```typescript
import { StatCard } from '@/components/dashboard/StatCard';

<StatCard
  title="إجمالي الأدوية"
  value={45}
  icon={Pill}
  color="primary" // primary | accent | success | warning
  trend={{ value: 12, isPositive: true }}
  delay={0} // للتأثيرات الحركية
/>
```

### Charts

```typescript
import { SalesChart, OrderStatusChart } from '@/components/dashboard/Charts';

// رسم المبيعات
<SalesChart orders={orders} />

// رسم حالات الطلبات
<OrderStatusChart orders={orders} />
```

### Tables

```typescript
// جدول آخر الطلبات
<RecentOrdersTable 
  orders={orders} 
  onViewOrder={(order) => console.log(order)}
/>

// جدول المستخدمين
<AllUsersTable users={users} />

// جدول الأدوية
<AllMedicinesTable medicines={medicines} />

// جدول جميع الطلبات
<AllOrdersTable orders={orders} />
```

---

## 🎭 التأثيرات الحركية

### Framer Motion

```typescript
import { motion } from 'framer-motion';

// تأثير Fade In
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  المحتوى
</motion.div>

// تأثير Slide Up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
  المحتوى
</motion.div>

// تأثير Scale
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  whileHover={{ scale: 1.05 }}
>
  المحتوى
</motion.div>
```

### CSS Animations

```css
/* Fade In */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Slide Up */
.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

/* Scale In */
.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}

/* Shimmer */
.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

---

## 🎨 Utility Classes

### Glass Effect

```html
<div class="glass-effect">
  <!-- bg-white/80 backdrop-blur-xl border border-white/20 -->
</div>
```

### Gradient Text

```html
<h1 class="gradient-text">
  <!-- bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent -->
</h1>
```

### Hover Lift

```html
<div class="hover-lift">
  <!-- transition-all duration-300 hover:-translate-y-1 hover:shadow-xl -->
</div>
```

### Custom Scrollbar

```html
<div class="custom-scrollbar overflow-auto">
  <!-- محتوى قابل للتمرير -->
</div>
```

---

## 📊 الرسوم البيانية

### تخصيص Recharts

```typescript
// الألوان
const COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444'
};

// التسميات
const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي'
};

// Custom Label للرسم الدائري
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
```

---

## 🎯 أفضل الممارسات

### 1. التأثيرات الحركية

```typescript
// ✅ جيد - تأخير تدريجي
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {item.content}
  </motion.div>
))}

// ❌ سيء - نفس التوقيت للجميع
{items.map((item) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {item.content}
  </motion.div>
))}
```

### 2. الألوان

```typescript
// ✅ جيد - استخدام متغيرات CSS
className="bg-primary text-primary-foreground"

// ❌ سيء - ألوان مباشرة
className="bg-[#10b981] text-white"
```

### 3. الحالات الفارغة

```typescript
// ✅ جيد - رسالة ودية
if (items.length === 0) {
  return (
    <div className="text-center p-12">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-xl font-bold mb-2">لا توجد عناصر</h3>
      <p className="text-gray-500">سيتم عرض العناصر هنا</p>
    </div>
  );
}

// ❌ سيء - لا شيء
if (items.length === 0) {
  return null;
}
```

### 4. التجاوب

```typescript
// ✅ جيد - تصميم متجاوب
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// ❌ سيء - تصميم ثابت
<div className="grid grid-cols-4 gap-6">
```

---

## 🔧 الأدوات المساعدة

### تصحيح الأخطاء

```typescript
// استخدم getDiagnostics للتحقق من الأخطاء
import { getDiagnostics } from '@/tools';

getDiagnostics(['src/components/MyComponent.tsx']);
```

### اختبار الأداء

```typescript
// استخدم React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

---

## 📦 البنية

```
src/
├── components/
│   ├── dashboard/
│   │   ├── StatCard.tsx          # بطاقات الإحصائيات
│   │   ├── Charts.tsx            # الرسوم البيانية
│   │   ├── RecentOrdersTable.tsx # جدول آخر الطلبات
│   │   ├── AllUsersTable.tsx     # جدول المستخدمين
│   │   ├── AllMedicinesTable.tsx # جدول الأدوية
│   │   └── AllOrdersTable.tsx    # جدول جميع الطلبات
│   ├── layout/
│   │   └── DashboardLayout.tsx   # تخطيط اللوحة
│   └── ui/                       # مكونات UI الأساسية
├── pages/
│   ├── LoginPage.tsx             # صفحة تسجيل الدخول
│   └── admin/
│       └── AdminDashboard.tsx    # لوحة تحكم المدير
├── hooks/                        # Custom Hooks
├── contexts/                     # React Contexts
├── types/                        # TypeScript Types
└── index.css                     # الأنماط العامة
```

---

## 🚀 نصائح للأداء

### 1. استخدم memo للمكونات الثقيلة

```typescript
import { memo } from 'react';

export const HeavyComponent = memo(({ data }) => {
  // ...
});
```

### 2. استخدم useMemo للحسابات المعقدة

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 3. استخدم lazy loading للصفحات

```typescript
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
```

---

## 📚 موارد إضافية

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Recharts Docs](https://recharts.org/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

تم إعداده بواسطة Kiro AI 🤖
