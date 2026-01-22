# 📸 دليل ضغط الصور قبل الرفع

## 🎯 لماذا نضغط الصور؟

### الفوائد:
- ✅ **توفير Bandwidth**: تقليل استهلاك الإنترنت
- ✅ **رفع أسرع**: الصور الأصغر تُرفع بسرعة أكبر
- ✅ **توفير التخزين**: تقليل تكلفة Supabase Storage
- ✅ **تحسين الأداء**: تحميل أسرع للصور في التطبيق
- ✅ **تجربة أفضل**: خاصة على الإنترنت البطيء

### مثال واقعي:
```
صورة أصلية: 5.2 MB
بعد الضغط: 850 KB
التوفير: 84% 🎉
```

---

## 🚀 كيفية الاستخدام

### 1. الاستخدام الأساسي

```typescript
import { compressImage } from '@/lib/imageCompression';

// عند اختيار صورة
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ضغط الصورة
  const compressedFile = await compressImage(file);
  
  // الآن ارفع الصورة المضغوطة
  await uploadToSupabase(compressedFile);
};
```

### 2. مع خيارات مخصصة

```typescript
const compressedFile = await compressImage(file, {
  maxWidth: 1920,      // أقصى عرض
  maxHeight: 1920,     // أقصى ارتفاع
  quality: 0.8,        // جودة الصورة (0.1 - 1.0)
  maxSizeMB: 1,        // أقصى حجم بالميجابايت
});
```

### 3. ضغط عدة صور

```typescript
import { compressImages } from '@/lib/imageCompression';

const files = Array.from(e.target.files);
const compressedFiles = await compressImages(files, {
  quality: 0.7,
  maxSizeMB: 0.5,
});
```

---

## 📱 التطبيق في Mobile App

### للـ React Native / Flutter:

#### React Native مع expo-image-manipulator:

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string) {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }], // يحافظ على النسبة
    { 
      compress: 0.8,  // جودة 80%
      format: ImageManipulator.SaveFormat.JPEG 
    }
  );
  
  return manipResult.uri;
}
```

#### Flutter مع flutter_image_compress:

```dart
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<File?> compressImage(File file) async {
  final result = await FlutterImageCompress.compressAndGetFile(
    file.absolute.path,
    '${file.path}_compressed.jpg',
    quality: 80,
    minWidth: 1920,
    minHeight: 1920,
  );
  
  return result;
}
```

---

## 🔧 دمجها في الكود الحالي

### مثال: رفع وصفة طبية

```typescript
import { compressImage } from '@/lib/imageCompression';
import { supabase } from '@/lib/supabase';

async function uploadPrescription(file: File, orderId: string) {
  try {
    // 1. ضغط الصورة أولاً
    const compressedFile = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      maxSizeMB: 1,
    });

    // 2. رفع الصورة المضغوطة
    const fileName = `prescriptions/${orderId}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, compressedFile);

    if (error) throw error;

    // 3. الحصول على الرابط
    const { data: urlData } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading prescription:', error);
    throw error;
  }
}
```

### مثال: رفع إيصال دفع

```typescript
async function uploadPaymentProof(file: File, orderId: string) {
  // نفس الطريقة
  const compressedFile = await compressImage(file, {
    quality: 0.8,
    maxSizeMB: 0.5, // إيصالات الدفع ممكن تكون أصغر
  });

  const fileName = `payment-proofs/${orderId}_${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, compressedFile);

  // ... باقي الكود
}
```

---

## 🎨 إضافة UI للمستخدم

### عرض معلومات الضغط:

```typescript
import { formatFileSize } from '@/lib/imageCompression';

function ImageUploadPreview({ original, compressed }: Props) {
  const savings = original.size - compressed.size;
  const percentage = Math.round((savings / original.size) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>الحجم الأصلي:</span>
        <span className="text-red-600">{formatFileSize(original.size)}</span>
      </div>
      <div className="flex justify-between">
        <span>بعد الضغط:</span>
        <span className="text-green-600">{formatFileSize(compressed.size)}</span>
      </div>
      <div className="p-2 bg-green-50 rounded">
        <span className="text-green-700 font-medium">
          تم توفير {formatFileSize(savings)} ({percentage}%)
        </span>
      </div>
    </div>
  );
}
```

---

## ⚙️ الإعدادات الموصى بها

### للوصفات الطبية:
```typescript
{
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,      // جودة عالية للوضوح
  maxSizeMB: 1,
}
```

### لإيصالات الدفع:
```typescript
{
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
  maxSizeMB: 0.5,
}
```

### لصور الأدوية:
```typescript
{
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.75,
  maxSizeMB: 0.3,
}
```

---

## 🧪 اختبار الضغط

### في المتصفح:

1. افتح `src/examples/ImageUploadExample.tsx`
2. جرب رفع صور مختلفة
3. شاهد الفرق في الحجم

### في Mobile App:

```typescript
// اختبار بسيط
const testCompression = async () => {
  const file = await pickImage();
  console.log('Original size:', file.size);
  
  const compressed = await compressImage(file);
  console.log('Compressed size:', compressed.size);
  console.log('Savings:', ((1 - compressed.size / file.size) * 100).toFixed(1) + '%');
};
```

---

## 📊 مقارنة الأداء

### قبل الضغط:
```
صورة 1: 4.2 MB → رفع: 8 ثواني
صورة 2: 6.8 MB → رفع: 12 ثانية
صورة 3: 3.1 MB → رفع: 6 ثواني
المجموع: 14.1 MB → 26 ثانية
```

### بعد الضغط:
```
صورة 1: 680 KB → رفع: 1.5 ثانية
صورة 2: 920 KB → رفع: 2 ثانية
صورة 3: 540 KB → رفع: 1 ثانية
المجموع: 2.1 MB → 4.5 ثانية
```

**التحسين: 85% أسرع! 🚀**

---

## ⚠️ ملاحظات مهمة

1. **الجودة**: لا تقلل الجودة عن 0.7 للوصفات الطبية
2. **الأبعاد**: احتفظ بأبعاد معقولة للوضوح
3. **النوع**: JPEG أفضل للصور، PNG للشفافية
4. **التخزين المؤقت**: احذف الصور المؤقتة بعد الرفع
5. **معالجة الأخطاء**: تأكد من معالجة أخطاء الضغط

---

## 🔍 استكشاف الأخطاء

### المشكلة: الصورة مشوشة بعد الضغط
**الحل**: زود الـ quality إلى 0.9 أو أكثر

### المشكلة: الضغط بطيء
**الحل**: قلل الـ maxWidth و maxHeight

### المشكلة: الحجم لسه كبير
**الحل**: قلل الـ quality أو maxSizeMB

---

## 📚 موارد إضافية

- [Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

---

## ✅ الخطوات التالية

1. ✅ أضف الضغط لرفع الوصفات
2. ✅ أضف الضغط لرفع إيصالات الدفع
3. ✅ أضف الضغط لصور الأدوية
4. ✅ اختبر على أجهزة مختلفة
5. ✅ راقب التوفير في التخزين

---

**تم إنشاء هذا الدليل بواسطة Kiro 🤖**
