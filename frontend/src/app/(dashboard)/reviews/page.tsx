"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { Button } from "../../../components/ui/button";
import { Trash2, CheckCircle, XCircle, MessageSquare, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useLanguageStore } from "../../../stores/language";

export default function GlobalReviewsDashboard() {
  const { selectedStore } = useDashboardStore();
  const currentStoreId = selectedStore?.id;
  const { t, language, isRtl } = useLanguageStore();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = async () => {
    if (!currentStoreId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/products/${currentStoreId}/reviews/`);
      const data = res.data;
      if (Array.isArray(data)) {
        setReviews(data);
      } else if (data && Array.isArray(data.results)) {
        setReviews(data.results);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(t('reviewsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentStoreId]);

  const handleToggleApprove = async (review: any) => {
    try {
      const updatedStatus = !review.is_approved;
      await api.patch(`/products/${currentStoreId}/reviews/${review.id}/`, {
        is_approved: updatedStatus
      });
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_approved: updatedStatus } : r));
    } catch (err) {
      alert(t('reviewApproveError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteReviewConfirm'))) return;
    try {
      await api.delete(`/products/${currentStoreId}/reviews/${id}/`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(t('deleteReviewError'));
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterTab === 'pending') return !r.is_approved;
    if (filterTab === 'approved') return r.is_approved;
    return true;
  });

  return (
    <div className={`space-y-8 ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('manageReviewsTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('manageReviewsDesc')}</p>
        </div>
        <Button onClick={fetchReviews} variant="outline" className="flex items-center gap-2 self-start font-semibold">
          <RefreshCw className="h-4 w-4" /> {t('refreshData')}
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex gap-2 p-1 bg-muted/20 rounded-xl max-w-md">
        {[
          { key: 'all', label: `${t('allReviewsLabel')} (${reviews.length})` },
          { key: 'pending', label: `${t('pendingReviewsLabel')} (${reviews.filter(r => !r.is_approved).length})` },
          { key: 'approved', label: `${t('publishedReviewsLabel')} (${reviews.filter(r => r.is_approved).length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${
              filterTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t('loadingReviews')}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card/50 flex flex-col items-center justify-center gap-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 animate-pulse" />
          <div>
            <h3 className="font-bold text-lg">{t('noReviewsTitle')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filterTab === 'pending'
                ? t('noPendingReviewsDesc')
                : filterTab === 'approved'
                ? t('noPublishedReviewsDesc')
                : t('noReviewsDesc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-2xl border bg-card text-foreground shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
                r.is_approved ? 'border-emerald-500/20' : 'border-amber-500/20'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="text-start">
                    <h4 className="font-bold text-sm text-foreground">{r.reviewer_name}</h4>
                    {r.reviewer_city && <span className="text-[10px] text-muted-foreground">{r.reviewer_city}</span>}
                  </div>
                  <div className="flex text-amber-400 text-sm">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>{idx < r.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>

                {/* Body Text */}
                {r.body ? (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 text-start">{r.body}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/30 italic text-start">{t('noCommentText')}</p>
                )}

                {/* Review Photo Attachment */}
                {r.photo_url && (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border group bg-muted/10">
                    <img src={r.photo_url} alt="Review attachment" className="w-full h-full object-cover" />
                    <a
                      href={r.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" /> {t('openOriginalImage')}
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground font-semibold">{t('productLabel')}</span>
                  <LinkToStorefront subdomain={selectedStore?.subdomain} slug={r.product_slug} title={r.product_title} t={t} />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground font-semibold">{t('sendDateLabel')}</span>
                  <span className="text-foreground/70 font-semibold font-outfit">
                    {new Date(r.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : (language === 'fr' ? 'fr-FR' : 'en-US'))}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-border pt-3 mt-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleApprove(r)}
                    className={`flex-grow flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      r.is_approved
                        ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                        : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                  >
                    {r.is_approved ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> {t('unpublish')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> {t('publish')}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/10 transition-colors"
                    title={t('deleteReviewTooltip')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkToStorefront({ subdomain, slug, title, t }: { subdomain?: string; slug?: string; title?: string; t: any }) {
  if (!subdomain || !slug) return <span className="text-muted-foreground font-bold">{title || t('unknown')}</span>;
  const storeUrl = `http://${subdomain}.sovi.localhost:3000/products/${slug}`;
  return (
    <a
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-accent font-bold flex items-center gap-1 hover:underline truncate max-w-[180px]"
    >
      {title} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

