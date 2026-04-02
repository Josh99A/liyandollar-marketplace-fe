import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
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
        className={cn("h-auto w-[4.5rem] sm:w-[5.25rem]", imageClassName)}
      />
    </Link>
  );
}
