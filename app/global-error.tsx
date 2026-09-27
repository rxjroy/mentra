"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Mentra Global Error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark min-h-full antialiased">
      <body className="bg-black text-white font-sans antialiased">
        <div className="min-h-screen w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white/80" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Critical Error
              </h1>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
                A critical application error has occurred. Please try refreshing the page.
              </p>
              {error?.digest && (
                <p className="text-[10px] text-white/25 font-mono mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
