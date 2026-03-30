export function ProductGridSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.75rem] border border-border bg-card/80 p-4"
        >
          <div className="h-52 rounded-[1.35rem] bg-accent" />
          <div className="mt-5 h-4 w-24 rounded-full bg-accent" />
          <div className="mt-4 h-6 w-2/3 rounded-full bg-accent" />
          <div className="mt-3 h-4 w-full rounded-full bg-accent" />
          <div className="mt-2 h-4 w-5/6 rounded-full bg-accent" />
        </div>
      ))}
    </div>
  );
}
