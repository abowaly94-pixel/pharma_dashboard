import { useState } from 'react';
import { ImagePlaceholder } from './image-placeholder';
import { cn } from '@/lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackMessage?: string;
  containerClassName?: string;
  isAvatar?: boolean;
  compact?: boolean;
  showFallbackText?: boolean;
}

/**
 * مكون آمن لعرض الصور - يمنع عرض data URLs ويعرض رسالة أو رمز تعويضي بدلاً منها
 */
export function SafeImage({ 
  src, 
  alt, 
  fallbackMessage = '',
  className,
  containerClassName,
  isAvatar = false,
  compact = false,
  showFallbackText = false,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // التحقق من أن الـ URL ليس data URL أو نص غير صالي
  const isDataUrl = src?.startsWith('data:');
  const isValidUrl = Boolean(src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('blob:')));
  const shouldShowPlaceholder = !src || isDataUrl || !isValidUrl || hasError;

  if (shouldShowPlaceholder) {
    return (
      <ImagePlaceholder 
        message={showFallbackText ? (isDataUrl ? 'الصور المحلية غير مسموحة' : fallbackMessage) : ''}
        className={cn('w-full h-full overflow-hidden shrink-0', containerClassName, className)}
        showUploadIcon={!src && !isAvatar}
        isAvatar={isAvatar}
        compact={compact}
        showText={showFallbackText && !isAvatar && !compact}
      />
    );
  }

  return (
    <img
      src={src}
      alt={isAvatar ? '' : alt}
      className={cn('w-full h-full object-cover', className)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

