"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Headset,
  HelpCircle,
  MessageCircle,
  MessagesSquare,
  SendHorizonal,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSupportStore } from "@/stores/use-support-store";
import {
  createSupportMessage,
  createSupportTicket,
  getSupportTicket,
  getSupportTickets,
} from "@/lib/services/support";
import type { SupportMessage, SupportTicket } from "@/types";

type SupportTab = "home" | "messages" | "help" | "chat";

const faqItems = [
  {
    question: "How long does support take to reply?",
    answer: "We respond as quickly as possible and typically within a few hours on business days.",
  },
  {
    question: "Can I contact support without an account?",
    answer: "Yes. You can send a guest message with your name and email, and we will reply by email.",
  },
  {
    question: "Where can I find my order credentials?",
    answer: "Paid orders unlock credentials inside your dashboard order details and PDF download.",
  },
];

export function SupportWidget() {
  const { user } = useAuthStore();
  const isOpen = useSupportStore((state) => state.isOpen);
  const close = useSupportStore((state) => state.close);
  const [activeTab, setActiveTab] = useState<SupportTab>("home");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [guestProfile, setGuestProfile] = useState({ name: "", email: "" });
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [messageInput, setMessageInput] = useState("");

  const recentTicket = useMemo(() => tickets[0] ?? null, [tickets]);

  useEffect(() => {
    if (!isOpen) return;
    if (!user) return;
    setLoading(true);
    getSupportTickets()
      .then((data) => setTickets(data))
      .catch(() => toast.error("Unable to load support messages."))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("home");
      setSelectedTicket(null);
      setMessageInput("");
      return;
    }
  }, [isOpen]);

  const openTicket = async (ticketId: number) => {
    setLoading(true);
    try {
      const ticket = await getSupportTicket(ticketId);
      setSelectedTicket(ticket);
      setActiveTab("chat");
    } catch {
      toast.error("Unable to open that conversation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error("Please add a subject and message.");
      return;
    }
    if (!user && (!guestProfile.name || !guestProfile.email)) {
      toast.error("Please share your name and email so we can respond.");
      return;
    }
    setSending(true);
    try {
      const ticket = await createSupportTicket({
        subject: newTicket.subject,
        message: newTicket.message,
        name: user ? undefined : guestProfile.name,
        email: user ? undefined : guestProfile.email,
      });
      setSelectedTicket(ticket);
      setActiveTab("chat");
      setMessageInput("");
      setNewTicket({ subject: "", message: "" });
      toast.success("Support ticket created.");
      if (user) {
        setTickets((current) => [ticket, ...current]);
      }
    } catch {
      toast.error("Unable to submit your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket) return;
    if (!messageInput.trim()) {
      toast.error("Write a message before sending.");
      return;
    }
    setSending(true);
    try {
      const message = await createSupportMessage({
        ticket_id: selectedTicket.id,
        message: messageInput,
        name: user ? undefined : guestProfile.name,
        email: user ? undefined : guestProfile.email,
      });
      setSelectedTicket((current) =>
        current
          ? {
              ...current,
              messages: [...(current.messages ?? []), message],
              last_message: message.message,
              last_message_at: message.created_at,
            }
          : current,
      );
      setMessageInput("");
    } catch {
      toast.error("Unable to send message right now.");
    } finally {
      setSending(false);
    }
  };

  const chatMessages: SupportMessage[] = selectedTicket?.messages ?? [];
  const supportNumber = "15551234567";
  const whatsappLink = `https://wa.me/${supportNumber}?text=Hello%20I%20need%20help`;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-950/45 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl transition-transform sm:max-w-[26rem] lg:max-w-[30rem]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/30 via-primary/10 to-transparent px-5 pb-2 pt-2 text-foreground">
          <div className="flex items-center justify-between">
            <BrandLogo className="rounded-2xl bg-card px-2 py-1 text-foreground" />
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/70 text-foreground hover:bg-card"
              aria-label="Close support panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Support</p>
            <h2 className="mt-1 text-xl font-semibold">Hi there 👋</h2>
            <p className="mt-1 text-sm text-muted">How can we help?</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {["JD", "AM", "SL"].map((initials) => (
              <div
                key={initials}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/70 text-[10px] font-semibold text-foreground"
              >
                {initials}
              </div>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto px-5 pb-24 pt-5">
          {activeTab === "home" ? (
            <div className="grid gap-4">
              <section className="rounded-2xl border border-border bg-bg/60 p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Recent message</p>
                  <MessagesSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-3 text-sm text-muted">
                  {user ? (
                    recentTicket ? (
                      <>
                        <p className="font-semibold text-foreground">{recentTicket.subject}</p>
                        <p className="mt-1 line-clamp-2">{recentTicket.last_message ?? "No recent messages."}</p>
                        <button
                          type="button"
                          onClick={() => void openTicket(recentTicket.id)}
                          className="mt-3 text-sm font-semibold text-primary"
                        >
                          View conversation
                        </button>
                      </>
                    ) : (
                      <p>No recent messages.</p>
                    )
                  ) : (
                    <p>Login to view your messages.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-bg/60 p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Send us a message</p>
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted">Start an in-app support conversation.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  <Headset className="h-4 w-4" />
                  Start conversation
                </button>
              </section>

              <section className="rounded-2xl border border-border bg-bg/60 p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Talk to Support on WhatsApp</p>
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted">Chat directly with support.</p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-bg"
                >
                  Open WhatsApp
                </a>
              </section>

              <section className="rounded-2xl border border-border bg-bg/60 p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Help Center</p>
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted">Browse FAQs and guides.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("help")}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
                >
                  View help center
                </button>
              </section>
            </div>
          ) : null}

          {activeTab === "messages" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Messages</p>
                  <h3 className="mt-1 text-lg font-semibold">Your conversations</h3>
                </div>
              </div>
              {user ? (
                loading ? (
                  <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                    Loading conversations...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                    No recent messages.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => void openTicket(ticket.id)}
                        className="flex w-full flex-col rounded-2xl border border-border bg-bg/60 p-4 text-left hover:border-primary"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{ticket.subject}</p>
                          <span className="text-[11px] uppercase tracking-[0.24em] text-muted">
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted line-clamp-2">
                          {ticket.last_message ?? "No messages yet."}
                        </p>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                  Login to view your messages.
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "help" ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Help Center</p>
                <h3 className="mt-1 text-lg font-semibold">Quick answers</h3>
              </div>
              <div className="grid gap-3">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-border bg-bg/60 p-4">
                    <p className="text-sm font-semibold">{item.question}</p>
                    <p className="mt-2 text-sm text-muted">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "chat" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Messages</p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {selectedTicket?.subject || "Start a new conversation"}
                  </h3>
                </div>
                {selectedTicket ? (
                  <span className="rounded-full border border-border bg-bg/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                    {selectedTicket.status}
                  </span>
                ) : null}
              </div>

              {!selectedTicket ? (
                <div className="space-y-4 rounded-2xl border border-border bg-bg/60 p-4">
                  {!user ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium">
                        <span>Name</span>
                        <input
                          value={guestProfile.name}
                          onChange={(event) => setGuestProfile((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium">
                        <span>Email</span>
                        <input
                          value={guestProfile.email}
                          onChange={(event) => setGuestProfile((current) => ({ ...current, email: event.target.value }))}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                  ) : null}
                  <label className="space-y-2 text-sm font-medium">
                    <span>Subject</span>
                    <input
                      value={newTicket.subject}
                      onChange={(event) => setNewTicket((current) => ({ ...current, subject: event.target.value }))}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Message</span>
                    <textarea
                      rows={4}
                      value={newTicket.message}
                      onChange={(event) => setNewTicket((current) => ({ ...current, message: event.target.value }))}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  {!user ? (
                    <p className="text-xs text-muted">
                      We will reply via email. Please use a valid address so we can reach you.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCreateTicket}
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    {sending ? "Sending..." : "Submit request"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[320px] space-y-3 overflow-auto rounded-2xl border border-border bg-bg/60 p-4">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted">No messages yet.</p>
                    ) : (
                      chatMessages.map((message) => {
                        const isUser =
                          message.sender_role === "user" || message.sender_role === "guest";
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                              isUser
                                ? "ml-auto bg-primary text-white"
                                : "bg-card text-foreground",
                            )}
                          >
                            <p>{message.message}</p>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/70">
                              {message.created_at}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      className="flex-1 rounded-full border border-border bg-bg/70 px-4 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Type your message..."
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white disabled:opacity-70"
                    >
                      <SendHorizonal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>

        <nav className="fixed bottom-0 right-0 w-full border-t border-border bg-card/95 px-5 py-3 sm:max-w-[26rem] lg:max-w-[30rem]">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "home", label: "Home", icon: HelpCircle },
              { id: "messages", label: "Messages", icon: MessagesSquare },
              { id: "help", label: "Help", icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as SupportTab)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold",
                    active
                      ? "bg-primary text-white"
                      : "border border-border bg-bg text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </div>
  );
}
