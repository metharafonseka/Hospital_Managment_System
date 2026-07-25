namespace HMS.Application.Laboratory;

public interface ILabTestService
{
    Task<IReadOnlyList<LabTestRequestDto>> GetAllAsync(string? status, CancellationToken ct = default);
    Task<IReadOnlyList<LabTestRequestDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default);
    Task<LabTestRequestDto?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<LabTestActionResult> CollectSampleAsync(int id, CancellationToken ct = default);
    Task<LabTestActionResult> EnterResultAsync(int id, EnterResultRequest request, CancellationToken ct = default);
    Task<bool> SetPriceAsync(int id, SetLabTestPriceRequest request, CancellationToken ct = default);
}
