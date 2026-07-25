namespace HMS.Application.Billing;

public interface IBillingService
{
    Task<IReadOnlyList<InvoiceDto>> GetAllAsync(int? patientId, string? status, CancellationToken ct = default);
    Task<InvoiceDto?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<(GenerateInvoiceResult Result, InvoiceDto? Invoice)> GenerateAsync(
        GenerateInvoiceRequest request, CancellationToken ct = default);

    Task<(RecordPaymentResult Result, InvoiceDto? Invoice)> RecordPaymentAsync(
        int invoiceId, RecordPaymentRequest request, CancellationToken ct = default);
}
