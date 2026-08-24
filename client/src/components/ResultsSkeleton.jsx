import Skeleton from './ui/Skeleton';

// Two rows at the widest layout, without pretending to know what is coming.
const PLACEHOLDERS = 10;

function ResultsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      role="status"
      aria-label="Searching"
    >
      {/* status takes no name from content, so it needs readable text too. */}
      <span className="sr-only">Searching</span>

      {Array.from({ length: PLACEHOLDERS }, (_, index) => (
        <div className="flex flex-col gap-3" key={index}>
          {/* Repeats every five, so the shimmer sweeps a row. */}
          <Skeleton
            className="aspect-square"
            style={{ animationDelay: `${(index % 5) * 90}ms` }}
          />
          <Skeleton
            className="h-3 w-3/4"
            rounded="rounded-full"
            style={{ animationDelay: `${(index % 5) * 90}ms` }}
          />
          <Skeleton
            className="h-3 w-1/2"
            rounded="rounded-full"
            style={{ animationDelay: `${(index % 5) * 90}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

export default ResultsSkeleton;
