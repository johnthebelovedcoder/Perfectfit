"use client";

/** Inline, retryable error banner for failed data fetches. */
export function QueryError({ onRetry, className = "" }: { onRetry?: () => void; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 ${className}`}
    >
      <p className="text-sm text-red-700">
        Couldn&apos;t load this data. Check your connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-sm font-semibold text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}
