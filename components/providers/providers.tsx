"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { ModalProvider } from "@/components/ui/modal-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <AuthBootstrap />
        {children}
      </ModalProvider>
    </ThemeProvider>
  );
}
