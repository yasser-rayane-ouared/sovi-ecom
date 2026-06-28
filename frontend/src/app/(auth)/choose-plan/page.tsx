"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import api from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Check, Sparkles, Loader2, ArrowRight, Star } from "lucide-react";

export default function ChoosePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized, initialize } = useAuthStore();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (initialized && user?.is_superadmin) {
      router.push("/admin/accounts");
    }
  }, [user, initialized, router]);

  // Fetch plans and resolve storeId
  useEffect(() => {
    const storeParam = searchParams.get("store_id");
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch plans
        const planRes = await api.get("/subscriptions/plans/");
        setPlans(planRes.data || []);

        // Resolve store id
        let currentStoreId = storeParam;
        if (!currentStoreId) {
          // Fallback: get user's stores
          const storeRes = await api.get("/stores/");
          const stores = Array.isArray(storeRes.data)
            ? storeRes.data
            : (storeRes.data?.results || []);
          if (stores.length > 0) {
            currentStoreId = stores[0].id;
          }
        }

        if (currentStoreId) {
          setStoreId(currentStoreId);
          // Check active subscription status
          const statusRes = await api.get(`/subscriptions/status/?store_id=${currentStoreId}`);
          setHasActiveSub(statusRes.data?.has_active_subscription || false);
        }
      } catch (err: any) {
        console.error("Failed to load plans or stores", err);
        setError("فشل تحميل خطط الاشتراك. يرجى إعادة المحاولة.");
      } finally {
        setLoading(false);
      }
    };

    if (initialized) {
      fetchData();
    }
  }, [initialized, searchParams]);

  const handleStartTrial = async (planId: string) => {
    if (!storeId) {
      setError("لم يتم تحديد متجر نشط. يرجى إنشاء متجر أولاً.");
      return;
    }

    setSubmitting(planId);
    setError("");

    try {
      await api.post("/subscriptions/start-trial/", {
        store_id: storeId,
        plan_id: planId,
      });
      // Redirect to dashboard overview
      router.push("/overview");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "حدث خطأ أثناء بدء الفترة التجريبية. يرجى المحاولة لاحقاً."
      );
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">جاري تحميل خطط الاشتراك المتاحة...</p>
        </div>
      </div>
    );
  }

  // Feature mappings for each plan (to show clean checkmarks)
  const planFeatures: Record<string, string[]> = {
    starter: [
      "5 منتجات نشطة كحد أقصى",
      "موظف مساعد واحد (1 Worker)",
      "2 بكسل تتبع إعلاني (Pixels)",
      "200 طلبية شهرياً كحد أقصى",
      "صفحات هبوط ونظام دفع COD متكامل",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "حماية OTP SMS ومنع زيارات السبام",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ],
    starter_yearly: [
      "5 منتجات نشطة كحد أقصى",
      "موظف مساعد واحد (1 Worker)",
      "2 بكسل تتبع إعلاني (Pixels)",
      "200 طلبية شهرياً كحد أقصى",
      "صفحات هبوط ونظام دفع COD متكامل",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "حماية OTP SMS ومنع زيارات السبام",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ],
    pro: [
      "15 منتج نشط كحد أقصى",
      "5 موظفين مساعدين (5 Workers)",
      "5 بكسلات تتبع إعلاني (Pixels)",
      "1000 طلبية شهرياً كحد أقصى",
      "صفحات هبوط ونظام دفع COD متكامل",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "حماية OTP SMS ومنع زيارات السبام",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ],
    pro_yearly: [
      "15 منتج نشط كحد أقصى",
      "5 موظفين مساعدين (5 Workers)",
      "5 بكسلات تتبع إعلاني (Pixels)",
      "1000 طلبية شهرياً كحد أقصى",
      "صفحات هبوط ونظام دفع COD متكامل",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "حماية OTP SMS ومنع زيارات السبام",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ],
    max: [
      "عدد منتجات غير محدود بالكامل",
      "عدد مساعدين غير محدود (Workers)",
      "عدد بكسلات غير محدود (Pixels)",
      "طلبيات شهرية غير محدودة بالكامل",
      "ربط ومساعد الذكاء الاصطناعي Claude AI",
      "إدارة متاجر متعددة (Multi Store)",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ],
    max_yearly: [
      "عدد منتجات غير محدود بالكامل",
      "عدد مساعدين غير محدود (Workers)",
      "عدد بكسلات غير محدود (Pixels)",
      "طلبيات شهرية غير محدودة بالكامل",
      "ربط ومساعد الذكاء الاصطناعي Claude AI",
      "إدارة متاجر متعددة (Multi Store)",
      "مزامنة Google Sheets وشحن Yalidine/ZR",
      "جميع ميزات منصة Sovi مفعلة بالكامل",
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 bg-grid font-cairo relative flex flex-col justify-between overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px] -bottom-40 -right-40 pointer-events-none"></div>

      <header className="container mx-auto py-6 flex items-center justify-between relative z-10">
        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
        {hasActiveSub && (
          <button 
            onClick={() => router.push("/overview")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-200"
          >
            تخطي والذهاب للوحة التحكم <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </header>

      <main className="container mx-auto py-12 max-w-6xl relative z-10 flex-grow flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            7 أيام تجربة مجانية على جميع الخطط
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            اختر خطة الاشتراك المناسبة لمتجرك
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            لا تطلب المنصة أي تفاصيل دفع أو بطاقة بنكية لبدء الفترة التجريبية. يمكنك ترقية اشتراكك أو تغييره في أي وقت من لوحة التحكم.
          </p>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => {
            const features = planFeatures[plan.name] || [];
            const isPro = plan.name === "pro";
            const isMax = plan.name === "max";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex"
              >
                <Card 
                  className={`w-full flex flex-col justify-between border transition-all duration-300 relative ${
                    isPro 
                      ? "border-primary bg-card/80 shadow-2xl shadow-primary/10 scale-105 z-10" 
                      : "border-border bg-card/40 hover:border-primary/40"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-black flex items-center gap-1 shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      الأكثر شعبية
                    </div>
                  )}

                  <div>
                    <CardHeader className="text-center pb-6">
                      <CardTitle className="text-2xl font-bold">{plan.display_name_ar}</CardTitle>
                      <CardDescription className="uppercase tracking-wider text-xs font-bold text-muted-foreground font-outfit mt-1">
                        {plan.name} Tier
                      </CardDescription>

                      <div className="mt-6 flex items-baseline justify-center gap-1">
                        <span className="text-4xl md:text-5xl font-black tracking-tight">{Math.round(plan.price_da)}</span>
                        <span className="text-muted-foreground font-semibold text-sm">دج/شهرياً</span>
                      </div>
                      <p className="text-emerald-400 text-xs font-bold mt-2">
                        تجربة مجانية لمدة {plan.trial_days} أيام
                      </p>
                    </CardHeader>

                    <CardContent className="px-6 pb-8">
                      <div className="border-t border-border/80 my-2"></div>
                      <ul className="space-y-3.5 text-right mt-6 text-sm">
                        {features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start justify-end gap-2.5 text-foreground/90">
                            <span className="text-xs leading-relaxed">{feature}</span>
                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0">
                    <Button
                      onClick={() => handleStartTrial(plan.id)}
                      disabled={submitting !== null}
                      className="w-full py-6 text-sm font-bold flex items-center justify-center gap-2"
                      variant={isPro ? "glow" : "default"}
                    >
                      {submitting === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جاري بدء التجربة...
                        </>
                      ) : (
                        "ابدأ تجربتك المجانية"
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground font-cairo">
        كل الحقوق محفوظة © Sovi للتجارة الإلكترونية في الجزائر 2026.
      </footer>
    </div>
  );
}
