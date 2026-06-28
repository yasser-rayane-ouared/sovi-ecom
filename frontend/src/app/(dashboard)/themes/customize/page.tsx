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
  SidebarClose, SidebarOpen
} from "lucide-react";
import { useLanguageStore } from "../../../../stores/language";

// Helper: convert relative media paths to full backend URLs
const getFullImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${url}`;
};

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
    announcement: { label: `${t('announcementSection')} (Announcement)`, icon: <Truck className="h-4 w-4 text-primary" /> },
    header: { label: `${t('headerSection')} (Header)`, icon: <Layout className="h-4 w-4 text-primary" /> },
    hero: { label: `${t('heroSection')} (Hero)`, icon: <Sparkles className="h-4 w-4 text-primary" /> },
    featured_products: { label: `${t('featuredProductsSection')} (Products Grid)`, icon: <Star className="h-4 w-4 text-primary" /> },
    trust_badges: { label: `${t('trustBadgesSection')} (Trust Badges)`, icon: <ShieldCheck className="h-4 w-4 text-primary" /> },
    footer: { label: `${t('footerSection')} (Footer)`, icon: <Layers className="h-4 w-4 text-primary" /> },
    text: { label: `${t('customTextSection')} (Custom Text)`, icon: <Edit2 className="h-4 w-4 text-primary" /> },
    image: { label: `${t('customImageSection')} (Custom Image)`, icon: <ImageIcon className="h-4 w-4 text-primary" /> },
    banner: { label: `${t('bannerSection')} (Promo Banner)`, icon: <Sparkles className="h-4 w-4 text-primary" /> },
    categories: { label: `${t('categoriesSection') || 'Product Categories'} (Categories)`, icon: <Layers className="h-4 w-4 text-primary" /> },
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
              loadedSections = JSON.parse(res.data.homepage_sections);
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
      await api.patch(`/stores/${currentStoreId}/settings/`, {
        homepage_sections: JSON.stringify(sections)
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
      const activeList = [...prev];
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

  const handleImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
      handleUpdateSection(sectionId, { config: { ...currentConfig, image_url: res.data.image_url } });
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
                      {sections.map((section, idx) => {
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
                    <div className="bg-muted/30 rounded-xl p-2 border border-border space-y-1 shadow-md">
                      <button
                        type="button"
                        onClick={() => handleAddSection("text")}
                        className={`flex items-center gap-2 w-full p-2 rounded hover:bg-secondary border border-border text-xs text-foreground bg-transparent transition-colors ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-primary" />
                        <span>{t('customTextDefaultTitle')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection("image")}
                        className={`flex items-center gap-2 w-full p-2 rounded hover:bg-secondary border border-border text-xs text-foreground bg-transparent transition-colors ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        <span>{t('customImageDefaultTitle')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSection("banner")}
                        className={`flex items-center gap-2 w-full p-2 rounded hover:bg-secondary border border-border text-xs text-foreground bg-transparent transition-colors ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>{t('bannerSection')}</span>
                      </button>
                      <button type="button" onClick={() => setShowAddSection(false)} className="text-[10px] text-muted-foreground hover:text-foreground block w-full text-center mt-1">{t('cancel')}</button>
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
              {sections.map((section) => {
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
            <div className="aspect-[9/18.5] w-full bg-slate-900 border-4 border-slate-950 rounded-[2rem] overflow-hidden relative shadow-2xl flex flex-col justify-start">
              {/* Phone Speaker & Camera Bar */}
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-950 flex items-center justify-center z-50">
                <div className="h-1.5 w-12 bg-slate-800 rounded-full"></div>
              </div>

              {/* Scrollable Viewport */}
              <div className="flex-1 overflow-y-auto pt-4 pb-8 space-y-0.5 bg-[#f8fafc] text-slate-900 scrollbar-thin scrollbar-thumb-slate-300" dir={isRtl ? 'rtl' : 'ltr'}>
                {sections.map((section) => {
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
