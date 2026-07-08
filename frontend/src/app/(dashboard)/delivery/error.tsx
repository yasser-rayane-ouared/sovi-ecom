"use client";

import { useEffect } from "react";

export default function DeliveryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Delivery page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-red-950/50 border border-red-500/30 rounded-2xl p-8 text-white space-y-4">
        <h2 className="text-xl font-bold text-red-400">⚠️ Shipping Rates Page Crashed</h2>
        <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
          <p className="text-sm font-mono text-red-300 break-all whitespace-pre-wrap">
            <strong>Error:</strong> {error.message}
          </p>
          {error.stack && (
            <pre className="text-xs font-mono text-red-200/60 mt-4 whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          )}
        </div>
        <button
          onClick={reset}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
