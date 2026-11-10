"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, ROLES } from "@/lib/rbac";

/**
 * Reconciles and gets an invoice with its line items and payments.
 * (Acceptance Test #4)
 */
export async function getInvoice(invoiceId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: true,
      payments: true,
      patient: { select: { id: true, name: true, email: true, phone: true } },
      appointment: {
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  // Server-side RBAC: Patient can view own invoice; Front-Desk and Admin can view all
  if (user.role === ROLES.PATIENT && invoice.patientId !== user.id) {
    throw new Error("FORBIDDEN: You cannot view other patients' invoices");
  }

  // Reconciliation math: Verify line items sum matches total amount
  const calculatedTotal = invoice.lineItems.reduce((acc, item) => acc + item.amount, 0);
  const totalPaid = invoice.payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((acc, p) => acc + p.amount, 0);

  return {
    ...invoice,
    reconciliation: {
      calculatedTotal,
      storedTotal: invoice.totalAmount,
      totalPaid,
      balanceDue: Math.max(0, invoice.totalAmount - totalPaid),
      isReconciled: calculatedTotal === invoice.totalAmount,
    },
  };
}

/**
 * Adds an itemized charge to an invoice (Front-Desk & Admin only).
 */
export async function addInvoiceItem(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user || (user.role !== ROLES.FRONT_DESK && user.role !== ROLES.ADMIN)) {
    throw new Error("FORBIDDEN: Only Front-Desk and Admin can modify invoices");
  }

  const invoiceId = formData.get("invoiceId");
  const description = formData.get("description");
  const unitPrice = parseFloat(formData.get("unitPrice"));
  const quantity = parseInt(formData.get("quantity") || "1", 10);

  if (!invoiceId || !description || isNaN(unitPrice)) {
    throw new Error("Invalid invoice item details");
  }

  const amount = unitPrice * quantity;

  const updatedInvoice = await db.$transaction(async (tx) => {
    await tx.invoiceItem.create({
      data: {
        invoiceId,
        description,
        unitPrice,
        quantity,
        amount,
      },
    });

    const allItems = await tx.invoiceItem.findMany({ where: { invoiceId } });
    const newTotal = allItems.reduce((sum, item) => sum + item.amount, 0);

    return await tx.invoice.update({
      where: { id: invoiceId },
      data: { totalAmount: newTotal },
      include: { lineItems: true },
    });
  });

  await createAuditLog({
    action: "ADD_INVOICE_ITEM",
    resourceType: "Invoice",
    resourceId: invoiceId,
    details: { description, amount, newTotal: updatedInvoice.totalAmount },
    userId: user.id,
  });

  revalidatePath("/front-desk");
  return { success: true, invoice: updatedInvoice };
}

/**
 * Records a payment against an invoice (Simulated Sandbox Payment Flow).
 * (Acceptance Test #4)
 */
export async function processPayment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const invoiceId = formData.get("invoiceId");
  const amount = parseFloat(formData.get("amount"));
  const paymentMethod = formData.get("paymentMethod") || "SIMULATED_GATEWAY";

  if (!invoiceId || isNaN(amount) || amount <= 0) {
    throw new Error("Valid invoice ID and payment amount required");
  }

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount,
        paymentMethod,
        transactionRef: `SIM_PAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: "SUCCESS",
      },
    });

    const previousPaid = invoice.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPaidNow = previousPaid + amount;

    let newStatus = "PARTIALLY_PAID";
    if (totalPaidNow >= invoice.totalAmount) {
      newStatus = "PAID";
    }

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    return { payment, invoice: updated, totalPaidNow };
  });

  await createAuditLog({
    action: "PROCESS_PAYMENT",
    resourceType: "Payment",
    resourceId: result.payment.id,
    details: {
      invoiceId,
      amount,
      paymentMethod,
      invoiceStatus: result.invoice.status,
    },
    userId: user.id,
  });

  revalidatePath("/front-desk");
  revalidatePath("/appointments");
  return { success: true, ...result };
}
