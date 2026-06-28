"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import { Button } from "../../components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console or error-reporting service (e.g. Sentry)
    console.error("Marketing section crash:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-cairo" dir="rtl">
      {/* Aurora glow effect */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg text-center space-y-8 bg-[#12131a] p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent"></div>

        {/* Warning Icon */}
        <div className="h-20 w-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <AlertOctagon className="h-10 w-10" />
        </div>

        {/* Localized Messages */}
        <div className="space-y-4">
          {/* Arabic */}
          <div className="space-y-1.5">
            <h2 className="text-xl md:text-2xl font-black text-slate-100">حدث خطأ غير متوقع</h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              لقد واجهنا صعوبة في تحميل هذه الصفحة بسبب اتصال شبكة ضعيف أو خطأ تقني مؤقت.
            </p>
          </div>

          <div className="border-t border-slate-850/60 my-4" />

          {/* French / English */}
          <div className="space-y-1 text-slate-400 text-[11px] md:text-xs leading-relaxed" dir="ltr">
            <p className="font-bold text-slate-300">Une erreur inattendue est survenue.</p>
            <p>Veuillez réessayer ou retourner à l'accueil.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black rounded-xl h-12 px-6 flex items-center justify-center gap-2 border-none shadow-xl shadow-amber-500/10 transition-transform active:scale-95"
          >
            <RotateCcw className="h-4.5 w-4.5" />
            <span>إعادة المحاولة / Réessayer</span>
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-800 hover:bg-slate-900 text-slate-300 font-bold rounded-xl h-12 px-6 w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4.5 w-4.5" />
              <span>الرئيسية / Accueil</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
