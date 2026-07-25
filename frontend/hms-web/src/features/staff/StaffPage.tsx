import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../api/client';
import type { DepartmentDto, EmployeeDto, LeaveRequestDto, Role } from '../../api/types';
import { ROLES } from '../../api/types';

const NON_DOCTOR_ROLES = ROLES.filter((r) => r !== 'Doctor') as Exclude<Role, 'Doctor'>[];

const emptyEmployeeForm = {
  fullName: '',
  email: '',
  password: '',
  role: NON_DOCTOR_ROLES[0] as string,
  departmentId: '',
  jobTitle: '',
  hireDate: '',
};

export function StaffPage() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);

  const [attendanceFor, setAttendanceFor] = useState<EmployeeDto | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ date: '', status: 'Present', checkInTime: '', checkOutTime: '', notes: '' });

  const load = async () => {
    setLoading(true);
    const [employeesRes, departmentsRes, leaveRes] = await Promise.all([
      apiClient.get<EmployeeDto[]>('/employees'),
      apiClient.get<DepartmentDto[]>('/departments'),
      apiClient.get<LeaveRequestDto[]>('/leave-requests'),
    ]);
    setEmployees(employeesRes.data);
    setDepartments(departmentsRes.data);
    setLeaveRequests(leaveRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreateEmployee = () => {
    setEmployeeForm({ ...emptyEmployeeForm, departmentId: departments[0]?.id.toString() ?? '' });
    setShowEmployeeForm(true);
    setError(null);
  };

  const onCreateEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/employees', {
        fullName: employeeForm.fullName,
        email: employeeForm.email,
        password: employeeForm.password,
        role: employeeForm.role,
        departmentId: Number(employeeForm.departmentId),
        jobTitle: employeeForm.jobTitle,
        hireDate: employeeForm.hireDate,
      });
      setShowEmployeeForm(false);
      await load();
    } catch {
      setError('Failed to register employee. Check the email is unique and department is valid.');
    }
  };

  const startAttendance = (employee: EmployeeDto) => {
    setAttendanceFor(employee);
    setAttendanceForm({ date: new Date().toISOString().slice(0, 10), status: 'Present', checkInTime: '', checkOutTime: '', notes: '' });
  };

  const onMarkAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (!attendanceFor) return;
    try {
      await apiClient.put(`/employees/${attendanceFor.id}/attendance`, {
        date: attendanceForm.date,
        status: attendanceForm.status,
        checkInTime: attendanceForm.checkInTime || null,
        checkOutTime: attendanceForm.checkOutTime || null,
        notes: attendanceForm.notes || null,
      });
      setAttendanceFor(null);
    } catch {
      setError('Failed to mark attendance.');
    }
  };

  const decideLeave = async (leave: LeaveRequestDto, approved: boolean) => {
    await apiClient.put(`/leave-requests/${leave.id}/decide`, { approved });
    await load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Staff Management</h1>
        <button
          onClick={startCreateEmployee}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Register Employee
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showEmployeeForm && (
        <form onSubmit={onCreateEmployee} className="mb-6 max-w-md rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">New Employee</h2>
          <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
          <input
            required
            value={employeeForm.fullName}
            onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
          <input
            required
            type="email"
            value={employeeForm.email}
            onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
          <input
            required
            type="password"
            minLength={8}
            value={employeeForm.password}
            onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
          <select
            value={employeeForm.role}
            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {NON_DOCTOR_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <label className="mb-1 block text-sm font-medium text-slate-600">Department</label>
          <select
            required
            value={employeeForm.departmentId}
            onChange={(e) => setEmployeeForm({ ...employeeForm, departmentId: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
          <label className="mb-1 block text-sm font-medium text-slate-600">Job Title</label>
          <input
            required
            value={employeeForm.jobTitle}
            onChange={(e) => setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Hire Date</label>
          <input
            required
            type="date"
            value={employeeForm.hireDate}
            onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowEmployeeForm(false)}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {attendanceFor && (
        <form onSubmit={onMarkAttendance} className="mb-6 max-w-md rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Mark Attendance — {attendanceFor.fullName}</h2>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              required
              type="date"
              value={attendanceForm.date}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <select
              value={attendanceForm.status}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
              <option>HalfDay</option>
            </select>
            <input
              type="time"
              placeholder="Check in"
              value={attendanceForm.checkInTime}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="time"
              placeholder="Check out"
              value={attendanceForm.checkOutTime}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFor(null)}
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
        <>
          <table className="mb-8 w-full max-w-4xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Job Title</th>
                <th className="px-3 py-2">Hired</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{emp.fullName}</td>
                  <td className="px-3 py-2 text-slate-500">{emp.role}</td>
                  <td className="px-3 py-2 text-slate-500">{emp.departmentName}</td>
                  <td className="px-3 py-2 text-slate-500">{emp.jobTitle}</td>
                  <td className="px-3 py-2 text-slate-500">{emp.hireDate}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startAttendance(emp)} className="text-slate-600 hover:underline">
                      Mark Attendance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="mb-3 text-lg font-semibold text-slate-800">Leave Requests</h2>
          <table className="w-full max-w-4xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Dates</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((leave) => (
                <tr key={leave.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{leave.employeeName}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {leave.startDate} – {leave.endDate}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{leave.reason}</td>
                  <td className="px-3 py-2 text-slate-500">{leave.status}</td>
                  <td className="px-3 py-2 text-right">
                    {leave.status === 'Pending' && (
                      <>
                        <button onClick={() => void decideLeave(leave, true)} className="mr-3 text-green-600 hover:underline">
                          Approve
                        </button>
                        <button onClick={() => void decideLeave(leave, false)} className="text-red-600 hover:underline">
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {leaveRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
