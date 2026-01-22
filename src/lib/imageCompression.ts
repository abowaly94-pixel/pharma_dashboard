/**
 * Image Compression Utility
 * يقلل حجم الصور قبل رفعها على Supabase
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 1, // 1MB max
};

/**
 * ضغط الصورة باستخدام Canvas API
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const isPNG = file.type === 'image/png';
  
  // إذا الملف أصغر من الحد المطلوب وليس PNG، نرجعه كما هو
  if (!isPNG && file.size <= (opts.maxSizeMB! * 1024 * 1024)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        let { width, height } = img;
        
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(
            opts.maxWidth! / width,
            opts.maxHeight! / height
          );
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // إنشاء Canvas للضغط
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // مسح Canvas للحفاظ على الشفافية
        ctx.clearRect(0, 0, width, height);

        // رسم الصورة بالأبعاد الجديدة (مع الحفاظ على الشفافية)
        ctx.drawImage(img, 0, 0, width, height);

        // للصور PNG، نحتفظ بـ PNG للحفاظ على الشفافية
        // لكن نقلل الجودة للضغط
        const outputType = isPNG ? 'image/png' : (file.type || 'image/jpeg');
        const outputQuality = isPNG ? 0.95 : (opts.quality || 0.85);

        // تحويل Canvas إلى Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // تحديد اسم الملف
            const extension = isPNG ? '.png' : '.jpg';
            const newFileName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, extension);

            // إنشاء File جديد من الـ Blob
            const compressedFile = new File(
              [blob],
              newFileName,
              {
                type: outputType,
                lastModified: Date.now(),
              }
            );

            // إذا الضغط زاد الحجم، نرجع الملف الأصلي
            if (compressedFile.size >= file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          outputType,
          outputQuality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * ضغط عدة صور دفعة واحدة
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(
    files.map(file => compressImage(file, options))
  );
}

/**
 * التحقق من نوع الملف
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * تحويل حجم الملف إلى نص قابل للقراءة
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * معاينة الصورة قبل الرفع
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
