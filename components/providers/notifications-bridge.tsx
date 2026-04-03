"use client";

import axios from "axios";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { getNotifications, markNotificationsRead } from "@/lib/services/notifications";
import type { NotificationItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function toastForNotification(notification: NotificationItem) {
  const message = `${notification.title}: ${notification.message}`;
  switch (notification.level) {
    case "success":
      toast.success(message);
      break;
    case "warning":
      toast(message, { icon: "!" });
      break;
    case "error":
      toast.error(message);
      break;
    default:
      toast(message);
  }
}

export function NotificationsBridge() {
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const user = useAuthStore((state) => state.user);
  const lastIdRef = useRef<number>(0);
  const pollingRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!hasBootstrapped || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const stopRealtime = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const handleNotifications = async (items: NotificationItem[]) => {
      if (items.length === 0) return;
      items.forEach(toastForNotification);
      lastIdRef.current = Math.max(lastIdRef.current, ...items.map((item) => item.id));
      try {
        await markNotificationsRead(items.map((item) => item.id));
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          stopRealtime();
        }
      }
    };

    const poll = async () => {
      try {
        const items = await getNotifications(lastIdRef.current || undefined);
        await handleNotifications(items);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          stopRealtime();
          return;
        }
      }
    };

    const startPolling = () => {
      void poll();
      pollingRef.current = window.setInterval(() => {
        void poll();
      }, 30000);
    };

    try {
      const eventSource = new EventSource(`${API_URL}/api/notifications/stream/`, {
        withCredentials: true,
      } as EventSourceInit);
      eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const payload = JSON.parse(event.data) as NotificationItem[] | NotificationItem;
          const items = Array.isArray(payload) ? payload : [payload];
          void handleNotifications(items);
        } catch {
          // Ignore malformed payloads.
        }
      };
      eventSource.onerror = () => {
        eventSource.close();
        if (!pollingRef.current) {
          startPolling();
        }
      };
      eventSourceRef.current = eventSource;
    } catch {
      startPolling();
    }

    return () => {
      stopRealtime();
    };
  }, [hasBootstrapped, user]);

  return null;
}
