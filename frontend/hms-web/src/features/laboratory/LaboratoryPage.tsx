import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import type { LabTestRequestDto } from '../../api/types';

const statusColor: Record<string, string> = {
  Requested: 'text-amber-600',
  SampleCollected: 'text-blue-600',
  Completed: 'text-green-600',
  Cancelled: 'text-slate-400',
};

export function LaboratoryPage() {
  const [tests, setTests] = useState<LabTestRequestDto[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      await apiClient.put(`/lab-tests/${test.id}/collect-sample`);
      await load(statusFilter || undefined);
    } catch {
      setError('Failed to collect sample.');
    }
  };

  const enterResult = async (test: LabTestRequestDto) => {
    const resultText = resultDrafts[test.id]?.trim();
    if (!resultText) return;
    setError(null);
    try {
      await apiClient.put(`/lab-tests/${test.id}/result`, { resultText });
      await load(statusFilter || undefined);
    } catch {
      setError('Failed to enter result.');
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
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="Requested">Requested</option>
          <option value="SampleCollected">Sample Collected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="max-w-3xl space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {test.testName} — {test.patientName}
                  </p>
                  <p className="text-xs text-slate-500">Requested {new Date(test.requestedAtUtc).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-medium ${statusColor[test.status]}`}>{test.status}</span>
              </div>

              {test.status === 'Requested' && (
                <button
                  onClick={() => void collectSample(test)}
                  className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
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
                    className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => void enterResult(test)}
                    className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
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
          {tests.length === 0 && <p className="text-sm text-slate-400">No lab tests found.</p>}
        </div>
      )}
    </div>
  );
}
