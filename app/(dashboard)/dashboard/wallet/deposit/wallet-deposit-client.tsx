/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDepositAssets, createDepositRequest } from "@/lib/services/wallet";
import type { WalletAsset } from "@/types";

export function WalletDepositClient() {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: "",
    tx_hash: "",
    note: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDepositAssets();
        setAssets(data);
        setSelectedId(data[0]?.id ?? null);
      } catch (err) {
        console.error("Failed to load deposit assets", err);
        setError("Unable to load deposit assets.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? null,
    [assets, selectedId],
  );
  const estimatedUsdCredit = selectedAsset?.usd_rate && form.amount
    ? Number(form.amount) * selectedAsset.usd_rate
    : 0;

  const handleCopy = async () => {
    if (!selectedAsset) return;
    await navigator.clipboard.writeText(selectedAsset.wallet_address);
    toast.success("Wallet address copied.");
  };

  const handleSubmit = async () => {
    if (!selectedAsset) return;
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createDepositRequest({
        payment_asset_id: selectedAsset.id,
        amount: Number(form.amount),
        tx_hash: form.tx_hash || undefined,
        note: form.note || undefined,
      });
      toast.success("Deposit request submitted.");
      setForm({ amount: "", tx_hash: "", note: "" });
    } catch {
      setError("Unable to submit deposit request.");
      toast.error("Unable to submit deposit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Deposit"
        title="Use any checkout payment asset to fund your wallet"
        description="Deposits are submitted in the selected asset, then confirmed into your total available USD wallet balance so you can buy any product."
      />

      {loading ? (
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-border bg-card/90 p-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading deposit assets...</p>
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-6 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-[1.75rem] border border-border bg-card/90 p-6 text-sm text-muted">
          No deposit assets are configured yet. Add them from the admin dashboard under the `Wallet` tab.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {assets.map((asset) => {
              const active = asset.id === selectedId;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={`rounded-3xl border p-4 text-left transition ${active ? "border-primary bg-accent/80 shadow-lg" : "border-border bg-bg/65 hover:border-primary/40"}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {asset.symbol}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{asset.name}</h3>
                  <p className="mt-1 text-sm text-muted">{asset.network}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    1 {asset.symbol} = ${(asset.usd_rate ?? 0).toFixed(2)} USD
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    {asset.instructions || "Send using the network shown. Manual confirmation required."}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedAsset ? (
            <div className="rounded-3xl border border-border bg-bg/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Wallet address
              </p>
              <p className="mt-3 break-all rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm font-mono">
                {selectedAsset.wallet_address}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold"
              >
                <Copy className="h-4 w-4" />
                Copy address
              </button>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  QR code
                </p>
                {selectedAsset.qr_code ? (
                  <img
                    src={selectedAsset.qr_code}
                    alt={`${selectedAsset.name} QR code`}
                    className="mt-3 h-44 w-44 rounded-3xl border border-border object-cover"
                  />
                ) : (
                  <div className="mt-3 flex h-44 w-44 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted">
                    QR code not uploaded yet
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4">
                <label className="space-y-2 text-sm font-medium">
                  <span>Amount in {selectedAsset.symbol}</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3 outline-none focus:border-primary"
                    placeholder="0.00"
                  />
                </label>
                <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm">
                  <p className="text-muted">Estimated USD wallet credit</p>
                  <p className="mt-2 text-xl font-semibold">
                    ${estimatedUsdCredit.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Conversion rate: 1 {selectedAsset.symbol} = ${(selectedAsset.usd_rate ?? 0).toFixed(2)} USD
                  </p>
                </div>
                <label className="space-y-2 text-sm font-medium">
                  <span>Transaction hash (optional)</span>
                  <input
                    value={form.tx_hash}
                    onChange={(event) => setForm((current) => ({ ...current, tx_hash: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Note (optional)</span>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <p>Only send funds on the selected network. After admin confirmation, your wallet is credited in USD and can be used to buy any product.</p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit deposit request"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
