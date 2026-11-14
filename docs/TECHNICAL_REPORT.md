# Hospital Management System (HMS) — Technical Report & Design Decisions

**Company:** ALGIONS AI LABS PRIVATE LIMITED  
**Track:** Full-Stack Web Development | Advanced Individual Project Assessment  
**Project:** Hospital Management System (HMS)  
**Architecture:** Modular Monolith (Next.js 15 App Router, React 19, Prisma ORM, PostgreSQL)

---

## 1. Executive Overview & Problem Statement

This project implements an end-to-end, database-backed Hospital Management System covering the complete lifecycle of clinical operations:
- **Patient Registration & Discovery**: Synthetic patient profiles, doctor directories with specialty filtering, and real-time 30-minute booking windows.
- **Appointment Lifecycle**: Conflict-free booking, rescheduling, check-in, real-time video consultation, and completion.
- **Clinical Encounter Records**: Clinician-entered symptoms, diagnosis, prescription records, and diagnostic report metadata (strictly no automated diagnosis, preserving clinical decision ownership).
- **Billing & Itemized Invoicing**: Automatic invoice generation upon booking, itemized line items, and simulated sandbox payment reconciliation (Cash, UPI, Card, Online).
- **Role-Based Access Control (RBAC)**: Strict server-side access enforcement across four distinct operational personas: Patient, Doctor, Front-Desk, and Administrator.
- **Audit Logging**: Immutable audit entries recording all sensitive record accesses, clinical updates, and financial settlements.

---

## 2. Key Architecture Decisions

### 2.1 Modular Monolith vs. Microservices
- **Choice**: Modular Monolith via Next.js 15 App Router.
- **Rationale**: The assessment brief states *"A modular monolith is sufficient; microservices are not required."* A monolithic Next.js architecture co-locates frontend presentation, server actions, and Prisma persistence in a single deployable repository. This eliminates inter-service network latency, distributed transaction overhead, and complex infrastructure orchestration while retaining clean domain boundaries.

### 2.2 Server Actions for Business Logic & RBAC
- **Choice**: Next.js Server Actions with server-side RBAC guards (`requireRole()`).
- **Rationale**: Rather than exposing public REST endpoints that require custom JWT middleware or relying on client-side button hiding, all critical business mutations (`bookAppointment`, `saveVisitRecord`, `processPayment`, `checkInAppointment`) run strictly on the server and verify the caller's verified database role and Clerk session before executing.

### 2.3 Relational Schema & Neon PostgreSQL
- **Choice**: Normalized relational schema with foreign key cascades and composite uniqueness constraints.
- **Rationale**: Healthcare scheduling demands absolute ACID guarantees. A relational model prevents phantom double-bookings via `UNIQUE(doctorId, startTime)` constraints and enforces referential integrity across appointments, visit records, prescriptions, and invoices.

---

## 3. Concurrency Protection & Stale Availability

Double-booking prevention is enforced at two independent defensive layers:
1. **Interactive Transaction (`$transaction`)**: When a booking or rescheduling request arrives, an atomic transaction performs an overlapping range check:
   $$\text{candidateStart} < \text{existingEnd} \quad \text{AND} \quad \text{candidateEnd} > \text{existingStart}$$
2. **Database Constraint Barrier**: Any concurrent thread attempting to insert an overlapping slot for the same doctor triggers a PostgreSQL collision error and rolls back cleanly without dirty reads.

---

## 4. Timezone Management & Operational Hours

- **Challenge**: Vercel and cloud serverless runtimes operate in UTC (`process.env.TZ = "UTC"`), whereas clinic operations, doctors, and patients in this system operate in India Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Solution**: Developed a deterministic timezone utility (`lib/date-utils.js`). Recurring doctor hours (e.g. Sunday 15:00 to 20:00) represent clinic wall-clock hours and are mapped to exact UTC timestamps (09:30 UTC) during slot generation. Patient slot pickers, front-desk queues, and doctor appointment calendars remain 100% synchronized in local time.

---

## 5. API Documentation & Server Action Contracts

### 5.1 `bookAppointment(formData)`
- **Caller Roles**: `PATIENT` (self only), `FRONT_DESK`, `ADMIN`.
- **Inputs**: `doctorId`, `startTime` (ISO), `endTime` (ISO), `patientDescription`, `patientId` (for staff).
- **Behavior**: Reserves slot, creates Vonage video session, generates itemized invoice (`UNPAID`), and logs audit entry.

### 5.2 `saveVisitRecord(formData)`
- **Caller Roles**: `DOCTOR` (assigned doctor only), `ADMIN`.
- **Inputs**: `appointmentId`, `symptoms`, `diagnosis`, `clinicianNotes`, `followUpDate`, `medicines` (JSON), `diagnosticReports` (JSON).
- **Behavior**: Upserts visit record, creates prescription line items, logs `UPDATE_CLINICAL_VISIT_RECORD` into `AuditLog`.

### 5.3 `processPayment(formData)`
- **Caller Roles**: `FRONT_DESK`, `ADMIN`, `PATIENT` (self).
- **Inputs**: `invoiceId`, `amount`, `paymentMethod` (CASH / UPI / CARD / ONLINE).
- **Behavior**: Creates `Payment` record, recalculates balance due, updates invoice status to `PAID`, logs `PROCESS_PAYMENT` audit entry.

### 5.4 `markAppointmentCompleted(formData)` / `completeAppointment(appointmentId)`
- **Caller Roles**: `DOCTOR`, `FRONT_DESK`, `ADMIN`.
- **Inputs**: `appointmentId`.
- **Behavior**: Transitions appointment status to `COMPLETED`, updates doctor metrics in Doctor Dashboard, revalidates queues.

---

## 6. Acceptance Criteria Evidence Matrix

| Criteria # | Brief Requirement | Implementation Evidence | Automated Test |
|---|---|---|---|
| **AC-1** | Patient booked into available slot | Real-time 30-min slot generation, interactive transaction reservation. | `tests/acceptance.test.js` (Test 1) |
| **AC-2** | Conflict prevention (Concurrency) | Postgres range overlap check and transaction abort on collision. | `tests/acceptance.test.js` (Test 2) |
| **AC-3** | Server-side RBAC on patient records | Front-desk blocked from clinical notes; doctors restricted to assigned patients. | `tests/acceptance.test.js` (Test 3) |
| **AC-4** | Invoice reconciliation & payment | Itemized line item sum check; simulated payment gateway updates to `PAID`. | `tests/acceptance.test.js` (Test 4) |
| **AC-5** | Sensitive record audit logging | `createAuditLog()` persists clinical edits, status changes, and payments. | `tests/acceptance.test.js` (Test 5) |

---

## 7. Known Assumptions & Limitations

1. **Simulated Payments**: Real payment gateways (e.g. Stripe, Razorpay) require merchant KYC and live webhook URLs. A simulated sandbox payment flow is implemented per assignment guidelines (*"Do not pay for hosting or external services"*).
2. **Clinical Decision Ownership**: Automated AI diagnosis is intentionally excluded to comply with medical safety guidelines. The system acts solely as a clinical recordkeeper for clinician-entered notes.
3. **Synthetic Seed Data**: All patients, doctors, and transactions are synthetic and contain no real-world sensitive PII.
