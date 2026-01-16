import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (prevents app crash)
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables. Image features will not work.');
    // Return a minimal client that won't crash the app
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The full URL of the image to delete
 * @returns Promise<{success: boolean, error?: string}> - Result of deletion
 */
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
    console.log('📤 Starting image upload process...');
    console.log('  File name:', file.name);
    console.log('  File size:', file.size);
    console.log('  File type:', file.type);

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

    console.log('📦 Upload details:');
    console.log('  Bucket: Medicines_images');
    console.log('  Path:', filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('Medicines_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Medicines_images')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('❌ Exception in uploadImageToSupabase:', error);
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
    const apiKey = import.meta.env.VITE_REMOVEBG_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: 'مفتاح API غير موجود. يرجى إضافة VITE_REMOVEBG_API_KEY في ملف .env.local' };
    }

    console.log('🎨 Starting background removal...');
    
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
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Remove.bg API error:', errorData);
      return { 
        success: false, 
        error: errorData.errors?.[0]?.title || `خطأ في API: ${response.status}` 
      };
    }

    const blob = await response.blob();
    console.log('✅ Background removed successfully');
    
    return { success: true, blob };
  } catch (error: any) {
    console.error('❌ Exception in removeImageBackground:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء إزالة الخلفية' };
  }
}

export async function deleteImageFromSupabase(imageUrl: string): Promise<{success: boolean, error?: string}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase غير مُعد. يرجى إضافة متغيرات البيئة.' };
  }
  
  if (!imageUrl) {
    return { success: false, error: 'No image URL provided' };
  }

  try {
    console.log('🔍 Starting image deletion process...');
    console.log('  Full URL:', imageUrl);

    // Extract the file path from the URL
    // URL format: https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicines_images/processed_images/filename.png
    const urlParts = imageUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      const error = 'Invalid Supabase URL format';
      console.error('❌', error);
      console.error('  Expected format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]');
      console.error('  Received URL:', imageUrl);
      return { success: false, error };
    }

    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0]; // e.g., "Medicines_images"
    const filePath = pathParts.slice(1).join('/'); // e.g., "processed_images/filename.png"

    console.log('📦 Extracted information:');
    console.log('  Full URL:', imageUrl);
    console.log('  After split:', urlParts[1]);
    console.log('  Bucket:', bucketName);
    console.log('  File Path:', filePath);
    console.log('  Expected: processed_images/[filename].png');

    // Validate bucket name
    if (bucketName !== 'Medicines_images') {
      const error = `Invalid bucket name: ${bucketName}. Expected: Medicines_images`;
      console.error('❌', error);
      return { success: false, error };
    }

    if (!filePath) {
      const error = 'Invalid file path extracted from URL';
      console.error('❌', error);
      return { success: false, error };
    }

    console.log('🗑️ Attempting to delete from Supabase Storage...');
    console.log('  Using bucket:', bucketName);
    console.log('  Using path:', filePath);

    // Try Method 1: Delete with the extracted path
    let { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    console.log('📤 Supabase response received (Method 1)');
    console.log('  Error:', error);
    console.log('  Data:', data);

    // If first method fails and path doesn't start with processed_images, try adding it
    if (error && !filePath.startsWith('processed_images/')) {
      console.log('⚠️ First attempt failed, trying with processed_images/ prefix...');
      const alternativePath = `processed_images/${filePath}`;
      console.log('  Alternative path:', alternativePath);
      
      const result2 = await supabase.storage
        .from(bucketName)
        .remove([alternativePath]);
      
      data = result2.data;
      error = result2.error;
      
      console.log('📤 Supabase response received (Method 2)');
      console.log('  Error:', error);
      console.log('  Data:', data);
    }

    if (error) {
      console.error('❌ Supabase Storage Error:', error);
      console.error('  Error message:', error.message);
      console.error('  Error details:', JSON.stringify(error, null, 2));
      console.error('  💡 Possible causes:');
      console.error('     1. RLS policies preventing deletion');
      console.error('     2. File does not exist at path:', filePath);
      console.error('     3. Insufficient permissions with anon key');
      console.error('     4. Bucket is read-only');
      return { success: false, error: error.message };
    }

    console.log('✅ Delete operation completed');
    console.log('  Response data:', JSON.stringify(data, null, 2));
    
    // Check if file was actually deleted
    if (data && data.length > 0) {
      console.log('✅ Image deleted successfully from Supabase Storage');
      console.log('  Deleted files:', data);
      return { success: true };
    } else {
      const errorMsg = 'No files were deleted - file may not exist';
      console.warn('⚠️', errorMsg);
      console.warn('  This could mean:');
      console.warn('  1. File does not exist at path:', filePath);
      console.warn('  2. Insufficient permissions to delete');
      console.warn('  3. Bucket policies preventing deletion');
      console.warn('  💡 Check Supabase Dashboard → Storage → Medicines_images → Policies');
      return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    console.error('❌ Exception in deleteImageFromSupabase:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
