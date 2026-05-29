export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="skeleton h-3 w-28 rounded-sm mb-4" />
        <div className="skeleton h-10 w-72 rounded-sm mb-4" />
        <div className="skeleton h-px w-14 mb-4" />
        <div className="skeleton h-3 w-44 rounded-sm" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xs p-5"
            style={{ border: "1px solid rgba(201,168,76,0.07)", background: "rgba(19,19,26,0.5)" }}
          >
            <div className="skeleton h-8 w-12 rounded-sm mb-2" />
            <div className="skeleton h-2 w-24 rounded-sm" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xs overflow-hidden"
        style={{ border: "1px solid rgba(201,168,76,0.07)" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ background: "rgba(13,13,18,0.9)", borderColor: "rgba(201,168,76,0.07)" }}
        >
          <div className="skeleton h-2 w-full rounded-sm" />
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(201,168,76,0.05)" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 flex items-center gap-6"
              style={{ borderColor: "rgba(201,168,76,0.05)" }}
            >
              <div className="skeleton h-3 w-6 rounded-sm" />
              <div className="skeleton h-3 flex-1 rounded-sm" />
              <div className="skeleton h-3 w-10 rounded-sm" />
              <div className="skeleton h-3 w-16 rounded-sm" />
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-4 w-4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
