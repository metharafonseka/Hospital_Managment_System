import { useEffect, useState, type FormEvent } from 'react';
import { Plus, CalendarCheck } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { AppointmentDto, DoctorDto, PatientDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';
import { Badge } from '../../components/Badge';
import { useToast } from '../../components/ToastProvider';
import { useConfirm } from '../../components/ConfirmProvider';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AppointmentsPage() {
  const { hasRole } = useAuth();
  const canBook = hasRole('Administrator', 'Receptionist');
  const toast = useToast();
  const confirm = useConfirm();

  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [rescheduling, setRescheduling] = useState<AppointmentDto | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  const load = async (date?: string) => {
    setLoading(true);
    const { data } = await apiClient.get<AppointmentDto[]>('/appointments', { params: date ? { date } : {} });
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onFilter = (e: FormEvent) => {
    e.preventDefault();
    void load(dateFilter || undefined);
  };

  const startBooking = async () => {
    setShowForm(true);
    setPatientId('');
    setDoctorId('');
    setDate(todayIso());
    setSlots([]);
    setSelectedSlot('');
    setNotes('');
    if (patients.length === 0 || doctors.length === 0) {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get<PatientDto[]>('/patients'),
        apiClient.get<DoctorDto[]>('/doctors'),
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    }
  };

  const fetchSlots = async (forDoctorId: string, forDate: string) => {
    if (!forDoctorId || !forDate) return;
    const { data } = await apiClient.get<string[]>('/appointments/available-slots', {
      params: { doctorId: forDoctorId, date: forDate },
    });
    setSlots(data);
    setSelectedSlot('');
  };

  const onBook = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/appointments', {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        date,
        startTime: selectedSlot,
        notes: notes || null,
      });
      toast.success('Appointment booked.');
      setShowForm(false);
      await load(dateFilter || undefined);
    } catch {
      toast.error('Failed to book appointment. The slot may have just been taken.');
    }
  };

  const startReschedule = async (appt: AppointmentDto) => {
    setRescheduling(appt);
    setRescheduleDate(appt.date);
    setRescheduleSlot('');
    const { data } = await apiClient.get<string[]>('/appointments/available-slots', {
      params: { doctorId: appt.doctorId, date: appt.date },
    });
    setRescheduleSlots(data);
  };

  const onReschedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!rescheduling) return;
    try {
      await apiClient.put(`/appointments/${rescheduling.id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleSlot,
      });
      toast.success('Appointment rescheduled.');
      setRescheduling(null);
      await load(dateFilter || undefined);
    } catch {
      toast.error('Failed to reschedule. The slot may have just been taken.');
    }
  };

  const onCancel = async (appt: AppointmentDto) => {
    if (
      !(await confirm({
        title: 'Cancel appointment',
        message: `Cancel appointment for ${appt.patientName} with ${appt.doctorName}?`,
        danger: true,
      }))
    )
      return;
    await apiClient.put(`/appointments/${appt.id}/cancel`);
    toast.success('Appointment cancelled.');
    await load(dateFilter || undefined);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Appointments</h1>
        {canBook && (
          <button
            onClick={() => void startBooking()}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Book Appointment
          </button>
        )}
      </div>

      <form onSubmit={onFilter} className="mb-4 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Filter by date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Apply
        </button>
      </form>

      {showForm && (
        <form onSubmit={onBook} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Book Appointment</h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Patient</label>
          <select
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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

          <label className="mb-1 block text-sm font-medium text-slate-600">Doctor</label>
          <select
            required
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              void fetchSlots(e.target.value, date);
            }}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="" disabled>
              Select…
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} — {d.departmentName}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm font-medium text-slate-600">Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              void fetchSlots(doctorId, e.target.value);
            }}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Available Slots</label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {slots.length === 0 && <p className="text-xs text-slate-400">No slots — pick a doctor and date.</p>}
            {slots.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSelectedSlot(s)}
                className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                  selectedSlot === s
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-slate-500'
                }`}
              >
                {s.slice(0, 5)}
              </button>
            ))}
          </div>

          <label className="mb-1 block text-sm font-medium text-slate-600">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!selectedSlot}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Book
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

      {rescheduling && (
        <form onSubmit={onReschedule} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Reschedule — {rescheduling.patientName} with {rescheduling.doctorName}
          </h2>

          <label className="mb-1 block text-sm font-medium text-slate-600">Date</label>
          <input
            required
            type="date"
            value={rescheduleDate}
            onChange={async (e) => {
              setRescheduleDate(e.target.value);
              const { data } = await apiClient.get<string[]>('/appointments/available-slots', {
                params: { doctorId: rescheduling.doctorId, date: e.target.value },
              });
              setRescheduleSlots(data);
              setRescheduleSlot('');
            }}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600">Available Slots</label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {rescheduleSlots.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setRescheduleSlot(s)}
                className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                  rescheduleSlot === s
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-slate-500'
                }`}
              >
                {s.slice(0, 5)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!rescheduleSlot}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRescheduling(null)}
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
        <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <CalendarCheck className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No appointments found.</p>
        </div>
      ) : (
        <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Doctor</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Status</th>
              {canBook && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{appt.patientName}</td>
                <td className="px-3 py-2 text-slate-500">{appt.doctorName}</td>
                <td className="px-3 py-2 text-slate-500">{appt.date}</td>
                <td className="px-3 py-2 text-slate-500">
                  {appt.startTime.slice(0, 5)}–{appt.endTime.slice(0, 5)}
                </td>
                <td className="px-3 py-2">
                  <Badge status={appt.status} />
                </td>
                {canBook && (
                  <td className="px-3 py-2 text-right">
                    {appt.status === 'Scheduled' && (
                      <>
                        <button onClick={() => void startReschedule(appt)} className="mr-3 text-teal-600 hover:text-teal-700 hover:underline">
                          Reschedule
                        </button>
                        <button onClick={() => void onCancel(appt)} className="text-rose-600 hover:text-rose-700 hover:underline">
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
