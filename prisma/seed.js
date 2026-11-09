const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClerkClient } = require("@clerk/backend");

// Ensure .env variables are loaded when running `node prisma/seed.js` directly
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnvFile();

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = process.env.SEED_DOCTOR_PASSWORD || "1234567890";

const clerk =
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.includes("placeholder")
    ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureClerkDoctorAccount(doc) {
  if (!clerk) return doc.clerkUserId;

  const cleanName = doc.name.replace(/^Dr\.\s*/i, "").trim();
  const [firstName, ...rest] = cleanName.split(/\s+/);
  const lastName = rest.join(" ") || "Doctor";

  try {
    const existingList = await clerk.users.getUserList({
      emailAddress: [doc.email],
      limit: 1,
    });
    const existing = existingList?.data?.[0];

    if (existing) {
      await clerk.users.updateUser(existing.id, {
        password: DEFAULT_PASSWORD,
        firstName: `Dr. ${firstName}`,
        lastName,
        skipPasswordChecks: true,
      });
      return existing.id;
    }

    const created = await clerk.users.createUser({
      emailAddress: [doc.email],
      password: DEFAULT_PASSWORD,
      firstName: `Dr. ${firstName}`,
      lastName,
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });
    return created.id;
  } catch (error) {
    console.warn(
      `[Clerk Seed Warning] Could not sync ${doc.email} in Clerk:`,
      error?.errors?.[0]?.message || error.message
    );
    return doc.clerkUserId;
  }
}

