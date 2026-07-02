"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { useDashboardStore } from "../../../../stores/dashboard";
import { useLanguageStore } from "../../../../stores/language";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import { Plus, Trash2, Edit2, Image, Sparkles, AlertCircle, GripVertical, EyeOff, Layers, Text, Camera, Star, SplitSquareHorizontal, Gift, CheckSquare, ChevronDown, Palette, Check, Shield, Smartphone, Tablet, Monitor, Tag, ShoppingCart, User, Phone, MapPin, Truck, Save, Loader2 } from "lucide-react";
import { formatCurrency, getFullImageUrl } from "../../../../lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface SortableImageItemProps {
  id: string;
  url: string;
  isPrimary: boolean;
  onDelete: () => void;
}

function SortableImageItem({ id, url, isPrimary, onDelete }: SortableImageItemProps) {
  const { language } = useLanguageStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center group shadow-sm select-none"
    >
      <img src={getFullImageUrl(url)} alt="Product image" className="w-full h-full object-cover pointer-events-none" />
      
      {/* Drag handle area */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing text-white"
      >
        <GripVertical className="h-6 w-6" />
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full shadow z-10">
          {language === 'ar' ? "الرئيسية" : (language === 'fr' ? "Principale" : "Primary")}
        </span>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute bottom-2 left-2 p-1.5 rounded-full bg-red-600/80 hover:bg-red-650 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="حذف الصورة"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}


interface ReviewsSectionEditorProps {
  section: any;
  currentStoreId?: string;
  productId?: string;
  isCreateMode: boolean;
  handleUpdateSection: (id: string, updates: any) => void;
  toggleLayoutSection: (sectionType: string, id: string) => void;
}

function ReviewsSectionEditor({
  section,
  currentStoreId,
  productId,
  isCreateMode,
  handleUpdateSection,
  toggleLayoutSection,
}: ReviewsSectionEditorProps) {
  const { language, isRtl } = useLanguageStore();
  const reviewsConfig = section.config || {};
  const curatedReviews: any[] = reviewsConfig.reviews || [];
  const allowBuyerReviews = reviewsConfig.allow_buyer_reviews !== false;
  const [reviewsEditorTab, setReviewsEditorTab] = React.useState<'curated' | 'buyer'>('curated');
  const [newReview, setNewReview] = React.useState({ reviewer_name: '', reviewer_city: '', rating: 5, body: '', photo_url: '' });
  const [editingReviewIdx, setEditingReviewIdx] = React.useState<number | null>(null);
  const [buyerReviews, setBuyerReviews] = React.useState<any[]>([]);
  const [buyerReviewsLoading, setBuyerReviewsLoading] = React.useState(false);

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...reviewsConfig, [key]: value };
    handleUpdateSection(section.id, { config: newConfig });
  };

  const loadBuyerReviews = async () => {
    if (!currentStoreId || isCreateMode) return;
    setBuyerReviewsLoading(true);
    try {
      const res = await api.get(`/products/${currentStoreId}/${productId}/reviews/`);
      const data = res.data;
      if (Array.isArray(data)) {
        setBuyerReviews(data);
      } else if (data && Array.isArray(data.results)) {
        setBuyerReviews(data.results);
      } else {
        setBuyerReviews([]);
      }
    } catch {}
    finally { setBuyerReviewsLoading(false); }
  };

  const saveReviewsConfig = (updatedReviews: any[], updatedAllowBuyer: boolean) => {
    const newConfig = { ...reviewsConfig, reviews: updatedReviews, allow_buyer_reviews: updatedAllowBuyer };
    handleUpdateSection(section.id, { config: newConfig });
  };

  const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-lg transition-colors ${n <= value ? 'text-amber-400' : 'text-muted-foreground/30'}`}>
          ★
        </button>
      ))}
    </div>
  );

  return (
    <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          <h4 className="font-bold text-sm">{language === 'ar' ? "قسم آراء العملاء" : (language === 'fr' ? "Avis clients" : "Customer Reviews")}</h4>
        </div>
        <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
      </div>

      {/* Allow buyer reviews toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-border">
        <span className="text-xs text-muted-foreground">{language === 'ar' ? "السماح لأي زائر بكتابة تقييم" : (language === 'fr' ? "Autoriser tout visiteur à écrire un avis" : "Allow any visitor to write a review")}</span>
        <button
          type="button"
          onClick={() => saveReviewsConfig(curatedReviews, !allowBuyerReviews)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${allowBuyerReviews ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${allowBuyerReviews ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/20 rounded-lg">
        {(['curated', 'buyer'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => { setReviewsEditorTab(tab); if (tab === 'buyer') loadBuyerReviews(); }}
            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${reviewsEditorTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'curated' ? (language === 'ar' ? `التقييمات المضافة (${curatedReviews.length})` : (language === 'fr' ? `Avis ajoutés (${curatedReviews.length})` : `Added Reviews (${curatedReviews.length})`)) : (language === 'ar' ? 'تقييمات الزوار' : (language === 'fr' ? 'Avis des visiteurs' : 'Visitor Reviews'))}
          </button>
        ))}
      </div>

      {/* CURATED REVIEWS TAB */}
      {reviewsEditorTab === 'curated' && (
        <div className="space-y-4">
          {/* Existing curated reviews list */}
          {curatedReviews.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {curatedReviews.map((r: any, idx: number) => (
                <div key={idx} className={`p-3 rounded-xl border transition-all ${editingReviewIdx === idx ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                  {editingReviewIdx === idx ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="اسم المراجع" value={r.reviewer_name} onChange={e => {
                          const updated = [...curatedReviews]; updated[idx] = { ...r, reviewer_name: e.target.value }; saveReviewsConfig(updated, allowBuyerReviews);
                        }} className="text-xs text-right h-8" />
                        <Input placeholder="المدينة (اختياري)" value={r.reviewer_city || ''} onChange={e => {
                          const updated = [...curatedReviews]; updated[idx] = { ...r, reviewer_city: e.target.value }; saveReviewsConfig(updated, allowBuyerReviews);
                        }} className="text-xs text-right h-8" />
                      </div>
                      <StarPicker value={r.rating} onChange={v => {
                        const updated = [...curatedReviews]; updated[idx] = { ...r, rating: v }; saveReviewsConfig(updated, allowBuyerReviews);
                      }} />
                      <textarea placeholder="نص التقييم..." value={r.body || ''} onChange={e => {
                        const updated = [...curatedReviews]; updated[idx] = { ...r, body: e.target.value }; saveReviewsConfig(updated, allowBuyerReviews);
                      }} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none text-right min-h-[60px]" />
                      <Input placeholder="رابط صورة (اختياري)" value={r.photo_url || ''} onChange={e => {
                        const updated = [...curatedReviews]; updated[idx] = { ...r, photo_url: e.target.value }; saveReviewsConfig(updated, allowBuyerReviews);
                      }} className="text-xs text-right h-8 font-outfit" />
                      <Button type="button" size="sm" variant="glow" className="text-xs w-full h-7" onClick={() => setEditingReviewIdx(null)}>{language === 'ar' ? "حفظ" : (language === 'fr' ? "Enregistrer" : "Save")}</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setEditingReviewIdx(idx)} className="p-1 text-primary hover:bg-primary/10 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => { const updated = curatedReviews.filter((_: any, i: number) => i !== idx); saveReviewsConfig(updated, allowBuyerReviews); }} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs font-bold">{r.reviewer_name}</span>
                          {r.reviewer_city && <span className="text-[10px] text-muted-foreground">{language === 'ar' ? "، " : ", "}{r.reviewer_city}</span>}
                        </div>
                        <div className="flex justify-end text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        {r.body && <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{r.body}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new curated review form */}
          <div className="space-y-2 p-3 bg-muted/5 border border-dashed border-border rounded-xl">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? "إضافة تقييم جديد" : (language === 'fr' ? "Ajouter un avis" : "Add new review")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="اسم المراجع *" value={newReview.reviewer_name} onChange={e => setNewReview(p => ({ ...p, reviewer_name: e.target.value }))} className="text-xs text-right h-8" />
              <Input placeholder="المدينة (اختياري)" value={newReview.reviewer_city} onChange={e => setNewReview(p => ({ ...p, reviewer_city: e.target.value }))} className="text-xs text-right h-8" />
            </div>
            <StarPicker value={newReview.rating} onChange={v => setNewReview(p => ({ ...p, rating: v }))} />
            <textarea
              placeholder="نص التقييم..."
              value={newReview.body}
              onChange={e => setNewReview(p => ({ ...p, body: e.target.value }))}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none text-right min-h-[60px]"
            />
            <Input placeholder="رابط صورة (اختياري https://...)" value={newReview.photo_url} onChange={e => setNewReview(p => ({ ...p, photo_url: e.target.value }))} className="text-xs text-right h-8 font-outfit" />
            <Button
              type="button"
              size="sm"
              variant="glow"
              className="w-full text-xs h-8"
              disabled={!newReview.reviewer_name.trim()}
              onClick={() => {
                if (!newReview.reviewer_name.trim()) return;
                const updated = [...curatedReviews, { ...newReview, id: Date.now() }];
                saveReviewsConfig(updated, allowBuyerReviews);
                setNewReview({ reviewer_name: '', reviewer_city: '', rating: 5, body: '', photo_url: '' });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {language === 'ar' ? "إضافة التقييم" : (language === 'fr' ? "Ajouter l'avis" : "Add Review")}
            </Button>
          </div>
        </div>
      )}

      {/* BUYER REVIEWS TAB */}
      {reviewsEditorTab === 'buyer' && (
        <div className="space-y-3">
          {isCreateMode && (
            <div className="p-4 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl">{language === 'ar' ? "احفظ المنتج أولاً لرؤية تقييمات الزوار." : (language === 'fr' ? "Enregistrez le produit pour voir les avis." : "Save product first to see reviews.")}</div>
          )}
          {!isCreateMode && buyerReviewsLoading && (
            <div className="flex justify-center py-6"><div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          )}
          {!isCreateMode && !buyerReviewsLoading && buyerReviews.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl">{language === 'ar' ? "لا توجد تقييمات من الزوار بعد." : (language === 'fr' ? "Aucun avis pour le moment." : "No visitor reviews yet.")}</div>
          )}
          {!isCreateMode && !buyerReviewsLoading && buyerReviews.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-xl border space-y-1.5 ${r.is_approved ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.patch(`/products/${currentStoreId}/${productId}/reviews/${r.id}/`, { is_approved: !r.is_approved });
                        loadBuyerReviews();
                      } catch {}
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${r.is_approved ? 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10'}`}
                  >
                    {r.is_approved ? (language === 'ar' ? 'إلغاء النشر' : (language === 'fr' ? 'Masquer' : 'Unpublish')) : (language === 'ar' ? 'نشر ✓' : (language === 'fr' ? 'Publier ✓' : 'Publish ✓'))}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.delete(`/products/${currentStoreId}/${productId}/reviews/${r.id}/`);
                        loadBuyerReviews();
                      } catch {}
                    }}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold">{r.reviewer_name}</span>
                  {r.reviewer_city && <span className="text-[10px] text-muted-foreground mr-1">{language === 'ar' ? "، " : ", "}{r.reviewer_city}</span>}
                  <div className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
              </div>
              {r.body && <p className="text-xs text-muted-foreground text-right">{r.body}</p>}
              {r.photo_url && <img src={getFullImageUrl(r.photo_url)} alt="review" className="h-16 rounded-lg object-cover" />}
              <div className={`text-[10px] font-bold ${r.is_approved ? 'text-emerald-500' : 'text-amber-500'}`}>
                {r.is_approved ? (language === 'ar' ? '✓ منشور' : (language === 'fr' ? '✓ Publié' : '✓ Published')) : (language === 'ar' ? '⏳ بانتظار المراجعة' : (language === 'fr' ? '⏳ En attente' : '⏳ Pending Review'))}
              </div>
            </div>
          ))}
          {!isCreateMode && !buyerReviewsLoading && (
            <Button type="button" variant="outline" size="sm" className="w-full text-xs h-7" onClick={loadBuyerReviews}>🔄 {language === 'ar' ? "تحديث" : (language === 'fr' ? "Actualiser" : "Refresh")}</Button>
          )}
        </div>
      )}

      {/* Section Styling & Colors block */}
      <div className="pt-4 border-t border-border space-y-3">
        <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5 font-cairo">
          <Palette className="h-3.5 w-3.5 text-primary" />
          {language === 'ar' ? "ألوان ومظهر القسم" : (language === 'fr' ? "Couleurs et apparence" : "Section Styling & Colors")}
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-right">
            <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color")}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={reviewsConfig.background_color || '#ffffff'}
                onChange={(e) => updateConfig('background_color', e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
              />
              <Input
                value={reviewsConfig.background_color || ''}
                onChange={(e) => updateConfig('background_color', e.target.value)}
                placeholder="#ffffff"
                className="text-xs font-outfit h-9 pr-3 text-right"
              />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون النصوص" : (language === 'fr' ? "Couleur du texte" : "Text Color")}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={reviewsConfig.color || '#1e293b'}
                onChange={(e) => updateConfig('color', e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
              />
              <Input
                value={reviewsConfig.color || ''}
                onChange={(e) => updateConfig('color', e.target.value)}
                placeholder="#1e293b"
                className="text-xs font-outfit h-9 pr-3 text-right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CheckoutSectionEditorProps {
  section: any;
  handleUpdateSection: (id: string, updates: any) => void;
}

function CheckoutSectionEditor({
  section,
  handleUpdateSection,
}: CheckoutSectionEditorProps) {
  const { language, isRtl } = useLanguageStore();
  const config = section.config || {};
  
  // Default values
  const title = config.title ?? (language === 'ar' ? "تقديم طلب شراء (ملء البيانات أدناه)" : (language === 'fr' ? "Passer une commande (remplir les données ci-dessous)" : "Place an Order (fill in the details below)"));
  const button_text = config.button_text ?? (language === 'ar' ? "تأكيد طلب الشراء والدفع عند الاستلام" : (language === 'fr' ? "Confirmer la commande & Paiement à la livraison" : "Confirm Order & Cash on Delivery"));
  const show_address = config.show_address !== false;
  const show_phone2 = config.show_phone2 === true;
  const form_language = config.form_language ?? 'ar';

  const form_bg_color = config.form_bg_color ?? "#ffffff";
  const form_border_color = config.form_border_color ?? "#cbd5e1";
  const labels_text_color = config.labels_text_color ?? "#1e293b";
  const buttons_bg_color = config.buttons_bg_color ?? "#4f46e5";
  const buttons_text_color = config.buttons_text_color ?? "#ffffff";
  const fields_border_color = config.fields_border_color ?? "#cbd5e1";
  const fields_bg_color = config.fields_bg_color ?? "#ffffff";
  const fields_text_color = config.fields_text_color ?? "#1e293b";

  // Sticky CTA config
  const show_sticky_cta = config.show_sticky_cta !== false;
  const sticky_cta_text = config.sticky_cta_text ?? "";
  const sticky_cta_bg_color = config.sticky_cta_bg_color ?? (config.buttons_bg_color ?? "#4f46e5");
  const sticky_cta_text_color = config.sticky_cta_text_color ?? (config.buttons_text_color ?? "#ffffff");

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    handleUpdateSection(section.id, { config: newConfig });
  };

  return (
    <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm font-cairo">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <h4 className="font-bold text-sm">{language === 'ar' ? "استمارة الطلب (Order Form)" : (language === 'fr' ? "Formulaire de commande" : "Order Form")}</h4>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full font-bold">{language === 'ar' ? "قسم أساسي" : (language === 'fr' ? "Section principale" : "Core Section")}</span>
      </div>

      {/* ── Edit Texts ── */}
      <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3">
        <h5 className="font-bold text-xs border-b border-border pb-1.5 text-foreground flex items-center gap-1.5">
          <Text className="h-3.5 w-3.5 text-primary" />
          {language === 'ar' ? "تعديل النصوص" : (language === 'fr' ? "Modifier les textes" : "Edit Texts")}
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground">
              {language === 'ar' ? "عنوان الاستمارة" : (language === 'fr' ? "Titre du formulaire" : "Form Title")}
            </label>
            <Input
              value={title}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="text-xs text-right h-8"
              placeholder={language === 'ar' ? "تقديم طلب شراء..." : "Place an Order..."}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground">
              {language === 'ar' ? "نص زر الطلب" : (language === 'fr' ? "Texte du bouton" : "Button Text")}
            </label>
            <Input
              value={button_text}
              onChange={(e) => updateConfig('button_text', e.target.value)}
              className="text-xs text-right h-8"
              placeholder={language === 'ar' ? "تأكيد الطلب والدفع عند الاستلام" : "Confirm Order..."}
            />
          </div>
        </div>
      </div>

      {/* ── Field Settings ── */}
      <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3.5">
        <h5 className="font-bold text-xs border-b border-border pb-1.5 text-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          {language === 'ar' ? "إعدادات الحقول" : (language === 'fr' ? "Paramètres des champs" : "Field Settings")}
        </h5>

        <div className="space-y-2.5">
          {/* Form Language */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {language === 'ar' ? "لغة الاستمارة" : (language === 'fr' ? "Langue du formulaire" : "Form Language")}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-border text-[10px] font-bold shrink-0" dir="ltr">
              {[
                { value: 'ar', label: 'عربي' },
                { value: 'fr', label: 'FR' },
                { value: 'en', label: 'EN' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateConfig('form_language', opt.value)}
                  className={`px-3 py-1.5 transition-colors duration-200 ${form_language === opt.value ? 'bg-primary text-white' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show Address */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {language === 'ar' ? "حقل العنوان التفصيلي" : (language === 'fr' ? "Champ adresse détaillée" : "Detailed Address Field")}
            </span>
            <button
              type="button"
              onClick={() => updateConfig('show_address', !show_address)}
              className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${show_address ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              dir="ltr"
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${show_address ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Show Second Phone */}
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {language === 'ar' ? "هاتف إضافي (اختياري)" : (language === 'fr' ? "Téléphone secondaire" : "Second Phone (optional)")}
            </span>
            <button
              type="button"
              onClick={() => updateConfig('show_phone2', !show_phone2)}
              className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${show_phone2 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              dir="ltr"
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${show_phone2 ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Note */}
        <p className="text-[10px] text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 leading-relaxed mt-2" dir="auto">
          {language === 'ar'
            ? "💡 الهاتف والولاية والبلدية حقول إلزامية دائماً."
            : (language === 'fr'
              ? "💡 Téléphone, Wilaya et Commune sont toujours obligatoires."
              : "💡 Phone, Wilaya & Commune are always required.")}
        </p>
      </div>

      {/* Colors Customization */}
      <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3">
        <h5 className="font-bold text-xs border-b border-border pb-1.5 text-foreground flex items-center gap-1.5 font-cairo">
          <Palette className="h-3.5 w-3.5 text-primary" />
          {language === 'ar' ? "تخصيص ألوان الاستمارة" : (language === 'fr' ? "Couleurs du formulaire" : "Customize Form Colors")}
        </h5>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { key: "background_color", label: language === 'ar' ? "لون خلفية القسم" : (language === 'fr' ? "Arrière-plan de la section" : "Section Background"), val: config.background_color || "#ffffff" },
            { key: "color", label: language === 'ar' ? "لون نصوص القسم" : (language === 'fr' ? "Texte de la section" : "Section Text"), val: config.color || "#1e293b" },
            { key: "form_bg_color", label: language === 'ar' ? "خلفية الاستمارة" : (language === 'fr' ? "Arrière-plan du formulaire" : "Form Background"), val: form_bg_color },
            { key: "form_border_color", label: language === 'ar' ? "حدود الاستمارة" : (language === 'fr' ? "Bordure du formulaire" : "Form Border"), val: form_border_color },
            { key: "labels_text_color", label: language === 'ar' ? "النصوص والعناوين" : (language === 'fr' ? "Textes et titres" : "Labels & Titles"), val: labels_text_color },
            { key: "fields_bg_color", label: language === 'ar' ? "خلفية حقول الإدخال" : (language === 'fr' ? "Arrière-plan des champs" : "Field Background"), val: fields_bg_color },
            { key: "fields_text_color", label: language === 'ar' ? "نص حقول الإدخال" : (language === 'fr' ? "Texte des champs" : "Field Text"), val: fields_text_color },
            { key: "fields_border_color", label: language === 'ar' ? "حدود حقول الإدخال" : (language === 'fr' ? "Bordure des champs" : "Field Border"), val: fields_border_color },
            { key: "buttons_bg_color", label: language === 'ar' ? "خلفية زر الطلب" : (language === 'fr' ? "Arrière-plan du bouton" : "Button Background"), val: buttons_bg_color },
            { key: "buttons_text_color", label: language === 'ar' ? "نص زر الطلب" : (language === 'fr' ? "Texte du bouton" : "Button Text"), val: buttons_text_color },
          ].map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-1.5 p-3 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all"
            >
              {/* Color Label */}
              <span className="text-[10px] font-bold text-muted-foreground font-cairo leading-tight">
                {item.label}
              </span>

              {/* Color Picker & Hex Input row */}
              <div className="flex items-center gap-1.5" dir="ltr">
                {/* Color swatch */}
                <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform flex-shrink-0">
                  <input
                    type="color"
                    value={item.val}
                    onChange={(e) => updateConfig(item.key, e.target.value)}
                    className="absolute inset-0 h-full w-full scale-150 cursor-pointer border-0 p-0"
                  />
                </div>

                {/* Hex text input */}
                <input
                  type="text"
                  value={item.val.replace("#", "")}
                  maxLength={6}
                  onChange={(e) => {
                    const hexVal = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(hexVal)) {
                      updateConfig(item.key, "#" + hexVal);
                    }
                  }}
                  className="flex-1 min-w-0 text-[10px] font-bold font-mono uppercase bg-background border border-input rounded px-1.5 py-0.5 h-7 text-center focus:border-primary focus-visible:outline-none"
                  placeholder="FFFFFF"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Sticky CTA Button Settings ===== */}
      <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <h5 className="font-bold text-xs text-foreground font-cairo flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-primary" />
            {language === 'ar' ? "زر الطلب العائم (Sticky CTA)" : (language === 'fr' ? "Bouton flottant (Sticky CTA)" : "Floating Button (Sticky CTA)")}
          </h5>
          {/* Active/Inactive toggle */}
          <button
            type="button"
            onClick={() => updateConfig('show_sticky_cta', !show_sticky_cta)}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
              show_sticky_cta ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            dir="ltr"
          >
            <span className={`h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${show_sticky_cta ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {show_sticky_cta && (
          <div className="space-y-3">
            {/* Custom button text */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground">{language === 'ar' ? "نص الزر العائم" : (language === 'fr' ? "Texte du bouton flottant" : "Floating Button Text")}</label>
              <input
                type="text"
                value={sticky_cta_text}
                onChange={(e) => updateConfig('sticky_cta_text', e.target.value)}
                placeholder={button_text || (language === 'ar' ? 'تأكيد طلب الشراء...' : (language === 'fr' ? 'Confirmer l\'achat...' : 'Confirm purchase...'))}
                className="w-full text-xs text-right h-8 rounded-lg border border-border bg-input px-3 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-cairo"
              />
              <p className="text-[10px] text-muted-foreground">{language === 'ar' ? "اتركه فارغاً لاستخدام نص زر الاستمارة" : (language === 'fr' ? "Laisser vide pour utiliser le texte du formulaire" : "Leave empty to use form button text")}</p>
            </div>

            {/* Color rows in a 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "sticky_cta_bg_color", label: language === 'ar' ? "خلفية الزر العائم" : (language === 'fr' ? "Arrière-plan du bouton flottant" : "Floating Button Background"), val: sticky_cta_bg_color },
                { key: "sticky_cta_text_color", label: language === 'ar' ? "نص الزر العائم" : (language === 'fr' ? "Texte du bouton flottant" : "Floating Button Text"), val: sticky_cta_text_color },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all text-right"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-3 w-3 rounded-full border border-border/50 flex-shrink-0" style={{ backgroundColor: item.val }} />
                    <span className="text-[11px] font-bold text-foreground font-cairo truncate">{item.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                    {/* Hex Input */}
                    <input
                      type="text"
                      value={item.val.replace('#', '')}
                      maxLength={6}
                      onChange={(e) => {
                        const hexVal = e.target.value;
                        if (/^[0-9A-Fa-f]{0,6}$/.test(hexVal)) {
                          updateConfig(item.key, '#' + hexVal);
                        }
                      }}
                      className="w-14 text-[10px] font-bold font-mono uppercase bg-background border border-input rounded px-1 py-0.5 h-7 text-center focus:border-primary focus-visible:outline-none"
                      placeholder="FFFFFF"
                    />
                    
                    {/* Color Picker */}
                    <div className="relative h-7 w-7 rounded-lg overflow-hidden border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform flex-shrink-0">
                      <input
                        type="color"
                        value={item.val}
                        onChange={(e) => updateConfig(item.key, e.target.value)}
                        className="absolute inset-0 h-full w-full scale-150 cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live preview of the sticky button */}
            <div className="mt-2 p-3 bg-muted/5 rounded-xl border border-dashed border-border text-center">
              <p className="text-[10px] text-muted-foreground mb-2">{language === 'ar' ? "معاينة الزر العائم:" : (language === 'fr' ? "Aperçu du bouton flottant :" : "Floating Button Preview:")}</p>
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black font-cairo shadow transition-all duration-200 hover:scale-[1.02]"
                style={{ backgroundColor: sticky_cta_bg_color, color: sticky_cta_text_color }}
              >
                <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                <span>{sticky_cta_text || button_text || (language === 'ar' ? 'اطلب الآن' : (language === 'fr' ? 'Commander' : 'Order Now'))}</span>
              </div>
            </div>
          </div>
        )}

        {!show_sticky_cta && (
          <p className="text-[10px] text-muted-foreground text-center py-1">{language === 'ar' ? "الزر العائم معطّل حالياً — فعّله لإظهاره في صفحة المنتج." : (language === 'fr' ? "Bouton flottant désactivé — activez-le pour l'afficher." : "Floating button is disabled — enable it to show.")}</p>
        )}
      </div>
    </div>
  );
}

interface ProductFormProps {
  storeId?: string;
}

export default function ProductFormPage({ storeId }: ProductFormProps) {
  const { language, isRtl, t } = useLanguageStore();
  const params = useParams();
  const router = useRouter();
  const { selectedStore } = useDashboardStore();
  const currentStoreId = storeId || selectedStore?.id;
  const productId = params.id as string;
  const isCreateMode = productId === "new";

  const [loading, setLoading] = useState(!isCreateMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [adCostPerOrder, setAdCostPerOrder] = useState("");
  const [stock, setStock] = useState("100");
  const [primaryImage, setPrimaryImage] = useState("");
  const [images, setImages] = useState<{ id?: string; clientId: string; image_url: string; alt_text?: string; position: number; is_primary: boolean }[]>([]);
  const [directImageUrl, setDirectImageUrl] = useState("");

  // Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState<{ name: string; values: string[]; inputVal?: string }[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<{
    id?: string;
    name: string;
    price: string;
    sku: string;
    stock_quantity: string;
    is_active: boolean;
    image_url: string;
    options: { option_type: string; label: string; value: string }[];
  }[]>([]);

  const [description, setDescription] = useState("");

  // Quantity offers
  const [quantityOffers, setQuantityOffers] = useState<{ quantity: number; price: number; label: string }[]>([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerQty, setOfferQty] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  // Section builder
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [sectionUploading, setSectionUploading] = useState<string | null>(null);

  // Pending sections for creation mode
  const [pendingSections, setPendingSections] = useState<any[]>([]);

  // Theme
  const [selectedTheme, setSelectedTheme] = useState("");
  const [showThemePicker, setShowThemePicker] = useState(false);

  // A/B Layout Testing States
  const [enableAbTest, setEnableAbTest] = useState(false);
  const [abTestProductBId, setAbTestProductBId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [abTestStats, setAbTestStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [activeSections, setActiveSections] = useState({
    basicInfo: true,
    pricing: true,
    profitability: false,
    media: false,
    description: false,
    offers: false,
    pageSections: false,
    theme: false,
    abTesting: false,
  });

  // Viewport and Draft state
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<any>(null);
  const [shouldAutoSave, setShouldAutoSave] = useState(false);

  // Heatmap CTR state
  const [heatmapData, setHeatmapData] = useState<Record<string, { ctr: number; clicks: number; impressions: number; click_thru_rate: number; score: number }>>({});
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const renderHeatmapBadge = (sectionType: string) => {
    if (isCreateMode) return null;
    
    const stats = heatmapData[sectionType];
    if (!stats || stats.impressions === 0) {
      return (
        <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded font-outfit" title="لا توجد بيانات تفاعل بعد">
          —
        </span>
      );
    }

    const ctr = stats.ctr;
    let bgClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    let icon = "❄️";
    if (ctr >= 40) {
      bgClass = "bg-red-500/10 text-red-400 border-red-500/20";
      icon = "🔥";
    } else if (ctr >= 20) {
      bgClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      icon = "⚡";
    }

    return (
      <span 
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-outfit border ${bgClass}`}
        title={language === 'ar' ? `${ctr}% من الزوار الذين شاهدوا المنتج مروا بهذا القسم (${stats.impressions} مشاهدة، ${stats.clicks} نقرة)` : (language === 'fr' ? `${ctr}% des visiteurs qui ont vu le produit ont fait défiler (${stats.impressions} vues, ${stats.clicks} clics)` : `${ctr}% of visitors who saw the product scrolled to this section (${stats.impressions} views, ${stats.clicks} clicks)`)}
      >
        <span>{icon}</span>
        <span>{ctr}%</span>
      </span>
    );
  };

  // Check for draft on mount/storeId load or variant switch
  useEffect(() => {
    if (typeof window === "undefined" || !productId || !currentStoreId) return;
    setHasDraft(false);
    setDraftToRestore(null);
    const activeId = activeTab === 'A' ? productId : abTestProductBId;
    if (!activeId) return;
    const key = `sovi_product_draft_${activeId}_${currentStoreId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.price || parsed.description) {
          setDraftToRestore(parsed);
          setHasDraft(true);
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [productId, currentStoreId, activeTab, abTestProductBId]);

  // Enable auto-save after initial loading is complete
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShouldAutoSave(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShouldAutoSave(false);
    }
  }, [loading]);

  // Auto-save effect
  useEffect(() => {
    if (!shouldAutoSave || typeof window === "undefined" || !productId || !currentStoreId) return;
    const activeId = activeTab === 'A' ? productId : abTestProductBId;
    if (!activeId) return;
    
    const key = `sovi_product_draft_${activeId}_${currentStoreId}`;
    const draftData = {
      title,
      price,
      comparePrice,
      costPrice,
      adCostPerOrder,
      stock,
      selectedCategory,
      sku,
      description,
      images,
      quantityOffers,
      selectedTheme,
      variantAttributes,
      variantCombinations,
      hasVariants,
      pendingSections,
    };
    
    localStorage.setItem(key, JSON.stringify(draftData));
  }, [
    shouldAutoSave,
    title,
    price,
    comparePrice,
    costPrice,
    adCostPerOrder,
    stock,
    selectedCategory,
    sku,
    description,
    images,
    quantityOffers,
    selectedTheme,
    variantAttributes,
    variantCombinations,
    hasVariants,
    pendingSections,
    productId,
    currentStoreId,
    activeTab,
    abTestProductBId
  ]);

  const handleRestoreDraft = () => {
    if (!draftToRestore) return;
    const d = draftToRestore;
    if (d.title !== undefined) setTitle(d.title);
    if (d.price !== undefined) setPrice(d.price);
    if (d.comparePrice !== undefined) setComparePrice(d.comparePrice);
    if (d.costPrice !== undefined) setCostPrice(d.costPrice);
    if (d.adCostPerOrder !== undefined) setAdCostPerOrder(d.adCostPerOrder);
    if (d.stock !== undefined) setStock(d.stock);
    if (d.selectedCategory !== undefined) setSelectedCategory(d.selectedCategory);
    if (d.sku !== undefined) setSku(d.sku);
    if (d.description !== undefined) setDescription(d.description);
    if (d.images !== undefined) setImages(d.images);
    if (d.quantityOffers !== undefined) setQuantityOffers(d.quantityOffers);
    if (d.selectedTheme !== undefined) setSelectedTheme(d.selectedTheme);
    if (d.variantAttributes !== undefined) setVariantAttributes(d.variantAttributes);
    if (d.variantCombinations !== undefined) setVariantCombinations(d.variantCombinations);
    if (d.hasVariants !== undefined) setHasVariants(d.hasVariants);
    if (d.pendingSections !== undefined) setPendingSections(d.pendingSections);
    
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    if (typeof window !== "undefined" && productId && currentStoreId) {
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      if (activeId) {
        const key = `sovi_product_draft_${activeId}_${currentStoreId}`;
        localStorage.removeItem(key);
      }
    }
    setHasDraft(false);
    setDraftToRestore(null);
  };

  const themeCatalog = [
    {
      id: 'theme-minimal',
      name: language === 'ar' ? 'كلاسيكي بسيط' : (language === 'fr' ? 'Minimal' : 'Minimal'),
      nameEn: 'Minimal',
      description: language === 'ar' ? 'تصميم نظيف وبسيط مع خطوط أنيقة' : (language === 'fr' ? 'Design épuré et simple' : 'Clean and simple design'),
      colors: { bg: '#ffffff', text: '#111111', accent: '#666666', btn: '#111111' },
    },
    {
      id: 'theme-direct-offer',
      name: language === 'ar' ? 'عرض مباشر' : (language === 'fr' ? 'Offre Directe' : 'Direct Offer'),
      nameEn: 'Direct Offer',
      description: language === 'ar' ? 'تصميم جريء لصفحات العروض والتخفيضات' : (language === 'fr' ? 'Design audacieux pour offres et rabais' : 'Bold design for offers and discounts'),
      colors: { bg: '#ffffff', text: '#000000', accent: '#d00000', btn: '#ffc300' },
    },
    {
      id: 'theme-classic-luxury',
      name: language === 'ar' ? 'فخامة كلاسيكية' : (language === 'fr' ? 'Luxe Classique' : 'Classic Luxury'),
      nameEn: 'Classic Luxury',
      description: language === 'ar' ? 'خلفية داكنة مع لمسات ذهبية فاخرة' : (language === 'fr' ? 'Fond sombre et accents dorés' : 'Dark background with gold accents'),
      colors: { bg: '#0a0a0a', text: '#f4f4f4', accent: '#c5a059', btn: '#c5a059' },
    },
    {
      id: 'theme-raw-authentic',
      name: language === 'ar' ? 'أصيل وبسيط' : (language === 'fr' ? 'Brut & Authentique' : 'Raw Authentic'),
      nameEn: 'Raw Authentic',
      description: language === 'ar' ? 'مظهر خام وطبيعي بخط أحادي المسافة' : (language === 'fr' ? 'Design brut avec police monospace' : 'Raw design with monospace font'),
      colors: { bg: '#fafafa', text: '#222222', accent: '#222222', btn: '#e0e0e0' },
    },
    {
      id: 'theme-brutalist',
      name: language === 'ar' ? 'بروتاليست' : (language === 'fr' ? 'Brutaliste' : 'Brutalist'),
      nameEn: 'Brutalist',
      description: language === 'ar' ? 'تصميم صارم وقوي بأسلوب معماري حديث' : (language === 'fr' ? 'Style architectural moderne et brut' : 'Modern brutalist style'),
      colors: { bg: '#e6e6e6', text: '#000000', accent: '#0000ff', btn: '#000000' },
    },
    {
      id: 'theme-soft-eco',
      name: language === 'ar' ? 'طبيعي ناعم' : (language === 'fr' ? 'Doux Éco' : 'Soft Eco'),
      nameEn: 'Soft Eco',
      description: language === 'ar' ? 'ألوان طبيعية هادئة مستوحاة من البيئة' : (language === 'fr' ? 'Couleurs douces et naturelles éco' : 'Soft natural ecological colors'),
      colors: { bg: '#f4f7f4', text: '#3e4a3d', accent: '#6b8e6b', btn: '#6b8e6b' },
    },
    {
      id: 'theme-glass',
      name: language === 'ar' ? 'زجاجي عصري' : (language === 'fr' ? 'Verre Moderne' : 'Modern Glass'),
      nameEn: 'Glass',
      description: language === 'ar' ? 'تأثير الزجاج مع خلفية داكنة متدرجة' : (language === 'fr' ? 'Effet verre dépoli et fond sombre' : 'Frosted glass effect and dark bg'),
      colors: { bg: '#1e1e2f', text: '#ffffff', accent: '#00f0ff', btn: 'rgba(255,255,255,0.1)' },
    },
    {
      id: 'theme-playful',
      name: language === 'ar' ? 'مرح وممتع' : (language === 'fr' ? 'Ludique' : 'Playful'),
      nameEn: 'Playful',
      description: language === 'ar' ? 'ألوان وردية مرحة مع حركات ديناميكية' : (language === 'fr' ? 'Couleurs roses et mouvements vifs' : 'Playful pink colors and lively motions'),
      colors: { bg: '#fff0f5', text: '#505050', accent: '#ff69b4', btn: '#ff69b4' },
    },
  ];

  const PREVIEW_THEME_STYLES: Record<string, React.CSSProperties> = {
    'theme-minimal': {
      '--theme-bg': '#ffffff',
      '--theme-text': '#111111',
      '--theme-accent': '#666666',
      '--theme-font': "Cairo, sans-serif",
      '--theme-btn-bg': '#111111',
      '--theme-btn-text': '#ffffff',
      '--theme-btn-hover-bg': '#333333',
      '--theme-btn-radius': '8px',
      '--theme-img-radius': '12px',
      '--theme-card-bg': '#f8f8f8',
      '--theme-card-border': '#e5e5e5',
      '--theme-section-radius': '16px',
    } as any,
    'theme-direct-offer': {
      '--theme-bg': '#ffffff',
      '--theme-text': '#000000',
      '--theme-accent': '#d00000',
      '--theme-font': "Arial, sans-serif",
      '--theme-btn-bg': '#ffc300',
      '--theme-btn-text': '#000000',
      '--theme-btn-hover-bg': '#ffaa00',
      '--theme-btn-radius': '6px',
      '--theme-btn-border': '2px solid #000',
      '--theme-btn-shadow': '4px 4px 0px #000',
      '--theme-img-radius': '0',
      '--theme-card-bg': '#fff8e8',
      '--theme-card-border': '#ffc300',
      '--theme-section-radius': '4px',
      '--theme-title-transform': 'uppercase',
      '--theme-title-weight': '900',
    } as any,
    'theme-classic-luxury': {
      '--theme-bg': '#0a0a0a',
      '--theme-text': '#f4f4f4',
      '--theme-accent': '#c5a059',
      '--theme-font': "Georgia, serif",
      '--theme-btn-bg': 'transparent',
      '--theme-btn-text': '#c5a059',
      '--theme-btn-hover-bg': '#c5a059',
      '--theme-btn-hover-text': '#0a0a0a',
      '--theme-btn-radius': '0',
      '--theme-btn-border': '1px solid #c5a059',
      '--theme-img-radius': '0',
      '--theme-card-bg': '#141414',
      '--theme-card-border': '#2a2a2a',
      '--theme-section-radius': '0',
      '--theme-title-weight': '400',
    } as any,
    'theme-raw-authentic': {
      '--theme-bg': '#fafafa',
      '--theme-text': '#222222',
      '--theme-accent': '#222222',
      '--theme-font': "Courier New, monospace",
      '--theme-btn-bg': '#e0e0e0',
      '--theme-btn-text': '#222222',
      '--theme-btn-hover-bg': '#cccccc',
      '--theme-btn-radius': '4px',
      '--theme-btn-border': '1px solid #222',
      '--theme-img-radius': '0',
      '--theme-img-border': '1px solid #e0e0e0',
      '--theme-card-bg': '#f0f0f0',
      '--theme-card-border': '#d0d0d0',
      '--theme-section-radius': '2px',
    } as any,
    'theme-brutalist': {
      '--theme-bg': '#e6e6e6',
      '--theme-text': '#000000',
      '--theme-accent': '#0000ff',
      '--theme-font': "Impact, sans-serif",
      '--theme-btn-bg': '#000000',
      '--theme-btn-text': '#ffffff',
      '--theme-btn-hover-bg': '#0000ff',
      '--theme-btn-radius': '0',
      '--theme-img-radius': '0',
      '--theme-img-border': '3px solid #000',
      '--theme-card-bg': '#d6d6d6',
      '--theme-card-border': '#000000',
      '--theme-section-radius': '0',
      '--theme-title-transform': 'uppercase',
      '--theme-title-size': '2rem',
    } as any,
    'theme-soft-eco': {
      '--theme-bg': '#f4f7f4',
      '--theme-text': '#3e4a3d',
      '--theme-accent': '#6b8e6b',
      '--theme-font': "Georgia, serif",
      '--theme-btn-bg': '#6b8e6b',
      '--theme-btn-text': '#ffffff',
      '--theme-btn-hover-bg': '#5a7a5a',
      '--theme-btn-radius': '50px',
      '--theme-btn-shadow': '0 10px 20px rgba(107, 142, 107, 0.2)',
      '--theme-img-radius': '20px',
      '--theme-card-bg': '#eaf0ea',
      '--theme-card-border': '#c8d8c8',
      '--theme-section-radius': '20px',
    } as any,
    'theme-glass': {
      '--theme-bg': '#1e1e2f',
      '--theme-text': '#ffffff',
      '--theme-accent': '#00f0ff',
      '--theme-font': "sans-serif",
      '--theme-btn-bg': 'rgba(255, 255, 255, 0.1)',
      '--theme-btn-text': '#00f0ff',
      '--theme-btn-hover-bg': 'rgba(255, 255, 255, 0.2)',
      '--theme-btn-radius': '12px',
      '--theme-btn-border': '1px solid rgba(255, 255, 255, 0.2)',
      '--theme-btn-shadow': '0 4px 30px rgba(0, 0, 0, 0.1)',
      '--theme-img-radius': '12px',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.05)',
      '--theme-card-border': 'rgba(255, 255, 255, 0.1)',
      '--theme-section-radius': '16px',
      '--theme-card-backdrop': 'blur(10px)',
    } as any,
    'theme-playful': {
      '--theme-bg': '#fff0f5',
      '--theme-text': '#505050',
      '--theme-accent': '#ff69b4',
      '--theme-font': "sans-serif",
      '--theme-btn-bg': '#ff69b4',
      '--theme-btn-text': '#ffffff',
      '--theme-btn-hover-bg': '#ff1493',
      '--theme-btn-radius': '30px',
      '--theme-img-radius': '30px',
      '--theme-card-bg': '#fff5f9',
      '--theme-card-border': '#ffc0d9',
      '--theme-section-radius': '24px',
    } as any,
  };

  const sectionTypeMeta: Record<string, { label: string; icon: React.ReactNode; customEditor?: boolean; fields: { key: string; label: string; type: string }[] }> = {
    product_info: {
      label: language === 'ar' ? "معلومات المنتج (الاسم، السعر، الصورة)" : (language === 'fr' ? "Infos produit (Nom, Prix, Image)" : "Product Info (Name, Price, Image)"),
      icon: <Layers className="h-4 w-4" />,
      fields: [],
    },
    security_captcha: {
      label: language === 'ar' ? "أمان: كابتشا Google reCAPTCHA v3" : (language === 'fr' ? "Sécurité : Google reCAPTCHA v3" : "Security: Google reCAPTCHA v3"),
      icon: <Shield className="h-4 w-4" />,
      fields: [],
    },
    security_otp: {
      label: language === 'ar' ? "أمان: التحقق عبر الهاتف SMS OTP" : (language === 'fr' ? "Sécurité : Code SMS OTP" : "Security: SMS OTP Verification"),
      icon: <Shield className="h-4 w-4" />,
      fields: [],
    },
    security_rate_limit: {
      label: language === 'ar' ? "أمان: حد أقصى للطلبات اليومية لكل IP" : (language === 'fr' ? "Sécurité : Limite de commandes par IP" : "Security: Daily orders limit per IP"),
      icon: <Shield className="h-4 w-4" />,
      fields: [],
    },
    security_algerian_ip: {
      label: language === 'ar' ? "أمان: حظر الطلبات من خارج الجزائر" : (language === 'fr' ? "Sécurité : Bloquer hors Algérie" : "Security: Block outside Algeria"),
      icon: <Shield className="h-4 w-4" />,
      fields: [],
    },
    security_commitment: {
      label: language === 'ar' ? "أمان: التزام العميل بجدية الطلب" : (language === 'fr' ? "Sécurité : Engagement du client" : "Security: Customer Commitment Checkbox"),
      icon: <Shield className="h-4 w-4" />,
      customEditor: true,
      fields: [],
    },
    custom_html: {
      label: language === 'ar' ? "كود HTML مخصص" : (language === 'fr' ? "Code HTML personnalisé" : "Custom HTML Code"),
      icon: <Layers className="h-4 w-4" />,
      customEditor: true,
      fields: [],
    },
    quantity_offers: {
      label: language === 'ar' ? "عروض الكمية (التخفيضات)" : (language === 'fr' ? "Offres de quantité (Réductions)" : "Quantity Offers (Discounts)"),
      icon: <Gift className="h-4 w-4" />,
      fields: [],
    },
    checkout: {
      label: language === 'ar' ? "استمارة الطلب (الدفع عند الاستلام)" : (language === 'fr' ? "Formulaire de commande (COD)" : "Order Form (Cash on Delivery)"),
      icon: <CheckSquare className="h-4 w-4" />,
      fields: [],
    },
    text: {
      label: language === 'ar' ? "نص مخصص" : (language === 'fr' ? "Texte personnalisé" : "Custom Text"),
      icon: <Text className="h-4 w-4" />,
      customEditor: true,
      fields: [
        { key: "background_color", label: language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color"), type: "color" },
      ],
    },
    image: {
      label: language === 'ar' ? "صورة / كاروسيل" : (language === 'fr' ? "Image / Carrousel" : "Image / Carousel"),
      icon: <Camera className="h-4 w-4" />,
      fields: [
        { key: "image", label: language === 'ar' ? "الصورة" : (language === 'fr' ? "Image" : "Image"), type: "image" },
        { key: "caption", label: language === 'ar' ? "التسمية التوضيحية" : (language === 'fr' ? "Légende" : "Caption"), type: "text" },
      ],
    },
    reviews: {
      label: language === 'ar' ? "آراء العملاء" : (language === 'fr' ? "Avis clients" : "Customer Reviews"),
      icon: <Star className="h-4 w-4" />,
      fields: [],
    },
    before_after: {
      label: language === 'ar' ? "مقارنة قبل / بعد" : (language === 'fr' ? "Avant / Après" : "Before / After"),
      icon: <SplitSquareHorizontal className="h-4 w-4" />,
      fields: [
        { key: "before", label: language === 'ar' ? "صورة قبل" : (language === 'fr' ? "Image Avant" : "Before Image"), type: "image" },
        { key: "after", label: language === 'ar' ? "صورة بعد" : (language === 'fr' ? "Image Après" : "After Image"), type: "image" },
      ],
    },
    bundles: {
      label: language === 'ar' ? "باقة منتجات" : (language === 'fr' ? "Pack produit" : "Product Bundle"),
      icon: <Gift className="h-4 w-4" />,
      fields: [],
    },
    features: {
      label: language === 'ar' ? "مميزات المنتج" : (language === 'fr' ? "Caractéristiques" : "Product Features"),
      icon: <CheckSquare className="h-4 w-4" />,
      fields: [
        { key: "features", label: language === 'ar' ? "المميزات (مفصولة بسطر جديد)" : (language === 'fr' ? "Caractéristiques (ligne par ligne)" : "Features (newline separated)"), type: "textarea" },
      ],
    },
    footer: {
      label: language === 'ar' ? "تذييل الصفحة (Footer)" : (language === 'fr' ? "Pied de page (Footer)" : "Page Footer (Footer)"),
      icon: <Layers className="h-4 w-4" />,
      customEditor: true,
      fields: [
        { key: "background_color", label: language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color"), type: "color" },
      ],
    },
    header: {
      label: language === 'ar' ? "ترويسة الصفحة (Header)" : (language === 'fr' ? "En-tête de page (Header)" : "Page Header (Header)"),
      icon: <Layers className="h-4 w-4" />,
      customEditor: true,
      fields: [
        { key: "background_color", label: language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color"), type: "color" },
      ],
    },
    coupon: {
      label: language === 'ar' ? "قسيمة خصم (Coupon)" : (language === 'fr' ? "Coupon de réduction (Coupon)" : "Discount Coupon (Coupon)"),
      icon: <Tag className="h-4 w-4" />,
      fields: [
        { key: "code", label: language === 'ar' ? "كود الخصم" : (language === 'fr' ? "Code promo" : "Promo Code"), type: "text" },
        { key: "discount_percent", label: language === 'ar' ? "نسبة الخصم (%)" : (language === 'fr' ? "Remise (%)" : "Discount (%)"), type: "text" },
      ],
    },
  };

  useEffect(() => {
    if (!currentStoreId) return;

    // Load categories list
    api.get(`/products/${currentStoreId}/categories/`)
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : (res.data?.results || []));
      })
      .catch(() => {});

    if (isCreateMode) {
      // Creation Mode Initialization
      setTitle("");
      setSku("");
      setPrice("");
      setComparePrice("");
      setCostPrice("");
      setAdCostPerOrder("");
      setStock("100");
      setPrimaryImage("");
      setImages([]);
      setHasVariants(false);
      setVariantAttributes([]);
      setVariantCombinations([]);
      setDescription("");
      setError("");
      setSections([]);
      setPendingSections([
        { id: 'pending-header', section_type: 'header', config: { content: selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store")), background_color: "#ffffff", color: "#111111", text_align: isRtl ? "right" : "left", font_size: "18px" }, order: 0 },
        { id: 'pending-info', section_type: 'product_info', config: {}, order: 1 },
        { id: 'pending-checkout', section_type: 'checkout', config: { show_address: true }, order: 2 },
        { id: 'pending-footer', section_type: 'footer', config: { content: language === 'ar' ? "© جميع الحقوق محفوظة" : (language === 'fr' ? "© Tous droits réservés" : "© All rights reserved"), background_color: "#ffffff", color: "#666666", text_align: "center", font_size: "14px" }, order: 3 }
      ]);
      setQuantityOffers([]);
      setSelectedTheme("");
      setShowThemePicker(false);
      setActiveSections({
        basicInfo: true,
        pricing: true,
        profitability: false,
        media: false,
        description: false,
        offers: false,
        pageSections: false,
        theme: false,
        abTesting: false,
      });
      setLoading(false);
    }
  }, [currentStoreId, isCreateMode]);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    const activeList = (!isCreateMode ? sections : pendingSections).filter(s => s.section_type !== 'security_phone_validation');
    const currentSelectedId = selectedSectionId || activeList.find(s => s.section_type === 'product_info')?.id || null;
    
    if (currentSelectedId) {
      const sec = activeList.find(s => s.id === currentSelectedId);
      if (sec) {
        setEditingSection({ ...sec, config: sec.config || {} });
      } else {
        setEditingSection(null);
      }
    } else {
      setEditingSection(null);
    }
  }, [selectedSectionId, sections, pendingSections, isCreateMode]);

  const loadProductData = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${currentStoreId}/${id}/`);
      const p = res.data;
      setTitle(p.title);
      setSelectedCategory(p.category || "");
      setSku(p.sku || "");
      setPrice(p.price ? p.price.toString() : "");
      setComparePrice(p.compare_price ? p.compare_price.toString() : "");
      setCostPrice(p.cost_price ? p.cost_price.toString() : "");
      setAdCostPerOrder(p.ad_cost_per_order ? p.ad_cost_per_order.toString() : "");
      setStock(p.stock ? p.stock.toString() : "100");
      setPrimaryImage(p.primary_image || "");
      
      const loadedImgs = (p.images || []).map((img: any) => ({
        ...img,
        clientId: img.id || `img-${Math.random().toString(36).substr(2, 9)}`,
      }));
      setImages(loadedImgs.length > 0 ? loadedImgs : (p.primary_image ? [{ clientId: `img-${Date.now()}`, image_url: p.primary_image, position: 0, is_primary: true }] : []));

      if (p.variants && p.variants.length > 0) {
        setHasVariants(true);
        const attrsMap: Record<string, Set<string>> = {};
        p.variants.forEach((v: any) => {
          (v.options || []).forEach((opt: any) => {
            if (!attrsMap[opt.label]) {
              attrsMap[opt.label] = new Set();
            }
            attrsMap[opt.label].add(opt.value);
          });
        });
        const attrs = Object.entries(attrsMap).map(([name, vals]) => ({
          name,
          values: Array.from(vals),
          inputVal: "",
        }));
        setVariantAttributes(attrs);
        setVariantCombinations(p.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          price: v.price ? v.price.toString() : "",
          sku: v.sku || "",
          stock_quantity: v.stock_quantity ? v.stock_quantity.toString() : "100",
          is_active: v.is_active !== false,
          image_url: v.image_url || "",
          options: v.options || [],
        })));
      } else {
        setHasVariants(false);
        setVariantAttributes([]);
        setVariantCombinations([]);
      }

      setDescription(p.description || "");
      setError("");
      setQuantityOffers((p.quantity_offers || []).map((o: any) => ({ quantity: o.quantity, price: parseFloat(o.price), label: o.label || "" })));
      setSelectedTheme(p.theme || "");
      setShowThemePicker(false);
      
      if (id === productId) {
        setEnableAbTest(p.enable_ab_test || false);
        setAbTestProductBId(p.ab_test_product_b || "");
      }

      setActiveSections({
        basicInfo: true,
        pricing: true,
        profitability: !!(p.cost_price || p.ad_cost_per_order),
        media: !!p.primary_image,
        description: !!p.description,
        offers: !!(p.quantity_offers && p.quantity_offers.length > 0),
        pageSections: false,
        theme: !!p.theme,
        abTesting: !!p.enable_ab_test,
      });

      // fetch sections
      setSectionsLoading(true);
      const secRes = await api.get(`/products/${currentStoreId}/${id}/sections/`);
      setSections(secRes.data || []);
    } catch (err) {
      setError(language === 'ar' ? "حدث خطأ أثناء تحميل بيانات المنتج." : (language === 'fr' ? "Erreur lors du chargement du produit." : "Error loading product data."));
    } finally {
      setLoading(false);
      setSectionsLoading(false);
    }
  };

  const saveProductData = async (id: string, overrideAbTest?: boolean) => {
    setError("");
    const payload: any = {
      store_id: currentStoreId,
      title,
      sku: sku || "",
      price: parseFloat(price) || 0,
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      cost_price: activeSections.profitability && costPrice ? parseFloat(costPrice) : null,
      ad_cost_per_order: activeSections.profitability && adCostPerOrder ? parseFloat(adCostPerOrder) : null,
      category: selectedCategory || null,
      stock: parseInt(stock) || 100,
      primary_image: images.length > 0 ? images[0].image_url : primaryImage,
      images: images.map((img, idx) => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || "",
        position: idx,
        is_primary: idx === 0,
      })),
      description: description || "",
      theme: selectedTheme || "",
      variants: hasVariants ? variantCombinations.map(combo => ({
        id: combo.id,
        name: combo.name,
        sku: combo.sku,
        price: combo.price ? parseFloat(combo.price) : null,
        stock_quantity: parseInt(combo.stock_quantity) || 0,
        is_active: combo.is_active,
        image_url: combo.image_url,
        options: combo.options.map(opt => ({
          option_type: opt.option_type,
          label: opt.label,
          value: opt.value,
        })),
      })) : [],
    };
    if (quantityOffers.length > 0) {
      payload.quantity_offers = quantityOffers;
    } else {
      payload.quantity_offers = [];
    }

    if (id === productId) {
      payload.enable_ab_test = overrideAbTest !== undefined ? overrideAbTest : enableAbTest;
      payload.ab_test_product_b = abTestProductBId || null;
    }

    try {
      await api.put(`/products/${currentStoreId}/${id}/`, payload);
      return true;
    } catch (err) {
      setError(language === 'ar' ? "حدث خطأ أثناء حفظ التغييرات." : (language === 'fr' ? "Erreur lors de l'enregistrement." : "Error saving changes."));
      return false;
    }
  };

  const handleSwitchTab = async (tab: 'A' | 'B') => {
    if (tab === activeTab) return;
    
    // If target tab is B and B is not created yet, just switch tab visually
    if (tab === 'B' && !abTestProductBId) {
      setActiveTab('B');
      return;
    }
    
    // If we are on B placeholder and switching to A, just switch tab visually
    if (activeTab === 'B' && !abTestProductBId) {
      setActiveTab('A');
      await loadProductData(productId);
      return;
    }

    const currentId = activeTab === 'A' ? productId : abTestProductBId;
    if (!currentId) return;
    
    setLoading(true);
    const saved = await saveProductData(currentId);
    if (saved) {
      setActiveTab(tab);
      const targetId = tab === 'A' ? productId : abTestProductBId;
      await loadProductData(targetId);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCreateMode) {
      setActiveSections({
        basicInfo: true,
        pricing: true,
        profitability: false,
        media: false,
        description: false,
        offers: false,
        pageSections: false,
        theme: false,
        abTesting: false,
      });
      setLoading(false);
    } else {
      loadProductData(productId);
    }
  }, [productId, currentStoreId]);

  // Fetch all store products (for Group B selection)
  useEffect(() => {
    if (!currentStoreId) return;
    api.get(`/products/${currentStoreId}/`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAllProducts(list.filter((p: any) => p.id !== productId));
      })
      .catch(() => {});
  }, [currentStoreId, productId]);

  // Fetch A/B Testing Stats
  useEffect(() => {
    if (isCreateMode || !productId || !currentStoreId || !enableAbTest) return;
    setStatsLoading(true);
    api.get(`/analytics/${currentStoreId}/product/${productId}/ab-test/`)
      .then((res) => {
        setAbTestStats(res.data);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [productId, currentStoreId, enableAbTest, isCreateMode]);

  // Fetch Section Heatmap Data
  useEffect(() => {
    if (isCreateMode || !productId || !currentStoreId) return;
    const activeId = activeTab === 'A' ? productId : abTestProductBId;
    if (!activeId) return;

    setHeatmapLoading(true);
    api.get(`/analytics/${currentStoreId}/product/${activeId}/heatmap/`)
      .then((res) => {
        if (res.data && res.data.heatmap) {
          setHeatmapData(res.data.heatmap);
        }
      })
      .catch(() => {})
      .finally(() => setHeatmapLoading(false));
  }, [productId, currentStoreId, isCreateMode, activeTab, abTestProductBId]);

  const [creatingReplica, setCreatingReplica] = useState(false);

  const handleCreateReplicaB = async () => {
    if (!currentStoreId || isCreateMode) return;
    setCreatingReplica(true);
    setError("");
    try {
      const res = await api.post(`/products/${currentStoreId}/${productId}/duplicate/`);
      const newProd = res.data;
      setAllProducts(prev => [newProd, ...prev]);
      setAbTestProductBId(newProd.id);
      setEnableAbTest(true);

      // Persist the A/B link on the master product immediately via PATCH (partial update)
      try {
        await api.patch(`/products/${currentStoreId}/${productId}/`, {
          enable_ab_test: true,
          ab_test_product_b: newProd.id,
        });
      } catch (linkErr: any) {
        console.error("Failed to link B variant to master:", linkErr?.response?.data || linkErr);
      }

      // Load Version B's cloned sections and field values into the editor state
      await loadProductData(newProd.id);

    } catch (err: any) {
      console.error("Duplicate API error:", err?.response?.status, err?.response?.data || err?.message);
      setError(language === 'ar' ? "فشل إنشاء الصفحة البديلة المكررة B." : (language === 'fr' ? "Échec de création de la page alternative B." : "Failed to create alternative version B."));
    } finally {
      setCreatingReplica(false);
    }
  };

  const handleDeactivateAbTest = async () => {
    setLoading(true);
    try {
      // Direct PATCH request to deactivate A/B test on master product A
      await api.patch(`/products/${currentStoreId}/${productId}/`, {
        enable_ab_test: false,
        ab_test_product_b: null
      });
      
      setEnableAbTest(false);
      setAbTestProductBId("");
      setActiveTab('A');
      await loadProductData(productId);
    } catch (err) {
      setError(language === 'ar' ? "حدث خطأ أثناء تعطيل اختبار A/B." : "Error deactivating A/B test.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLayoutSection = async (sectionType: string, sectionId?: string) => {
    if (sectionType === 'product_info') return;

    if (!isCreateMode) {
      // Edit mode
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      const activeList = [...sections];
      const existingSection = sectionId
        ? activeList.find(s => s.id === sectionId)
        : activeList.find(s => s.section_type === sectionType);
      
      if (existingSection) {
        // Active -> delete it
        try {
          await api.delete(`/products/${currentStoreId}/${activeId}/sections/${existingSection.id}/`);
          setSections(prev => prev.filter(s => s.id !== existingSection.id));
          if (sectionType === 'quantity_offers') {
            setQuantityOffers([]);
          }
        } catch {
          setError(language === 'ar' ? "فشل إزالة القسم" : (language === 'fr' ? "Échec de la suppression" : "Failed to remove section"));
        }
      } else {
        // Inactive -> create it
        try {
          const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order || 0)) : 0;
          const config: any = {};
          let order = maxOrder + 1;
          if (sectionType === 'header') {
            config.content = selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store"));
            config.background_color = "#ffffff";
            config.color = "#111111";
            config.text_align = "right";
            config.font_size = "18px";
            order = -100;
          } else if (sectionType === 'footer') {
            config.content = language === 'ar' ? "© جميع الحقوق محفوظة" : (language === 'fr' ? "© Tous droits réservés" : "© All rights reserved");
            config.background_color = "#ffffff";
            config.color = "#666666";
            config.text_align = "center";
            config.font_size = "14px";
            order = 999;
          }
          const res = await api.post(`/products/${currentStoreId}/${activeId}/sections/`, {
            section_type: sectionType,
            config,
            order
          });
          setSections(prev => [...prev, res.data].sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch {
          setError(language === 'ar' ? "فشل تفعيل القسم" : (language === 'fr' ? "Échec de l'activation" : "Failed to enable section"));
        }
      }
    } else {
      // Create mode
      setPendingSections(prev => {
        const existing = sectionId
          ? prev.find(s => s.id === sectionId)
          : prev.find(s => s.section_type === sectionType);
        if (existing) {
          if (sectionType === 'quantity_offers') {
            setQuantityOffers([]);
          }
          return prev.filter(s => s.id !== existing.id);
        } else {
          const config: any = {};
          let order = prev.length;
          if (sectionType === 'header') {
            config.content = selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store"));
            config.background_color = "#ffffff";
            config.color = "#111111";
            config.text_align = "right";
            config.font_size = "18px";
            order = -100;
          } else if (sectionType === 'footer') {
            config.content = language === 'ar' ? "© جميع الحقوق محفوظة" : (language === 'fr' ? "© Tous droits réservés" : "© All rights reserved");
            config.background_color = "#ffffff";
            config.color = "#666666";
            config.text_align = "center";
            config.font_size = "14px";
            order = 999;
          }
          return [...prev, {
            id: `pending-${sectionType}-${Date.now()}`,
            section_type: sectionType,
            config,
            order
          }].sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      });
    }
  };

  const fetchSections = async (id: string) => {
    if (!currentStoreId) return;
    setSectionsLoading(true);
    try {
      const res = await api.get(`/products/${currentStoreId}/${id}/sections/`);
      let fetchedSections = res.data || [];
      
      const hasInfo = fetchedSections.some((s: any) => s.section_type === 'product_info');
      const hasCheckout = fetchedSections.some((s: any) => s.section_type === 'checkout');
      const hasFooter = fetchedSections.some((s: any) => s.section_type === 'footer');
      const hasHeader = fetchedSections.some((s: any) => s.section_type === 'header');
      
      let updated = false;
      
      if (!hasInfo) {
        try {
          const createRes = await api.post(`/products/${currentStoreId}/${id}/sections/`, {
            section_type: 'product_info',
            config: {},
            order: -2
          });
          fetchedSections.push(createRes.data);
          updated = true;
        } catch {}
      }
      
      if (!hasCheckout) {
        try {
          const createRes = await api.post(`/products/${currentStoreId}/${id}/sections/`, {
            section_type: 'checkout',
            config: { show_address: true },
            order: 998
          });
          fetchedSections.push(createRes.data);
          updated = true;
        } catch {}
      }

      if (!hasFooter) {
        try {
          const createRes = await api.post(`/products/${currentStoreId}/${id}/sections/`, {
            section_type: 'footer',
            config: { content: language === 'ar' ? "© جميع الحقوق محفوظة" : (language === 'fr' ? "© Tous droits réservés" : "© All rights reserved"), background_color: "#ffffff", color: "#666666", text_align: "center", font_size: "14px" },
            order: 999
          });
          fetchedSections.push(createRes.data);
          updated = true;
        } catch {}
      }

      if (!hasHeader) {
        try {
          const createRes = await api.post(`/products/${currentStoreId}/${id}/sections/`, {
            section_type: 'header',
            config: { content: selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store")), background_color: "#ffffff", color: "#111111", text_align: isRtl ? "right" : "left", font_size: "18px" },
            order: -100
          });
          fetchedSections.push(createRes.data);
          updated = true;
        } catch {}
      }
      
      if (updated) {
        fetchedSections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      }
      
      setSections(fetchedSections);
      
      setActiveSections(prev => ({
        ...prev,
        profitability: false,
        theme: false
      }));
    } catch {
      setSections([]);
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newImg = {
        clientId: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        image_url: res.data.image_url,
        position: images.length,
        is_primary: images.length === 0,
      };
      setImages((prev) => [...prev, newImg]);
    } catch (err: any) {
      setError(language === 'ar' ? "فشل تحميل الصورة. يرجى المحاولة مرة أخرى." : (language === 'fr' ? "Échec du téléversement. Réessayez." : "Failed to upload image. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleAddDirectImageUrl = () => {
    if (!directImageUrl.trim()) return;
    const newImg = {
      clientId: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      image_url: directImageUrl.trim(),
      position: images.length,
      is_primary: images.length === 0,
    };
    setImages((prev) => [...prev, newImg]);
    setDirectImageUrl("");
  };

  const handleDeleteImage = (clientId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.clientId !== clientId);
      return filtered.map((img, idx) => ({
        ...img,
        position: idx,
        is_primary: idx === 0,
      }));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((item, idx) => ({
        ...item,
        position: idx,
        is_primary: idx === 0,
      }));
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateCombinations = (attrs: typeof variantAttributes) => {
    const validAttrs = attrs.filter(a => a.name.trim() && a.values.length > 0);
    if (validAttrs.length === 0) return [];

    const cartesian = (acc: any[][], val: string[]) => {
      return acc.flatMap(c => val.map(v => [...c, v]));
    };

    let combinations = validAttrs[0].values.map(v => [v]);
    for (let i = 1; i < validAttrs.length; i++) {
    combinations = cartesian(combinations, validAttrs[i].values);
    }

    return combinations.map(combo => {
      const name = combo.join(" - ");
      const options = combo.map((val, idx) => {
        const attrName = validAttrs[idx].name.trim();
        let optionType = "custom";
        if (attrName.includes("لون") || attrName.toLowerCase().includes("color")) optionType = "color";
        else if (attrName.includes("مقاس") || attrName.includes("حجم") || attrName.toLowerCase().includes("size")) optionType = "size";
        
        return {
          option_type: optionType,
          label: attrName,
          value: val,
        };
      });

      const existing = variantCombinations.find(c => c.name === name);
      if (existing) {
        return existing;
      }

      return {
        id: undefined,
        name,
        price: price || "",
        sku: sku ? `${sku}-${combo.join("-")}` : "",
        stock_quantity: "100",
        is_active: true,
        image_url: "",
        options,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!isCreateMode) {
        const activeId = activeTab === 'A' ? productId : abTestProductBId;
        const success = await saveProductData(activeId);
        if (!success) {
          setSubmitting(false);
          return;
        }
      } else {
        const payload: any = {
          store_id: currentStoreId,
          title,
          sku: sku || "",
          price: parseFloat(price) || 0,
          compare_price: comparePrice ? parseFloat(comparePrice) : null,
          cost_price: activeSections.profitability && costPrice ? parseFloat(costPrice) : null,
          ad_cost_per_order: activeSections.profitability && adCostPerOrder ? parseFloat(adCostPerOrder) : null,
          category: selectedCategory || null,
          stock: parseInt(stock) || 100,
          primary_image: images.length > 0 ? images[0].image_url : primaryImage,
          images: images.map((img, idx) => ({
            id: img.id,
            image_url: img.image_url,
            alt_text: img.alt_text || "",
            position: idx,
            is_primary: idx === 0,
          })),
          description: description || "",
          enable_ab_test: enableAbTest,
          ab_test_product_b: abTestProductBId || null,
          theme: selectedTheme || "",
          variants: hasVariants ? variantCombinations.map(combo => ({
            id: combo.id,
            name: combo.name,
            sku: combo.sku,
            price: combo.price ? parseFloat(combo.price) : null,
            stock_quantity: parseInt(combo.stock_quantity) || 0,
            is_active: combo.is_active,
            image_url: combo.image_url,
            options: combo.options.map(opt => ({
              option_type: opt.option_type,
              label: opt.label,
              value: opt.value,
            })),
          })) : [],
        };
        if (quantityOffers.length > 0) {
          payload.quantity_offers = quantityOffers;
        } else {
          payload.quantity_offers = [];
        }

        const res = await api.post(`/products/${currentStoreId}/`, payload);
        const newProductId = res.data.id;
        if (pendingSections.length > 0 && newProductId) {
          for (let i = 0; i < pendingSections.length; i++) {
            const ps = pendingSections[i];
            try {
              await api.post(`/products/${currentStoreId}/${newProductId}/sections/`, {
                section_type: ps.section_type,
                config: ps.config,
                order: i,
              });
            } catch {}
          }
      }
      if (typeof window !== "undefined" && currentStoreId) {
        const key = `sovi_product_draft_${productId}_${currentStoreId}`;
        localStorage.removeItem(key);
      }
      router.push("/products");
      }
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === "string") setError(detail);
      else if (detail?.quantity_offers) setError("عروض الكمية: " + JSON.stringify(detail.quantity_offers));
      else if (typeof detail === "object") setError(Object.values(detail).flat().join("; "));
      else setError(language === 'ar' ? "فشل حفظ المنتج. يرجى التحقق من صحة البيانات." : (language === 'fr' ? "Échec de l'enregistrement. Vérifiez les données." : "Failed to save product. Please check the data."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSection = async (sectionType: string) => {
    const config: any = {};
    if (sectionType === "text" || sectionType === "footer" || sectionType === "header") {
      config.content = sectionType === "footer" ? (language === 'ar' ? "© جميع الحقوق محفوظة" : (language === 'fr' ? "© Tous droits réservés" : "© All rights reserved")) : (sectionType === "header" ? (selectedStore?.name || (language === 'ar' ? "متجرنا" : (language === 'fr' ? "Notre boutique" : "Our Store"))) : "");
      config.font_size = sectionType === "footer" ? "14px" : (sectionType === "header" ? "18px" : "16px");
      config.color = sectionType === "footer" ? "#666666" : (sectionType === "header" ? "#111111" : "#ffffff");
      config.text_align = sectionType === "footer" ? "center" : (sectionType === "header" ? "right" : "right");
    }

    if (!isCreateMode) {
      if (!currentStoreId) return;
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      try {
        const res = await api.post(`/products/${currentStoreId}/${activeId}/sections/`, {
          section_type: sectionType,
          config,
        });
        setSections((prev) => [...prev, res.data]);
        setShowAddSection(false);
      } catch {
        setError(language === 'ar' ? "فشل إضافة القسم" : (language === 'fr' ? "Échec de l'ajout" : "Failed to add section"));
      }
    } else {
      const tempId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setPendingSections((prev) => [...prev, { id: tempId, section_type: sectionType, config, order: prev.length }]);
      setShowAddSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!isCreateMode) {
      if (!currentStoreId) return;
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      try {
        await api.delete(`/products/${currentStoreId}/${activeId}/sections/${sectionId}/`);
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
      } catch {
        setError(language === 'ar' ? "فشل حذف القسم" : (language === 'fr' ? "Échec de la suppression" : "Failed to delete section"));
      }
    } else {
      setPendingSections((prev) => prev.filter((s) => s.id !== sectionId));
    }
  };

  const handleUpdateSection = async (sectionId: string, updates: any) => {
    if (!isCreateMode) {
      if (!currentStoreId) return;
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      // Optimistic update for instant preview rendering
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...updates, config: { ...(s.config || {}), ...(updates.config || {}) } } : s)));
      try {
        const res = await api.patch(`/products/${currentStoreId}/${activeId}/sections/${sectionId}/`, updates);
        setSections((prev) => prev.map((s) => (s.id === sectionId ? res.data : s)));
      } catch {
        setError(language === 'ar' ? "فشل تحديث القسم" : (language === 'fr' ? "Échec de la mise à jour" : "Failed to update section"));
      }
    } else {
      setPendingSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
    }
  };

  const handleSectionFileUpload = async (fieldKey: string, file: File) => {
    if (!currentStoreId) return;
    setSectionUploading(fieldKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, [fieldKey]: res.data.image_url } } : prev);
    } catch {
      setError(language === 'ar' ? "فشل رفع الصورة" : (language === 'fr' ? "Échec du téléversement" : "Failed to upload image"));
    } finally {
      setSectionUploading(null);
    }
  };

  const handleDropSection = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    if (!isCreateMode) {
      const newSections = [...sections];
      const [moved] = newSections.splice(fromIdx, 1);
      newSections.splice(toIdx, 0, moved);
      const reordered = newSections.map((s, i) => ({ ...s, order: i }));
      setSections(reordered);
      setDragIndex(null);
      if (!currentStoreId) return;
      const activeId = activeTab === 'A' ? productId : abTestProductBId;
      try {
        const sectionIds = reordered.map(s => s.id);
        await api.post(`/products/${currentStoreId}/${activeId}/sections/reorder/`, {
          section_ids: sectionIds,
        });
      } catch {
        fetchSections(activeId);
      }
    } else {
      const newPending = [...pendingSections];
      const [moved] = newPending.splice(fromIdx, 1);
      newPending.splice(toIdx, 0, moved);
      const reordered = newPending.map((s, i) => ({ ...s, order: i }));
      setPendingSections(reordered);
      setDragIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-foreground font-cairo">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span>{language === 'ar' ? "جاري تحميل صفحة المنتج..." : (language === 'fr' ? "Chargement du produit..." : "Loading product page...")}</span>
      </div>
    );
  }

  const activeList = (!isCreateMode ? sections : pendingSections).filter(s => s.section_type !== 'security_phone_validation');
  const currentSelectedId = selectedSectionId || activeList.find(s => s.section_type === 'product_info')?.id || null;
  const hasCheckout = activeList.some(s => s.section_type === 'checkout');
  const hasFooter = activeList.some(s => s.section_type === 'footer');
  const hasHeader = activeList.some(s => s.section_type === 'header');
  const hasOffers = activeList.some(s => s.section_type === 'quantity_offers');
  const hasCoupon = activeList.some(s => s.section_type === 'coupon');
  const hasCaptcha = activeList.some(s => s.section_type === 'security_captcha');
  const hasPhoneValidation = false;
  const hasOtp = activeList.some(s => s.section_type === 'security_otp');
  const hasRateLimit = activeList.some(s => s.section_type === 'security_rate_limit');
  const hasAlgerianIp = activeList.some(s => s.section_type === 'security_algerian_ip');
  const hasCommitment = activeList.some(s => s.section_type === 'security_commitment');

  return (
    <div className={`space-y-6 text-foreground pb-12 ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {isCreateMode ? (language === 'ar' ? "إضافة منتج جديد" : (language === 'fr' ? "Ajouter un produit" : "Add New Product")) : (language === 'ar' ? "تعديل المنتج" : (language === 'fr' ? "Modifier le produit" : "Edit Product"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCreateMode ? (language === 'ar' ? "قم بإعداد صفحة المنتج الجديد، وتخصيص هيكل صفحة الهبوط." : (language === 'fr' ? "Configurez la page produit et personnalisez le template." : "Configure the new product page and customize its layout.")) : (language === 'ar' ? `تعديل تفاصيل وأقسام: ${title || "المنتج"}` : (language === 'fr' ? `Modifier les détails et sections : ${title || "Produit"}` : `Edit details and sections of: ${title || "Product"}`)) }
          </p>
        </div>
        <Button onClick={() => router.push("/products")} variant="outline" className="text-xs">
          {language === 'ar' ? "العودة للمنتجات" : (language === 'fr' ? "Retour aux produits" : "Back to products")}
        </Button>
      </div>
      {hasDraft && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-right">
              <p className="font-bold">{language === 'ar' ? "تغييرات غير محفوظة مكتشفة" : (language === 'fr' ? "Brouillon détecté" : "Unsaved changes detected")}</p>
              <p className="text-xs opacity-80">{language === 'ar' ? "لقد عثرنا على مسودة غير محفوظة لهذا المنتج من جلسة سابقة. هل ترغب في استعادتها؟" : (language === 'fr' ? "Brouillon trouvé pour ce produit de la session précédente. Voulez-vous le restaurer ?" : "We found an unsaved draft of this product from a previous session. Do you want to restore it?")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Button
              type="button"
              onClick={handleRestoreDraft}
              variant="glow"
              className="text-xs py-1.5 h-auto px-4 w-full sm:w-auto font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/10"
            >
              {language === 'ar' ? "استعادة التغييرات" : (language === 'fr' ? "Restaurer" : "Restore Changes")}
            </Button>
            <Button
              type="button"
              onClick={handleDiscardDraft}
              variant="outline"
              className="text-xs py-1.5 h-auto px-4 w-full sm:w-auto border-white/10 hover:bg-white/5"
            >
              {language === 'ar' ? "تجاهل وحذف" : (language === 'fr' ? "Ignorer & supprimer" : "Discard & Delete")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} className="space-y-6">
        {/* A/B Layout Testing Header Panel */}
        {!isCreateMode && (
          <Card className="border border-border dark:border-white/10 bg-card/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
            <CardContent className="p-5 space-y-4">
              {/* Top row: Status, Info, and Main Toggle */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border dark:border-white/5 pb-4">
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-start md:justify-end">
                    {enableAbTest ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                        {language === 'ar' ? "اختبار تقسيم الزوار نشط" : (language === 'fr' ? "Test A/B actif" : "A/B Testing Active")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted/20 text-muted-foreground border border-border">
                        {language === 'ar' ? "الاختبار معطل" : (language === 'fr' ? "Test désactivé" : "Testing Disabled")}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
                      <SplitSquareHorizontal className="h-5 w-5 text-primary" />
                      {language === 'ar' ? "اختبار تقسيم الزوار A/B لصفحة الهبوط" : (language === 'fr' ? "Test de division des visiteurs A/B" : "A/B Testing on Landing Page")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === 'ar' ? "قم بإنشاء وتعديل نسختين مختلفتين من صفحة الهبوط. سيتم تقسيم حركة مرور الزوار بنسبة 50/50 تلقائياً لقياس أي النسختين تحقق أعلى نسبة تحويل ومبيعات." : (language === 'fr' ? "Créez et modifiez deux versions de la page de destination. Le trafic sera divisé automatiquement à 50/50 pour mesurer celle avec la meilleure conversion." : "Create and edit two different versions of the landing page. Traffic will be split 50/50 automatically to measure which one achieves the highest conversion rate.")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {enableAbTest ? (
                    <Button
                      type="button"
                      onClick={handleDeactivateAbTest}
                      variant="outline"
                      className="text-xs border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {language === 'ar' ? "تعطيل اختبار A/B" : (language === 'fr' ? "Désactiver le test A/B" : "Disable A/B Test")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setEnableAbTest(true)}
                      variant="glow"
                      className="text-xs font-bold flex items-center gap-1.5 px-4 py-2 h-auto rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {language === 'ar' ? "تفعيل اختبار A/B" : (language === 'fr' ? "Activer le test A/B" : "Enable A/B Test")}
                    </Button>
                  )}
                </div>
              </div>

              {enableAbTest && (
                <div className="space-y-4">
                  {/* Middle row: Tab switching windows */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchTab('A')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          activeTab === 'A'
                            ? 'border-primary/50 bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'border-border dark:border-white/5 bg-muted/40 dark:bg-white/5 text-muted-foreground hover:bg-muted/80 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white'
                        }`}
                      >
                        <Layers className="h-4 w-4" />
                        {language === 'ar' ? "النسخة A (الأساسية)" : (language === 'fr' ? "Version A (Principale)" : "Version A (Base)")}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchTab('B')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          activeTab === 'B'
                            ? 'border-primary/50 bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'border-border dark:border-white/5 bg-muted/40 dark:bg-white/5 text-muted-foreground hover:bg-muted/80 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white'
                        }`}
                      >
                        <Layers className="h-4 w-4" />
                        {language === 'ar' ? "النسخة B (البديلة)" : (language === 'fr' ? "Version B (Alternative)" : "Version B (Alternative)")}
                        {abTestProductBId ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-medium">{language === 'ar' ? "غير منشأة" : (language === 'fr' ? "Non créée" : "Not Created")}</span>
                        )}
                      </button>
                    </div>

                    {/* Informational edit context */}
                    <div className="text-xs text-muted-foreground">
                      {activeTab === 'A' ? (
                        <span>{language === 'ar' ? "⚙️ أنت تقوم حالياً بتعديل الصفحة الأساسية (النسخة A)." : (language === 'fr' ? "⚙️ Modification de la page de base (Version A)." : "⚙️ You are currently editing the base page (Version A).")}</span>
                      ) : (
                        <span>{language === 'ar' ? "⚙️ أنت تقوم حالياً بتعديل الصفحة البديلة (النسخة B)." : (language === 'fr' ? "⚙️ Modification de la page alternative (Version B)." : "⚙️ You are currently editing the alternative page (Version B).")}</span>
                      )}
                    </div>
                  </div>

                  {/* Scoreboard stats details */}
                  {abTestStats && (
                    <div className="bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-muted-foreground">{language === 'ar' ? "تحديث تلقائي مستمر للنتائج" : (language === 'fr' ? "Résultats mis à jour en temps réel" : "Real-time auto-updated results")}</span>
                        <h4 className="text-xs font-bold text-foreground dark:text-white flex items-center gap-1.5">
                          {language === 'ar' ? "📊 إحصائيات المقارنة والأداء" : (language === 'fr' ? "📊 Statistiques de performance" : "📊 Comparison & Performance Stats")}
                        </h4>
                      </div>

                      {statsLoading ? (
                        <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>{language === 'ar' ? "جاري تحميل أحدث الإحصائيات..." : (language === 'fr' ? "Chargement des stats..." : "Loading latest stats...")}</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Variant A scorecard */}
                            <div className={`p-3 rounded-lg border transition-all ${activeTab === 'A' ? 'bg-primary/5 border-primary/25' : 'bg-muted/20 dark:bg-slate-900/30 border-border dark:border-white/5'}`}>
                              <div className="flex justify-between items-center border-b border-border dark:border-white/5 pb-1.5 mb-2">
                                <span className="text-[10px] text-muted-foreground">{language === 'ar' ? "المجموعة A (الأساسية)" : (language === 'fr' ? "Groupe A (Principal)" : "Group A (Base)")}</span>
                                <span className="text-xs font-bold text-foreground dark:text-white truncate max-w-[180px]">{activeTab === 'A' ? title : (language === 'ar' ? "النسخة الأساسية" : (language === 'fr' ? "Version Principale" : "Base Version"))}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "الزيارات" : (language === 'fr' ? "Visites" : "Visits")}</div>
                                  <div className="text-sm font-bold font-outfit text-foreground dark:text-white">{abTestStats.group_a.views}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "الطلبات" : (language === 'fr' ? "Commandes" : "Orders")}</div>
                                  <div className="text-sm font-bold font-outfit text-foreground dark:text-white">{abTestStats.group_a.purchases}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "التحويل" : (language === 'fr' ? "Conversion" : "Conversion")}</div>
                                  <div className="text-sm font-bold font-outfit text-green-600 dark:text-green-400">{abTestStats.group_a.conversion_rate}%</div>
                                </div>
                              </div>
                            </div>

                            {/* Variant B scorecard */}
                            <div className={`p-3 rounded-lg border transition-all ${activeTab === 'B' ? 'bg-primary/5 border-primary/25' : 'bg-muted/20 dark:bg-slate-900/30 border-border dark:border-white/5'}`}>
                              <div className="flex justify-between items-center border-b border-border dark:border-white/5 pb-1.5 mb-2">
                                <span className="text-[10px] text-amber-600 dark:text-amber-400">{language === 'ar' ? "المجموعة B (البديلة)" : (language === 'fr' ? "Groupe B (Alternatif)" : "Group B (Alternative)")}</span>
                                <span className="text-xs font-bold text-foreground dark:text-white truncate max-w-[180px]">
                                  {abTestProductBId ? (allProducts.find(p => p.id === abTestProductBId)?.title || (language === 'ar' ? "النسخة البديلة" : "Alternative Version")) : (language === 'ar' ? "النسخة البديلة" : "Alternative Version")}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "الزيارات" : (language === 'fr' ? "Visites" : "Visits")}</div>
                                  <div className="text-sm font-bold font-outfit text-foreground dark:text-white">{abTestStats.group_b.views}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "الطلبات" : (language === 'fr' ? "Commandes" : "Orders")}</div>
                                  <div className="text-sm font-bold font-outfit text-foreground dark:text-white">{abTestStats.group_b.purchases}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-muted-foreground">{language === 'ar' ? "التحويل" : (language === 'fr' ? "Conversion" : "Conversion")}</div>
                                  <div className="text-sm font-bold font-outfit text-green-600 dark:text-green-400">{abTestStats.group_b.conversion_rate}%</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Winner/Insight Announcement */}
                          {abTestStats.winner === 'B' && (
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1">🚀 تفوق {language === 'ar' ? "النسخة B (البديلة)" : (language === 'fr' ? "Version B (Alternative)" : "Version B (Alternative)")} بنسبة تحسين +{abTestStats.improvement.toFixed(1)}%!</span>
                              <span className="text-[10px] opacity-85">{language === 'ar' ? "ننصح باعتمادها كصفحة أساسية قريباً." : (language === 'fr' ? "Conseillé de l'adopter comme principale bientôt." : "We recommend adopting it as base page soon.")}</span>
                            </div>
                          )}
                          {abTestStats.winner === 'A' && (
                            <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1">🚀 تفوق {language === 'ar' ? "النسخة A (الأساسية)" : (language === 'fr' ? "Version A (Principale)" : "Version A (Base)")} بفارق +{Math.abs(abTestStats.improvement).toFixed(1)}%!</span>
                              <span className="text-[10px] opacity-85">{language === 'ar' ? "ننصح بالإبقاء عليها وإيقاف الاختبار." : (language === 'fr' ? "Conseillé de la garder et d'arrêter le test." : "We recommend keeping it and stopping the test.")}</span>
                            </div>
                          )}
                          {abTestStats.winner === 'none' && (
                            <div className="p-2.5 bg-muted/20 dark:bg-white/5 border border-border dark:border-white/5 rounded-lg text-muted-foreground text-[10px] text-center">
                              {language === 'ar' ? "ℹ️ يجرى جمع بيانات التصفح والشراء حالياً لمقارنة دقيقة. لا توجد فروقات ذات دلالة إحصائية واضحة بين النسختين بعد." : (language === 'fr' ? "ℹ️ Les données sont en cours de collecte. Pas encore de différence significative." : "ℹ️ Data is being collected. No statistically significant difference yet.")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {enableAbTest && activeTab === 'B' && !abTestProductBId ? (
          /* Premium Placeholder Card for Creating Version B */
          <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-lg my-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <SplitSquareHorizontal className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground dark:text-white">{language === 'ar' ? "لم يتم إنشاء النسخة البديلة (النسخة B) بعد" : (language === 'fr' ? "Version alternative B non créée" : "Alternative Version B Not Created Yet")}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {language === 'ar' ? "لتفعيل اختبار الـ A/B، يجب إنشاء صفحة بديلة تحتوي على تعديلات مختلفة في العنوان أو الصور أو الأسعار." : (language === 'fr' ? "Pour le test A/B, créez une page alternative avec des modifications." : "To enable A/B testing, create an alternative page with layout or price edits.")}
              </p>
            </div>
            <Button
              type="button"
              variant="glow"
              className="text-sm font-bold px-6 py-2.5 h-auto rounded-xl flex items-center gap-2 mx-auto"
              onClick={handleCreateReplicaB}
            >
              <Plus className="h-4 w-4" />
              {language === 'ar' ? "إنشاء النسخة B الآن" : (language === 'fr' ? "Créer la version B" : "Create Version B Now")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            
            {/* Column 1: Right Column (Sections Sidebar, lg:w-[25%]) */}
            <div className="w-full lg:w-[25%] space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-5 text-right shadow-sm text-card-foreground">
                <div>
                  <h4 className="text-sm font-bold mb-1 text-primary flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> {language === 'ar' ? "أقسام صفحة الهبوط" : (language === 'fr' ? "Sections de la page" : "Landing Page Sections")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {language === 'ar' ? "قم بسحب الأقسام لترتيبها، واضغط على أي قسم لتعديله في المنتصف." : (language === 'fr' ? "Glissez pour réorganiser et cliquez pour modifier." : "Drag sections to reorder, and click any section to edit it.")}
                  </p>
                </div>

                {/* Draggable Visible Sections */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? "الأقسام النشطة (اسحب للترتيب)" : (language === 'fr' ? "Sections actives (Glisser)" : "Active Sections (Drag)")}</p>
                  {(() => {
                    const visibleSections = activeList.filter(s =>
                      !["security_captcha", "security_otp", "security_rate_limit", "security_algerian_ip"].includes(s.section_type)
                    );
                    if (visibleSections.length === 0) {
                      return <p className="text-xs text-muted-foreground py-2 text-center border border-dashed border-border rounded-xl">{language === 'ar' ? "لا توجد أقسام نشطة" : (language === 'fr' ? "Aucune section active" : "No active sections")}</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {visibleSections.map((section) => {
                          const meta = sectionTypeMeta[section.section_type] || sectionTypeMeta.text;
                          const isRequired = section.section_type === "product_info";
                          const isSelected = section.id === currentSelectedId;
                          return (
                            <div
                              key={section.id}
                              draggable
                              onDragStart={() => setDraggedSectionId(section.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedSectionId && draggedSectionId !== section.id) {
                                  const fromIdx = activeList.findIndex(s => s.id === draggedSectionId);
                                  const toIdx = activeList.findIndex(s => s.id === section.id);
                                  if (fromIdx !== -1 && toIdx !== -1) {
                                    handleDropSection(fromIdx, toIdx);
                                  }
                                }
                                setDraggedSectionId(null);
                              }}
                              onClick={() => setSelectedSectionId(section.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none text-right cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 border-primary text-primary shadow-sm font-bold'
                                  : 'bg-primary/5 border-primary/20 text-foreground hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <div 
                                  className="text-muted-foreground hover:text-foreground flex-shrink-0 cursor-grab active:cursor-grabbing"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  disabled={isRequired}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => toggleLayoutSection(section.section_type, section.id)}
                                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="flex-1 min-w-0 text-right">
                                  <span className="text-xs font-bold truncate flex items-center gap-1.5 justify-start">
                                    {meta.icon} {meta.label}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {renderHeatmapBadge(section.section_type)}
                                {!isRequired && !["checkout", "footer", "header", "quantity_offers"].includes(section.section_type) && (
                                  <button 
                                    type="button" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLayoutSection(section.section_type, section.id);
                                      if (isSelected) {
                                        setSelectedSectionId(null);
                                      }
                                    }} 
                                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    title="إزالة القسم"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Quick Add Standard Sections */}
                {(!hasCheckout || !hasOffers || !hasFooter || !hasHeader || !hasCoupon) && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? "أقسام جاهزة للإضافة" : (language === 'fr' ? "Sections prêtes à ajouter" : "Sections Ready to Add")}</p>
                    <div className="space-y-1.5">
                      {!hasOffers && (
                        <div
                          onClick={() => toggleLayoutSection('quantity_offers')}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-right"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> {language === 'ar' ? "عروض الكمية والتخفيضات" : (language === 'fr' ? "Offres & Remises" : "Quantity Offers & Discounts")}</span>
                        </div>
                      )}
                      {!hasCoupon && (
                        <div
                          onClick={() => toggleLayoutSection('coupon')}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-right"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {language === 'ar' ? "قسيمة خصم (Coupon)" : (language === 'fr' ? "Coupon de réduction" : "Discount Coupon (Coupon)")}</span>
                        </div>
                      )}
                      {!hasCheckout && (
                        <div
                          onClick={() => toggleLayoutSection('checkout')}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-right"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> {language === 'ar' ? "استمارة الطلب (Order Form)" : (language === 'fr' ? "Formulaire de commande" : "Order Form (Order Form)")}</span>
                        </div>
                      )}
                      {!hasHeader && (
                        <div
                          onClick={() => toggleLayoutSection('header')}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-right"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {language === 'ar' ? "ترويسة الصفحة (Header)" : (language === 'fr' ? "En-tête de page" : "Page Header (Header)")}</span>
                        </div>
                      )}
                      {!hasFooter && (
                        <div
                          onClick={() => toggleLayoutSection('footer')}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-border bg-muted/5 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-right"
                        >
                          <input type="checkbox" checked={false} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                          <span className="text-xs font-medium flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {language === 'ar' ? "تذييل الصفحة (Footer)" : (language === 'fr' ? "Pied de page" : "Page Footer (Footer)")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Sections quick add */}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{language === 'ar' ? "أقسام مخصصة لصفحة الهبوط" : (language === 'fr' ? "Sections personnalisées" : "Custom Landing Page Sections")}</p>
                  {showAddSection ? (
                    <div className="bg-card rounded-xl p-2 border border-border space-y-1 shadow-md">
                      <div className="flex flex-col gap-1">
                        {Object.entries(sectionTypeMeta)
                          .filter(([key]) => key !== "product_info" && key !== "checkout" && key !== "quantity_offers" && key !== "footer" && key !== "header")
                          .map(([key, meta]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                handleAddSection(key);
                                setShowAddSection(false);
                              }}
                              className="flex items-center gap-2 w-full p-2 rounded bg-muted/10 hover:bg-muted/20 border border-border text-right text-xs text-foreground"
                            >
                              {meta.icon}
                              <span>{meta.label}</span>
                            </button>
                          ))}
                      </div>
                      <button type="button" onClick={() => setShowAddSection(false)} className="text-[10px] text-muted-foreground hover:text-foreground block w-full text-center mt-1">{language === 'ar' ? "إلغاء" : (language === 'fr' ? "Annuler" : "Cancel")}</button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setShowAddSection(true)}
                      variant="outline"
                      className="w-full text-xs flex items-center justify-center gap-1.5 py-1.5 h-auto"
                    >
                      <Plus className="h-3.5 w-3.5" /> {language === 'ar' ? "إضافة قسم مخصص" : (language === 'fr' ? "Ajouter section" : "Add Custom Section")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Security & Verification Options Card */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm text-card-foreground">
                <div>
                  <h4 className="text-sm font-bold mb-1 text-primary flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> {language === 'ar' ? "خيارات الأمان والتحقق" : (language === 'fr' ? "Options de sécurité" : "Security & Verification Options")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {language === 'ar' ? "ميزات أمان غير مرئية لحماية استمارات الطلبات والحد من الطلبات الوهمية." : (language === 'fr' ? "Options invisibles de sécurité pour limiter le spam." : "Invisible security features to restrict fake orders.")}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  {/* Google reCAPTCHA v3 */}
                  <div className="space-y-1">
                    <div
                      onClick={() => toggleLayoutSection('security_captcha')}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all text-right"
                    >
                      <input type="checkbox" checked={hasCaptcha} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                      <span className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "كابتشا Google reCAPTCHA v3" : "Google reCAPTCHA v3"}</span>
                    </div>
                    {hasCaptcha && (!(selectedStore?.settings as any)?.security_captcha_site_key || !(selectedStore?.settings as any)?.security_captcha_secret_key) && (
                      <p className="text-[9px] text-amber-500 mr-2 leading-tight">{language === 'ar' ? "⚠️ لم يتم إعداد مفاتيح الكابتشا في إعدادات المتجر العامة بعد." : (language === 'fr' ? "⚠️ Clés reCAPTCHA non configurées dans les paramètres." : "⚠️ reCAPTCHA keys not configured in general settings.")}</p>
                    )}
                  </div>

                  {/* SMS OTP */}
                  <div className="space-y-1">
                    <div
                      onClick={() => toggleLayoutSection('security_otp')}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all text-right"
                    >
                      <input type="checkbox" checked={hasOtp} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                      <span className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "التحقق عبر الهاتف SMS OTP" : "SMS OTP Phone Verification"}</span>
                    </div>
                    {hasOtp && !(selectedStore?.settings as any)?.security_firebase_config_json && (
                      <p className="text-[9px] text-amber-500 mr-2 leading-tight">{language === 'ar' ? "⚠️ لم يتم إدخال إعدادات Firebase في إعدادات المتجر العامة بعد." : (language === 'fr' ? "⚠️ Firebase non configuré dans les paramètres généraux." : "⚠️ Firebase not configured in general settings.")}</p>
                    )}
                  </div>

                  {/* Rate Limit */}
                  <div
                    onClick={() => toggleLayoutSection('security_rate_limit')}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all text-right"
                  >
                    <input type="checkbox" checked={hasRateLimit} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                    <span className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "حد أقصى للطلبات اليومية لكل IP" : "Daily Orders Limit per IP"}</span>
                  </div>

                  {/* Algerian IP restrict */}
                  <div
                    onClick={() => toggleLayoutSection('security_algerian_ip')}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all text-right"
                  >
                    <input type="checkbox" checked={hasAlgerianIp} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                    <span className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "حظر الطلبات من خارج الجزائر" : "Block Orders Outside Algeria"}</span>
                  </div>

                  {/* Customer Commitment Checkbox */}
                  <div
                    onClick={() => toggleLayoutSection('security_commitment')}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all text-right"
                  >
                    <input type="checkbox" checked={hasCommitment} readOnly className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer" />
                    <span className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "التزام العميل بجدية الطلب" : (language === 'fr' ? "Engagement du client" : "Customer Commitment Checkbox")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Middle Column (Active Section Editor, lg:w-[45%]) */}
            <div className="w-full lg:w-[45%] space-y-6">
            {(() => {
              const activeList_c2 = activeList;
              const selectedSection = activeList_c2.find((s: any) => s.id === currentSelectedId);
              if (!selectedSection) {
                return (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                      <Layers className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">{language === 'ar' ? "الرجاء اختيار قسم للتعديل" : (language === 'fr' ? "Veuillez choisir une section" : "Please select a section")}</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {language === 'ar' ? "اختر أحد أقسام صفحة المنتج النشطة من القائمة اليمنى لبدء تحرير المحتوى وتخصيص التفاصيل." : (language === 'fr' ? "Sélectionnez une section dans la liste pour commencer." : "Select a section from the list to start editing.")}
                    </p>
                  </div>
                );
              }
              // Render only the selected section editor
              return (
                <div className="space-y-6">
                  {[selectedSection].map((section) => {
              if (section.section_type === 'product_info') {
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Layers className="h-4 w-4 text-primary" />
                      <h4 className="font-bold text-sm">{language === 'ar' ? "معلومات المنتج الأساسية والتسعير" : (language === 'fr' ? "Infos de base & prix" : "Basic Info & Pricing")}</h4>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "اسم المنتج" : (language === 'fr' ? "Nom du produit" : "Product Name")}</label>
                      <Input required placeholder="مثال: ساعة يد ذكية مقاومة للماء" value={title} onChange={(e) => setTitle(e.target.value)} className="pr-3 text-right" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "فئة / مجموعة المنتج" : (language === 'fr' ? "Catégorie" : "Product Category")}</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-white/5 bg-white/5 text-white pr-3 text-right"
                      >
                        <option value="" className="bg-slate-900 text-white">{language === 'ar' ? "اختر فئة للمنتج (اختياري)" : (language === 'fr' ? "Choisir catégorie (optionnel)" : "Choose category (optional)")}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "الرمز المرجعي (SKU)" : (language === 'fr' ? "SKU" : "SKU Code")}</label>
                        <Input placeholder="SMART-WATCH-01" value={sku} onChange={(e) => setSku(e.target.value)} className="pr-3 text-right font-outfit" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "المخزون المتوفر" : (language === 'fr' ? "Stock disponible" : "Available Stock")}</label>
                        <Input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="pr-3 text-right font-outfit" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "سعر البيع (DZD)" : (language === 'fr' ? "Prix de vente (DZD)" : "Selling Price (DZD)")}</label>
                        <Input type="number" required placeholder="5900" value={price} onChange={(e) => setPrice(e.target.value)} className="pr-3 text-right font-outfit" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "السعر الأصلي للمقارنة (DZD)" : (language === 'fr' ? "Prix comparatif (DZD)" : "Original Compare Price (DZD)")}</label>
                        <Input type="number" placeholder="8900" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className="pr-3 text-right font-outfit" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "حساب التكاليف والأرباح" : (language === 'fr' ? "Coûts & Profit" : "Cost & Profit Calculation")}</label>
                        <input 
                          type="checkbox" 
                          checked={activeSections.profitability} 
                          onChange={(e) => setActiveSections(prev => ({ ...prev, profitability: e.target.checked }))} 
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                        />
                      </div>
                      {activeSections.profitability && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">{language === 'ar' ? "سعر الشراء / التكلفة (DZD)" : (language === 'fr' ? "Prix d'achat (DZD)" : "Cost Price (DZD)")}</label>
                            <Input type="number" placeholder="2500" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="pr-3 text-right font-outfit text-xs" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">{language === 'ar' ? "تكلفة الإعلان لكل طلب (DZD)" : (language === 'fr' ? "Coût pub / commande (DZD)" : "Ad Cost per Order (DZD)")}</label>
                            <Input type="number" placeholder="500" value={adCostPerOrder} onChange={(e) => setAdCostPerOrder(e.target.value)} className="pr-3 text-right font-outfit text-xs" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "صور المنتج (اسحب للترتيب، الصورة الأولى هي الرئيسية)" : (language === 'fr' ? "Images (1ère image principale)" : "Product Images (1st is primary)")}</label>
                      
                      {/* Image drag-and-drop sortable container */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={images.map((img) => img.clientId)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {images.map((img) => (
                              <SortableImageItem
                                key={img.clientId}
                                id={img.clientId}
                                url={img.image_url}
                                isPrimary={img.is_primary}
                                onDelete={() => handleDeleteImage(img.clientId)}
                              />
                            ))}

                            {/* Upload card placeholder */}
                            <label className="relative aspect-square border border-dashed border-border rounded-xl bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all flex flex-col items-center justify-center p-2 text-center select-none">
                              {uploading ? (
                                <div className="text-[10px] text-muted-foreground font-medium animate-pulse">{language === 'ar' ? "جاري الرفع..." : "Uploading..."}</div>
                              ) : (
                                <>
                                  <Camera className="h-5 w-5 text-muted-foreground opacity-60 mb-1" />
                                  <span className="text-[9px] text-muted-foreground font-bold leading-tight">{language === 'ar' ? "تحميل صورة" : "Upload image"}</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Direct image URL input with append button */}
                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="أو أدخل رابط صورة مباشر (https://...)"
                          value={directImageUrl}
                          onChange={(e) => setDirectImageUrl(e.target.value)}
                          className="pr-3 text-right font-outfit text-xs flex-grow h-9"
                        />
                        <Button
                          type="button"
                          onClick={handleAddDirectImageUrl}
                          className="text-xs h-9"
                        >
                          {language === 'ar' ? "إضافة رابط" : (language === 'fr' ? "Ajouter lien" : "Add link")}
                        </Button>
                      </div>
                    </div>



                    {/* Variants Builder Block */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                          <SplitSquareHorizontal className="h-4 w-4 text-primary" /> {language === 'ar' ? "خيارات وتغيرات المنتج (Variants)" : (language === 'fr' ? "Variantes du produit (Variants)" : "Product Variants (Variants)")}
                        </label>
                        <input 
                          type="checkbox" 
                          checked={hasVariants} 
                          onChange={(e) => setHasVariants(e.target.checked)} 
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                        />
                      </div>
                      
                      {hasVariants && (
                        <div className="space-y-4 bg-muted/5 p-4 rounded-xl border border-border animate-fade-in-up">
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {language === 'ar' ? "أضف خيارات للمنتج (مثل اللون والمقاس) وسيتم إنشاء قائمة بجميع المتغيرات الممكنة تلقائياً لتتمكن من تحديد سعر وصورة لكل منها." : (language === 'fr' ? "Ajoutez des options (couleur, taille) pour générer automatiquement la liste des variantes." : "Add product options (like color and size) to generate variants list automatically.")}
                          </p>

                          {/* Attributes configuration */}
                          <div className="space-y-3">
                            {variantAttributes.map((attr, attrIdx) => (
                              <div key={attrIdx} className="bg-card p-3 rounded-lg border border-border space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">{language === 'ar' ? "اسم الخيار (مثال: اللون)" : (language === 'fr' ? "Nom de l'option" : "Option Name")}</label>
                                    <Input 
                                      placeholder="اللون، المقاس، الحجم..." 
                                      value={attr.name} 
                                      onChange={(e) => {
                                        const newAttrs = [...variantAttributes];
                                        newAttrs[attrIdx].name = e.target.value;
                                        setVariantAttributes(newAttrs);
                                      }} 
                                      className="text-xs pr-3 text-right"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAttrs = variantAttributes.filter((_, idx) => idx !== attrIdx);
                                      setVariantAttributes(newAttrs);
                                      setVariantCombinations(generateCombinations(newAttrs));
                                    }}
                                    className="self-end p-2 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted-foreground">{language === 'ar' ? "القيم (مثال: أحمر، أزرق)" : (language === 'fr' ? "Valeurs (ex: Rouge, Bleu)" : "Values (e.g. Red, Blue)")}</label>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {attr.values.map((val, valIdx) => (
                                      <span key={valIdx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                                        {val}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newAttrs = [...variantAttributes];
                                            newAttrs[attrIdx].values = attr.values.filter((_, idx) => idx !== valIdx);
                                            setVariantAttributes(newAttrs);
                                            setVariantCombinations(generateCombinations(newAttrs));
                                          }}
                                          className="text-[10px] hover:text-red-400"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="أدخل قيمة واضغط إضافة أو Enter..."
                                      value={attr.inputVal || ""}
                                      onChange={(e) => {
                                        const newAttrs = [...variantAttributes];
                                        newAttrs[attrIdx].inputVal = e.target.value;
                                        setVariantAttributes(newAttrs);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const val = attr.inputVal?.trim();
                                          if (val && !attr.values.includes(val)) {
                                            const newAttrs = [...variantAttributes];
                                            newAttrs[attrIdx].values.push(val);
                                            newAttrs[attrIdx].inputVal = "";
                                            setVariantAttributes(newAttrs);
                                            setVariantCombinations(generateCombinations(newAttrs));
                                          }
                                        }
                                      }}
                                      className="text-xs pr-3 text-right flex-grow"
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        const val = attr.inputVal?.trim();
                                        if (val && !attr.values.includes(val)) {
                                          const newAttrs = [...variantAttributes];
                                          newAttrs[attrIdx].values.push(val);
                                          newAttrs[attrIdx].inputVal = "";
                                          setVariantAttributes(newAttrs);
                                          setVariantCombinations(generateCombinations(newAttrs));
                                        }
                                      }}
                                      className="text-xs h-9"
                                    >
                                      إضافة
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {variantAttributes.length < 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVariantAttributes([...variantAttributes, { name: "", values: [], inputVal: "" }])}
                                className="w-full text-xs flex items-center justify-center gap-1"
                              >
                                <Plus className="h-3.5 w-3.5" /> {language === 'ar' ? "إضافة خيار آخر (مثال: المقاس)" : (language === 'fr' ? "Ajouter option (ex: Taille)" : "Add option (e.g. Size)")}
                              </Button>
                            )}
                          </div>

                          {/* Combinations List */}
                          {variantCombinations.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-border">
                              <label className="text-xs font-bold text-muted-foreground block">{language === 'ar' ? "قائمة المتغيرات والأسعار" : (language === 'fr' ? "Variantes et prix" : "Variants & Prices")}</label>
                              <div className="space-y-3">
                                {variantCombinations.map((combo, idx) => (
                                  <div key={idx} className="bg-card p-3 rounded-lg border border-border space-y-3 text-right">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-primary">{combo.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground font-semibold">{language === 'ar' ? "نشط" : "Active"}</span>
                                        <input
                                          type="checkbox"
                                          checked={combo.is_active}
                                          onChange={(e) => {
                                            const newCombos = [...variantCombinations];
                                            newCombos[idx].is_active = e.target.checked;
                                            setVariantCombinations(newCombos);
                                          }}
                                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 accent-primary cursor-pointer"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground">{language === 'ar' ? "السعر (DZD)" : "Price (DZD)"}</label>
                                        <Input
                                          type="number"
                                          placeholder={price || (language === 'ar' ? "السعر الرئيسي" : "Base price")}
                                          value={combo.price}
                                          onChange={(e) => {
                                            const newCombos = [...variantCombinations];
                                            newCombos[idx].price = e.target.value;
                                            setVariantCombinations(newCombos);
                                          }}
                                          className="text-xs pr-2 text-right font-outfit h-8"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground">{language === 'ar' ? "المخزون" : "Stock"}</label>
                                        <Input
                                          type="number"
                                          placeholder="100"
                                          value={combo.stock_quantity}
                                          onChange={(e) => {
                                            const newCombos = [...variantCombinations];
                                            newCombos[idx].stock_quantity = e.target.value;
                                            setVariantCombinations(newCombos);
                                          }}
                                          className="text-xs pr-2 text-right font-outfit h-8"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground">{language === 'ar' ? "الرمز (SKU)" : "SKU"}</label>
                                        <Input
                                          placeholder="SKU"
                                          value={combo.sku}
                                          onChange={(e) => {
                                            const newCombos = [...variantCombinations];
                                            newCombos[idx].sku = e.target.value;
                                            setVariantCombinations(newCombos);
                                          }}
                                          className="text-xs pr-2 text-right font-outfit h-8"
                                        />
                                      </div>
                                    </div>

                                    {/* Link image dropdown with preview */}
                                    <div className="flex items-center gap-3 pt-1">
                                      <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground">{language === 'ar' ? "ربط بصورة للمتغير" : "Link Image"}</label>
                                        <select
                                          value={combo.image_url}
                                          onChange={(e) => {
                                            const newCombos = [...variantCombinations];
                                            newCombos[idx].image_url = e.target.value;
                                            setVariantCombinations(newCombos);
                                          }}
                                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right font-cairo"
                                        >
                                          <option value="">{language === 'ar' ? "-- اختر صورة --" : "-- Select Image --"}</option>
                                          {images.map((img, imgIdx) => (
                                            <option key={imgIdx} value={img.image_url}>
                                              الصورة {imgIdx + 1} ({img.is_primary ? (language === 'ar' ? "الرئيسية" : "Primary") : `URL...${img.image_url.substring(img.image_url.length - 15)}`})
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Small preview */}
                                      {combo.image_url ? (
                                        <div className="h-10 w-10 rounded border border-border overflow-hidden bg-muted/20 flex-shrink-0 flex items-center justify-center">
                                          <img src={getFullImageUrl(combo.image_url)} alt="Variant preview" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <div className="h-10 w-10 rounded border border-dashed border-border bg-muted/5 flex-shrink-0 flex items-center justify-center text-muted-foreground/30">
                                          <Image className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "وصف المنتج" : (language === 'fr' ? "Description" : "Product Description")}</label>
                      <textarea placeholder={language === 'ar' ? "اكتب تفاصيل ومواصفات المنتج هنا..." : (language === 'fr' ? "Description du produit..." : "Write product description...")} value={description} onChange={(e) => setDescription(e.target.value)} className={`flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"} />
                    </div>

                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowThemePicker(!showThemePicker)}>
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer"><Palette className="h-3.5 w-3.5 text-primary" /> {language === 'ar' ? "قالب تصميم صفحة المنتج" : (language === 'fr' ? "Modèle de design" : "Product Page Layout Theme")}</label>
                        <div className="flex items-center gap-1">
                          {selectedTheme && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {themeCatalog.find(t => t.id === selectedTheme)?.name || selectedTheme}
                            </span>
                          )}
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showThemePicker ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {showThemePicker && (
                        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTheme("")}
                            className={`flex items-center gap-2 w-full p-2 rounded-xl border transition-all text-right text-xs ${
                              !selectedTheme
                                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border bg-muted/10 hover:bg-muted/20'
                            }`}
                          >
                            <div className="h-7 w-7 rounded bg-muted/20 flex items-center justify-center flex-shrink-0">
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs">{language === 'ar' ? "بدون قالب" : (language === 'fr' ? "Sans modèle" : "No Theme")}</p>
                            </div>
                            {!selectedTheme && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                          </button>

                          {themeCatalog.map((theme) => {
                            const isSelected = selectedTheme === theme.id;
                            return (
                              <button
                                key={theme.id}
                                type="button"
                                onClick={() => setSelectedTheme(theme.id)}
                                className={`flex items-center gap-2 w-full p-2 rounded-xl border transition-all text-right text-xs ${
                                  isSelected
                                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-border bg-muted/10 hover:bg-muted/20'
                                }`}
                              >
                                <div className="flex flex-col gap-0.5 flex-shrink-0">
                                  <div className="flex gap-0.5">
                                    <div className="h-3 w-3 rounded-full border border-border" style={{ background: theme.colors.bg }} />
                                    <div className="h-3 w-3 rounded-full border border-border" style={{ background: theme.colors.text }} />
                                  </div>
                                  <div className="flex gap-0.5">
                                    <div className="h-3 w-3 rounded-full border border-border" style={{ background: theme.colors.accent }} />
                                    <div className="h-3 w-3 rounded-full border border-border" style={{ background: theme.colors.btn }} />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="font-bold text-xs truncate">{theme.name}</p>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Section Styling & Colors block */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5 font-cairo">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        {language === 'ar' ? "ألوان ومظهر القسم" : (language === 'fr' ? "Couleurs et apparence" : "Section Styling & Colors")}
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color")}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={section.config.background_color || '#ffffff'}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, background_color: e.target.value } })}
                              className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                            />
                            <Input
                              value={section.config.background_color || ''}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, background_color: e.target.value } })}
                              placeholder="#ffffff"
                              className="text-xs font-outfit h-9 pr-3 text-right"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون النصوص" : (language === 'fr' ? "Couleur du texte" : "Text Color")}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={section.config.color || '#1e293b'}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, color: e.target.value } })}
                              className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                            />
                            <Input
                              value={section.config.color || ''}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, color: e.target.value } })}
                              placeholder="#1e293b"
                              className="text-xs font-outfit h-9 pr-3 text-right"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'quantity_offers') {
                const offersDisplayMode = section.config?.offers_display_mode || 'grid';
                const offersSectionTitle = section.config?.offers_section_title || '';
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "عروض الكمية (تخفيض تدريجي)" : (language === 'fr' ? "Offres de quantité" : "Quantity Offers")}</h4>
                      </div>
                      {!showAddOffer && (
                        <button type="button" onClick={() => setShowAddOffer(true)} className="text-xs text-primary hover:underline">{language === 'ar' ? "+ إضافة عرض" : "+ Add Offer"}</button>
                      )}
                    </div>

                    {/* Section Title Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "عنوان القسم (اختياري)" : (language === 'fr' ? "Titre de la section (optionnel)" : "Section Title (optional)")}</label>
                      <Input
                        value={offersSectionTitle}
                        onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, offers_section_title: e.target.value } })}
                        placeholder={language === 'ar' ? "عروض الكمية (اختر الكمية لتخفيض السعر)" : (language === 'fr' ? "Offres de quantité" : "Quantity Offers")}
                        className="text-xs font-cairo h-9"
                      />
                    </div>

                    {/* Display Mode Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "طريقة العرض" : (language === 'fr' ? "Mode d'affichage" : "Display Mode")}</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateSection(section.id, { config: { ...section.config, offers_display_mode: 'grid' } })}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${offersDisplayMode === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30'}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
                          {language === 'ar' ? "شبكة" : (language === 'fr' ? "Grille" : "Grid")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSection(section.id, { config: { ...section.config, offers_display_mode: 'list' } })}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${offersDisplayMode === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/30'}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="6.5" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="12" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
                          {language === 'ar' ? "قائمة" : (language === 'fr' ? "Liste" : "List")}
                        </button>
                      </div>
                    </div>
                    
                    {showAddOffer && (
                      <div className="flex items-end gap-2 bg-muted/5 p-3 rounded-xl border border-border">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-muted-foreground">{language === 'ar' ? "الكمية" : "Quantity"}</label>
                          <Input type="number" min="1" placeholder="2" value={offerQty} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("add-offer-btn")?.click(); } }} onChange={(e) => setOfferQty(e.target.value)} className="font-outfit text-xs" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-muted-foreground">{language === 'ar' ? "السعر الإجمالي (DZD)" : "Total Price (DZD)"}</label>
                          <Input type="number" min="0" placeholder="3800" value={offerPrice} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("add-offer-btn")?.click(); } }} onChange={(e) => setOfferPrice(e.target.value)} className="font-outfit text-xs" />
                        </div>
                        <div
                          id="add-offer-btn"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const q = parseInt(offerQty);
                            const p = parseFloat(offerPrice);
                            if (q > 0 && p > 0) {
                              setQuantityOffers((prev: any[]) => [...prev, { quantity: q, price: p, label: "" }].sort((a: any, b: any) => a.quantity - b.quantity));
                              setOfferQty(""); setOfferPrice(""); setShowAddOffer(false);
                            }
                          }}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer active:scale-95 select-none"
                        >إضافة</div>
                        <button type="button" onClick={() => setShowAddOffer(false)} className="text-xs text-muted-foreground p-2">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
                      </div>
                    )}

                    {quantityOffers.length > 0 ? (
                      <div className="space-y-1.5">
                        {quantityOffers.map((offer, i) => {
                          const unitPrice = offer.price / offer.quantity;
                          const savingPct = parseFloat(price) > 0 ? Math.round(((parseFloat(price) - unitPrice) / parseFloat(price)) * 100) : 0;
                          return (
                            <div key={i} className="flex items-center justify-between bg-muted/5 rounded-lg px-3 py-2 border border-border">
                              <div>
                                <span className="text-sm font-bold font-outfit">{offer.quantity}×</span>
                                <span className="text-xs text-muted-foreground mr-2">{formatCurrency(offer.price)}</span>
                                {savingPct > 0 && <span className="text-[10px] text-green-400 mr-2">{language === 'ar' ? "وفر" : "Save"} {savingPct}%</span>}
                              </div>
                              <button type="button" onClick={() => setQuantityOffers((prev: any[]) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs">{language === 'ar' ? "حذف" : "Delete"}</button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{language === 'ar' ? "لا توجد عروض كمية. أضف عروضًا لتشجيع الشراء بكميات أكبر." : "No quantity offers. Add offers to encourage larger purchases."}</p>
                    )}

                    {/* Section Styling & Colors block */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5 font-cairo">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        {language === 'ar' ? "ألوان ومظهر القسم" : (language === 'fr' ? "Couleurs et apparence" : "Section Styling & Colors")}
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color")}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={section.config.background_color || '#ffffff'}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, background_color: e.target.value } })}
                              className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                            />
                            <Input
                              value={section.config.background_color || ''}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, background_color: e.target.value } })}
                              placeholder="#ffffff"
                              className="text-xs font-outfit h-9 pr-3 text-right"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 text-right">
                          <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون النصوص" : (language === 'fr' ? "Couleur du texte" : "Text Color")}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={section.config.color || '#1e293b'}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, color: e.target.value } })}
                              className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                            />
                            <Input
                              value={section.config.color || ''}
                              onChange={(e) => handleUpdateSection(section.id, { config: { ...section.config, color: e.target.value } })}
                              placeholder="#1e293b"
                              className="text-xs font-outfit h-9 pr-3 text-right"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'security_captcha') {
                const hasNoCaptchaKeys = !(selectedStore?.settings as any)?.security_captcha_site_key || !(selectedStore?.settings as any)?.security_captcha_secret_key;
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "حماية كابتشا Google reCAPTCHA v3" : "Google reCAPTCHA v3 Protection"}</h4>
                      </div>
                      <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
                    </div>
                    {hasNoCaptchaKeys && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{language === 'ar' ? "تنبيه: لم تقم بإعداد مفاتيح Google reCAPTCHA في إعدادات المتجر بعد. يرجى تهيئتها لضمان عمل الخدمة." : "reCAPTCHA keys not set. Configure them in settings."}</span>
                      </div>
                    )}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "يحمي هذا القسم استمارة الطلب من الروبوتات والسبام باستخدام كابتشا Google غير المرئية." : "Invisible Google reCAPTCHA protects from bots/spam."}
                      </p>
                      <p className="text-[11px] text-primary mt-2">
                        {language === 'ar' ? "💡 يتم إعداد المفاتيح السرية في إعدادات الأمان العامة للمتجر. يمكنك سحب البطاقة لتغيير موضع شعار/إشعار الحماية على صفحة الهبوط." : "Secret keys are set in store security configurations. Drag card to move badge."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'security_otp') {
                const hasNoOtpConfig = !(selectedStore?.settings as any)?.security_firebase_config_json;
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "التحقق عبر رسائل الهاتف SMS OTP" : "SMS OTP Verification"}</h4>
                      </div>
                      <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
                    </div>
                    {hasNoOtpConfig && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{language === 'ar' ? "تنبيه: لم تقم بتهيئة إعدادات Firebase لرسائل OTP في إعدادات المتجر بعد. يرجى تهيئتها لضمان عمل الخدمة." : "Firebase not configured. Configure in store settings."}</span>
                      </div>
                    )}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "يفرض هذا القسم إرسال رمز تحقق مؤقت (OTP) عبر رسائل الـ SMS للتحقق من هوية المشتري قبل إتمام الشراء." : "Enforce verification code (OTP) via SMS before checkout."}
                      </p>
                      <p className="text-[11px] text-primary mt-2">
                        {language === 'ar' ? "💡 يتطلب ربط وتهيئة إعدادات Firebase في لوحة التحكم العامة للمتجر. يمكنك تغيير موضع صندوق التحقق بسحب البطاقة." : "Requires Firebase configured in store general panel. Drag to reposition."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'security_rate_limit') {
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-bold text-sm">{language === 'ar' ? "تحديد الطلبات اليومية لكل IP" : "Daily Orders Limit per IP"}</h4>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "يمنع نفس المستخدم أو الجهاز من إرسال أكثر من الحد الأقصى من الطلبات يومياً للحد من التلاعب." : "Limits same IP to a maximum daily orders count."}
                      </p>
                      <p className="text-[11px] text-primary mt-2">
                        {language === 'ar' ? "💡 يمكنك تحديد الحد اليومي للطلبات من الإعدادات العامة للأمان في المتجر. يمكنك سحب البطاقة لتغيير موضع الإشعار." : "Define limit in general security. Drag to change notification position."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'security_algerian_ip') {
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "حظر الطلبات من خارج الجزائر (Algerian IPs Only)" : "Block Outside Algeria (Algerian IPs Only)"}</h4>
                      </div>
                      <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "يتحقق من بلد المشتري عبر عنوان الـ IP ويمنع تسجيل الطلب إذا كان من خارج الجزائر." : "Verifies buyer country by IP and restricts foreign orders."}
                      </p>
                      <p className="text-[11px] text-primary mt-2">
                        💡 {language === 'ar' ? "يعمل تلقائياً لتفادي النقرات والطلبات الوهمية من الخارج. يمكنك سحب البطاقة لتغيير موضع إشعار البلد المتاح." : "Works automatically to avoid foreign spam clicks. Drag to reposition."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'security_commitment') {
                const config = section.config || {};
                const commitmentText = config.text || (language === 'ar' ? "أتعهد بجدية طلبي واستلام المنتج عند وصوله من شركة التوصيل." : (language === 'fr' ? "Je m'engage à être sérieux concernant ma commande." : "I commit to my order and promise to receive it."));
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm font-cairo">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "أمان: التزام العميل بجدية الطلب" : (language === 'fr' ? "Sécurité : Engagement du client" : "Security: Customer Commitment")}</h4>
                      </div>
                      <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground">{language === 'ar' ? "نص الالتزام (يظهر بجانب مربع الاختيار)" : (language === 'fr' ? "Texte de l'engagement" : "Commitment Text")}</label>
                      <textarea
                        value={commitmentText}
                        onChange={(e) => {
                          const newConfig = { ...config, text: e.target.value };
                          handleUpdateSection(section.id, { config: newConfig });
                        }}
                        className="w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground focus-visible:outline-none text-right min-h-[80px] font-cairo leading-relaxed"
                        placeholder={language === 'ar' ? "اكتب نص الالتزام هنا..." : "Write commitment text here..."}
                      />
                    </div>
                    
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-1">
                      <p className="text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "يمنع هذا القسم العميل من إرسال الطلب قبل تحديد مربع الموافقة على هذا الالتزام." : "This prevents the customer from submitting the order without checking the box."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'custom_html') {
                const config = section.config || {};
                const htmlCode = config.html || "";
                return (
                  <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm font-cairo">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">{language === 'ar' ? "كود HTML مخصص (Custom HTML)" : (language === 'fr' ? "Code HTML personnalisé" : "Custom HTML Code")}</h4>
                      </div>
                      <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">{language === 'ar' ? "حذف" : (language === 'fr' ? "Supprimer" : "Delete")}</Button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground">{language === 'ar' ? "أدخل كود HTML الخاص بك هنا:" : (language === 'fr' ? "Entrez votre code HTML ici :" : "Enter your HTML code here:")}</label>
                      <textarea
                        value={htmlCode}
                        onChange={(e) => {
                          const newConfig = { ...config, html: e.target.value };
                          handleUpdateSection(section.id, { config: newConfig });
                        }}
                        className="w-full rounded-xl border border-border bg-slate-950 px-3 py-2 text-xs text-green-400 focus-visible:outline-none text-left min-h-[160px] font-mono leading-relaxed"
                        placeholder="<div>\n  <h1>Hello World</h1>\n</div>"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-1">
                      <p className="text-muted-foreground leading-relaxed">
                        {language === 'ar' ? "⚠️ تحذير: يرجى كتابة كود HTML صحيح فقط. الأخطاء في الكود قد تؤدي إلى تشويه مظهر صفحة المنتج." : "⚠️ Warning: Write valid HTML only. Invalid code may break layout."}
                      </p>
                    </div>
                  </div>
                );
              }

              if (section.section_type === 'checkout') {
                return (
                  <CheckoutSectionEditor
                    key={section.id}
                    section={section}
                    handleUpdateSection={handleUpdateSection}
                  />
                );
              }

              if (section.section_type === 'reviews') {
                return (
                  <ReviewsSectionEditor
                    key={section.id}
                    section={section}
                    currentStoreId={currentStoreId}
                    productId={productId}
                    isCreateMode={isCreateMode}
                    handleUpdateSection={handleUpdateSection}
                    toggleLayoutSection={toggleLayoutSection}
                  />
                );
              }

              const meta = sectionTypeMeta[section.section_type] || sectionTypeMeta.text;
              const config = section.config || {};
              const isEditing = editingSection?.id === section.id;

              return (
                <div key={section.id} id={`section-card-${section.id}`} className="bg-card border border-border rounded-2xl p-5 space-y-4 text-right shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      {meta.icon}
                      <h4 className="font-bold text-sm">{meta.label}</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => setEditingSection(isEditing ? null : { ...section, config })} size="sm" variant="outline" className="text-xs">
                        {isEditing ? (language === 'ar' ? "إغلاق التعديل" : (language === 'fr' ? "Fermer l'édition" : "Close Editor")) : (language === 'ar' ? "تعديل المحتوى" : (language === 'fr' ? "Modifier le contenu" : "Edit Content"))}
                      </Button>
                      {!["product_info", "checkout", "footer", "header", "quantity_offers", "security_captcha", "security_phone_validation", "security_otp", "security_rate_limit", "security_algerian_ip"].includes(section.section_type) && (
                        <Button type="button" onClick={() => toggleLayoutSection(section.section_type, section.id)} size="sm" variant="destructive" className="text-xs px-2 h-7">
                          حذف
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    (section.section_type === 'text' || section.section_type === 'footer' || section.section_type === 'header') ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/5 rounded-lg">
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="p-1.5 rounded hover:bg-muted/20 font-bold text-sm min-w-[28px]" title="عريض">B</button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="p-1.5 rounded hover:bg-muted/20 italic text-sm min-w-[28px]" title="مائل">I</button>
                          <span className="w-px h-5 bg-border mx-1" />
                          <select onChange={(e) => document.execCommand('fontName', false, e.target.value)} className="bg-muted/10 border border-border rounded text-xs px-1 py-1 text-foreground">
                            <option value="">{language === 'ar' ? "الخط" : "Font"}</option>
                            <option value="Arial">Arial</option>
                            <option value="Tahoma">Tahoma</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Cairo">Cairo</option>
                          </select>
                          <select onChange={(e) => { e.preventDefault(); document.execCommand('fontSize', false, e.target.value); }} className="bg-muted/10 border border-border rounded text-xs px-1 py-1 text-foreground">
                            <option value="" disabled>{language === 'ar' ? "الحجم" : "Size"}</option>
                            <option value="1">{language === 'ar' ? "صغير جداً" : "Very Small"}</option>
                            <option value="3">{language === 'ar' ? "صغير" : "Small"}</option>
                            <option value="5">{language === 'ar' ? "وسط" : "Medium"}</option>
                            <option value="7">{language === 'ar' ? "كبير" : "Large"}</option>
                          </select>
                          <span className="w-px h-5 bg-border mx-1" />
                          <label className="p-1.5 rounded hover:bg-muted/20 cursor-pointer text-xs min-w-[28px] text-center relative" title="لون النص">
                            <span className="block w-4 h-4 rounded border border-border" style={{ backgroundColor: editingSection.config.color || '#ffffff' }} />
                            <input type="color" value={editingSection.config.color || '#ffffff'} onChange={(e) => { document.execCommand('foreColor', false, e.target.value); setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, color: e.target.value } } : prev); }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                          </label>
                          <span className="w-px h-5 bg-border mx-1" />
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight'); }} className="p-1.5 rounded hover:bg-muted/20 text-xs min-w-[28px]"><svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg></button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter'); }} className="p-1.5 rounded hover:bg-muted/20 text-xs min-w-[28px]"><svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M5 12h14M3 18h18" /></svg></button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft'); }} className="p-1.5 rounded hover:bg-muted/20 text-xs min-w-[28px]"><svg className="w-3.5 h-3.5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="5" cy="12" r="1" fill="currentColor" /></svg></button>
                        </div>

                        <div
                          id={`text-editor-${section.id}`}
                          contentEditable
                          suppressContentEditableWarning
                          ref={(el) => { if (el && editingSection.config.content && !el.innerHTML) el.innerHTML = editingSection.config.content; }}
                          onKeyDown={(e) => e.stopPropagation()}
                          onBlur={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, content: (e.target as HTMLElement).innerHTML } } : prev)}
                          className="min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none text-right"
                          style={{ backgroundColor: editingSection.config.background_color || 'transparent', textAlign: editingSection.config.text_align || 'right' }}
                        />

                        {/* Section Styling & Colors block */}
                        <div className="pt-4 border-t border-border space-y-3">
                          <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5 font-cairo">
                            <Palette className="h-3.5 w-3.5 text-primary" />
                            {language === 'ar' ? "ألوان ومظهر القسم" : (language === 'fr' ? "Couleurs et apparence" : "Section Styling & Colors")}
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color")}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSection.config.background_color || '#ffffff'}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, background_color: e.target.value } } : prev)}
                                  className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                                />
                                <Input
                                  value={editingSection.config.background_color || ''}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, background_color: e.target.value } } : prev)}
                                  placeholder="#ffffff"
                                  className="text-xs font-outfit h-9 pr-3 text-right"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون النصوص" : (language === 'fr' ? "Couleur du texte" : "Text Color")}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSection.config.color || '#1e293b'}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, color: e.target.value } } : prev)}
                                  className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                                />
                                <Input
                                  value={editingSection.config.color || ''}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, color: e.target.value } } : prev)}
                                  placeholder="#1e293b"
                                  className="text-xs font-outfit h-9 pr-3 text-right"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" onClick={() => handleUpdateSection(section.id, { config: editingSection.config })} size="sm" variant="glow" className="text-xs">{language === 'ar' ? "حفظ التغييرات" : "Save Changes"}</Button>
                          <Button type="button" onClick={() => setEditingSection(null)} size="sm" variant="outline" className="text-xs">{language === 'ar' ? "إلغاء" : "Cancel"}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {meta.fields.map((field) => {
                          if (field.type === "image") {
                            const val = editingSection.config[field.key] || "";
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                                {val ? (
                                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                                    <img src={getFullImageUrl(val)} alt={field.label} className="w-full h-32 object-cover" />
                                    <button type="button" onClick={() => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, [field.key]: "" } } : prev)} className="absolute top-1 right-1 bg-black/70 text-red-400 text-xs px-2 py-0.5 rounded">{language === 'ar' ? "إزالة" : "Remove"}</button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center h-20 w-full border border-dashed border-border rounded-lg bg-muted/5 hover:bg-muted/10 cursor-pointer transition-all">
                                    <span className="text-xs text-muted-foreground">{sectionUploading === field.key ? (language === 'ar' ? "جاري الرفع..." : "Uploading...") : (language === 'ar' ? "اضغط لرفع صورة" : "Click to upload image")}</span>
                                    <input type="file" accept="image/*" className="hidden" disabled={sectionUploading === field.key} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSectionFileUpload(field.key, f); }} />
                                  </label>
                                )}
                              </div>
                            );
                          }
                          if (field.type === "color") {
                            return (
                              <div key={field.key} className="flex items-center gap-3">
                                <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                                <input type="color" value={editingSection.config[field.key] || '#1a1a2e'} onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, [field.key]: e.target.value } } : prev)} className="w-9 h-9 rounded cursor-pointer border border-border" />
                              </div>
                            );
                          }
                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                              {field.type === "textarea" ? (
                                <textarea
                                  value={Array.isArray(editingSection.config[field.key]) ? editingSection.config[field.key].join("\n") : (editingSection.config[field.key] || "")}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, [field.key]: field.key === "features" ? e.target.value.split("\n").filter(Boolean) : e.target.value } } : prev)}
                                  className="flex min-h-[60px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none text-right"
                                />
                              ) : (
                                <Input
                                  value={editingSection.config[field.key] || ""}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, [field.key]: e.target.value } } : prev)}
                                  className="text-xs text-right pr-3"
                                />
                              )}
                            </div>
                          );
                        })}

                        {/* Section Styling & Colors block */}
                        <div className="pt-4 border-t border-border space-y-3">
                          <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5 font-cairo">
                            <Palette className="h-3.5 w-3.5 text-primary" />
                            {language === 'ar' ? "ألوان ومظهر القسم" : (language === 'fr' ? "Couleurs et apparence" : "Section Styling & Colors")}
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون الخلفية" : (language === 'fr' ? "Couleur d'arrière-plan" : "Background Color")}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSection.config.background_color || '#ffffff'}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, background_color: e.target.value } } : prev)}
                                  className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                                />
                                <Input
                                  value={editingSection.config.background_color || ''}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, background_color: e.target.value } } : prev)}
                                  placeholder="#ffffff"
                                  className="text-xs font-outfit h-9 pr-3 text-right"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-muted-foreground block">{language === 'ar' ? "لون النصوص" : (language === 'fr' ? "Couleur du texte" : "Text Color")}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editingSection.config.color || '#1e293b'}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, color: e.target.value } } : prev)}
                                  className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent shrink-0"
                                />
                                <Input
                                  value={editingSection.config.color || ''}
                                  onChange={(e) => setEditingSection((prev: any) => prev ? { ...prev, config: { ...prev.config, color: e.target.value } } : prev)}
                                  placeholder="#1e293b"
                                  className="text-xs font-outfit h-9 pr-3 text-right"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button type="button" onClick={() => handleUpdateSection(section.id, { config: editingSection.config })} size="sm" variant="glow" className="text-xs">{language === 'ar' ? "حفظ التغييرات" : "Save Changes"}</Button>
                          <Button type="button" onClick={() => setEditingSection(null)} size="sm" variant="outline" className="text-xs">{language === 'ar' ? "إلغاء" : "Cancel"}</Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-muted-foreground">{language === 'ar' ? "اضغط على \"تعديل المحتوى\" لإدخال التفاصيل." : "Click 'Edit Content' to configure details."}</div>
                  )}
                </div>
              );
                  })}
                </div>
              );
            })()}
            
            {/* Save changes button block at the bottom of Column 2 */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-right flex items-center justify-between gap-4 mt-6">
              <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">
                {language === 'ar' ? "تأكد من حفظ جميع التغييرات قبل الانتقال إلى صفحة أخرى." : "Make sure to save all changes before navigating away."}
              </p>
              <div className="flex gap-3 shrink-0">
                <Button 
                  type="button" 
                  onClick={() => router.push("/products")} 
                  variant="outline" 
                  className="text-xs px-4 py-2 h-auto rounded-xl"
                >
                  {language === 'ar' ? "إلغاء" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  variant="glow" 
                  disabled={submitting} 
                  className="text-xs px-6 py-2.5 h-auto rounded-xl font-bold font-cairo flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{language === 'ar' ? "جاري الحفظ..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isCreateMode ? (language === 'ar' ? "إنشاء وحفظ المنتج" : "Create Product") : (language === 'ar' ? "حفظ التغييرات" : "Save Changes")}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            </div>

          {/* Column 3: Left Column (Phone Preview, lg:w-[30%]) */}
          {/* Live Preview Column (30%) */}
          <div className="w-full lg:w-[30%] sticky top-6 space-y-4 flex-shrink-0">
            <div className="w-full bg-card border border-border rounded-2xl p-5 shadow-sm text-card-foreground text-right" dir="rtl">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-border pb-3 mb-4">
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>معاينة حية لصفحة المنتج ({viewport === 'mobile' ? (language === 'ar' ? 'هاتف' : (language === 'fr' ? 'Mobile' : 'Mobile')) : viewport === 'tablet' ? (language === 'ar' ? 'تابلت' : (language === 'fr' ? 'Tablette' : 'Tablet')) : (language === 'ar' ? 'شاشة' : (language === 'fr' ? 'Écran' : 'Desktop'))})</span>
                </h3>
                <div className="flex items-center gap-1 bg-muted/10 p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded-md transition-all ${viewport === 'mobile' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    title="معاينة الهاتف"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded-md transition-all ${viewport === 'tablet' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    title="معاينة التابلت"
                  >
                    <Tablet className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded-md transition-all ${viewport === 'desktop' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    title="معاينة الشاشة"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {(!title && !price && !primaryImage && images.length === 0 && !description) ? (
                /* Empty/Blank state */
                <div className={`overflow-hidden bg-muted/5 flex flex-col items-center justify-center p-6 text-center text-muted-foreground transition-all duration-300 ${
                  viewport === 'mobile' ? 'border-[6px] border-slate-850 rounded-[28px] w-full max-w-[320px] h-[520px] mx-auto' :
                  viewport === 'tablet' ? 'border-[8px] border-slate-850 rounded-[20px] w-full max-w-[420px] h-[560px] mx-auto' :
                  'border-2 border-slate-800 rounded-xl w-full h-[600px]'
                }`}>
                  <div className="h-14 w-14 bg-muted/20 rounded-full flex items-center justify-center mb-3">
                    <Smartphone className="h-7 w-7 opacity-30 text-muted-foreground" />
                  </div>
                  <h4 className="font-bold text-xs text-foreground mb-1">{language === 'ar' ? "المعاينة فارغة حالياً" : (language === 'fr' ? "Aperçu vide" : "Preview Empty")}</h4>
                  <p className="text-[10px] leading-relaxed max-w-[180px] mx-auto">
                    {language === 'ar' ? "ابدأ بإدخال اسم المنتج، السعر، أو تفعيل أقسام صفحة الهبوط لرؤية المعاينة الحية هنا فوراً." : "Start entering name, price, or enable landing page sections to see live preview."}
                  </p>
                </div>
              ) : (
                /* Storefront mobile mockup */
                <div className={`overflow-hidden shadow-2xl relative bg-slate-900 flex flex-col transition-all duration-300 ${
                  viewport === 'mobile' ? 'border-[6px] border-slate-850 rounded-[28px] w-full max-w-[320px] h-[520px] mx-auto' :
                  viewport === 'tablet' ? 'border-[8px] border-slate-850 rounded-[20px] w-full max-w-[420px] h-[560px] mx-auto' :
                  'border-2 border-slate-800 rounded-xl w-full h-[600px]'
                }`}>
                  {/* Smartphone Speaker/Camera notch mock */}
                  {viewport === 'mobile' && (
                    <div className="absolute top-0 inset-x-0 h-3 bg-slate-800 flex items-center justify-center z-20">
                      <div className="w-12 h-2 bg-black rounded-b-md"></div>
                    </div>
                  )}
                  
                  {/* Preview Scrollable Screen */}
                  <div 
                    className="flex-grow overflow-y-auto pb-6 text-right text-xs" 
                    dir="rtl"
                    style={{
                      background: selectedTheme && (PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-bg']?.includes('gradient') 
                        ? (PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-bg'] 
                        : (!selectedTheme ? 'linear-gradient(to bottom, #f8fafc, #ffffff)' : undefined),
                      backgroundColor: selectedTheme && !(PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-bg']?.includes('gradient') 
                        ? ((PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-bg'] || '#f8fafc') 
                        : undefined,
                      color: selectedTheme ? ((PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-text'] || '#1e293b') : '#1e293b',
                      fontFamily: selectedTheme ? ((PREVIEW_THEME_STYLES[selectedTheme] as any)?.['--theme-font'] || 'sans-serif') : 'sans-serif',
                    }}
                  >
                    <div className={`w-full max-w-full ${viewport === 'mobile' ? 'py-0 space-y-0 px-0' : 'py-4 space-y-4 px-2 md:py-8 md:space-y-6 md:px-4'}`}>
                      {activeList.map((section: any) => {
                      const config = (editingSection && editingSection.id === section.id) 
                        ? (editingSection.config || {}) 
                        : (section.config || {});
                      const previewTheme: any = PREVIEW_THEME_STYLES[selectedTheme] || {};
                      const hasPreviewTheme = !!selectedTheme && !!PREVIEW_THEME_STYLES[selectedTheme];
                      const previewCardStyle: React.CSSProperties = {
                        backgroundColor: config.background_color || (hasPreviewTheme ? (previewTheme as any)['--theme-card-bg'] : undefined),
                        color: config.color || (hasPreviewTheme ? (previewTheme as any)['--theme-text'] : undefined),
                        borderColor: viewport === 'mobile' ? 'transparent' : (hasPreviewTheme ? (previewTheme as any)['--theme-card-border'] : '#cbd5e1'),
                        borderRadius: viewport === 'mobile' ? '0px' : (hasPreviewTheme ? ((previewTheme as any)['--theme-section-radius'] || '12px') : '12px'),
                        borderWidth: viewport === 'mobile' ? '0px' : '1px',
                        borderStyle: 'solid',
                      };
                      const previewCardClass = hasPreviewTheme 
                        ? 'shadow-sm overflow-hidden text-right' 
                        : (viewport === 'mobile' 
                          ? 'bg-white border-b border-slate-100 overflow-hidden text-right' 
                          : 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-right');

                      const isSelectedPreview = section.id === currentSelectedId;
                      const isClickable = !['security_otp','security_captcha','security_phone_validation','security_rate_limit','security_algerian_ip'].includes(section.section_type);
                      
                      // Click-to-Edit handler
                      const handlePreviewSectionClick = () => {
                        if (!isClickable) return;
                        setSelectedSectionId(section.id);
                        // Smooth scroll to editor card in middle column
                        setTimeout(() => {
                          const editorCard = document.getElementById(`section-card-${section.id}`);
                          if (editorCard) {
                            editorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            editorCard.classList.add('ring-2', 'ring-primary');
                            setTimeout(() => editorCard.classList.remove('ring-2', 'ring-primary'), 1500);
                          }
                        }, 50);
                      };

                      const previewClickableProps = isClickable ? {
                        onClick: handlePreviewSectionClick,
                        title: language === 'ar' ? 'انقر لتعديل هذا القسم' : (language === 'fr' ? 'Cliquez pour modifier' : 'Click to edit section'),
                      } : {};

                      const clickableRingClass = isClickable
                        ? `relative group/preview transition-all duration-150 cursor-pointer ${isSelectedPreview ? 'ring-2 ring-primary ring-offset-1 ring-offset-transparent rounded-xl' : 'hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 rounded-xl'}`
                        : '';

                      switch (section.section_type) {
                        case "checkout": {
                          const config = section.config || {};
                          const form_language = config.form_language ?? 'ar';
                          const title = config.title ?? (form_language === 'ar' ? "تقديم طلب شراء (ملء البيانات أدناه)" : (form_language === 'fr' ? "Passer une commande (remplir les données ci-dessous)" : "Place an Order (fill in the details below)"));
                          const button_text = config.button_text ?? (form_language === 'ar' ? "تأكيد طلب الشراء والدفع عند الاستلام" : (form_language === 'fr' ? "Confirmer la commande & Paiement à la livraison" : "Confirm Order & Cash on Delivery"));
                          const show_address = config.show_address ?? true;
                          const show_phone2 = config.show_phone2 === true;

                          const form_bg_color = config.form_bg_color ?? "#ffffff";
                           const form_border_color = config.form_border_color ?? "#cbd5e1";
                          const labels_text_color = config.labels_text_color ?? "#1e293b";
                          const buttons_bg_color = config.buttons_bg_color ?? "#4f46e5";
                          const buttons_text_color = config.buttons_text_color ?? "#ffffff";
                          const fields_border_color = config.fields_border_color ?? "#cbd5e1";
                          const fields_bg_color = config.fields_bg_color ?? "#ffffff";
                          const fields_text_color = config.fields_text_color ?? "#1e293b";

                          // Sticky CTA preview vars
                          const show_sticky_cta_preview = config.show_sticky_cta !== false;
                          const sticky_cta_bg = config.sticky_cta_bg_color || buttons_bg_color;
                          const sticky_cta_txt = config.sticky_cta_text_color || buttons_text_color;
                          const sticky_cta_label = config.sticky_cta_text || button_text;

                          return (
                             <div 
                               key={section.id} 
                               className={`p-4 space-y-4 relative overflow-hidden text-right transition-colors ${clickableRingClass} ${viewport === 'mobile' ? 'rounded-none border-x-0 border-y shadow-none' : 'rounded-2xl border shadow'}`}
                               style={{ 
                                 backgroundColor: form_bg_color,
                                 borderColor: form_border_color,
                                 borderWidth: viewport === 'mobile' ? undefined : '1px',
                                 borderLeftWidth: viewport === 'mobile' ? '0px' : undefined,
                                 borderRightWidth: viewport === 'mobile' ? '0px' : undefined,
                                 borderTopWidth: viewport === 'mobile' ? '1px' : undefined,
                                 borderBottomWidth: viewport === 'mobile' ? '1px' : undefined,
                                 borderStyle: 'solid',
                                 color: labels_text_color
                               }}
                               {...previewClickableProps}
                             >
                               {/* Top colored accent line */}
                               <div className="absolute top-0 right-0 left-0 h-1" style={{ backgroundColor: buttons_bg_color }}></div>

                               {/* Header */}
                               <div className="flex items-center gap-1.5 pt-1">
                                 <ShoppingCart className="h-4 w-4" style={{ color: labels_text_color }} />
                                 <h2 className="text-xs font-black font-cairo" style={{ color: labels_text_color }}>{title}</h2>
                                </div>

                                <div className="space-y-3">

                                  {/* Row 1: Full Name + Phone side-by-side */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                                        <User className="h-3 w-3" style={{ color: labels_text_color }} /> {form_language === 'ar' ? "الاسم" : (form_language === 'fr' ? "Nom" : "Name")}
                                      </label>
                                      <div className="h-8 border rounded-xl flex items-center justify-end px-2 text-[9px] font-medium" style={{ backgroundColor: fields_bg_color, color: `${fields_text_color}80`, borderColor: fields_border_color }}>
                                        {form_language === 'ar' ? "الاسم واللقب" : (form_language === 'fr' ? "Nom complet" : "Full Name")}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                                        <Phone className="h-3 w-3" style={{ color: labels_text_color }} /> {form_language === 'ar' ? "الهاتف" : (form_language === 'fr' ? "Tél." : "Phone")}
                                      </label>
                                      <div className="flex gap-1">
                                        <div className="h-8 border rounded-xl flex items-center justify-end px-2 text-[9px] font-medium flex-grow" style={{ backgroundColor: fields_bg_color, color: `${fields_text_color}80`, borderColor: fields_border_color }}>
                                          06XX XX
                                        </div>
                                        {hasOtp && (
                                          <div className="h-8 rounded-xl flex items-center justify-center px-2 text-[8px] font-bold cursor-not-allowed" style={{ backgroundColor: buttons_bg_color, color: buttons_text_color }}>
                                            SMS
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Second Phone field (optional) */}
                                  {show_phone2 && (
                                    <div className="space-y-1 animate-in fade-in duration-200">
                                      <label className="block text-[10px] font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                                        <Phone className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {form_language === 'ar' ? "رقم هاتف إضافي (اختياري)" : (form_language === 'fr' ? "Numéro alternatif (optionnel)" : "Secondary phone (optional)")}
                                      </label>
                                      <div 
                                        className="h-9 border rounded-xl flex items-center justify-end px-2 text-[10px] font-medium"
                                        style={{
                                          backgroundColor: fields_bg_color,
                                          color: `${fields_text_color}80`,
                                          borderColor: fields_border_color
                                        }}
                                      >
                                        رقم الهاتف البديل
                                      </div>
                                    </div>
                                  )}

                                  {/* Row 2: Wilaya + Commune side-by-side */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                                        <MapPin className="h-3 w-3" style={{ color: labels_text_color }} /> {form_language === 'ar' ? "الولاية" : (form_language === 'fr' ? "Wilaya" : "Province")}
                                      </label>
                                      <div className="h-8 border rounded-xl flex items-center justify-between px-2 text-[9px] font-medium" style={{ backgroundColor: fields_bg_color, color: `${fields_text_color}80`, borderColor: fields_border_color }}>
                                        <span>{form_language === 'ar' ? "اختر الولاية" : "Wilaya"}</span>
                                        <ChevronDown className="h-3 w-3" style={{ color: labels_text_color }} />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-extrabold" style={{ color: labels_text_color }}>{form_language === 'ar' ? "البلدية" : "Commune"}</label>
                                      <div className="h-8 border rounded-xl flex items-center justify-between px-2 text-[9px] font-medium opacity-50" style={{ backgroundColor: fields_bg_color, color: `${fields_text_color}80`, borderColor: fields_border_color }}>
                                        <span>{form_language === 'ar' ? "البلدية" : "Commune"}</span>
                                        <ChevronDown className="h-3 w-3" style={{ color: labels_text_color }} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Delivery type select cards */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold" style={{ color: labels_text_color }}>{form_language === 'ar' ? "طريقة الاستلام والتوصيل" : (form_language === 'fr' ? "Mode de livraison" : "Delivery Method")}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div 
                                        className="py-2 px-1 rounded-xl border text-[9px] font-extrabold flex flex-col items-center gap-1"
                                        style={{
                                          backgroundColor: `${buttons_bg_color}15`,
                                          color: buttons_bg_color,
                                          borderColor: buttons_bg_color,
                                          borderWidth: "1px",
                                          borderStyle: "solid"
                                        }}
                                      >
                                        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {form_language === 'ar' ? "توصيل للمنزل" : (form_language === 'fr' ? "À domicile" : "Home Delivery")}</span>
                                        <span className="text-[8px] font-bold opacity-80">600 DZD</span>
                                      </div>
                                      <div 
                                        className="py-2 px-1 rounded-xl border text-[9px] font-extrabold flex flex-col items-center gap-1 opacity-60"
                                        style={{
                                          backgroundColor: fields_bg_color,
                                          color: labels_text_color,
                                          borderColor: fields_border_color,
                                          borderWidth: "1px",
                                          borderStyle: "solid"
                                        }}
                                      >
                                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {form_language === 'ar' ? "استلام من المكتب" : (form_language === 'fr' ? "Au bureau" : "Office Pickup")}</span>
                                        <span className="text-[8px] font-bold opacity-80">400 DZD</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Address Details */}
                                  {show_address && (
                                    <div className="space-y-1 animate-in fade-in duration-200">
                                      <label className="block text-[10px] font-extrabold" style={{ color: labels_text_color }}>{form_language === 'ar' ? "العنوان بالتفصيل (اختياري)" : (form_language === 'fr' ? "Adresse détaillée" : "Detailed Address")}</label>
                                      <div 
                                        className="h-9 border rounded-xl flex items-center justify-end px-2 text-[10px] font-medium"
                                        style={{
                                          backgroundColor: fields_bg_color,
                                          color: `${fields_text_color}80`,
                                          borderColor: fields_border_color
                                        }}
                                      >
                                        {form_language === 'ar' ? "اسم الشارع، الحي، رقم المنزل" : (form_language === 'fr' ? "Rue, quartier, maison" : "Street name, neighborhood, house number")}
                                      </div>
                                    </div>
                                  )}

                                  {/* Quantity Selector */}
                                  <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold" style={{ color: labels_text_color }}>{form_language === 'ar' ? "الكمية المطلوبة" : (form_language === 'fr' ? "Quantité commandée" : "Order Quantity")}</label>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-sm"
                                        style={{
                                          backgroundColor: fields_bg_color,
                                          color: labels_text_color,
                                          borderColor: fields_border_color
                                        }}
                                      >-</div>
                                      <span className="flex-grow text-center text-sm font-black" style={{ color: labels_text_color }}>1</span>
                                      <div 
                                        className="h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-sm"
                                        style={{
                                          backgroundColor: fields_bg_color,
                                          color: labels_text_color,
                                          borderColor: fields_border_color
                                        }}
                                      >+</div>
                                    </div>
                                  </div>

                                  {/* Price Calculation details summary */}
                                  <div className="rounded-xl p-3 space-y-2 border" style={{ backgroundColor: `${fields_bg_color}10`, borderColor: fields_border_color }}>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="font-medium font-cairo" style={{ color: labels_text_color, opacity: 0.7 }}>{form_language === 'ar' ? "سعر الوحدة" : (form_language === 'fr' ? "Prix unitaire" : "Unit Price")}</span>
                                      <span className="font-extrabold font-outfit" style={{ color: labels_text_color }}>2,500 DZD</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] border-b pb-1.5" style={{ borderColor: fields_border_color }}>
                                      <span className="font-medium font-cairo" style={{ color: labels_text_color, opacity: 0.7 }}>{form_language === 'ar' ? "تكلفة التوصيل" : (form_language === 'fr' ? "Livraison" : "Delivery Fee")}</span>
                                      <span className="font-extrabold font-outfit" style={{ color: labels_text_color }}>600 DZD</span>
                                    </div>
                                    <div className="pt-1 flex justify-between items-center text-[11px]">
                                      <span className="font-black font-cairo" style={{ color: labels_text_color }}>{form_language === 'ar' ? "المجموع الإجمالي" : (form_language === 'fr' ? "Total Général" : "Grand Total")}</span>
                                      <span className="text-xs font-black font-outfit" style={{ color: buttons_bg_color }}>3,100 DZD</span>
                                    </div>
                                  </div>

                                  {/* Security Features Notices */}
                                  {hasCaptcha && (
                                    <div className="p-2.5 border rounded-xl space-y-1 text-right bg-black/5" style={{ borderColor: fields_border_color }}>
                                      <div className="flex items-center gap-1.5 text-[9px] justify-start" style={{ color: labels_text_color }}>
                                        <Shield className="h-3 w-3 flex-shrink-0" style={{ color: buttons_bg_color }} />
                                        <span>{form_language === 'ar' ? "محمي بكابتشا ضد الطلبات العشوائية" : "reCAPTCHA Protected"}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Submit button mock */}
                                  <div 
                                    className="h-10 rounded-xl flex items-center justify-center text-[10px] font-bold cursor-not-allowed shadow-sm"
                                    style={{
                                      backgroundColor: buttons_bg_color,
                                      color: buttons_text_color
                                    }}
                                  >
                                    {button_text}
                                  </div>
                                </div>
                             </div>
                           )
                        }
                        case "product_info":
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              {isSelectedPreview && <div className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow">{language === 'ar' ? "جاري التعديل" : "Editing"}</div>}
                              <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden" style={hasPreviewTheme ? { backgroundColor: previewTheme['--theme-card-bg'] } : { backgroundColor: '#f8fafc' }}>
                                {images.length > 0 ? (
                                  <img src={getFullImageUrl(images.find(img => img.is_primary)?.image_url || images[0].image_url)} alt={title || "Product"} className="w-full h-full object-cover" />
                                ) : primaryImage ? (
                                  <img src={getFullImageUrl(primaryImage)} alt={title || "Product"} className="w-full h-full object-cover" />
                                ) : (
                                  <Image className="h-6 w-6 text-slate-300" />
                                )}
                                <span className={`absolute top-2 ${language === 'ar' ? 'right-2' : 'left-2'} bg-red-600 text-white text-[6px] font-black tracking-wider px-1.5 py-0.5 rounded-full shadow z-10`}>
                                  COD
                                </span>
                              </div>
                              {images.length > 1 && (
                                <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-slate-100">
                                  {images.slice(0, 5).map((img, idx) => (
                                    <div key={idx} className={`h-7 w-7 rounded overflow-hidden border flex-shrink-0 ${idx === 0 ? 'border-primary' : 'border-transparent opacity-60'}`}>
                                      <img src={getFullImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className={`p-3 space-y-1.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <h1 
                                  className={hasPreviewTheme ? 'font-extrabold text-xs' : 'text-xs font-extrabold text-slate-900'}
                                  style={{
                                    color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : undefined),
                                  }}
                                >
                                  {title || (language === 'ar' ? "عنوان المنتج..." : "Product Title...")}
                                </h1>
                                {description && (
                                  <p 
                                    className={hasPreviewTheme ? 'text-[9px] leading-relaxed opacity-70' : 'text-[9px] text-slate-500 leading-relaxed'}
                                    style={{
                                      color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : undefined),
                                    }}
                                  >
                                    {description.length > 80 ? description.substring(0, 80) + '...' : description}
                                  </p>
                                )}
                                {hasVariants && variantAttributes.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-dashed border-slate-100">
                                    {variantAttributes.slice(0, 2).map((attr, aIdx) => (
                                      <div key={aIdx} className="space-y-0.5">
                                        <span className="text-[8px] font-bold text-slate-500" style={{ color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : undefined), opacity: 0.6 }}>{attr.name}:</span>
                                        <div className="flex flex-wrap gap-0.5">
                                          {attr.values.slice(0, 4).map((val, vIdx) => (
                                            <span key={vIdx} className={`px-1.5 py-0.5 rounded text-[7px] font-bold border ${vIdx === 0 ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                              {val}
                                            </span>
                                          ))}
                                          {attr.values.length > 4 && <span className="text-[7px] text-slate-400">+{attr.values.length - 4}</span>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                                  <div 
                                    className={hasPreviewTheme ? 'text-sm font-black font-outfit' : 'text-sm font-black text-primary font-outfit'}
                                    style={{
                                      color: config.color || (hasPreviewTheme ? previewTheme['--theme-accent'] : undefined),
                                    }}
                                  >
                                    {price ? formatCurrency(parseFloat(price)) : "0.00 DZD"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        case "quantity_offers": {
                          const offersDisplayMode = section.config?.offers_display_mode || 'grid';
                          const offersSectionTitle = section.config?.offers_section_title || '';
                          const defaultOffersTitle = language === 'ar' ? "عروض الكمية (اختر الكمية لتخفيض السعر)" : (language === 'fr' ? "Offres de quantité" : "Quantity Offers");
                          return quantityOffers.length > 0 ? (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className={`p-3 space-y-1.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <h3 
                                  className={hasPreviewTheme ? 'text-[10px] font-extrabold' : 'text-[10px] font-extrabold text-slate-900'}
                                  style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}
                                >
                                  {offersSectionTitle || defaultOffersTitle}
                                </h3>
                                {offersDisplayMode === 'list' ? (
                                  /* ── LIST MODE ── */
                                  <div className="space-y-1">
                                    {/* Base 1-piece row */}
                                    <div 
                                      className="flex items-center justify-between px-2 py-1.5"
                                      style={hasPreviewTheme ? {
                                        borderWidth: '2px', borderStyle: 'solid',
                                        borderColor: previewTheme['--theme-accent'] || '#6366f1',
                                        borderRadius: previewTheme['--theme-section-radius'] || '8px',
                                        backgroundColor: `${previewTheme['--theme-accent'] || '#6366f1'}10`,
                                      } : {
                                        borderWidth: '2px', borderStyle: 'solid',
                                        borderColor: '#6366f1', borderRadius: '8px',
                                        backgroundColor: 'rgba(99,102,241,0.05)',
                                      }}
                                    >
                                      <div className={hasPreviewTheme ? 'text-[9px] font-bold' : 'text-[9px] font-bold text-slate-900'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                        {language === 'ar' ? "1 قطعة" : "1 piece"}
                                      </div>
                                      <div className={hasPreviewTheme ? 'text-[10px] font-black font-outfit' : 'text-[10px] font-black text-slate-900 font-outfit'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                        {price ? formatCurrency(parseFloat(price)) : "0 DZD"}
                                      </div>
                                    </div>
                                    {quantityOffers.map((o: any, idx: number) => {
                                      const basePrice = price ? parseFloat(price) : 0;
                                      const savePct = basePrice > 0 ? Math.round((1 - o.price / o.quantity / basePrice) * 100) : 0;
                                      return (
                                        <div 
                                          key={idx}
                                          className="flex items-center justify-between px-2 py-1.5"
                                          style={hasPreviewTheme ? {
                                            borderWidth: '2px', borderStyle: 'solid',
                                            borderColor: previewTheme['--theme-card-border'] || '#e5e7eb',
                                            borderRadius: previewTheme['--theme-section-radius'] || '8px',
                                          } : {
                                            borderWidth: '2px', borderStyle: 'solid',
                                            borderColor: '#f1f5f9', borderRadius: '8px',
                                          }}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <div className={hasPreviewTheme ? 'text-[9px] font-bold' : 'text-[9px] font-bold text-slate-900'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                              {o.quantity} {language === 'ar' ? "قطع" : "pieces"}
                                            </div>
                                            {savePct > 0 && (
                                              <div className="text-[7px] text-green-600 font-bold">
                                                -{savePct}%
                                              </div>
                                            )}
                                          </div>
                                          <div className={hasPreviewTheme ? 'text-[10px] font-black font-outfit' : 'text-[10px] font-black text-slate-900 font-outfit'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                            {formatCurrency(o.price)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  /* ── GRID MODE (default) ── */
                                  <div className="grid grid-cols-2 gap-1">
                                    {/* Base 1-piece card */}
                                    <div 
                                      className="p-1.5 text-center"
                                      style={hasPreviewTheme ? {
                                        borderWidth: '2px', borderStyle: 'solid',
                                        borderColor: previewTheme['--theme-accent'] || '#6366f1',
                                        borderRadius: previewTheme['--theme-section-radius'] || '8px',
                                        backgroundColor: `${previewTheme['--theme-accent'] || '#6366f1'}10`,
                                      } : {
                                        borderWidth: '2px', borderStyle: 'solid',
                                        borderColor: '#6366f1', borderRadius: '8px',
                                        backgroundColor: 'rgba(99,102,241,0.05)',
                                      }}
                                    >
                                      <div className={hasPreviewTheme ? 'text-[10px] font-black font-outfit' : 'text-[10px] font-black text-slate-900 font-outfit'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                        {price ? formatCurrency(parseFloat(price)) : "0 DZD"}
                                      </div>
                                      <div className={hasPreviewTheme ? 'text-[8px] opacity-60' : 'text-[8px] text-slate-500'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                        {language === 'ar' ? "1 قطعة" : "1 piece"}
                                      </div>
                                    </div>
                                    {quantityOffers.map((o: any, idx: number) => {
                                      const basePrice = price ? parseFloat(price) : 0;
                                      const savePct = basePrice > 0 ? Math.round((1 - o.price / o.quantity / basePrice) * 100) : 0;
                                      return (
                                        <div 
                                          key={idx} 
                                          className="p-1.5 text-center"
                                          style={hasPreviewTheme ? {
                                            borderWidth: '2px', borderStyle: 'solid',
                                            borderColor: previewTheme['--theme-card-border'] || '#e5e7eb',
                                            borderRadius: previewTheme['--theme-section-radius'] || '8px',
                                          } : {
                                            borderWidth: '2px', borderStyle: 'solid',
                                            borderColor: '#f1f5f9', borderRadius: '8px',
                                          }}
                                        >
                                          <div className={hasPreviewTheme ? 'text-[10px] font-black font-outfit' : 'text-[10px] font-black text-slate-900 font-outfit'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                            {formatCurrency(o.price)}
                                          </div>
                                          <div className={hasPreviewTheme ? 'text-[8px] opacity-60' : 'text-[8px] text-slate-500'} style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}>
                                            {o.quantity} {language === 'ar' ? "قطع" : "pieces"}
                                          </div>
                                          {savePct > 0 && (
                                            <div className="text-[7px] text-green-600 font-bold mt-0.5">
                                              {language === 'ar' ? "وفر" : "Save"} {savePct}%
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null;
                        }

                        case "security_otp":
                        case "security_captcha":
                        case "security_phone_validation":
                        case "security_rate_limit":
                        case "security_algerian_ip":
                          return null;
                        case "security_commitment": {
                          const commitmentText = config.text || (language === 'ar' ? "أتعهد بجدية طلبي واستلام المنتج عند وصوله من شركة التوصيل." : (language === 'fr' ? "Je m'engage à être sérieux concernant ma commande." : "I commit to my order and promise to receive it."));
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className="p-3 flex items-start gap-2 justify-start">
                                <input type="checkbox" checked={false} readOnly className="rounded border-slate-300 h-3.5 w-3.5 mt-0.5 accent-primary flex-shrink-0 cursor-pointer" />
                                <span className="text-[10px] font-bold text-right leading-relaxed flex-grow" style={{ color: previewTheme['--theme-text'] }}>
                                  {commitmentText} <span className="text-red-500">*</span>
                                </span>
                              </div>
                            </div>
                          );
                        }
                        case "custom_html": {
                          const htmlCode = config.html || "";
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              {htmlCode ? (
                                <div 
                                  className="text-[10px] leading-relaxed p-2" 
                                  dangerouslySetInnerHTML={{ __html: htmlCode }}
                                />
                              ) : (
                                <div className="h-16 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 font-mono">
                                  {language === 'ar' ? "كود HTML مخصص فارغ..." : "Empty custom HTML code..."}
                                </div>
                              )}
                            </div>
                          );
                        }
                        case "text":
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass} ${language === 'ar' ? 'text-right' : 'text-left'}`} style={previewCardStyle} {...previewClickableProps}>
                              <div 
                                className="text-[9px] leading-relaxed p-3" 
                                style={{ 
                                  fontSize: config.font_size || '10px',
                                  color: hasPreviewTheme ? (config.color !== '#ffffff' ? config.color : previewTheme['--theme-text']) : (config.color || '#334155'), 
                                  textAlign: config.text_align || (language === 'ar' ? 'right' : 'left') as any 
                                }}
                                dangerouslySetInnerHTML={{ __html: config.content || (language === 'ar' ? 'نص مخصص...' : 'Custom text...') }}
                              />
                            </div>
                          );
                        case "footer":
                          return (
                            <div 
                              key={section.id} 
                              className={`w-full text-center py-4 border-t ${clickableRingClass}`} 
                              style={{
                                backgroundColor: config.background_color || (hasPreviewTheme ? (previewTheme['--theme-bg'] || '#ffffff') : '#ffffff'),
                                color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : '#1e293b'),
                                borderColor: hasPreviewTheme ? (previewTheme['--theme-card-border'] || '#f1f5f9') : '#cbd5e1',
                                borderTopWidth: '1px',
                                borderTopStyle: 'solid' as const,
                              }} 
                              {...previewClickableProps}
                            >
                              <div 
                                className="text-[9px] opacity-80 leading-relaxed px-3 font-cairo" 
                                style={{ 
                                  fontSize: config.font_size || '10px',
                                  color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : '#64748b'), 
                                  textAlign: config.text_align || 'center' as any 
                                }}
                                dangerouslySetInnerHTML={{ __html: config.content || (language === 'ar' ? '© جميع الحقوق محفوظة' : (language === 'fr' ? '© Tous droits réservés' : '© All rights reserved')) }}
                              />
                            </div>
                          );
                        case "header":
                          return (
                            <div 
                              key={section.id} 
                              className={`w-full py-3 px-4 border-b flex items-center justify-between ${clickableRingClass}`} 
                              style={{ 
                                backgroundColor: config.background_color || (hasPreviewTheme ? (previewTheme['--theme-bg'] || '#ffffff') : '#ffffff'),
                                color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : '#1e293b'),
                                borderColor: hasPreviewTheme ? (previewTheme['--theme-card-border'] || '#f1f5f9') : '#cbd5e1',
                                borderBottomWidth: '1px',
                                borderBottomStyle: 'solid' as const,
                              }} 
                              {...previewClickableProps}
                            >
                              {selectedStore?.logo ? (
                                <img src={getFullImageUrl(selectedStore.logo)} alt={selectedStore.name} className="h-6 w-auto object-contain flex-shrink-0" />
                              ) : (
                                <div className="flex items-center gap-1.5 flex-grow justify-start">
                                  <div 
                                    className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                    style={hasPreviewTheme ? {
                                      backgroundColor: `${previewTheme['--theme-accent'] || '#6366f1'}15`,
                                      color: previewTheme['--theme-accent'] || '#6366f1',
                                    } : {
                                      backgroundColor: 'rgba(99,102,241,0.1)',
                                      color: 'rgb(99,102,241)',
                                    }}
                                  >
                                    {selectedStore?.name?.charAt(0).toUpperCase() || "M"}
                                  </div>
                                  <div 
                                    className="text-[11px] font-bold leading-relaxed flex-grow text-right font-cairo"
                                    style={{
                                      fontSize: config.font_size || '14px',
                                      color: config.color || (hasPreviewTheme ? previewTheme['--theme-text'] : '#111111'),
                                      textAlign: config.text_align || (language === 'ar' ? 'right' : 'left') as any,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: config.content || selectedStore?.name || (language === 'ar' ? 'متجرنا' : 'Our Store') }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        case "image": {
                          const imgUrl = config.image_url || config.image;
                          return (
                            <div key={section.id} className={`${previewCardClass} overflow-hidden ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              {imgUrl ? (
                                <img 
                                  src={getFullImageUrl(imgUrl)} 
                                  alt={config.caption || ""} 
                                  className="w-full object-cover" 
                                  style={hasPreviewTheme ? { borderRadius: viewport === 'mobile' ? '0px' : previewTheme['--theme-img-radius'] } : {}}
                                />
                              ) : (
                                <div className="h-16 bg-slate-100 flex items-center justify-center text-[9px] text-slate-300">
                                  {language === 'ar' ? "قسم صورة" : "Image Section"}
                                </div>
                              )}
                              {config.caption && (
                                <p 
                                  className={hasPreviewTheme ? 'text-[8px] text-center py-1 px-2 opacity-60' : 'text-[8px] text-slate-500 text-center py-1 px-2'}
                                  style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}
                                >
                                  {config.caption}
                                </p>
                              )}
                            </div>
                          );
                        }
                        case "reviews": {
                          const reviewsList = config.reviews || [];
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className="p-2 space-y-2">
                                <h4 className="text-[10px] font-bold" style={{ color: previewTheme['--theme-text'] }}>{language === 'ar' ? "آراء العملاء" : (language === 'fr' ? "Avis clients" : "Customer Reviews")}</h4>
                                {reviewsList.length > 0 ? (
                                  <div className="space-y-2">
                                    {reviewsList.slice(0, 3).map((r: any, idx: number) => (
                                      <div key={idx} className="border-b border-border/50 pb-1.5 last:border-b-0 space-y-0.5 text-[8px] text-right">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[7px] text-amber-400 font-outfit">{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                                          <strong className="font-bold">{r.reviewer_name || (language === 'ar' ? "مشتري" : "Buyer")}</strong>
                                        </div>
                                        {r.body && <p className="opacity-80">{r.body}</p>}
                                        {r.photo_url && <img src={getFullImageUrl(r.photo_url)} alt="" className="h-8 rounded object-cover" />}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1 text-[8px] opacity-80">
                                    <div><strong>{language === 'ar' ? "محمد ب." : "Mohamed B."}</strong>: {language === 'ar' ? "منتج رائع جداً" : "Very great product"}</div>
                                    <div><strong>{language === 'ar' ? "سارة م." : "Sarah M."}</strong>: {language === 'ar' ? "توصيل سريع" : "Fast delivery"}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        case "before_after":
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className={`grid grid-cols-2 gap-2 p-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                {config.before_url && (
                                  <div>
                                    <p 
                                      className={hasPreviewTheme ? 'text-[8px] font-bold mb-1 text-center opacity-60' : 'text-[8px] font-bold text-slate-500 mb-1 text-center'}
                                      style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}
                                    >
                                      {language === 'ar' ? "قبل" : "Before"}
                                    </p>
                                    <img 
                                      src={getFullImageUrl(config.before_url)} 
                                      alt="Before" 
                                      className="w-full object-cover" 
                                      style={{ borderRadius: hasPreviewTheme ? (previewTheme['--theme-img-radius'] || '8px') : '8px' }}
                                    />
                                  </div>
                                )}
                                {config.after_url && (
                                  <div>
                                    <p 
                                      className={hasPreviewTheme ? 'text-[8px] font-bold mb-1 text-center opacity-60' : 'text-[8px] font-bold text-slate-500 mb-1 text-center'}
                                      style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}
                                    >
                                      {language === 'ar' ? "بعد" : "After"}
                                    </p>
                                    <img 
                                      src={getFullImageUrl(config.after_url)} 
                                      alt="After" 
                                      className="w-full object-cover" 
                                      style={{ borderRadius: hasPreviewTheme ? (previewTheme['--theme-img-radius'] || '8px') : '8px' }}
                                    />
                                  </div>
                                )}
                                {!config.before_url && !config.after_url && (
                                  <>
                                    <div>
                                      <div className="text-[8px] opacity-60 mb-1 text-center">{language === 'ar' ? "قبل" : "Before"}</div>
                                      <div className="h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-300">{language === 'ar' ? "صورة" : "Image"}</div>
                                    </div>
                                    <div>
                                      <div className="text-[8px] opacity-60 mb-1 text-center">{language === 'ar' ? "بعد" : "After"}</div>
                                      <div className="h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-300">{language === 'ar' ? "صورة" : "Image"}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        case "features": {
                          const featuresList = Array.isArray(config.features) 
                            ? config.features 
                            : (typeof config.features === 'string' ? config.features.split("\n").filter(Boolean) : []);
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className={`p-3 space-y-1.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                <h3 
                                  className={hasPreviewTheme ? 'text-[10px] font-extrabold' : 'text-[10px] font-extrabold text-slate-900'}
                                  style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : {}}
                                >
                                  {language === 'ar' ? "مميزات المنتج" : (language === 'fr' ? "Caractéristiques du produit" : "Product Features")}
                                </h3>
                                {featuresList.length > 0 ? (
                                  <ul className="space-y-1">
                                    {featuresList.map((f: string, idx: number) => (
                                      <li key={idx} className="flex items-start gap-1 text-[9px] justify-start" style={hasPreviewTheme ? { color: previewTheme['--theme-text'] } : { color: '#475569' }}>
                                        <svg className="h-3 w-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={hasPreviewTheme ? (previewTheme['--theme-accent'] || '#22c55e') : '#22c55e'} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className={hasPreviewTheme ? 'text-[8px] text-center py-1 opacity-50' : 'text-[8px] text-slate-400 text-center py-1'}>
                                    {language === 'ar' ? "لا توجد مميزات مضافة" : "No features added"}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        case "coupon":
                          return (
                            <div key={section.id} className={`${previewCardClass} ${clickableRingClass}`} style={previewCardStyle} {...previewClickableProps}>
                              <div className="p-3 text-center space-y-2">
                                <Tag className="h-5 w-5 mx-auto text-amber-500" />
                                <div className="text-sm font-black text-amber-600">
                                  {language === 'ar' ? "خصم" : "Discount"} {config.discount_percent || 0}%
                                </div>
                                {config.code ? (
                                  <div className="bg-amber-50 border border-dashed border-amber-300 rounded-lg px-3 py-2 text-center">
                                    <span className="text-[8px] text-slate-500">{language === 'ar' ? "رمز الخصم المفعل" : "Active coupon"}</span>
                                    <div className="text-base font-black tracking-widest text-amber-700 font-outfit">
                                      {config.code}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-2">
                                    <span>{language === 'ar' ? "لم يتم تعيين رمز الخصم بعد" : "No promo code set"}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        default:
                          return null;
                      }
                    })}
                    </div>
                  </div>

                  {/* Sticky CTA button mock — rendered at bottom of phone frame */}
                  {(() => {
                    const checkoutSec = activeList.find((s: any) => s.section_type === 'checkout');
                    const chkCfg = checkoutSec?.config || {};
                    const showSticky = chkCfg.show_sticky_cta !== false;
                    const stickyBg = chkCfg.sticky_cta_bg_color || chkCfg.buttons_bg_color || '#4f46e5';
                    const stickyTxt = chkCfg.sticky_cta_text_color || chkCfg.buttons_text_color || '#ffffff';
                    const stickyLabel = chkCfg.sticky_cta_text || chkCfg.button_text || (language === 'ar' ? 'اطلب الآن' : (language === 'fr' ? 'Commander' : 'Order Now'));
                    if (!showSticky) return null;
                    return (
                      <div
                        className="flex-shrink-0 px-2 pb-2 pt-1"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)' }}
                      >
                        <div
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black font-cairo shadow-lg"
                          style={{ backgroundColor: stickyBg, color: stickyTxt, boxShadow: `0 4px 16px ${stickyBg}55` }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{stickyLabel}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </form>
    </div>
  );
}
