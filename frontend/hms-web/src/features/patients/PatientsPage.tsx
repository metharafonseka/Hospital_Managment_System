import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../api/client';
import type { MedicalRecordDto, PatientDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';

const emptyForm = { fullName: '', dateOfBirth: '', gender: 'Male', contactNumber: '', address: '', emergencyContact: '' };

export function PatientsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Receptionist');
  const canViewHistory = hasRole('Administrator', 'Doctor', 'Nurse');

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<PatientDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [historyPatient, setHistoryPatient] = useState<PatientDto | null>(null);
  const [history, setHistory] = useState<MedicalRecordDto[]>([]);

  const load = async (search?: string) => {
    setLoading(true);
    const { data } = await apiClient.get<PatientDto[]>('/patients', { params: search ? { search } : {} });
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    void load(search);
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  };

  const startEdit = (patient: PatientDto) => {
    setEditing(patient);
    setForm({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      contactNumber: patient.contactNumber ?? '',
      address: patient.address ?? '',
      emergencyContact: patient.emergencyContact ?? '',
    });
    setShowForm(true);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await apiClient.put(`/patients/${editing.id}`, form);
      } else {
        await apiClient.post('/patients', form);
      }
      setShowForm(false);
      await load(search);
    } catch {
      setError('Failed to save patient.');
    }
  };

  const viewHistory = async (patient: PatientDto) => {
    setHistoryPatient(patient);
    const { data } = await apiClient.get<MedicalRecordDto[]>(`/patients/${patient.id}/medical-records`);
    setHistory(data);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Patients</h1>
        {canManage && (
          <button
            onClick={startCreate}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Register Patient
          </button>
        )}
      </div>

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, or contact number…"
          className="w-72 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
          Search
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {editing ? 'Edit Patient' : 'Register Patient'}
          </h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Date of Birth</label>
          <input
            required
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <label className="mb-1 block text-sm font-medium text-slate-600">Contact Number</label>
          <input
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Emergency Contact</label>
          <input
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
        <table className="w-full max-w-4xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">DOB</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Contact</th>
              {(canManage || canViewHistory) && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{patient.patientCode}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{patient.fullName}</td>
                <td className="px-3 py-2 text-slate-500">{patient.dateOfBirth}</td>
                <td className="px-3 py-2 text-slate-500">{patient.gender}</td>
                <td className="px-3 py-2 text-slate-500">{patient.contactNumber}</td>
                {(canManage || canViewHistory) && (
                  <td className="px-3 py-2 text-right">
                    {canViewHistory && (
                      <button onClick={() => void viewHistory(patient)} className="mr-3 text-slate-600 hover:underline">
                        View History
                      </button>
                    )}
                    {canManage && (
                      <button onClick={() => startEdit(patient)} className="text-slate-600 hover:underline">
                        Edit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {historyPatient && (
        <div className="mt-6 max-w-2xl rounded border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Medical History — {historyPatient.fullName}</h2>
            <button onClick={() => setHistoryPatient(null)} className="text-sm text-slate-500 hover:underline">
              Close
            </button>
          </div>

          {history.length === 0 && <p className="text-sm text-slate-400">No medical records yet.</p>}

          <ul className="divide-y divide-slate-100">
            {history.map((record) => (
              <li key={record.id} className="py-3 text-sm">
                <div className="mb-1 flex items-center justify-between text-slate-500">
                  <span>
                    {record.visitDate} — Dr. {record.doctorName}
                  </span>
                </div>
                <p className="font-medium text-slate-800">{record.diagnosis}</p>
                {record.notes && <p className="mt-1 text-slate-600">{record.notes}</p>}
                {record.prescriptions.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-slate-600">
                    {record.prescriptions.map((p) => (
                      <li key={p.id}>
                        {p.medicineName} — {p.dosage}, {p.frequency}
                        {p.durationDays ? ` for ${p.durationDays} days` : ''}
                        {p.instructions ? ` (${p.instructions})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
