# Hospital Management System (HMS) — Full-Stack Business Application

**Candidate Assessment Submission**  
**Company:** ALGIONS AI LABS PRIVATE LIMITED  
**Track:** Full-Stack Web Development | Advanced Individual Project Assessment  
**Assigned Project:** Hospital Management System  

---

## 1. Executive Summary & Architecture

This application is a responsive, database-backed Hospital Management System built as a maintainable **Modular Monolith** using **Next.js 15 (App Router)**, **React 19**, **Prisma ORM**, **PostgreSQL (Neon)**, **Tailwind CSS**, and **Clerk Authentication**.

It supports the core operations of a healthcare facility across four distinct operational roles with strict server-side authorization:
1. **Patient**: Discovers clinicians by department/specialty, books appointments in available real-time slots, and reviews visit history.
2. **Clinician / Doctor**: Manages working availability slots, accesses clinical consultation queues, records encounter metadata, diagnostic notes, and issues itemized prescriptions.
3. **Front-Desk / Staff**: Manages patient registration, handles counter appointment booking, monitors today's queue, and oversees billing & sandbox payments.
4. **Administrator**: Manages doctor credentials & verifications, oversees department directories, and inspects the real-time **Audit Trail** of sensitive patient and clinical record actions.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 15 FRONTEND (UI)                        │
│  Patient Portal  │  Doctor Dashboard  │  Front-Desk Desk  │  Admin Panel │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│              SERVER-SIDE BUSINESS LOGIC & RBAC GUARDS                  │
│   • lib/rbac.js (requireRole, getAuthenticatedUser, createAuditLog)    │
│   • middleware.js (Clerk Route Protection & Session Checks)           │
│   • Server Actions (actions/appointments.js, visits.js, billing.js)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│               PERSISTENCE & CONSTRAINTS (PRISMA + NEON)                │
│   • Interactive Transactions ($transaction)                           │
│   • Concurrency Constraint: UNIQUE(doctorId, startTime)                │
│   • Audit Logging & Invoice Reconciliation Engine                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Role-Based Access Control (RBAC) Matrix

Server-side authorization is strictly enforced on all Server Actions and layouts via `requireRole()`. Access is never gated solely by hiding buttons on the client.

| Feature / Resource | Patient | Clinician (Doctor) | Front-Desk | Administrator |
|---|:---:|:---:|:---:|:---:|
| Browse Doctors & Availability Slots | ✅ | ✅ | ✅ | ✅ |
| Book / Reschedule Appointment | ✅ (Self) | ❌ | ✅ (All Patients) | ✅ |
| Manage Working Hours & Slots | ❌ | ✅ (Own) | ❌ | ✅ |
| Record Clinical Notes & Prescriptions | ❌ | ✅ (Assigned Doctor) | ❌ (Blocked) | ✅ |
| Read Confidential Clinical Notes | ✅ (Own) | ✅ (Assigned Doctor) | ❌ (Strictly Blocked) | ✅ |
| Generate / Modify Invoices | ❌ | ❌ | ✅ | ✅ |
| Settle Payment (Sandbox Simulation) | ✅ (Own) | ❌ | ✅ | ✅ |
| Verify / Suspend Doctors | ❌ | ❌ | ❌ | ✅ |
| Inspect System Audit Trail | ❌ | ❌ | ❌ | ✅ |

---

## 3. Database Entity-Relationship (ER) Diagram

The system uses a normalized relational schema with strict indexes and database-level constraints to guarantee consistency.

```mermaid
erDiagram
    USER ||--o{ AUDIT_LOG : "triggers"
    USER ||--o{ AVAILABILITY : "sets (as doctor)"
    USER ||--o{ APPOINTMENT : "attends (as patient/doctor)"
    USER ||--o{ VISIT_RECORD : "records (as doctor)"
    USER ||--o{ PRESCRIPTION : "issues (as doctor)"
    USER ||--o{ INVOICE : "billed to (as patient)"
    DEPARTMENT ||--o{ USER : "has doctors"

    USER {
        string id PK
        string clerkUserId UK
        string email UK
        string name
        enum role "ADMIN, DOCTOR, FRONT_DESK, PATIENT, UNASSIGNED"
        string specialty
        int experience
        enum verificationStatus "PENDING, VERIFIED, REJECTED"
        float consultationFee
        string departmentId FK
    }

    DEPARTMENT {
        string id PK
        string name UK
        string description
    }

    AVAILABILITY {
        string id PK
        string doctorId FK
        datetime startTime
        datetime endTime
        enum status "AVAILABLE, BOOKED, BLOCKED"
    }

    APPOINTMENT {
        string id PK
        string patientId FK
        string doctorId FK
        datetime startTime
        datetime endTime
        enum status "SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED"
        string patientDescription
    }

    VISIT_RECORD {
        string id PK
        string appointmentId FK,UK
        string doctorId FK
        string symptoms
        string diagnosis
        string clinicianNotes
        datetime followUpDate
    }

    PRESCRIPTION {
        string id PK
        string visitRecordId FK
        string doctorId FK
        string medicineName
        string dosage
        string frequency
        string duration
    }

    INVOICE {
        string id PK
        string invoiceNumber UK
        string patientId FK
        string appointmentId FK,UK
        float totalAmount
        enum status "UNPAID, PARTIALLY_PAID, PAID, CANCELLED"
    }

    INVOICE_ITEM {
        string id PK
        string invoiceId FK
        string description
        float unitPrice
        int quantity
        float amount
    }

    PAYMENT {
        string id PK
        string invoiceId FK
        float amount
        enum paymentMethod "CASH, CARD, UPI, SIMULATED_GATEWAY"
        string transactionRef
        enum status "SUCCESS, FAILED, REFUNDED"
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string action
        string resourceType
        string resourceId
        string details
        datetime timestamp
    }
```

