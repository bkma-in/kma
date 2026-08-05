import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import type { ImportantDateItem } from '../../types/cfp';

interface ImportantDatesCardProps {
  dates: ImportantDateItem[];
  openingDate?: string;
  deadline?: string;
  publicationDate?: string;
}

export const ImportantDatesCard: React.FC<ImportantDatesCardProps> = ({
  dates = [],
  openingDate,
  deadline,
  publicationDate
}) => {
  const allDates: ImportantDateItem[] = [];

  if (openingDate) {
    allDates.push({ label: 'Submission Opening', date: openingDate });
  }
  if (deadline) {
    allDates.push({ label: 'Submission Deadline', date: deadline });
  }
  if (publicationDate) {
    allDates.push({ label: 'Expected Publication', date: publicationDate });
  }

  // Append custom dates
  dates.forEach(d => {
    if (d.label && d.date && !allDates.some(existing => existing.label.toLowerCase() === d.label.toLowerCase())) {
      allDates.push(d);
    }
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5 text-black font-bold text-base border-b border-zinc-100 pb-3">
        <Calendar size={18} className="text-zinc-600" />
        <h3>Important Dates</h3>
      </div>

      <div className="space-y-3">
        {allDates.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 last:border-none text-sm">
            <span className="text-zinc-600 font-medium">{item.label}</span>
            <span className="font-bold text-black bg-zinc-100 px-3 py-1 rounded-lg text-xs font-mono">
              {formatDate(item.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
