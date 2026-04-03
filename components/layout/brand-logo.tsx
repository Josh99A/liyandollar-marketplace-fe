import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({
  ariaLabel,
  className,
  imageClassName,
  priority = false,
}: {
  ariaLabel?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center overflow-hidden", className)}
    >
      <Image
        src="/liyandollar-logo.png"
        alt="LiyanDollar Marketplace"
        width={220}
        height={220}
        loading={priority ? "eager" : undefined}
        priority={priority}
        className={cn("h-auto w-[4.5rem] sm:w-[5.25rem]", imageClassName)}
      />
    </Link>
  );
}
