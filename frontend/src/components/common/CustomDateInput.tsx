import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CustomDateInputProps {
  value: string; // ISO format 'YYYY-MM-DD'
  onChange: (val: string) => void; // Called with 'YYYY-MM-DD'
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  value,
  onChange,
  required = false,
  className,
  placeholder = 'dd/mm/yyyy'
}) => {
  const nativeRef = useRef<HTMLInputElement>(null);

  // Convert stored ISO 'YYYY-MM-DD' -> Display 'DD/MM/YYYY'
  const getDisplayValue = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Convert typed text 'DD/MM/YYYY' -> ISO 'YYYY-MM-DD'
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const cleaned = text.replace(/[^0-9/]/g, '');

    const parts = cleaned.split('/');
    if (parts.length === 3 && parts[2].length === 4 && parts[1].length >= 1 && parts[0].length >= 1) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const testDate = new Date(`${year}-${month}-${day}`);
      if (!isNaN(testDate.getTime())) {
        onChange(`${year}-${month}-${day}`);
        return;
      }
    }
    if (cleaned === '') {
      onChange('');
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const openDatePicker = () => {
    if (nativeRef.current) {
      if (typeof nativeRef.current.showPicker === 'function') {
        try {
          nativeRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      nativeRef.current.focus();
      nativeRef.current.click();
    }
  };

  const displayVal = getDisplayValue(value);

  return (
    <div className="relative w-full flex items-center">
      <input
        type="text"
        required={required}
        value={displayVal}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 pr-10 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none shadow-sm transition-all font-mono placeholder:font-mono placeholder:text-zinc-400",
          className
        )}
      />
      <button
        type="button"
        onClick={openDatePicker}
        className="absolute right-3 text-zinc-400 hover:text-black transition-colors cursor-pointer p-1 rounded-md hover:bg-zinc-100"
        title="Open Date Picker"
        tabIndex={-1}
      >
        <Calendar size={16} />
      </button>

      {/* Hidden native date input for date picker popup */}
      <input
        ref={nativeRef}
        type="date"
        value={value || ''}
        onChange={handleNativeChange}
        tabIndex={-1}
        className="sr-only opacity-0 absolute pointer-events-none w-0 h-0"
      />
    </div>
  );
};
