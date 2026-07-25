import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../app/AuthContext';
import { downloadCsv } from '../../utils/csv';
import { BarChart } from '../../components/BarChart';
import type {
  AppointmentReportDto,
  LaboratoryReportDto,
  PatientReportDto,
  PharmacyReportDto,
  RevenueReportDto,
  StaffReportDto,
} from '../../api/types';

function ExportButton({ label, rows }: { label: string; rows: Record<string, string | number>[] }) {
  return (
    <button
      onClick={() => downloadCsv(`${label.toLowerCase().replace(/\s+/g, '-')}.csv`, rows)}
      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
    >
      Export CSV
    </button>
  );
}

function ReportCard({
  title,
  children,
  exportRows,
}: {
  title: string;
  children: React.ReactNode;
  exportRows?: Record<string, string | number>[];
}) {
  return (
    <div className="mb-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {exportRows && exportRows.length > 0 && <ExportButton label={title} rows={exportRows} />}
      </div>
      {children}
    </div>
  );
}

export function ReportsPage() {
  const { hasRole } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [patientReport, setPatientReport] = useState<PatientReportDto | null>(null);
  const [appointmentReport, setAppointmentReport] = useState<AppointmentReportDto | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReportDto | null>(null);
  const [pharmacyReport, setPharmacyReport] = useState<PharmacyReportDto | null>(null);
  const [laboratoryReport, setLaboratoryReport] = useState<LaboratoryReportDto | null>(null);
  const [staffReport, setStaffReport] = useState<StaffReportDto | null>(null);

  const params = () => (from || to ? { from: from || undefined, to: to || undefined } : {});

  const load = async () => {
    const p = params();
    if (hasRole('Administrator', 'Doctor', 'Nurse', 'Receptionist')) {
      const { data } = await apiClient.get<PatientReportDto>('/reports/patients', { params: p });
      setPatientReport(data);
      const { data: apptData } = await apiClient.get<AppointmentReportDto>('/reports/appointments', { params: p });
      setAppointmentReport(apptData);
    }
    if (hasRole('Administrator', 'Accountant')) {
      const { data } = await apiClient.get<RevenueReportDto>('/reports/revenue', { params: p });
      setRevenueReport(data);
    }
    if (hasRole('Administrator', 'Pharmacist')) {
      const { data } = await apiClient.get<PharmacyReportDto>('/reports/pharmacy', { params: p });
      setPharmacyReport(data);
    }
    if (hasRole('Administrator', 'LaboratoryStaff')) {
      const { data } = await apiClient.get<LaboratoryReportDto>('/reports/laboratory', { params: p });
      setLaboratoryReport(data);
    }
    if (hasRole('Administrator')) {
      const { data } = await apiClient.get<StaffReportDto>('/reports/staff', { params: p });
      setStaffReport(data);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Reports</h1>

      <div className="mb-6 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button onClick={() => void load()} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
          Apply
        </button>
      </div>

      {patientReport && (
        <ReportCard title="Patient Report" exportRows={patientReport.byGender.map((g) => ({ name: g.name, count: g.count }))}>
          <p className="mb-3 text-sm text-slate-600">
            Total patients: <strong>{patientReport.totalPatients}</strong> · New registrations: <strong>{patientReport.newRegistrations}</strong>
          </p>
          <BarChart data={patientReport.byGender.map((g) => ({ label: g.name, value: g.count }))} />
        </ReportCard>
      )}

      {appointmentReport && (
        <ReportCard title="Appointment Report" exportRows={appointmentReport.byDoctor.map((d) => ({ name: d.name, count: d.count }))}>
          <p className="mb-3 text-sm text-slate-600">
            Total appointments: <strong>{appointmentReport.total}</strong>
          </p>
          <p className="mb-1 text-xs font-medium text-slate-500">By status</p>
          <div className="mb-4">
            <BarChart data={appointmentReport.byStatus.map((s) => ({ label: s.name, value: s.count }))} />
          </div>
          <p className="mb-1 text-xs font-medium text-slate-500">By doctor</p>
          <BarChart data={appointmentReport.byDoctor.map((d) => ({ label: d.name, value: d.count }))} />
        </ReportCard>
      )}

      {revenueReport && (
        <ReportCard
          title="Revenue Report"
          exportRows={revenueReport.byChargeType.map((c) => ({ chargeType: c.chargeType, amount: c.amount }))}
        >
          <p className="mb-3 text-sm text-slate-600">
            Billed: <strong>{revenueReport.totalBilled.toFixed(2)}</strong> · Collected:{' '}
            <strong>{revenueReport.totalCollected.toFixed(2)}</strong> · Outstanding:{' '}
            <strong className="text-rose-600">{revenueReport.totalOutstanding.toFixed(2)}</strong>
          </p>
          <BarChart
            data={revenueReport.byChargeType.map((c) => ({ label: c.chargeType, value: c.amount }))}
            valueFormatter={(v) => v.toFixed(2)}
          />
        </ReportCard>
      )}

      {pharmacyReport && (
        <ReportCard
          title="Pharmacy Report"
          exportRows={pharmacyReport.lowStock.map((m) => ({ name: m.name, stockQuantity: m.stockQuantity, reorderThreshold: m.reorderThreshold }))}
        >
          <p className="mb-3 text-sm text-slate-600">
            Dispensed value: <strong>{pharmacyReport.totalDispensedValue.toFixed(2)}</strong> · Items dispensed:{' '}
            <strong>{pharmacyReport.dispensedCount}</strong>
          </p>
          <p className="mb-1 text-xs font-medium text-slate-500">Low stock ({pharmacyReport.lowStock.length})</p>
          <div className="mb-4">
            <BarChart data={pharmacyReport.lowStock.map((m) => ({ label: m.name, value: m.stockQuantity }))} />
          </div>
          <p className="mb-1 text-xs font-medium text-slate-500">Expiring within 30 days ({pharmacyReport.expiringSoon.length})</p>
          <ul className="text-sm text-slate-600">
            {pharmacyReport.expiringSoon.map((m) => (
              <li key={m.id}>
                {m.name}: {m.expiryDate}
              </li>
            ))}
            {pharmacyReport.expiringSoon.length === 0 && <li className="text-slate-400">None.</li>}
          </ul>
        </ReportCard>
      )}

      {laboratoryReport && (
        <ReportCard title="Laboratory Report" exportRows={laboratoryReport.byStatus.map((s) => ({ name: s.name, count: s.count }))}>
          <p className="mb-3 text-sm text-slate-600">
            Requested: <strong>{laboratoryReport.totalRequested}</strong> · Completed: <strong>{laboratoryReport.totalCompleted}</strong>
          </p>
          <BarChart data={laboratoryReport.byStatus.map((s) => ({ label: s.name, value: s.count }))} />
        </ReportCard>
      )}

      {staffReport && (
        <ReportCard
          title="Staff Report"
          exportRows={staffReport.attendance.map((a) => ({
            employee: a.employeeName,
            present: a.presentCount,
            absent: a.absentCount,
            late: a.lateCount,
            halfDay: a.halfDayCount,
          }))}
        >
          <p className="mb-3 text-sm text-slate-600">
            Leave requests — Pending: <strong>{staffReport.leave.pending}</strong> · Approved: <strong>{staffReport.leave.approved}</strong> ·
            Rejected: <strong>{staffReport.leave.rejected}</strong>
          </p>
          <p className="mb-1 text-xs font-medium text-slate-500">Days present</p>
          <div className="mb-3">
            <BarChart data={staffReport.attendance.map((a) => ({ label: a.employeeName, value: a.presentCount }))} />
          </div>
          <ul className="text-xs text-slate-500">
            {staffReport.attendance.map((a) => (
              <li key={a.employeeId}>
                {a.employeeName}: Absent {a.absentCount}, Late {a.lateCount}, Half-day {a.halfDayCount}
              </li>
            ))}
          </ul>
        </ReportCard>
      )}
    </div>
  );
}
