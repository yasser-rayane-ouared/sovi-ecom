"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Layers, Plus, Trash2, Edit, ExternalLink, Sparkles, AlertCircle, CheckCircle2,
  LayoutTemplate, X, ArrowRight, ArrowLeft, Eye, Settings2, Palette
} from "lucide-react";
import { LANDING_TEMPLATES, type LandingTemplate } from "../../../lib/landing-templates";
import { CANVA_TEMPLATES, type CanvaTemplate } from "../../../lib/canva-templates";

interface PagesProps {
  storeId?: string;
  storeSubdomain?: string;
}

export default function PagesDashboard({ storeId, storeSubdomain }: PagesProps) {
  const router = useRouter();
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;
  const currentStoreSubdomain = storeSubdomain || selectedStore?.subdomain;
  const [pages, setPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LandingTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<"pages" | "canva">("pages");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [productId, setProductId] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPages = () => {
    if (currentStoreId) {
      setLoading(true);
      api.get(`/pages/${currentStoreId}/`)
        .then((res) => {
          setPages(Array.isArray(res.data) ? res.data : (res.data?.results || []));
          return api.get(`/products/${currentStoreId}/`);
        })
        .then((res) => {
          setProducts(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPages();
  }, [currentStoreId]);

  const handleOpenAdd = (template?: LandingTemplate) => {
    setTitle("");
    setSlug("");
    setProductId("");
    setSeoTitle("");
    setSeoDescription("");
    setError("");
    setSuccess("");
    setSelectedTemplate(template || null);
    setTemplateGalleryOpen(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    if (!currentStoreId) {
      setError("No store selected. Please select a store first.");
      setCreating(false);
      return;
    }

    const payload: any = {
      title,
      slug,
      seo_title: seoTitle,
      seo_description: seoDescription,
    };
    if (productId) {
      payload.product = productId;
    }

    try {
      const pageRes = await api.post(`/pages/${currentStoreId}/`, payload);
      const newPageId = pageRes.data.id;

      if (selectedTemplate) {
        for (const section of selectedTemplate.sections) {
          try {
            await api.post(`/pages/${currentStoreId}/${newPageId}/sections/`, {
              section_type: section.section_type,
              position: section.position,
              is_enabled: section.is_enabled,
              config: section.config
            });
          } catch (sectionErr) {
            console.warn("Failed to create section:", section.section_type, sectionErr);
          }
        }
      }

      setSuccess(t("pagesModalCreateFormSubmit"));
      setModalOpen(false);
      fetchPages();

      setTimeout(() => {
        router.push(`/pages/builder?id=${newPageId}`);
      }, 500);
    } catch (err: any) {
      const detail = err?.response?.data;
      let msg = "Failed to create page.";
      if (detail) {
        if (detail.slug) msg += ` Slug: ${detail.slug}`;
        else if (detail.product) msg += ` Product: ${detail.product}`;
        else if (detail.detail) msg += ` ${detail.detail}`;
        else if (typeof detail === 'string') msg += ` ${detail}`;
        else msg += " Please check your inputs.";
      }
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this landing page?")) {
      try {
        await api.delete(`/pages/${currentStoreId}/${id}/`);
        fetchPages();
      } catch (err) {
        alert("An error occurred while deleting the page.");
      }
    }
  };

  const handleUseCanvaTemplate = (canvaTmpl: CanvaTemplate) => {
    const matched = LANDING_TEMPLATES.find((t) => t.id === canvaTmpl.landingTemplateId);
    handleOpenAdd(matched || undefined);
  };

  return (
    <div 
      className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("pagesTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("pagesDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setTemplateGalleryOpen(true)} variant="outline" className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/10">
            <LayoutTemplate className="h-4 w-4" /> {t("pagesUseTemplate")}
          </Button>
          <Button onClick={() => handleOpenAdd()} variant="glow" className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> {t("pagesNewPage")}
          </Button>
        </div>
      </div>

      {success && (
        <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className={`flex border-b border-border/60 gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
        <button
          onClick={() => setActiveTab("pages")}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 relative ${
            activeTab === "pages"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("pagesTabYourPages")}
          {pages.length > 0 && (
            <span className={`${isRtl ? "mr-2" : "ml-2"} px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary`}>
              {pages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("canva")}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 relative flex items-center gap-1.5 ${
            activeTab === "canva"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("pagesTabCanvaTemplates")}
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-500`}>
            {t("pagesBadgeNew")}
          </span>
        </button>
      </div>

      {/* Pages list grid */}
      {activeTab === "pages" && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-secondary border border-border"></div>
            ))}
          </div>
        ) : pages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Card key={page.id} className="border-border bg-card p-0 hover:border-primary/20 transition-all flex flex-col justify-between overflow-hidden group">
                {/* Card Header */}
                <div className="p-6 space-y-3">
                  <div className={`flex items-center justify-between ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`flex items-center gap-2 text-primary ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <Layers className="h-5 w-5" />
                      <span className="text-xs font-bold bg-primary/10 px-2 py-0.5 rounded">{t("pagesCardType")}</span>
                    </div>
                    {page.sections && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-full font-outfit">
                        {t("pagesCardSectionsCount").replace("{count}", page.sections.length.toString())}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg leading-relaxed">{page.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("pagesCardProduct").replace("{product}", page.product_title || t("pagesCardNoProduct"))}
                  </p>
                  <div className="text-xs text-primary font-outfit truncate bg-primary/5 p-2 rounded-lg border border-primary/10" dir="ltr">
                    /{page.slug}
                  </div>
                </div>

                {/* Card Actions */}
                <div className={`flex gap-2 p-4 pt-0 border-t border-border mt-auto ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <Button
                    onClick={() => router.push(`/pages/builder?id=${page.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 border-primary/20 hover:bg-primary/10 text-xs text-primary"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> {t("pagesCardEditBuilder")}
                  </Button>
                  <a
                    href={`http://${currentStoreSubdomain}.localhost:3000/${currentStoreSubdomain}/pages/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 border-border hover:bg-secondary text-xs">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button onClick={() => handleDelete(page.id)} variant="destructive" size="sm" className="px-3">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary/30 border border-border rounded-2xl space-y-4">
            <div className="text-4xl">📄</div>
            <p className="text-muted-foreground">{t("pagesCardNoPages")}</p>
            <Button onClick={() => setTemplateGalleryOpen(true)} variant="glow" className="gap-2">
              <LayoutTemplate className="h-4 w-4" /> {t("pagesCardSelectTemplateBtn")}
            </Button>
          </div>
        )
      )}

      {/* Canva templates grid */}
      {activeTab === "canva" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CANVA_TEMPLATES.map((tmpl) => (
            <Card key={tmpl.id} className="border-border bg-card p-0 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden flex flex-col justify-between group">
              {/* Preview Image */}
              <div className="relative aspect-video w-full bg-slate-900 border-b border-border/40 overflow-hidden">
                <img
                  src={tmpl.previewImageUrl}
                  alt={tmpl.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-primary/90 text-white backdrop-blur-sm shadow-md`}>
                  {tmpl.category}
                </span>
                <span className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} text-3xl filter drop-shadow`}>{tmpl.icon}</span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-grow">
                <div>
                  <h3 className="font-extrabold text-xl leading-relaxed text-foreground group-hover:text-primary transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-muted-foreground">{t("pagesCanvaFeatures")}</span>
                  <div className="flex flex-wrap gap-2">
                    {tmpl.features.map((feat, index) => (
                      <span key={index} className="text-[11px] bg-secondary/80 border border-border px-2.5 py-1 rounded-lg text-foreground/85 flex items-center gap-1">
                        ✨ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className={`flex flex-col sm:flex-row gap-2 p-6 pt-0 border-t border-border/40 mt-auto bg-secondary/10 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <a
                  href={tmpl.canvaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="glow"
                    className="w-full flex items-center justify-center gap-2 text-sm h-11"
                  >
                    <Palette className="h-4 w-4" /> {t("pagesCanvaEditBtn")}
                  </Button>
                </a>
                <Button
                  onClick={() => handleUseCanvaTemplate(tmpl)}
                  variant="outline"
                  className="flex-1 border-primary/20 text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-sm h-11"
                >
                  <LayoutTemplate className="h-4 w-4" /> {t("pagesCanvaUseDirectlyBtn")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Template Gallery Modal ─── */}
      {templateGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setTemplateGalleryOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl backdrop-blur-xl">
            <div className={`p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <div>
                <h3 className={`text-xl font-extrabold flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  {t("pagesModalTmplTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{t("pagesModalTmplDesc")}</p>
              </div>
              <button onClick={() => setTemplateGalleryOpen(false)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {LANDING_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleOpenAdd(tmpl)}
                  className={`text-right p-5 rounded-xl border border-border bg-secondary/20 hover:bg-primary/5 hover:border-primary/30 transition-all group space-y-3 ${isRtl ? "text-right" : "text-left"}`}
                >
                  <div className={`flex items-center justify-between ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <span className="text-3xl group-hover:scale-110 transition-transform">{tmpl.icon}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tmpl.gradient} text-white`}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-foreground">{tmpl.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>
                  <div className={`flex items-center gap-2 text-primary text-xs font-bold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <span>{t("pagesModalTmplSectionsCount").replace("{count}", tmpl.sections.length.toString())}</span>
                    {isRtl ? <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => handleOpenAdd()}
                className="w-full text-center p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> {t("pagesModalTmplBlank")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Page Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <Card className="w-full max-w-lg bg-card border border-border max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl">
            <CardContent className="p-8 space-y-6">
              <div className={`flex justify-between items-center border-b border-border pb-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <Sparkles className="h-5 w-5 text-primary" />
                  {selectedTemplate ? t("pagesModalCreateTitleTmpl").replace("{template}", selectedTemplate.name) : t("pagesModalCreateTitle")}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground text-lg">×</button>
              </div>

              {selectedTemplate && (
                <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedTemplate.gradient} bg-opacity-10 border border-white/10 text-white/90 text-xs`}>
                  <div className={`flex items-center gap-2 mb-1 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <span className="text-lg">{selectedTemplate.icon}</span>
                    <span className="font-bold">{selectedTemplate.name}</span>
                  </div>
                  <p className="opacity-80">
                    {t("pagesModalTmplSectionsCount").replace("{count}", selectedTemplate.sections.length.toString())}
                  </p>
                </div>
              )}

              {error && (
                <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t("pagesModalCreateFormTitle")}</label>
                  <Input required placeholder={t("pagesModalCreateFormTitlePl")} value={title} onChange={(e) => setTitle(e.target.value)} className={`border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl focus:ring-primary/30 focus:border-primary/50 ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t("pagesModalCreateFormSlug")}</label>
                  <Input required placeholder={t("pagesModalCreateFormSeoTitlePl")} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} className={`border-border bg-input text-foreground placeholder:text-muted-foreground/50 font-outfit h-11 rounded-xl focus:ring-primary/30 focus:border-primary/50 ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t("pagesModalCreateFormProduct")}</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className={`flex h-11 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all ${isRtl ? "text-right" : "text-left"}`}
                  >
                    <option value="">{t("pagesModalCreateFormProductNone")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - ({p.price} DZD)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t("pagesModalCreateFormSeoTitle")}</label>
                  <Input placeholder={t("pagesModalCreateFormSeoTitlePl")} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={`border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl focus:ring-primary/30 focus:border-primary/50 ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t("pagesModalCreateFormSeoDesc")}</label>
                  <Input placeholder={t("pagesModalCreateFormSeoDescPl")} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={`border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl focus:ring-primary/30 focus:border-primary/50 ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`} />
                </div>

                <div className={`flex gap-3 justify-end pt-4 border-t border-border ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <Button type="button" onClick={() => setModalOpen(false)} variant="outline" className="border-border hover:bg-secondary">{t("pagesModalCreateFormCancel")}</Button>
                  <Button type="submit" variant="glow" disabled={creating} className="gap-2">
                    {creating ? t("pagesModalCreateFormSubmitting") : selectedTemplate ? t("pagesModalCreateFormSubmitTmpl") : t("pagesModalCreateFormSubmit")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
