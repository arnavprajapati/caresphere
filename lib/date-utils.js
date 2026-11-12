export const CLINIC_TIMEZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Asia/Kolkata";

/**
 * Returns the exact millisecond offset between UTC and the specified timezone at a given instant.
 * Example for Asia/Kolkata: +19,800,000 ms (+5h 30m).
 */
export function getTimezoneOffsetMs(date, timeZone = CLINIC_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const y = parseInt(getPart("year"), 10);
  const m = parseInt(getPart("month"), 10) - 1;
  const day = parseInt(getPart("day"), 10);
  const h = parseInt(getPart("hour"), 10);
  const min = parseInt(getPart("minute"), 10);
  const s = parseInt(getPart("second"), 10);

  const tzAsUtc = Date.UTC(y, m, day, h, min, s);
  return tzAsUtc - d.getTime();
}

/**
 * Returns "YYYY-MM-DD" for a Date in the clinic timezone.
 */
export function getClinicDateString(date = new Date(), timeZone = CLINIC_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Adds calendar days to a "YYYY-MM-DD" date string and returns "YYYY-MM-DD".
 */
export function addDaysToDateString(dateStr, daysToAdd) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + daysToAdd, 12, 0, 0));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for a "YYYY-MM-DD" string.
 */
export function getClinicDayOfWeekFromDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return utcDate.getUTCDay();
}

/**
 * Returns day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for a Date in the clinic timezone.
 */
export function getClinicDayOfWeek(date, timeZone = CLINIC_TIMEZONE) {
  const dateStr = getClinicDateString(date, timeZone);
  return getClinicDayOfWeekFromDateStr(dateStr);
}

/**
 * Formats a "YYYY-MM-DD" string into a display string (e.g. "Sunday, November 15").
 */
export function formatClinicDateStr(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(utcDate);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(utcDate);
  const dayNum = utcDate.getUTCDate();
  return `${weekday}, ${month} ${dayNum}`;
}

/**
 * Converts a clinic date string ("YYYY-MM-DD") and wall-clock time ("HH:mm") into a UTC Date object.
 */
export function clinicTimeToUtcDate(dateStr, timeStr, timeZone = CLINIC_TIMEZONE) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const targetUtcMs = Date.UTC(y, m - 1, d, h, min, 0, 0);
  const offsetMs = getTimezoneOffsetMs(new Date(targetUtcMs), timeZone);
  return new Date(targetUtcMs - offsetMs);
}

/**
 * Formats a Date object in clinic timezone.
 * Supports "HH:mm", "yyyy-MM-dd", and "h:mm a".
 */
export function formatInClinicTz(date, formatType = "HH:mm", timeZone = CLINIC_TIMEZONE) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  if (formatType === "yyyy-MM-dd") {
    return getClinicDateString(d, timeZone);
  }

  if (formatType === "HH:mm") {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    return formatter.format(d);
  }

  if (formatType === "h:mm a") {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(d);
  }

  return d.toISOString();
}

/**
 * Converts "15:00" -> "3:00 PM".
 */
export function formatTime12h(time24) {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Adds minutes to "HH:mm" and returns "HH:mm".
 */
export function addMinutesToHHMM(timeStr, minutesToAdd) {
  const [h, m] = timeStr.split(":").map(Number);
  const totalM = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalM / 60);
  const newM = totalM % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
