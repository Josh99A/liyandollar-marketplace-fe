"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthBootstrap } from "@/components/providers/auth-bootstrap";
import { ModalProvider } from "@/components/ui/modal-provider";
import { Toaster } from "react-hot-toast";
import { NotificationsBridge } from "@/components/providers/notifications-bridge";
import { SupportWidget } from "@/components/support/support-widget";
import { ApiHealthCheck } from "@/components/providers/api-health-check";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <AuthBootstrap />
        <NotificationsBridge />
        <ApiHealthCheck />
        <SupportWidget />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4200,
            style: {
              background: "var(--color-card)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-soft)",
              borderRadius: "16px",
            },
          }}
        />
        {children}
      </ModalProvider>
    </ThemeProvider>
  );
}
