import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { LabTestRequestDto } from '../../api/types';
import { Badge } from '../../components/Badge';
import { useToast } from '../../components/ToastProvider';

export function LaboratoryPage() {
  const toast = useToast();
  const [tests, setTests] = useState<LabTestRequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [resultDrafts, setResultDrafts] = useState<Record<number, string>>({});

  const load = async (status?: string) => {
    setLoading(true);
    const { data } = await apiClient.get<LabTestRequestDto[]>('/lab-tests', { params: status ? { status } : {} });
    setTests(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onFilterChange = (status: string) => {
    setStatusFilter(status);
    void load(status || undefined);
  };

  const collectSample = async (test: LabTestRequestDto) => {
    try {
      await apiClient.put(`/lab-tests/${test.id}/collect-sample`);
      toast.success('Sample collected.');
      await load(statusFilter || undefined);
    } catch {
      toast.error('Failed to collect sample.');
    }
  };

  const enterResult = async (test: LabTestRequestDto) => {
    const resultText = resultDrafts[test.id]?.trim();
    if (!resultText) return;
    try {
      await apiClient.put(`/lab-tests/${test.id}/result`, { resultText });
      toast.success('Result saved.');
      await load(statusFilter || undefined);
    } catch {
      toast.error('Failed to enter result.');
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Laboratory Queue</h1>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-slate-600">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All</option>
          <option value="Requested">Requested</option>
          <option value="SampleCollected">Sample Collected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tests.length === 0 ? (
        <div className="flex max-w-3xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <FlaskConical className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No lab tests found.</p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {test.testName} — {test.patientName}
                  </p>
                  <p className="text-xs text-slate-500">Requested {new Date(test.requestedAtUtc).toLocaleString()}</p>
                </div>
                <Badge status={test.status} />
              </div>

              {test.status === 'Requested' && (
                <button
                  onClick={() => void collectSample(test)}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Collect Sample
                </button>
              )}

              {test.status === 'SampleCollected' && (
                <div className="flex gap-2">
                  <input
                    placeholder="Enter result…"
                    value={resultDrafts[test.id] ?? ''}
                    onChange={(e) => setResultDrafts({ ...resultDrafts, [test.id]: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    onClick={() => void enterResult(test)}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Save Result
                  </button>
                </div>
              )}

              {test.status === 'Completed' && test.resultText && (
                <p className="rounded bg-slate-50 p-2 text-sm text-slate-700">{test.resultText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
