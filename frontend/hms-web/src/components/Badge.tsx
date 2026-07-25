const STATUS_STYLES: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Dispensed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',

  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PartiallyPaid: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Late: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  HalfDay: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  SampleCollected: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Requested: 'bg-amber-50 text-amber-700 ring-amber-600/20',

  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Absent: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Unpaid: 'bg-rose-50 text-rose-700 ring-rose-600/20',

  Scheduled: 'bg-teal-50 text-teal-700 ring-teal-600/20',

  Inactive: 'bg-slate-100 text-slate-500 ring-slate-500/10',
};

const DEFAULT_STYLE = 'bg-slate-100 text-slate-600 ring-slate-500/10';

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] ?? DEFAULT_STYLE
      }`}
    >
      {status}
    </span>
  );
}
