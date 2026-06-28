"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useLanguageStore } from "../../../stores/language";
import { useDashboardStore } from "../../../stores/dashboard";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { 
  AlertCircle, CheckCircle2, Clock, UploadCloud, FileText, 
  Image as ImageIcon, Sparkles, Check, Calendar, Coins, 
  History, ExternalLink, Loader2, CreditCard
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

export default function BillingDashboard() {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl, language } = useLanguageStore();
  const currentStoreId = selectedStore?.id;

  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [usdtExchangeRate, setUsdtExchangeRate] = useState<number>(260);
  
  // Modals / forms
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"baridimob_ccp" | "redotpay">("baridimob_ccp");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getFeaturesForPlan = (planName: string) => {
    const baseName = planName.replace("_yearly", "");
    if (language === "ar") {
      if (baseName === "starter") {
        return [
          "5 منتجات نشطة كحد أقصى",
          "موظف مساعد واحد (1 Worker)",
          "2 بكسل تتبع إعلاني (Pixels)",
          "200 طلبية شهرياً كحد أقصى",
          "صفحات هبوط ونظام دفع COD متكامل",
          "مزامنة Google Sheets وشحن Yalidine/ZR",
          "حماية OTP SMS ومنع زيارات السبام",
          "جميع ميزات منصة Sovi مفعلة بالكامل",
        ];
      } else if (baseName === "pro") {
        return [
          "15 منتج نشط كحد أقصى",
          "5 موظفين مساعدين (5 Workers)",
          "5 بكسلات تتبع إعلاني (Pixels)",
          "1000 طلبية شهرياً كحد أقصى",
          "صفحات هبوط ونظام دفع COD متكامل",
          "مزامنة Google Sheets وشحن Yalidine/ZR",
          "حماية OTP SMS ومنع زيارات السبام",
          "جميع ميزات منصة Sovi مفعلة بالكامل",
        ];
      } else {
        return [
          "عدد منتجات غير محدود بالكامل",
          "عدد مساعدين غير محدود (Workers)",
          "عدد بكسلات غير محدود (Pixels)",
          "طلبيات شهرية غير محدودة بالكامل",
          "ربط ومساعد الذكاء الاصطناعي Claude AI",
          "إدارة متاجر متعددة (Multi Store)",
          "مزامنة Google Sheets وشحن Yalidine/ZR",
          "جميع ميزات منصة Sovi مفعلة بالكامل",
        ];
      }
    } else if (language === "fr") {
      if (baseName === "starter") {
        return [
          "Max 5 produits actifs",
          "Max 1 compte employé (Worker)",
          "Max 2 pixels publicitaires",
          "Max 200 commandes par mois",
          "Landing pages & checkout COD de luxe",
          "Google Sheets sync & transporteurs (Yalidine, ZR)",
          "Bouclier anti-fraude & validation OTP SMS",
          "Toutes les fonctionnalités Sovi activées",
        ];
      } else if (baseName === "pro") {
        return [
          "Max 15 produits actifs",
          "Max 5 comptes employés (Workers)",
          "Max 5 pixels publicitaires",
          "Max 1000 commandes par mois",
          "Landing pages & checkout COD de luxe",
          "Google Sheets sync & transporteurs (Yalidine, ZR)",
          "Bouclier anti-fraude & validation OTP SMS",
          "Toutes les fonctionnalités Sovi activées",
        ];
      } else {
        return [
          "Produits actifs illimités",
          "Comptes employés illimités",
          "Pixels publicitaires illimités",
          "Commandes mensuelles illimitées",
          "Connecteur Claude AI MCP",
          "Multi-boutiques (Multi-Store)",
          "Google Sheets sync & transporteurs (Yalidine, ZR)",
          "Toutes les fonctionnalités Sovi activées",
        ];
      }
    } else {
      if (baseName === "starter") {
        return [
          "Max 5 active products",
          "Max 1 worker account",
          "Max 2 ad pixels",
          "Max 200 orders per month",
          "Luxury landing pages & COD checkout",
          "Google Sheets sync & shipping (Yalidine, ZR)",
          "Anti-fraud shield & OTP SMS verification",
          "All Sovi platform features unlocked",
        ];
      } else if (baseName === "pro") {
        return [
          "Max 15 active products",
          "Max 5 worker accounts",
          "Max 5 ad pixels",
          "Max 1000 orders per month",
          "Luxury landing pages & COD checkout",
          "Google Sheets sync & shipping (Yalidine, ZR)",
          "Anti-fraud shield & OTP SMS verification",
          "All Sovi platform features unlocked",
        ];
      } else {
        return [
          "Unlimited active products",
          "Unlimited worker accounts",
          "Unlimited ad pixels",
          "Unlimited monthly orders",
          "Claude AI MCP connector",
          "Multi-boutique management (Multi-Store)",
          "Google Sheets sync & shipping (Yalidine, ZR)",
          "All Sovi platform features unlocked",
        ];
      }
    }
  };

  const fetchBillingData = async () => {
    if (!currentStoreId) return;
    setLoading(true);
    try {
      const [plansRes, subsRes, receiptsRes, statusRes, rateRes] = await Promise.all([
        api.get("/subscriptions/plans/"),
        api.get(`/subscriptions/my/?store_id=${currentStoreId}`),
        api.get(`/subscriptions/receipts/?store_id=${currentStoreId}`),
        api.get(`/subscriptions/status/?store_id=${currentStoreId}`),
        api.get("/subscriptions/usdt-rate/").catch(() => ({ data: { usdt_rate: 260 } }))
      ]);
      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
      setReceipts(receiptsRes.data || []);
      setLimits(statusRes.data || null);
      setUsdtExchangeRate(rateRes.data?.usdt_rate || 260);
    } catch (err) {
      console.error(err);
      setError(t("billingDataLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [currentStoreId]);

  // Pre-populate amount when plan or payment method changes
  useEffect(() => {
    if (selectedPlan) {
      if (paymentMethod === "redotpay") {
        const usdtAmount = (selectedPlan.price_da / usdtExchangeRate).toFixed(2);
        setAmount(usdtAmount);
      } else {
        setAmount(Math.round(selectedPlan.price_da).toString());
      }
    }
  }, [selectedPlan, paymentMethod, usdtExchangeRate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError(t("billingReceiptSubmitErrorPlan", "يرجى اختيار خطة الاشتراك"));
      return;
    }
    if (!file) {
      setError(t("billingReceiptSubmitErrorReceipt", "يرجى إرفاق صورة إيصال الدفع"));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t("billingReceiptSubmitErrorAmount", "يرجى إدخال مبلغ صحيح"));
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("store_id", currentStoreId);
    formData.append("plan", selectedPlan.id);
    formData.append("payment_method", paymentMethod);
    
    if (paymentMethod === "redotpay") {
      const usdtVal = parseFloat(amount);
      const daVal = Math.round(usdtVal * usdtExchangeRate);
      formData.append("amount_da", daVal.toString());
      formData.append("amount_usdt", usdtVal.toFixed(2));
    } else {
      formData.append("amount_da", amount);
    }
    
    formData.append("receipt_image", file);
    if (note.trim()) {
      formData.append("note", note.trim());
    }

    try {
      await api.post("/subscriptions/receipts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess(t("billingReceiptSubmitSuccess"));
      setIsSubmitModalOpen(false);
      resetForm();
      fetchBillingData();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.detail || 
        t("billingReceiptSubmitError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPlan(null);
    setPaymentMethod("baridimob_ccp");
    setAmount("");
    setNote("");
    setFile(null);
    setFilePreview(null);
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return t("billingExpired");
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours < 24) {
      return t("billingHoursMinutesLeft").replace("{hours}", hours.toString()).replace("{minutes}", minutes.toString());
    }
    
    const days = Math.floor(hours / 24);
    return t("billingDaysLeft").replace("{days}", days.toString());
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t("billingLoadingTitle")}</p>
        </div>
      </div>
    );
  }

  const renderLimitProgress = (title: string, current: number, max: number) => {
    const isUnlimited = max === -1;
    const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
    const remaining = isUnlimited ? t("billingUsageUnlimited") : Math.max(0, max - current);
    
    // Choose progress bar color based on percentage
    let progressColor = "bg-primary";
    if (percentage >= 90) progressColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    else if (percentage >= 70) progressColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    else progressColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";

    return (
      <div className={`space-y-2 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`}>
        <div className={`flex justify-between items-center  text-xs md:text-sm ${isRtl ? "flex-row-reverse" : ""}`}>
          <span className="font-bold text-foreground/90">{title}</span>
          <span className={`text-muted-foreground flex gap-1 items-center  ${isRtl ? "flex-row-reverse" : ""}`}>
            {isUnlimited ? (
              <span className="font-semibold text-primary">{current} / {t("billingUsageUnlimited")}</span>
            ) : (
              <>
                <span className="font-semibold text-foreground">{current}</span>
                <span className="text-[10px]">{t("billingUsageOf")}</span>
                <span className="font-semibold text-foreground">{max}</span>
                <span className="text-[10px] mr-1">{"("}</span>
                <span className={`font-bold text-xs ${remaining === 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {remaining} {t("billingUsageRemaining").replace("{remaining}", "")}
                </span>
                <span className="text-[10px]">{")"}</span>
              </>
            )}
          </span>
        </div>
        
        {/* Progress Bar Track */}
        <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden relative border border-border/20">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${progressColor} ${
              isUnlimited ? "w-full opacity-35 bg-gradient-to-r from-primary to-accent animate-pulse" : ""
            }`}
            style={{ width: isUnlimited ? "100%" : `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Check if any active subscription is expiring in less than 24 hours
  const isExpiringSoon = limits?.has_active_subscription && 
    limits?.time_remaining_seconds > 0 && 
    limits?.time_remaining_seconds <= 24 * 3600;

  return (
    <div className={`space-y-8 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Expiry Alarm Banner */}
      {isExpiringSoon && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm md:text-base">{t("billingAlarmTitle")}</h4>
            <p className="text-xs text-red-300">
              {t("billingAlarmDesc").replace("{time}", formatCountdown(limits.time_remaining_seconds))}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Active Status & Expiry */}
        <Card className="border-border bg-card/60 backdrop-blur-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>{t("billingStatusTitle")}</span>
              <Coins className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>{t("billingStatusDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {limits?.has_active_subscription ? (
              <div className="space-y-6">
                {limits.plans.map((sub: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border bg-background/50 space-y-3">
                    <div className={`flex justify-between items-center  ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="font-bold text-lg text-primary">{sub.display_name_ar}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        sub.is_trial ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/10 text-primary"
                      }`}>
                        {sub.is_trial ? t("billingTrialPeriod") : t("billingPaidSub")}
                      </span>
                    </div>

                    <div className={`flex justify-between items-center text-xs text-muted-foreground  ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span>{t("billingExpiresAt")}</span>
                      <span className="font-semibold text-foreground">
                        {new Date(sub.end_date).toLocaleDateString("ar-DZ")}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{t("billingTimeRemaining", "الوقت الإجمالي المتبقي")}</div>
                  <div className="text-base font-bold text-emerald-400">
                    {formatCountdown(limits.time_remaining_seconds)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-red-400 text-sm">{t("billingNoActiveSub")}</h4>
                <p className="text-xs text-muted-foreground">
                  t("billingNoActiveSubDesc")
                </p>
              </div>
            )}

            <Button 
              onClick={() => {
                const currentFiltered = plans.filter((p) => {
                  const isYearly = p.name.includes("yearly");
                  return billingCycle === "yearly" ? isYearly : !isYearly;
                });
                if (currentFiltered.length > 0) {
                  setSelectedPlan(currentFiltered[0]);
                } else if (plans.length > 0) {
                  setSelectedPlan(plans[0]);
                }
                setIsSubmitModalOpen(true);
              }}
              className="w-full py-6 font-bold"
              variant="glow"
            >
              {t("billingRenewBtn")}
            </Button>
          </CardContent>
        </Card>

        {/* Right Side: Limits and Features Stack */}
        <Card className="border-border bg-card/60 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>{t("billingLimitsTitle")}</span>
              <Sparkles className="h-5 w-5 text-accent" />
            </CardTitle>
            <CardDescription>{t("billingLimitsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {limits?.has_active_subscription ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6  ${isRtl ? "text-right" : "text-left"}`}>
                
                {/* Numeric Limits */}
                <div className="space-y-5">
                  <h4 className="font-bold text-sm border-b border-border pb-2 text-primary">{t("billingLimitsTitle")}</h4>
                  
                  {renderLimitProgress(t("billingUsageProducts"), limits.usage?.products || 0, limits.max_products)}
                  {renderLimitProgress(t("billingUsageWorkers"), limits.usage?.workers || 0, limits.max_workers)}
                  {renderLimitProgress(t("billingUsagePixels"), limits.usage?.pixels || 0, limits.max_pixels)}
                  {renderLimitProgress(t("billingUsageOrders"), limits.usage?.orders_this_month || 0, limits.max_orders_per_month)}
                </div>

                {/* Features OR List */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm border-b border-border pb-2 text-accent">{t("billingLimitsFeaturesTitle", "الميزات المدعومة")}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t("billingFeatureCustomDomain"), value: limits.has_custom_domain },
                      { label: t("billingFeatureAbTesting"), value: limits.has_ab_testing },
                      { label: t("billingFeatureCoupons"), value: limits.has_coupons },
                      { label: t("billingFeatureOtp"), value: limits.has_otp },
                      { label: t("billingFeatureCaptcha"), value: limits.has_captcha },
                      { label: t("billingFeatureBlockIps"), value: limits.has_algerian_ip },
                      { label: t("billingFeatureAnalytics"), value: limits.has_advanced_analytics },
                      { label: t("billingFeatureApi"), value: limits.has_api_access },
                    ].map((f, idx) => (
                      <div key={idx} className="flex items-center justify-end gap-1.5 text-xs">
                        <span className={f.value ? "text-foreground" : "text-muted-foreground line-through"}>{f.label}</span>
                        <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center ${
                          f.value ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {f.value ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">×</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {t("billingLimitsNoActiveSubPrompt", "يرجى تفعيل اشتراك أولاً لعرض حدود الاستهلاك والميزات المتاحة.")}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Receipts History */}
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span>{t("billingReceiptsTitle")}</span>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription>{t("billingReceiptsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full  text-sm ${isRtl ? "text-right" : "text-left"}`}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColPlan")}</th>
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColMethod")}</th>
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColAmount")}</th>
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColDate")}</th>
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColStatus")}</th>
                    <th className={`pb-3 ${isRtl ? "text-right" : "text-left"}`}>{t("billingColNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors duration-150">
                      <td className="py-4 font-bold text-foreground">{receipt.plan_display_name_ar}</td>
                      <td className="py-4 text-xs text-muted-foreground">
                        {receipt.payment_method === "baridimob_ccp" ? t("billingModalMethodCcp") : t("billingModalMethodRedotpay")}
                      </td>
                      <td className="py-4 font-semibold text-primary">
                        {receipt.payment_method === "redotpay" && receipt.amount_usdt ? (
                          <span className="font-outfit">{parseFloat(receipt.amount_usdt).toFixed(2)} USDT</span>
                        ) : (
                          <span>{Math.round(receipt.amount_da)} {language === 'ar' ? "دج" : "DA"}</span>
                        )}
                      </td>
                      <td className="py-4 text-xs text-muted-foreground">
                        {new Date(receipt.submitted_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'en-US')}
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${
                          receipt.status === "approved" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : receipt.status === "declined"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {receipt.status === "approved" ? t("billingStatusApproved") : receipt.status === "declined" ? t("billingStatusDeclined") : t("billingStatusPending")}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-muted-foreground max-w-xs truncate">
                        {receipt.admin_note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p>{t("billingNoReceipts")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Receipt Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6  animate-in fade-in zoom-in-95 duration-200 ${isRtl ? "text-right" : "text-left"}`}>
            
            <div className={`flex justify-between items-center border-b border-border pb-4  ${isRtl ? "flex-row-reverse" : ""}`}>
              <h3 className="text-xl font-bold">{t("billingModalTitle")}</h3>
              <button 
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="space-y-6">
              
              {/* Step 1: Select Plan */}
              <div className="space-y-4">
                <div className={`flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`}>
                  <label className="text-sm font-semibold">{t("billingModalStep1")}</label>
                  
                  {/* Monthly / Yearly Toggle */}
                  <div className="bg-muted p-1 rounded-xl inline-flex gap-1 border border-border/10">
                    <button
                      type="button"
                      onClick={() => {
                        setBillingCycle("monthly");
                        const monthlyPlans = plans.filter(p => !p.name.includes("yearly"));
                        if (monthlyPlans.length > 0) setSelectedPlan(monthlyPlans[0]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        billingCycle === "monthly"
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {language === "ar" ? "شهري" : "Monthly"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBillingCycle("yearly");
                        const yearlyPlans = plans.filter(p => p.name.includes("yearly"));
                        if (yearlyPlans.length > 0) setSelectedPlan(yearlyPlans[0]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        billingCycle === "yearly"
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{language === "ar" ? "سنوي" : "Yearly"}</span>
                      <span className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-1 py-0.5 rounded text-[8px] font-extrabold uppercase scale-90">
                        {language === "ar" ? "خصم" : "-16%"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {plans
                    .filter((p) => {
                      const isYearly = p.name.includes("yearly");
                      return billingCycle === "yearly" ? isYearly : !isYearly;
                    })
                    .map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-4 rounded-xl border cursor-pointer text-center space-y-1 transition-all duration-200 ${
                          selectedPlan?.id === p.id 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[1.02]" 
                            : "border-border bg-background/50 hover:border-primary/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">{p.display_name_ar}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.name.replace("_yearly", "")}</div>
                        <div className="text-sm font-bold text-primary mt-2">
                          {Math.round(p.price_da)} {language === 'ar' ? "دج" : "DA"}
                          <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                            {billingCycle === "yearly" 
                              ? (language === "ar" ? "سنوياً" : "/ year")
                              : (language === "ar" ? "شهرياً" : "/ month")}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Selected Plan Features */}
                {selectedPlan && (
                  <div className={`mt-3 p-4 rounded-xl bg-muted/30 border border-border/80 text-xs space-y-2.5 ${isRtl ? "text-right" : "text-left"}`}>
                    <div className={`font-bold text-foreground flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <span>{language === 'ar' ? "ميزات الباقة المحددة:" : (language === 'fr' ? "Caractéristiques de l'offre sélectionnée :" : "Features of the selected plan:")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {getFeaturesForPlan(selectedPlan.name).map((feat, fIdx) => (
                        <div key={fIdx} className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-muted-foreground">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Select Payment Method */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("billingModalStep2")}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setPaymentMethod("baridimob_ccp")}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200 ${isRtl ? "flex-row-reverse" : ""} ${
                      paymentMethod === "baridimob_ccp" 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-background/50 hover:border-primary/20"
                    }`}
                  >
                    <div className={`  ${isRtl ? "text-right" : "text-left"}`}>
                      <div className="font-bold text-sm">{t("billingModalMethodCcp")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("billingModalMethodCcpDesc")}</div>
                    </div>
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>

                  <div 
                    onClick={() => setPaymentMethod("redotpay")}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200 ${isRtl ? "flex-row-reverse" : ""} ${
                      paymentMethod === "redotpay" 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-background/50 hover:border-primary/20"
                    }`}
                  >
                    <div className={`  ${isRtl ? "text-right" : "text-left"}`}>
                      <div className="font-bold text-sm">{t("billingModalMethodRedotpay")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("billingModalMethodRedotpayDesc")}</div>
                    </div>
                    <Coins className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </div>

              {/* Account details to show */}
              <div className={`p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2  ${isRtl ? "text-right" : "text-left"}`}>
                <div className="font-bold text-foreground">{t("billingModalOfficialDetails")}</div>
                
                {paymentMethod === "baridimob_ccp" ? (
                  <div className="space-y-1">
                    <div>• {t("billingModalCcpLine1")}</div>
                    <div>• {t("billingModalCcpLine2")}</div>
                    <div>• {t("billingModalCcpLine3")}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>• {t("billingModalRedotpayLine1")}</div>
                    <div>• {t("billingModalRedotpayLine2")}</div>
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-between text-xs">
                      <span>{isRtl ? "سعر صرف RedotPay المعتمد:" : "Approved RedotPay exchange rate:"}</span>
                      <span className="font-outfit">1 USDT = {usdtExchangeRate} DA</span>
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  {t("billingModalWarning")}
                </div>
              </div>

              {/* Step 3: Upload Receipt */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">{t("billingModalStep3")}</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer space-y-2 transition-colors duration-200"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {filePreview ? (
                    <div className="space-y-2">
                      <img 
                        src={filePreview} 
                        alt="Receipt Preview" 
                        className="max-h-40 mx-auto rounded-lg shadow-sm border border-border"
                      />
                      <p className="text-xs text-primary font-bold">{file?.name}</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto opacity-70" />
                      <p className="text-sm text-foreground/80 font-bold">{t("billingModalUploadPrompt")}</p>
                      <p className="text-[10px] text-muted-foreground">{t("billingModalUploadLimit")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form details (amount + note) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    {paymentMethod === "redotpay" 
                      ? (isRtl ? "المبلغ المدفوع (USDT)" : "Amount paid (USDT)")
                      : t("billingModalAmountDa")}
                  </label>
                  <div className="relative">
                    <Input 
                      required
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`font-outfit ${isRtl ? "text-right pr-4 pl-12" : "text-left pl-4 pr-12"}`}
                    />
                    <span className={`absolute top-2.5 text-[10px] font-bold text-muted-foreground ${isRtl ? "left-3" : "right-3"}`}>
                      {paymentMethod === "redotpay" ? "USDT" : (language === "ar" ? "دج" : "DA")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">{t("billingModalNote")}</label>
                  <Input 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("billingModalNotePl")}
                    className={`  ${isRtl ? "text-right" : "text-left"}`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t border-border  ${isRtl ? "flex-row-reverse" : ""}`}>
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="py-5 text-sm font-bold flex items-center justify-center gap-1.5 px-6"
                  variant="glow"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("billingModalSubmittingBtn")}
                    </>
                  ) : (
                    t("billingModalSubmitBtn")
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    resetForm();
                  }}
                  className="py-5"
                >
                  {t("billingModalCancelBtn")}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
