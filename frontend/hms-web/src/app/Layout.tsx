import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarClock,
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  UserCog,
  BarChart3,
  ShieldCheck,
  LogOut,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from './AuthContext';

const navGroups = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: undefined }],
  },
  {
    label: 'Care',
    items: [
      { to: '/patients', label: 'Patients', icon: Users, roles: undefined },
      { to: '/appointments', label: 'Appointments', icon: CalendarCheck, roles: ['Administrator', 'Receptionist', 'Nurse'] },
      { to: '/appointments/mine', label: 'My Appointments', icon: CalendarClock, roles: ['Doctor'] },
      { to: '/departments', label: 'Departments', icon: Building2, roles: undefined },
      { to: '/doctors', label: 'Doctors', icon: Stethoscope, roles: undefined },
      { to: '/laboratory', label: 'Laboratory', icon: FlaskConical, roles: ['Administrator', 'Doctor', 'Nurse', 'LaboratoryStaff'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/pharmacy', label: 'Pharmacy', icon: Pill, roles: ['Administrator', 'Pharmacist'] },
      { to: '/billing', label: 'Billing', icon: Receipt, roles: ['Administrator', 'Accountant', 'Receptionist'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/staff', label: 'Staff', icon: UserCog, roles: ['Administrator'] },
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: undefined },
      { to: '/users', label: 'Users', icon: ShieldCheck, roles: ['Administrator'] },
    ],
  },
] as const;

export function Layout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <HeartPulse className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-800">CareSphere</span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
          {navGroups.map((group, gi) => {
            const visibleItems = group.items.filter((item) => !item.roles || hasRole(...item.roles));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi}>
                {group.label && (
                  <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                )}
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">{user?.fullName}</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
              {user?.roles.join(', ')}
            </span>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
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
