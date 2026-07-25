using HMS.Application.Pharmacy;

namespace HMS.Application.Reports;

public record NameCountDto(string Name, int Count);

public record ChargeTypeAmountDto(string ChargeType, decimal Amount);

public record PatientReportDto(int TotalPatients, int NewRegistrations, IReadOnlyList<NameCountDto> ByGender);

public record AppointmentReportDto(int Total, IReadOnlyList<NameCountDto> ByStatus, IReadOnlyList<NameCountDto> ByDoctor);

public record RevenueReportDto(
    decimal TotalBilled, decimal TotalCollected, decimal TotalOutstanding, IReadOnlyList<ChargeTypeAmountDto> ByChargeType);

public record PharmacyReportDto(
    decimal TotalDispensedValue, int DispensedCount, IReadOnlyList<MedicineDto> LowStock, IReadOnlyList<MedicineDto> ExpiringSoon);

public record LaboratoryReportDto(int TotalRequested, int TotalCompleted, IReadOnlyList<NameCountDto> ByStatus);

public record EmployeeAttendanceSummaryDto(
    int EmployeeId, string EmployeeName, int PresentCount, int AbsentCount, int LateCount, int HalfDayCount);

public record LeaveSummaryDto(int Pending, int Approved, int Rejected);

public record StaffReportDto(IReadOnlyList<EmployeeAttendanceSummaryDto> Attendance, LeaveSummaryDto Leave);
