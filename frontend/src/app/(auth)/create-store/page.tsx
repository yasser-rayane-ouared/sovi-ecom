"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useAuthStore } from "../../../stores/auth";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Sparkles, Store, Layers, AlertCircle, Mail, Key, CheckCircle } from "lucide-react";

export default function CreateStoreWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setSelectedStore } = useDashboardStore();
  const { user, setUser, initialize, initialized } = useAuthStore();

  // Form states
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("fashion");
  const [customCategory, setCustomCategory] = useState("");
  const [subdomainPreview, setSubdomainPreview] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP Verification states
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const ARABIC_CHAR_MAP: Record<string, string> = {
    'أ': 'a', 'إ': 'i', 'آ': 'a', 'ا': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 't', 'ئ': 'y', 'ؤ': 'w', 'ء': 'a',
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (initialized && user?.is_superadmin) {
      router.push("/admin/accounts");
    }
  }, [user, initialized, router]);

  useEffect(() => {
    if (!storeName) {
      setSubdomainPreview("");
      return;
    }
    // Transliterate and slugify
    let trans = storeName.toLowerCase().split('').map(char => ARABIC_CHAR_MAP[char] || char).join('');
    let slug = trans
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces/hyphens
      .trim()
      .replace(/\s+/g, "-") // spaces to hyphens
      .replace(/-+/g, "-"); // merge multiple hyphens
    
    if (!slug) slug = "store";
    setSubdomainPreview(slug);
  }, [storeName]);

  const handleSendOTP = async () => {
    setOtpLoading(true);
    setErrors({});
    try {
      await api.post("/auth/send-otp/");
      setOtpSent(true);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setErrors({ global: err.response?.data?.error || "فشل إرسال رمز التحقق. يرجى المحاولة لاحقاً." });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrors({ otp: "يرجى إدخال رمز التحقق المكون من 6 أرقام" });
      return;
    }
    setVerifyingOtp(true);
    setErrors({});
    try {
      await api.post("/auth/verify-otp/", { otp: otpCode.trim() });
      setVerificationSuccess(true);
      setTimeout(async () => {
        if (user) {
          setUser({ ...user, is_verified: true });
        }
      }, 1500);
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setErrors({ global: err.response?.data?.error || "رمز التحقق غير صحيح أو منتهي الصلاحية." });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!storeName.trim()) errs.name = "اسم المتجر مطلوب";
    if (category === "other" && !customCategory.trim()) errs.customCategory = "يرجى تحديد النشاط التجاري";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const storeCategory = category === "other" ? customCategory : category;

    try {
      // Create the store
      const storeRes = await api.post("/stores/", {
        name: storeName.trim(),
        category: storeCategory,
      });

      // Set the newly created store as the selected store in dashboard
      const newStore = storeRes.data;
      if (newStore && newStore.id) {
        setSelectedStore(newStore);
      }

      // Redirect to dashboard overview
      router.push("/overview");
    } catch (err: any) {
      console.error("Store creation error:", err);
      const data = err.response?.data;
      let errorMsg = "فشل إعداد المتجر. يرجى مراجعة المدخلات.";
      if (data) {
        if (typeof data === "string") {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.name && Array.isArray(data.name)) {
          errorMsg = data.name[0];
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMsg = data.non_field_errors[0];
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey])) {
            errorMsg = `${firstKey}: ${data[firstKey][0]}`;
          }
        }
      }
      setErrors({ global: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "fashion", label: "ملابس وأزياء" },
    { value: "electronics", label: "إلكترونيات وهواتف" },
    { value: "cosmetics", label: "مستحضرات تجميل وعناية" },
    { value: "toys", label: "ألعاب وأطفال" },
    { value: "home", label: "البيت والمطبخ" },
    { value: "food", label: "أغذية وبقالة" },
    { value: "other", label: "نشاط آخر (تحديد...)" }
  ];

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground text-sm">جاري تحميل الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-sm">يرجى تسجيل الدخول أولاً لتتمكن من إنشاء متجر.</p>
          <Button onClick={() => router.push("/login")} variant="glow">تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  // Verification Gate View
  if (!user.is_verified) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 bg-grid transition-colors duration-300">
        {/* Header */}
        <header className="container mx-auto py-4 flex items-center justify-between relative z-20">
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
          <span className="text-xs text-muted-foreground font-cairo">منصة Sovi للتجارة الإلكترونية بالجزائر</span>
        </header>

        {/* Verification Card Body */}
        <main className="flex-grow flex items-center justify-center py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg"
          >
            <Card className="border-border bg-card/60 backdrop-blur-md">
              <CardHeader className="text-center font-cairo">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  <Mail className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold">تأكيد البريد الإلكتروني مطلوب</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">يرجى تأكيد بريدك الإلكتروني لتتمكن من إنشاء متجرك الجديد.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 font-cairo">
                {errors.global && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{errors.global}</span>
                  </div>
                )}

                {verificationSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle className="h-10 w-10 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-400">تم التحقق من بريدك بنجاح!</h3>
                    <p className="text-sm text-muted-foreground">جاري نقلك إلى إعداد المتجر...</p>
                  </div>
                ) : !otpSent ? (
                  <div className="space-y-6 text-right">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">بريدك الإلكتروني المسجل</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          disabled
                          value={user.email}
                          className="pl-10 text-right pr-3 bg-input text-foreground/50 cursor-not-allowed opacity-60"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">سنرسل رمز تأكيد مكون من 6 أرقام إلى هذا العنوان لتأكيد ملكيته.</p>
                    </div>

                    <Button 
                      onClick={handleSendOTP} 
                      disabled={otpLoading} 
                      variant="glow" 
                      className="w-full flex items-center justify-center gap-2 py-6 text-base font-bold"
                    >
                      {otpLoading ? "جاري إرسال الرمز..." : "إرسال رمز التحقق"}
                      <Mail className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6 text-right">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">أدخل الرمز المكون من 6 أرقام</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          required
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="pl-10 text-center pr-3 font-bold font-outfit"
                          style={{ letterSpacing: '0.4em' }}
                        />
                      </div>
                      {errors.otp && <span className="text-red-400 text-xs">{errors.otp}</span>}
                      <p className="text-xs text-muted-foreground">تم إرسال الرمز إلى {user.email}. تفقد مجلد البريد غير الهام (Spam) إذا لم تجده.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        type="submit" 
                        disabled={verifyingOtp} 
                        variant="glow" 
                        className="w-full flex items-center justify-center gap-2 py-6 text-base font-bold"
                      >
                        {verifyingOtp ? "جاري التحقق..." : "تفعيل الحساب والمتابعة"}
                        <CheckCircle className="h-5 w-5" />
                      </Button>

                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                        className="text-xs text-accent hover:underline font-semibold text-center mt-2 disabled:opacity-50"
                      >
                        {otpLoading ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-muted-foreground font-cairo">
          منصة Sovi للتجارة الإلكترونية بالجزائر. ابدأ رحلتك مجاناً.
        </footer>
      </div>
    );
  }

  // Normal Store Creation Wizard
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 bg-grid transition-colors duration-300">
      {/* Header */}
      <header className="container mx-auto py-4 flex items-center justify-between relative z-20">
        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
        <span className="text-xs text-muted-foreground font-cairo">منصة Sovi للتجارة الإلكترونية بالجزائر</span>
      </header>

      {/* Main Form Body */}
      <main className="flex-grow flex items-center justify-center py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="text-center font-cairo">
              <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 text-accent">
                <Store className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-bold">لننشئ متجرك الإلكتروني الجديد</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">أدخل الاسم والنوع لنقوم بتوليد متجرك فوراً.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 font-cairo">
              {errors.global && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errors.global}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5 text-right">
                  <label className="text-sm font-semibold">اسم المتجر</label>
                  <Input
                    required
                    placeholder="مثال: دكان الفخامة"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="pr-3 text-right"
                  />
                  {errors.name && <span className="text-red-400 text-xs">{errors.name}</span>}
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-sm font-semibold">تصنيف أو نوع المتجر</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground text-right transition-colors duration-200"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value} className="bg-card text-foreground">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {category === "other" && (
                  <div className="space-y-1.5 text-right animate-fade-in-up">
                    <label className="text-sm font-semibold">اكتب نوع النشاط التجاري</label>
                    <Input
                      required
                      placeholder="مثال: هدايا وتحف"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="pr-3 text-right"
                    />
                    {errors.customCategory && <span className="text-red-400 text-xs">{errors.customCategory}</span>}
                  </div>
                )}

                {subdomainPreview && (
                  <div className="p-4 rounded-xl border border-border bg-secondary text-right text-sm space-y-1 animate-fade-in-up text-foreground">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-muted-foreground flex items-center gap-1"><Layers className="h-4 w-4" /> الرابط التلقائي المولد:</span>
                      <span className="font-semibold text-accent font-outfit">{subdomainPreview}.sovi.localhost:3000</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-1.5">سيتم حجز هذا النطاق الفرعي لمتجرك بشكل تلقائي.</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} variant="glow" className="w-full flex items-center justify-center gap-2 mt-8 py-6 text-base font-bold">
                  {loading ? "جاري بناء متجرك..." : "إطلاق متجري الإلكتروني!"}
                  <Sparkles className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground font-cairo">
        منصة Sovi للتجارة الإلكترونية بالجزائر. ابدأ رحلتك مجاناً.
      </footer>
    </div>
  );
}
