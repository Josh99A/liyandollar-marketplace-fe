"use client";

import jsPDF from "jspdf";
import type { Order } from "@/types";

export function DownloadCredentialsButton({ order }: { order: Order }) {
  const handleDownload = () => {
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    pdf.setFontSize(18);
    pdf.text("Digital Product Credentials", 40, 60);
    pdf.setFontSize(12);
    pdf.text(`Order ID: ${order.id}`, 40, 95);
    pdf.text(`Product: ${order.product.name}`, 40, 118);
    pdf.text(`Updated: ${order.updated_at}`, 40, 141);
    pdf.text("Credentials", 40, 185);

    let y = 210;
    const credentials = order.product.credentialsData ?? {};
    const entries = Object.entries(credentials);
    if (entries.length === 0) {
      pdf.text("No credentials available in this view.", 40, y);
    } else {
      entries.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 40, y);
        y += 24;
      });
    }

    pdf.save(`${order.id}-credentials.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5"
    >
      Download PDF
    </button>
  );
}
