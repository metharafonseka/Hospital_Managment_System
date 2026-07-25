interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  valueFormatter?: (value: number) => string;
}

export function BarChart({ data, valueFormatter = (v) => v.toLocaleString() }: BarChartProps) {
  if (data.length === 0) return <p className="text-sm text-slate-400">No data.</p>;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-slate-600" title={d.label}>
            {d.label}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="h-5 rounded-r bg-teal-600"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
