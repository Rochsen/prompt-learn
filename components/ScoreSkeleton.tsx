export function ScoreSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-5">
      <div className="flex items-center gap-5">
        <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-6 w-10 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-3 animate-pulse rounded-full bg-muted" />
      ))}
    </div>
  );
}
