import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { DepartmentDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { useConfirm } from '../../components/ConfirmProvider';

export function DepartmentsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator');
  const toast = useToast();
  const confirm = useConfirm();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<DepartmentDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await apiClient.get<DepartmentDto[]>('/departments');
    setDepartments(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setShowForm(true);
  };

  const startEdit = (dept: DepartmentDto) => {
    setEditing(dept);
    setName(dept.name);
    setDescription(dept.description ?? '');
    setShowForm(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiClient.put(`/departments/${editing.id}`, { name, description });
        toast.success('Department updated.');
      } else {
        await apiClient.post('/departments', { name, description });
        toast.success('Department created.');
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error('Failed to save department.');
    }
  };

  const onDelete = async (dept: DepartmentDto) => {
    if (!(await confirm({ title: 'Delete department', message: `Delete department "${dept.name}"?`, danger: true }))) return;
    try {
      await apiClient.delete(`/departments/${dept.id}`);
      toast.success('Department deleted.');
      await load();
    } catch {
      toast.error('Cannot delete a department with assigned doctors.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Departments</h1>
        {canManage && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Department
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {editing ? 'Edit Department' : 'New Department'}
          </h2>
          <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
      ) : departments.length === 0 ? (
        <div className="flex max-w-3xl flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Building2 className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No departments yet.</p>
        </div>
      ) : (
        <table className="w-full max-w-3xl border-collapse overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Doctors</th>
              {canManage && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-800">{dept.name}</td>
                <td className="px-3 py-2 text-slate-500">{dept.description}</td>
                <td className="px-3 py-2 text-slate-500">{dept.doctorCount}</td>
                {canManage && (
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(dept)} className="mr-3 text-teal-600 hover:text-teal-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => void onDelete(dept)} className="text-rose-600 hover:text-rose-700 hover:underline">
                      Delete
                    </button>
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
