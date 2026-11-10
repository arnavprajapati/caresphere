"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    if (clerkUser) {
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "User";
      user = await db.user.create({
        data: {
          clerkUserId: userId,
          name,
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clerk.local`,
          role: "UNASSIGNED",
        },
      });
    } else {
      throw new Error("User not found in database");
    }
  }

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR", "FRONT_DESK"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "PATIENT") {
      await db.user.update({
        where: { clerkUserId: userId },
        data: { role: "PATIENT" },
      });

      revalidatePath("/", "layout");
      revalidatePath("/onboarding");
      revalidatePath("/doctors");
      return { success: true, redirect: "/doctors" };
    }

    if (role === "FRONT_DESK") {
      await db.user.update({
        where: { clerkUserId: userId },
        data: {
          role: "FRONT_DESK",
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/", "layout");
      revalidatePath("/onboarding");
      revalidatePath("/front-desk");
      revalidatePath("/front-desk-verification");
      revalidatePath("/admin");
      return { success: true, redirect: "/front-desk-verification" };
    }

    if (role === "DOCTOR") {
      const specialty = String(formData.get("specialty") || "").trim();
      const qualification = String(formData.get("qualification") || "").trim();
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = String(formData.get("credentialUrl") || "").trim();
      const description = String(formData.get("description") || "").trim();

      if (!specialty || !qualification || isNaN(experience) || !credentialUrl || !description) {
        throw new Error("All fields are required for doctor profile");
      }

      await db.user.update({
        where: { clerkUserId: userId },
        data: {
          role: "DOCTOR",
          specialty,
          qualification,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/", "layout");
      revalidatePath("/onboarding");
      revalidatePath("/doctor/verification");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    if (error.message === "All fields are required for doctor profile") {
      throw error;
    }
    throw new Error("Unable to save your profile right now. Please try again.");
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}
