"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import { Truck, CheckCircle2, Star, Clock, Flame, AlertCircle, ChevronDown, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../../../../lib/utils";

/* ═══════════════════════════════════════════════
 *  Consumer-facing Landing Page — Full Renderer
 * ═══════════════════════════════════════════════ */

export default function ConsumerLandingPage() {
  const params = useParams();
  const subdomain = params.store as string;
  const slug = params.slug as string;

  const [pageData, setPageData] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);

  // Direct checkout states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [error, setError] = useState("");

  const isArabic = store?.language !== "fr" && store?.language !== "en";
  const t = (ar: string, fr: string, en: string) => {
    if (store?.language === "en") return en;
    if (store?.language === "fr") return fr;
    return ar;
  };

  useEffect(() => {
    if (subdomain && slug) {
      setLoading(true);
      Promise.all([
        api.get(`/storefront/${subdomain}/`),
        api.get(`/storefront/${subdomain}/pages/${slug}/`),
        api.get(`/storefront/${subdomain}/wilayas/`)
      ])
        .then(([storeRes, pageRes, wilayasRes]) => {
          setStore(storeRes.data);
          if (storeRes.data?.settings?.primary_color) {
            document.documentElement.style.setProperty('--primary', storeRes.data.settings.primary_color);
          }
          setPageData(pageRes.data);
          setWilayas(wilayasRes.data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [subdomain, slug]);

  useEffect(() => {
    if (pageData && store) {
      document.title = `${pageData.title} — ${store.name}`;
    }
  }, [pageData, store]);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!pageData?.product_data?.id) {
      setError(t("المنتج المرتبط بهذه الصفحة غير متوفر.", "Le produit associé à cette page n'est pas disponible.", "The product associated with this page is not available."));
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        full_name: fullName,
        phone,
        wilaya: parseInt(selectedWilaya),
        commune: parseInt(selectedCommune),
        address,
        items: [
          {
            product_id: pageData.product_data.id,
            variant_id: null,
            quantity,
          }
        ]
      };

      const response = await api.post(`/storefront/${subdomain}/checkout/`, payload);
      setOrderSuccess(response.data);
    } catch (err: any) {
      setError(t("حدث خطأ أثناء تأكيد طلبك. يرجى مراجعة المدخلات.", "Une erreur est survenue lors de la confirmation de votre commande. Veuillez vérifier les informations saisies.", "An error occurred while confirming your order. Please check the inputs."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !store || !pageData) {
    const defaultIsArabic = store?.language !== "fr" && store?.language !== "en";
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center font-cairo text-white" dir={defaultIsArabic ? "rtl" : "ltr"}>
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm">
            {store?.language === "en" ? "Loading exclusive offer..." : store?.language === "fr" ? "Chargement de l'offre exclusive..." : "جاري تحميل العرض الحصري..."}
          </p>
        </div>
      </div>
    );
  }

  const product = pageData.product_data;
  const sections = pageData.sections || [];
  const primaryColor = store?.settings?.primary_color || "#6366f1";

  // Form language: from checkout section config, fallback to store language
  const checkoutSection = sections.find((s: any) => s.section_type === 'checkout');
  const checkoutConfig = checkoutSection?.config || {};
  const form_language: string = checkoutConfig.form_language ?? store?.language ?? 'ar';
  const isFormArabic = form_language !== "fr" && form_language !== "en";
  const tf = (ar: string, fr: string, en: string) => {
    if (form_language === "en") return en;
    if (form_language === "fr") return fr;
    return ar;
  };

  // Check for sticky_cta and floating_order_button in sections
  const hasStickyCta = sections.some((s: any) => s.section_type === "sticky_cta" && s.is_enabled !== false);
  const hasFloatingBtn = sections.some((s: any) => s.section_type === "floating_order_button" && s.is_enabled !== false);

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-6 font-cairo" dir={isArabic ? "rtl" : "ltr"}>
        <div className="w-full max-w-md text-center space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl shadow-xl">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold">{t("تم تسجيل طلبك بنجاح!", "Votre commande a été enregistrée avec succès !", "Your order has been registered successfully!")}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t("رقم طلبك المميز هو", "Votre numéro de commande unique est", "Your unique order number is")} <strong className="text-indigo-400 font-outfit">{orderSuccess.order_number}</strong>.
            {t("سوف يتصل بك خدمة العملاء لتأكيد تفاصيل الشحن. شكراً لثقتكم بنا!", "Le service client vous contactera pour confirmer les détails de livraison. Merci de votre confiance !", "Customer service will contact you to confirm delivery details. Thank you for your trust!")}
          </p>
          <div className="border-t border-white/5 my-4"></div>
          <button onClick={() => window.location.reload()} className="w-full">
            <Button variant="glow" className="w-full py-3 font-semibold">{t("تأكيد طلب آخر", "Confirmer une autre commande", "Confirm another order")}</Button>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-cairo overflow-x-hidden" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="py-2.5 px-4 text-center text-xs font-extrabold flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
        <Flame className="h-4 w-4 text-amber-300 animate-pulse" />
        <span>{t("عرض خاص وحصري — الدفع عند الاستلام بـ 58 ولاية!", "Offre spéciale et exclusive — Paiement à la livraison dans 58 wilayas !", "Special & Exclusive Offer — Cash on delivery in 58 provinces!")}</span>
      </div>

      {/* Dynamic Landing Page Sections */}
      <div className="pb-12">
        {sections.length > 0 ? (
          sections.map((section: any) => {
            if (section.is_enabled === false) return null;
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                product={product}
                primaryColor={primaryColor}
                isArabic={isArabic}
                t={t}
                language={store?.language}
              />
            );
          })
        ) : (
          /* Default Fallback */
          <section className="container mx-auto px-6 py-12 max-w-4xl text-center space-y-6">
            <h1 className="text-4xl font-extrabold">{product?.title}</h1>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">{product?.description}</p>
            {product?.primary_image && (
              <img src={product.primary_image} alt={product.title} className="w-full max-w-lg rounded-2xl mx-auto border border-white/5" />
            )}
          </section>
        )}

        {/* ─── Checkout Form ─── */}
        {product && (
          <section id="checkout" className="container mx-auto px-4 py-12 max-w-2xl space-y-6" dir={isFormArabic ? "rtl" : "ltr"}>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black">{tf("أطلب الآن بالدفع عند الاستلام!", "Commandez maintenant et payez à la livraison !", "Order now with Cash on Delivery!")}</h2>
              <p className="text-xs text-slate-400">{tf("يرجى ملء الاستمارة أسفله بدقة. التوصيل سريع لكل 58 ولاية.", "Veuillez remplir le formulaire ci-dessous avec précision. Livraison rapide dans 58 wilayas.", "Please fill out the form below accurately. Fast shipping to all 58 provinces.")}</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Card className="bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl rounded-3xl">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{tf("الاسم الكامل", "Nom complet", "Full Name")}</label>
                      <Input required placeholder={tf("الاسم واللقب", "Nom et prénom", "First & Last Name")} value={fullName} onChange={(e) => setFullName(e.target.value)} className={`border-white/10 bg-slate-950/40 text-white placeholder:text-slate-400/60 px-3 ${isFormArabic ? 'text-right' : 'text-left'} focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl h-11`} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{tf("رقم الهاتف", "Numéro de téléphone", "Phone Number")}</label>
                      <Input required type="tel" placeholder="0661234567" value={phone} onChange={(e) => setPhone(e.target.value)} className={`border-white/10 bg-slate-950/40 text-white placeholder:text-slate-400/60 px-3 ${isFormArabic ? 'text-right' : 'text-left'} font-outfit focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl h-11`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{tf("الولاية", "Wilaya", "Province")}</label>
                      <select required value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)} className={`flex h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all ${isFormArabic ? 'text-right' : 'text-left'}`}>
                        <option value="" className="bg-[#0f172a] text-white">{tf("اختر الولاية", "Choisir la wilaya", "Select Province")}</option>
                        {wilayas.map((w) => <option key={w.code} value={w.code} className="bg-[#0f172a] text-white">{w.code} - {isFormArabic ? w.name_ar : (w.name_fr || w.name_ar)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{tf("البلدية", "Commune", "Municipality")}</label>
                      <select required disabled={!selectedWilaya} value={selectedCommune} onChange={(e) => setSelectedCommune(e.target.value)} className={`flex h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 ${isFormArabic ? 'text-right' : 'text-left'}`}>
                        <option value="" className="bg-[#0f172a] text-white">{tf("اختر البلدية", "Choisir la commune", "Select Municipality")}</option>
                        {communes.map((c) => <option key={c.id} value={c.id} className="bg-[#0f172a] text-white">{isFormArabic ? (c.name_ar || c.name) : (c.name || c.name_ar)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{tf("العنوان بالتفصيل", "Adresse détaillée", "Detailed Address")}</label>
                    <Input required placeholder={tf("اسم الشارع أو الحي", "Nom de rue ou quartier", "Street name or neighborhood")} value={address} onChange={(e) => setAddress(e.target.value)} className={`border-white/10 bg-slate-950/40 text-white placeholder:text-slate-400/60 px-3 ${isFormArabic ? 'text-right' : 'text-left'} focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl h-11`} />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5 text-sm">
                    <span>{tf("الكمية:", "Quantité :", "Quantity:")}</span>
                    <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-white/5">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1.5 hover:bg-white/5 transition-colors">-</button>
                      <span className="px-4 font-outfit font-bold">{quantity}</span>
                      <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-3 py-1.5 hover:bg-white/5 transition-colors">+</button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-baseline font-bold text-lg">
                    <span>{tf("المجموع:", "Total :", "Total:")}</span>
                    <span className="text-2xl font-black font-outfit" style={{ color: primaryColor }}>
                      {formatCurrency(quantity * parseFloat(product?.price || 0))}
                    </span>
                  </div>

                  <Button type="submit" disabled={submitting} variant="glow" className="w-full mt-4 py-4 font-black rounded-2xl text-base shadow-xl flex items-center justify-center gap-2">
                    <Truck className="h-5 w-5 animate-pulse" />
                    <span>{submitting ? tf("جاري تسجيل طلبك...", "Enregistrement...", "Registering order...") : tf("أطلب الآن — الدفع عند الاستلام!", "Commander maintenant — Paiement à la livraison !", "Order Now — Cash on Delivery!")}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* ─── Sticky CTA Bar ─── */}
      {hasStickyCta && (() => {
        const ctaSection = sections.find((s: any) => s.section_type === "sticky_cta");
        const config = ctaSection?.config || {};
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-3 shadow-2xl backdrop-blur-md border-t border-white/10" style={{ backgroundColor: config.bg_color || primaryColor }}>
            <div className="container mx-auto max-w-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-white flex-1 min-w-0">
                {config.show_price && product && (
                  <span className="font-black text-lg font-outfit whitespace-nowrap">{formatCurrency(parseFloat(product.price))}</span>
                )}
                <span className="text-sm font-bold truncate">{config.text || t("أطلب الآن!", "Commandez maintenant !", "Order Now!")}</span>
              </div>
              <a href="#checkout" className="flex-shrink-0">
                <button className="bg-white text-black font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg">
                  {t("أطلب الآن", "Commander maintenant", "Order Now")}
                </button>
              </a>
            </div>
          </div>
        );
      })()}

      {/* ─── Floating Order Button ─── */}
      {hasFloatingBtn && !hasStickyCta && (() => {
        const btnSection = sections.find((s: any) => s.section_type === "floating_order_button");
        const config = btnSection?.config || {};
        return (
          <a href={config.scroll_to || "#checkout"} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-extrabold text-white text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all animate-bounce"
              style={{ backgroundColor: primaryColor, boxShadow: `0 0 30px ${primaryColor}60` }}
            >
              <ShoppingCart className="h-5 w-5" />
              {config.text || t("أطلب الآن!", "Commandez maintenant !", "Order Now!")}
            </button>
          </a>
        );
      })()}

      {/* Bottom padding for sticky elements */}
      {(hasStickyCta || hasFloatingBtn) && <div className="h-20" />}
    </div>
  );
}


/* ═══════════════════════════════════════════════
 *  Section Renderer — handles all 16 section types
 * ═══════════════════════════════════════════════ */

function SectionRenderer({ 
  section, 
  product, 
  primaryColor, 
  isArabic, 
  t,
  language
}: { 
  section: any; 
  product: any; 
  primaryColor: string; 
  isArabic: boolean; 
  t: (ar: string, fr: string, en: string) => string;
  language?: string;
}) {
  const config = section.config || {};

  switch (section.section_type) {
    /* ─── HERO ─── */
    case "hero": {
      const bgStyles: Record<string, string> = {
        gradient: "bg-gradient-to-b from-[#0f1424] via-[#131830] to-[#090d16]",
        dark: "bg-[#090d16]",
        premium: "bg-gradient-to-b from-amber-950/20 via-[#0f1424] to-[#090d16]"
      };
      return (
        <section className={`${bgStyles[config.bg_style] || bgStyles.gradient} py-10 md:py-16`}>
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            {config.badge_text && (
              <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/80 animate-pulse">
                {config.badge_text}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent px-2">
              {config.title || product?.title}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed px-4">
              {config.subtitle || product?.description}
            </p>
            {config.show_price && product && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {product.compare_price && (
                  <span className="text-slate-500 line-through text-lg font-outfit">{formatCurrency(parseFloat(product.compare_price))}</span>
                )}
                <span className="text-3xl font-black font-outfit" style={{ color: primaryColor }}>
                  {formatCurrency(parseFloat(product.price))}
                </span>
                {product.discount_percentage > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    -{product.discount_percentage}%
                  </span>
                )}
              </div>
            )}
            {product?.primary_image && (
              <div className="aspect-square sm:aspect-video w-full max-w-2xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-xl relative">
                <img src={product.primary_image} alt={product.title} className="w-full h-full object-cover" />
              </div>
            )}
            {config.cta_text && (
              <a href="#checkout">
                <button
                  className="mt-4 px-8 py-3.5 rounded-xl font-extrabold text-white text-base shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 30px ${primaryColor}40` }}
                >
                  {config.cta_text}
                </button>
              </a>
            )}
          </div>
        </section>
      );
    }

    /* ─── VIDEO ─── */
    case "video": {
      let embedUrl = config.video_url || "";
      // Convert YouTube watch URLs to embed
      if (embedUrl.includes("youtube.com/watch")) {
        const vid = new URL(embedUrl).searchParams.get("v");
        if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
      } else if (embedUrl.includes("youtu.be/")) {
        const vid = embedUrl.split("youtu.be/")[1]?.split("?")[0];
        if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
      }
      if (!embedUrl) return null;
      return (
        <section className="py-6 md:py-10 container mx-auto px-4 max-w-4xl">
          {config.title && <h2 className="text-xl font-bold text-center mb-4">{config.title}</h2>}
          <div className="relative w-full max-w-2xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 shadow-2xl" style={{ aspectRatio: config.aspect_ratio === "9/16" ? "9/16" : "16/9" }}>
            <iframe
              src={`${embedUrl}${config.autoplay ? "?autoplay=1&mute=1" : ""}`}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </section>
      );
    }

    /* ─── REVIEWS ─── */
    case "reviews": {
      const reviews = config.reviews || [];
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("آراء زبائننا", "Avis de nos clients", "Customer Reviews")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {reviews.map((r: any, idx: number) => (
              <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-5 space-y-3 hover:border-white/10 transition-all">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{r.name}</span>
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(r.rating || 5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.text}</p>
                {r.date && <span className="text-[10px] text-slate-500">{r.date}</span>}
              </div>
            ))}
          </div>
        </section>
      );
    }

    /* ─── FAQ ─── */
    case "faq": {
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">{config.title || t("أسئلة شائعة", "Questions Fréquentes (FAQ)", "Frequently Asked Questions (FAQ)")}</h2>
          <div className="space-y-3">
            {(config.items || []).map((item: any, idx: number) => (
              <FAQItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>
      );
    }

    /* ─── BENEFITS ─── */
    case "benefits": {
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("المميزات", "Caractéristiques", "Benefits")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {(config.items || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-2xl md:text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    /* ─── BEFORE/AFTER ─── */
    case "before_after": {
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("قبل وبعد", "Avant / Après", "Before / After")}</h2>
          <BeforeAfterSlider
            beforeImage={config.before_image}
            afterImage={config.after_image}
            beforeLabel={config.before_label || t("قبل", "Avant", "Before")}
            afterLabel={config.after_label || t("بعد", "Après", "After")}
            language={language}
          />
        </section>
      );
    }

    /* ─── COUNTDOWN ─── */
    case "countdown": {
      return (
        <section className="py-0">
          <CountdownTimer
            hours={config.hours || 0}
            minutes={config.minutes || 0}
            seconds={config.seconds || 0}
            title={config.title}
            urgencyText={config.urgency_text}
            bgColor={config.bg_color || "#dc2626"}
            textColor={config.text_color || "#ffffff"}
            language={language}
          />
        </section>
      );
    }

    /* ─── QUANTITY OFFERS ─── */
    case "quantity_offers": {
      const offers = product?.quantity_offers || [];
      if (offers.length === 0) return null;
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("عروض الكمية", "Offres de quantité", "Quantity Offers")}</h2>
          {config.subtitle && <p className="text-sm text-slate-400 text-center">{config.subtitle}</p>}
          <div className="space-y-3">
            {offers.map((offer: any, idx: number) => {
              const isHighlight = idx === (config.highlight_index ?? -1);
              const unitPrice = parseFloat(offer.price) / offer.quantity;
              const originalUnit = parseFloat(product.price);
              const savings = Math.round(((originalUnit - unitPrice) / originalUnit) * 100);
              return (
                <div
                  key={offer.id || idx}
                  className={`relative flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all ${
                    isHighlight
                      ? "border-2 bg-gradient-to-l from-primary/10 to-transparent shadow-lg"
                      : "border-white/5 bg-white/5 hover:border-white/10"
                  }`}
                  style={isHighlight ? { borderColor: primaryColor } : {}}
                >
                  {isHighlight && config.highlight_badge && (
                    <span className="absolute -top-3 right-4 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                      {config.highlight_badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black font-outfit" style={isHighlight ? { color: primaryColor } : {}}>{offer.quantity}x</span>
                    <div>
                      <span className="font-bold text-sm">{offer.label || t(`${offer.quantity} قطع`, `${offer.quantity} pièces`, `${offer.quantity} pieces`)}</span>
                      {savings > 0 && <span className="text-xs text-emerald-400 block mt-0.5">{t("وفر", "Économisez", "Save")} {savings}%</span>}
                    </div>
                  </div>
                  <span className="font-black text-lg font-outfit" style={isHighlight ? { color: primaryColor } : {}}>
                    {formatCurrency(parseFloat(offer.price))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    /* ─── BUNDLE OFFERS ─── */
    case "bundle_offers": {
      const bundles = product?.bundle_offers || [];
      if (bundles.length === 0) return null;
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("عروض الباقات", "Offres de packs", "Bundle Offers")}</h2>
          {config.subtitle && <p className="text-sm text-slate-400 text-center">{config.subtitle}</p>}
          <div className="space-y-3">
            {bundles.map((bundle: any, idx: number) => (
              <div key={bundle.id || idx} className="p-4 md:p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-white/10 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    🎁 {bundle.name}
                    {idx === 0 && config.highlight_text && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                        {config.highlight_text}
                      </span>
                    )}
                  </h3>
                  <span className="font-black text-lg font-outfit" style={{ color: primaryColor }}>{formatCurrency(parseFloat(bundle.price))}</span>
                </div>
                {bundle.items && (
                  <div className="flex flex-wrap gap-2">
                    {bundle.items.map((item: any, iIdx: number) => (
                      <span key={iIdx} className="text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-400">
                        {item.quantity}x {item.product_title || t("منتج", "produit", "product")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    /* ─── DELIVERY INFO ─── */
    case "delivery_info": {
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("معلومات التوصيل", "Informations de livraison", "Delivery Info")}</h2>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
            {(config.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    /* ─── COMPARISON TABLE ─── */
    case "comparison": {
      const columns = config.columns || [];
      const rows = config.rows || [];
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("جدول المقارنة", "Tableau de comparaison", "Comparison Table")}</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  {columns.map((col: string, idx: number) => (
                    <th key={idx} className={`px-4 py-3 ${isArabic ? 'text-right' : 'text-left'} font-bold text-xs`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: string[], rIdx: number) => (
                  <tr key={rIdx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    {row.map((cell: string, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-3 text-xs text-slate-300">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    /* ─── TEXT ─── */
    case "text": {
      return (
        <section className="py-6 md:py-10 container mx-auto px-4 max-w-3xl">
          {config.title && <h2 className="text-xl font-bold text-center mb-4">{config.title}</h2>}
          <p
            className={`text-sm text-slate-300 leading-relaxed whitespace-pre-line ${
              config.align === "center" ? "text-center" : config.align === "left" ? "text-left" : "text-right"
            }`}
          >
            {config.content}
          </p>
        </section>
      );
    }

    /* ─── IMAGE ─── */
    case "image": {
      if (!config.image_url) return null;
      return (
        <section className={`py-6 md:py-10 ${config.full_width ? "" : "container mx-auto px-4 max-w-3xl"}`}>
          <img
            src={config.image_url}
            alt={config.alt_text || ""}
            className={`w-full ${config.full_width ? "" : "rounded-2xl border border-white/5"} object-cover`}
          />
          {config.caption && <p className="text-xs text-slate-500 text-center mt-2">{config.caption}</p>}
        </section>
      );
    }

    /* ─── PRODUCT GALLERY ─── */
    case "product_gallery": {
      const images = product?.images || [];
      if (images.length === 0) return null;
      return (
        <section className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-4">
          {config.title && <h2 className="text-xl font-bold text-center">{config.title}</h2>}
          <ProductGallery images={images} />
        </section>
      );
    }

    /* ─── STICKY CTA & FLOATING (rendered at root level) ─── */
    case "sticky_cta":
    case "floating_order_button":
      return null; // Rendered outside the section loop

    default:
      return null;
  }
}


/* ═══════════════════════════════════════════════
 *  Sub-Components
 * ═══════════════════════════════════════════════ */

/** FAQ Accordion Item */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5 hover:border-white/10 transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-right">
        <span className="font-bold text-sm flex-1">{question}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 flex-shrink-0 mr-3 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
          {answer}
        </div>
      </div>
    </div>
  );
}


/** Countdown Timer */
function CountdownTimer({ hours, minutes, seconds, title, urgencyText, bgColor, textColor, language }: {
  hours: number; minutes: number; seconds: number;
  title: string; urgencyText: string; bgColor: string; textColor: string;
  language?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({ h: hours, m: minutes, s: seconds });

  useEffect(() => {
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    const endTime = Date.now() + totalSecs * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft({ h, m, s });
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [hours, minutes, seconds]);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const tUnit = (ar: string, fr: string, en: string) => {
    if (language === "en") return en;
    if (language === "fr") return fr;
    return ar;
  };

  return (
    <div className="py-5 md:py-6 px-4 text-center space-y-3" style={{ backgroundColor: bgColor, color: textColor }}>
      {title && <p className="text-sm font-bold">{title}</p>}
      <div className="flex items-center justify-center gap-2 md:gap-3 font-outfit">
        {[
          { val: timeLeft.h, label: tUnit("ساعة", "heures", "hours") },
          { val: timeLeft.m, label: tUnit("دقيقة", "minutes", "minutes") },
          { val: timeLeft.s, label: tUnit("ثانية", "secondes", "seconds") }
        ].map((unit, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-2xl md:text-3xl font-bold opacity-50">:</span>}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black tabular-nums">{pad(unit.val)}</div>
              <div className="text-[10px] font-semibold opacity-70 font-cairo">{unit.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      {urgencyText && <p className="text-xs font-semibold opacity-80 animate-pulse">{urgencyText}</p>}
    </div>
  );
}


/** Before/After Slider */
function BeforeAfterSlider({ beforeImage, afterImage, beforeLabel, afterLabel, language }: {
  beforeImage: string; afterImage: string; beforeLabel: string; afterLabel: string; language?: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!beforeImage || !afterImage) {
    const tEmpty = (ar: string, fr: string, en: string) => {
      if (language === "en") return en;
      if (language === "fr") return fr;
      return ar;
    };
    return (
      <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-slate-500 text-xs">{tEmpty("أضف صور المقارنة من المنشئ", "Ajouter des images de comparaison", "Add comparison images")}</p>
      </div>
    );
  }

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // RTL: invert the calculation
    const x = rect.right - clientX;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-white/5 cursor-col-resize select-none"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      {/* After (full background) */}
      <img src={afterImage} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={beforeImage} alt={beforeLabel} className="w-full h-full object-cover" style={{ width: `${containerRef.current?.offsetWidth || 500}px` }} />
      </div>
      {/* Slider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ right: `${sliderPos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 right-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <span className="text-white text-xs font-bold">⇔</span>
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">{beforeLabel}</span>
      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">{afterLabel}</span>
    </div>
  );
}


/** Product Gallery Swiper */
function ProductGallery({ images }: { images: any[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
        <img
          src={images[activeIdx]?.image_url}
          alt={images[activeIdx]?.alt_text || ""}
          className="w-full h-full object-cover transition-all duration-500"
        />
      </div>
      {/* Thumbnails */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img: any, idx: number) => (
          <button
            key={img.id || idx}
            onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              idx === activeIdx ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-white/5 hover:border-white/20"
            }`}
          >
            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
