// src/lib/sundayDate.ts
export function getNextOrCurrentSunday(from: Date = new Date()): string {
  const d = new Date(from);
  const day = d.getDay(); // 0 is Sunday
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function formatSundayDateHuman(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}