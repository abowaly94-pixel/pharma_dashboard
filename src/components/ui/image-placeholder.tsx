import { ImageOff, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  message?: string;
  className?: string;
  showUploadIcon?: boolean;
  isAvatar?: boolean;
  compact?: boolean;
  showText?: boolean;
}

/**
 * عنصر لعرض رسالة بدلاً من الصور غير المسموحة (data URLs) أو غير المتاحة
 */
export function ImagePlaceholder({ 
  message = 'الصورة غير متاحة للعرض', 
  className,
  showUploadIcon = false,
  isAvatar = false,
  compact = false,
  showText = true,
}: ImagePlaceholderProps) {
  if (isAvatar) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-indigo-50/90 text-indigo-400 border border-indigo-100 rounded-2xl w-full h-full overflow-hidden shrink-0 select-none",
          className
        )}
        title={message}
      >
        <User className="w-1/2 h-1/2 min-w-[16px] min-h-[16px] max-w-[36px] max-h-[36px] text-indigo-500/70" />
      </div>
    );
  }

  const shouldDisplayMessage = showText && !compact;

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg p-2 w-full h-full min-w-0 min-h-0 overflow-hidden select-none",
        className
      )}
      title={message}
    >
      {showUploadIcon ? (
        <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/40 shrink-0" />
      ) : (
        <ImageOff className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/40 shrink-0" />
      )}
      {shouldDisplayMessage && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center font-cairo leading-tight line-clamp-2 px-1 break-words">
          {message}
        </p>
      )}
    </div>
  );
}

