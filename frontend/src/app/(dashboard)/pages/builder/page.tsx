"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { useDashboardStore } from "../../../../stores/dashboard";
import { useLanguageStore } from "../../../../stores/language";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  ArrowLeft, GripVertical, Plus, Trash2, Eye, EyeOff, Settings2, Smartphone,
  Monitor, Save, Check, X, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { SECTION_TYPE_META, getDefaultConfig } from "../../../../lib/landing-templates";

interface Section {
  id?: string;
  section_type: string;
  position: number;
  is_enabled: boolean;
  config: Record<string, any>;
  _tempId?: string; // for unsaved sections
}

export default function PageBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedStore } = useDashboardStore();
  const { t, language, isRtl } = useLanguageStore();
  const pageId = searchParams.get("id");
  const storeId = selectedStore?.id;

  const [pageData, setPageData] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const sectionsRef = useRef<Section[]>([]);
  sectionsRef.current = sections;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  // Fetch page data
  useEffect(() => {
    if (storeId && pageId) {
      setLoading(true);
      api.get(`/pages/${storeId}/${pageId}/`)
        .then((res) => {
          setPageData(res.data);
          setSections((res.data.sections || []).sort((a: Section, b: Section) => a.position - b.position));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [storeId, pageId]);

  // Save all sections
  const saveAllSections = useCallback(async () => {
    if (!storeId || !pageId || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      // Reorder positions from current sections ref
      const reorderedSections = sectionsRef.current.map((s, i) => ({ ...s, position: i }));

      // Save new sections (no id)
      for (const s of reorderedSections) {
        if (!s.id) {
          const res = await api.post(`/pages/${storeId}/${pageId}/sections/`, {
            section_type: s.section_type,
            position: s.position,
            is_enabled: s.is_enabled,
            config: s.config
          });
          s.id = res.data.id;
        } else {
          await api.patch(`/pages/${storeId}/${pageId}/sections/${s.id}/`, {
            position: s.position,
            is_enabled: s.is_enabled,
            config: s.config
          });
        }
      }

      // Update positions via reorder endpoint
      await api.post(`/pages/${storeId}/${pageId}/sections/reorder/`, {
        orders: reorderedSections.map(s => ({ id: s.id, position: s.position }))
      });

      setSections(reorderedSections);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save sections:", err);
    } finally {
      setSaving(false);
    }
  }, [storeId, pageId, saving]);

  // Auto-save debounce
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveAllSections();
    }, 2000);
  }, [saveAllSections]);

  // Drag handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...sections];
    const [movedItem] = updated.splice(dragItem.current, 1);
    updated.splice(index, 0, movedItem);

    const reindexed = updated.map((s, i) => ({ ...s, position: i }));
    setSections(reindexed);
    setDragIndex(null);
    setDragOverIndex(null);
    dragItem.current = null;
    triggerAutoSave();
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Add a new section
  const addSection = (sectionType: string) => {
    const newSection: Section = {
      section_type: sectionType,
      position: sections.length,
      is_enabled: true,
      config: getDefaultConfig(sectionType),
      _tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    };
    setSections([...sections, newSection]);
    setAddPanelOpen(false);
    triggerAutoSave();
  };

  // Delete a section
  const deleteSection = async (index: number) => {
    const section = sections[index];
    if (section.id && storeId && pageId) {
      try {
        await api.delete(`/pages/${storeId}/${pageId}/sections/${section.id}/`);
      } catch (err) {
        console.error("Failed to delete section:", err);
      }
    }
    const updated = sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i }));
    setSections(updated);
    if (editingSection && (editingSection.id === section.id || editingSection._tempId === section._tempId)) {
      setEditingSection(null);
    }
  };

  // Toggle section enabled/disabled
  const toggleSection = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], is_enabled: !updated[index].is_enabled };
    setSections(updated);
    triggerAutoSave();
  };

  // Move section up/down
  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    const reindexed = updated.map((s, i) => ({ ...s, position: i }));
    setSections(reindexed);
    triggerAutoSave();
  };

  // Update section config
  const updateSectionConfig = (sectionId: string | undefined, tempId: string | undefined, config: Record<string, any>) => {
    const updated = sections.map(s => {
      if ((sectionId && s.id === sectionId) || (tempId && s._tempId === tempId)) {
        return { ...s, config };
      }
      return s;
    });
    setSections(updated);
    
    // Also update editingSection so the inputs are in sync with the config
    const updatedSection = updated.find(s => (sectionId && s.id === sectionId) || (tempId && s._tempId === tempId));
    if (updatedSection) {
      setEditingSection(updatedSection);
    }
    
    triggerAutoSave();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 text-muted ${isRtl ? "font-cairo" : "font-sans"}`}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p>{t('builderLoading')}</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className={`text-center py-16 text-muted ${isRtl ? "font-cairo" : "font-sans"}`}>
        <p>{t('builderPageNotFound')}</p>
        <Button onClick={() => router.push("/pages")} variant="outline" className="mt-4">{t("builderBackBtn")}</Button>
      </div>
    );
  }

  const meta = SECTION_TYPE_META;

  return (
    <div className={`text-foreground space-y-0 ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Builder Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/pages")} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("builderBackBtn")}
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{pageData.title}</h1>
            <p className="text-xs text-muted-foreground font-outfit">/{pageData.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setMobilePreview(false)}
              className={`p-2 rounded-md transition-all ${!mobilePreview ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={`p-2 rounded-md transition-all ${mobilePreview ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Save */}
          <Button onClick={saveAllSections} disabled={saving} variant="glow" size="sm" className="gap-2 min-w-[120px]">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t('builderSaving')}</>
            ) : saved ? (
              <><Check className="h-4 w-4" /> {t('builderSaved')}</>
            ) : (
              <><Save className="h-4 w-4" /> {t('builderSaveBtn')}</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ─── Canvas Area ─── */}
        <div className="flex-1 min-w-0">
          <div
            className={`mx-auto transition-all duration-500 ${mobilePreview ? "max-w-[375px]" : "max-w-full"}`}
            style={mobilePreview ? { border: "3px solid var(--border)", borderRadius: "2rem", padding: "8px", background: "var(--secondary)" } : {}}
          >
            {/* Sections Canvas */}
            {sections.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-secondary/30">
                <p className="text-muted-foreground text-sm mb-4">{t('builderNoSections')}</p>
                <Button onClick={() => setAddPanelOpen(true)} variant="outline" className="gap-2 text-sm">
                  <Plus className="h-4 w-4" /> {t('builderAddSectionBtn')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => {
                  const sectionMeta = meta[section.section_type] || { label: section.section_type, icon: "📄", desc: "" };
                  const isEditing = editingSection && (
                    (editingSection.id && editingSection.id === section.id) ||
                    (editingSection._tempId && editingSection._tempId === section._tempId)
                  );

                  return (
                    <div
                      key={section.id || section._tempId}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-xl border transition-all duration-200 ${
                        dragIndex === index
                          ? "opacity-40 scale-95 border-primary/40"
                          : dragOverIndex === index
                          ? "border-primary shadow-lg shadow-primary/10 scale-[1.01]"
                          : isEditing
                          ? "border-primary/50 bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
                      } ${!section.is_enabled ? "opacity-50" : ""}`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-3 p-4">
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <span className="text-xl">{sectionMeta.icon}</span>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm">{sectionMeta.label}</h3>
                          <p className="text-xs text-muted-foreground truncate">{sectionMeta.desc}</p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => moveSection(index, "up")} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all">
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button onClick={() => moveSection(index, "down")} disabled={index === sections.length - 1} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 text-muted-foreground hover:text-foreground transition-all">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button onClick={() => toggleSection(index)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                            {section.is_enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setEditingSection(isEditing ? null : section)}
                            className={`p-1.5 rounded-lg transition-all ${isEditing ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                          >
                            <Settings2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteSection(index)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Section Config Mini Preview */}
                      {section.config?.title && (
                        <div className="px-4 pb-3 -mt-1">
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                            {section.config.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add section button at bottom */}
                <button
                  onClick={() => setAddPanelOpen(true)}
                  className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> {t('builderAddSectionNewBtn')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Config Editor Panel ─── */}
        {editingSection && (
          <div className="w-80 flex-shrink-0">
            <Card className="border-border bg-card sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    {t('builderSectionEditTitle')} {meta[editingSection.section_type]?.label}
                  </h3>
                  <button onClick={() => setEditingSection(null)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <SectionConfigEditor
                  section={editingSection}
                  onChange={(config) => updateSectionConfig(editingSection.id, editingSection._tempId, config)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ─── Add Section Modal ─── */}
      {addPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setAddPanelOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {t('builderAddSectionNewBtn')}
              </h3>
              <button onClick={() => setAddPanelOpen(false)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(SECTION_TYPE_META).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{info.icon}</span>
                  <span className="text-xs font-bold text-foreground">{info.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{info.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────────
 * Section Config Editor — renders forms for each type
 * ──────────────────────────────────────────────────── */
function SectionConfigEditor({
  section,
  onChange
}: {
  section: Section;
  onChange: (config: Record<string, any>) => void;
}) {
  const { selectedStore } = useDashboardStore();
  const { t, language, isRtl } = useLanguageStore();
  const storeId = selectedStore?.id;
  const config = section.config || {};
  const type = section.section_type;

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleUpload = async (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeId) return;
    setUploadingField(fieldKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/products/${storeId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange({ ...config, [fieldKey]: res.data.image_url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingField(null);
    }
  };

  const ImageUploadField = ({
    label,
    fieldKey,
    value,
  }: {
    label: string;
    fieldKey: string;
    value: string;
  }) => {
    const isUploading = uploadingField === fieldKey;

    return (
      <div className={`space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
        <FieldLabel>{label}</FieldLabel>
        {value ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-secondary/30 group">
            <img src={value} alt={label} className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                onClick={() => onChange({ ...config, [fieldKey]: "" })}
                variant="destructive"
                size="sm"
                className="text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('removeImage')}
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed border-border rounded-xl bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-all hover:border-primary/40 group">
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {isUploading ? t('saving') : t('uploadFromDevice')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => handleUpload(fieldKey, e)}
            />
          </label>
        )}
      </div>
    );
  };

  const update = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updateArrayItem = (arrayKey: string, index: number, field: string, value: any) => {
    const arr = [...(config[arrayKey] || [])];
    arr[index] = { ...arr[index], [field]: value };
    onChange({ ...config, [arrayKey]: arr });
  };

  const addArrayItem = (arrayKey: string, defaultItem: any) => {
    const arr = [...(config[arrayKey] || []), defaultItem];
    onChange({ ...config, [arrayKey]: arr });
  };

  const removeArrayItem = (arrayKey: string, index: number) => {
    const arr = (config[arrayKey] || []).filter((_: any, i: number) => i !== index);
    onChange({ ...config, [arrayKey]: arr });
  };

  const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-semibold text-muted-foreground block mb-1">{children}</label>
  );

  const TextField = ({ label, value, onChangeValue, placeholder }: { label: string; value: string; onChangeValue: (v: string) => void; placeholder?: string }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input value={value || ""} onChange={(e) => onChangeValue(e.target.value)} placeholder={placeholder} className="text-sm border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
    </div>
  );

  const ToggleField = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <button
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-primary" : "bg-input border border-border"}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "right-0.5" : "right-5"}`} />
      </button>
    </div>
  );

  // Common title/subtitle fields
  const renderTitleFields = () => (
    <>
      <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
      {config.subtitle !== undefined && (
        <TextField label={t("builderEditorSubtitle")} value={config.subtitle} onChangeValue={(v) => update("subtitle", v)} />
      )}
    </>
  );

  switch (type) {
    case "hero":
      return (
        <div className="space-y-3">
          {renderTitleFields()}
          <TextField label={t("builderEditorBadgeText")} value={config.badge_text} onChangeValue={(v) => update("badge_text", v)} placeholder={language === 'ar' ? "مثال: عرض حصري" : (language === 'fr' ? "ex. Offre exclusive" : "e.g. Exclusive offer")} />
          <TextField label={t("builderEditorCtaText")} value={config.cta_text} onChangeValue={(v) => update("cta_text", v)} />
          <ToggleField label={t("builderEditorShowPrice")} value={config.show_price} onToggle={() => update("show_price", !config.show_price)} />
          <ToggleField label={t("builderEditorShowDiscount")} value={config.show_discount} onToggle={() => update("show_discount", !config.show_discount)} />
          <div>
            <FieldLabel>{t("builderEditorBgStyle")}</FieldLabel>
            <select value={config.bg_style || "gradient"} onChange={(e) => update("bg_style", e.target.value)} className="w-full h-10 rounded-xl border border-border bg-input px-3 text-xs text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
              <option value="gradient">{t("builderEditorBgStyleGradient")}</option>
              <option value="dark">{t("builderEditorBgStyleDark")}</option>
              <option value="premium">{t("builderEditorBgStylePremium")}</option>
            </select>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <TextField label={t("builderEditorVideoUrl")} value={config.video_url} onChangeValue={(v) => update("video_url", v)} placeholder="YouTube / TikTok URL" />
          <ToggleField label={t("builderEditorAutoplay")} value={config.autoplay} onToggle={() => update("autoplay", !config.autoplay)} />
          <ToggleField label={t("builderEditorMuted")} value={config.muted} onToggle={() => update("muted", !config.muted)} />
        </div>
      );

    case "reviews":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <FieldLabel>{t("builderEditorReviews")}</FieldLabel>
          {(config.reviews || []).map((r: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl border border-border bg-secondary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">{language === 'ar' ? `تقييم #${idx + 1}` : (language === 'fr' ? `Avis #${idx + 1}` : `Review #${idx + 1}`)}</span>
                <button onClick={() => removeArrayItem("reviews", idx)} className="text-red-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <Input value={r.name || ""} onChange={(e) => updateArrayItem("reviews", idx, "name", e.target.value)} placeholder={t("builderEditorReviewNamePl")} className="text-xs border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              <textarea value={r.text || ""} onChange={(e) => updateArrayItem("reviews", idx, "text", e.target.value)} placeholder={t("builderEditorReviewTextPl")} className="w-full rounded-xl border border-border bg-input p-3 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none h-20 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
          ))}
          <Button onClick={() => addArrayItem("reviews", { name: "", text: "", rating: 5, date: language === 'ar' ? "جديد" : (language === 'fr' ? "Nouveau" : "New") })} variant="outline" size="sm" className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> {t("builderEditorAddReviewBtn")}
          </Button>
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <FieldLabel>{t("builderEditorFaqItems")}</FieldLabel>
          {(config.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl border border-border bg-secondary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">{language === 'ar' ? `سؤال #${idx + 1}` : (language === 'fr' ? `Question #${idx + 1}` : `Question #${idx + 1}`)}</span>
                <button onClick={() => removeArrayItem("items", idx)} className="text-red-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <Input value={item.q || ""} onChange={(e) => updateArrayItem("items", idx, "q", e.target.value)} placeholder={t("builderEditorFaqQPl")} className="text-xs border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              <textarea value={item.a || ""} onChange={(e) => updateArrayItem("items", idx, "a", e.target.value)} placeholder={t("builderEditorFaqAPl")} className="w-full rounded-xl border border-border bg-input p-3 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none h-20 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
          ))}
          <Button onClick={() => addArrayItem("items", { q: "", a: "" })} variant="outline" size="sm" className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> {t("builderEditorAddFaqBtn")}
          </Button>
        </div>
      );

    case "benefits":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <FieldLabel>{t("builderEditorBenefits")}</FieldLabel>
          {(config.items || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl border border-border bg-secondary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">{language === 'ar' ? `ميزة #${idx + 1}` : (language === 'fr' ? `Caractéristique #${idx + 1}` : `Feature #${idx + 1}`)}</span>
                <button onClick={() => removeArrayItem("items", idx)} className="text-red-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-[50px_1fr] gap-2">
                <Input value={item.icon || ""} onChange={(e) => updateArrayItem("items", idx, "icon", e.target.value)} placeholder={t("builderEditorBenefitIconPl")} className="text-xs text-center border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
                <Input value={item.title || ""} onChange={(e) => updateArrayItem("items", idx, "title", e.target.value)} placeholder={t("builderEditorBenefitTitlePl")} className="text-xs border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              </div>
              <Input value={item.desc || ""} onChange={(e) => updateArrayItem("items", idx, "desc", e.target.value)} placeholder={t("builderEditorBenefitDescPl")} className="text-xs border-border bg-input text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
          ))}
          <Button onClick={() => addArrayItem("items", { icon: "✅", title: "", desc: "" })} variant="outline" size="sm" className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> {t("builderEditorAddBenefitBtn")}
          </Button>
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel>{t("builderEditorCountdownHours")}</FieldLabel>
              <Input type="number" value={config.hours ?? 0} onChange={(e) => update("hours", parseInt(e.target.value) || 0)} className="text-xs border-border bg-input text-foreground text-center font-outfit h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
            <div>
              <FieldLabel>{t("builderEditorCountdownMinutes")}</FieldLabel>
              <Input type="number" value={config.minutes ?? 0} onChange={(e) => update("minutes", parseInt(e.target.value) || 0)} className="text-xs border-border bg-input text-foreground text-center font-outfit h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
            <div>
              <FieldLabel>{t("builderEditorCountdownSeconds")}</FieldLabel>
              <Input type="number" value={config.seconds ?? 0} onChange={(e) => update("seconds", parseInt(e.target.value) || 0)} className="text-xs border-border bg-input text-foreground text-center font-outfit h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
          </div>
          <TextField label={t("builderEditorCountdownUrgency")} value={config.urgency_text} onChangeValue={(v) => update("urgency_text", v)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>{t("builderEditorCountdownBg")}</FieldLabel>
              <Input type="color" value={config.bg_color || "#dc2626"} onChange={(e) => update("bg_color", e.target.value)} className="h-10 p-1 border-border bg-input rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
            <div>
              <FieldLabel>{t("builderEditorCountdownText")}</FieldLabel>
              <Input type="color" value={config.text_color || "#ffffff"} onChange={(e) => update("text_color", e.target.value)} className="h-10 p-1 border-border bg-input rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
            </div>
          </div>
        </div>
      );

    case "delivery_info":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <FieldLabel>{t("builderEditorDeliveryItems")}</FieldLabel>
          {(config.items || []).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={item.icon || ""} onChange={(e) => updateArrayItem("items", idx, "icon", e.target.value)} className="w-12 text-center text-xs border-border bg-input text-foreground h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              <Input value={item.text || ""} onChange={(e) => updateArrayItem("items", idx, "text", e.target.value)} className="flex-1 text-xs border-border bg-input text-foreground h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              <button onClick={() => removeArrayItem("items", idx)} className="text-red-400 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button onClick={() => addArrayItem("items", { icon: "📦", text: "" })} variant="outline" size="sm" className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> {t("builderEditorAddDeliveryBtn")}
          </Button>
        </div>
      );

    case "comparison":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <FieldLabel>{t("builderEditorComparisonCols")}</FieldLabel>
          {(config.columns || []).map((col: string, idx: number) => (
            <Input key={idx} value={col} onChange={(e) => {
              const cols = [...(config.columns || [])];
              cols[idx] = e.target.value;
              update("columns", cols);
            }} className="text-xs border-border bg-input text-foreground h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all mb-1" />
          ))}
          <FieldLabel>{t("builderEditorComparisonRows")}</FieldLabel>
          {(config.rows || []).map((row: string[], rIdx: number) => (
            <div key={rIdx} className="p-3 rounded-xl border border-border bg-secondary/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{language === 'ar' ? `صف #${rIdx + 1}` : (language === 'fr' ? `Ligne #${rIdx + 1}` : `Row #${rIdx + 1}`)}</span>
                <button onClick={() => removeArrayItem("rows", rIdx)} className="text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
              {row.map((cell: string, cIdx: number) => (
                <Input key={cIdx} value={cell} onChange={(e) => {
                  const rows = [...(config.rows || [])];
                  rows[rIdx] = [...rows[rIdx]];
                  rows[rIdx][cIdx] = e.target.value;
                  update("rows", rows);
                }} placeholder={config.columns?.[cIdx] || ""} className="text-xs border-border bg-input text-foreground h-10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              ))}
            </div>
          ))}
          <Button onClick={() => addArrayItem("rows", (config.columns || []).map(() => ""))} variant="outline" size="sm" className="w-full text-xs gap-1">
            <Plus className="h-3 w-3" /> {t("builderEditorAddComparisonRowBtn")}
          </Button>
        </div>
      );

    case "before_after":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorTitle")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <TextField label={t("builderEditorBeforeAfterBeforeLabel")} value={config.before_label} onChangeValue={(v) => update("before_label", v)} />
          <TextField label={t("builderEditorBeforeAfterAfterLabel")} value={config.after_label} onChangeValue={(v) => update("after_label", v)} />
          <ImageUploadField
            label={t("builderEditorBeforeAfterBeforeImg")}
            fieldKey="before_image"
            value={config.before_image}
          />
          <ImageUploadField
            label={t("builderEditorBeforeAfterAfterImg")}
            fieldKey="after_image"
            value={config.after_image}
          />
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <TextField label={language === 'ar' ? "العنوان (اختياري)" : (language === 'fr' ? "Titre (facultatif)" : "Title (optional)")} value={config.title} onChangeValue={(v) => update("title", v)} />
          <div>
            <FieldLabel>{t("builderEditorTextContent")}</FieldLabel>
            <textarea
              value={config.content || ""}
              onChange={(e) => update("content", e.target.value)}
              className="w-full rounded-xl border border-border bg-input p-3 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              placeholder={t("builderEditorTextContentPl")}
            />
          </div>
          <div>
            <FieldLabel>{t("builderEditorTextAlign")}</FieldLabel>
            <select value={config.align || "right"} onChange={(e) => update("align", e.target.value)} className="w-full h-10 rounded-xl border border-border bg-input px-3 text-xs text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
              <option value="right">{t("builderEditorTextAlignRight")}</option>
              <option value="center">{t("builderEditorTextAlignCenter")}</option>
              <option value="left">{t("builderEditorTextAlignLeft")}</option>
            </select>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <ImageUploadField
            label={t("builderEditorImageFile")}
            fieldKey="image_url"
            value={config.image_url}
          />
          <TextField label={t("builderEditorImageAlt")} value={config.alt_text} onChangeValue={(v) => update("alt_text", v)} />
          <TextField label={t("builderEditorImageCaption")} value={config.caption} onChangeValue={(v) => update("caption", v)} />
          <ToggleField label={t("builderEditorImageFullWidth")} value={config.full_width} onToggle={() => update("full_width", !config.full_width)} />
        </div>
      );

    case "sticky_cta":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorStickyCtaText")} value={config.text} onChangeValue={(v) => update("text", v)} />
          <ToggleField label={t("builderEditorShowPrice")} value={config.show_price} onToggle={() => update("show_price", !config.show_price)} />
          <div>
            <FieldLabel>{t("builderEditorCountdownBg")}</FieldLabel>
            <Input type="color" value={config.bg_color || "#6366f1"} onChange={(e) => update("bg_color", e.target.value)} className="h-10 p-1 border-border bg-input rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
          </div>
        </div>
      );

    case "floating_order_button":
      return (
        <div className="space-y-3">
          <TextField label={t("builderEditorStickyCtaText")} value={config.text} onChangeValue={(v) => update("text", v)} />
        </div>
      );

    case "quantity_offers":
    case "bundle_offers":
    case "product_gallery":
      return (
        <div className="space-y-3">
          {renderTitleFields()}
          {config.highlight_badge !== undefined && (
            <TextField label={language === 'ar' ? "شارة التمييز" : (language === 'fr' ? "Badge de mise en valeur" : "Highlight Badge")} value={config.highlight_badge || config.highlight_text} onChangeValue={(v) => update(config.highlight_badge !== undefined ? "highlight_badge" : "highlight_text", v)} />
          )}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-muted-foreground">{t("builderEditorQuantityOffersDesc")}</p>
          </div>
        </div>
      );

    default:
      return (
        <div className={`text-center py-6 text-muted-foreground text-xs ${isRtl ? "font-cairo" : "font-sans"}`}>
          <p>{t("builderEditorNoSettings")}</p>
        </div>
      );
  }
}
