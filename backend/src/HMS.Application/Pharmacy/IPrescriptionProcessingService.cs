namespace HMS.Application.Pharmacy;

public interface IPrescriptionProcessingService
{
    Task<IReadOnlyList<PendingPrescriptionDto>> GetPendingAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PendingPrescriptionDto>> GetByPatientIdAsync(int patientId, CancellationToken ct = default);
    Task<DispenseResult> DispenseAsync(int prescriptionItemId, DispenseRequest request, CancellationToken ct = default);
    Task<bool> CancelAsync(int prescriptionItemId, CancellationToken ct = default);
}
