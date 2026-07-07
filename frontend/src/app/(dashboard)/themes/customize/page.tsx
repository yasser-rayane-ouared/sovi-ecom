"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { useDashboardStore } from "../../../../stores/dashboard";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Layers, Plus, Trash2, Edit2, Sparkles, AlertCircle, CheckCircle2,
  Palette, GripVertical, Image as ImageIcon, Truck,
  ShieldCheck, Phone, Layout, Star, ExternalLink,
  SidebarClose, SidebarOpen, Video, HelpCircle, Clock,
  Percent, Table, Play
} from "lucide-react";
import { useLanguageStore } from "../../../../stores/language";
import { getFullImageUrl } from "../../../../lib/utils";

export default function HomepageCustomizer() {
  const router = useRouter();
  const { selectedStore } = useDashboardStore() as any;
  const currentStoreId = selectedStore?.id;
  const { t, isRtl } = useLanguageStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sections, setSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [imageUploading, setImageUploading] = useState<string | null>(null);

  // Default storefront settings fallbacks
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [hideSidebar, setHideSidebar] = useState(false);

  const isPredefinedLink = (link: string) => {
    if (!link) return true;
    if (link === "/" || link === "/checkout") return true;
    if (link.startsWith("/products/") && products.some((p: any) => `/products/${p.slug}` === link)) return true;
    if (link.startsWith("/categories/") && categories.some((c: any) => `/categories/${c.slug}` === link)) return true;
    return false;
  };

  const sectionTypeMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    announcement: { label: `${t('announcementSection') || 'Announcement'} (Announcement)`, icon: <Truck className="h-4 w-4 text-primary" /> },
    header: { label: `${t('headerSection') || 'Header'} (Header)`, icon: <Layout className="h-4 w-4 text-primary" /> },
    hero: { label: `${t('heroSection') || 'Hero Banner'} (Hero)`, icon: <Sparkles className="h-4 w-4 text-primary" /> },
    featured_products: { label: `${t('featuredProductsSection') || 'Products Grid'} (Products Grid)`, icon: <Star className="h-4 w-4 text-primary" /> },
    trust_badges: { label: `${t('trustBadgesSection') || 'Trust Badges'} (Trust Badges)`, icon: <ShieldCheck className="h-4 w-4 text-primary" /> },
    footer: { label: `${t('footerSection') || 'Footer'} (Footer)`, icon: <Layers className="h-4 w-4 text-primary" /> },
    text: { label: `${t('customTextSection') || 'Custom Text'} (Custom Text)`, icon: <Edit2 className="h-4 w-4 text-primary" /> },
    image: { label: `${t('customImageSection') || 'Custom Image'} (Custom Image)`, icon: <ImageIcon className="h-4 w-4 text-primary" /> },
    banner: { label: `${t('bannerSection') || 'Promo Banner'} (Promo Banner)`, icon: <Sparkles className="h-4 w-4 text-primary" /> },
    categories: { label: `${t('categoriesSection') || 'Product Categories'} (Categories)`, icon: <Layers className="h-4 w-4 text-primary" /> },
    video: { label: `${isRtl ? 'فيديو ترويجي' : 'Video Player'} (Video)`, icon: <Video className="h-4 w-4 text-primary" /> },
    reviews: { label: `${t('builderEditorReviews') || 'Customer Reviews'} (Reviews)`, icon: <Star className="h-4 w-4 text-primary" /> },
    faq: { label: `${t('builderEditorFaqItems') || 'FAQ Accordion'} (FAQ)`, icon: <HelpCircle className="h-4 w-4 text-primary" /> },
    benefits: { label: `${t('builderEditorBenefits') || 'Key Features'} (Benefits)`, icon: <ShieldCheck className="h-4 w-4 text-primary" /> },
    before_after: { label: `${isRtl ? 'قبل وبعد' : 'Before & After'} (Comparison)`, icon: <ImageIcon className="h-4 w-4 text-primary" /> },
    countdown: { label: `${isRtl ? 'عداد تنازلي' : 'Countdown Timer'} (Countdown)`, icon: <Clock className="h-4 w-4 text-primary" /> },
    quantity_offers: { label: `${isRtl ? 'عروض الكمية' : 'Quantity Discounts'} (Offers)`, icon: <Percent className="h-4 w-4 text-primary" /> },
    bundle_offers: { label: `${isRtl ? 'عروض الباقات' : 'Bundle Offers'} (Bundles)`, icon: <Layers className="h-4 w-4 text-primary" /> },
    delivery_info: { label: `${t('builderEditorDeliveryItems') || 'Delivery Info'} (Delivery)`, icon: <Truck className="h-4 w-4 text-primary" /> },
    comparison: { label: `${t('builderEditorComparisonCols') || 'Comparison Table'} (Comparison)`, icon: <Table className="h-4 w-4 text-primary" /> },
    product_gallery: { label: `${isRtl ? 'معرض الصور' : 'Interactive Gallery'} (Gallery)`, icon: <ImageIcon className="h-4 w-4 text-primary" /> },
    sticky_cta: { label: `${isRtl ? 'شريط الشراء العائم' : 'Sticky Order Bar'} (Sticky CTA)`, icon: <Plus className="h-4 w-4 text-primary" /> },
    floating_order_button: { label: `${isRtl ? 'زر الشراء العائم' : 'Floating Order Button'} (Floating Button)`, icon: <Plus className="h-4 w-4 text-primary" /> },
  };

  useEffect(() => {
    if (currentStoreId) {
      setLoading(true);
      setError("");
      api.get(`/stores/${currentStoreId}/settings/`)
        .then((res) => {
          setStoreSettings(res.data);
          let loadedSections: any[] = [];
          try {
            if (res.data?.homepage_sections) {
              const parsed = JSON.parse(res.data.homepage_sections);
              loadedSections = (Array.isArray(parsed) ? parsed : []).filter(s => s && s.section_type);
            }
          } catch (e) {
            console.error("Failed to parse homepage sections JSON", e);
          }

          if (!loadedSections || loadedSections.length === 0) {
            // Seed defaults based on active settings
            loadedSections = [
              {
                id: "default-announcement",
                section_type: "announcement",
                config: {
                  content: res.data?.announcement_text || t('announcementDefaultText'),
                  background_color: res.data?.announcement_bg_color || "#4f46e5",
                  color: "#ffffff",
                  font_size: "12px",
                  text_align: "center"
                },
                order: 0
              },
              {
                id: "default-header",
                section_type: "header",
                config: {
                  content: selectedStore?.name || t('headerDefaultText'),
                  background_color: "#ffffff",
                  color: "#111111",
                  font_size: "18px",
                  text_align: "right"
                },
                order: 1
              },
              {
                id: "default-hero",
                section_type: "hero",
                config: {
                  title: selectedStore?.description || `${t('welcomeToStore')} ${selectedStore?.name || t('headerDefaultText')}`,
                  description: t('heroDefaultDesc'),
                  background_color: "#f8fafc",
                  color: "#0f172a",
                  font_size: "16px",
                  text_align: "center"
                },
                order: 2
              },
              {
                id: "default-products",
                section_type: "featured_products",
                config: {
                  title: t('featuredProductsSection')
                },
                order: 3
              },
              {
                id: "default-badges",
                section_type: "trust_badges",
                config: {
                  badge_1_title: res.data?.badge_1_title || t('trustBadge1Title'),
                  badge_1_desc: res.data?.badge_1_desc || t('trustBadge1Desc'),
                  badge_2_title: res.data?.badge_2_title || t('trustBadge2Title'),
                  badge_2_desc: res.data?.badge_2_desc || t('trustBadge2Desc'),
                  badge_3_title: res.data?.badge_3_title || t('trustBadge3Title'),
                  badge_3_desc: res.data?.badge_3_desc || t('trustBadge3Desc'),
                  background_color: "#ffffff",
                  color: "#0f172a"
                },
                order: 4
              },
              {
                id: "default-footer",
                section_type: "footer",
                config: {
                  content: `© ${new Date().getFullYear()} ${selectedStore?.name || t('headerDefaultText')}. ${t('copyrightDefault')}`,
                  background_color: "#090d16",
                  color: "#ffffff",
                  font_size: "14px",
                  text_align: "center"
                },
                order: 5
              }
            ];
          }
          loadedSections.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSections(loadedSections);
          return api.get(`/products/${currentStoreId}/categories/`);
        })
        .then((catRes) => {
          setCategories(catRes.data || []);
          return api.get(`/products/${currentStoreId}/`);
        })
        .then((prodRes) => {
          setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.results || []));
        })
        .catch(() => {
          setError(t('loadError'));
        })
        .finally(() => setLoading(false));
    }
  }, [currentStoreId, selectedStore]);

  const handleSave = async () => {
    if (!currentStoreId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const sanitized = sections.filter(s => s && s.section_type);
      await api.patch(`/stores/${currentStoreId}/settings/`, {
        homepage_sections: JSON.stringify(sanitized)
      });
      setSuccess(t('saveSuccess'));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleLayoutSection = (sectionType: string, sectionId?: string) => {
    setSections(prev => {
      const activeList = prev.filter(s => s && s.section_type);
      const existing = activeList.find(s => s.section_type === sectionType || (sectionId && s.id === sectionId));
      if (existing) {
        return activeList.filter(s => s.id !== existing.id);
      } else {
        const config: any = {};
        let order = activeList.length;
        if (sectionType === 'announcement') {
          config.content = storeSettings?.announcement_text || t('announcementDefaultText');
          config.background_color = storeSettings?.announcement_bg_color || "#4f46e5";
          config.color = "#ffffff";
          config.font_size = "12px";
          config.text_align = "center";
          order = 0;
        } else if (sectionType === 'header') {
          config.content = selectedStore?.name || t('headerDefaultText');
          config.background_color = "#ffffff";
          config.color = "#111111";
          config.font_size = "18px";
          config.text_align = "right";
          order = 1;
        } else if (sectionType === 'hero') {
          config.title = selectedStore?.description || `${t('welcomeToStore')} ${selectedStore?.name || t('headerDefaultText')}`;
          config.description = t('heroDefaultDesc');
          config.background_color = "#f8fafc";
          config.color = "#0f172a";
          config.font_size = "16px";
          config.text_align = "center";
          order = 2;
        } else if (sectionType === 'featured_products') {
          config.title = t('featuredProductsSection');
          order = 3;
        } else if (sectionType === 'trust_badges') {
          config.badge_1_title = storeSettings?.badge_1_title || t('trustBadge1Title');
          config.badge_1_desc = storeSettings?.badge_1_desc || t('trustBadge1Desc');
          config.badge_2_title = storeSettings?.badge_2_title || t('trustBadge2Title');
          config.badge_2_desc = storeSettings?.badge_2_desc || t('trustBadge2Desc');
          config.badge_3_title = storeSettings?.badge_3_title || t('trustBadge3Title');
          config.badge_3_desc = storeSettings?.badge_3_desc || t('trustBadge3Desc');
          config.background_color = "#ffffff";
          config.color = "#0f172a";
          order = 4;
        } else if (sectionType === 'footer') {
          config.content = `© ${new Date().getFullYear()} ${selectedStore?.name || t('headerDefaultText')}. ${t('copyrightDefault')}`;
          config.background_color = "#090d16";
          config.color = "#ffffff";
          config.font_size = "14px";
          config.text_align = "center";
          order = 5;
        } else if (sectionType === 'categories') {
          config.title = t('categoriesSectionTitle') || 'Browse by Categories';
          config.background_color = "#ffffff";
          config.color = "#0f172a";
          config.layout = "slider";
          config.image_style = "circle";
          order = 3.5;
        }

        return [...activeList, {
          id: `section-${sectionType}-${Date.now()}`,
          section_type: sectionType,
          config,
          order
        }].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    });
  };

  const handleAddSection = (sectionType: string) => {
    const config: any = {};
    if (sectionType === "text") {
      config.content = t('customTextDefault');
      config.font_size = "15px";
      config.color = "#0f172a";
      config.background_color = "#ffffff";
      config.text_align = "right";
    } else if (sectionType === "image") {
      config.image_url = "";
      config.caption = "";
    } else if (sectionType === "banner") {
      config.title = t('bannerDefaultTitle');
      config.subtitle = t('bannerDefaultSubtitle');
      config.cta_text = t('bannerDefaultCta');
      config.cta_link = "";
      config.background_color = "#4f46e5";
      config.color = "#ffffff";
      config.btn_color = "#ffffff";
      config.btn_text_color = "#4f46e5";
      config.image_url = "";
      config.image_opacity = 40;
      config.text_align = "center";
      config.height = "medium";
    } else if (sectionType === "video") {
      config.title = "";
      config.video_url = "";
      config.autoplay = false;
      config.muted = true;
      config.aspect_ratio = "16/9";
    } else if (sectionType === "reviews") {
      config.title = isRtl ? "آراء زبائننا" : "Customer Reviews";
      config.reviews = [
        { name: isRtl ? "أحمد — وهران" : "Ahmed — Oran", text: isRtl ? "منتج ممتاز وتوصيل سريع جداً، أنصح به!" : "Excellent product and very fast delivery, highly recommended!", rating: 5, date: isRtl ? "منذ يوم" : "1 day ago" }
      ];
    } else if (sectionType === "faq") {
      config.title = isRtl ? "أسئلة شائعة" : "FAQ Accordion";
      config.items = [
        { q: isRtl ? "كم يستغرق التوصيل؟" : "How long does shipping take?", a: isRtl ? "يستغرق التوصيل عادة من يومين إلى 4 أيام عمل." : "Delivery usually takes 2 to 4 business days." }
      ];
    } else if (sectionType === "benefits") {
      config.title = isRtl ? "لماذا تختارنا؟" : "Why Choose Us?";
      config.items = [
        { icon: "✅", title: isRtl ? "جودة مضمونة" : "Guaranteed Quality", desc: isRtl ? "منتجاتنا أصلية وبأعلى جودة في السوق." : "Our products are authentic and of the highest quality." }
      ];
    } else if (sectionType === "before_after") {
      config.title = isRtl ? "قبل وبعد" : "Before & After";
      config.before_label = isRtl ? "قبل" : "Before";
      config.after_label = isRtl ? "بعد" : "After";
      config.before_image = "";
      config.after_image = "";
    } else if (sectionType === "countdown") {
      config.title = isRtl ? "العرض ينتهي خلال:" : "Offer expires in:";
      config.hours = 2;
      config.minutes = 0;
      config.seconds = 0;
      config.bg_color = "#dc2626";
      config.text_color = "#ffffff";
      config.urgency_text = isRtl ? "الكمية محدودة جداً!" : "Very limited quantity!";
    } else if (sectionType === "quantity_offers") {
      config.title = isRtl ? "عروض الكمية" : "Quantity Discounts";
      config.subtitle = isRtl ? "اطلب أكثر ووفر أكثر" : "Order more, save more";
      config.highlight_index = 0;
      config.highlight_badge = isRtl ? "الأكثر طلباً" : "Best Seller";
    } else if (sectionType === "bundle_offers") {
      config.title = isRtl ? "عروض الباقات" : "Bundle Offers";
      config.subtitle = "";
      config.highlight_text = isRtl ? "الأكثر طلباً" : "Most Popular";
    } else if (sectionType === "delivery_info") {
      config.title = isRtl ? "معلومات التوصيل والضمان" : "Shipping & Delivery Info";
      config.items = [
        { icon: "🚚", text: isRtl ? "التوصيل متوفر لجميع الولايات الجزائرية" : "Shipping is available to all Algerian provinces" }
      ];
    } else if (sectionType === "comparison") {
      config.title = isRtl ? "جدول المقارنة" : "Comparison Table";
      config.columns = isRtl ? ["المميزات", "منتجنا", "المنافس"] : ["Features", "Our Product", "Competitors"];
      config.rows = [
        [isRtl ? "جودة الصنع" : "Build Quality", isRtl ? "ممتازة ✅" : "Premium ✅", isRtl ? "عادية ❌" : "Normal ❌"]
      ];
    } else if (sectionType === "product_gallery") {
      config.title = isRtl ? "صور المنتج" : "Product Gallery";
      config.show_zoom = true;
      config.layout = "swipe";
    } else if (sectionType === "sticky_cta") {
      config.text = isRtl ? "أطلب الآن!" : "Order Now!";
      config.bg_color = "#6366f1";
      config.show_price = true;
      config.scroll_to = "#checkout";
    } else if (sectionType === "floating_order_button") {
      config.text = isRtl ? "🛒 أطلب الآن!" : "🛒 Order Now!";
      config.scroll_to = "#checkout";
    }

    const tempId = `custom-${sectionType}-${Date.now()}`;
    setSections(prev => [...prev, {
      id: tempId,
      section_type: sectionType,
      config,
      order: prev.length
    }]);
    setShowAddSection(false);
  };

  const handleUpdateSection = (id: string, updatedFields: Partial<any>) => {
    setSections(prev => prev.filter(s => s && s.section_type).map(s => s.id === id ? { ...s, ...updatedFields } : s));
    setEditingSection((prev: any) => prev && prev.id === id ? { ...prev, ...updatedFields } : prev);
  };

  const handleDropSection = (draggedIdx: number, targetIdx: number) => {
    const list = sections.filter(s => s && s.section_type);
    const item = list[draggedIdx];
    if (!item) return;
    list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, item);

    const updated = list.map((sec, idx) => ({ ...sec, order: idx }));
    setSections(updated);
    setDragIndex(null);
  };

  const handleImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>, fieldName: string = "image_url") => {
    const file = e.target.files?.[0];
    if (!file || !currentStoreId) return;

    setImageUploading(sectionId);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      const targetSection = sections.find(s => s.id === sectionId);
      const currentConfig = targetSection?.config || {};
      handleUpdateSection(sectionId, { config: { ...currentConfig, [fieldName]: res.data.image_url } });
      setSuccess(t('uploadSuccess'));
    } catch (err) {
      setError(t('uploadError'));
    } finally {
      setImageUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-foreground font-cairo">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span>{t('loadingCustomizer')}</span>
      </div>
    );
  }

  const hasAnnouncement = sections.some(s => s.section_type === 'announcement');
  const hasHeader = sections.some(s => s.section_type === 'header');
  const hasHero = sections.some(s => s.section_type === 'hero');
  const hasProducts = sections.some(s => s.section_type === 'featured_products');
  const hasBadges = sections.some(s => s.section_type === 'trust_badges');
  const hasFooter = sections.some(s => s.section_type === 'footer');
  const hasCategories = sections.some(s => s.section_type === 'categories');

  return (
    <div className={`space-y-6 ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'} text-foreground pb-12`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 justify-start">
            <Palette className="h-6 w-6 text-primary animate-pulse" />
            {t('homepageCustomizerTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('homepageCustomizerDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setHideSidebar(!hideSidebar)} 
            variant="outline" 
            className="text-xs flex items-center gap-1.5 h-9 border-border"
          >
            {hideSidebar ? <SidebarOpen className="h-4 w-4 text-primary" /> : <SidebarClose className="h-4 w-4 text-primary" />}
            <span>{hideSidebar ? (isRtl ? "عرض قائمة الأقسام" : "Show Sections List") : (isRtl ? "إخفاء قائمة الأقسام" : "Hide Sections List")}</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="glow" className="text-xs">
            {saving ? t('saving') : t('saveChanges')}
          </Button>
          <Button onClick={() => router.push("/themes")} variant="outline" className="text-xs">
            {t('cancel')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Workspace Builder (70%) */}
        <div className="w-full xl:w-[70%] space-y-6 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column Checklist Sidebar */}
            {!hideSidebar && (
              <div className="md:col-span-4 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-2 space-y-5 shadow-md">
                <div>
                  <h4 className="text-sm font-bold mb-1 text-primary flex items-center gap-2 justify-start">
                    <Layers className="h-4 w-4 text-primary" /> {t('homepageSections')}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed text-start">
                    {t('homepageSectionsDesc')}
                  </p>
                </div>

                {/* Draggable Checklist */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-start">{t('activeSections')}</p>
                  {sections.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center border border-dashed border-border rounded-xl">{t('noActiveSections')}</p>
                  ) : (
                    <div className="space-y-2">
                      {sections.filter(s => s && s.section_type).map((section, idx) => {
                        const meta = sectionTypeMeta[section.section_type] || sectionTypeMeta.text;
                        const isStandard = ["announcement", "header", "hero", "featured_products", "trust_badges", "footer"].includes(section.section_type);
                        
                        return (
                          <div
                            key={section.id}
                            draggable
                            onDragStart={() => setDragIndex(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDropSection(dragIndex!, idx)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${
                              dragIndex === idx 
                                ? 'bg-primary/10 border-primary/40 opacity-50' 
                                : 'bg-muted/10 border-border hover:border-primary/20'
                            } cursor-grab`}
                          >
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                              <div className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => toggleLayoutSection(section.section_type, section.id)}
                                className="rounded border-border bg-input text-primary focus:ring-primary h-4 w-4 accent-primary flex-shrink-0 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0 text-start">
                                <span className="text-xs font-bold truncate flex items-center gap-1.5 justify-start">
                                  {meta.icon} {meta.label}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button 
                                type="button" 
                                onClick={() => {
                                  const element = document.getElementById(`section-card-${section.id}`);
                                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }} 
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                                title={t('editContent')}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {!isStandard && (
                                <button 
                                  type="button" 
                                  onClick={() => toggleLayoutSection(section.section_type, section.id)} 
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title={t('delete')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Inactive Standard Sections */}
                {(!hasAnnouncement || !hasHeader || !hasHero || !hasProducts || !hasBadges || !hasFooter || !hasCategories) && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-start">{t('availableSections')}</p>
                    <div className="space-y-1.5">
                      {!hasAnnouncement && (
                        <div
                          onClick={() => toggleLayoutSection('announcement')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> {t('announcementSection')}</span>
                        </div>
                      )}
                      {!hasHeader && (
                        <div
                          onClick={() => toggleLayoutSection('header')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Layout className="h-3.5 w-3.5" /> {t('headerSection')}</span>
                        </div>
                      )}
                      {!hasHero && (
                        <div
                          onClick={() => toggleLayoutSection('hero')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {t('heroSection')}</span>
                        </div>
                      )}
                      {!hasProducts && (
                        <div
                          onClick={() => toggleLayoutSection('featured_products')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> {t('featuredProductsSection')}</span>
                        </div>
                      )}
                      {!hasBadges && (
                        <div
                          onClick={() => toggleLayoutSection('trust_badges')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {t('trustBadgesSection')}</span>
                        </div>
                      )}
                      {!hasFooter && (
                        <div
                          onClick={() => toggleLayoutSection('footer')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {t('footerSection')}</span>
                        </div>
                      )}
                      {!hasCategories && (
                        <div
                          onClick={() => toggleLayoutSection('categories')}
                          className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-start"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border bg-input text-primary h-3.5 w-3.5 cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {t('categoriesSection') || 'Product Categories'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Custom Landing Page Builder Section */}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-start">{t('addCustomSection')}</p>
                  {showAddSection ? (
                    <div className="bg-muted/30 rounded-xl p-2 border border-border grid grid-cols-2 gap-1.5 shadow-md">
                      {Object.keys(sectionTypeMeta).filter(k => !["announcement", "header", "footer"].includes(k)).map((type) => {
                        const meta = sectionTypeMeta[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleAddSection(type)}
                            className={`flex items-center gap-1.5 p-1.5 rounded hover:bg-secondary border border-border text-[10px] text-foreground bg-transparent transition-colors truncate justify-start`}
                          >
                            {meta.icon}
                            <span className="truncate">{meta.label.split(" (")[0]}</span>
                          </button>
                        );
                      })}
                      <button type="button" onClick={() => setShowAddSection(false)} className="col-span-2 text-[10px] text-muted-foreground hover:text-foreground block w-full text-center mt-1">{t('cancel')}</button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setShowAddSection(true)}
                      variant="outline"
                      className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 h-auto"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t('addCustomSection')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Right Column Section Editing Cards */}
            <div className={hideSidebar ? "md:col-span-12 space-y-6" : "md:col-span-8 space-y-6"}>
              {sections.filter(s => s && s.section_type).map((section) => {
                const meta = sectionTypeMeta[section.section_type] || sectionTypeMeta.text;
                const config = section.config || {};
                const isEditing = editingSection?.id === section.id;
                const isStandard = ["announcement", "header", "hero", "featured_products", "trust_badges", "footer", "categories"].includes(section.section_type);

                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-start shadow-md">
                    <div className={`flex items-center justify-between border-b border-border pb-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        {meta.icon}
                        <h4 className="font-bold text-sm">{meta.label}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => setEditingSection(isEditing ? null : { ...section, config })} size="sm" variant="outline" className="text-xs">
                          {isEditing ? t('closeEdit') : t('editContent')}
                        </Button>
                        {!isStandard && (
                          <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">
                            {t('delete')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-4 pt-2">
                        {/* 1. Announcement Section Editor */}
                        {section.section_type === 'announcement' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('announcementText')}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, content: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    type="color"
                                    value={editingSection.config.background_color || "#4f46e5"}
                                    onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                    className="w-10 h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                  />
                                  <Input
                                    value={editingSection.config.background_color || "#4f46e5"}
                                    onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                    className="text-xs font-mono text-start"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    type="color"
                                    value={editingSection.config.color || "#ffffff"}
                                    onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                    className="w-10 h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                  />
                                  <Input
                                    value={editingSection.config.color || "#ffffff"}
                                    onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                    className="text-xs font-mono text-start"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Header Section Editor */}
                        {section.section_type === 'header' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('storeNameHeader')}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, content: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#111111"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Hero Section Editor */}
                        {section.section_type === 'hero' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('heroTitle')}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('heroDesc')}</label>
                              <textarea
                                value={editingSection.config.description || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, description: e.target.value } })}
                                className="flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#f8fafc"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Products Grid Section Editor */}
                        {section.section_type === 'featured_products' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('productsSectionTitle')}</label>
                              <Input
                                  value={editingSection.config.title || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                  className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 5. Trust Badges Section Editor */}
                        {section.section_type === 'trust_badges' && (
                          <div className="space-y-4">
                            <div className="p-3 bg-muted/10 border border-border rounded-xl space-y-2">
                              <p className="text-[10px] text-primary font-bold">{t('firstTrustBadge')}</p>
                              <Input
                                placeholder={t('trustBadgeTitlePlaceholder')}
                                value={editingSection.config.badge_1_title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_1_title: e.target.value } })}
                                className="text-xs text-start"
                              />
                              <Input
                                placeholder={t('trustBadgeDescPlaceholder')}
                                value={editingSection.config.badge_1_desc || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_1_desc: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="p-3 bg-muted/10 border border-border rounded-xl space-y-2">
                              <p className="text-[10px] text-primary font-bold">{t('secondTrustBadge')}</p>
                              <Input
                                placeholder={t('trustBadgeTitlePlaceholder')}
                                value={editingSection.config.badge_2_title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_2_title: e.target.value } })}
                                className="text-xs text-start"
                              />
                              <Input
                                placeholder={t('trustBadgeDescPlaceholder')}
                                value={editingSection.config.badge_2_desc || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_2_desc: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="p-3 bg-muted/10 border border-border rounded-xl space-y-2">
                              <p className="text-[10px] text-primary font-bold">{t('thirdTrustBadge')}</p>
                              <Input
                                placeholder={t('trustBadgeTitlePlaceholder')}
                                value={editingSection.config.badge_3_title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_3_title: e.target.value } })}
                                className="text-xs text-start"
                              />
                              <Input
                                placeholder={t('trustBadgeDescPlaceholder')}
                                value={editingSection.config.badge_3_desc || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, badge_3_desc: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. Footer Section Editor */}
                        {section.section_type === 'footer' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('copyrightText')}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, content: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#090d16"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Categories Section Editor */}
                        {section.section_type === 'categories' && (
                          <div className="space-y-4 pt-2 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('productsSectionTitle') || 'عنوان القسم'}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('categoriesSectionLayoutLabel') || 'مخطط العرض'}</label>
                                <select
                                  value={editingSection.config.layout || "slider"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, layout: e.target.value } })}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="slider">{t('layoutSlider') || 'شريط تمرير أفقي (Slider)'}</option>
                                  <option value="grid">{t('layoutGrid') || 'شبكة (Grid)'}</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('categoriesSectionStyleLabel') || 'نمط تصميم الصور'}</label>
                                <select
                                  value={editingSection.config.image_style || "circle"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, image_style: e.target.value } })}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="circle">{t('imageStyleCircle') || 'دائري (Instagram)'}</option>
                                  <option value="square">{t('imageStyleSquare') || 'مربع'}</option>
                                  <option value="card">{t('imageStyleCard') || 'بطاقة كاملة'}</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor') || 'لون الخلفية'}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor') || 'لون النص'}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7. Custom Text Section Editor */}
                        {section.section_type === 'text' && (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-secondary/40 border border-border rounded-xl">
                              <button onClick={(e) => { e.preventDefault(); document.execCommand('bold', false); }} className="p-1.5 rounded hover:bg-secondary text-xs min-w-[28px] font-bold">B</button>
                              <button onClick={(e) => { e.preventDefault(); document.execCommand('italic', false); }} className="p-1.5 rounded hover:bg-secondary text-xs min-w-[28px] italic">{t('italicFont') || 'I'}</button>
                              <span className="w-px h-5 bg-border mx-1" />
                              <select onChange={(e) => { e.preventDefault(); document.execCommand('fontName', false, e.target.value); }} className="bg-input border border-border rounded text-xs px-1 py-1 text-foreground">
                                <option value="" disabled>{t('fontFamily')}</option>
                                <option value="Arial">Arial</option>
                                <option value="Tahoma">Tahoma</option>
                                <option value="Cairo">Cairo</option>
                              </select>
                              <select onChange={(e) => { e.preventDefault(); document.execCommand('fontSize', false, e.target.value); }} className="bg-input border border-border rounded text-xs px-1 py-1 text-foreground">
                                <option value="" disabled>{t('fontSize')}</option>
                                <option value="1">{t('fontSizeVerySmall') || 'Very Small'}</option>
                                <option value="3">{t('fontSizeSmall') || 'Small'}</option>
                                <option value="5">{t('fontSizeMedium') || 'Medium'}</option>
                                <option value="7">{t('fontSizeLarge') || 'Large'}</option>
                              </select>
                              <span className="w-px h-5 bg-border mx-1" />
                              <label className="p-1.5 rounded hover:bg-secondary cursor-pointer text-xs min-w-[28px] text-center relative" title={t('textColor')}>
                                <span className="block w-4 h-4 rounded border border-border" style={{ backgroundColor: editingSection.config.color || '#0f172a' }} />
                                <input type="color" value={editingSection.config.color || '#0f172a'} onChange={(e) => { document.execCommand('foreColor', false, e.target.value); handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } }); }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                              </label>
                            </div>

                            <div
                              id={`text-editor-${section.id}`}
                              contentEditable
                              suppressContentEditableWarning
                              ref={(el) => { if (el && editingSection.config.content && !el.innerHTML) el.innerHTML = editingSection.config.content; }}
                              onKeyDown={(e) => e.stopPropagation()}
                              onBlur={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, content: (e.target as HTMLElement).innerHTML } })}
                              className="min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200 text-start"
                              style={{ backgroundColor: editingSection.config.background_color || 'transparent', color: editingSection.config.color || '#0f172a', textAlign: (editingSection.config.text_align || (isRtl ? 'right' : 'left')) as any }}
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textAlignment')}</label>
                                <select
                                  value={editingSection.config.text_align || (isRtl ? "right" : "left")}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, text_align: e.target.value } })}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="right">{t('alignRight') || 'Right'}</option>
                                  <option value="center">{t('alignCenter') || 'Center'}</option>
                                  <option value="left">{t('alignLeft') || 'Left'}</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 8. Custom Image Section Editor */}
                        {section.section_type === 'image' && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-xs text-muted-foreground">{t('sectionImage')}</label>
                              
                              {/* Image Preview or placeholder */}
                              {editingSection.config.image_url ? (
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group bg-muted/20">
                                  <img src={editingSection.config.image_url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSection(section.id, { config: { ...editingSection.config, image_url: "" } })}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                    title={t('removeImage') || 'Remove Image'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="border border-dashed border-border rounded-xl p-6 text-center bg-muted/5">
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <span className="text-xs text-muted-foreground block">{t('noImageSelected')}</span>
                                </div>
                              )}

                              {/* Upload buttons & Input */}
                              <div className="flex gap-2">
                                <label className="flex-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full text-xs gap-1.5 h-9"
                                    disabled={imageUploading === section.id}
                                    onClick={() => document.getElementById(`image-upload-input-${section.id}`)?.click()}
                                  >
                                    {imageUploading === section.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1" />
                                        <span>{t('imageUploadingText')}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4" />
                                        <span>{t('uploadFromDevice')}</span>
                                      </>
                                    )}
                                  </Button>
                                  <input
                                    id={`image-upload-input-${section.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(section.id, e)}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('imageCaption')}</label>
                              <Input
                                placeholder={t('imageCaptionPlaceholder')}
                                value={editingSection.config.caption || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, caption: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor')}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 9. Custom Banner Section Editor */}
                        {section.section_type === 'banner' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('bannerTitleLabel') || "عنوان البنر"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('bannerSubtitleLabel') || "العنوان الفرعي للبنر"}</label>
                              <Input
                                value={editingSection.config.subtitle || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, subtitle: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('bannerCtaTextLabel') || "نص زر الإجراء (CTA)"}</label>
                                <Input
                                  value={editingSection.config.cta_text || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, cta_text: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('bannerCtaLinkLabel') || "رابط زر الإجراء"}</label>
                                <select
                                  value={isPredefinedLink(editingSection.config.cta_link || "") ? (editingSection.config.cta_link || "") : "custom"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      handleUpdateSection(section.id, { config: { ...editingSection.config, cta_link: "/custom-url" } });
                                    } else {
                                      handleUpdateSection(section.id, { config: { ...editingSection.config, cta_link: val } });
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="">{isRtl ? "اختر الرابط..." : "Select Link..."}</option>
                                  <option value="/">{isRtl ? "الصفحة الرئيسية (/)" : "Home Page (/)"}</option>
                                  <option value="/checkout">{isRtl ? "صفحة الدفع (/checkout)" : "Checkout Page (/checkout)"}</option>
                                  
                                  {products && products.length > 0 && (
                                    <optgroup label={isRtl ? "المنتجات" : "Products"}>
                                      {products.map((p: any) => (
                                        <option key={p.id} value={`/products/${p.slug}`}>
                                          {p.title}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}

                                  {categories && categories.length > 0 && (
                                    <optgroup label={isRtl ? "الفئات" : "Categories"}>
                                      {categories.map((c: any) => (
                                        <option key={c.id} value={`/categories/${c.slug}`}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  
                                  <option value="custom">{isRtl ? "رابط مخصص..." : "Custom Link..."}</option>
                                </select>
                                
                                {!isPredefinedLink(editingSection.config.cta_link || "") && (
                                  <div className="mt-2 space-y-1">
                                    <Input
                                      placeholder="https://example.com"
                                      value={editingSection.config.cta_link || ""}
                                      onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, cta_link: e.target.value } })}
                                      className="text-xs text-start"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('bannerHeightLabel') || "ارتفاع البنر"}</label>
                                <select
                                  value={editingSection.config.height || "medium"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, height: e.target.value } })}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="small">{t('fontSizeSmall') || "صغير"}</option>
                                  <option value="medium">{t('fontSizeMedium') || "متوسط"}</option>
                                  <option value="large">{t('fontSizeLarge') || "كبير"}</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textAlignment') || "محاذاة النص"}</label>
                                <select
                                  value={editingSection.config.text_align || "center"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, text_align: e.target.value } })}
                                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all duration-200"
                                >
                                  <option value="right">{t('alignRight') || "يمين"}</option>
                                  <option value="center">{t('alignCenter') || "وسط"}</option>
                                  <option value="left">{t('alignLeft') || "يسار"}</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor') || "لون الخلفية"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#4f46e5"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('textColor') || "لون النص"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('btnColorLabel') || "لون خلفية الزر"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.btn_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, btn_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('btnTextColorLabel') || "لون نص الزر"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.btn_text_color || "#4f46e5"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, btn_text_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-muted-foreground">{t('sectionImage') || "صورة القسم"}</label>
                              {editingSection.config.image_url ? (
                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group bg-muted/20">
                                  <img src={getFullImageUrl(editingSection.config.image_url)} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSection(section.id, { config: { ...editingSection.config, image_url: "" } })}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                    title={t('removeImage') || "Remove Image"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="border border-dashed border-border rounded-xl p-6 text-center bg-muted/5">
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                  <span className="text-xs text-muted-foreground block">{t('noImageSelected') || "No Image"}</span>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <label className="flex-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full text-xs gap-1.5 h-9"
                                    disabled={imageUploading === section.id}
                                    onClick={() => document.getElementById(`image-upload-input-${section.id}`)?.click()}
                                  >
                                    {imageUploading === section.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary mr-1" />
                                        <span>{t('imageUploadingText') || "Uploading..."}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4" />
                                        <span>{t('uploadFromDevice') || "Upload Image"}</span>
                                      </>
                                    )}
                                  </Button>
                                  <input
                                    id={`image-upload-input-${section.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(section.id, e)}
                                  />
                                </label>
                              </div>

                              {editingSection.config.image_url && (
                                <div className="space-y-1 pt-2 animate-fade-in">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <label>{t('bannerOverlayOpacityLabel') || "درجة شفافية غطاء صورة الخلفية"}</label>
                                    <span className="font-bold font-mono">{editingSection.config.image_opacity !== undefined ? editingSection.config.image_opacity : 40}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={editingSection.config.image_opacity !== undefined ? editingSection.config.image_opacity : 40}
                                    onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, image_opacity: parseInt(e.target.value) } })}
                                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 11. Video Section Editor */}
                        {section.section_type === 'video' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorVideoUrl') || "رابط الفيديو"}</label>
                              <Input
                                placeholder="YouTube / TikTok / Direct Video URL"
                                value={editingSection.config.video_url || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, video_url: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 pt-2 text-start">
                                <input
                                  type="checkbox"
                                  id={`autoplay-${section.id}`}
                                  checked={!!editingSection.config.autoplay}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, autoplay: e.target.checked } })}
                                  className="rounded border-border"
                                />
                                <label htmlFor={`autoplay-${section.id}`} className="text-xs font-medium cursor-pointer">{t('builderEditorAutoplay') || "تشغيل تلقائي"}</label>
                              </div>
                              <div className="flex items-center gap-2 pt-2 text-start">
                                <input
                                  type="checkbox"
                                  id={`muted-${section.id}`}
                                  checked={!!editingSection.config.muted}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, muted: e.target.checked } })}
                                  className="rounded border-border"
                                />
                                <label htmlFor={`muted-${section.id}`} className="text-xs font-medium cursor-pointer">{t('builderEditorMuted') || "كتم الصوت"}</label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 12. Countdown Section Editor */}
                        {section.section_type === 'countdown' && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-start">
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t('builderEditorCountdownHours') || "ساعات"}</label>
                                <Input
                                  type="number"
                                  value={editingSection.config.hours ?? 2}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, hours: parseInt(e.target.value) || 0 } })}
                                  className="text-xs text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t('builderEditorCountdownMinutes') || "دقائق"}</label>
                                <Input
                                  type="number"
                                  value={editingSection.config.minutes ?? 0}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, minutes: parseInt(e.target.value) || 0 } })}
                                  className="text-xs text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t('builderEditorCountdownSeconds') || "ثواني"}</label>
                                <Input
                                  type="number"
                                  value={editingSection.config.seconds ?? 0}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, seconds: parseInt(e.target.value) || 0 } })}
                                  className="text-xs text-center"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorCountdownUrgency') || "نص الاستعجال"}</label>
                              <Input
                                value={editingSection.config.urgency_text || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, urgency_text: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorCountdownBg') || "لون خلفية التعداد"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.bg_color || "#dc2626"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, bg_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorCountdownText') || "لون نص التعداد"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.text_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, text_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 13. Quantity Offers & Bundle Offers Editor */}
                        {(section.section_type === 'quantity_offers' || section.section_type === 'bundle_offers' || section.section_type === 'product_gallery') && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            {editingSection.config.subtitle !== undefined && (
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorSubtitle') || "العنوان الفرعي"}</label>
                                <Input
                                  value={editingSection.config.subtitle || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, subtitle: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                            )}
                            {editingSection.config.highlight_badge !== undefined && (
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{isRtl ? "شارة التمييز" : "Highlight Badge"}</label>
                                <Input
                                  value={editingSection.config.highlight_badge || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, highlight_badge: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                            )}
                            {editingSection.config.highlight_text !== undefined && (
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{isRtl ? "نص التمييز" : "Highlight Text"}</label>
                                <Input
                                  value={editingSection.config.highlight_text || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, highlight_text: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                            )}
                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-start">
                              <p className="text-[10px] text-muted-foreground">
                                {section.section_type === 'quantity_offers' 
                                  ? (isRtl ? "تعتمد عروض الكميات المخصصة على إعدادات المنتج المرتبط وتظهر تلقائياً." : "Quantity discounts are dynamic and depend on the linked product settings.")
                                  : section.section_type === 'bundle_offers'
                                  ? (isRtl ? "تعتمد الباقات على إعدادات الباقات في المنتج المرتبط." : "Bundles depend on the linked product's configured bundles.")
                                  : (isRtl ? "يعرض معرض الصور صور المنتج المرتبط تلقائياً." : "Product gallery automatically displays the linked product images.")
                                }
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 14. Sticky CTA & Floating Order Button Editor */}
                        {(section.section_type === 'sticky_cta' || section.section_type === 'floating_order_button') && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{isRtl ? "نص الزر" : "Button Text"}</label>
                              <Input
                                value={editingSection.config.text || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, text: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            {editingSection.config.show_price !== undefined && (
                              <div className="flex items-center gap-2 pt-2 text-start">
                                <input
                                  type="checkbox"
                                  id={`show-price-${section.id}`}
                                  checked={!!editingSection.config.show_price}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, show_price: e.target.checked } })}
                                  className="rounded border-border"
                                />
                                <label htmlFor={`show-price-${section.id}`} className="text-xs font-medium cursor-pointer">{t('builderEditorShowPrice') || "عرض السعر"}</label>
                              </div>
                            )}
                            {editingSection.config.bg_color !== undefined && (
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('backgroundColor') || "لون الخلفية"}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.bg_color || "#6366f1"}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, bg_color: e.target.value } })}
                                  className="w-full h-8 p-0 border-0 cursor-pointer rounded bg-transparent"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 15. FAQ Items Editor */}
                        {section.section_type === 'faq' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorFaqItems') || "الأسئلة الشائعة"}</label>
                            <div className="space-y-2.5">
                              {(editingSection.config.items || []).map((item: any, idx: number) => {
                                const updateArrayItem = (field: string, val: any) => {
                                  const arr = [...(editingSection.config.items || [])];
                                  arr[idx] = { ...arr[idx], [field]: val };
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                const removeArrayItem = () => {
                                  const arr = (editingSection.config.items || []).filter((_: any, i: number) => i !== idx);
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                return (
                                  <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2 relative">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-muted-foreground">{isRtl ? `سؤال #${idx + 1}` : `Question #${idx + 1}`}</span>
                                      <button type="button" onClick={removeArrayItem} className="text-red-400 hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <Input
                                      value={item.q || ""}
                                      onChange={(e) => updateArrayItem("q", e.target.value)}
                                      placeholder={t('builderEditorFaqQPl') || "السؤال"}
                                      className="text-xs text-start"
                                    />
                                    <textarea
                                      value={item.a || ""}
                                      onChange={(e) => updateArrayItem("a", e.target.value)}
                                      placeholder={t('builderEditorFaqAPl') || "الإجابة"}
                                      className="w-full rounded-lg border border-border bg-input p-2 text-xs text-foreground resize-none h-16"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const arr = [...(editingSection.config.items || []), { q: "", a: "" }];
                                handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t('builderEditorAddFaqBtn') || "إضافة سؤال"}
                            </Button>
                          </div>
                        )}

                        {/* 16. Benefits Editor */}
                        {section.section_type === 'benefits' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorBenefits') || "المميزات"}</label>
                            <div className="space-y-2.5">
                              {(editingSection.config.items || []).map((item: any, idx: number) => {
                                const updateArrayItem = (field: string, val: any) => {
                                  const arr = [...(editingSection.config.items || [])];
                                  arr[idx] = { ...arr[idx], [field]: val };
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                const removeArrayItem = () => {
                                  const arr = (editingSection.config.items || []).filter((_: any, i: number) => i !== idx);
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                return (
                                  <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-muted-foreground">{isRtl ? `ميزة #${idx + 1}` : `Benefit #${idx + 1}`}</span>
                                      <button type="button" onClick={removeArrayItem} className="text-red-400 hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-[60px_1fr] gap-2">
                                      <Input
                                        value={item.icon || "✅"}
                                        onChange={(e) => updateArrayItem("icon", e.target.value)}
                                        placeholder="✅"
                                        className="text-xs text-center font-emoji"
                                      />
                                      <Input
                                        value={item.title || ""}
                                        onChange={(e) => updateArrayItem("title", e.target.value)}
                                        placeholder={t('builderEditorBenefitTitlePl') || "عنوان الميزة"}
                                        className="text-xs text-start"
                                      />
                                    </div>
                                    <Input
                                      value={item.desc || ""}
                                      onChange={(e) => updateArrayItem("desc", e.target.value)}
                                      placeholder={t('builderEditorBenefitDescPl') || "وصف الميزة"}
                                      className="text-xs text-start"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const arr = [...(editingSection.config.items || []), { icon: "✅", title: "", desc: "" }];
                                handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t('builderEditorAddBenefitBtn') || "إضافة ميزة"}
                            </Button>
                          </div>
                        )}

                        {/* 17. Delivery Info Editor */}
                        {section.section_type === 'delivery_info' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorDeliveryItems') || "معلومات التوصيل"}</label>
                            <div className="space-y-2">
                              {(editingSection.config.items || []).map((item: any, idx: number) => {
                                const updateArrayItem = (field: string, val: any) => {
                                  const arr = [...(editingSection.config.items || [])];
                                  arr[idx] = { ...arr[idx], [field]: val };
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                const removeArrayItem = () => {
                                  const arr = (editingSection.config.items || []).filter((_: any, i: number) => i !== idx);
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                                };
                                return (
                                  <div key={idx} className="flex items-center gap-2 bg-muted/10 p-1.5 border border-border rounded-lg">
                                    <Input
                                      value={item.icon || "🚚"}
                                      onChange={(e) => updateArrayItem("icon", e.target.value)}
                                      className="w-12 text-center text-xs h-9"
                                    />
                                    <Input
                                      value={item.text || ""}
                                      onChange={(e) => updateArrayItem("text", e.target.value)}
                                      placeholder="مثال: التوصيل متوفر لجميع الولايات"
                                      className="flex-1 text-xs h-9 text-start"
                                    />
                                    <button type="button" onClick={removeArrayItem} className="text-red-400 hover:text-red-500 p-1">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const arr = [...(editingSection.config.items || []), { icon: "🚚", text: "" }];
                                handleUpdateSection(section.id, { config: { ...editingSection.config, items: arr } });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t('builderEditorAddDeliveryBtn') || "إضافة معلومة توصيل"}
                            </Button>
                          </div>
                        )}

                        {/* 18. Comparison Table Editor */}
                        {section.section_type === 'comparison' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorComparisonCols') || "أعمدة المقارنة"}</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(editingSection.config.columns || ["المميزات", "منتجنا", "المنافس"]).map((col: string, idx: number) => (
                                <Input
                                  key={idx}
                                  value={col}
                                  onChange={(e) => {
                                    const cols = [...(editingSection.config.columns || ["المميزات", "منتجنا", "المنافس"])];
                                    cols[idx] = e.target.value;
                                    handleUpdateSection(section.id, { config: { ...editingSection.config, columns: cols } });
                                  }}
                                  className="text-xs text-center"
                                />
                              ))}
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorComparisonRows') || "سطور المقارنة"}</label>
                            <div className="space-y-2">
                              {(editingSection.config.rows || [["الجودة", "ممتازة ✅", "عادية ❌"]]).map((row: string[], rIdx: number) => {
                                const removeRow = () => {
                                  const rows = (editingSection.config.rows || []).filter((_: any, i: number) => i !== rIdx);
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, rows } });
                                };
                                return (
                                  <div key={rIdx} className="p-2 border border-border bg-muted/10 rounded-xl space-y-1.5 relative">
                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                      <span className="text-[10px] text-muted-foreground">{isRtl ? `صف #${rIdx + 1}` : `Row #${rIdx + 1}`}</span>
                                      <button type="button" onClick={removeRow} className="text-red-400 p-0.5"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      {row.map((cell: string, cIdx: number) => (
                                        <Input
                                          key={cIdx}
                                          value={cell}
                                          onChange={(e) => {
                                            const rows = [...(editingSection.config.rows || [])];
                                            rows[rIdx] = [...rows[rIdx]];
                                            rows[rIdx][cIdx] = e.target.value;
                                            handleUpdateSection(section.id, { config: { ...editingSection.config, rows } });
                                          }}
                                          placeholder={editingSection.config.columns?.[cIdx] || ""}
                                          className="text-xs text-center"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const newRow = (editingSection.config.columns || ["المميزات", "منتجنا", "المنافس"]).map(() => "");
                                const rows = [...(editingSection.config.rows || []), newRow];
                                handleUpdateSection(section.id, { config: { ...editingSection.config, rows } });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t('builderEditorAddComparisonRowBtn') || "إضافة سطر مقارنة"}
                            </Button>
                          </div>
                        )}

                        {/* 19. Before & After Editor */}
                        {section.section_type === 'before_after' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorBeforeAfterBeforeLabel') || "علامة قبل"}</label>
                                <Input
                                  value={editingSection.config.before_label || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, before_label: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorBeforeAfterAfterLabel') || "علامة بعد"}</label>
                                <Input
                                  value={editingSection.config.after_label || ""}
                                  onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, after_label: e.target.value } })}
                                  className="text-xs text-start"
                                />
                              </div>
                            </div>
                            <div className="space-y-3 pt-2">
                              {/* Before Image */}
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorBeforeAfterBeforeImg') || "صورة قبل"}</label>
                                {editingSection.config.before_image ? (
                                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group bg-muted/20">
                                    <img src={getFullImageUrl(editingSection.config.before_image)} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSection(section.id, { config: { ...editingSection.config, before_image: "" } })}
                                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full text-xs gap-1.5 h-10 border-dashed"
                                    disabled={imageUploading === section.id}
                                    onClick={() => document.getElementById(`before-image-upload-${section.id}`)?.click()}
                                  >
                                    <Plus className="h-4 w-4" /> {t('uploadFromDevice') || "Upload Image"}
                                  </Button>
                                )}
                                <input
                                  id={`before-image-upload-${section.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(section.id, e, "before_image")}
                                />
                              </div>
                              {/* After Image */}
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t('builderEditorBeforeAfterAfterImg') || "صورة بعد"}</label>
                                {editingSection.config.after_image ? (
                                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group bg-muted/20">
                                    <img src={getFullImageUrl(editingSection.config.after_image)} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSection(section.id, { config: { ...editingSection.config, after_image: "" } })}
                                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full text-xs gap-1.5 h-10 border-dashed"
                                    disabled={imageUploading === section.id}
                                    onClick={() => document.getElementById(`after-image-upload-${section.id}`)?.click()}
                                  >
                                    <Plus className="h-4 w-4" /> {t('uploadFromDevice') || "Upload Image"}
                                  </Button>
                                )}
                                <input
                                  id={`after-image-upload-${section.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(section.id, e, "after_image")}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 20. Reviews List Editor */}
                        {section.section_type === 'reviews' && (
                          <div className="space-y-3 text-start">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('builderEditorTitle') || "العنوان"}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(section.id, { config: { ...editingSection.config, title: e.target.value } })}
                                className="text-xs text-start"
                              />
                            </div>
                            <label className="text-xs font-semibold text-muted-foreground block">{t('builderEditorReviews') || "التقييمات وآراء الزبائن"}</label>
                            <div className="space-y-2.5">
                              {(editingSection.config.reviews || []).map((review: any, idx: number) => {
                                const updateArrayItem = (field: string, val: any) => {
                                  const arr = [...(editingSection.config.reviews || [])];
                                  arr[idx] = { ...arr[idx], [field]: val };
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, reviews: arr } });
                                };
                                const removeArrayItem = () => {
                                  const arr = (editingSection.config.reviews || []).filter((_: any, i: number) => i !== idx);
                                  handleUpdateSection(section.id, { config: { ...editingSection.config, reviews: arr } });
                                };
                                return (
                                  <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-muted-foreground">{isRtl ? `تقييم #${idx + 1}` : `Review #${idx + 1}`}</span>
                                      <button type="button" onClick={removeArrayItem} className="text-red-400 hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <Input
                                      value={review.name || ""}
                                      onChange={(e) => updateArrayItem("name", e.target.value)}
                                      placeholder={t('builderEditorReviewNamePl') || "اسم الزبون والولاية"}
                                      className="text-xs text-start"
                                    />
                                    <textarea
                                      value={review.text || ""}
                                      onChange={(e) => updateArrayItem("text", e.target.value)}
                                      placeholder={t('builderEditorReviewTextPl') || "نص التقييم"}
                                      className="w-full rounded-lg border border-border bg-input p-2 text-xs text-foreground resize-none h-16"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        value={review.rating || 5}
                                        onChange={(e) => updateArrayItem("rating", parseInt(e.target.value) || 5)}
                                        className="h-9 rounded-lg border border-border bg-input text-xs"
                                      >
                                        <option value="5">⭐⭐⭐⭐⭐</option>
                                        <option value="4">⭐⭐⭐⭐</option>
                                        <option value="3">⭐⭐⭐</option>
                                        <option value="2">⭐⭐</option>
                                        <option value="1">⭐</option>
                                      </select>
                                      <Input
                                        value={review.date || ""}
                                        onChange={(e) => updateArrayItem("date", e.target.value)}
                                        placeholder="منذ يوم"
                                        className="text-xs h-9 text-start"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const arr = [...(editingSection.config.reviews || []), { name: "", text: "", rating: 5, date: isRtl ? "منذ يوم" : "1 day ago" }];
                                handleUpdateSection(section.id, { config: { ...editingSection.config, reviews: arr } });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t('builderEditorAddReviewBtn') || "إضافة تقييم جديد"}
                            </Button>
                          </div>
                        )}

                        <div className={`flex gap-2 pt-2 border-t border-border ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <Button type="button" onClick={handleSave} size="sm" className="text-xs bg-primary text-white">{t('save')}</Button>
                          <Button type="button" onClick={() => setEditingSection(null)} size="sm" variant="outline" className="text-xs">{t('close')}</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed text-start">
                        {section.section_type === 'featured_products' && t('featuredProductsDesc')}
                        {section.section_type === 'trust_badges' && t('trustBadgesDesc')}
                        {section.section_type === 'announcement' && `${t('announcementPrefix')} ${config.content || "..."}`}
                        {section.section_type === 'header' && `${t('headerPrefix')} ${config.content || selectedStore?.name}`}
                        {section.section_type === 'hero' && `${t('heroPrefix')} ${config.title || "..."}`}
                        {section.section_type === 'footer' && `${t('footerPrefix')} ${config.content || "..."}`}
                        {section.section_type === 'text' && t('textSectionDesc')}
                        {section.section_type === 'image' && t('imageSectionDesc')}
                        {section.section_type === 'banner' && `${t('bannerSection') || "بنر إعلاني مخصص"}: ${config.title || "..."}`}
                        {section.section_type === 'categories' && `${t('categoriesSection') || 'فئات المنتجات'}: ${config.title || "..."}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Smartphone Preview (30%) */}
        <div className="w-full xl:w-[30%] sticky top-2 flex-shrink-0">
          <div className="bg-card border border-border rounded-3xl p-4 shadow-md max-w-sm mx-auto">
            <div className="flex items-center gap-1.5 justify-center mb-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-muted-foreground font-bold">{t('liveStorePreview')}</span>
            </div>

            {/* Simulated Smartphone Screen */}
            <div className="aspect-[9/18.5] w-full bg-slate-950 border-[12px] border-slate-900 rounded-[2.8rem] overflow-hidden relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col justify-start ring-1 ring-white/10">
              {/* Phone Dynamic Island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5.5 w-24 bg-slate-950 rounded-full flex items-center justify-between px-2.5 z-50 shadow-inner">
                {/* Camera lens reflection */}
                <div className="h-2 w-2 rounded-full bg-indigo-950/80 border border-indigo-900 flex items-center justify-center shrink-0">
                  <div className="h-0.5 w-0.5 rounded-full bg-blue-400/40"></div>
                </div>
                {/* Speaker grille */}
                <div className="h-1 w-10 bg-slate-900 rounded-full shrink-0"></div>
              </div>

              {/* Glass Reflection Glare Overlay */}
              <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.08]" />

              {/* Scrollable Viewport */}
              <div className="flex-1 overflow-y-auto pt-9 pb-10 space-y-0.5 bg-[#f8fafc] text-slate-900 scrollbar-thin scrollbar-thumb-slate-300 relative z-10" dir={isRtl ? 'rtl' : 'ltr'}>
                {sections.filter(s => s && s.section_type).map((section) => {
                  const config = section.config || {};
                  
                  const isSelectedPreview = editingSection?.id === section.id;
                  const clickableRingClass = `relative group/preview transition-all duration-155 cursor-pointer ${
                    isSelectedPreview 
                      ? 'ring-2 ring-primary ring-offset-1 z-10' 
                      : 'hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 hover:z-10'
                  }`;

                  const handlePreviewSectionClick = () => {
                    setEditingSection({ ...section, config: section.config || {} });
                    setTimeout(() => {
                      const editorCard = document.getElementById(`section-card-${section.id}`);
                      if (editorCard) {
                        editorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        editorCard.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                        setTimeout(() => editorCard.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 1500);
                      }
                    }, 50);
                  };

                  const renderSectionPreview = () => {
                    switch (section.section_type) {
                      case "announcement":
                        return (
                          <div
                            className="text-[9px] py-1.5 px-3 text-center font-bold flex items-center justify-center gap-1.5 shadow-sm border-b border-indigo-500/5 select-none"
                            style={{
                              backgroundColor: config.background_color || '#4f46e5',
                              color: config.color || '#ffffff'
                            }}
                          >
                            <Truck className="h-3 w-3 animate-pulse" />
                            <span>{config.content || t('announcementDefaultText')}</span>
                          </div>
                        );

                      case "header":
                        return (
                          <div
                            className="py-2.5 px-3 border-b flex items-center justify-between bg-white shadow-xs select-none"
                            style={{
                              backgroundColor: config.background_color || '#ffffff',
                              borderColor: '#f1f5f9'
                            }}
                          >
                            {selectedStore?.logo ? (
                              <img 
                                src={selectedStore.logo.startsWith('http') ? selectedStore.logo : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${selectedStore.logo}`} 
                                alt={selectedStore.name} 
                                className="h-6 w-auto object-contain" 
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                <span>{selectedStore?.name?.charAt(0).toUpperCase() || "M"}</span>
                              </div>
                            )}
                            <span
                              className="text-[10px] font-black leading-none truncate flex-grow pr-2 text-start"
                              style={{
                                fontSize: config.font_size || '14px',
                                color: config.color || '#111111',
                                textAlign: (config.text_align || (isRtl ? 'right' : 'left')) as any
                              }}
                            >
                              {config.content || selectedStore?.name || t('headerDefaultText')}
                            </span>
                            <div className="h-6 w-12 bg-slate-100 rounded-lg animate-pulse flex-shrink-0"></div>
                          </div>
                        );

                      case "hero":
                        return (
                          <div
                            className="py-6 px-4 border-b border-slate-100 bg-slate-50 space-y-2 select-none text-center"
                            style={{
                              backgroundColor: config.background_color || '#f8fafc',
                              color: config.color || '#0f172a'
                            }}
                          >
                            <h2 className="text-xs font-black leading-tight text-center">
                              {config.title || `${t('welcomeToStore')} ${selectedStore?.name || t('headerDefaultText')}`}
                            </h2>
                            <p className="text-[9px] opacity-75 font-medium leading-relaxed text-center">
                              {config.description || t('heroDefaultDesc')}
                            </p>
                          </div>
                        );

                      case "featured_products":
                        return (
                          <div className="p-3 space-y-3 select-none"
                            style={{
                              backgroundColor: config.background_color || '#ffffff',
                              color: config.color || '#0f172a'
                            }}
                          >
                            <div className="text-start">
                              <span className="text-[10px] font-black border-b border-primary pb-1">{config.title || t('featuredProductsSection')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[1, 2].map((i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex flex-col justify-between p-1.5 space-y-1">
                                  <div className="aspect-square bg-slate-200 rounded-md animate-pulse"></div>
                                  <div className="h-2 w-10/12 bg-slate-300 rounded animate-pulse"></div>
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="text-[9px] font-black text-primary font-outfit">5900 DZD</span>
                                    <div className="h-4 w-4 bg-primary/20 rounded-full flex items-center justify-center text-primary text-[8px]">+</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );

                      case "categories":
                        const displayCats = categories && categories.length > 0 
                          ? categories 
                          : [
                              { name: isRtl ? "ملابس" : "Fashion", letter: "F" },
                              { name: isRtl ? "إلكترونيات" : "Electronics", letter: "E" },
                              { name: isRtl ? "عطور" : "Beauty", letter: "B" }
                            ];
                        const isSlider = config.layout === "slider" || !config.layout;
                        const imageStyle = config.image_style || "circle";

                        return (
                          <div
                            className="p-3 select-none"
                            style={{
                              backgroundColor: config.background_color || '#ffffff',
                              color: config.color || '#0f172a'
                            }}
                          >
                            <div className="text-start mb-2">
                              <span className="text-[9px] font-black border-b border-primary pb-0.5">{config.title || t('categoriesSectionTitle')}</span>
                            </div>
                            
                            <div className={isSlider ? "flex gap-3 overflow-x-auto pb-1" : "grid grid-cols-3 gap-2"}>
                              {displayCats.map((cat: any, idx: number) => {
                                const letter = cat.letter || cat.name?.charAt(0).toUpperCase() || "C";
                                const fallbackBg = idx % 3 === 0 
                                  ? "from-pink-400 to-rose-500" 
                                  : idx % 3 === 1 
                                    ? "from-blue-400 to-indigo-500" 
                                    : "from-amber-400 to-orange-500";

                                if (imageStyle === "circle") {
                                  return (
                                    <div key={idx} className="flex flex-col items-center space-y-1 flex-shrink-0 min-w-[50px]">
                                      <div className="h-10 w-10 rounded-full border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                                        {cat.image_url ? (
                                          <img src={cat.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                          <div className={`h-full w-full bg-gradient-to-tr ${fallbackBg} flex items-center justify-center text-white text-[10px] font-black`}>
                                            {letter}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[7px] font-black truncate max-w-[50px]">{cat.name}</span>
                                    </div>
                                  );
                                } else if (imageStyle === "square") {
                                  return (
                                    <div key={idx} className="flex flex-col items-center space-y-1 flex-shrink-0 min-w-[50px]">
                                      <div className="h-10 w-10 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                                        {cat.image_url ? (
                                          <img src={cat.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                          <div className={`h-full w-full bg-gradient-to-tr ${fallbackBg} flex items-center justify-center text-white text-[10px] font-black`}>
                                            {letter}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[7px] font-black truncate max-w-[50px]">{cat.name}</span>
                                    </div>
                                  );
                                } else { // card
                                  return (
                                    <div key={idx} className="h-12 w-full rounded-md border border-slate-150 overflow-hidden bg-slate-900 text-white relative flex items-center justify-center shadow-sm flex-shrink-0 min-w-[50px]">
                                      {cat.image_url ? (
                                        <img src={cat.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                                      ) : (
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${fallbackBg} opacity-90`}></div>
                                      )}
                                      <div className="absolute inset-0 bg-black/20 z-0"></div>
                                      <span className="text-[7px] font-black text-white relative z-10 text-center truncate px-1">{cat.name}</span>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );

                      case "trust_badges":
                        return (
                          <div
                            className="py-4 px-3 border-t border-b border-slate-150 grid grid-cols-3 gap-1.5 text-center bg-slate-50/50 select-none"
                            style={{
                              backgroundColor: config.background_color || '#ffffff',
                              color: config.color || '#0f172a'
                            }}
                          >
                            <div 
                              className="flex flex-col items-center space-y-1 p-1 bg-white border border-slate-100 rounded-md"
                              style={{
                                backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                                borderColor: config.color ? `${config.color}20` : undefined,
                              }}
                            >
                              <Truck className="h-3.5 w-3.5 text-primary" />
                              <span 
                                className="text-[7px] font-black truncate"
                                style={{ color: config.color || undefined }}
                              >
                                {config.badge_1_title || t('trustBadge1Title')}
                              </span>
                            </div>
                            <div 
                              className="flex flex-col items-center space-y-1 p-1 bg-white border border-slate-100 rounded-md"
                              style={{
                                backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                                borderColor: config.color ? `${config.color}20` : undefined,
                              }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                              <span 
                                className="text-[7px] font-black truncate"
                                style={{ color: config.color || undefined }}
                              >
                                {config.badge_2_title || t('trustBadge2Title')}
                              </span>
                            </div>
                            <div 
                              className="flex flex-col items-center space-y-1 p-1 bg-white border border-slate-100 rounded-md"
                              style={{
                                backgroundColor: config.background_color ? 'rgba(255,255,255,0.05)' : undefined,
                                borderColor: config.color ? `${config.color}20` : undefined,
                              }}
                            >
                              <Phone className="h-3.5 w-3.5 text-primary" />
                              <span 
                                className="text-[7px] font-black truncate"
                                style={{ color: config.color || undefined }}
                              >
                                {config.badge_3_title || t('trustBadge3Title')}
                              </span>
                            </div>
                          </div>
                        );

                      case "footer":
                        return (
                          <div
                            className="py-6 px-4 text-center border-t select-none"
                            style={{
                              backgroundColor: config.background_color || '#090d16',
                              color: config.color || '#ffffff'
                            }}
                          >
                            <span className="text-[9px] font-black tracking-wide block text-center">{selectedStore?.name || t('headerDefaultText')}</span>
                            <span
                              className="text-[8px] opacity-60 leading-relaxed block mt-2 text-center"
                              style={{
                                color: config.color || '#ffffff',
                                textAlign: (config.text_align || 'center') as any
                              }}
                              dangerouslySetInnerHTML={{ __html: config.content || `© ${t('copyrightDefault')}` }}
                            />
                          </div>
                        );

                      case "text":
                        return (
                          <div
                            className="p-3 shadow-xs border-b border-slate-100 select-none text-start"
                            style={{
                              backgroundColor: config.background_color || '#ffffff'
                            }}
                          >
                            <div
                              className="text-[9px] leading-relaxed"
                              style={{
                                fontSize: config.font_size || "14px",
                                color: config.color || "#334155",
                                textAlign: (config.text_align || (isRtl ? 'right' : 'left')) as any
                              }}
                              dangerouslySetInnerHTML={{ __html: config.content || '' }}
                            />
                          </div>
                        );

                      case "image":
                        return (
                          <div className="p-2 border-b border-slate-150 select-none"
                            style={{
                              backgroundColor: config.background_color || '#ffffff',
                              color: config.color || '#0f172a'
                            }}
                          >
                            {config.image_url ? (
                              <img src={getFullImageUrl(config.image_url)} alt="" className="w-full h-auto rounded-lg object-cover" />
                            ) : (
                              <div className="h-16 bg-slate-100 border border-dashed border-slate-200 flex items-center justify-center text-[8px] text-slate-400 rounded-lg">
                                {t('customImageDefault')}
                              </div>
                            )}
                            {config.caption && <p className="text-[7px] text-slate-500 text-center mt-1">{config.caption}</p>}
                          </div>
                        );

                      case "banner":
                        return (
                          <div
                            className="py-6 px-4 border-b border-slate-100 bg-cover bg-center space-y-2 select-none text-center relative flex flex-col justify-center"
                            style={{
                              backgroundImage: config.image_url ? `url(${getFullImageUrl(config.image_url)})` : undefined,
                              backgroundColor: config.image_url ? undefined : (config.background_color || '#4f46e5'),
                              color: config.color || '#ffffff',
                              textAlign: (config.text_align || 'center') as any,
                              minHeight: config.height === 'small' ? '80px' : config.height === 'large' ? '160px' : '120px'
                            }}
                          >
                            {config.image_url && (
                              <div 
                                className="absolute inset-0 bg-black z-0"
                                style={{ opacity: config.image_opacity !== undefined ? (config.image_opacity / 100) : 0.4 }}
                              ></div>
                            )}
                            <div className="relative z-10 space-y-1.5">
                              <h3 className="text-xs font-black leading-tight">
                                {config.title || t('bannerDefaultTitle')}
                              </h3>
                              {config.subtitle && (
                                <p className="text-[8px] opacity-80 leading-snug">
                                  {config.subtitle}
                                </p>
                              )}
                              {config.cta_text && (
                                <div className="pt-1.5 flex justify-center">
                                  <span
                                    className="px-3 py-1 rounded text-[8px] font-bold inline-block animate-pulse"
                                    style={{
                                      backgroundColor: config.btn_color || '#ffffff',
                                      color: config.btn_text_color || '#4f46e5'
                                    }}
                                  >
                                    {config.cta_text}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );

                      case "video":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-slate-950 text-white select-none relative aspect-video flex flex-col items-center justify-center">
                            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/placeholder-video.png')" }}></div>
                            <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center z-10 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all">
                              <Play className="h-5 w-5 text-white ml-0.5 fill-white" />
                            </div>
                            <span className="text-[10px] mt-2 font-bold z-10 text-slate-200">{config.title || "Video Presentation"}</span>
                          </div>
                        );

                      case "countdown":
                        return (
                          <div
                            className="p-2 border-b select-none flex flex-col items-center justify-center space-y-1"
                            style={{
                              backgroundColor: config.bg_color || '#dc2626',
                              color: config.text_color || '#ffffff'
                            }}
                          >
                            <span className="text-[8px] font-black uppercase tracking-wider">{config.urgency_text || "الكمية محدودة جداً!"}</span>
                            <span className="text-[9px] font-bold">{config.title || "ينتهي العرض في:"}</span>
                            <div className="flex gap-1.5 text-[9px] font-black font-mono">
                              <span className="bg-black/20 px-1 py-0.5 rounded">{config.hours ?? 2}h</span>
                              <span>:</span>
                              <span className="bg-black/20 px-1 py-0.5 rounded">{config.minutes ?? 0}m</span>
                              <span>:</span>
                              <span className="bg-black/20 px-1 py-0.5 rounded">{config.seconds ?? 0}s</span>
                            </div>
                          </div>
                        );

                      case "quantity_offers":
                        return (
                          <div className="p-3 border-b border-slate-150 select-none bg-slate-50 text-slate-800 text-start">
                            <span className="text-[9px] font-black block border-b border-slate-200 pb-1 mb-2">{config.title || "عروض خاصة للدفع عند الاستلام"}</span>
                            <div className="space-y-1.5">
                              <div className="p-2 rounded border border-primary bg-primary/5 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <input type="radio" checked readOnly />
                                  <span className="font-bold">{isRtl ? "قطعتين (2)" : "2 Pieces"}</span>
                                  <span className="text-[8px] bg-primary text-white px-1 rounded-sm">{config.highlight_badge || "الأكثر طلباً"}</span>
                                </div>
                                <span className="font-black text-primary">6900 DZD</span>
                              </div>
                              <div className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between text-[10px] opacity-75">
                                <div className="flex items-center gap-1.5">
                                  <input type="radio" readOnly />
                                  <span>{isRtl ? "ثلاثة قطع (3)" : "3 Pieces"}</span>
                                </div>
                                <span className="font-bold">8900 DZD</span>
                              </div>
                            </div>
                          </div>
                        );

                      case "bundle_offers":
                        return (
                          <div className="p-3 border-b border-slate-150 select-none bg-white text-slate-800 text-start">
                            <span className="text-[9px] font-black block text-center text-primary uppercase">{config.title || "عروض الباقات المميزة"}</span>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="p-2 rounded-lg border-2 border-primary bg-primary/5 flex flex-col justify-between text-center relative pt-4">
                                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-full">{config.highlight_text || "موصى به"}</span>
                                <span className="text-[9px] font-bold block">{isRtl ? "باقة التوفير" : "Saver Pack"}</span>
                                <span className="text-[11px] font-black text-primary block mt-1">4900 DA</span>
                              </div>
                              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between text-center opacity-80">
                                <span className="text-[9px] font-bold block">{isRtl ? "الباقة الذهبية" : "Gold Pack"}</span>
                                <span className="text-[11px] font-black text-slate-700 block mt-1">7900 DA</span>
                              </div>
                            </div>
                          </div>
                        );

                      case "product_gallery":
                        return (
                          <div className="border-b border-slate-100 bg-slate-50 select-none relative aspect-square flex flex-col items-center justify-center p-3">
                            <div className="h-full w-full rounded-xl bg-slate-200 flex items-center justify-center border border-slate-300 relative overflow-hidden">
                              <ImageIcon className="h-10 w-10 text-slate-400" />
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-2">{config.title || "صور المعاينة للمنتج"}</span>
                          </div>
                        );

                      case "sticky_cta":
                        return (
                          <div className="p-2 select-none border-t border-b border-slate-200 bg-white flex items-center justify-between shadow-lg">
                            <div className="text-start">
                              <span className="text-[7px] text-muted-foreground block">{isRtl ? "السعر الكلي" : "Total Price"}</span>
                              <span className="text-[10px] font-black text-slate-900">4,900 DZD</span>
                            </div>
                            <span
                              className="px-4 py-1.5 rounded-lg text-[9px] font-black text-white cursor-pointer inline-block"
                              style={{ backgroundColor: config.bg_color || '#6366f1' }}
                            >
                              {config.text || "أطلب الآن!"}
                            </span>
                          </div>
                        );

                      case "floating_order_button":
                        return (
                          <div className="p-2 border-b select-none flex justify-center bg-transparent">
                            <span className="w-full py-2 bg-green-500 text-white font-black text-[10px] rounded-lg shadow-md cursor-pointer animate-bounce block text-center">
                              {config.text || "🛒 أطلب الآن!"}
                            </span>
                          </div>
                        );

                      case "faq":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-white text-slate-800 text-start">
                            <div className="text-center mb-2">
                              <span className="text-[9px] font-black border-b border-primary pb-0.5">{config.title || "الأسئلة الشائعة"}</span>
                            </div>
                            <div className="space-y-1">
                              {(config.items || []).slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="border border-slate-100 rounded-md p-1.5 bg-slate-50 flex items-center justify-between text-[8px] font-bold">
                                  <span>{item.q || (isRtl ? "سؤال توضيحي شائك؟" : "Example Question?")}</span>
                                  <Plus className="h-2 w-2 text-slate-400" />
                                </div>
                              ))}
                            </div>
                          </div>
                        );

                      case "benefits":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-slate-50 text-slate-800 text-start">
                            <div className="text-center mb-2.5">
                              <span className="text-[9px] font-black border-b border-primary pb-0.5">{config.title || "لماذا تختار متجرنا؟"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {(config.items || []).slice(0, 4).map((item: any, idx: number) => (
                                <div key={idx} className="p-2 border border-slate-100 rounded-lg bg-white space-y-0.5 flex flex-col items-center text-center">
                                  <span className="text-[14px]">{item.icon || "✅"}</span>
                                  <span className="text-[8px] font-black text-slate-900 block truncate w-full">{item.title || "ميزة رائعة"}</span>
                                  <span className="text-[7px] text-muted-foreground block line-clamp-2 leading-tight">{item.desc || "تفاصيل الميزة"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );

                      case "delivery_info":
                        return (
                          <div className="p-3 border-b border-slate-150 select-none bg-white text-slate-800 text-start">
                            <span className="text-[9px] font-black block text-center text-slate-800 mb-2">{config.title || "معلومات التوصيل والضمان"}</span>
                            <div className="space-y-1.5">
                              {(config.items || []).slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-[8px]">
                                  <span className="text-xs">{item.icon || "🚚"}</span>
                                  <span className="font-semibold text-slate-700 leading-tight">{item.text || "التوصيل لـ 58 ولاية والدفع عند الاستلام"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );

                      case "comparison":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-white text-slate-800 text-start">
                            <span className="text-[9px] font-black block text-center mb-2">{config.title || "جدول المقارنة"}</span>
                            <table className="w-full border border-slate-200 rounded text-[7px] leading-tight text-center">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                  {(config.columns || ["المميزات", "منتجنا", "المنافس"]).map((col: string, idx: number) => (
                                    <th key={idx} className="p-1 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(config.rows || [["الجودة", "ممتازة ✅", "عادية ❌"]]).slice(0, 3).map((row: string[], idx: number) => (
                                  <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                                    {row.map((cell: string, cIdx: number) => (
                                      <td key={cIdx} className="p-1">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );

                      case "before_after":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-slate-50 text-slate-800 text-start">
                            <span className="text-[9px] font-black block text-center mb-2">{config.title || "قبل وبعد"}</span>
                            <div className="grid grid-cols-2 gap-2 relative h-28">
                              <div className="relative rounded overflow-hidden border bg-slate-200 h-full flex items-center justify-center">
                                {config.before_image ? (
                                  <img src={getFullImageUrl(config.before_image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                )}
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[6px] px-1 py-0.2 rounded font-bold">{config.before_label || "قبل"}</span>
                              </div>
                              <div className="relative rounded overflow-hidden border bg-slate-200 h-full flex items-center justify-center">
                                {config.after_image ? (
                                  <img src={getFullImageUrl(config.after_image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                )}
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[6px] px-1 py-0.2 rounded font-bold">{config.after_label || "بعد"}</span>
                              </div>
                            </div>
                          </div>
                        );

                      case "reviews":
                        return (
                          <div className="p-3 border-b border-slate-100 bg-white text-slate-800 text-start">
                            <span className="text-[9px] font-black block text-center mb-2">{config.title || "آراء زبائننا الكرام"}</span>
                            <div className="space-y-2">
                              {(config.reviews || []).slice(0, 3).map((r: any, idx: number) => (
                                <div key={idx} className="p-2 border border-slate-100 rounded bg-slate-50 space-y-1">
                                  <div className="flex items-center justify-between text-[7px]">
                                    <span className="font-bold text-slate-900">{r.name || "زبون مجهول"}</span>
                                    <span className="text-yellow-500 font-bold">{"⭐".repeat(r.rating || 5)}</span>
                                  </div>
                                  <p className="text-[7px] leading-tight text-slate-700">{r.text || "محتوى التقييم والخدمة ممتازة جداً."}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  };

                  const previewContent = renderSectionPreview();
                  if (!previewContent) return null;

                  return (
                    <div
                      key={section.id}
                      onClick={handlePreviewSectionClick}
                      className={clickableRingClass}
                      title={isRtl ? "انقر لتعديل هذا القسم" : "Click to edit this section"}
                    >
                      {previewContent}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
