/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ArrowRight, Camera, Gift, Mail, ShoppingBag, Star, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/types";
import type { PaymentAsset } from "@/types";
import { getPaymentAssets } from "@/lib/services/payments";

function ProductFallbackIcon({ category }: { category: string }) {
  const normalized = category.toLowerCase();

  if (normalized.includes("facebook")) {
    return <UserRound className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("instagram")) {
    return <Camera className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("email")) {
    return <Mail className="h-10 w-10 text-white/90" />;
  }
  if (normalized.includes("gift")) {
    return <Gift className="h-10 w-10 text-white/90" />;
  }

  return <ShoppingBag className="h-10 w-10 text-white/90" />;
}

export function ProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<PaymentAsset[]>([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const openModal = async () => {
    setOpen(true);
    if (assetsLoaded) return;
    setLoadingAssets(true);
    setAssetError(null);
    try {
      const data = await getPaymentAssets();
      setAssets(data);
      setAssetsLoaded(true);
      setSelectedAssetId((current) => current ?? data[0]?.id ?? null);
    } catch {
      setAssetError("Unable to load payment assets. Please try again shortly.");
    } finally {
      setLoadingAssets(false);
    }
  };

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  const handleCopy = async () => {
    if (!selectedAsset) return;
    await navigator.clipboard.writeText(selectedAsset.wallet_address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="group rounded-[1.75rem] border border-border bg-card/90 p-4 shadow-[var(--shadow-soft)]">
      <div
        className={`relative flex h-52 items-center justify-center overflow-hidden rounded-[1.35rem] bg-gradient-to-br ${product.gradient} transition duration-300 group-hover:scale-[1.015]`}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ProductFallbackIcon category={product.category} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/35 to-transparent" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {product.category}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <Star className="h-4 w-4 fill-current text-amber-400" />
          {product.rating}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{product.name}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{product.description}</p>
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Starting at</p>
          <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void openModal()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:-translate-y-0.5"
          >
            Buy
          </button>
          <Link
            href={`/marketplace/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bg/70 px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          >
            Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[2rem] border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-primary">
                  Crypto payment
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Choose a supported crypto asset to view the QR code and wallet address.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg"
                aria-label="Close payment modal"
              >
                ×
              </button>
            </div>

            {loadingAssets ? (
              <div className="mt-6 rounded-2xl border border-border bg-bg/60 p-4 text-sm text-muted">
                Loading payment assets...
              </div>
            ) : assetError ? (
              <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
                {assetError}
              </div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-3">
                  {assets.map((asset) => {
                    const active = asset.id === selectedAssetId;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`rounded-3xl border p-4 text-left transition ${active ? "border-primary bg-accent/80 shadow-lg" : "border-border bg-bg/65 hover:border-primary/40"}`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                          {asset.symbol}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{asset.name}</h3>
                        <p className="mt-1 text-sm text-muted">{asset.network}</p>
                        <p className="mt-2 text-xs leading-6 text-muted">
                          {asset.instructions || "Admin-configured manual settlement instructions."}
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
                      {copied ? "Copied" : "Copy address"}
                    </button>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        QR code
                      </p>
                      {selectedAsset.qr_code_image ? (
                        <img
                          src={selectedAsset.qr_code_image}
                          alt={`${selectedAsset.name} QR code`}
                          className="mt-3 h-44 w-44 rounded-3xl border border-border object-cover"
                        />
                      ) : (
                        <div className="mt-3 flex h-44 w-44 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted">
                          QR code not uploaded yet
                        </div>
                      )}
                    </div>

                    <p className="mt-5 text-sm leading-6 text-muted">
                      Payments are manually confirmed by an admin. Credentials are released only after confirmation.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
