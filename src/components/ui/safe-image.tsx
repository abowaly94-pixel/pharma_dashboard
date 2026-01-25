import { useState } from 'react';
import { ImagePlaceholder } from './image-placeholder';
import { cn } from '@/lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackMessage?: string;
  containerClassName?: string;
}

/**
 * مكون آمن لعرض الصور - يمنع عرض data URLs ويعرض رسالة بدلاً منها
 */
export function SafeImage({ 
  src, 
  alt, 
  fallbackMessage = 'لا يمكن عرض هذه الصورة. يرجى رفع الصورة على السيرفر أولاً.',
  className,
  containerClassName,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // التحقق من أن الـ URL ليس data URL
  const isDataUrl = src?.startsWith('data:');
  const shouldShowPlaceholder = !src || isDataUrl || hasError;

  if (shouldShowPlaceholder) {
    return (
      <ImagePlaceholder 
        message={isDataUrl ? 'الصور المحلية غير مسموحة. يرجى رفع الصورة أولاً.' : fallbackMessage}
        className={cn('w-full h-full', containerClassName, className)}
        showUploadIcon={!src}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-full h-full object-cover', className)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
