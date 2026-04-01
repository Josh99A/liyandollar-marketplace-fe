"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "@/components/ui/section-heading";
import { createWithdrawalRequest, getWallet } from "@/lib/services/wallet";
import type { WalletSummary } from "@/types";

export function WalletWithdrawClient() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: "",
    destination_address: "",
    network: "",
    destination_qr_code: null as File | null,
    note: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWallet();
        setWallet(data);
      } catch {
        setError("Unable to load wallet balance.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }
    if (!form.destination_address.trim() || !form.network.trim()) {
      toast.error("Destination address and network are required.");
      return;
    }
    if (wallet && Number(form.amount) > wallet.balance) {
      toast.error("Withdrawal amount exceeds your available balance.");
      return;
    }
    const confirmMessage = `You are requesting $${Number(form.amount).toFixed(2)} on ${form.network} to:\n${form.destination_address}\n\nAre you sure all details are correct?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("amount", form.amount);
      formData.append("destination_address", form.destination_address);
      formData.append("network", form.network);
      if (form.destination_qr_code) {
        formData.append("destination_qr_code", form.destination_qr_code);
      }
      if (form.note) {
        formData.append("note", form.note);
      }
      await createWithdrawalRequest(formData);
      toast.success("Withdrawal request submitted for admin review.");
      setForm({
        amount: "",
        destination_address: "",
        network: "",
        destination_qr_code: null,
        note: "",
      });
    } catch {
      setError("Unable to submit withdrawal request.");
      toast.error("Unable to submit withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Withdraw"
        title="Request a withdrawal to your destination wallet"
        description="Withdrawals are reviewed by admins before release. Double-check your network and address to avoid delays."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading wallet balance...</p>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-6 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : (
        <section className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted">
                Available balance
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                ${wallet?.balance.toFixed(2)}
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Amount</span>
              <input
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                placeholder="0.00"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Network</span>
              <input
                value={form.network}
                onChange={(event) => setForm((current) => ({ ...current, network: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                placeholder="TRC20, ERC20, etc."
              />
            </label>
            <label className="space-y-2 text-sm font-medium sm:col-span-2">
              <span>Destination wallet address</span>
              <input
                value={form.destination_address}
                onChange={(event) => setForm((current) => ({ ...current, destination_address: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
                placeholder="Enter your wallet address"
              />
            </label>
            <label className="space-y-2 text-sm font-medium sm:col-span-2">
              <span>Destination QR code (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setForm((current) => ({ ...current, destination_qr_code: event.target.files?.[0] ?? null }))
                }
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm font-medium sm:col-span-2">
              <span>Note (optional)</span>
              <textarea
                rows={3}
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>Double-check the network and address. Withdrawals are manually reviewed before funds are released.</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Submit withdrawal request"}
          </button>
        </section>
      )}
    </div>
  );
}
