'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BirthdatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  required?: boolean;
  className?: string;
}

export function BirthdatePicker({
  value,
  onChange,
  minYear = 1940,
  maxYear = new Date().getFullYear() - 18, // Default to 18 years ago
  required = false,
  className,
}: BirthdatePickerProps) {
  // Parse current value
  const [selectedYear, selectedMonth, selectedDay] = useMemo(() => {
    if (!value) return ['', '', ''];
    const [y, m, d] = value.split('-');
    return [y || '', m || '', d || ''];
  }, [value]);

  // Generate year options (descending order for easier selection)
  const yearOptions = useMemo(() => {
    const years: { value: string; label: string }[] = [{ value: '', label: '年' }];
    for (let y = maxYear; y >= minYear; y--) {
      years.push({ value: String(y), label: `${y}年` });
    }
    return years;
  }, [minYear, maxYear]);

  // Generate month options
  const monthOptions = useMemo(() => {
    const months: { value: string; label: string }[] = [{ value: '', label: '月' }];
    for (let m = 1; m <= 12; m++) {
      months.push({ value: String(m).padStart(2, '0'), label: `${m}月` });
    }
    return months;
  }, []);

  // Generate day options based on selected year and month
  const dayOptions = useMemo(() => {
    const days: { value: string; label: string }[] = [{ value: '', label: '日' }];

    if (!selectedYear || !selectedMonth) {
      // If no year/month selected, show all 31 days
      for (let d = 1; d <= 31; d++) {
        days.push({ value: String(d).padStart(2, '0'), label: `${d}日` });
      }
    } else {
      // Calculate correct number of days for the month
      const daysInMonth = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        days.push({ value: String(d).padStart(2, '0'), label: `${d}日` });
      }
    }

    return days;
  }, [selectedYear, selectedMonth]);

  // Handle year change
  const handleYearChange = useCallback((year: string) => {
    if (!year) {
      onChange('');
      return;
    }

    // Keep month and day if they're still valid
    const month = selectedMonth;
    let day = selectedDay;

    // Validate day for new year/month combination
    if (month && day) {
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      if (Number(day) > daysInMonth) {
        day = String(daysInMonth).padStart(2, '0');
      }
    }

    if (month && day) {
      onChange(`${year}-${month}-${day}`);
    } else if (month) {
      onChange(`${year}-${month}-`);
    } else {
      onChange(`${year}--`);
    }
  }, [selectedMonth, selectedDay, onChange]);

  // Handle month change
  const handleMonthChange = useCallback((month: string) => {
    if (!selectedYear) return;

    if (!month) {
      onChange(`${selectedYear}--`);
      return;
    }

    // Validate day for new month
    let day = selectedDay;
    if (day) {
      const daysInMonth = new Date(Number(selectedYear), Number(month), 0).getDate();
      if (Number(day) > daysInMonth) {
        day = String(daysInMonth).padStart(2, '0');
      }
    }

    if (day) {
      onChange(`${selectedYear}-${month}-${day}`);
    } else {
      onChange(`${selectedYear}-${month}-`);
    }
  }, [selectedYear, selectedDay, onChange]);

  // Handle day change
  const handleDayChange = useCallback((day: string) => {
    if (!selectedYear || !selectedMonth) return;

    if (!day) {
      onChange(`${selectedYear}-${selectedMonth}-`);
      return;
    }

    onChange(`${selectedYear}-${selectedMonth}-${day}`);
  }, [selectedYear, selectedMonth, onChange]);

  const selectClassName = cn(
    'flex-1 min-w-0 px-3 py-3 rounded-xl border border-neutral-200',
    'focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 outline-none',
    'transition-all bg-white text-neutral-900',
    'appearance-none cursor-pointer'
  );

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Year Select - Primary, shown first */}
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        required={required}
        className={cn(selectClassName, 'flex-[1.2]')}
        aria-label="年"
      >
        {yearOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Month Select */}
      <select
        value={selectedMonth}
        onChange={(e) => handleMonthChange(e.target.value)}
        required={required}
        disabled={!selectedYear}
        className={cn(
          selectClassName,
          !selectedYear && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="月"
      >
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Day Select */}
      <select
        value={selectedDay}
        onChange={(e) => handleDayChange(e.target.value)}
        required={required}
        disabled={!selectedYear || !selectedMonth}
        className={cn(
          selectClassName,
          (!selectedYear || !selectedMonth) && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="日"
      >
        {dayOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
