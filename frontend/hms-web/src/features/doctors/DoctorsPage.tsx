import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { DepartmentDto, DoctorDto, DoctorScheduleDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../components/ToastProvider';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function DoctorsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator');
  const toast = useToast();

  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<DoctorDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    departmentId: '',
    specialization: '',
    licenseNumber: '',
    consultationFee: '',
  });

  const [scheduleDoctorId, setScheduleDoctorId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 });

  const load = async () => {
    setLoading(true);
    const [doctorsRes, departmentsRes] = await Promise.all([
      apiClient.get<DoctorDto[]>('/doctors'),
      apiClient.get<DepartmentDto[]>('/departments'),
    ]);
    setDoctors(doctorsRes.data);
    setDepartments(departmentsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({
      fullName: '',
      email: '',
      password: '',
      departmentId: departments[0]?.id.toString() ?? '',
      specialization: '',
      licenseNumber: '',
      consultationFee: '',
    });
    setShowForm(true);
  };

  const startEdit = (doctor: DoctorDto) => {
    setEditing(doctor);
    setForm({
      fullName: doctor.fullName,
      email: doctor.email,
      password: '',
      departmentId: doctor.departmentId.toString(),
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      consultationFee: doctor.consultationFee.toString(),
    });
    setShowForm(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`/doctors/${editing.id}`, {
          departmentId: Number(form.departmentId),
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          consultationFee: Number(form.consultationFee),
        });
        toast.success('Doctor updated.');
      } else {
        await apiClient.post('/doctors', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          departmentId: Number(form.departmentId),
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          consultationFee: Number(form.consultationFee),
        });
        toast.success('Doctor added.');
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error('Failed to save doctor. Check the email is unique and department is valid.');
    }
  };

  const openSchedules = async (doctor: DoctorDto) => {
    setScheduleDoctorId(doctor.id);
    const { data } = await apiClient.get<DoctorScheduleDto[]>(`/doctors/${doctor.id}/schedules`);
    setSchedules(data);
  };

  const addSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (scheduleDoctorId === null) return;
    await apiClient.post(`/doctors/${scheduleDoctorId}/schedules`, scheduleForm);
    const { data } = await apiClient.get<DoctorScheduleDto[]>(`/doctors/${scheduleDoctorId}/schedules`);
    setSchedules(data);
  };

  const removeSchedule = async (scheduleId: number) => {
    if (scheduleDoctorId === null) return;
    await apiClient.delete(`/doctors/${scheduleDoctorId}/schedules/${scheduleId}`);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Doctors</h1>
        {canManage && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Doctor
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">{editing ? 'Edit Doctor' : 'New Doctor'}</h2>

          {!editing && (
            <>
              <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </>
          )}

          <label className="mb-1 block text-sm font-medium text-slate-600">Department</label>
          <select
            required
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="" disabled>
              Select…
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm font-medium text-slate-600">Specialization</label>
          <input
            required
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">License Number</label>
          <input
            required
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Consultation Fee</label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.consultationFee}
            onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
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
      ) : doctors.length === 0 ? (
        <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Stethoscope className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No doctors yet.</p>
        </div>
      ) : (
        <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Specialization</th>
              <th className="px-3 py-2">License</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{doctor.fullName}</td>
                <td className="px-3 py-2 text-slate-500">{doctor.departmentName}</td>
                <td className="px-3 py-2 text-slate-500">{doctor.specialization}</td>
                <td className="px-3 py-2 text-slate-500">{doctor.licenseNumber}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => void openSchedules(doctor)} className="mr-3 text-teal-600 hover:text-teal-700 hover:underline">
                    Schedules
                  </button>
                  {canManage && (
                    <button onClick={() => startEdit(doctor)} className="text-teal-600 hover:text-teal-700 hover:underline">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {scheduleDoctorId !== null && (
        <div className="mt-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Weekly Schedule</h2>
            <button onClick={() => setScheduleDoctorId(null)} className="text-sm text-slate-500 hover:underline">
              Close
            </button>
          </div>

          <ul className="mb-4 divide-y divide-slate-100 text-sm">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>
                  {s.dayOfWeek} {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)} ({s.slotDurationMinutes} min slots)
                </span>
                {canManage && (
                  <button onClick={() => void removeSchedule(s.id)} className="text-rose-600 hover:text-rose-700 hover:underline">
                    Remove
                  </button>
                )}
              </li>
            ))}
            {schedules.length === 0 && <li className="py-2 text-slate-400">No schedule entries yet.</li>}
          </ul>

          {canManage && (
            <form onSubmit={addSchedule} className="flex flex-wrap items-end gap-2">
              <select
                value={scheduleForm.dayOfWeek}
                onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <input
                type="time"
                value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <input
                type="number"
                min={5}
                max={240}
                value={scheduleForm.slotDurationMinutes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, slotDurationMinutes: Number(e.target.value) })}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button type="submit" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
                Add
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
