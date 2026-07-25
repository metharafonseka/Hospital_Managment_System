export const ROLES = [
  'Administrator',
  'Doctor',
  'Nurse',
  'Receptionist',
  'LaboratoryStaff',
  'Pharmacist',
  'Accountant',
] as const;

export type Role = (typeof ROLES)[number];

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName: string;
  roles: Role[];
}

export interface DepartmentDto {
  id: number;
  name: string;
  description: string | null;
  doctorCount: number;
}

export interface DoctorScheduleDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorDto {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  departmentId: number;
  departmentName: string;
  specialization: string;
  licenseNumber: string;
  consultationFee: number;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: Role[];
}

export interface PatientDto {
  id: number;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string | null;
  address: string | null;
  emergencyContact: string | null;
}

export const APPOINTMENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface AppointmentDto {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
}

export interface PrescriptionItemDto {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
  status: 'Pending' | 'Dispensed' | 'Cancelled';
}

export interface LabTestOrderDto {
  id: number;
  testName: string;
  status: 'Requested' | 'SampleCollected' | 'Completed' | 'Cancelled';
}

export interface MedicalRecordDto {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  visitDate: string;
  diagnosis: string;
  notes: string | null;
  createdAtUtc: string;
  prescriptions: PrescriptionItemDto[];
  labTests: LabTestOrderDto[];
}

export interface LabTestRequestDto {
  id: number;
  medicalRecordId: number;
  patientId: number;
  patientName: string;
  testName: string;
  status: 'Requested' | 'SampleCollected' | 'Completed' | 'Cancelled';
  price: number;
  requestedAtUtc: string;
  sampleCollectedAtUtc: string | null;
  resultText: string | null;
  resultEnteredAtUtc: string | null;
}

export interface MedicineDto {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  unitPrice: number;
  expiryDate: string;
  reorderThreshold: number;
}

export interface PendingPrescriptionDto {
  id: number;
  medicalRecordId: number;
  patientId: number;
  patientName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
  status: 'Pending' | 'Dispensed' | 'Cancelled';
  prescribedAtUtc: string;
}

export interface InvoiceLineItemDto {
  id: number;
  chargeType: 'Consultation' | 'Laboratory' | 'Pharmacy' | 'Other';
  description: string;
  amount: number;
}

export interface PaymentDto {
  id: number;
  amount: number;
  method: string;
  paidAtUtc: string;
}

export interface InvoiceDto {
  id: number;
  patientId: number;
  patientName: string;
  createdAtUtc: string;
  status: 'Unpaid' | 'PartiallyPaid' | 'Paid';
  totalAmount: number;
  amountPaid: number;
  lineItems: InvoiceLineItemDto[];
  payments: PaymentDto[];
}

export interface EmployeeDto {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: number;
  departmentName: string;
  jobTitle: string;
  hireDate: string;
}

export interface AttendanceRecordDto {
  id: number;
  employeeId: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay';
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
}

export interface LeaveRequestDto {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAtUtc: string;
  decidedAtUtc: string | null;
}

export interface NameCountDto {
  name: string;
  count: number;
}

export interface ChargeTypeAmountDto {
  chargeType: string;
  amount: number;
}

export interface PatientReportDto {
  totalPatients: number;
  newRegistrations: number;
  byGender: NameCountDto[];
}

export interface AppointmentReportDto {
  total: number;
  byStatus: NameCountDto[];
  byDoctor: NameCountDto[];
}

export interface RevenueReportDto {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  byChargeType: ChargeTypeAmountDto[];
}

export interface PharmacyReportDto {
  totalDispensedValue: number;
  dispensedCount: number;
  lowStock: MedicineDto[];
  expiringSoon: MedicineDto[];
}

export interface LaboratoryReportDto {
  totalRequested: number;
  totalCompleted: number;
  byStatus: NameCountDto[];
}

export interface EmployeeAttendanceSummaryDto {
  employeeId: number;
  employeeName: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
}

export interface LeaveSummaryDto {
  pending: number;
  approved: number;
  rejected: number;
}

export interface StaffReportDto {
  attendance: EmployeeAttendanceSummaryDto[];
  leave: LeaveSummaryDto;
}
