"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "../../../stores/cart";
import api from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Truck, CheckCircle2, ChevronRight, AlertCircle, ShoppingCart } from "lucide-react";
import { formatCurrency, getStorefrontLink, getFullImageUrl } from "../../../lib/utils";
import { initializePixels, trackPixelEvent, deduplicatePixels, generateEventId } from "../../../components/pixels";

export default function StorefrontCheckout() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.store as string;

  const { items, total, clearCart, updateQuantity } = useCartStore();

  const [store, setStore] = useState<any>(null);

  const formLanguage: string = (store?.settings?.checkout_form_language) || store?.language || 'ar';
  const isArabic = formLanguage !== "fr" && formLanguage !== "en";
  const t = (ar: string, fr: string, en: string) => {
    if (formLanguage === "en") return en;
    if (formLanguage === "fr") return fr;
    return ar;
  };
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [deliveryPrice, setDeliveryPrice] = useState(600);
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Firebase OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [firebaseToken, setFirebaseToken] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    // Generate simple UUID-like collision resistant key for idempotency
    const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    setIdempotencyKey(key);
  }, []);

  useEffect(() => {
    if (subdomain) {
      Promise.all([
        api.get(`/storefront/${subdomain}/`),
        api.get(`/storefront/${subdomain}/wilayas/`)
      ])
        .then(([storeRes, wilayasRes]) => {
          setStore(storeRes.data);
          if (storeRes.data?.settings?.primary_color) {
            document.documentElement.style.setProperty('--primary', storeRes.data.settings.primary_color);
          }
          setWilayas(wilayasRes.data || []);
        })
        .catch(() => {});
    }
  }, [subdomain]);

  useEffect(() => {
    if (store) {
      const checkoutTitle = store.language === "en" ? "Checkout" : store.language === "fr" ? "Paiement" : "الدفع عند الاستلام";
      document.title = `${checkoutTitle} — ${store.name}`;
    }
  }, [store]);

  // #3 — Fire InitiateCheckout pixel event when store+cart are ready
  useEffect(() => {
    if (!store || items.length === 0) return;
    const storePixels: any[] = store.pixels || [];
    // #6 — Merge product-specific pixels from all cart items
    const productPixels: any[] = items.flatMap((item: any) => item.pixels || []);
    const allPixels = deduplicatePixels([...storePixels, ...productPixels]);
    if (allPixels.length === 0) return;
    initializePixels(allPixels);
    let abTestGroup = null;
    if (typeof window !== 'undefined' && items.length > 0) {
      abTestGroup = localStorage.getItem(`ab_test_group_${items[0].product_id}`) || null;
    }
    trackPixelEvent(allPixels, 'InitiateCheckout', {
      content_ids: items.map((i: any) => i.product_id),
      content_type: 'product',
      num_items: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      value: total,
      currency: 'DZD',
      ab_test_group: abTestGroup,
    });
  }, [store, items]);

  // Load Google reCAPTCHA v3 script dynamically if enabled
  useEffect(() => {
    if (store?.settings?.security_enable_captcha && store?.settings?.security_captcha_site_key) {
      const siteKey = store.settings.security_captcha_site_key;
      if (!document.getElementById("recaptcha-script")) {
        const script = document.createElement("script");
        script.id = "recaptcha-script";
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [store]);

  // Load Firebase dynamically if enabled
  useEffect(() => {
    if (store?.settings?.security_enable_firebase_otp && store?.settings?.security_firebase_config_json) {
      if (!document.getElementById("firebase-app-script")) {
        const appScript = document.createElement("script");
        appScript.id = "firebase-app-script";
        appScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
        appScript.async = true;
        appScript.onload = () => {
          if (!document.getElementById("firebase-auth-script")) {
            const authScript = document.createElement("script");
            authScript.id = "firebase-auth-script";
            authScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js";
            authScript.async = true;
            authScript.onload = () => {
              try {
                const config = JSON.parse(store.settings.security_firebase_config_json);
                // @ts-ignore
                if (window.firebase && !window.firebase.apps.length) {
                  // @ts-ignore
                  window.firebase.initializeApp(config);
                }
              } catch (e) {
                console.error("Firebase initialization failed:", e);
              }
            };
            document.body.appendChild(authScript);
          }
        };
        document.body.appendChild(appScript);
      }
    }
  }, [store]);

  // Handle wilaya and delivery method changes to dynamically calculate shipping cost
  useEffect(() => {
    if (selectedWilaya && wilayas.length > 0) {
      const code = parseInt(selectedWilaya);
      const wData = wilayas.find((w) => w.code === code);
      if (wData) {
        setDeliveryPrice(deliveryMethod === 'home' ? wData.home_price : wData.desk_price);
      }
    } else if (store?.settings?.default_delivery_price) {
      setDeliveryPrice(parseFloat(store.settings.default_delivery_price));
    }
  }, [selectedWilaya, deliveryMethod, wilayas, store]);

  // #2 / #4 — Track Purchase Event on Order Success with event_id deduplication
  useEffect(() => {
    if (orderSuccess && store) {
      try {
        // #6 — Merge store-level + product pixels from cart items
        const storePixels: any[] = store.pixels || [];
        const productPixels: any[] = items.flatMap ? items.flatMap((i: any) => i.pixels || []) : [];
        const allPixels = deduplicatePixels([...storePixels, ...productPixels]);
        if (allPixels.length === 0) return;

        const purchaseEventId = (orderSuccess as any)._event_id;
        const hashedUserData = (orderSuccess as any).hashed_user_data;

        initializePixels(allPixels);

        // If hashedUserData is returned, initialize Meta Pixel with it to associate user attributes
        if (hashedUserData && typeof window !== "undefined") {
          const w = window as any;
          if (w.fbq) {
            allPixels.forEach((pixel) => {
              if (pixel.platform === 'meta' && pixel.pixel_id) {
                w.fbq('init', pixel.pixel_id, hashedUserData);
              }
            });
          }
        }

        let abTestGroup = null;
        if (typeof window !== 'undefined' && items.length > 0) {
          abTestGroup = localStorage.getItem(`ab_test_group_${items[0].product_id}`) || null;
        }
        trackPixelEvent(allPixels, 'Purchase', {
          content_ids: items.map((i: any) => i.product_id),
          content_names: items.map((i: any) => i.title),
          content_type: 'product',
          value: total,
          currency: 'DZD',
          num_items: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
          ab_test_group: abTestGroup,
        }, purchaseEventId);

        // Clear legacy sessionStorage tracking
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("pending_tracking");
        }
      } catch (e) {
        console.error("Pixel tracking error:", e);
      }
    }
  }, [orderSuccess, store]);

  // Pre-Submit Lead Capture (Cart Abandonment)
  useEffect(() => {
    const cleanPhone = phone.replace(/\s+/g, '');
    const algPhoneRegex = /^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$/;
    
    if (!algPhoneRegex.test(cleanPhone)) return;
    if (items.length === 0) return;

    const timer = setTimeout(() => {
      api.post(`/storefront/${subdomain}/leads/`, {
        phone: cleanPhone,
        full_name: fullName,
        wilaya: selectedWilaya ? parseInt(selectedWilaya) : null,
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
        })),
      })
      .then((res) => {
        if (res.data?.lead_id) {
          setLeadId(res.data.lead_id);
        }
      })
      .catch((err) => {
        console.error("Lead sync failed:", err);
      });
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [phone, fullName, selectedWilaya, items, subdomain]);

  // Fetch communes when wilaya changes
  useEffect(() => {
    if (selectedWilaya && subdomain) {
      api.get(`/storefront/${subdomain}/wilayas/${selectedWilaya}/communes/`)
        .then((res) => {
          setCommunes(res.data || []);
          setSelectedCommune("");
        })
        .catch(() => {});
    }
  }, [selectedWilaya, subdomain]);

  // Handle sending OTP
  const handleSendOtp = async () => {
    setError("");
    setSuccessMessage("");
    setSendingOtp(true);

    if (!phone) {
      setError(t("الرجاء إدخال رقم الهاتف أولاً.", "Veuillez d'abord saisir le numéro de téléphone.", "Please enter the phone number first."));
      setSendingOtp(false);
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const algPhoneRegex = /^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$/;
    if (!algPhoneRegex.test(cleanPhone)) {
      setError(t("الرجاء إدخال رقم هاتف جزائري صالح لإرسال الرمز (مثال: 0661234567)", "Veuillez saisir un numéro de téléphone algérien valide (ex: 0661234567).", "Please enter a valid Algerian phone number (e.g., 0661234567)."));
      setSendingOtp(false);
      return;
    }

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+213' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('213')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.startsWith('00213')) {
      formattedPhone = '+' + formattedPhone.substring(2);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+213' + formattedPhone;
    }

    try {
      // @ts-ignore
      const firebase = window.firebase;
      if (!firebase) {
        setError(t("جاري تحميل نظام الأمان. يرجى الانتظار ثانية ثم المحاولة مجدداً.", "Chargement du système de sécurité. Veuillez patienter et réessayer.", "Loading security system. Please wait a second and try again."));
        setSendingOtp(false);
        return;
      }

      let verifier = recaptchaVerifier;
      if (!verifier) {
        // @ts-ignore
        verifier = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
          size: "invisible",
          callback: () => {}
        });
        setRecaptchaVerifier(verifier);
      }

      // @ts-ignore
      const confirmation = await firebase.auth().signInWithPhoneNumber(formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setSuccessMessage(t("تم إرسال رمز التحقق بنجاح إلى هاتفك عبر رسالة SMS.", "Le code de vérification a été envoyé sur votre téléphone par SMS.", "Verification code sent successfully to your phone via SMS."));
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      if (document.getElementById("recaptcha-container")) {
        document.getElementById("recaptcha-container")!.innerHTML = "";
      }
      setRecaptchaVerifier(null);
      const rawErr = err?.code || err?.message || 'unknown';
      setError(`${t("فشل إرسال رمز التحقق. يرجى مراجعة إعدادات الهاتف والمحاولة لاحقاً.", "Échec de l'envoi du code de vérification. Veuillez vérifier les paramètres de votre téléphone.", "Failed to send verification code. Please check phone settings and try again.")} [${rawErr}]`);
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    setError("");
    setVerifyingOtp(true);
    setSuccessMessage("");

    if (!otpCode || otpCode.length < 6) {
      setError(t("الرجاء إدخال رمز التحقق المكون من 6 أرقام.", "Veuillez saisir le code de vérification à 6 chiffres.", "Please enter the 6-digit verification code."));
      setVerifyingOtp(false);
      return;
    }

    if (!confirmationResult) {
      setError(t("لم يتم إرسال الرمز بعد. الرجاء المحاولة مجدداً.", "Le code n'a pas encore été envoyé. Veuillez réessayer.", "The code has not been sent yet. Please try again."));
      setVerifyingOtp(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      const token = await user.getIdToken();
      setFirebaseToken(token);
      setPhoneVerified(true);
      setOtpSent(false);
      setSuccessMessage(t("تم توثيق رقم الهاتف بنجاح!", "Numéro de téléphone vérifié avec succès !", "Phone number verified successfully!"));
    } catch (err: any) {
      console.error("Error confirming OTP:", err);
      setError(t("رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.", "Code de vérification incorrect. Veuillez réessayer.", "Incorrect verification code. Please try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle placing order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (items.length === 0) {
      setError(t("سلتك فارغة. يرجى إضافة منتجات أولاً.", "Votre panier est vide. Veuillez d'abord ajouter des produits.", "Your cart is empty. Please add products first."));
      setLoading(false);
      return;
    }

    // Phone validation client-side (applied by default)
    const cleanPhone = phone.replace(/\s+/g, '');
    const algPhoneRegex = /^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$/;
    if (!algPhoneRegex.test(cleanPhone)) {
      setError(t("الرجاء إدخال رقم هاتف جزائري صالح (مثال: 0661234567)", "Veuillez saisir un numéro de téléphone algérien valide (ex: 0661234567).", "Please enter a valid Algerian phone number (e.g., 0661234567)."));
      setLoading(false);
      return;
    }
    if (phone2) {
      const cleanPhone2 = phone2.replace(/\s+/g, '');
      if (!algPhoneRegex.test(cleanPhone2)) {
        setError(t("الرجاء إدخال رقم هاتف ثانٍ صالح", "Veuillez saisir un deuxième numéro de téléphone valide.", "Please enter a valid secondary phone number."));
        setLoading(false);
        return;
      }
    }

    // Firebase Phone OTP check
    if (store?.settings?.security_enable_firebase_otp) {
      if (!phoneVerified || !firebaseToken) {
        setError(t("يرجى إرسال والتحقق من رقم الهاتف قبل إتمام الطلب.", "Veuillez envoyer et vérifier le numéro de téléphone avant de valider la commande.", "Please send and verify your phone number before confirming the order."));
        setLoading(false);
        return;
      }
    }

    // reCAPTCHA verification client-side
    let recaptchaToken = null;
    if (store?.settings?.security_enable_captcha && store?.settings?.security_captcha_site_key) {
      const siteKey = store.settings.security_captcha_site_key;
      try {
        // @ts-ignore
        if (window.grecaptcha) {
          // @ts-ignore
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'checkout' });
        } else {
          setError(t("فشل تحميل نظام التحقق من الأمان (reCAPTCHA). يرجى المحاولة مجدداً.", "Échec du chargement du système de sécurité (reCAPTCHA). Veuillez réessayer.", "Failed to load security verification system (reCAPTCHA). Please try again."));
          setLoading(false);
          return;
        }
      } catch (err) {
        setError(t("فشل التحقق من الكابتشا. يرجى المحاولة لاحقاً.", "Échec de la vérification de la captcha. Veuillez réessayer plus tard.", "Captcha verification failed. Please try again later."));
        setLoading(false);
        return;
      }
    }

    // Generate shared event_id for browser + CAPI deduplication (#4)
    const purchaseEventId = generateEventId();

    let abTestGroup = null;
    if (typeof window !== 'undefined' && items.length > 0) {
      abTestGroup = localStorage.getItem(`ab_test_group_${items[0].product_id}`) || null;
    }

    try {
      const payload = {
        lead_id: leadId,
        full_name: fullName,
        phone,
        phone2,
        wilaya: parseInt(selectedWilaya),
        commune: parseInt(selectedCommune),
        address,
        notes,
        recaptcha_token: recaptchaToken,
        firebase_token: firebaseToken,
        event_id: purchaseEventId,
        ab_test_group: abTestGroup,
        session_id: typeof window !== 'undefined' ? (localStorage.getItem('ab_session_id') || '') : '',
        metadata: {
          ab_test_group: abTestGroup
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
        })),
      };

      const response = await api.post(`/storefront/${subdomain}/checkout/`, payload, {
        headers: {
          'X-Idempotency-Key': idempotencyKey,
        }
      });
      setOrderSuccess({ ...response.data, _event_id: purchaseEventId });
      clearCart();
    } catch (err: any) {
      let errMsg = t("حدث خطأ أثناء إتمام الطلب. يرجى مراجعة الخانات المحققة.", "Une erreur est survenue lors de la validation. Veuillez vérifier vos informations.", "An error occurred while confirming your order. Please check the fields.");
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const messages = Object.entries(data).map(([field, msgs]: [string, any]) => {
            const fieldLabel = field === "phone" ? t("رقم الهاتف", "Numéro de téléphone", "Phone Number") : field === "phone2" ? t("رقم الهاتف الثاني", "Deuxième numéro", "Second Phone Number") : "";
            const prefix = fieldLabel ? `${fieldLabel}: ` : "";
            if (Array.isArray(msgs)) return `${prefix}${msgs.join(', ')}`;
            if (typeof msgs === "string") return `${prefix}${msgs}`;
            return "";
          }).filter(Boolean);
          if (messages.length > 0) {
            errMsg = messages.join(' | ');
          }
        } else if (typeof data === "string") {
          errMsg = data;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-cairo text-right" dir={isArabic ? "rtl" : "ltr"}>
        <div className="w-full max-w-md text-center space-y-6 bg-white p-8 rounded-2xl shadow-md border border-slate-100">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t("تم تسجيل طلبك بنجاح!", "Votre commande a été enregistrée avec succès !", "Your order has been placed successfully!")}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t("شكراً لتسوقك من متجرنا. رقم طلبك هو ", "Merci pour votre achat. Votre numéro de commande est ", "Thank you for shopping with us. Your order number is ")}
            <strong className="text-primary font-outfit">{orderSuccess.order_number}</strong>.{" "}
            {t("سيتصل بك فريق العمل الخاص بنا لتأكيد الطلب وبدء عملية الشحن في أقرب وقت.", "Notre équipe vous contactera pour confirmer la commande et lancer l'expédition le plus tôt possible.", "Our team will contact you to confirm the order and start the shipping process as soon as possible.")}
          </p>
          <div className="border-t border-slate-100 my-4"></div>
          <Link href={getStorefrontLink(subdomain, "/")} className="block">
            <Button className="w-full rounded-xl">{t("العودة للتسوق", "Retour au shopping", "Back to shopping")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-cairo flex flex-col justify-between" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 py-4 transition-all duration-300">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href={getStorefrontLink(subdomain, "/")} className="flex items-center gap-2 text-slate-600 hover:text-slate-950 font-bold transition-colors">
            <ChevronRight className={`h-5 w-5 ${!isArabic ? "rotate-180" : ""}`} />
            <span>{t("العودة للتسوق", "Retour au shopping", "Back to shopping")}</span>
          </Link>
          {store?.logo ? (
            <img 
              src={getFullImageUrl(store.logo)} 
              alt={store.name} 
              className="h-9 w-auto object-contain flex-shrink-0" 
            />
          ) : (
            <span className="text-xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-outfit">{store?.name}</span>
          )}
        </div>
      </header>

      {/* Main Content Checkout Grid */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 flex-grow">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Checkout Form Card - Clean Premium White Container */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-white border border-slate-200/60 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className={`border-b border-slate-100 bg-slate-50/50 p-4 md:p-6 ${!isArabic ? "text-left" : "text-right"}`}>
                <CardTitle className="text-lg md:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary animate-pulse" /> 
                  <span>{t("معلومات التوصيل والدفع", "Informations de livraison et paiement", "Delivery & Payment Information")}</span>
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium text-xs md:text-sm">{t("يرجى إدخال معلومات صحيحة لضمان وصول طلبك في أسرع وقت. الدفع عند الاستلام فقط.", "Veuillez saisir des informations correctes pour assurer une livraison rapide. Paiement à la livraison uniquement.", "Please enter correct details to ensure fast delivery. Cash on delivery only.")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                      <label className="text-sm font-bold text-slate-800">{t("الاسم الكامل", "Nom complet", "Full Name")}</label>
                      <Input
                        required
                        placeholder={t("الاسم واللقب", "Nom et prénom", "First and Last Name")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-xl ${!isArabic ? "text-left pl-3" : "text-right pr-3"}`}
                      />
                    </div>

                    <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                      <label className="text-sm font-bold text-slate-800">{t("رقم الهاتف الأول", "Numéro de téléphone principal", "Primary Phone Number")}</label>
                      <div className="flex gap-2">
                        <Input
                          required
                          type="tel"
                          placeholder="0661234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={phoneVerified || otpSent}
                          className={`border-slate-200 bg-slate-50/50 font-outfit focus:bg-white transition-all rounded-xl flex-grow ${!isArabic ? "text-left pl-3" : "text-right pr-3"}`}
                        />
                        {store?.settings?.security_enable_firebase_otp && !phoneVerified && (
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp || otpSent}
                            className="rounded-xl px-4 text-xs font-bold whitespace-nowrap h-10"
                          >
                            {sendingOtp ? t("جاري الإرسال...", "Envoi...", "Sending...") : otpSent ? t("تم إرسال الرمز", "Code envoyé", "Code Sent") : t("إرسال رمز SMS", "Code SMS", "Send SMS")}
                          </Button>
                        )}
                        {store?.settings?.security_enable_firebase_otp && phoneVerified && (
                          <div className="h-10 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 text-xs font-bold gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("موثق", "Vérifié", "Verified")}</span>
                          </div>
                        )}
                      </div>

                      {/* Firebase reCAPTCHA container */}
                      <div id="recaptcha-container"></div>

                      {/* OTP code input UI */}
                      {store?.settings?.security_enable_firebase_otp && otpSent && !phoneVerified && (
                        <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-bold text-slate-700 block">{t("أدخل رمز التحقق (OTP) المكون من 6 أرقام", "Entrez le code de vérification (OTP) à 6 chiffres", "Enter the 6-digit verification code (OTP)")}</label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="123456"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="border-slate-200 bg-white text-center font-outfit focus:bg-white transition-all rounded-xl text-sm tracking-widest flex-grow"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={verifyingOtp}
                              className="rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                            >
                              {verifyingOtp ? t("جاري التحقق...", "Vérification...", "Verifying...") : t("تأكيد الرمز", "Confirmer", "Confirm")}
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); if (document.getElementById("recaptcha-container")) document.getElementById("recaptcha-container")!.innerHTML = ""; setRecaptchaVerifier(null); }}
                            className={`text-[10px] text-primary hover:underline font-bold block w-full ${!isArabic ? "text-left" : "text-right"}`}
                          >
                            {t("تغيير رقم الهاتف أو إعادة المحاولة", "Changer le numéro ou réessayer", "Change phone number or retry")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                    <label className="text-sm font-bold text-slate-800">{t("رقم الهاتف الثاني (اختياري)", "Deuxième numéro (Optionnel)", "Secondary Phone (Optional)")}</label>
                    <Input
                      type="tel"
                      placeholder="0771234567"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      className={`border-slate-200 bg-slate-50/50 font-outfit focus:bg-white transition-all rounded-xl ${!isArabic ? "text-left pl-3" : "text-right pr-3"}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                      <label className="text-sm font-bold text-slate-800">{t("الولاية", "Wilaya", "Province")}</label>
                      <select
                        required
                        value={selectedWilaya}
                        onChange={(e) => setSelectedWilaya(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:bg-white transition-all"
                      >
                        <option value="">{t("اختر الولاية", "Choisir la wilaya", "Select Province")}</option>
                        {wilayas.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.code} - {isArabic ? w.name_ar : (store.language === "en" ? (w.name_en || w.name_fr || w.name_ar) : (w.name_fr || w.name_ar))}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                      <label className="text-sm font-bold text-slate-800">{t("البلدية", "Commune", "Municipality")}</label>
                      <select
                        required
                        disabled={!selectedWilaya}
                        value={selectedCommune}
                        onChange={(e) => setSelectedCommune(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 focus:bg-white transition-all"
                      >
                        <option value="">{t("اختر البلدية", "Choisir la commune", "Select Municipality")}</option>
                        {communes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {isArabic ? c.name_ar : (store.language === "en" ? (c.name_en || c.name_fr || c.name_ar) : (c.name_fr || c.name_ar))}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`space-y-1.5 pt-2 ${!isArabic ? "text-left" : "text-right"}`}>
                    <label className="text-sm font-bold text-slate-800">{t("طريقة التوصيل", "Mode de livraison", "Delivery Method")}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('home')}
                        className={`py-3.5 px-4 rounded-xl border text-sm font-extrabold transition-all duration-205 flex flex-col items-center gap-1.5 ${
                          deliveryMethod === 'home'
                            ? "border-primary bg-primary/5 text-primary shadow-xs"
                            : "border-slate-250 bg-slate-50/50 text-slate-650 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        <span>{t("توصيل للمنزل", "À domicile", "Home Delivery")}</span>
                        {selectedWilaya && wilayas.length > 0 && (
                          <span className="text-[11px] font-medium opacity-85 font-outfit">
                            {wilayas.find((w) => w.code === parseInt(selectedWilaya))?.home_price || 600} DZD
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('desk')}
                        className={`py-3.5 px-4 rounded-xl border text-sm font-extrabold transition-all duration-205 flex flex-col items-center gap-1.5 ${
                          deliveryMethod === 'desk'
                            ? "border-primary bg-primary/5 text-primary shadow-xs"
                            : "border-slate-250 bg-slate-50/50 text-slate-650 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        <span>{t("استلام من المكتب", "Au bureau", "Desk Pickup")}</span>
                        {selectedWilaya && wilayas.length > 0 && (
                          <span className="text-[11px] font-medium opacity-85 font-outfit">
                            {wilayas.find((w) => w.code === parseInt(selectedWilaya))?.desk_price || 400} DZD
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                    <label className="text-sm font-bold text-slate-800">{t("العنوان الكامل بالتفصيل", "Adresse complète détaillée", "Full Detailed Address")}</label>
                    <Input
                      required
                      placeholder={t("اسم الشارع، رقم المنزل، الطابق", "Nom de rue, numéro de maison, étage", "Street name, house number, floor")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-xl ${!isArabic ? "text-left pl-3" : "text-right pr-3"}`}
                    />
                  </div>

                  <div className={`space-y-1.5 ${!isArabic ? "text-left" : "text-right"}`}>
                    <label className="text-sm font-bold text-slate-800">{t("ملاحظات حول الطلب (اختياري)", "Notes sur la commande (Optionnel)", "Order Notes (Optional)")}</label>
                    <textarea
                      placeholder={t("مثال: يرجى الاتصال بي بعد الساعة الرابعة مساءً", "Ex: Veuillez m'appeler après 16h", "e.g., Please call me after 4 PM")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus:bg-white transition-all ${!isArabic ? "text-left" : "text-right"}`}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full mt-6 py-6 text-base font-extrabold rounded-xl shadow-md hover:shadow-lg hover:bg-primary/95 transition-all">
                    {loading ? t("جاري تسجيل طلبك...", "Enregistrement de votre commande...", "Registering your order...") : t("تأكيد طلب الدفع عند الاستلام", "Confirmer la commande", "Confirm Cash on Delivery Order")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary Card - Visually Distinct Soft Slate Accent Container */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#f1f5f9]/70 border border-slate-300/40 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className={`border-b border-slate-200 bg-slate-100 p-4 md:p-5 ${!isArabic ? "text-left" : "text-right"}`}>
                <CardTitle className="text-base md:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> 
                  <span>{t("ملخص الطلب", "Résumé de la commande", "Order Summary")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 divide-y divide-slate-200/80">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="py-4 flex justify-between gap-4 items-center bg-white/40 p-3 rounded-xl border border-slate-200/20 mb-3 shadow-inner">
                      <div className="flex items-center gap-3">
                        <img src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"} alt={item.title} className="h-12 w-12 rounded-lg object-cover bg-slate-50 border border-slate-100 shadow-xs" />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-bold font-outfit">{item.quantity} × {formatCurrency(item.variant?.price || item.price)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center bg-white border border-slate-200/80 rounded-lg px-2 py-1 shadow-xs">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-500 hover:text-slate-800 px-1 hover:bg-slate-50 rounded font-bold text-xs">-</button>
                        <span className="text-xs font-bold text-slate-850 px-1 font-outfit">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-500 hover:text-slate-800 px-1 hover:bg-slate-50 rounded font-bold text-xs">+</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">{t("سلتك فارغة حالياً.", "Votre panier est vide.", "Your cart is currently empty.")}</div>
                )}

                <div className={`py-4 space-y-2.5 text-xs text-slate-600 font-semibold pt-4 ${!isArabic ? "text-left" : "text-right"}`}>
                  <div className="flex justify-between"><span>{t("مجموع المنتجات:", "Sous-total:", "Subtotal:")}</span><span className="font-bold font-outfit text-slate-800">{formatCurrency(total)}</span></div>
                  <div className="flex justify-between"><span>{t("سعر التوصيل:", "Frais de livraison:", "Delivery price:")}</span><span className="font-bold font-outfit text-slate-800">{formatCurrency(deliveryPrice)}</span></div>
                </div>

                <div className={`pt-4 flex justify-between text-md font-bold text-slate-900 ${!isArabic ? "text-left" : "text-right"}`}>
                  <span>{t("المجموع الإجمالي:", "Total général:", "Grand Total:")}</span>
                  <span className="text-xl font-black text-primary font-outfit">{formatCurrency(total + deliveryPrice)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
