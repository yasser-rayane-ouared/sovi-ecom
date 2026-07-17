"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ShoppingCart, Phone, Truck, ShieldCheck, Star, AlertCircle, Layers, ChevronDown, Clock } from "lucide-react";
import { formatCurrency, getStorefrontLink, getFullImageUrl } from "../../lib/utils";

export default function StorefrontHome() {
  const params = useParams();
  const subdomain = params.store as string;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subdomain) {
      setLoading(true);
      // Fetch public store details
      api.get(`/storefront/${subdomain}/`)
        .then((res) => {
          setStore(res.data);
          // Apply custom primary color
          if (res.data?.settings?.primary_color) {
            document.documentElement.style.setProperty('--primary', res.data.settings.primary_color);
          }
          // Initialize active pixels
          if (res.data?.pixels) {
            const { initializePixels } = require("../../components/pixels");
            initializePixels(res.data.pixels);
          }
          
          // Fetch categories
          api.get(`/storefront/${subdomain}/categories/`)
            .then((catRes) => {
              setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.results || []));
            })
            .catch(() => {});

          return api.get(`/storefront/${subdomain}/products/`);
        })
        .then((res) => {
          setProducts(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [subdomain]);

  useEffect(() => {
    if (!store || !subdomain) return;

    let sessionId = localStorage.getItem('ab_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('ab_session_id', sessionId);
    }

    api.post('/analytics/track/', {
      store: subdomain,
      event_type: 'page_view',
      value: 0,
      metadata: {
        is_store_home: true,
        page_url: window.location.href,
        referrer: document.referrer
      },
      session_id: sessionId
    }).catch(() => {});
  }, [store, subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-cairo p-6">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">المتجر غير موجود أو غير نشط حالياً</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            عذراً، قد يكون المتجر الذي تحاول الوصول إليه غير موجود أو تم إيقافه مؤقتاً لانتهاء الصلاحية. يرجى مراجعة صاحب المتجر أو الدعم الفني.
          </p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            منصة Sovi للتجارة الإلكترونية بالجزائر
          </div>
        </div>
      </div>
    );
  }

  const settings = store.settings;
  const isArabic = store.language !== "fr" && store.language !== "en";
  const t = (ar: string, fr: string, en: string) => {
    if (store.language === "en") return en;
    if (store.language === "fr") return fr;
    return ar;
  };

  // Load sections from settings
  let homepageSections: any[] = [];
  try {
    if (settings?.homepage_sections) {
      const parsed = JSON.parse(settings.homepage_sections);
      homepageSections = (Array.isArray(parsed) ? parsed : []).filter((s: any) => s && s.section_type);
    }
  } catch (e) {
    console.error("Failed to parse homepage_sections", e);
  }

  // Fallback to default sections if empty
  if (!homepageSections || homepageSections.length === 0) {
    homepageSections = [
      { id: "default-announcement", section_type: "announcement", config: {}, order: 0 },
      { id: "default-header", section_type: "header", config: {}, order: 1 },
      { id: "default-hero", section_type: "hero", config: {}, order: 2 },
      { id: "default-products", section_type: "featured_products", config: {}, order: 3 },
      { id: "default-badges", section_type: "trust_badges", config: {}, order: 4 },
      { id: "default-footer", section_type: "footer", config: {}, order: 5 }
    ];
  }

  // Sort sections by order
  homepageSections.sort((a, b) => (a.order || 0) - (b.order || 0));

  const product = products && products.length > 0 ? products[0] : null;
  const primaryColor = settings?.primary_color || "#6366f1";
  const language = store?.language || "ar";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-cairo flex flex-col justify-between" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex-grow">
        {homepageSections.map((section: any) => {
          const config = section.config || {};
          
          switch (section.section_type) {
            case "announcement":
              return (
                <div 
                  key={section.id}
                  style={{ 
                    backgroundColor: config.background_color || settings?.announcement_bg_color || "#4f46e5",
                    color: config.color || "#ffffff"
                  }}
                  className="text-xs py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm border-b border-indigo-500/10"
                >
                  <Truck className="h-4 w-4 animate-pulse" />
                  <span
                    style={{
                      fontSize: config.font_size || "12px",
                      textAlign: config.text_align || "center"
                    }}
                  >
                    {config.content || settings?.announcement_text || t("الدفع عند الاستلام في 58 ولاية!", "Paiement à la livraison dans 58 wilayas!", "Cash on delivery in 58 provinces!")}
                  </span>
                </div>
              );

            case "header":
              return (
                <header 
                  key={section.id} 
                  className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60 transition-all duration-300"
                  style={{
                    backgroundColor: config.background_color ? `${config.background_color}CC` : undefined,
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link href={getStorefrontLink(subdomain, "/")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                      {store.logo ? (
                        <img 
                          src={getFullImageUrl(store.logo)} 
                          alt={store.name} 
                          className="h-9 w-auto object-contain" 
                        />
                      ) : (
                        <span 
                          className="text-2xl font-black bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent font-outfit"
                          style={{
                            color: config.color || undefined
                          }}
                        >
                          {config.content || store.name}
                        </span>
                      )}
                    </Link>

                    <div className="flex items-center gap-4">
                      {settings?.whatsapp_number && (
                        <a
                          href={`https://wa.me/${settings.whatsapp_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hidden md:flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>{t("اتصل بنا", "Contactez-nous", "Contact Us")}</span>
                        </a>
                      )}
                      <Link href={getStorefrontLink(subdomain, "/checkout")}>
                        <Button size="sm" variant="outline" className="relative gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-xs transition-all">
                          <ShoppingCart className="h-4 w-4" />
                          <span>{t("السلة", "Panier", "Cart")}</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </header>
              );

            case "hero":
              return (
                <section 
                  key={section.id} 
                  className="bg-gradient-to-b from-indigo-50/70 via-slate-50/40 to-white py-10 md:py-20 border-b border-slate-200/50 text-center"
                  style={{
                    backgroundColor: config.background_color || undefined,
                    backgroundImage: config.background_color ? "none" : undefined,
                    color: config.color || undefined
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-4 md:space-y-5">
                    <h1 
                      className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-xs"
                      style={{
                        color: config.color || "#0f172a",
                        textAlign: config.text_align || "center"
                      }}
                    >
                      {config.title || store.description || t(`أهلاً بكم في متجر ${store.name}`, `Bienvenue chez ${store.name}`, `Welcome to ${store.name}`)}
                    </h1>
                    <p 
                      className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium"
                      style={{
                        color: config.color ? `${config.color}CC` : "#475569",
                        fontSize: config.font_size || "16px",
                        textAlign: config.text_align || "center"
                      }}
                    >
                      {config.description || t("تسوق أفضل المنتجات جودة مع خدمة التوصيل السريع والدفع الآمن عند الاستلام.", "Achetez les meilleurs produits avec livraison rapide et paiement sécurisé à la livraison.", "Shop the best quality products with fast delivery and secure cash on delivery.")}
                    </p>
                  </div>
                </section>
              );

            case "featured_products":
              return (
                <section key={section.id} className="container mx-auto px-4 md:px-6 py-10 md:py-20 flex-grow shadow-xs border-b border-slate-100"
                  style={{
                    backgroundColor: config.background_color || '#ffffff',
                    color: config.color || undefined
                  }}
                >
                  <div className="mb-8 md:mb-12 text-center md:text-right">
                    <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2 justify-center md:justify-start">
                      <Star className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary animate-pulse" />
                      <span>{config.title || t("منتجاتنا المميزة", "Nos Produits Vedettes", "Featured Products")}</span>
                    </h2>
                    <div className="h-1 w-20 md:h-1.5 md:w-24 bg-gradient-to-r from-primary to-indigo-600 rounded-full mt-2.5 md:mt-3.5 mx-auto md:mx-0"></div>
                  </div>

                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8 pb-3 border-b border-slate-100/80">
                      <span className="text-xs font-bold text-slate-400 self-center ml-2">{t("الفئات:", "Catégories:", "Categories:")}</span>
                      {categories.map((cat: any) => (
                        <Link 
                          key={cat.id} 
                          href={getStorefrontLink(subdomain, `/categories/${cat.slug}`)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-primary hover:text-white text-slate-600 transition-all border border-slate-200/40"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {products.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                      {products.map((product) => (
                        <Card key={product.id} className="bg-[#f8fafc] border border-slate-200/60 rounded-xl md:rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-full group">
                          <Link href={getStorefrontLink(subdomain, `/products/${product.slug}`)}>
                            <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                              <img
                                src={product.primary_image ? getFullImageUrl(product.primary_image) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
                                alt={product.title}
                                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                              />
                              {product.discount_percentage > 0 && (
                                <span className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500 text-white font-bold text-[9px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md">
                                  -{product.discount_percentage}%
                                </span>
                              )}
                            </div>
                          </Link>

                          <CardContent className="p-3 md:p-5 space-y-3 md:space-y-4 flex-grow flex flex-col justify-between bg-white">
                            <div className="space-y-1">
                              <Link href={getStorefrontLink(subdomain, `/products/${product.slug}`)}>
                                <h3 className="font-bold text-slate-800 text-xs md:text-md hover:text-primary transition-colors line-clamp-2 leading-snug">{product.title}</h3>
                              </Link>
                              <p className="text-slate-400 text-[9px] md:text-[11px] font-mono">{product.sku}</p>
                            </div>

                            <div className="space-y-2 md:space-y-3.5 pt-2 border-t border-slate-100/80">
                              <div className="flex flex-wrap items-baseline gap-1 md:gap-2 justify-start">
                                <span className="text-sm md:text-xl font-black text-primary font-outfit">{formatCurrency(parseFloat(product.price))}</span>
                                {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                                  <span className="text-[10px] md:text-xs text-slate-400 line-through font-outfit">{formatCurrency(parseFloat(product.compare_price))}</span>
                                )}
                              </div>

                              <Link href={getStorefrontLink(subdomain, `/products/${product.slug}`)} className="block w-full">
                                <Button className="w-full rounded-lg md:rounded-xl gap-1 md:gap-2 font-bold hover:shadow-md transition-all py-3.5 md:py-5 h-auto text-xs md:text-sm">
                                  <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  <span>{t("طلب المنتج", "Acheter maintenant", "Order Now")}</span>
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-3">
                      <p className="text-slate-400 text-sm">{t("لا توجد منتجات معروضة حالياً.", "Aucun produit disponible pour le moment.", "No products available at the moment.")}</p>
                    </div>
                  )}
                </section>
              );

            case "categories":
              if (!categories || categories.length === 0) return null;
              const isSliderStyle = config.layout === "slider" || !config.layout;
              const imgStyle = config.image_style || "circle";
              
              return (
                <section
                  key={section.id}
                  className="py-10 md:py-16 border-b border-slate-100"
                  style={{
                    backgroundColor: config.background_color || "#ffffff",
                    color: config.color || "#0f172a"
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6">
                    <div className="mb-8 text-center md:text-right">
                      <h2 
                        className="text-xl md:text-3xl font-extrabold flex items-center gap-2 justify-center md:justify-start"
                        style={{ color: config.color || "#0f172a" }}
                      >
                        <Layers className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary/10 animate-pulse" />
                        <span>{config.title || t("تصفح حسب الفئات", "Parcourir par catégories", "Browse by Categories")}</span>
                      </h2>
                      <div className="h-1 w-20 md:h-1.5 md:w-24 bg-gradient-to-r from-primary to-indigo-600 rounded-full mt-2.5 md:mt-3.5 mx-auto md:mx-0"></div>
                    </div>

                    {isSliderStyle ? (
                      <div className="flex overflow-x-auto gap-4 md:gap-6 py-2 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {categories.map((cat: any) => {
                          const catLink = getStorefrontLink(subdomain, `/categories/${cat.slug}`);
                          return (
                            <Link 
                              key={cat.id} 
                              href={catLink}
                              className="flex flex-col items-center space-y-2.5 flex-shrink-0 group cursor-pointer"
                              style={{ width: imgStyle === 'card' ? '120px' : '90px' }}
                            >
                              {imgStyle === 'circle' && (
                                <div className="h-[76px] w-[76px] rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-300 shadow-sm group-hover:scale-105 bg-slate-50 flex items-center justify-center">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-indigo-600/10 flex items-center justify-center text-primary text-xl font-bold font-outfit">
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {imgStyle === 'square' && (
                                <div className="h-[76px] w-[76px] rounded-2xl overflow-hidden border border-slate-100 group-hover:border-primary transition-all duration-300 shadow-sm group-hover:scale-105 bg-slate-50 flex items-center justify-center">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-indigo-600/10 flex items-center justify-center text-primary text-xl font-bold font-outfit">
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {imgStyle === 'card' && (
                                <div className="h-[100px] w-full rounded-2xl overflow-hidden relative shadow-sm group-hover:scale-105 transition-all duration-300 flex items-center justify-center bg-slate-900 text-white">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-600 opacity-90"></div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 z-0"></div>
                                  <span className="text-xs font-black text-white text-center relative z-10 truncate px-2 leading-tight">
                                    {cat.name}
                                  </span>
                                </div>
                              )}
                              {imgStyle !== 'card' && (
                                <span 
                                  className="text-[11px] font-black text-center truncate max-w-full group-hover:text-primary transition-colors leading-tight"
                                  style={{ color: config.color || "#0f172a" }}
                                >
                                  {cat.name}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-6">
                        {categories.map((cat: any) => {
                          const catLink = getStorefrontLink(subdomain, `/categories/${cat.slug}`);
                          return (
                            <Link 
                              key={cat.id} 
                              href={catLink}
                              className="flex flex-col items-center space-y-2.5 group cursor-pointer"
                            >
                              {imgStyle === 'circle' && (
                                <div className="h-[76px] w-[76px] rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-300 shadow-sm group-hover:scale-105 bg-slate-50 flex items-center justify-center">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-indigo-600/10 flex items-center justify-center text-primary text-xl font-bold font-outfit">
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {imgStyle === 'square' && (
                                <div className="h-[76px] w-[76px] rounded-2xl overflow-hidden border border-slate-100 group-hover:border-primary transition-all duration-300 shadow-sm group-hover:scale-105 bg-slate-50 flex items-center justify-center">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-indigo-600/10 flex items-center justify-center text-primary text-xl font-bold font-outfit">
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {imgStyle === 'card' && (
                                <div className="h-[100px] w-full rounded-2xl overflow-hidden relative shadow-sm group-hover:scale-105 transition-all duration-300 flex items-center justify-center bg-slate-900 text-white">
                                  {cat.image_url ? (
                                    <img src={getFullImageUrl(cat.image_url)} alt={cat.name} className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-600 opacity-90"></div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 z-0"></div>
                                  <span className="text-xs font-black text-white text-center relative z-10 truncate px-2 leading-tight">
                                    {cat.name}
                                  </span>
                                </div>
                              )}
                              {imgStyle !== 'card' && (
                                <span 
                                  className="text-[11px] font-black text-center truncate max-w-full group-hover:text-primary transition-colors leading-tight"
                                  style={{ color: config.color || "#0f172a" }}
                                >
                                  {cat.name}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );


            case "trust_badges":
              return (
                <section 
                  key={section.id} 
                  className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-t border-b border-slate-200/50 py-10 md:py-16"
                  style={{
                    backgroundColor: config.background_color || undefined,
                    backgroundImage: config.background_color ? "none" : undefined,
                    color: config.color || undefined
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 text-center">
                    <div 
                      className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300"
                      style={{
                        backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                        borderColor: config.color ? `${config.color}20` : undefined,
                      }}
                    >
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <Truck className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 
                        className="font-extrabold text-slate-900 text-sm md:text-md"
                        style={{ color: config.color || undefined }}
                      >
                        {config.badge_1_title || settings?.badge_1_title || t("توصيل سريع", "Livraison Rapide", "Fast Delivery")}
                      </h4>
                      <p 
                        className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed"
                        style={{ color: config.color ? `${config.color}A0` : undefined }}
                      >
                        {config.badge_1_desc || settings?.badge_1_desc || t("التوصيل لجميع الولايات بأسعار مدروسة.", "Livraison à domicile dans les 58 wilayas.", "Delivery to all provinces at affordable rates.")}
                      </p>
                    </div>
                    <div 
                      className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300"
                      style={{
                        backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                        borderColor: config.color ? `${config.color}20` : undefined,
                      }}
                    >
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 
                        className="font-extrabold text-slate-900 text-sm md:text-md"
                        style={{ color: config.color || undefined }}
                      >
                        {config.badge_2_title || settings?.badge_2_title || t("الدفع عند الاستلام", "Paiement à la Livraison", "Cash on Delivery")}
                      </h4>
                      <p 
                        className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed"
                        style={{ color: config.color ? `${config.color}A0` : undefined }}
                      >
                        {config.badge_2_desc || settings?.badge_2_desc || t("لا تدفع أي شيء حتى تستلم منتجك بين يديك.", "Payez seulement après réception de votre colis.", "Pay only after you receive your package.")}
                      </p>
                    </div>
                    <div 
                      className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300"
                      style={{
                        backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                        borderColor: config.color ? `${config.color}20` : undefined,
                      }}
                    >
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <Phone className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 
                        className="font-extrabold text-slate-900 text-sm md:text-md"
                        style={{ color: config.color || undefined }}
                      >
                        {config.badge_3_title || settings?.badge_3_title || t("دعم العملاء", "Support Client", "Customer Support")}
                      </h4>
                      <p 
                        className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed"
                        style={{ color: config.color ? `${config.color}A0` : undefined }}
                      >
                        {config.badge_3_desc || settings?.badge_3_desc || t("فريق عملنا متواجد للرد على اتصالاتكم وتأكيد الطلبيات.", "Nous confirmons chaque commande par téléphone.", "Our team is available to answer your calls and confirm orders.")}
                      </p>
                    </div>
                  </div>
                </section>
              );

            case "footer":
              return (
                <footer 
                  key={section.id} 
                  className="bg-[#090d16] text-white py-10 md:py-16 border-t border-slate-800 text-center font-cairo"
                  style={{
                    backgroundColor: config.background_color || undefined,
                    color: config.color || undefined
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
                    <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent font-outfit">{store.name}</h3>
                    <p 
                      className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-md mx-auto font-medium"
                      style={{ color: config.color ? `${config.color}CC` : undefined }}
                    >
                      {t(
                        "موقع تسوق جزائري يقدم تشكيلة متميزة من المنتجات بأسعار تنافسية وخيارات دفع مريحة.",
                        "Boutique en ligne algérienne offrant une sélection de produits de qualité à prix réduits.",
                        "Algerian shopping site offering a premium selection of products at competitive prices and convenient payment options."
                      )}
                    </p>
                    <div className="border-t border-white/5 pt-6 md:pt-8 text-slate-500 text-[10px] md:text-xs space-y-2">
                      <p
                        style={{
                          fontSize: config.font_size || "12px",
                          color: config.color || "#64748b",
                          textAlign: config.text_align || "center"
                        }}
                        dangerouslySetInnerHTML={{ __html: config.content || t(`© ${new Date().getFullYear()} ${store.name}. جميع الحقوق محفوظة.`, `© ${new Date().getFullYear()} ${store.name}. Tous droits réservés.`, `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`) }}
                      />
                      <p className="text-[9px] md:text-[10px] opacity-75">{t("بدعم من منصة Sovi للتجارة الإلكترونية", "Propulsé par la plateforme Sovi", "Powered by Sovi Platform")}</p>
                    </div>
                  </div>
                </footer>
              );

            case "text":
              return (
                <section 
                  key={section.id}
                  className="container mx-auto px-6 py-12 text-right bg-white shadow-xs border-b border-slate-100"
                  style={{
                    backgroundColor: config.background_color || undefined,
                    color: config.color || undefined
                  }}
                >
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      fontSize: config.font_size || "15px",
                      color: config.color || "#0f172a",
                      textAlign: config.text_align || "right"
                    }}
                    dangerouslySetInnerHTML={{ __html: config.content || '' }}
                  />
                </section>
              );

            case "image":
              return (
                <section key={section.id} className="container mx-auto px-6 py-8 border-b border-slate-100"
                  style={{
                    backgroundColor: config.background_color || '#ffffff',
                    color: config.color || undefined
                  }}
                >
                  {config.image_url ? (
                    <img
                      src={getFullImageUrl(config.image_url)}
                      alt={config.caption || ""}
                      className="w-full h-auto object-cover rounded-2xl shadow-md max-w-5xl mx-auto"
                    />
                  ) : null}
                  {config.caption && (
                    <p className="text-xs text-slate-500 text-center mt-3 font-medium">
                      {config.caption}
                    </p>
                  )}
                </section>
              );

            case "banner":
              return (
                <section
                  key={section.id}
                  className="w-full relative overflow-hidden bg-cover bg-center flex flex-col justify-center border-b border-slate-100 transition-all duration-300"
                  style={{
                    backgroundImage: config.image_url ? `url(${getFullImageUrl(config.image_url)})` : undefined,
                    backgroundColor: config.image_url ? undefined : (config.background_color || '#4f46e5'),
                    color: config.color || '#ffffff',
                    minHeight: config.height === 'small' ? '180px' : config.height === 'large' ? '400px' : '280px',
                    paddingTop: config.height === 'small' ? '2.5rem' : config.height === 'large' ? '6rem' : '4rem',
                    paddingBottom: config.height === 'small' ? '2.5rem' : config.height === 'large' ? '6rem' : '4rem'
                  }}
                >
                  {/* Dark overlay to make text highly readable when background image is used */}
                  {config.image_url && (
                    <div 
                      className="absolute inset-0 bg-black z-0"
                      style={{ opacity: config.image_opacity !== undefined ? (config.image_opacity / 100) : 0.4 }}
                    ></div>
                  )}

                  <div 
                    className="container mx-auto px-6 max-w-4xl relative z-10 space-y-4 md:space-y-6"
                    style={{
                      textAlign: (config.text_align || 'center') as any
                    }}
                  >
                    {config.title && (
                      <h2 
                        className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-md"
                        style={{ color: config.color || '#ffffff' }}
                      >
                        {config.title}
                      </h2>
                    )}
                    {config.subtitle && (
                      <p 
                        className="text-sm md:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mx-auto opacity-90 drop-shadow-sm"
                        style={{ color: config.color || '#ffffff' }}
                      >
                        {config.subtitle}
                      </p>
                    )}
                    {config.cta_text && (
                      <div className="pt-2">
                        {config.cta_link ? (
                          <Link href={getStorefrontLink(subdomain, config.cta_link)}>
                            <Button 
                              className="rounded-xl font-bold px-6 py-5 md:px-8 md:py-6 h-auto text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
                              style={{ 
                                backgroundColor: config.btn_color || '#ffffff', 
                                color: config.btn_text_color || '#4f46e5' 
                              }}
                            >
                              {config.cta_text}
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            className="rounded-xl font-bold px-6 py-5 md:px-8 md:py-6 h-auto text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
                            style={{ 
                              backgroundColor: config.btn_color || '#ffffff', 
                              color: config.btn_text_color || '#4f46e5' 
                            }}
                          >
                            {config.cta_text}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              );

            case "video": {
              let embedUrl = config.video_url || "";
              if (embedUrl.includes("youtube.com/watch")) {
                const vid = new URL(embedUrl).searchParams.get("v");
                if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
              } else if (embedUrl.includes("youtu.be/")) {
                const vid = embedUrl.split("youtu.be/")[1]?.split("?")[0];
                if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
              }
              if (!embedUrl) return null;
              return (
                <section key={section.id} className="py-6 md:py-10 container mx-auto px-4 max-w-4xl">
                  {config.title && <h2 className="text-xl font-bold text-center mb-4">{config.title}</h2>}
                  <div className="relative w-full max-w-2xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/50 shadow-xl" style={{ aspectRatio: config.aspect_ratio === "9/16" ? "9/16" : "16/9" }}>
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

            case "reviews": {
              const reviews = config.reviews || [];
              const titleColor = config.title_color || "#0f172a";
              const reviewerNameColor = config.reviewer_name_color || "#1e293b";
              const reviewTextColor = config.review_text_color || "#475569";
              const ratingStarsColor = config.rating_stars_color || "#fbbf24";
              const cardBgColor = config.card_bg_color || "#ffffff";
              const cardBorderColor = config.card_border_color || "#e2e8f0";

              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-center" style={{ color: titleColor }}>
                    {config.title || t("آراء زبائننا", "Avis de nos clients", "Customer Reviews")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reviews.map((r: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="rounded-2xl p-4 md:p-5 space-y-3 border transition-all flex flex-col justify-between shadow-sm bg-white"
                        style={{
                          backgroundColor: cardBgColor,
                          borderColor: cardBorderColor,
                        }}
                      >
                        <div className="space-y-3 text-start">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-sm md:text-base" style={{ color: reviewerNameColor }}>{r.name}</span>
                            <div className="flex gap-0.5" style={{ color: ratingStarsColor }}>
                              {[...Array(r.rating || 5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                            </div>
                          </div>
                          <p className="text-sm md:text-base leading-relaxed" style={{ color: reviewTextColor }}>{r.text}</p>
                        </div>
                        {r.date && <span className="text-[10px] text-slate-400 self-end mt-2">{r.date}</span>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case "faq": {
              const titleColor = config.title_color || "#0f172a";
              const questionColor = config.question_color || "#1e293b";
              const answerColor = config.answer_color || "#475569";
              const faqBgColor = config.faq_bg_color || "#ffffff";
              const faqBorderColor = config.faq_border_color || "#e2e8f0";
              const faqActiveBorderColor = config.faq_active_border_color || primaryColor;
              const iconColor = config.icon_color || "#94a3b8";

              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-center mb-6" style={{ color: titleColor }}>
                    {config.title || t("أسئلة شائعة", "Questions Fréquentes (FAQ)", "Frequently Asked Questions (FAQ)")}
                  </h2>
                  <div className="space-y-3">
                    {(config.items || []).map((item: any, idx: number) => (
                      <FAQItem 
                        key={idx} 
                        question={item.q} 
                        answer={item.a} 
                        questionColor={questionColor}
                        answerColor={answerColor}
                        bgColor={faqBgColor}
                        borderColor={faqBorderColor}
                        activeBorderColor={faqActiveBorderColor}
                        iconColor={iconColor}
                      />
                    ))}
                  </div>
                </section>
              );
            }

            case "benefits": {
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-6">
                  <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("المميزات", "Caractéristiques", "Benefits")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {(config.items || []).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 md:p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all text-start shadow-sm"
                      >
                        <span className="text-2xl md:text-3xl flex-shrink-0">{item.icon}</span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800">{item.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case "before_after": {
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
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

            case "countdown": {
              return (
                <section key={section.id} className="py-0">
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

            case "quantity_offers": {
              const offers = product?.quantity_offers || [];
              if (offers.length === 0) return null;

              const titleColor = config.title_color || "#0f172a";
              const textColor = config.text_color || "#475569";
              const priceColor = config.price_color || "#0f172a";
              const accentColor = config.accent_color || primaryColor;
              const offerBgColor = config.offer_bg_color || "#ffffff";
              const offerBorderColor = config.offer_border_color || "#e2e8f0";
              const saveBadgeTextColor = config.save_badge_text_color || "#16a34a";

              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4 text-start">
                  <h2 className="text-xl md:text-2xl font-bold text-center" style={{ color: titleColor }}>
                    {config.title || t("عروض الكمية", "Offres de quantité", "Quantity Offers")}
                  </h2>
                  {config.subtitle && <p className="text-sm text-center opacity-75" style={{ color: textColor }}>{config.subtitle}</p>}
                  <div className="space-y-3">
                    {offers.map((offer: any, idx: number) => {
                      const isHighlight = idx === (config.highlight_index ?? -1);
                      const unitPrice = parseFloat(offer.price) / offer.quantity;
                      const originalUnit = parseFloat(product.price);
                      const savings = Math.round(((originalUnit - unitPrice) / originalUnit) * 100);
                      
                      const borderCol = isHighlight ? accentColor : offerBorderColor;
                      const bgCol = isHighlight ? (config.active_bg_color || `${accentColor}10`) : offerBgColor;

                      return (
                        <div
                          key={offer.id || idx}
                          className="relative flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all shadow-sm cursor-pointer"
                          style={{
                            borderColor: borderCol,
                            backgroundColor: bgCol,
                            borderWidth: isHighlight ? '2px' : '1px'
                          }}
                          onClick={() => {
                            if (product) {
                              window.location.href = getStorefrontLink(subdomain, `/products/${product.slug}?qty=${offer.quantity}#checkout`);
                            }
                          }}
                        >
                          {isHighlight && config.highlight_badge && (
                            <span className="absolute -top-3 right-4 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: accentColor }}>
                              {config.highlight_badge}
                            </span>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black font-outfit" style={{ color: isHighlight ? accentColor : textColor }}>{offer.quantity}x</span>
                            <div>
                              <span className="font-bold text-sm" style={{ color: textColor }}>{offer.label || t(`${offer.quantity} قطع`, `${offer.quantity} pièces`, `${offer.quantity} pieces`)}</span>
                              {savings > 0 && (
                                <span 
                                  className="text-xs block mt-0.5 font-bold"
                                  style={{ color: saveBadgeTextColor }}
                                >
                                  {t("وفر", "Économisez", "Save")} {savings}%
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-lg font-outfit" style={{ color: isHighlight ? accentColor : priceColor }}>
                            {formatCurrency(parseFloat(offer.price))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "bundle_offers": {
              const bundles = product?.bundle_offers || [];
              if (bundles.length === 0) return null;
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4 text-start">
                  <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("عروض الباقات", "Offres de packs", "Bundle Offers")}</h2>
                  {config.subtitle && <p className="text-sm text-slate-500 text-center">{config.subtitle}</p>}
                  <div className="space-y-3">
                    {bundles.map((bundle: any, idx: number) => (
                      <div 
                        key={bundle.id || idx} 
                        className="p-4 md:p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all space-y-3 shadow-sm cursor-pointer"
                        onClick={() => {
                          if (product) {
                            window.location.href = getStorefrontLink(subdomain, `/products/${product.slug}?bundle=${bundle.id}#checkout`);
                          }
                        }}
                      >
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
                              <span key={iIdx} className="text-xs bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-500">
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

            case "delivery_info": {
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4 text-start">
                  <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("معلومات التوصيل", "Informations de livraison", "Delivery Info")}</h2>
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                    {(config.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                        <span className="text-sm text-slate-600">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case "comparison": {
              const columns = config.columns || [];
              const rows = config.rows || [];
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-3xl space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-center">{config.title || t("جدول المقارنة", "Tableau de comparaison", "Comparison Table")}</h2>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {columns.map((col: string, idx: number) => (
                            <th key={idx} className={`px-4 py-3 ${isArabic ? 'text-right' : 'text-left'} font-bold text-xs text-slate-700`}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="px-4 py-3 text-xs text-slate-600">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            }

            case "product_gallery": {
              const images = product?.images || [];
              if (images.length === 0) return null;
              return (
                <section key={section.id} className="py-8 md:py-12 container mx-auto px-4 max-w-4xl space-y-4">
                  {config.title && <h2 className="text-xl font-bold text-center">{config.title}</h2>}
                  <ProductGallery images={images} />
                </section>
              );
            }

            case "sticky_cta":
            case "floating_order_button":
              return null; // Rendered at root layout level

            default:
              return null;
          }
        })}
      </div>

      {/* Floating WhatsApp chat bubble */}
      {settings?.whatsapp_floating_button && settings?.whatsapp_number && (
        <a
          href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.927 9.927 0 0 0 4.808 1.237h.005c5.507 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.065A9.925 9.925 0 0 0 12.012 2zm5.781 14.185c-.244.689-1.21 1.26-1.654 1.32-.44.06-1.01.12-2.91-.67-2.43-.98-3.98-3.46-4.1-3.62-.12-.16-.97-1.29-.97-2.46 0-1.17.61-1.74.83-1.98.22-.24.49-.3.65-.3.16 0 .33 0 .46.01.14.01.33-.05.52.4.19.46.65 1.6.71 1.72.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.26.31-.37.42-.12.12-.25.26-.11.51.14.24.63 1.04 1.35 1.68.93.82 1.71 1.08 1.95 1.2.24.12.38.1.52-.06.14-.16.61-.71.77-.95.16-.24.33-.2.55-.12.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.59-.18 1.28z"/>
          </svg>
        </a>
      )}

      {/* ─── Sticky CTA Bar ─── */}
      {(() => {
        const hasStickyCta = homepageSections.some((s: any) => s.section_type === "sticky_cta" && s.is_enabled !== false);
        if (!hasStickyCta) return null;
        const ctaSection = homepageSections.find((s: any) => s.section_type === "sticky_cta");
        const config = ctaSection?.config || {};
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-3 shadow-2xl backdrop-blur-md border-t border-slate-200/50 bg-white" style={{ backgroundColor: config.bg_color || primaryColor }}>
            <div className="container mx-auto max-w-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-white flex-1 min-w-0">
                {config.show_price && product && (
                  <span className="font-black text-lg font-outfit whitespace-nowrap">{formatCurrency(parseFloat(product.price))}</span>
                )}
                <span className="text-sm font-bold truncate">{config.text || t("أطلب الآن!", "Commandez maintenant !", "Order Now!")}</span>
              </div>
              <a href={product ? getStorefrontLink(subdomain, `/products/${product.slug}#checkout`) : "#"} className="flex-shrink-0">
                <button className="bg-white text-black font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg">
                  {t("أطلب الآن", "Commander maintenant", "Order Now")}
                </button>
              </a>
            </div>
          </div>
        );
      })()}

      {/* ─── Floating Order Button ─── */}
      {(() => {
        const hasStickyCta = homepageSections.some((s: any) => s.section_type === "sticky_cta" && s.is_enabled !== false);
        const hasFloatingBtn = homepageSections.some((s: any) => s.section_type === "floating_order_button" && s.is_enabled !== false);
        if (!hasFloatingBtn || hasStickyCta) return null;
        const btnSection = homepageSections.find((s: any) => s.section_type === "floating_order_button");
        const config = btnSection?.config || {};
        return (
          <a href={product ? getStorefrontLink(subdomain, `/products/${product.slug}#checkout`) : "#"} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
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
      {(() => {
        const hasStickyCta = homepageSections.some((s: any) => s.section_type === "sticky_cta" && s.is_enabled !== false);
        const hasFloatingBtn = homepageSections.some((s: any) => s.section_type === "floating_order_button" && s.is_enabled !== false);
        if (hasStickyCta || hasFloatingBtn) return <div className="h-20" />;
        return null;
      })()}
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  Sub-Components
 * ═══════════════════════════════════════════════ */

/** FAQ Accordion Item */
function FAQItem({ 
  question, 
  answer,
  questionColor,
  answerColor,
  bgColor,
  borderColor,
  activeBorderColor,
  iconColor
}: { 
  question: string; 
  answer: string;
  questionColor?: string;
  answerColor?: string;
  bgColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  iconColor?: string;
}) {
  const [open, setOpen] = useState(false);
  
  const bgVal = bgColor || "#ffffff";
  const borderVal = open ? (activeBorderColor || "#e2e8f0") : (borderColor || "#e2e8f0");

  return (
    <div 
      className="rounded-xl overflow-hidden transition-all border shadow-sm bg-white"
      style={{
        backgroundColor: bgVal,
        borderColor: borderVal,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <button 
        type="button"
        onClick={() => setOpen(!open)} 
        className="w-full flex items-center justify-between p-4 text-start"
      >
        <span className="font-bold text-sm flex-1 text-slate-800" style={{ color: questionColor }}>{question}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-300 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`} 
          style={{ color: iconColor }}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div 
          className="px-4 pb-4 text-xs leading-relaxed border-t pt-3 text-slate-500"
          style={{ 
            color: answerColor,
            borderColor: borderColor || "#f1f5f9"
          }}
        >
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
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-400 text-xs">{tEmpty("أضف صور المقارنة من المنشئ", "Ajouter des images de comparaison", "Add comparison images")}</p>
      </div>
    );
  }

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = rect.right - clientX;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-col-resize select-none bg-white"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <img src={getFullImageUrl(afterImage)} alt={afterLabel} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={getFullImageUrl(beforeImage)} alt={beforeLabel} className="w-full h-full object-cover" style={{ width: `${containerRef.current?.offsetWidth || 500}px` }} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ right: `${sliderPos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 right-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <span className="text-white text-xs font-bold">⇔</span>
        </div>
      </div>
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
      <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        <img
          src={getFullImageUrl(images[activeIdx]?.image_url)}
          alt={images[activeIdx]?.alt_text || ""}
          className="w-full h-full object-cover transition-all duration-500"
        />
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img: any, idx: number) => (
          <button
            key={img.id || idx}
            onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              idx === activeIdx ? "border-primary ring-2 ring-primary/30" : "border-slate-200 hover:border-slate-350"
            }`}
          >
            <img src={getFullImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
