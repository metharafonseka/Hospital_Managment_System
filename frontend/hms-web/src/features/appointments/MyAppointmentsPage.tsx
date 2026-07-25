import { useEffect, useState, type FormEvent } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { AppointmentDto } from '../../api/types';
import { Badge } from '../../components/Badge';
import { useToast } from '../../components/ToastProvider';

interface PrescriptionRow {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  instructions: string;
}

const emptyRow: PrescriptionRow = { medicineName: '', dosage: '', frequency: '', durationDays: '', instructions: '' };

export function MyAppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [recording, setRecording] = useState<AppointmentDto | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [labTests, setLabTests] = useState<string[]>([]);
  const [newLabTest, setNewLabTest] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await apiClient.get<AppointmentDto[]>('/appointments/mine');
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startRecording = (appt: AppointmentDto) => {
    setRecording(appt);
    setDiagnosis('');
    setNotes('');
    setPrescriptions([]);
    setLabTests([]);
    setNewLabTest('');
  };

  const addPrescriptionRow = () => setPrescriptions((rows) => [...rows, { ...emptyRow }]);
  const updateRow = (index: number, patch: Partial<PrescriptionRow>) =>
    setPrescriptions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeRow = (index: number) => setPrescriptions((rows) => rows.filter((_, i) => i !== index));

  const addLabTest = () => {
    if (!newLabTest.trim()) return;
    setLabTests((tests) => [...tests, newLabTest.trim()]);
    setNewLabTest('');
  };
  const removeLabTest = (index: number) => setLabTests((tests) => tests.filter((_, i) => i !== index));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recording) return;
    try {
      await apiClient.post('/medical-records', {
        appointmentId: recording.id,
        diagnosis,
        notes: notes || null,
        prescriptions: prescriptions.map((p) => ({
          medicineName: p.medicineName,
          dosage: p.dosage,
          frequency: p.frequency,
          durationDays: p.durationDays ? Number(p.durationDays) : null,
          instructions: p.instructions || null,
        })),
        labTests: labTests.map((testName) => ({ testName })),
      });
      toast.success('Visit recorded and appointment completed.');
      setRecording(null);
      await load();
    } catch {
      toast.error('Failed to save the visit record.');
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">My Appointments</h1>

      {recording && (
        <form onSubmit={onSubmit} className="mb-6 max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Record Visit — {recording.patientName} ({recording.date} {recording.startTime.slice(0, 5)})
          </h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Diagnosis</label>
          <textarea
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Treatment Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600">Prescriptions</label>
            <button type="button" onClick={addPrescriptionRow} className="text-sm text-teal-600 hover:text-teal-700 hover:underline">
              + Add medicine
            </button>
          </div>

          {prescriptions.map((row, i) => (
            <div key={i} className="mb-2 rounded-lg border border-slate-200 p-2">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Medicine name"
                  value={row.medicineName}
                  onChange={(e) => updateRow(i, { medicineName: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <input
                  required
                  placeholder="Dosage (e.g. 500mg)"
                  value={row.dosage}
                  onChange={(e) => updateRow(i, { dosage: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <input
                  required
                  placeholder="Frequency (e.g. twice daily)"
                  value={row.frequency}
                  onChange={(e) => updateRow(i, { frequency: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Duration (days)"
                  value={row.durationDays}
                  onChange={(e) => updateRow(i, { durationDays: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Instructions (optional)"
                  value={row.instructions}
                  onChange={(e) => updateRow(i, { instructions: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <button type="button" onClick={() => removeRow(i)} className="text-sm text-rose-600 hover:text-rose-700 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="mb-2 mt-4 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600">Lab Tests</label>
          </div>
          <div className="mb-3 flex gap-2">
            <input
              placeholder="Test name (e.g. Complete Blood Count)"
              value={newLabTest}
              onChange={(e) => setNewLabTest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLabTest();
                }
              }}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button type="button" onClick={addLabTest} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Add
            </button>
          </div>
          {labTests.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {labTests.map((test, i) => (
                <li key={i} className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-700">
                  {test}
                  <button type="button" onClick={() => removeLabTest(i)} className="text-teal-500 hover:text-teal-700">
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              Save & Complete Visit
            </button>
            <button
              type="button"
              onClick={() => setRecording(null)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : appointments.length === 0 ? (
        <div className="flex max-w-3xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <CalendarClock className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No appointments.</p>
        </div>
      ) : (
        <table className="w-full max-w-3xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{appt.patientName}</td>
                <td className="px-3 py-2 text-slate-500">{appt.date}</td>
                <td className="px-3 py-2 text-slate-500">
                  {appt.startTime.slice(0, 5)}–{appt.endTime.slice(0, 5)}
                </td>
                <td className="px-3 py-2">
                  <Badge status={appt.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  {appt.status === 'Scheduled' && (
                    <button onClick={() => startRecording(appt)} className="text-teal-600 hover:text-teal-700 hover:underline">
                      Record Visit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
