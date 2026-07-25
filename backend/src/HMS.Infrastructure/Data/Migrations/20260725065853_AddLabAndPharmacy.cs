using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HMS.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLabAndPharmacy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DispensedAtUtc",
                table: "PrescriptionItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DispensedMedicineId",
                table: "PrescriptionItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DispensedQuantity",
                table: "PrescriptionItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "PrescriptionItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPriceAtDispense",
                table: "PrescriptionItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LabTestRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MedicalRecordId = table.Column<int>(type: "int", nullable: false),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    TestName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SampleCollectedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResultText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResultEnteredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabTestRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabTestRequests_MedicalRecords_MedicalRecordId",
                        column: x => x.MedicalRecordId,
                        principalTable: "MedicalRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LabTestRequests_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Medicines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StockQuantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ReorderThreshold = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medicines", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionItems_DispensedMedicineId",
                table: "PrescriptionItems",
                column: "DispensedMedicineId");

            migrationBuilder.CreateIndex(
                name: "IX_LabTestRequests_MedicalRecordId",
                table: "LabTestRequests",
                column: "MedicalRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_LabTestRequests_PatientId",
                table: "LabTestRequests",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_PrescriptionItems_Medicines_DispensedMedicineId",
                table: "PrescriptionItems",
                column: "DispensedMedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PrescriptionItems_Medicines_DispensedMedicineId",
                table: "PrescriptionItems");

            migrationBuilder.DropTable(
                name: "LabTestRequests");

            migrationBuilder.DropTable(
                name: "Medicines");

            migrationBuilder.DropIndex(
                name: "IX_PrescriptionItems_DispensedMedicineId",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "DispensedAtUtc",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "DispensedMedicineId",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "DispensedQuantity",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "UnitPriceAtDispense",
                table: "PrescriptionItems");
        }
    }
}
