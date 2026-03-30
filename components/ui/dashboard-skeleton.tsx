export function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-32 animate-pulse rounded-[1.75rem] bg-card/80" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-[1.75rem] bg-card/80"
          />
        ))}
      </div>
    </div>
  );
}
