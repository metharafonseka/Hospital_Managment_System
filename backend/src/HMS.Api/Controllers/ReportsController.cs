using HMS.Application.Reports;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportsController(IReportService service) : ControllerBase
{
    [Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor},{Roles.Nurse},{Roles.Receptionist}")]
    [HttpGet("patients")]
    public async Task<ActionResult<PatientReportDto>> GetPatientReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetPatientReportAsync(from, to, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor},{Roles.Nurse},{Roles.Receptionist}")]
    [HttpGet("appointments")]
    public async Task<ActionResult<AppointmentReportDto>> GetAppointmentReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetAppointmentReportAsync(from, to, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Accountant}")]
    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportDto>> GetRevenueReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetRevenueReportAsync(from, to, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Pharmacist}")]
    [HttpGet("pharmacy")]
    public async Task<ActionResult<PharmacyReportDto>> GetPharmacyReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetPharmacyReportAsync(from, to, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.LaboratoryStaff}")]
    [HttpGet("laboratory")]
    public async Task<ActionResult<LaboratoryReportDto>> GetLaboratoryReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetLaboratoryReportAsync(from, to, ct));

    [Authorize(Roles = Roles.Administrator)]
    [HttpGet("staff")]
    public async Task<ActionResult<StaffReportDto>> GetStaffReport(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct) =>
        Ok(await service.GetStaffReportAsync(from, to, ct));
}
