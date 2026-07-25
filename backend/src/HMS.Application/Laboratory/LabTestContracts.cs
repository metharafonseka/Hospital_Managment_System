using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Laboratory;

public record LabTestRequestDto(
    int Id,
    int MedicalRecordId,
    int PatientId,
    string PatientName,
    string TestName,
    string Status,
    decimal Price,
    DateTime RequestedAtUtc,
    DateTime? SampleCollectedAtUtc,
    string? ResultText,
    DateTime? ResultEnteredAtUtc);

public record EnterResultRequest([Required, StringLength(2000)] string ResultText);

public record SetLabTestPriceRequest([Range(0, 1000000)] decimal Price);

public enum LabTestActionResult { Success, NotFound, InvalidState }
