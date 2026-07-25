import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { Layout } from './app/Layout';
import { ToastProvider } from './components/ToastProvider';
import { ConfirmProvider } from './components/ConfirmProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DepartmentsPage } from './features/departments/DepartmentsPage';
import { DoctorsPage } from './features/doctors/DoctorsPage';
import { UsersPage } from './features/users/UsersPage';
import { PatientsPage } from './features/patients/PatientsPage';
import { AppointmentsPage } from './features/appointments/AppointmentsPage';
import { MyAppointmentsPage } from './features/appointments/MyAppointmentsPage';
import { LaboratoryPage } from './features/laboratory/LaboratoryPage';
import { PharmacyPage } from './features/pharmacy/PharmacyPage';
import { BillingPage } from './features/billing/BillingPage';
import { StaffPage } from './features/staff/StaffPage';
import { ReportsPage } from './features/reports/ReportsPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <ConfirmProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route element={<ProtectedRoute roles={['Administrator']} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Administrator', 'Receptionist', 'Nurse']} />}>
                <Route path="/appointments" element={<AppointmentsPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Doctor']} />}>
                <Route path="/appointments/mine" element={<MyAppointmentsPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Administrator', 'Doctor', 'Nurse', 'LaboratoryStaff']} />}>
                <Route path="/laboratory" element={<LaboratoryPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Administrator', 'Pharmacist']} />}>
                <Route path="/pharmacy" element={<PharmacyPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Administrator', 'Accountant', 'Receptionist']} />}>
                <Route path="/billing" element={<BillingPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['Administrator']} />}>
                <Route path="/staff" element={<StaffPage />} />
              </Route>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
      </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
