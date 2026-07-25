import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', roles: undefined },
  { to: '/patients', label: 'Patients', roles: undefined },
  { to: '/appointments', label: 'Appointments', roles: ['Administrator', 'Receptionist', 'Nurse'] },
  { to: '/appointments/mine', label: 'My Appointments', roles: ['Doctor'] },
  { to: '/departments', label: 'Departments', roles: undefined },
  { to: '/doctors', label: 'Doctors', roles: undefined },
  { to: '/laboratory', label: 'Laboratory', roles: ['Administrator', 'Doctor', 'Nurse', 'LaboratoryStaff'] },
  { to: '/pharmacy', label: 'Pharmacy', roles: ['Administrator', 'Pharmacist'] },
  { to: '/billing', label: 'Billing', roles: ['Administrator', 'Accountant', 'Receptionist'] },
  { to: '/staff', label: 'Staff', roles: ['Administrator'] },
  { to: '/reports', label: 'Reports', roles: undefined },
  { to: '/users', label: 'Users', roles: ['Administrator'] },
] as const;

export function Layout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 text-lg font-semibold text-slate-800">HMS</div>
        <nav className="flex flex-col gap-1">
          {navItems
            .filter((item) => !item.roles || hasRole(...item.roles))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            {user?.fullName} <span className="text-slate-400">({user?.roles.join(', ')})</span>
          </div>
          <button
            onClick={() => void logout()}
            className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Logout
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
