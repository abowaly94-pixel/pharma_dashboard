import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MedicineCategory } from '@/types';
import { getAllCategories } from '@/services/categoryService';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = 'اختر التصنيف...',
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCategories(true); // جلب التصنيفات النشطة فقط
      console.log('📦 Categories loaded:', data);
      console.log('📦 Categories count:', data.length);
      if (data.length === 0) {
        console.warn('⚠️ No active categories found in database!');
      }
      setCategories(data);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between font-cairo h-10',
            !value && 'text-muted-foreground',
            required && !value && 'border-red-300 focus:border-red-500'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التحميل...
            </span>
          ) : selectedCategory ? (
            <span>{selectedCategory.name}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="font-cairo">
          <CommandInput placeholder="ابحث عن تصنيف..." className="font-cairo" />
          <CommandEmpty className="py-6 text-center text-sm font-cairo">
            {categories.length === 0 ? (
              <div className="space-y-3 px-4">
                <p className="text-red-600 font-bold text-base">⚠️ لا توجد تصنيفات متاحة</p>
                <p className="text-sm text-gray-600">
                  يجب على الأدمن إضافة تصنيفات أولاً من صفحة:
                </p>
                <p className="text-sm font-semibold text-primary">
                  إدارة التصنيفات → إضافة تصنيفات افتراضية
                </p>
              </div>
            ) : (
              'لم يتم العثور على تصنيف'
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                value={category.name}
                onSelect={() => {
                  onChange(category.id === value ? '' : category.id);
                  setOpen(false);
                }}
                className="font-cairo cursor-pointer"
              >
                <Check
                  className={cn(
                    'ml-2 h-4 w-4',
                    value === category.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span>{category.name}</span>
                  <span className="text-xs text-gray-500">{category.nameEn}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
