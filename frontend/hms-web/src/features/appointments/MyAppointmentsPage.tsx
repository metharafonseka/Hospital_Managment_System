import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../api/client';
import type { AppointmentDto } from '../../api/types';

const statusColor: Record<string, string> = {
  Scheduled: 'text-blue-600',
  Completed: 'text-green-600',
  Cancelled: 'text-slate-400',
};

interface PrescriptionRow {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  instructions: string;
}

const emptyRow: PrescriptionRow = { medicineName: '', dosage: '', frequency: '', durationDays: '', instructions: '' };

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
    setError(null);
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
      setRecording(null);
      await load();
    } catch {
      setError('Failed to save the visit record.');
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">My Appointments</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {recording && (
        <form onSubmit={onSubmit} className="mb-6 max-w-lg rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Record Visit — {recording.patientName} ({recording.date} {recording.startTime.slice(0, 5)})
          </h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Diagnosis</label>
          <textarea
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Treatment Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-600">Prescriptions</label>
            <button type="button" onClick={addPrescriptionRow} className="text-sm text-slate-600 hover:underline">
              + Add medicine
            </button>
          </div>

          {prescriptions.map((row, i) => (
            <div key={i} className="mb-2 rounded border border-slate-200 p-2">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Medicine name"
                  value={row.medicineName}
                  onChange={(e) => updateRow(i, { medicineName: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  required
                  placeholder="Dosage (e.g. 500mg)"
                  value={row.dosage}
                  onChange={(e) => updateRow(i, { dosage: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  required
                  placeholder="Frequency (e.g. twice daily)"
                  value={row.frequency}
                  onChange={(e) => updateRow(i, { frequency: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Duration (days)"
                  value={row.durationDays}
                  onChange={(e) => updateRow(i, { durationDays: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Instructions (optional)"
                  value={row.instructions}
                  onChange={(e) => updateRow(i, { instructions: e.target.value })}
                  className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button type="button" onClick={() => removeRow(i)} className="text-sm text-red-600 hover:underline">
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
              className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={addLabTest} className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              Add
            </button>
          </div>
          {labTests.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {labTests.map((test, i) => (
                <li key={i} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {test}
                  <button type="button" onClick={() => removeLabTest(i)} className="text-red-600">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
              Save & Complete Visit
            </button>
            <button
              type="button"
              onClick={() => setRecording(null)}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <table className="w-full max-w-3xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
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
              <tr key={appt.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{appt.patientName}</td>
                <td className="px-3 py-2 text-slate-500">{appt.date}</td>
                <td className="px-3 py-2 text-slate-500">
                  {appt.startTime.slice(0, 5)}–{appt.endTime.slice(0, 5)}
                </td>
                <td className={`px-3 py-2 font-medium ${statusColor[appt.status]}`}>{appt.status}</td>
                <td className="px-3 py-2 text-right">
                  {appt.status === 'Scheduled' && (
                    <button onClick={() => startRecording(appt)} className="text-slate-600 hover:underline">
                      Record Visit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  No appointments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
