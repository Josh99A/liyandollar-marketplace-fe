import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { ModalRenderer } from "@/components/ui/modal-renderer";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiyanDollar Marketplace",
  description:
    "A fintech-inspired digital marketplace for secure digital product discovery, checkout, and post-purchase management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <Providers>
          {children}
          <ModalRenderer />
        </Providers>
      </body>
    </html>
  );
}
