import { apiClient } from "@/lib/api/client";
import type { SupportMessage, SupportTicket } from "@/types";

export async function createSupportTicket(payload: {
  subject: string;
  message?: string;
  name?: string;
  email?: string;
}) {
  const response = await apiClient.post<SupportTicket>("/api/support/tickets/", payload);
  return response.data;
}

export async function getSupportTickets() {
  const response = await apiClient.get<SupportTicket[]>("/api/support/tickets/");
  return response.data;
}

export async function getSupportTicket(id: number) {
  const response = await apiClient.get<SupportTicket>(`/api/support/tickets/${id}/`);
  return response.data;
}

export async function createSupportMessage(payload: {
  ticket_id: number;
  message: string;
  name?: string;
  email?: string;
}) {
  const response = await apiClient.post<SupportMessage>("/api/support/messages/", payload);
  return response.data;
}
