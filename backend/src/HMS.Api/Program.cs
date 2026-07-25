using System.Text;
using System.Text.Json.Serialization;
using HMS.Api.Services;
using HMS.Application.Appointments;
using HMS.Application.Billing;
using HMS.Application.Departments;
using HMS.Application.Doctors;
using HMS.Application.Laboratory;
using HMS.Application.MedicalRecords;
using HMS.Application.Patients;
using HMS.Application.Pharmacy;
using HMS.Application.Reports;
using HMS.Application.Staff;
using HMS.Application.Users;
using HMS.Infrastructure.Appointments;
using HMS.Infrastructure.Billing;
using HMS.Infrastructure.Data;
using HMS.Infrastructure.Departments;
using HMS.Infrastructure.Doctors;
using HMS.Infrastructure.Identity;
using HMS.Infrastructure.Laboratory;
using HMS.Infrastructure.MedicalRecords;
using HMS.Infrastructure.Patients;
using HMS.Infrastructure.Pharmacy;
using HMS.Infrastructure.Reports;
using HMS.Infrastructure.Staff;
using HMS.Infrastructure.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<ILabTestService, LabTestService>();
builder.Services.AddScoped<IMedicineService, MedicineService>();
builder.Services.AddScoped<IPrescriptionProcessingService, PrescriptionProcessingService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IReportService, ReportService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    await IdentitySeeder.SeedAsync(scope.ServiceProvider, app.Configuration);
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
