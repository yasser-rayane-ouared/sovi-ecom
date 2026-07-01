"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Phone, Truck, ShieldCheck, Star } from "lucide-react";
import { formatCurrency, getStorefrontLink, getFullImageUrl } from "@/lib/utils";

export default function StorefrontCategoryPage() {
  const params = useParams();
  const subdomain = params.store as string;
  const slug = params.slug as string;

  const [store, setStore] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isArabic = store?.language !== "fr" && store?.language !== "en";
  const t = (ar: string, fr: string, en: string) => {
    if (store?.language === "en") return en;
    if (store?.language === "fr") return fr;
    return ar;
  };

  useEffect(() => {
    if (subdomain && slug) {
      setLoading(true);
      // Fetch public store details
      api.get(`/storefront/${subdomain}/`)
        .then((res) => {
          setStore(res.data);
          // Apply custom primary color
          if (res.data?.settings?.primary_color) {
            document.documentElement.style.setProperty('--primary', res.data.settings.primary_color);
          }
          // Fetch category and its specific products
          return api.get(`/storefront/${subdomain}/categories/${slug}/`);
        })
        .then((res) => {
          setCategory(res.data.category);
          setProducts(res.data.products || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [subdomain, slug]);

  useEffect(() => {
    if (category && store) {
      document.title = `${category.name} — ${store.name}`;
    }
  }, [category, store]);

  if (loading || !store || !category) {
    const defaultIsArabic = store?.language !== "fr" && store?.language !== "en";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-cairo" dir={defaultIsArabic ? "rtl" : "ltr"}>
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm">
            {store?.language === "en" ? "Loading category..." : store?.language === "fr" ? "Chargement de la catégorie..." : "جاري تحميل الفئة..."}
          </p>
        </div>
      </div>
    );
  }

  const settings = store.settings;

  // Load sections from category layout settings
  let layoutSections: any[] = category.layout_sections || [];

  // Fallback to default sections if empty
  if (!layoutSections || layoutSections.length === 0) {
    layoutSections = [
      { id: "default-announcement", section_type: "announcement", config: {}, order: 0 },
      { id: "default-header", section_type: "header", config: {}, order: 1 },
      { id: "default-hero", section_type: "hero", config: {}, order: 2 },
      { id: "default-products", section_type: "featured_products", config: {}, order: 3 },
      { id: "default-badges", section_type: "trust_badges", config: {}, order: 4 },
      { id: "default-footer", section_type: "footer", config: {}, order: 5 }
    ];
  }

  // Sort sections by order
  layoutSections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-cairo flex flex-col justify-between" dir={isArabic ? "rtl" : "ltr"}>
      <div className="flex-grow">
        {layoutSections.map((section: any) => {
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
                      {config.title || category.name}
                    </h1>
                    <p 
                      className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium"
                      style={{
                        color: config.color ? `${config.color}CC` : "#475569",
                        fontSize: config.font_size || "16px",
                        textAlign: config.text_align || "center"
                      }}
                    >
                      {config.description || category.description || t(
                        "تصفح أفضل المنتجات جودة مع خدمة التوصيل السريع والدفع عند الاستلام.",
                        "Achetez les meilleurs produits avec livraison rapide et paiement à la livraison.",
                        "Browse the best quality products with fast delivery and cash on delivery."
                      )}
                    </p>
                  </div>
                </section>
              );

            case "featured_products":
              return (
                <section key={section.id} className="bg-white container mx-auto px-4 md:px-6 py-10 md:py-20 flex-grow shadow-xs border-b border-slate-100">
                  <div className={`mb-8 md:mb-12 text-center ${isArabic ? 'md:text-right' : 'md:text-left'}`}>
                    <h2 className={`text-xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2 justify-center ${isArabic ? 'md:justify-start' : 'md:justify-start flex-row'}`}>
                      <Star className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary animate-pulse" />
                      <span>{config.title || t(`منتجات ${category.name}`, `Produits ${category.name}`, `Products of ${category.name}`)}</span>
                    </h2>
                    <div className={`h-1 w-20 md:h-1.5 md:w-24 bg-gradient-to-r from-primary to-indigo-600 rounded-full mt-2.5 md:mt-3.5 mx-auto ${isArabic ? 'md:mx-0' : 'md:mr-auto'}`}></div>
                  </div>

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
                                <span className={`absolute top-2 ${isArabic ? 'right-2' : 'left-2'} md:top-3 md:${isArabic ? 'right-3' : 'left-3'} bg-red-500 text-white font-bold text-[9px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md`}>
                                  -{product.discount_percentage}%
                                </span>
                              )}
                            </div>
                          </Link>

                          <CardContent className="p-3 md:p-5 space-y-3 md:space-y-4 flex-grow flex flex-col justify-between bg-white">
                            <div className="space-y-1">
                              <Link href={getStorefrontLink(subdomain, `/products/${product.slug}`)}>
                                <h3 className={`font-bold text-slate-800 text-xs md:text-md hover:text-primary transition-colors line-clamp-2 leading-snug ${isArabic ? 'text-right' : 'text-left'}`}>{product.title}</h3>
                              </Link>
                              <p className={`text-slate-400 text-[9px] md:text-[11px] font-mono ${isArabic ? 'text-right' : 'text-left'}`}>{product.sku}</p>
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
                                  <span>{t("طلب المنتج", "Acheter maintenant", "Order Product")}</span>
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-3">
                      <p className="text-slate-400 text-sm">{t("لا توجد منتجات متوفرة في هذه الفئة حالياً.", "Aucun produit disponible dans cette catégorie pour le moment.", "No products available in this category at the moment.")}</p>
                    </div>
                  )}
                </section>
              );

            case "trust_badges":
              return (
                <section 
                  key={section.id} 
                  className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-t border-b border-slate-200/50 py-10 md:py-16"
                  style={{
                    backgroundColor: config.background_color || undefined,
                    color: config.color || undefined
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 text-center">
                    <div className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <Truck className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm md:text-md">
                        {config.badge_1_title || settings?.badge_1_title || t("توصيل سريع", "Livraison Rapide", "Fast Delivery")}
                      </h4>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">
                        {config.badge_1_desc || settings?.badge_1_desc || t("التوصيل لجميع الولايات بأسعار مدروسة.", "Livraison à domicile dans les 58 wilayas.", "Home delivery to all provinces at reasonable prices.")}
                      </p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm md:text-md">
                        {config.badge_2_title || settings?.badge_2_title || t("الدفع عند الاستلام", "Paiement à la Livraison", "Cash on Delivery")}
                      </h4>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">
                        {config.badge_2_desc || settings?.badge_2_desc || t("لا تدفع أي شيء حتى تستلم منتجك بين يديك.", "Payez seulement après réception de votre colis.", "Pay only upon receiving your package.")}
                      </p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-5 md:p-6 rounded-2xl bg-white border border-slate-250/20 shadow-xs hover:shadow-md transition-all duration-300">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 md:mb-2 shadow-inner">
                        <Phone className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm md:text-md">
                        {config.badge_3_title || settings?.badge_3_title || t("دعم العملاء", "Support Client", "Customer Support")}
                      </h4>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">
                        {config.badge_3_desc || settings?.badge_3_desc || t("فريق عملنا متواجد للرد على اتصالاتكم وتأكيد الطلبيات.", "Nous confirmons chaque commande par téléphone.", "Our team is available to confirm each order by phone.")}
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
                    <div className="border-t border-white/5 pt-6 md:pt-8 text-slate-500 text-[10px] md:text-xs space-y-2">
                      <p
                        style={{
                          fontSize: config.font_size || "12px",
                          color: config.color || "#64748b",
                          textAlign: config.text_align || "center"
                        }}
                        dangerouslySetInnerHTML={{ __html: config.content || t(`© ${new Date().getFullYear()} ${store.name}. جميع الحقوق محفوظة.`, `© ${new Date().getFullYear()} ${store.name}. Tous droits réservés.`, `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`) }}
                      />
                    </div>
                  </div>
                </footer>
              );

            case "text":
              return (
                <section 
                  key={section.id}
                  style={{ 
                    backgroundColor: config.background_color || "#ffffff",
                    color: config.color || "#0f172a"
                  }}
                  className="py-12 border-b border-slate-100"
                >
                  <div 
                    className={`container mx-auto px-4 md:px-6 max-w-3xl ${isArabic ? 'text-right' : 'text-left'} leading-relaxed`}
                    style={{ 
                      fontSize: config.font_size || "15px",
                      color: config.color || undefined,
                      textAlign: (config.text_align || (isArabic ? "right" : "left")) as any
                    }}
                    dangerouslySetInnerHTML={{ __html: config.content || "" }}
                  />
                </section>
              );

            case "image":
              return (
                <section key={section.id} className="py-12 bg-white border-b border-slate-100 text-center">
                  <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-3">
                    {config.image_url ? (
                      <img src={getFullImageUrl(config.image_url)} alt={config.caption || "Category Banner"} className="mx-auto rounded-2xl shadow-md max-w-full h-auto object-cover" />
                    ) : (
                      <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs bg-slate-50">
                        {t("لا توجد صورة محددة في هذا القسم.", "Aucune image spécifiée dans cette section.", "No image specified in this section.")}
                      </div>
                    )}
                    {config.caption && (
                      <p className="text-xs text-slate-500 font-medium italic">{config.caption}</p>
                    )}
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
