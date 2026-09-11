import { Job } from '@/lib/types';

interface StatsBarProps {
  jobs: Job[];
}

export default function StatsBar({ jobs }: StatsBarProps) {
  const total = jobs.length;
  const applied = jobs.filter(j => j.status === 'Applied').length;
  const interview = jobs.filter(j => j.status === 'Interview').length;
  const offer = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total</p>
        <p className="text-2xl font-bold">{total}</p>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-green-500 border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Applied</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold">{applied}</p>
          <span className="text-xs text-green-600 font-medium mb-1">{getPercentage(applied)}%</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Interviewing</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold">{interview}</p>
          <span className="text-xs text-blue-600 font-medium mb-1">{getPercentage(interview)}%</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Offers</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold">{offer}</p>
          <span className="text-xs text-amber-600 font-medium mb-1">{getPercentage(offer)}%</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-red-500 border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rejected</p>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold">{rejected}</p>
          <span className="text-xs text-red-600 font-medium mb-1">{getPercentage(rejected)}%</span>
        </div>
      </div>
    </div>
  );
}
