import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pill, ClipboardList } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { MedicineDto, PendingPrescriptionDto } from '../../api/types';
import { useToast } from '../../components/ToastProvider';

const emptyMedicineForm = { name: '', unit: '', stockQuantity: '', unitPrice: '', expiryDate: '', reorderThreshold: '10' };

export function PharmacyPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'queue' | 'inventory'>('queue');

  const [pending, setPending] = useState<PendingPrescriptionDto[]>([]);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [dispensing, setDispensing] = useState<PendingPrescriptionDto | null>(null);
  const [dispenseMedicineId, setDispenseMedicineId] = useState('');
  const [dispenseQuantity, setDispenseQuantity] = useState('1');

  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [medicineForm, setMedicineForm] = useState(emptyMedicineForm);

  const loadAll = async () => {
    setLoading(true);
    const [pendingRes, medicinesRes] = await Promise.all([
      apiClient.get<PendingPrescriptionDto[]>('/prescriptions/pending'),
      apiClient.get<MedicineDto[]>('/medicines'),
    ]);
    setPending(pendingRes.data);
    setMedicines(medicinesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const startDispense = (item: PendingPrescriptionDto) => {
    setDispensing(item);
    setDispenseMedicineId('');
    setDispenseQuantity('1');
  };

  const onDispense = async (e: FormEvent) => {
    e.preventDefault();
    if (!dispensing) return;
    try {
      await apiClient.put(`/prescriptions/${dispensing.id}/dispense`, {
        medicineId: Number(dispenseMedicineId),
        quantity: Number(dispenseQuantity),
      });
      toast.success('Medicine dispensed.');
      setDispensing(null);
      await loadAll();
    } catch {
      toast.error('Failed to dispense — check stock is sufficient.');
    }
  };

  const onCreateMedicine = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/medicines', {
        name: medicineForm.name,
        unit: medicineForm.unit,
        stockQuantity: Number(medicineForm.stockQuantity),
        unitPrice: Number(medicineForm.unitPrice),
        expiryDate: medicineForm.expiryDate,
        reorderThreshold: Number(medicineForm.reorderThreshold),
      });
      toast.success('Medicine added.');
      setShowMedicineForm(false);
      setMedicineForm(emptyMedicineForm);
      await loadAll();
    } catch {
      toast.error('Failed to add medicine.');
    }
  };

  const restock = async (medicine: MedicineDto) => {
    const amount = prompt(`Add how many units to "${medicine.name}"?`, '50');
    if (!amount) return;
    await apiClient.put(`/medicines/${medicine.id}/stock`, { quantityDelta: Number(amount) });
    toast.success('Stock updated.');
    await loadAll();
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Pharmacy</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('queue')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Dispense Queue
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'inventory' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Inventory
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tab === 'queue' ? (
        <>
          {dispensing && (
            <form onSubmit={onDispense} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Dispense — {dispensing.medicineName} ({dispensing.dosage}) for {dispensing.patientName}
              </h2>
              <label className="mb-1 block text-sm font-medium text-slate-600">Medicine (from inventory)</label>
              <select
                required
                value={dispenseMedicineId}
                onChange={(e) => setDispenseMedicineId(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="" disabled>
                  Select…
                </option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (stock: {m.stockQuantity})
                  </option>
                ))}
              </select>
              <label className="mb-1 block text-sm font-medium text-slate-600">Quantity</label>
              <input
                required
                type="number"
                min={1}
                value={dispenseQuantity}
                onChange={(e) => setDispenseQuantity(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
                  Dispense
                </button>
                <button
                  type="button"
                  onClick={() => setDispensing(null)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {pending.length === 0 ? (
            <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <ClipboardList className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm text-slate-500">No pending prescriptions.</p>
            </div>
          ) : (
            <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Medicine</th>
                  <th className="px-3 py-2">Dosage</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{item.patientName}</td>
                    <td className="px-3 py-2 text-slate-500">{item.medicineName}</td>
                    <td className="px-3 py-2 text-slate-500">{item.dosage}</td>
                    <td className="px-3 py-2 text-slate-500">{item.frequency}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => startDispense(item)} className="text-teal-600 hover:text-teal-700 hover:underline">
                        Dispense
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowMedicineForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Add Medicine
            </button>
          </div>

          {showMedicineForm && (
            <form onSubmit={onCreateMedicine} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
              <input
                required
                value={medicineForm.name}
                onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Unit (e.g. tablet, bottle)</label>
              <input
                required
                value={medicineForm.unit}
                onChange={(e) => setMedicineForm({ ...medicineForm, unit: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Initial Stock</label>
              <input
                required
                type="number"
                min={0}
                value={medicineForm.stockQuantity}
                onChange={(e) => setMedicineForm({ ...medicineForm, stockQuantity: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Unit Price</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={medicineForm.unitPrice}
                onChange={(e) => setMedicineForm({ ...medicineForm, unitPrice: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Expiry Date</label>
              <input
                required
                type="date"
                value={medicineForm.expiryDate}
                onChange={(e) => setMedicineForm({ ...medicineForm, expiryDate: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Reorder Threshold</label>
              <input
                required
                type="number"
                min={0}
                value={medicineForm.reorderThreshold}
                onChange={(e) => setMedicineForm({ ...medicineForm, reorderThreshold: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowMedicineForm(false)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {medicines.length === 0 ? (
            <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <Pill className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm text-slate-500">No medicines in inventory yet.</p>
            </div>
          ) : (
            <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Expiry</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{m.name}</td>
                    <td className="px-3 py-2 text-slate-500">{m.unit}</td>
                    <td className={`px-3 py-2 ${m.stockQuantity <= m.reorderThreshold ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
                      {m.stockQuantity}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{m.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-500">{m.expiryDate}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => void restock(m)} className="text-teal-600 hover:text-teal-700 hover:underline">
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
