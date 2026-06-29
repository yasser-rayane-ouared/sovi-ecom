"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import api from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { AlertCircle, User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../../stores/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);

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
      setError(err.response?.data?.error || "حدث خطأ أثناء التسجيل بواسطة Google. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleBtn = () => {
    if (typeof window !== "undefined" && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1027116843477-mockclientid.apps.googleusercontent.com",
        callback: handleGoogleSignIn,
      });
      const container = document.getElementById("google-signin-btn");
      if (container) {
        (window as any).google.accounts.id.renderButton(
          container,
          { 
            theme: "outline", 
            size: "large", 
            width: 380,
            text: "signup_with",
            shape: "rectangular"
          }
        );
      }
    }
  };

  useEffect(() => {
    const isMockClient = !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes("mock");
    setIsMock(isMockClient);
    initializeGoogleBtn();
    if (process.env.NODE_ENV === 'development') {
      (window as any).triggerMockGoogleSignIn = (email: string) => {
        handleGoogleSignIn({ credential: `mock-google-token-${email}` });
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== passwordConfirm) {
      setError("كلمات المرور غير متطابقة.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register/", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess(true);
    } catch (err: any) {
      const data = err.response?.data;
      setError(
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.detail ||
        "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 bg-grid transition-colors duration-300">
        <div className="w-full max-w-md text-center font-cairo space-y-6">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
          <h2 className="text-3xl font-bold">تفقد بريدك الإلكتروني!</h2>
          <p className="text-muted-foreground leading-relaxed">
            تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني. يرجى تأكيد الحساب لتتمكن من إنشاء متجرك الأول.
          </p>
          <Link href="/login" className="block">
            <Button variant="glow" className="w-full">تسجيل الدخول</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 bg-grid transition-colors duration-300">
      <div className="absolute h-96 w-96 rounded-full bg-primary/10 blur-[100px] bottom-1/4 right-1/3"></div>

      <div className="w-full max-w-lg relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-cairo">
          <ArrowLeft className="h-4 w-4" /> العودة للرئيسية
        </Link>

        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="text-center font-cairo">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
            <CardTitle className="text-2xl font-bold mt-4">أنشئ حسابك المجاني</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">ابدأ رحلتك في التجارة الإلكترونية في الجزائر اليوم</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 font-cairo">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">الاسم الأول</label>
                  <Input
                    required
                    placeholder="محمد"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pr-3 text-right"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">اللقب</label>
                  <Input
                    required
                    placeholder="بن علي"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pr-3 text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-right pr-3"
                  />
                </div>
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 text-right pr-3"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="pl-10 text-right pr-3"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} variant="glow" className="w-full mt-6 py-3 font-semibold">
                {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">أو باستخدام</span>
              </div>
            </div>

            {isMock ? (
              <button
                type="button"
                onClick={() => {
                  const testEmail = prompt("أدخل البريد الإلكتروني للتجربة (Google):", "demo@sovi.com");
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
                <span className="relative z-10">التسجيل بواسطة Google</span>
              </button>
            ) : (
              <div id="google-signin-btn" className="w-full flex justify-center min-h-[46px]" />
            )}
            <Script
              src="https://accounts.google.com/gsi/client"
              onLoad={initializeGoogleBtn}
              strategy="lazyOnload"
            />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-accent hover:underline font-semibold">
                سجل دخولك
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
