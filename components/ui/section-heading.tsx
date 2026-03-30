import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-8 text-muted">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
