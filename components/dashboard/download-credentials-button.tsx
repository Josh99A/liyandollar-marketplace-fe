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
    pdf.text(`Product: ${order.productName}`, 40, 118);
    pdf.text(`Delivered: ${order.deliveredAt}`, 40, 141);
    pdf.text("Credentials", 40, 185);

    let y = 210;
    order.credentials.forEach((credential) => {
      pdf.text(`${credential.label}: ${credential.value}`, 40, y);
      y += 24;
    });

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
