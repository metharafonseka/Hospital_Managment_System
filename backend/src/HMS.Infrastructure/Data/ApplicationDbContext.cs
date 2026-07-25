using HMS.Domain.Entities;
using HMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<LabTestRequest> LabTestRequests => Set<LabTestRequest>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Doctor>()
            .HasOne(d => d.Department)
            .WithMany(dep => dep.Doctors)
            .HasForeignKey(d => d.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DoctorSchedule>()
            .HasOne(s => s.Doctor)
            .WithMany(d => d.Schedules)
            .HasForeignKey(s => s.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Doctor>()
            .HasIndex(d => d.UserId)
            .IsUnique();

        builder.Entity<Patient>()
            .HasIndex(p => p.PatientCode)
            .IsUnique();

        builder.Entity<Appointment>()
            .HasOne(a => a.Patient)
            .WithMany()
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Appointment>()
            .HasOne(a => a.Doctor)
            .WithMany()
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Appointment>()
            .HasIndex(a => new { a.DoctorId, a.Date });

        builder.Entity<Appointment>()
            .Property(a => a.RowVersion)
            .IsRowVersion();

        builder.Entity<MedicalRecord>()
            .HasOne(m => m.Appointment)
            .WithMany()
            .HasForeignKey(m => m.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<MedicalRecord>()
            .HasIndex(m => m.AppointmentId)
            .IsUnique();

        builder.Entity<MedicalRecord>()
            .HasOne(m => m.Patient)
            .WithMany()
            .HasForeignKey(m => m.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<MedicalRecord>()
            .HasOne(m => m.Doctor)
            .WithMany()
            .HasForeignKey(m => m.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PrescriptionItem>()
            .HasOne(p => p.MedicalRecord)
            .WithMany(m => m.PrescriptionItems)
            .HasForeignKey(p => p.MedicalRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<PrescriptionItem>()
            .HasOne(p => p.DispensedMedicine)
            .WithMany()
            .HasForeignKey(p => p.DispensedMedicineId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PrescriptionItem>()
            .Property(p => p.UnitPriceAtDispense)
            .HasPrecision(18, 2);

        builder.Entity<LabTestRequest>()
            .HasOne(l => l.MedicalRecord)
            .WithMany()
            .HasForeignKey(l => l.MedicalRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<LabTestRequest>()
            .HasOne(l => l.Patient)
            .WithMany()
            .HasForeignKey(l => l.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<LabTestRequest>()
            .Property(l => l.Price)
            .HasPrecision(18, 2);

        builder.Entity<Medicine>()
            .Property(m => m.UnitPrice)
            .HasPrecision(18, 2);

        builder.Entity<Doctor>()
            .Property(d => d.ConsultationFee)
            .HasPrecision(18, 2);

        builder.Entity<Invoice>()
            .HasOne(i => i.Patient)
            .WithMany()
            .HasForeignKey(i => i.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Invoice>().Property(i => i.TotalAmount).HasPrecision(18, 2);
        builder.Entity<Invoice>().Property(i => i.AmountPaid).HasPrecision(18, 2);

        builder.Entity<InvoiceLineItem>()
            .HasOne(l => l.Invoice)
            .WithMany(i => i.LineItems)
            .HasForeignKey(l => l.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<InvoiceLineItem>().Property(l => l.Amount).HasPrecision(18, 2);

        builder.Entity<Payment>()
            .HasOne(p => p.Invoice)
            .WithMany(i => i.Payments)
            .HasForeignKey(p => p.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Payment>().Property(p => p.Amount).HasPrecision(18, 2);

        builder.Entity<Employee>()
            .HasOne(e => e.Department)
            .WithMany()
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Employee>()
            .HasIndex(e => e.UserId)
            .IsUnique();

        builder.Entity<AttendanceRecord>()
            .HasOne(a => a.Employee)
            .WithMany()
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AttendanceRecord>()
            .HasIndex(a => new { a.EmployeeId, a.Date })
            .IsUnique();

        builder.Entity<LeaveRequest>()
            .HasOne(l => l.Employee)
            .WithMany()
            .HasForeignKey(l => l.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
