import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onSelectOption?: (option: AutocompleteOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Autocomplete({
  options,
  value = "",
  onValueChange,
  onSelectOption,
  placeholder = "اكتب...",
  className,
  disabled = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onValueChange?.(newValue);
  };

  const handleSelectOption = (option: AutocompleteOption) => {
    setInputValue(option.label);
    setIsOpen(false);
    onValueChange?.(option.label);
    onSelectOption?.(option);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={cn("font-cairo", className)}
        disabled={disabled}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelectOption(option)}
              className="px-3 py-2 cursor-pointer hover:bg-purple-50 font-cairo text-sm transition-colors"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
