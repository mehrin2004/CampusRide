import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  const getBadgeStyle = () => {
    const val = (status || '').toLowerCase();

    if (type === 'bus') {
      switch (val) {
        case 'on_route':
          return 'bg-emerald-50 text-emerald-700 border-emerald-300';
        case 'idle':
          return 'bg-amber-50 text-amber-700 border-amber-300';
        case 'delayed':
          return 'bg-orange-50 text-orange-700 border-orange-300';
        case 'breakdown':
          return 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
        case 'maintenance':
          return 'bg-purple-50 text-purple-700 border-purple-300';
        default:
          return 'bg-amber-50 text-amber-700 border-amber-300';
      }
    }

    if (type === 'complaint') {
      switch (val) {
        case 'pending':
          return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
        case 'in_progress':
          return 'bg-blue-50 text-blue-700 border-blue-300 font-bold animate-pulse';
        case 'resolved':
          return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
        case 'rejected':
          return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
        default:
          return 'bg-slate-50 text-slate-700 border-slate-300';
      }
    }

    if (type === 'priority') {
      switch (val) {
        case 'low':
          return 'bg-slate-100 text-slate-700 border-slate-300';
        case 'medium':
          return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'high':
          return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'urgent':
        case 'emergency':
          return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-300';
      }
    }

    return 'bg-amber-50 text-amber-800 border-amber-300';
  };

  const formatText = (txt) => {
    if (!txt) return 'N/A';
    return txt.replace('_', ' ').toUpperCase();
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${getBadgeStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
