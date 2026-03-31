import { apiClient } from "@/lib/api/client";
import type { NotificationItem } from "@/types";

export async function getNotifications(sinceId?: number) {
  const params = sinceId ? { since_id: sinceId } : undefined;
  const response = await apiClient.get<NotificationItem[]>("/api/notifications/", { params });
  return response.data;
}

export async function markNotificationsRead(ids: number[]) {
  if (ids.length === 0) return;
  await apiClient.post("/api/notifications/mark-read/", { ids });
}
