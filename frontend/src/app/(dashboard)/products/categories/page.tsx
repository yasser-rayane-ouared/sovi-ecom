"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useDashboardStore } from "@/stores/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Trash2, Edit2, Folder, ExternalLink } from "lucide-react";
import { useLanguageStore } from "@/stores/language";

export default function CategoriesDashboard() {
  const { selectedStore } = useDashboardStore() as any;
  const currentStoreId = selectedStore?.id;
  const router = useRouter();
  const { t, isRtl } = useLanguageStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCategories = () => {
    if (currentStoreId) {
      setLoading(true);
      api
        .get(`/products/${currentStoreId}/categories/`)
        .then((res) => {
          setCategories(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentStoreId]);

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteCategoryConfirm'))) {
      try {
        await api.delete(`/products/${currentStoreId}/categories/${id}/`);
        fetchCategories();
      } catch (err) {
        alert(t('deleteCategoryError'));
      }
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-8 text-foreground ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('manageCategoriesTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('manageCategoriesDesc')}</p>
        </div>
        <Button onClick={() => router.push("/products/categories/new")} variant="glow" className="flex items-center gap-2">
          <Plus className="h-5 w-5" /> {t('addNewCategory')}
        </Button>
      </div>

      {/* Tabs Sub-Navigation */}
      <div className="flex border-b border-border dark:border-white/10 gap-4">
        <button
          onClick={() => router.push("/products")}
          className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
        >
          {t('products')}
        </button>
        <button
          onClick={() => router.push("/products/categories")}
          className="pb-3 text-sm font-bold border-b-2 border-primary text-foreground dark:text-white"
        >
          {t('categoriesTab')}
        </button>
      </div>

      {/* Search Filter */}
      <Card className="border-border dark:border-white/5 bg-card/50 dark:bg-white/5 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('categorySearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none w-full placeholder:text-muted-foreground text-start"
          />
        </CardContent>
      </Card>

      {/* Categories Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border dark:border-white/5"></div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((c) => (
            <Card key={c.id} className="border-border dark:border-white/5 bg-card/40 dark:bg-white/5 overflow-hidden group hover:border-primary/20 transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 justify-start">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <h3 className="font-bold text-lg truncate">{c.name}</h3>
                      <span className="text-xs text-muted-foreground block font-mono">/{c.slug}</span>
                    </div>
                  </div>
                  {c.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 text-start">{c.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 italic text-start">{t('noDescription')}</p>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border dark:border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{t('statusLabel')}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${c.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {c.is_active ? t('activeStatus') : t('inactiveStatus')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/products/categories/${c.id}`)} variant="outline" size="sm" className="flex-1 flex items-center gap-1.5 justify-center border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-xs">
                      <Edit2 className="h-3.5 w-3.5" /> {t('editAndCustomize')}
                    </Button>
                    <Button
                      onClick={() => window.open(`http://${selectedStore?.subdomain}.localhost:3000/categories/${c.slug}`, "_blank")}
                      variant="outline"
                      size="sm"
                      className="px-3 border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-xs"
                      title={t('previewPublicPage')}
                      disabled={!c.is_active}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button onClick={() => handleDelete(c.id)} variant="destructive" size="sm" className="px-3">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/40 dark:bg-white/5 border border-border dark:border-white/5 rounded-2xl">
          <p className="text-muted-foreground">{t('noCategoriesFound')}</p>
        </div>
      )}
    </div>
  );
}

