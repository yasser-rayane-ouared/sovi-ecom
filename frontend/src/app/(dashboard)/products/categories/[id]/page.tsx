"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useDashboardStore } from "@/stores/dashboard";
import { useLanguageStore } from "@/stores/language";
import { getRootDomain, getFullImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Layers, Plus, Trash2, Edit2, Sparkles, AlertCircle, CheckCircle2,
  ChevronDown, Palette, EyeOff, Check, Image as ImageIcon, Truck,
  ShieldCheck, Phone, Gift, CheckSquare, GripVertical, Info, Layout,
  ShoppingCart, Star, ArrowRight, Shield
} from "lucide-react";



export default function CategoryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedStore } = useDashboardStore() as any;
  const { t, language, isRtl } = useLanguageStore();
  const SECTION_TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
    announcement: { label: language === 'ar' ? "شريط الإعلانات (Announcement)" : (language === 'fr' ? "Bandeau d'annonce (Announcement)" : "Announcement Banner (Announcement)"), icon: <Truck className="h-4 w-4 text-primary" /> },
    header: { label: language === 'ar' ? "ترويسة الصفحة (Header)" : (language === 'fr' ? "En-tête de page (Header)" : "Page Header (Header)"), icon: <Layout className="h-4 w-4 text-primary" /> },
    hero: { label: language === 'ar' ? "البنر الرئيسي والترحيب (Hero)" : (language === 'fr' ? "Bannière Hero (Hero)" : "Hero Banner (Hero)"), icon: <Sparkles className="h-4 w-4 text-primary" /> },
    featured_products: { label: language === 'ar' ? "شبكة منتجات الفئة (Category Products Grid)" : (language === 'fr' ? "Grille des produits (Category Products Grid)" : "Category Products Grid (Category Products Grid)"), icon: <Star className="h-4 w-4 text-primary" /> },
    trust_badges: { label: language === 'ar' ? "ضمانات الثقة (Trust Badges)" : (language === 'fr' ? "Badges de confiance (Trust Badges)" : "Trust Badges (Trust Badges)"), icon: <ShieldCheck className="h-4 w-4 text-primary" /> },
    footer: { label: language === 'ar' ? "تذييل الصفحة (Footer)" : (language === 'fr' ? "Pied de page (Footer)" : "Page Footer (Footer)"), icon: <Layers className="h-4 w-4 text-primary" /> },
    text: { label: language === 'ar' ? "محتوى نصي مخصص (Custom Text)" : (language === 'fr' ? "Texte personnalisé (Custom Text)" : "Custom Text (Custom Text)"), icon: <Edit2 className="h-4 w-4 text-primary" /> },
    image: { label: language === 'ar' ? "صورة / بنر مخصص (Custom Image)" : (language === 'fr' ? "Image personnalisée (Custom Image)" : "Custom Image (Custom Image)"), icon: <ImageIcon className="h-4 w-4 text-primary" /> },
  };
  const currentStoreId = selectedStore?.id;
  const categoryId = params.id as string;
  const isCreateMode = categoryId === "new";

  const [activeTab, setActiveTab] = useState<"info" | "styling">("info");
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Category Metadata Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Layout Sections Fields (similar to homepage sections)
  const [sections, setSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const [sectionUploading, setSectionUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStoreId) return;

    if (isCreateMode) {
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      setIsActive(true);
      // Seed default category sections
      setSections([
        {
          id: "default-announcement",
          section_type: "announcement",
          config: {
            content: language === 'ar' ? "تصفح مجموعتنا الحصرية مع توصيل سريع ودفع عند الاستلام!" : (language === 'fr' ? "Découvrez notre collection exclusive avec livraison rapide et paiement à la livraison !" : "Browse our exclusive collection with fast shipping and Cash on Delivery!"),
            background_color: "#4f46e5",
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
            content: selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store")),
            background_color: "#ffffff",
            color: "#111111",
            font_size: "18px",
            text_align: isRtl ? "right" : "left"
          },
          order: 1
        },
        {
          id: "default-hero",
          section_type: "hero",
          config: {
            title: language === 'ar' ? "اسم الفئة" : (language === 'fr' ? "Nom de la catégorie" : "Category Name"),
            description: language === 'ar' ? "اكتشف أفضل الخيارات المختارة بعناية خصيصاً لك." : (language === 'fr' ? "Découvrez les meilleures options sélectionnées avec soin pour vous." : "Discover the best options carefully selected for you."),
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
            title: language === 'ar' ? "منتجات هذه الفئة" : (language === 'fr' ? "Produits de cette catégorie" : "Products in this category")
          },
          order: 3
        },
        {
          id: "default-badges",
          section_type: "trust_badges",
          config: {
            badge_1_title: language === 'ar' ? "توصيل سريع" : (language === 'fr' ? "Livraison rapide" : "Fast Delivery"),
            badge_1_desc: language === 'ar' ? "التوصيل لجميع الولايات بأسعار مدروسة." : (language === 'fr' ? "Livraison dans toutes les wilayas à des prix étudiés." : "Delivery to all provinces at reasonable rates."),
            badge_2_title: language === 'ar' ? "الدفع عند الاستلام" : (language === 'fr' ? "Paiement à la livraison" : "Cash on Delivery"),
            badge_2_desc: language === 'ar' ? "لا تدفع أي شيء حتى تستلم منتجك بين يديك." : (language === 'fr' ? "Ne payez rien avant d'avoir reçu votre produit." : "Pay nothing until you receive your product."),
            badge_3_title: language === 'ar' ? "دعم العملاء" : (language === 'fr' ? "Service client" : "Customer Support"),
            badge_3_desc: language === 'ar' ? "فريق عملنا متواجد للرد على استفساراتكم." : (language === 'fr' ? "Notre équipe est disponible pour répondre à vos questions." : "Our team is available to answer your questions."),
            background_color: "#ffffff",
            color: "#0f172a"
          },
          order: 4
        },
        {
          id: "default-footer",
          section_type: "footer",
          config: {
            content: `© ${new Date().getFullYear()} ${selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store"))}. ${language === 'ar' ? "جميع الحقوق محفوظة." : (language === 'fr' ? "Tous droits réservés." : "All rights reserved.")}`,
            background_color: "#090d16",
            color: "#ffffff",
            font_size: "14px",
            text_align: "center"
          },
          order: 5
        }
      ]);
      setLoading(false);
    } else {
      setLoading(true);
      api.get(`/products/${currentStoreId}/categories/${categoryId}/`)
        .then((res) => {
          const data = res.data;
          setName(data.name);
          setSlug(data.slug);
          setDescription(data.description || "");
          setImageUrl(data.image_url || "");
          setIsActive(data.is_active);
          
          let loadedSections = data.layout_sections || [];
          if (!loadedSections || loadedSections.length === 0) {
            loadedSections = [
              {
                id: "default-announcement",
                section_type: "announcement",
                config: {
                  content: language === 'ar' ? "تصفح مجموعتنا الحصرية مع توصيل سريع ودفع عند الاستلام!" : (language === 'fr' ? "Découvrez notre collection exclusive avec livraison rapide et paiement à la livraison !" : "Browse our exclusive collection with fast shipping and Cash on Delivery!"),
                  background_color: "#4f46e5",
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
                  content: selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store")),
                  background_color: "#ffffff",
                  color: "#111111",
                  font_size: "18px",
                  text_align: isRtl ? "right" : "left"
                },
                order: 1
              },
              {
                id: "default-hero",
                section_type: "hero",
                config: {
                  title: data.name,
                  description: data.description || (language === 'ar' ? "اكتشف أفضل الخيارات المختارة بعناية خصيصاً لك." : (language === 'fr' ? "Découvrez les meilleures options sélectionnées avec soin pour vous." : "Discover the best options carefully selected for you.")),
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
                  title: language === 'ar' ? `منتجات ${data.name}` : (language === 'fr' ? `Produits de ${data.name}` : `Products of ${data.name}`)
                },
                order: 3
              },
              {
                id: "default-badges",
                section_type: "trust_badges",
                config: {
                  badge_1_title: language === 'ar' ? "توصيل سريع" : (language === 'fr' ? "Livraison rapide" : "Fast Delivery"),
                  badge_1_desc: language === 'ar' ? "التوصيل لجميع الولايات بأسعار مدروسة." : (language === 'fr' ? "Livraison dans toutes les wilayas à des prix étudiés." : "Delivery to all provinces at reasonable rates."),
                  badge_2_title: language === 'ar' ? "الدفع عند الاستلام" : (language === 'fr' ? "Paiement à la livraison" : "Cash on Delivery"),
                  badge_2_desc: language === 'ar' ? "لا تدفع أي شيء حتى تستلم منتجك بين يديك." : (language === 'fr' ? "Ne payez rien avant d'avoir reçu votre produit." : "Pay nothing until you receive your product."),
                  badge_3_title: language === 'ar' ? "دعم العملاء" : (language === 'fr' ? "Service client" : "Customer Support"),
                  badge_3_desc: language === 'ar' ? "فريق عملنا متواجد للرد على استفساراتكم." : (language === 'fr' ? "Notre équipe est disponible pour répondre à vos questions." : "Our team is available to answer your questions."),
                  background_color: "#ffffff",
                  color: "#0f172a"
                },
                order: 4
              },
              {
                id: "default-footer",
                section_type: "footer",
                config: {
                  content: `© ${new Date().getFullYear()} ${selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store"))}. ${language === 'ar' ? "جميع الحقوق محفوظة." : (language === 'fr' ? "Tous droits réservés." : "All rights reserved.")}`,
                  background_color: "#090d16",
                  color: "#ffffff",
                  font_size: "14px",
                  text_align: "center"
                },
                order: 5
              }
            ];
          }
          loadedSections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setSections(loadedSections);
        })
        .catch(() => {
          setError(t("categoryLoadError"));
        })
        .finally(() => setLoading(false));
    }
  }, [currentStoreId, categoryId, isCreateMode, selectedStore]);

  // Update Hero section title dynamically when Name is updated
  const handleNameChange = (val: string) => {
    setName(val);
    if (isCreateMode) {
      // Auto slugify
      setSlug(val.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, "-").replace(/^-+|-+$/g, ""));
    }
    setSections(prev => prev.map(s => s.id === "default-hero" ? { ...s, config: { ...s.config, title: val } } : s));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStoreId) return;

    setSaving(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImageUrl(res.data.image_url);
      setSuccess(t("categoryUploadSuccess"));
    } catch {
      setError(t("categoryUploadError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!currentStoreId) return;
    if (!name.trim()) {
      setError(t("categoryNameRequired"));
      return;
    }
    if (!slug.trim()) {
      setError(t("categorySlugRequired"));
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name,
      slug,
      description,
      image_url: imageUrl,
      is_active: isActive,
      layout_sections: sections
    };

    try {
      if (isCreateMode) {
        await api.post(`/products/${currentStoreId}/categories/`, payload);
        setSuccess(t("categoryCreateSuccess"));
        setTimeout(() => router.push("/products/categories"), 1000);
      } else {
        await api.put(`/products/${currentStoreId}/categories/${categoryId}/`, payload);
        setSuccess(t("categorySaveSuccess"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === "object") {
        setError(JSON.stringify(detail));
      } else {
        setError(detail || (language === "ar" ? "حدث خطأ أثناء حفظ البيانات." : (language === "fr" ? "Une erreur est survenue lors de l'enregistrement." : "An error occurred while saving.")));
      }
    } finally {
      setSaving(false);
    }
  };

  // Sections builder layout logic (mirroring homepage customizer)
  const handleUpdateSection = (id: string, updatedFields: Partial<any>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
    setEditingSection((prev: any) => prev && prev.id === id ? { ...prev, ...updatedFields } : prev);
  };

  const handleDropSection = (draggedIdx: number, targetIdx: number) => {
    const list = [...sections];
    const item = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, item);

    const updated = list.map((sec, idx) => ({ ...sec, order: idx }));
    setSections(updated);
    setDragIndex(null);
  };

  const toggleLayoutSection = (sectionType: string, sectionId?: string) => {
    setSections(prev => {
      const activeList = [...prev];
      const existing = activeList.find(s => s.section_type === sectionType || (sectionId && s.id === sectionId));
      if (existing) {
        return activeList.filter(s => s.id !== existing.id);
      } else {
        const config: any = {};
        let order = activeList.length;
        if (sectionType === 'announcement') {
          config.content = "توصيل سريع ودفع عند الاستلام!";
          config.background_color = "#4f46e5";
          config.color = "#ffffff";
          config.font_size = "12px";
          config.text_align = "center";
          order = 0;
        } else if (sectionType === 'header') {
          config.content = selectedStore?.name || "متجرنا";
          config.background_color = "#ffffff";
          config.color = "#111111";
          config.font_size = "18px";
          config.text_align = "right";
          order = 1;
        } else if (sectionType === 'hero') {
          config.title = name || "اسم الفئة";
          config.description = "تصفح المنتجات المتوفرة.";
          config.background_color = "#f8fafc";
          config.color = "#0f172a";
          config.font_size = "16px";
          config.text_align = "center";
          order = 2;
        } else if (sectionType === 'featured_products') {
          config.title = "منتجات الفئة";
          order = 3;
        } else if (sectionType === 'trust_badges') {
          config.badge_1_title = "شحن سريع";
          config.badge_1_desc = "شحن لكافة الولايات.";
          config.background_color = "#ffffff";
          config.color = "#0f172a";
          order = 4;
        } else if (sectionType === 'footer') {
          config.content = `© ${selectedStore?.name || "متجرنا"}. جميع الحقوق محفوظة.`;
          config.background_color = "#090d16";
          config.color = "#ffffff";
          order = 5;
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
      config.content = "<h3>عنوان مخصص</h3><p>تفاصيل ونص إضافي يعرض في صفحة الفئة...</p>";
      config.font_size = "15px";
      config.color = "#0f172a";
      config.background_color = "#ffffff";
      config.text_align = "right";
    } else if (sectionType === "image") {
      config.image_url = "";
      config.caption = "";
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

  const handleSectionImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStoreId) return;

    setSectionUploading(sectionId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const targetSection = sections.find(s => s.id === sectionId);
      const currentConfig = targetSection?.config || {};
      handleUpdateSection(sectionId, { config: { ...currentConfig, image_url: res.data.image_url } });
    } catch {
      alert(language === "ar" ? "فشل رفع صورة القسم." : (language === "fr" ? "Échec du chargement de l'image de la section." : "Failed to upload section image."));
    } finally {
      setSectionUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-white font-cairo">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span>{t("pixelsLoading")}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 text-white pb-12 ${isRtl ? 'text-right font-cairo' : 'text-left font-sans'}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isCreateMode ? t("categoryCreateTitle") : t("categoryEditTitle").replace("{name}", name)}
          </h1>
          <p className="text-sm text-muted">{t("categorySubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} variant="glow" className="text-xs">
            {saving ? (language === "ar" ? "جاري الحفظ..." : "Enregistrement...") : t("categorySaveBtn")}
          </Button>
          <Button onClick={() => router.push("/products/categories")} variant="outline" className="text-xs border-white/10 hover:bg-white/5 text-white">
            {t("categoryCancelBtn")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 gap-4">
        <button
          onClick={() => setActiveTab("info")}
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "info" ? "border-b-2 border-primary text-white font-bold" : "text-muted hover:text-white"} ${isRtl ? "font-cairo" : "font-sans"}`}
        >
          {t("categoryTabInfo")}
        </button>
        {!isCreateMode && (
          <button
            onClick={() => setActiveTab("styling")}
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === "styling" ? "border-b-2 border-primary text-white font-bold" : "text-muted hover:text-white"} ${isRtl ? "font-cairo" : "font-sans"}`}
          >
            {t("categoryTabStyling")}
          </button>
        )}
      </div>

      {activeTab === "info" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/5 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold border-b border-white/5 pb-2">{t("categoryInfoCardTitle")}</h3>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted font-bold block">{t("categoryInfoName")}</label>
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t("categoryInfoNamePl")}
                    className={`border-white/5 bg-white/5 text-white ${isRtl ? "text-right" : "text-left"}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-bold block">{t("categoryInfoSlug")}</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, "-"))}
                    placeholder={t("categoryInfoSlugPl")}
                    className="border-white/5 bg-white/5 text-white font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-muted block">{t("categoryInfoSlugDesc")} subdomain.{getRootDomain()}/categories/{slug || "smart-watches"}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted font-bold block">{t("categoryInfoDesc")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("categoryInfoDescPl")}
                    className={`w-full h-32 rounded-lg border border-white/5 bg-white/5 p-3 text-sm text-white focus:outline-none ${isRtl ? "text-right" : "text-left"}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <Card className="border-white/5 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-bold border-b border-white/5 pb-2">{t("categoryPublishCardTitle")}</h3>

                {/* Status Toggle */}
                <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <div className="text-right">
                    <span className="text-sm font-bold block">{t("categoryPublishActive")}</span>
                    <span className="text-[10px] text-muted">{t("categoryPublishActiveDesc")}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-white/5 bg-white/5 accent-primary"
                  />
                </div>

                {/* Main Banner Image */}
                <div className="space-y-3">
                  <label className="text-xs text-muted font-bold block">{t("categoryPublishBanner")}</label>
                  {imageUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40">
                      <img src={getFullImageUrl(imageUrl)} alt="Category Banner" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute bottom-2 left-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
                        title="حذف الصورة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-xl p-6 text-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="h-8 w-8 text-muted mx-auto mb-2" />
                      <span className="text-xs text-muted block">{t("categoryPublishBannerUpload")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Styling & Layout Sections Builder Tab (Homepage customize mirror) */
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Active sections list workspace (70%) */}
          <div className="w-full xl:w-[70%] space-y-6 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Checklist sidebar */}
              <div className="md:col-span-4 space-y-4">
                <div className={`bg-white/5 border border-white/5 rounded-2xl p-5 sticky top-2 space-y-5 shadow-md ${isRtl ? "text-right" : "text-left"}`}>
                  <div>
                    <h4 className="text-sm font-bold mb-1 text-primary flex items-center gap-2">
                      <Layers className="h-4 w-4" /> {language === "ar" ? "أقسام صفحة الفئة" : (language === "fr" ? "Sections de la catégorie" : "Category Page Sections")}
                    </h4>
                    <p className="text-[10px] text-muted leading-relaxed">
                      {language === "ar" ? "قم بتفعيل وترتيب الأقسام لتظهر في صفحة الفئة. اضغط على أي قسم لتعديل محتواه." : (language === "fr" ? "Activez et organisez les sections de la catégorie. Cliquez sur une section pour la modifier." : "Enable and organize category sections. Click on a section to edit its content.")}
                    </p>
                  </div>

                  {/* Active Sections */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{language === "ar" ? "الأقسام النشطة (اسحب للترتيب)" : (language === "fr" ? "Sections Actives (glisser pour réordonner)" : "Active Sections (drag to reorder)")}</p>
                    {sections.length === 0 ? (
                      <p className="text-xs text-muted py-2 text-center border border-dashed border-white/10 rounded-xl">{language === "ar" ? "لا توجد أقسام نشطة" : (language === "fr" ? "Aucune section active" : "No active sections")}</p>
                    ) : (
                      <div className="space-y-2">
                        {sections.map((section, idx) => {
                          const meta = SECTION_TYPE_META[section.section_type] || SECTION_TYPE_META.text;
                          const isStandard = ["announcement", "header", "hero", "featured_products", "trust_badges", "footer"].includes(section.section_type);
                          
                          return (
                            <div
                              key={section.id}
                              draggable
                              onDragStart={() => setDragIndex(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDropSection(dragIndex!, idx)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${isRtl ? "text-right" : "text-left"} ${
                                dragIndex === idx 
                                  ? 'bg-primary/10 border-primary/40 opacity-50' 
                                  : 'bg-white/5 border-white/5 hover:border-primary/20'
                              } cursor-grab`}
                            >
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <div className="text-muted hover:text-white flex-shrink-0">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => toggleLayoutSection(section.section_type, section.id)}
                                  className="h-4 w-4 rounded bg-black/20 accent-primary"
                                />
                                <span className="text-xs font-bold truncate flex items-center gap-1.5">
                                  {meta.icon}
                                  {meta.label}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSection(section)}
                                className={`px-2 py-1 h-auto text-xs ${editingSection?.id === section.id ? 'text-primary bg-primary/10' : 'text-muted hover:text-white'}`}
                              >
                                {t("edit")}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Standard Inactive Sections */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{language === "ar" ? "أقسام اختيارية للزيادة" : (language === "fr" ? "Sections facultatives" : "Optional Sections")}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {["announcement", "header", "hero", "featured_products", "trust_badges", "footer"].map((type) => {
                        const isAdded = sections.some(s => s.section_type === type);
                        if (isAdded) return null;
                        const meta = SECTION_TYPE_META[type];
                        return (
                          <button
                            key={type}
                            onClick={() => toggleLayoutSection(type)}
                            className="flex items-center gap-2 text-right p-2 rounded-lg text-xs hover:bg-white/5 text-muted hover:text-white transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{language === "ar" ? `تفعيل ${meta.label}` : (language === "fr" ? `Activer ${meta.label}` : `Enable ${meta.label}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => setShowAddSection(true)}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs border-dashed border-white/10 hover:bg-white/5 hover:text-white mt-3"
                    >
                      <Plus className="h-4 w-4" /> {language === "ar" ? "إضافة قسم مخصص" : (language === "fr" ? "Ajouter section personnalisée" : "Add custom section")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Editing Area */}
              <div className="md:col-span-8">
                {editingSection ? (
                  <Card className="border-white/5 bg-white/5 backdrop-blur-md">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                          {SECTION_TYPE_META[editingSection.section_type]?.icon}
                          {t("edit")} قسم: {SECTION_TYPE_META[editingSection.section_type]?.label}
                        </h4>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingSection(null)}
                          className="text-xs text-muted hover:text-white"
                        >
                          {language === "ar" ? "إغلاق" : (language === "fr" ? "Fermer" : "Close")}
                        </Button>
                      </div>

                      {/* Editing fields */}
                      <div className="space-y-4">
                        {editingSection.section_type === 'announcement' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "محتوى الإعلان" : (language === "fr" ? "Contenu de l'annonce" : "Announcement Content")}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, content: e.target.value } })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون الخلفية" : (language === "fr" ? "Couleur de fond" : "Background Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#4f46e5"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون النص" : (language === "fr" ? "Couleur du texte" : "Text Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, color: e.target.value } })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {editingSection.section_type === 'header' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "اسم المتجر / الشعار بالترويسة" : (language === "fr" ? "Nom de la boutique / Logo" : "Store Name / Logo")}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, content: e.target.value } })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون الترويسة" : (language === "fr" ? "Couleur de l'en-tête" : "Header Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون النص" : (language === "fr" ? "Couleur du texte" : "Text Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#111111"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, color: e.target.value } })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {editingSection.section_type === 'hero' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "عنوان البنر الرئيسي (Hero Title)" : (language === "fr" ? "Titre principal (Hero Title)" : "Hero Title")}</label>
                              <Input
                                value={editingSection.config.title || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, title: e.target.value } })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "الوصف أو النص الفرعي" : (language === "fr" ? "Description / Sous-titre" : "Description / Subtitle")}</label>
                              <textarea
                                value={editingSection.config.description || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, description: e.target.value } })}
                                className="w-full h-24 rounded-lg border border-white/5 bg-white/5 p-3 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون خلفية البنر" : (language === "fr" ? "Couleur de fond" : "Background Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#f8fafc"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون النص" : (language === "fr" ? "Couleur du texte" : "Text Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, color: e.target.value } })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {editingSection.section_type === 'featured_products' && (
                          <div className="space-y-2">
                            <label className="text-xs text-muted font-bold block">{language === "ar" ? "عنوان شبكة المنتجات" : (language === "fr" ? "Titre de la grille" : "Grid Title")}</label>
                            <Input
                              value={editingSection.config.title || ""}
                              onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, title: e.target.value } })}
                              placeholder={language === "ar" ? "مثال: منتجات هذه المجموعة" : (language === "fr" ? "ex. Produits de cette catégorie" : "e.g. Products in this category")}
                            />
                            <span className="text-[10px] text-muted block">{language === "ar" ? "ملاحظة: هذا القسم سيعرض تلقائياً فقط المنتجات المضافة لهذه الفئة." : (language === "fr" ? "Note : Cette section affichera automatiquement les produits de cette catégorie." : "Note: This section will automatically display products belonging to this category.")}</span>
                          </div>
                        )}

                        {editingSection.section_type === 'trust_badges' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "عنوان الضمان الأول" : "Titre du badge 1"}</label>
                                <Input
                                  value={editingSection.config.badge_1_title || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_1_title: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "وصف الضمان الأول" : "Description du badge 1"}</label>
                                <Input
                                  value={editingSection.config.badge_1_desc || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_1_desc: e.target.value } })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "عنوان الضمان الثاني" : "Titre du badge 2"}</label>
                                <Input
                                  value={editingSection.config.badge_2_title || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_2_title: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "وصف الضمان الثاني" : "Description du badge 2"}</label>
                                <Input
                                  value={editingSection.config.badge_2_desc || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_2_desc: e.target.value } })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "عنوان الضمان الثالث" : "Titre du badge 3"}</label>
                                <Input
                                  value={editingSection.config.badge_3_title || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_3_title: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted font-bold">{language === "ar" ? "وصف الضمان الثالث" : "Description du badge 3"}</label>
                                <Input
                                  value={editingSection.config.badge_3_desc || ""}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, badge_3_desc: e.target.value } })}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {editingSection.section_type === 'footer' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "محتوى تذييل الصفحة (حقوق النشر)" : "Contenu du pied de page (Copyright)"}</label>
                              <Input
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, content: e.target.value } })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون الخلفية" : (language === "fr" ? "Couleur de fond" : "Background Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#090d16"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون النص" : (language === "fr" ? "Couleur du texte" : "Text Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, color: e.target.value } })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {editingSection.section_type === 'text' && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "محتوى النص (يدعم وسوم HTML الأساسية)" : "Contenu texte (HTML supporté)"}</label>
                              <textarea
                                value={editingSection.config.content || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, content: e.target.value } })}
                                className="w-full h-36 rounded-lg border border-white/5 bg-white/5 p-3 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">لون خلفية النص</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.background_color || "#ffffff"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, background_color: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted font-bold block">{language === "ar" ? "لون النص" : (language === "fr" ? "Couleur du texte" : "Text Color")}</label>
                                <Input
                                  type="color"
                                  value={editingSection.config.color || "#0f172a"}
                                  onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, color: e.target.value } })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {editingSection.section_type === 'image' && (
                          <>
                            <div className="space-y-3">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "صورة القسم المخصصة" : "Image personnalisée"}</label>
                              {editingSection.config.image_url ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40">
                                  <img src={getFullImageUrl(editingSection.config.image_url)} alt="Custom Section" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, image_url: "" } })}
                                    className="absolute bottom-2 left-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow"
                                    title="حذف الصورة"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="border border-dashed border-white/10 rounded-xl p-6 text-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSectionImageUpload(editingSection.id, e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                  <ImageIcon className="h-8 w-8 text-muted mx-auto mb-2" />
                                  <span className="text-xs text-muted block">
                                    {imageUploading === editingSection.id ? (language === "ar" ? "جاري الرفع..." : "Téléchargement...") : (language === "ar" ? "اضغط لرفع صورة" : "Cliquez pour charger")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-muted font-bold block">{language === "ar" ? "وصف أو تعليق تحت الصورة" : "Légende de l'image"}</label>
                              <Input
                                value={editingSection.config.caption || ""}
                                onChange={(e) => handleUpdateSection(editingSection.id, { config: { ...editingSection.config, caption: e.target.value } })}
                                placeholder={language === "ar" ? "مثال: خصم خاص 30% لفترة محدودة" : "ex. Offre spéciale 30%"}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-2xl p-12 bg-white/5 text-muted/60 text-sm">
                    اضغط على أيقونة "{t("edit")}" بجانب أي قسم نشط لبدء تخصيص نصوصه، ألوانه، وصوره.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Quick instructions sidebar (30%) */}
          <div className="w-full xl:w-[30%] space-y-6">
            <Card className="border-white/5 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-sm text-primary border-b border-white/5 pb-2">{language === "ar" ? "تعليمات تخصيص الفئة" : "Instructions de personnalisation"}</h4>
                <div className="text-xs space-y-3 text-muted leading-relaxed">
                  <p>• يمكنك إضافة و{t("edit")} وترتيب الأقسام تماماً مثل الصفحة الرئيسية للمتجر.</p>
                  <p>{language === "ar" ? "• قسم \"شبكة منتجات الفئة\" سيعرض تلقائياً فقط المنتجات التي تنتمي لهذه الفئة." : "• The Category Products Grid section will automatically display only products in this category."}</p>
                  <p>• قسم <strong>"Hero"</strong> يفضل {t("edit")}ه ليظهر شعار أو اسم ومقدمة الفئة.</p>
                  <p>{language === "ar" ? "• لحفظ التصميم، اضغط على \"حفظ الفئة والتصميم\" في أعلى الصفحة." : "• To save the design, click \"Save Category\" at the top of the page."}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Section Modal Popup */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-cairo">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden text-white">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg">{language === "ar" ? "إضافة قسم مخصص" : (language === "fr" ? "Ajouter section personnalisée" : "Add custom section")} جديد</h3>
              <button onClick={() => setShowAddSection(false)} className="text-muted hover:text-white">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => handleAddSection("text")}
                className="w-full text-right p-3.5 rounded-xl border border-white/5 hover:border-primary/40 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold block text-sm">{language === "ar" ? "قسم نصي مخصص" : "Section texte"}</span>
                  <span className="text-[10px] text-muted block">{language === "ar" ? "عرض عنوان ونصوص تفصيلية أو عروض مخصصة." : "Afficher un titre, du texte ou des offres."}</span>
                </div>
              </button>

              <button
                onClick={() => handleAddSection("image")}
                className="w-full text-right p-3.5 rounded-xl border border-white/5 hover:border-primary/40 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold block text-sm">{language === "ar" ? "صورة / بنر مخصص" : "Image / Bannière"}</span>
                  <span className="text-[10px] text-muted block">{language === "ar" ? "عرض صورة ترويجية أو إعلان عريض." : "Afficher une image promotionnelle."}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
