import { ImageOff, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  message?: string;
  className?: string;
  showUploadIcon?: boolean;
}

/**
 * عنصر لعرض رسالة بدلاً من الصور غير المسموحة (data URLs)
 */
export function ImagePlaceholder({ 
  message = 'الصورة غير متاحة للعرض', 
  className,
  showUploadIcon = false 
}: ImagePlaceholderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3 bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 w-full h-full",
        className
      )}
    >
      {showUploadIcon ? (
        <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/40 flex-shrink-0" />
      ) : (
        <ImageOff className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/40 flex-shrink-0" />
      )}
      <p className="text-xs sm:text-sm text-muted-foreground text-center font-cairo leading-tight">
        {message}
      </p>
    </div>
  );
}
