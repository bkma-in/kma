import React from 'react';
import { Calendar, Clock, BookOpen, Send } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateHelpers';

interface CallForPaperTimelineProps {
  openingDate?: string;
  deadline?: string;
  publicationDate?: string;
}

export const CallForPaperTimeline: React.FC<CallForPaperTimelineProps> = ({
  openingDate,
  deadline,
  publicationDate
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    return formatDateDDMMYYYY(dateStr);
  };

  const steps = [
    { label: 'Submissions Open', date: formatDate(openingDate), icon: Send, active: true },
    { label: 'Submission Deadline', date: formatDate(deadline), icon: Clock, active: true },
    { label: 'Expected Publication', date: formatDate(publicationDate), icon: BookOpen, active: false }
  ];

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 flex items-center gap-3.5 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
              <step.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{step.label}</p>
              <p className="text-sm font-black text-black mt-0.5">{step.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
