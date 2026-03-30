import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <Image
        src="/liyandollar-logo.png"
        alt="LiyanDollar Marketplace"
        width={220}
        height={220}
        priority={priority}
        className="h-auto w-[5.5rem] sm:w-[6.5rem]"
      />
    </Link>
  );
}
