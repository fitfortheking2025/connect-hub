// src/lib/sundayDate.ts

/**
 * Returns the current date shifted to the Manila timezone (UTC+8).
 */
function getManilaDate(from: Date = new Date()): Date {
  const manilaString = from.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  return new Date(manilaString);
}

export function getNextOrCurrentSunday(from: Date = new Date()): string {
  const d = getManilaDate(from);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  
  // On Sunday, it points to today.
  // As soon as Monday 12:00 AM Manila hits (day = 1), diff = 6, jumping to the upcoming Sunday.
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function formatSundayDateHuman(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}