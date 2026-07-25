import { useAuth } from '../../app/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, {user?.fullName}</h1>
      <p className="mt-2 text-sm text-slate-500">Role: {user?.roles.join(', ')}</p>
    </div>
  );
}
