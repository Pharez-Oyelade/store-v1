export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg dark:bg-gray-800" />
          <div className="h-4 w-72 bg-gray-100 rounded-md dark:bg-gray-850" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl dark:bg-gray-800" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-100 rounded-md dark:bg-gray-800" />
              <div className="size-8 rounded-xl bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-7 w-32 bg-gray-200 rounded-lg dark:bg-gray-800" />
            <div className="h-3 w-20 bg-gray-100 rounded-md dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Main Content Table / Card Skeleton */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs space-y-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-5 w-40 bg-gray-200 rounded-md dark:bg-gray-800" />
          <div className="h-8 w-24 bg-gray-100 rounded-lg dark:bg-gray-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-850"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-200 rounded-md dark:bg-gray-800" />
                  <div className="h-3 w-24 bg-gray-100 rounded-md dark:bg-gray-850" />
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
