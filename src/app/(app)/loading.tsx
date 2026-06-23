function CardSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[1.75rem] bg-white/65 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6" aria-label="Loading page" role="status">
      <header className="space-y-3">
        <CardSkeleton className="h-4 w-24" />
        <CardSkeleton className="h-14 w-64 max-w-full" />
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    </div>
  );
}
