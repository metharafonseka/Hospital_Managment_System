import { useEffect, useState, type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ROLES, type UserDto } from '../../api/types';
import { Badge } from '../../components/Badge';
import { useToast } from '../../components/ToastProvider';

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: ROLES[1] });

  const load = async () => {
    setLoading(true);
    const { data } = await apiClient.get<UserDto[]>('/users');
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users', form);
      toast.success('User created.');
      setShowForm(false);
      setForm({ fullName: '', email: '', password: '', role: ROLES[1] });
      await load();
    } catch {
      toast.error('Failed to create user. Check the email is unique.');
    }
  };

  const toggleActive = async (user: UserDto) => {
    await apiClient.put(`/users/${user.id}/active`, { isActive: !user.isActive });
    toast.success(user.isActive ? 'User deactivated.' : 'User activated.');
    await load();
  };

  const changeRole = async (user: UserDto, role: string) => {
    await apiClient.put(`/users/${user.id}/role`, { role });
    toast.success('Role updated.');
    await load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Users</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">New User</h2>
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
          <label className="mb-1 block text-sm font-medium text-slate-600">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            {ROLES.filter((r) => r !== 'Doctor').map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <p className="mb-3 text-xs text-slate-400">Doctors are created from the Doctors page (they need department/specialization details).</p>

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
      ) : users.length === 0 ? (
        <div className="flex max-w-4xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <ShieldCheck className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No users yet.</p>
        </div>
      ) : (
        <table className="w-full max-w-4xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{user.fullName}</td>
                <td className="px-3 py-2 text-slate-500">{user.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={user.roles[0] ?? ''}
                    onChange={(e) => void changeRole(user, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Badge status={user.isActive ? 'Active' : 'Inactive'} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => void toggleActive(user)} className="text-teal-600 hover:text-teal-700 hover:underline">
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
