/**
 * مثال على استخدام ضغط الصور قبل الرفع
 */

import { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { compressImage, formatFileSize, createImagePreview } from '@/lib/imageCompression';
import { supabase } from '@/lib/supabase';

export function ImageUploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // إنشاء معاينة
    const previewUrl = await createImagePreview(file);
    setPreview(previewUrl);

    // ضغط الصورة
    const compressed = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      maxSizeMB: 1,
    });
    
    setCompressedFile(compressed);
  };

  const handleUpload = async () => {
    if (!compressedFile) return;

    setUploading(true);
    try {
      // رفع الصورة المضغوطة على Supabase
      const fileName = `${Date.now()}_${compressedFile.name}`;
      const { data, error } = await supabase.storage
        .from('prescriptions') // أو أي bucket تستخدمه
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(data.path);

      setUploadedUrl(urlData.publicUrl);
      alert('تم رفع الصورة بنجاح!');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold font-cairo">رفع صورة مع الضغط</h2>

      {/* File Input */}
      <Card>
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="mb-2 text-sm text-muted-foreground font-cairo">
                <span className="font-semibold">اضغط لاختيار صورة</span> أو اسحبها هنا
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </label>
        </CardContent>
      </Card>

      {/* Preview & Stats */}
      {selectedFile && compressedFile && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Image Preview */}
            {preview && (
              <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Compression Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الحجم الأصلي</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">بعد الضغط</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatFileSize(compressedFile.size)}
                </p>
              </div>
            </div>

            {/* Savings */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  تم توفير {formatFileSize(selectedFile.size - compressedFile.size)}
                  {' '}
                  ({Math.round((1 - compressedFile.size / selectedFile.size) * 100)}%)
                </span>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'جاري الرفع...' : 'رفع الصورة'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {uploadedUrl && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <p className="font-medium text-green-900">تم رفع الصورة بنجاح!</p>
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:underline break-all"
                >
                  {uploadedUrl}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
