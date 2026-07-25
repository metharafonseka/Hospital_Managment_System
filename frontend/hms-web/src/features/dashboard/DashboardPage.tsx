import { useEffect, useState } from 'react';
import { Users, CalendarCheck, DollarSign, FlaskConical, Pill } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../app/AuthContext';
import { StatCard } from '../../components/StatCard';
import type { AppointmentReportDto, LaboratoryReportDto, PatientReportDto, PharmacyReportDto, RevenueReportDto } from '../../api/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  const [patientReport, setPatientReport] = useState<PatientReportDto | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<AppointmentReportDto | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReportDto | null>(null);
  const [pharmacyReport, setPharmacyReport] = useState<PharmacyReportDto | null>(null);
  const [laboratoryReport, setLaboratoryReport] = useState<LaboratoryReportDto | null>(null);

  useEffect(() => {
    const today = todayIso();
    if (hasRole('Administrator', 'Doctor', 'Nurse', 'Receptionist')) {
      void apiClient.get<PatientReportDto>('/reports/patients').then((r) => setPatientReport(r.data));
      void apiClient
        .get<AppointmentReportDto>('/reports/appointments', { params: { from: today, to: today } })
        .then((r) => setTodaysAppointments(r.data));
    }
    if (hasRole('Administrator', 'Accountant')) {
      void apiClient.get<RevenueReportDto>('/reports/revenue').then((r) => setRevenueReport(r.data));
    }
    if (hasRole('Administrator', 'Pharmacist')) {
      void apiClient.get<PharmacyReportDto>('/reports/pharmacy').then((r) => setPharmacyReport(r.data));
    }
    if (hasRole('Administrator', 'LaboratoryStaff')) {
      void apiClient.get<LaboratoryReportDto>('/reports/laboratory').then((r) => setLaboratoryReport(r.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingLabTests = laboratoryReport ? laboratoryReport.totalRequested - laboratoryReport.totalCompleted : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">Welcome, {user?.fullName}</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">{user?.roles.join(', ')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {patientReport && <StatCard label="Total Patients" value={patientReport.totalPatients} icon={Users} accent="teal" />}
        {todaysAppointments && (
          <StatCard label="Today's Appointments" value={todaysAppointments.total} icon={CalendarCheck} accent="blue" />
        )}
        {revenueReport && (
          <StatCard label="Revenue Collected" value={revenueReport.totalCollected.toFixed(2)} icon={DollarSign} accent="teal" />
        )}
        {pendingLabTests !== null && (
          <StatCard label="Pending Lab Requests" value={pendingLabTests} icon={FlaskConical} accent="amber" />
        )}
        {pharmacyReport && (
          <StatCard label="Low-Stock Medicines" value={pharmacyReport.lowStock.length} icon={Pill} accent="rose" />
        )}
      </div>
    </div>
  );
}