---

## 4. Acceptance Criteria Demonstration (5/5 Passed)

| # | Acceptance Test | Implementation Evidence | Test Command |
|---|---|---|---|
| **1** | **Patient booked into available slot** | Patient selects doctor & date slot; interactive transaction generates `Appointment` and reserves slot. | `npm test` (Test 1) |
| **2** | **Conflicting appointments prevented (Concurrency)** | Enforced via PostgreSQL constraint `UNIQUE(doctorId, startTime)` and interactive `$transaction` overlap check. | `npm test` (Test 2) |
| **3** | **Role-based read/update access control** | `actions/visits.js` blocks Front-Desk from reading/editing clinical notes; clinician restricted to assigned patients. | `npm test` (Test 3) |
| **4** | **Invoice reconciliation with line items & payments** | `actions/billing.js` validates `totalAmount === SUM(lineItems.amount)`. Payment updates invoice to `PAID`. | `npm test` (Test 4) |
| **5** | **Sensitive record audit trail** | `createAuditLog()` logs all sensitive clinical notes views, updates, and payments into `AuditLog`. | `npm test` (Test 5) |

---

## 5. Local Setup Guide (Reproducible in < 3 Minutes)

### Prerequisites:
- Node.js 18+ (tested on v20/v22)
- Git

### Step 1: Clone and install dependencies
```bash
git clone <YOUR_REPO_URL>
cd hospital-management-system
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

DATABASE_URL="postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
```

### Step 3: Seed Synthetic Data
Initializes departments, 3 verified doctors with tomorrow's working slots, front-desk staff, and demo patients:
```bash
npm run seed
```

### Step 4: Run Automated Acceptance Tests
Executes the comprehensive automated verification suite:
```bash
npm test
```
*Expected Output:* `🏁 TEST RESULTS: 5/5 Acceptance Tests PASSED`.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 6. Demo Accounts & Walkthrough Journey

When signing in via Clerk, you can onboard into any role or use the pre-seeded accounts:

| Role | Pre-Seeded Account | Access Route | Typical Journey to Test |
|---|---|---|---|
| **Patient** | `patient@hospital.test` | `/doctors`, `/appointments` | 1. Browse doctors by department.<br>2. Select tomorrow's available slot and confirm booking.<br>3. View scheduled appointment in `/appointments`. |
| **Clinician** | `dr.sharma@hospital.test` | `/doctor` | 1. Open Doctor Dashboard.<br>2. View upcoming patient appointments.<br>3. Record clinical examination notes and prescribed medicines. |
| **Front-Desk** | `frontdesk@hospital.test` | `/front-desk` | 1. Check today's appointment queue.<br>2. Book appointments on behalf of walk-in patients.<br>3. Review unpaid invoices & process simulated payments. |
| **Admin** | `admin@hospital.test` | `/admin` | 1. Verify pending doctor applications.<br>2. Inspect system directory.<br>3. Open **Audit Trail** tab to see real-time logs of sensitive actions. |

---

## 7. Known Assumptions & Intentional Design Choices

1. **Simulated Sandbox Payments**: Real card processing is intentionally simulated (`SIMULATED_GATEWAY`) as per brief guidelines ("Do not pay for hosting or external services").
2. **Clinical Notes (No Automated Diagnosis)**: Strictly clinician-entered metadata (`symptoms`, `diagnosis`, `clinicianNotes`). No automated AI diagnosis is performed in compliance with medical safety rules.
3. **Optimistic Locking via Database Constraints**: Rather than heavyweight distributed redis locks, Postgres unique constraints combined with interactive serializable transactions are used for high-throughput slot reservation concurrency protection.

---
