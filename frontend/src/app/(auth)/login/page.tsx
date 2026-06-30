"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuthStore } from "../../../stores/auth";
import api from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { AlertCircle, Lock, Mail, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { useLanguageStore } from "../../../stores/language";

export default function LoginPage() {
  const router = useRouter();
  const { t, isRtl } = useLanguageStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);

  const showMailIcon = email.includes("@");

  const [isMock, setIsMock] = useState(true);

  const handleGoogleSignIn = async (response: any) => {
    const credential = response.credential;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/google/", { credential });
      const { access, refresh } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      await initializeAuth();
      router.push("/overview");
    } catch (err: any) {
      setError(err.response?.data?.error || (isRtl ? "خطأ في تسجيل الدخول بواسطة Google. يرجى المحاولة لاحقاً." : "Google Sign-In failed. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleBtn = () => {
    if (typeof window !== "undefined" && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1027116843477-mockclientid.apps.googleusercontent.com",
        callback: handleGoogleSignIn,
        itp_support: true
      });
      const container = document.getElementById("google-signin-btn");
      if (container) {
        const isMobile = window.innerWidth < 420;
        (window as any).google.accounts.id.renderButton(
          container,
          { 
            theme: "outline", 
            size: "large", 
            width: isMobile ? 280 : 380,
            text: "signin_with",
            shape: "rectangular"
          }
        );
      }
      
      // Trigger Google One Tap native sign-in prompt for mobile/Safari support
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log("Google One Tap prompt skipped/not displayed:", notification.getNotDisplayedReason());
        }
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
      const cleanRoot = rootDomain.split(':')[0];
      const isMainDomain = hostname === cleanRoot || hostname === `www.${cleanRoot}`;
      
      if (!isMainDomain && !hostname.includes("localhost") && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;
        const targetUrl = `${protocol}//${cleanRoot}${port}${window.location.pathname}${window.location.search}`;
        window.location.replace(targetUrl);
      }
    }
  }, []);

  useEffect(() => {
    const isLocalIpHttp = typeof window !== "undefined" && 
      window.location.protocol === "http:" && 
      window.location.hostname !== "localhost" && 
      window.location.hostname !== "127.0.0.1";

    const isMockClient = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes("mock") || 
      isLocalIpHttp;

    setIsMock(isMockClient);
    initializeGoogleBtn();

    const interval = setInterval(() => {
      const container = document.getElementById("google-signin-btn");
      if ((window as any).google && container) {
        initializeGoogleBtn();
        clearInterval(interval);
      }
    }, 500);

    if (process.env.NODE_ENV === 'development') {
      (window as any).triggerMockGoogleSignIn = (email: string) => {
        handleGoogleSignIn({ credential: `mock-google-token-${email}` });
      };
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", { email, password });
      const { access, refresh } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      await initializeAuth();
      router.push("/overview");
    } catch (err: any) {
      setError(err.response?.data?.detail || (isRtl ? "خطأ في تسجيل الدخول. يرجى التحقق من بريدك وكلمة المرور." : "Login failed. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 bg-grid transition-colors duration-300">
      {/* Background glow */}
      <div className="absolute h-96 w-96 rounded-full bg-primary/10 blur-[100px] top-1/4 left-1/3"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-cairo">
            <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} /> {t('backToHome')}
          </Link>
          <LanguageToggle />
        </div>

        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="text-center font-cairo">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
            <CardTitle className="text-2xl font-bold mt-4">{t('welcomeBack')}</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">{t('loginCardDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 font-cairo">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 font-cairo">
                <label className="text-sm font-medium">{t('emailOrUsername')}</label>
                <div className="relative">
                  {showMailIcon ? (
                    <Mail className={`absolute top-3 h-4 w-4 text-muted-foreground transition-all duration-300 ${isRtl ? "right-3" : "left-3"}`} />
                  ) : (
                    <User className={`absolute top-3 h-4 w-4 text-muted-foreground transition-all duration-300 ${isRtl ? "right-3" : "left-3"}`} />
                  )}
                  <Input
                    type="text"
                    required
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`text-start ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t('password')}</label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`text-start ${isRtl ? "pr-10 pl-10" : "pl-10 pr-10"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-3 text-muted-foreground hover:text-foreground transition-colors ${
                      isRtl ? "left-3" : "right-3"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} variant="glow" className="w-full mt-6 py-3 font-semibold">
                {loading ? t('loggingIn') : t('loginButton')}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">{t('orUsing')}</span>
              </div>
            </div>

            {isMock ? (
              <button
                type="button"
                onClick={() => {
                  const testEmail = prompt(isRtl ? "أدخل البريد الإلكتروني للتجربة (Google):" : "Enter email for testing (Google):", "demo@sovi.com");
                  if (testEmail) {
                    handleGoogleSignIn({ credential: `mock-google-token-${testEmail}` });
                  }
                }}
                className="w-full group relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-border bg-card/80 hover:bg-card text-foreground font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="relative z-10">{t('googleSignIn')}</span>
              </button>
            ) : (
              <div id="google-signin-btn" className="w-full flex justify-center min-h-[46px]" />
            )}

            <Script
              src="https://accounts.google.com/gsi/client"
              onLoad={initializeGoogleBtn}
              strategy="afterInteractive"
            />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('noAccount')}{" "}
              <Link href="/register" className="text-accent hover:underline font-semibold">
                {t('registerNow')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
