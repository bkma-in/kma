import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: (CustomSelectOption<T> | string)[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  icon,
  className,
  buttonClassName,
  menuClassName,
  align = 'left',
  disabled = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to object format
  const normalizedOptions: CustomSelectOption<T>[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt as T, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left select-none", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer",
          isOpen && "border-black ring-2 ring-black/10 shadow-md",
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-zinc-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-black"
          )}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[200px] max-h-64 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 p-1.5 shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-150 focus:outline-none",
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          <div className="space-y-0.5">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between gap-3 transition-all cursor-pointer",
                    isSelected
                      ? "bg-zinc-900 text-white font-bold shadow-sm"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <span className={cn("shrink-0", isSelected ? "text-white" : "text-zinc-400")}>
                        {option.icon}
                      </span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {option.badge !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                          isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check size={14} className="text-white shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
