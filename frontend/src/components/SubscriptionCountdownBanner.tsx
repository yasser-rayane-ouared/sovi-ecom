"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardStore } from "../stores/dashboard";
import api from "../lib/api";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useLanguageStore } from "../stores/language";

export default function SubscriptionCountdownBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, isRtl } = useLanguageStore();
  const { selectedStore } = useDashboardStore();
  const currentStoreId = selectedStore?.id;

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");

  const checkStatus = async () => {
    if (!currentStoreId) return;
    try {
      const res = await api.get(`/subscriptions/status/?store_id=${currentStoreId}`);
      if (res.data?.has_active_subscription) {
        setRemainingSeconds(res.data.time_remaining_seconds);
        if (res.data.plans?.length > 0) {
          const plan = res.data.plans[0];
          const name = language === 'ar' 
            ? (plan.display_name_ar || plan.name)
            : (plan.name ? plan.name.charAt(0).toUpperCase() + plan.name.slice(1) : "");
          setPlanName(name);
        }
      } else {
        setRemainingSeconds(0);
      }
    } catch (err) {
      console.error("Failed to check subscription warning status", err);
    }
  };

  useEffect(() => {
    checkStatus();
    // Refresh every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentStoreId, language]);

  // Keep countdown ticking locally every second if remainingSeconds < 24h
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || remainingSeconds > 24 * 3600) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          checkStatus(); // re-verify with server
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Don't render if:
  // - No active store is loaded
  // - We don't have remainingSeconds computed
  // - The remaining time is more than 24 hours
  // - We are already on the billing page
  if (
    !currentStoreId || 
    remainingSeconds === null || 
    remainingSeconds <= 0 || 
    remainingSeconds > 24 * 3600 || 
    pathname === "/billing"
  ) {
    return null;
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  const bannerText = language === 'ar'
    ? `تنبيه: ينتهي اشتراك متجرك في خطة (${planName}) خلال ${hours} ساعة و ${minutes} دقيقة.`
    : (language === 'fr'
        ? `Attention : Votre abonnement de boutique pour le plan (${planName}) expire dans ${hours} heures et ${minutes} minutes.`
        : `Warning: Your store subscription for plan (${planName}) ends in ${hours} hours and ${minutes} minutes.`);

  const buttonText = language === 'ar'
    ? "جدد اشتراكك الآن"
    : (language === 'fr'
        ? "Renouveler maintenant"
        : "Renew Subscription Now");

  return (
    <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white py-3 px-4 text-center font-cairo text-sm font-bold flex items-center justify-center gap-3 relative z-50 shadow-md animate-pulse">
      <AlertCircle className="h-4 w-4 flex-shrink-0 animate-bounce" />
      <span>{bannerText}</span>
      <button 
        onClick={() => router.push("/billing")}
        className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors duration-150 flex items-center gap-1 border border-white/20"
      >
        {buttonText} <ArrowRight className={`h-3 w-3 ${isRtl ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}
