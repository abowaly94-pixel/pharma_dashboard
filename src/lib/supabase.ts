import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (prevents app crash)
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a minimal client that won't crash the app
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @returns Promise<{success: boolean, url?: string, error?: string}> - Result with URL if successful
 */
export async function uploadImageToSupabase(file: File): Promise<{success: boolean, url?: string, error?: string}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase غير مُعد. يرجى إضافة متغيرات البيئة.' };
  }
  
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WEBP, GIF)' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `medicine_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `processed_images/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('Medicines_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Medicines_images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء رفع الصورة' };
  }
}

/**
 * Remove background from image using remove.bg API
 * @param imageUrl - URL of the image or File object
 * @returns Promise<{success: boolean, blob?: Blob, error?: string}>
 */
export async function removeImageBackground(imageUrl: string | File): Promise<{success: boolean, blob?: Blob, error?: string}> {
  try {
    // Try to get API key from database first, fallback to env variable
    let apiKey = import.meta.env.VITE_REMOVEBG_API_KEY;
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      const apiKeysDoc = await getDoc(apiKeysRef);
      
      if (apiKeysDoc.exists()) {
        const data = apiKeysDoc.data();
        if (data?.removeBgApiKey && data.removeBgApiKey.trim()) {
          apiKey = data.removeBgApiKey.trim();
        }
      }
    } catch (dbError) {
      // Silently fail and use env variable
    }
    
    if (!apiKey) {
      return { success: false, error: 'مفتاح API غير موجود. يرجى إضافة مفتاح Remove.bg API في الإعدادات' };
    }

    const formData = new FormData();
    
    if (typeof imageUrl === 'string') {
      formData.append('image_url', imageUrl);
    } else {
      formData.append('image_file', imageUrl);
    }
    
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {
        // Ignore parse errors
      }
      
      let errorMessage = `خطأ في API: ${response.status}`;
      
      if (response.status === 402) {
        errorMessage = 'انتهت الحصة المجانية لهذا الشهر. يرجى تحديث مفتاح API أو الانتظار للشهر القادم';
      } else if (response.status === 403) {
        errorMessage = 'مفتاح API غير صحيح. يرجى التحقق من المفتاح في الإعدادات';
      } else if (response.status === 400) {
        errorMessage = 'الصورة غير صحيحة أو بصيغة غير مدعومة';
      } else if (response.status === 429) {
        errorMessage = 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً';
      } else if ((errorData as any)?.errors?.[0]?.title) {
        errorMessage = (errorData as any).errors[0].title;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    const blob = await response.blob();
    return { success: true, blob };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء إزالة الخلفية' };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The full URL of the image to delete
 * @returns Promise<{success: boolean, error?: string}> - Result of deletion
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<{success: boolean, error?: string}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase غير مُعد. يرجى إضافة متغيرات البيئة.' };
  }
  
  if (!imageUrl) {
    return { success: false, error: 'No image URL provided' };
  }

  try {
    // Extract the file path from the URL
    // URL format: https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicines_images/processed_images/filename.png
    const urlParts = imageUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid Supabase URL format' };
    }

    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0]; // e.g., "Medicines_images"
    const filePath = pathParts.slice(1).join('/'); // e.g., "processed_images/filename.png"

    // Validate bucket name
    if (bucketName !== 'Medicines_images') {
      return { success: false, error: `Invalid bucket name: ${bucketName}` };
    }

    if (!filePath) {
      return { success: false, error: 'Invalid file path extracted from URL' };
    }

    // Try Method 1: Delete with the extracted path
    let { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    // If first method fails and path doesn't start with processed_images, try adding it
    if (error && !filePath.startsWith('processed_images/')) {
      const alternativePath = `processed_images/${filePath}`;
      
      const result2 = await supabase.storage
        .from(bucketName)
        .remove([alternativePath]);
      
      error = result2.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
