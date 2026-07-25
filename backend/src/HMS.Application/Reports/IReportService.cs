namespace HMS.Application.Reports;

public interface IReportService
{
    Task<PatientReportDto> GetPatientReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<AppointmentReportDto> GetAppointmentReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<RevenueReportDto> GetRevenueReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<PharmacyReportDto> GetPharmacyReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<LaboratoryReportDto> GetLaboratoryReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<StaffReportDto> GetStaffReportAsync(DateOnly? from, DateOnly? to, CancellationToken ct = default);
}
