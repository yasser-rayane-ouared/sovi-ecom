import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Glow behind */}
        <div className="absolute h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>

        {/* Custom Glassmorphic Spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-muted/20 border-t-primary animate-spin">
          <div className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm"></div>
        </div>

        <h3 className="mt-6 text-lg font-semibold tracking-wide text-foreground font-cairo">جاري التحميل...</h3>
        <p className="mt-1 text-sm text-muted">يرجى الانتظار قليلاً</p>
      </div>
    </div>
  );
}
