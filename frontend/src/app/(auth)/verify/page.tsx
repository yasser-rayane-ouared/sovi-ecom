"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import api from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const initializeAuth = useAuthStore((state) => state.initialize);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("جاري التحقق من بريدك الإلكتروني...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("رمز التحقق غير موجود في الرابط.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.post("/auth/verify-email/", { token });
        setStatus("success");
        setMessage(res.data.message || "تم تأكيد بريدك الإلكتروني بنجاح!");
        
        // Auto-login: store returned JWT tokens
        if (res.data.access && res.data.refresh) {
          localStorage.setItem("access_token", res.data.access);
          localStorage.setItem("refresh_token", res.data.refresh);
        }
        
        // Refresh local auth state to reflect is_verified=true
        await initializeAuth();
        
        // Redirect to create-store wizard after 3 seconds
        setTimeout(() => {
          router.push("/create-store");
        }, 3000);
      } catch (err: any) {
        console.error("Token verification error:", err);
        setStatus("error");
        setMessage(err.response?.data?.error || "فشل التحقق من الرابط. قد يكون الرمز منتهياً أو تم استخدامه بالفعل.");
      }
    };

    verifyToken();
  }, [token, initializeAuth, router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 bg-grid transition-colors duration-300">
      <div className="absolute h-96 w-96 rounded-full bg-primary/10 blur-[100px] bottom-1/4 right-1/3"></div>

      <div className="w-full max-w-md relative z-10 font-cairo">
        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="text-center">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
            <CardTitle className="text-xl font-bold mt-4">تأكيد الحساب</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-center space-y-6">
            
            {status === "loading" && (
              <div className="py-6 space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            )}

            {status === "success" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-emerald-400">تم التأكيد بنجاح!</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground animate-pulse mt-2">جاري تحويلك إلى صفحة إنشاء المتجر خلال ثوانٍ...</p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 space-y-4"
              >
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-400">
                  <XCircle className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-red-400">فشل التحقق</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button 
                  onClick={() => router.push("/create-store")} 
                  variant="glow" 
                  className="w-full mt-4"
                >
                  الرجوع إلى صفحة المتجر
                </Button>
              </motion.div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
