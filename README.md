# 🏥 CareSphere - Hospital Management System (HMS)

A full-stack **Hospital Management System** designed to streamline hospital operations by managing patients, doctors, appointments, medical records, pharmacy, laboratory services, billing, and staff activities in one centralized platform.

## 🚀 Features

### 🔐 Authentication & User Management

* JWT-based secure authentication
* Role-based access control
* User management for:

  * 👨‍💼 Administrators
  * 👨‍⚕️ Doctors
  * 👩‍⚕️ Nurses
  * 🧑‍💻 Receptionists
  * 🔬 Laboratory Staff
  * 💊 Pharmacists
  * 💰 Accountants

### 🧑‍🤝‍🧑 Patient Management

* Register and update patient information
* Search patient records
* View medical history
* Manage patient records

### 👨‍⚕️ Doctor & Appointment Management

* Manage doctor profiles and departments
* Schedule doctor availability
* Book, cancel, and reschedule appointments
* Track appointment status
* Generate available appointment slots

### 📋 Electronic Medical Records

* Record patient diagnosis
* Manage prescriptions
* Maintain treatment history

### 🔬 Laboratory Management

* Manage test requests
* Manage sample collection
* Record test results
* Generate laboratory reports

### 💊 Pharmacy Management

* Medicine inventory management
* Prescription processing
* Stock monitoring
* Expiry tracking

### 💳 Billing & Payments

* Generate invoices
* Manage consultation, laboratory, pharmacy, and admission charges
* Automatically aggregate billing charges
* Record payments

### 👥 Staff Management

* Employee registration
* Department assignment
* Attendance management
* Leave management

### 📊 Reports Dashboard

* Patient statistics
* Appointment summaries
* Revenue reports
* Pharmacy analytics
* Laboratory analytics
* Staff reports
* CSV export for reports

---

## 🛠️ Technology Stack

### Backend

* 💻 C# / .NET 9
* 🌐 ASP.NET Core Web API
* 🔒 ASP.NET Core Identity + JWT Bearer Authentication
* 🗄️ SQL Server 
* 🔗 Entity Framework Core
* 🔑 Access and Refresh Token Authentication

### Frontend

* ⚛️ React.js
* ⚡ Vite
* 🟦 TypeScript
* 🎨 Tailwind CSS v4
* 🔄 Axios
* 🧭 React Router
* 🎯 Lucide React

---

## 📁 Project Structure

```text
Hospital_Managment_System/
├── backend/
│   ├── HMS.sln
│   ├── src/
│   │   ├── HMS.Domain            # Entities, enums, constants
│   │   ├── HMS.Application       # Business logic, per module
│   │   ├── HMS.Infrastructure    # EF Core, Migrations, Identity
│   │   └── HMS.Api               # Controllers, DTOs, Services
│   └── tests/
│       ├── HMS.UnitTests         # Scaffolded
│       └── HMS.IntegrationTests  # Scaffolded
├── frontend/
│   └── hms-web/
│       └── src/
│           ├── api/
│           ├── app/
│           ├── components/
│           ├── routes/
│           ├── utils/
│           └── features/
│               ├── appointments
│               ├── auth
│               ├── billing
│               ├── dashboard
│               ├── departments
│               ├── doctors
│               ├── laboratory
│               ├── patients
│               ├── pharmacy
│               ├── reports
│               ├── staff
│               └── users
└── package.json                 
```

Each Application and Infrastructure layer is organized by business module, including Appointments, Billing, Departments, Doctors, Laboratory, Medical Records, Patients, Pharmacy, Reports, Staff, and Users.

---

## ⚙️ Installation & Setup

### Prerequisites

* .NET 9 SDK
* Node.js 18+ recommended
* SQL Server 

### Backend Setup

```bash
git clone <repository-url>

cd backend/src/HMS.Api

dotnet ef database update

dotnet run
```

### Frontend Setup

```bash
cd frontend/hms-web

npm install

npm run dev
```

### Run Both Backend and Frontend

From the repository root:

```bash
npm install

npm run dev
```

Or run them individually:

```bash
npm run dev:api   # ASP.NET Core API
npm run dev:web   # Vite development server
```

---

## 🔑 User Access

The system provides different access levels based on user roles:

* 👨‍💼 Admin → Full system management
* 👨‍⚕️ Doctor → Patient records, diagnosis, prescriptions
* 👩‍⚕️ Nurse → Patient care management
* 🧑‍💻 Receptionist → Patient registration and appointments
* 🔬 Laboratory Staff → Tests and reports
* 💊 Pharmacist → Medicines and prescriptions
* 💰 Accountant → Billing and payments

---

## 🔐 Authentication & Authorization

* ASP.NET Core Identity with JWT authentication
* Access and refresh token authentication
* Login, refresh, logout, and change-password functionality
* Role-based access control for seven hospital roles
* Per-endpoint authorization enforcement
* Audit log visibility restricted to Administrators

---

## 🎯 Project Goal

To provide an efficient, secure, and user-friendly digital platform that improves hospital workflow, reduces manual processes, and enables better healthcare service management.

---

## 👨‍💻 Developed By

**Methara Fonseka**
