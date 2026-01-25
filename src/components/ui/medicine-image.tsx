import { SafeImage } from './safe-image';
import { cn } from '@/lib/utils';

interface MedicineImageProps {
  imageUrl?: string;
  originalImageUrl?: string;
  name: string;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain';
}

/**
 * مكون لعرض صور الأدوية بشكل آمن
 */
export function MedicineImage({ 
  imageUrl, 
  originalImageUrl, 
  name, 
  className,
  containerClassName,
  objectFit = 'cover'
}: MedicineImageProps) {
  const src = imageUrl || originalImageUrl;
  
  return (
    <SafeImage
      src={src}
      alt={name}
      className={cn(
        'w-full h-full',
        objectFit === 'contain' ? 'object-contain' : 'object-cover',
        className
      )}
      containerClassName={containerClassName}
      fallbackMessage={src ? 'لا يمكن عرض صورة الدواء' : 'لا توجد صورة للدواء'}
    />
  );
}
