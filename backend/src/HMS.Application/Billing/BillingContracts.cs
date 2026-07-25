using System.ComponentModel.DataAnnotations;

namespace HMS.Application.Billing;

public record InvoiceLineItemDto(int Id, string ChargeType, string Description, decimal Amount);

public record PaymentDto(int Id, decimal Amount, string Method, DateTime PaidAtUtc);

public record InvoiceDto(
    int Id,
    int PatientId,
    string PatientName,
    DateTime CreatedAtUtc,
    string Status,
    decimal TotalAmount,
    decimal AmountPaid,
    IReadOnlyList<InvoiceLineItemDto> LineItems,
    IReadOnlyList<PaymentDto> Payments);

public record ManualLineItemRequest([Required, StringLength(300)] string Description, [Range(0.01, 1000000)] decimal Amount);

public record GenerateInvoiceRequest([Required] int PatientId, List<ManualLineItemRequest> AdditionalLineItems);

public record RecordPaymentRequest([Range(0.01, 1000000)] decimal Amount, [Required, StringLength(50)] string Method);

public enum GenerateInvoiceResult { Success, PatientNotFound, NothingToBill }

public enum RecordPaymentResult { Success, InvoiceNotFound, ExceedsBalance }
