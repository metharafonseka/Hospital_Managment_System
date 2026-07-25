import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { MedicalRecordDto, PatientDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../components/ToastProvider';

const emptyForm = { fullName: '', dateOfBirth: '', gender: 'Male', contactNumber: '', address: '', emergencyContact: '' };

export function PatientsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Receptionist');
  const canViewHistory = hasRole('Administrator', 'Doctor', 'Nurse');
  const toast = useToast();

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`/patients/${editing.id}`, form);
        toast.success('Patient updated.');
      } else {
        await apiClient.post('/patients', form);
        toast.success('Patient registered.');
      }
      setShowForm(false);
      await load(search);
    } catch {
      toast.error('Failed to save patient.');
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
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Register Patient
          </button>
        )}
      </div>

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, or contact number…"
            className="w-72 rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Search
        </button>
      </form>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {editing ? 'Edit Patient' : 'Register Patient'}
          </h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Date of Birth</label>
          <input
            required
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <label className="mb-1 block text-sm font-medium text-slate-600">Contact Number</label>
          <input
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Emergency Contact</label>
          <input
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : patients.length === 0 ? (
        <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Users className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No patients found.</p>
        </div>
      ) : (
        <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
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
              <tr key={patient.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">{patient.patientCode}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{patient.fullName}</td>
                <td className="px-3 py-2 text-slate-500">{patient.dateOfBirth}</td>
                <td className="px-3 py-2 text-slate-500">{patient.gender}</td>
                <td className="px-3 py-2 text-slate-500">{patient.contactNumber}</td>
                {(canManage || canViewHistory) && (
                  <td className="px-3 py-2 text-right">
                    {canViewHistory && (
                      <button onClick={() => void viewHistory(patient)} className="mr-3 text-teal-600 hover:text-teal-700 hover:underline">
                        View History
                      </button>
                    )}
                    {canManage && (
                      <button onClick={() => startEdit(patient)} className="text-teal-600 hover:text-teal-700 hover:underline">
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
        <div className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
