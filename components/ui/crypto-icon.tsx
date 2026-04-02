"use client";

import {
  SiBitcoin,
  SiEthereum,
  SiTether,
  SiBinance,
  SiLitecoin,
  SiDogecoin,
  SiSolana,
} from "react-icons/si";
import { BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BTC: SiBitcoin,
  ETH: SiEthereum,
  USDT: SiTether,
  USDC: BadgeDollarSign,
  BNB: SiBinance,
  LTC: SiLitecoin,
  DOGE: SiDogecoin,
  SOL: SiSolana,
  TRX: SiSolana,
};

export function AssetIcon({
  symbol,
  network,
  size = 36,
  className,
}: {
  symbol: string;
  network?: string | null;
  size?: number;
  className?: string;
}) {
  const normalizedSymbol = symbol.toUpperCase();
  const Icon = ICON_MAP[normalizedSymbol] ?? BadgeDollarSign;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-bg/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="h-5 w-5 text-primary" />
    </div>
  );
}
