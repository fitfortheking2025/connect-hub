import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ConnectedMemberRecord {
  fullName: string;
  connectedWith?: string;
  approachedBy?: string;
  ageGroup?: string;
  serviceAttended?: string;
  createdAt: string | Date;
}

export function exportConnectedMembersPdf({
  month,
  year,
  records,
}: {
  month: number;
  year: number;
  records: ConnectedMemberRecord[];
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const monthName = MONTHS[month - 1] || "Month";
  const totalConnected = records.length;
  const assignedCount = records.filter(
    (r) => Boolean(r.connectedWith && r.connectedWith.trim() !== "")
  ).length;

  const generatedDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Executive Dark Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, "F");

  // Orange Accent Line
  doc.setFillColor(255, 107, 0); // #FF6B00
  doc.rect(0, 0, 210, 3, "F");

  // Title & Ministry Info
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("RIVER OF GOD CHURCH", 14, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 107, 0);
  doc.text("DISCIPLESHIP - CONNECT MINISTRY", 14, 20);

  // Single Header Pill Badge (Month + Year Only Here)
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(144, 9, 52, 16, 2.5, 2.5, "F");
  doc.setDrawColor(255, 107, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(144, 9, 52, 16, 2.5, 2.5, "S");

  doc.setTextColor(255, 107, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CONNECTED REPORT", 170, 15, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`${monthName.toUpperCase()} ${year}`, 170, 20.5, { align: "center" });

  // 2. Summary KPI Cards (Non-Redundant)
  const cardY = 37;
  const cardHeight = 16;

  // Total Connected
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(14, cardY, 88, cardHeight, 2.5, 2.5, "F");
  doc.setDrawColor(255, 107, 0);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, cardY, 88, cardHeight, 2.5, 2.5, "S");

  doc.setTextColor(255, 107, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(String(totalConnected), 24, cardY + 10.5);

  doc.setTextColor(154, 52, 18);
  doc.setFontSize(7.5);
  doc.text("TOTAL CONNECTED MEMBERS", 36, cardY + 10.5);

  // Discipler Assigned Coverage
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, cardY, 88, cardHeight, 2.5, 2.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(108, cardY, 88, cardHeight, 2.5, 2.5, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(String(assignedCount), 118, cardY + 10.5);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text("ASSIGNED TO A DISCIPLER", 130, cardY + 10.5);

  // 3. Table Rows
  const tableRows = records.map((r, idx) => [
    String(idx + 1).padStart(2, "0"),
    (r.fullName || "—").toUpperCase(),
    r.ageGroup ? r.ageGroup.toUpperCase() : "—",
    (r.connectedWith || r.approachedBy || "UNASSIGNED").toUpperCase(),
  ]);

  autoTable(doc, {
    startY: cardY + cardHeight + 6,
    head: [["#", "VIP / MEMBER NAME", "AGE GROUP", "DISCIPLER"]],
    body: tableRows.length > 0 ? tableRows : [["—", "No connected VIPs found for this month", "—", "—"]],
    theme: "plain",
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [71, 85, 105],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3.5,
    },
    bodyStyles: {
      textColor: [17, 24, 39],
      fontSize: 8.5,
      cellPadding: 3.2,
      lineColor: [241, 245, 249],
      lineWidth: { bottom: 0.2 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold", textColor: [148, 163, 184] },
      1: { fontStyle: "bold" },
      2: { cellWidth: 32, textColor: [100, 116, 139] },
      3: { textColor: [255, 107, 0], fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      // Clean Bottom Footer
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(14, 284, 196, 284);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.text(`Generated: ${generatedDateStr}`, 14, 290);
      doc.text("River of God Church • Discipleship Ministry", 105, 290, { align: "center" });
      doc.text(`Page ${currentPage} of ${pageCount}`, 196, 290, { align: "right" });
    },
  });

  doc.save(`ROG_Connected_Report_${monthName}_${year}.pdf`);
}