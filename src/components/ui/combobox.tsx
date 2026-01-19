import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyText = "لا توجد نتائج",
  className,
  disabled = false,
  allowCustomValue = false,
}: ComboboxProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (newValue: string) => {
    setSearchQuery(newValue);
    if (allowCustomValue && onValueChange) {
      onValueChange(newValue);
    }
  };

  const handleSelectOption = (optionValue: string) => {
    if (onValueChange) {
      onValueChange(optionValue);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <Select 
      value={allowCustomValue ? undefined : value} 
      onValueChange={handleSelectOption} 
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={cn("font-cairo", className)}>
        <SelectValue placeholder={value || placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="flex items-center border-b px-3 pb-2">
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-cairo"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm font-cairo text-muted-foreground">
            {allowCustomValue && searchQuery ? (
              <div className="space-y-2">
                <p>{emptyText}</p>
                <p className="text-xs text-green-600">✓ سيتم استخدام: "{searchQuery}"</p>
              </div>
            ) : (
              emptyText
            )}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="font-cairo">
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
