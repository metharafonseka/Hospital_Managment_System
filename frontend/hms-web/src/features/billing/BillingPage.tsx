import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../api/client';
import type { InvoiceDto, PatientDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';

const statusColor: Record<string, string> = {
  Unpaid: 'text-red-600',
  PartiallyPaid: 'text-amber-600',
  Paid: 'text-green-600',
};

interface ManualLine {
  description: string;
  amount: string;
}

export function BillingPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Accountant');

  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [generatePatientId, setGeneratePatientId] = useState('');
  const [manualLines, setManualLines] = useState<ManualLine[]>([]);

  const [selected, setSelected] = useState<InvoiceDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const load = async () => {
    setLoading(true);
    const { data } = await apiClient.get<InvoiceDto[]>('/invoices');
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startGenerate = async () => {
    setShowGenerate(true);
    setGeneratePatientId('');
    setManualLines([]);
    setError(null);
    if (patients.length === 0) {
      const { data } = await apiClient.get<PatientDto[]>('/patients');
      setPatients(data);
    }
  };

  const addManualLine = () => setManualLines((lines) => [...lines, { description: '', amount: '' }]);
  const updateManualLine = (i: number, patch: Partial<ManualLine>) =>
    setManualLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeManualLine = (i: number) => setManualLines((lines) => lines.filter((_, idx) => idx !== i));

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await apiClient.post<InvoiceDto>('/invoices', {
        patientId: Number(generatePatientId),
        additionalLineItems: manualLines
          .filter((l) => l.description && l.amount)
          .map((l) => ({ description: l.description, amount: Number(l.amount) })),
      });
      setShowGenerate(false);
      setSelected(data);
      await load();
    } catch {
      setError('Failed to generate invoice — there may be no unbilled charges for this patient.');
    }
  };

  const viewInvoice = async (invoice: InvoiceDto) => {
    const { data } = await apiClient.get<InvoiceDto>(`/invoices/${invoice.id}`);
    setSelected(data);
    setPaymentAmount('');
    setPaymentMethod('Cash');
  };

  const onRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    try {
      const { data } = await apiClient.post<InvoiceDto>(`/invoices/${selected.id}/payments`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      setSelected(data);
      setPaymentAmount('');
      await load();
    } catch {
      setError('Failed to record payment — check the amount does not exceed the outstanding balance.');
    }
  };

  const outstanding = selected ? selected.totalAmount - selected.amountPaid : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Billing</h1>
        {canManage && (
          <button
            onClick={() => void startGenerate()}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Generate Invoice
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showGenerate && (
        <form onSubmit={onGenerate} className="mb-6 max-w-md rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Generate Invoice</h2>
          <p className="mb-3 text-xs text-slate-500">
            Automatically aggregates unbilled consultation, lab, and dispensed pharmacy charges for the selected patient.
          </p>

          <label className="mb-1 block text-sm font-medium text-slate-600">Patient</label>
          <select
            required
            value={generatePatientId}
            onChange={(e) => setGeneratePatientId(e.target.value)}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select…
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.patientCode})
              </option>
            ))}
          </select>

          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600">Additional charges (e.g. admission)</label>
            <button type="button" onClick={addManualLine} className="text-sm text-slate-600 hover:underline">
              + Add
            </button>
          </div>
          {manualLines.map((line, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateManualLine(i, { description: e.target.value })}
                className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Amount"
                value={line.amount}
                onChange={(e) => updateManualLine(i, { amount: e.target.value })}
                className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={() => removeManualLine(i)} className="text-sm text-red-600">
                ×
              </button>
            </div>
          ))}

          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
              Generate
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{inv.patientName}</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(inv.createdAtUtc).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-slate-500">{inv.totalAmount.toFixed(2)}</td>
                  <td className={`px-3 py-2 font-medium ${statusColor[inv.status]}`}>{inv.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => void viewInvoice(inv)} className="text-slate-600 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {selected && (
          <div className="w-full max-w-md rounded border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Invoice #{selected.id} — {selected.patientName}</h2>
              <button onClick={() => setSelected(null)} className="text-sm text-slate-500 hover:underline">
                Close
              </button>
            </div>

            <ul className="mb-3 divide-y divide-slate-100 text-sm">
              {selected.lineItems.map((li) => (
                <li key={li.id} className="flex justify-between py-1.5">
                  <span className="text-slate-600">
                    [{li.chargeType}] {li.description}
                  </span>
                  <span className="text-slate-800">{li.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="mb-3 space-y-1 border-t border-slate-200 pt-2 text-sm">
              <div className="flex justify-between font-medium text-slate-800">
                <span>Total</span>
                <span>{selected.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid</span>
                <span>{selected.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-red-600">
                <span>Outstanding</span>
                <span>{outstanding.toFixed(2)}</span>
              </div>
            </div>

            {selected.payments.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Payment history</p>
                <ul className="text-xs text-slate-500">
                  {selected.payments.map((p) => (
                    <li key={p.id}>
                      {new Date(p.paidAtUtc).toLocaleString()} — {p.amount.toFixed(2)} ({p.method})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canManage && outstanding > 0 && (
              <form onSubmit={onRecordPayment} className="flex gap-2">
                <input
                  required
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={outstanding}
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
                <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
                  Record Payment
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
