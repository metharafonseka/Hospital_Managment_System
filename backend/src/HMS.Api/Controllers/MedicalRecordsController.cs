using System.Security.Claims;
using HMS.Application.Doctors;
using HMS.Application.MedicalRecords;
using HMS.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor},{Roles.Nurse}")]
public class MedicalRecordsController(IMedicalRecordService service, IDoctorService doctorService) : ControllerBase
{
    [HttpGet("medical-records/{id:int}")]
    public async Task<ActionResult<MedicalRecordDto>> GetById(int id, CancellationToken ct)
    {
        var record = await service.GetByIdAsync(id, ct);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpGet("appointments/{appointmentId:int}/medical-record")]
    public async Task<ActionResult<MedicalRecordDto>> GetByAppointment(int appointmentId, CancellationToken ct)
    {
        var record = await service.GetByAppointmentIdAsync(appointmentId, ct);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpGet("patients/{patientId:int}/medical-records")]
    public async Task<ActionResult<IReadOnlyList<MedicalRecordDto>>> GetByPatient(int patientId, CancellationToken ct) =>
        Ok(await service.GetByPatientIdAsync(patientId, ct));

    [Authorize(Roles = $"{Roles.Administrator},{Roles.Doctor}")]
    [HttpPost("medical-records")]
    public async Task<ActionResult<MedicalRecordDto>> Create(CreateMedicalRecordRequest request, CancellationToken ct)
    {
        if (User.IsInRole(Roles.Doctor) && !User.IsInRole(Roles.Administrator))
        {
            var doctor = await doctorService.GetByUserIdAsync(CurrentUserId, ct);
            var appointmentDoctorId = await service.GetAppointmentDoctorIdAsync(request.AppointmentId, ct);
            if (doctor is null || appointmentDoctorId is null || appointmentDoctorId != doctor.Id) return Forbid();
        }

        var (result, record) = await service.CreateAsync(request, ct);
        return result switch
        {
            CreateMedicalRecordResult.Success => CreatedAtAction(nameof(GetById), new { id = record!.Id }, record),
            CreateMedicalRecordResult.AppointmentNotFound => BadRequest(new { message = "Appointment not found." }),
            CreateMedicalRecordResult.AppointmentNotCompletable =>
                BadRequest(new { message = "Only scheduled appointments can be recorded." }),
            CreateMedicalRecordResult.AlreadyRecorded => Conflict(new { message = "This appointment already has a medical record." }),
            _ => BadRequest()
        };
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
}
