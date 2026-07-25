import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../api/client';
import type { DepartmentDto } from '../../api/types';
import { useAuth } from '../../app/AuthContext';

export function DepartmentsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator');

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  };

  const startEdit = (dept: DepartmentDto) => {
    setEditing(dept);
    setName(dept.name);
    setDescription(dept.description ?? '');
    setShowForm(true);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await apiClient.put(`/departments/${editing.id}`, { name, description });
      } else {
        await apiClient.post('/departments', { name, description });
      }
      setShowForm(false);
      await load();
    } catch {
      setError('Failed to save department.');
    }
  };

  const onDelete = async (dept: DepartmentDto) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    try {
      await apiClient.delete(`/departments/${dept.id}`);
      await load();
    } catch {
      setError('Cannot delete a department with assigned doctors.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Departments</h1>
        {canManage && (
          <button
            onClick={startCreate}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add Department
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 max-w-md rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {editing ? 'Edit Department' : 'New Department'}
          </h2>
          <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
        <table className="w-full max-w-3xl border-collapse overflow-hidden rounded border border-slate-200 bg-white text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Doctors</th>
              {canManage && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{dept.name}</td>
                <td className="px-3 py-2 text-slate-500">{dept.description}</td>
                <td className="px-3 py-2 text-slate-500">{dept.doctorCount}</td>
                {canManage && (
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(dept)} className="mr-3 text-slate-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => void onDelete(dept)} className="text-red-600 hover:underline">
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
