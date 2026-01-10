export default function PlanningLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-10 bg-muted animate-pulse rounded" />
      <div className="h-12 bg-muted animate-pulse rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