async function main() {
  console.log("Seeding Hospital Management System database...");

  // 1. Seed Departments
  const departments = [
    { name: "General Physician", description: "Primary healthcare, routine examinations, and internal medicine" },
    { name: "Cardiology", description: "Comprehensive cardiovascular care and heart disease management" },
    { name: "Paediatrics", description: "Child healthcare, immunization, and pediatric development" },
    { name: "Orthopaedics", description: "Musculoskeletal system, joint treatments, and bone fractures" },
    { name: "Neurology", description: "Disorders of nervous system, brain, and spine" },
    { name: "Dermatology", description: "Skin, hair, and nail diagnostics and treatment" },
    { name: "Obs & Gyn", description: "Women's reproductive health, obstetrics, and gynecology" },
    { name: "ENT", description: "Ear, nose, throat, and head & neck care" },
    { name: "Psychiatry", description: "Mental health evaluations, therapy, and medication management" },
    { name: "General Surgery", description: "General surgical procedures and post-operative care" },
  ];

  const deptByName = new Map();
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    deptByName.set(d.name, d.id);
  }
  console.log(`Created/Ensured ${deptByName.size} departments.`);

  // 2. Seed 20 Verified Doctors across specialties (password: 1234567890 in Clerk)
  const demoDoctors = [
    {
      legacyClerkUserId: "seed_doc_1",
      legacyEmail: "dr.sharma@hospital.test",
      email: "dr.sharma@medicareclinic.com",
      name: "Dr. Ananya Sharma",
      specialty: "Cardiology",
      qualification: "MBBS, MD, DM (Cardiology)",
      experience: 12,
      consultationFee: 750,
      address: "Delhi Heart Institute",
      description: "Senior Interventional Cardiologist with 12+ years of clinical experience in adult cardiac care.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_2",
      legacyEmail: "dr.patel@hospital.test",
      email: "dr.patel@medicareclinic.com",
      name: "Dr. Rajesh Patel",
      specialty: "General Physician",
      qualification: "MBBS, MD (Internal Medicine)",
      experience: 8,
      consultationFee: 500,
      address: "MediCare Central Clinic, Delhi",
      description: "Consultant Physician focused on comprehensive internal medicine and chronic care management.",
      scheduleDays: [1, 2, 3, 4, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_3",
      legacyEmail: "dr.mehta@hospital.test",
      email: "dr.mehta@medicareclinic.com",
      name: "Dr. Priya Mehta",
      specialty: "Paediatrics",
      qualification: "MBBS, MD (Paediatrics)",
      experience: 10,
      consultationFee: 600,
      address: "ChildCare Wing, Mumbai",
      description: "Pediatrician and Neonatologist dedicated to compassionate care for infants and children.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_4",
      legacyEmail: "dr.verma@hospital.test",
      email: "dr.verma@medicareclinic.com",
      name: "Dr. Vikram Verma",
      specialty: "Orthopaedics",
      qualification: "MBBS, MS (Orthopaedics)",
      experience: 14,
      consultationFee: 900,
      address: "Bone & Joint Center, Bengaluru",
      description: "Orthopaedic specialist focusing on sports injuries, joint replacement, and spine rehabilitation.",
      scheduleDays: [1, 3, 4, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_5",
      legacyEmail: "dr.iyer@hospital.test",
      email: "dr.iyer@medicareclinic.com",
      name: "Dr. Meenakshi Iyer",
      specialty: "Dermatology",
      qualification: "MBBS, MD (Dermatology)",
      experience: 9,
      consultationFee: 650,
      address: "Skin & Clinical Dermatology, Chennai",
      description: "Dermatologist treating eczema, acne, autoimmune skin disorders, and dermatologic allergies.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_6",
      legacyEmail: "dr.kapoor@hospital.test",
      email: "dr.kapoor@medicareclinic.com",
      name: "Dr. Rohan Kapoor",
      specialty: "Neurology",
      qualification: "MBBS, MD, DM (Neurology)",
      experience: 15,
      consultationFee: 1200,
      address: "Neurosciences Pavilion, Delhi",
      description: "Senior Neurologist specializing in stroke recovery, migraine management, and epilepsy care.",
      scheduleDays: [1, 2, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_7",
      legacyEmail: "dr.nair@hospital.test",
      email: "dr.nair@medicareclinic.com",
      name: "Dr. Sneha Nair",
      specialty: "Obs & Gyn",
      qualification: "MBBS, MS (OBG)",
      experience: 11,
      consultationFee: 800,
      address: "Maternity & Women Care, Kochi",
      description: "Obstetrician and Gynecologist supporting prenatal wellness, high-risk pregnancies, and PCOS care.",
      scheduleDays: [1, 2, 3, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_8",
      legacyEmail: "dr.desai@hospital.test",
      email: "dr.desai@medicareclinic.com",
      name: "Dr. Amit Desai",
      specialty: "ENT",
      qualification: "MBBS, MS (ENT)",
      experience: 7,
      consultationFee: 550,
      address: "Sinus & ENT Clinic, Ahmedabad",
      description: "ENT specialist managing sinusitis, hearing evaluations, vertigo, and voice disorders.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_9",
      legacyEmail: "dr.malhotra@hospital.test",
      email: "dr.malhotra@medicareclinic.com",
      name: "Dr. Karan Malhotra",
      specialty: "Urology",
      qualification: "MBBS, MS, MCh (Urology)",
      experience: 13,
      consultationFee: 1000,
      address: "Renal & Urology Block, Chandigarh",
      description: "Urologist focusing on minimally invasive kidney stone care and urinary tract health.",
      scheduleDays: [2, 3, 4, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_10",
      legacyEmail: "dr.bose@hospital.test",
      email: "dr.bose@medicareclinic.com",
      name: "Dr. Rituparna Bose",
      specialty: "Gastro",
      qualification: "MBBS, MD, DM (Gastroenterology)",
      experience: 10,
      consultationFee: 850,
      address: "Digestive Health Center, Kolkata",
      description: "Gastroenterologist specializing in liver health, IBS, reflux, and endoscopic diagnostics.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_11",
      legacyEmail: "dr.joshi@hospital.test",
      email: "dr.joshi@medicareclinic.com",
      name: "Dr. Siddharth Joshi",
      specialty: "Psychiatry",
      qualification: "MBBS, MD (Psychiatry)",
      experience: 9,
      consultationFee: 950,
      address: "Behavioral Wellness Clinic, Pune",
      description: "Consultant Psychiatrist offering evidence-based anxiety, depression, and sleep disorder care.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_12",
      legacyEmail: "dr.khan@hospital.test",
      email: "dr.khan@medicareclinic.com",
      name: "Dr. Farhan Khan",
      specialty: "Pulmonology",
      qualification: "MBBS, MD (Pulmonary Medicine)",
      experience: 11,
      consultationFee: 750,
      address: "Chest & Respiratory Wing, Lucknow",
      description: "Pulmonologist focused on asthma, COPD, sleep apnea, and post-infectious lung recovery.",
      scheduleDays: [1, 3, 4, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_13",
      legacyEmail: "dr.reddy@hospital.test",
      email: "dr.reddy@medicareclinic.com",
      name: "Dr. Divya Reddy",
      specialty: "Endocrinology",
      qualification: "MBBS, MD, DM (Endocrinology)",
      experience: 8,
      consultationFee: 800,
      address: "Metabolic & Thyroid Care, Hyderabad",
      description: "Endocrinologist treating thyroid disorders, metabolic syndrome, and hormonal imbalances.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_14",
      legacyEmail: "dr.kulkarni@hospital.test",
      email: "dr.kulkarni@medicareclinic.com",
      name: "Dr. Manish Kulkarni",
      specialty: "Nephrology",
      qualification: "MBBS, MD, DM (Nephrology)",
      experience: 16,
      consultationFee: 1100,
      address: "Kidney Care Pavilion, Pune",
      description: "Senior Nephrologist managing hypertension, chronic kidney care, and electrolyte disorders.",
      scheduleDays: [1, 2, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_15",
      legacyEmail: "dr.bansal@hospital.test",
      email: "dr.bansal@medicareclinic.com",
      name: "Dr. Nikhil Bansal",
      specialty: "Neurosurgery",
      qualification: "MBBS, MS, MCh (Neurosurgery)",
      experience: 17,
      consultationFee: 1500,
      address: "Spine & Neuro Tower, Jaipur",
      description: "Neurosurgeon specializing in minimally invasive spine surgery and cranial evaluations.",
      scheduleDays: [1, 3, 5],
    },
    {
      legacyClerkUserId: "seed_doc_16",
      legacyEmail: "dr.chatterjee@hospital.test",
      email: "dr.chatterjee@medicareclinic.com",
      name: "Dr. Shreya Chatterjee",
      specialty: "Rheumatology",
      qualification: "MBBS, MD, DM (Rheumatology)",
      experience: 9,
      consultationFee: 850,
      address: "Arthritis & Autoimmune Clinic, Kolkata",
      description: "Rheumatologist treating rheumatoid arthritis, lupus, gout, and musculoskeletal pain.",
      scheduleDays: [1, 2, 3, 4, 6],
    },
    {
      legacyClerkUserId: "seed_doc_17",
      legacyEmail: "dr.gill@hospital.test",
      email: "dr.gill@medicareclinic.com",
      name: "Dr. Harpreet Gill",
      specialty: "Ophthalmology",
      qualification: "MBBS, MS (Ophthalmology)",
      experience: 12,
      consultationFee: 600,
      address: "Vision & Eye Care Center, Amritsar",
      description: "Ophthalmologist focusing on cataract screening, glaucoma care, and retinal health.",
      scheduleDays: [1, 2, 3, 4, 5, 6],
    },
    {
      legacyClerkUserId: "seed_doc_18",
      legacyEmail: "dr.tiwari@hospital.test",
      email: "dr.tiwari@medicareclinic.com",
      name: "Dr. Ashutosh Tiwari",
      specialty: "General Surgery",
      qualification: "MBBS, MS (General Surgery)",
      experience: 14,
      consultationFee: 900,
      address: "Surgical Care Unit, Bhopal",
      description: "General & Laparoscopic Surgeon handling hernia, gallbladder, and outpatient procedures.",
      scheduleDays: [1, 2, 3, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_19",
      legacyEmail: "dr.menon@hospital.test",
      email: "dr.menon@medicareclinic.com",
      name: "Dr. Lakshmi Menon",
      specialty: "Oncology",
      qualification: "MBBS, MD, DM (Medical Oncology)",
      experience: 13,
      consultationFee: 1400,
      address: "Comprehensive Cancer Wing, Bengaluru",
      description: "Medical Oncologist providing personalized systemic therapy and second-opinion consultations.",
      scheduleDays: [1, 2, 4, 5],
    },
    {
      legacyClerkUserId: "seed_doc_20",
      legacyEmail: "dr.gupta@hospital.test",
      email: "dr.gupta@medicareclinic.com",
      name: "Dr. Saurabh Gupta",
      specialty: "Diabetology",
      qualification: "MBBS, MD, Fellowship in Diabetology",
      experience: 6,
      consultationFee: 450,
      address: "Diabetes & Preventive Clinic, Noida",
      description: "Diabetologist focused on glycemic control, continuous monitoring, and lifestyle medicine.",
      scheduleDays: [1, 2, 3, 4, 5, 6],
    },
  ];

  let syncedClerkCount = 0;
  for (const doc of demoDoctors) {
    const clerkUserId = await ensureClerkDoctorAccount({
      ...doc,
      clerkUserId: doc.legacyClerkUserId,
    });
    if (clerkUserId.startsWith("user_")) syncedClerkCount++;

    const departmentId = deptByName.get(doc.specialty) || null;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkUserId },
          { email: doc.email },
          { email: doc.legacyEmail },
          { clerkUserId: doc.legacyClerkUserId },
        ],
      },
    });

    const docPayload = {
      clerkUserId,
      email: doc.email,
      name: doc.name,
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
      specialty: doc.specialty,
      qualification: doc.qualification || "MBBS, MD",
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      address: doc.address,
      description: doc.description,
      credentialUrl: `https://example.com/credentials/${doc.email.split("@")[0]}.pdf`,
      departmentId,
    };

    const savedDoc = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: docPayload,
        })
      : await prisma.user.create({
          data: docPayload,
        });

    // Seed WeeklyAvailability (Mon-Sat open windows) so real 14-day slots work
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const isActive = doc.scheduleDays.includes(dayOfWeek);
      await prisma.weeklyAvailability.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: savedDoc.id,
            dayOfWeek,
          },
        },
        update: {
          isActive,
          startTime: "09:00",
          endTime: "17:00",
        },
        create: {
          doctorId: savedDoc.id,
          dayOfWeek,
          isActive,
          startTime: "09:00",
          endTime: "17:00",
        },
      });
    }

    // Also preserve legacy tomorrow availability slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const slotHours = [9, 10, 11, 14, 15, 16];
    for (const h of slotHours) {
      const startTime = new Date(tomorrow);
      startTime.setHours(h, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(h, 30, 0, 0);

      await prisma.availability.upsert({
        where: {
          doctorId_startTime: {
            doctorId: savedDoc.id,
            startTime,
          },
        },
        update: {},
        create: {
          doctorId: savedDoc.id,
          startTime,
          endTime,
          status: "AVAILABLE",
        },
      });
    }

    if (clerk) await sleep(120);
  }
  console.log(
    `Seeded ${demoDoctors.length} verified doctors (Clerk synced: ${syncedClerkCount}/${demoDoctors.length}, password: ${DEFAULT_PASSWORD}).`
  );

  // 3. Seed Demo Front-Desk Staff
  await prisma.user.upsert({
    where: { email: "frontdesk@hospital.test" },
    update: { role: "FRONT_DESK" },
    create: {
      clerkUserId: "seed_frontdesk_1",
      email: "frontdesk@hospital.test",
      name: "Kavita Rao (Front Desk)",
      role: "FRONT_DESK",
      phone: "+91 98765 43210",
    },
  });
  console.log("Created/Ensured Front-Desk staff account.");

  // 4. Seed Demo Admin
  await prisma.user.upsert({
    where: { email: "admin@hospital.test" },
    update: { role: "ADMIN" },
    create: {
      clerkUserId: "seed_admin_1",
      email: "admin@hospital.test",
      name: "System Administrator",
      role: "ADMIN",
    },
  });
  console.log("Created/Ensured Admin account.");

  // 5. Seed Demo Patient
  await prisma.user.upsert({
    where: { email: "patient@hospital.test" },
    update: { role: "PATIENT" },
    create: {
      clerkUserId: "seed_patient_1",
      email: "patient@hospital.test",
      name: "Rohan Verma",
      role: "PATIENT",
      phone: "+91 91234 56789",
      bloodGroup: "O+",
      emergencyContact: "+91 99887 76655",
    },
  });
  console.log("Created/Ensured Patient account.");

  console.log("\nDatabase seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
