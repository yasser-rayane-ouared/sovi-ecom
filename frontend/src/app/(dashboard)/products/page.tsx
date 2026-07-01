"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Plus, Search, Trash2, Edit2, Image, ExternalLink } from "lucide-react";
import { formatCurrency, getFullImageUrl } from "../../../lib/utils";

interface ProductsProps {
  storeId?: string;
  storeSubdomain?: string;
}

export default function ProductsDashboard({ storeId }: ProductsProps) {
  const { selectedStore } = useDashboardStore();
  const { t, language, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = () => {
    if (currentStoreId) {
      setLoading(true);
      api
        .get(`/products/${currentStoreId}/`)
        .then((res) => {
          setProducts(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentStoreId]);

  const handleDelete = async (id: string) => {
    const confirmMsg = language === 'ar' 
      ? "هل أنت متأكد من رغبتك في حذف هذا المنتج؟" 
      : (language === 'fr' ? "Êtes-vous sûr de vouloir supprimer ce produit ?" : "Are you sure you want to delete this product?");
    const errorMsg = language === 'ar' 
      ? "حدث خطأ أثناء حذف المنتج." 
      : (language === 'fr' ? "Une erreur est survenue lors de la suppression du produit." : "An error occurred while deleting the product.");

    if (confirm(confirmMsg)) {
      try {
        await api.delete(`/products/${currentStoreId}/${id}/`);
        fetchProducts();
      } catch (err) {
        alert(errorMsg);
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-cairo text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('manageProductsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('manageProductsDesc')}</p>
        </div>
        <Button onClick={() => router.push("/products/new")} variant="glow" className="flex items-center gap-2">
          <Plus className="h-5 w-5" /> {t('addNewProduct')}
        </Button>
      </div>

      {/* Tabs Sub-Navigation */}
      <div className="flex border-b border-border dark:border-white/10 gap-4">
        <button
          onClick={() => router.push("/products")}
          className="pb-3 text-sm font-bold border-b-2 border-primary text-foreground dark:text-white"
        >
          {t('productsTab')}
        </button>
        <button
          onClick={() => router.push("/products/categories")}
          className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
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
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-sm text-foreground focus:outline-none w-full placeholder:text-start text-start"
            dir={isRtl ? "rtl" : "ltr"}
          />
        </CardContent>
      </Card>

      {/* Products list grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border dark:border-white/5"></div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir={isRtl ? "rtl" : "ltr"}>
          {filteredProducts.map((p) => (
            <Card key={p.id} className="border-border dark:border-white/5 bg-card/40 dark:bg-white/5 overflow-hidden group hover:border-primary/20 transition-all flex flex-col justify-between">
              <div className="relative aspect-video w-full bg-black/40 overflow-hidden border-b border-border dark:border-white/5 flex items-center justify-center">
                {p.primary_image ? (
                  <img src={getFullImageUrl(p.primary_image)} alt={p.title} className="w-full h-full object-cover transition-all group-hover:scale-105" />
                ) : (
                  <Image className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-5 space-y-4 flex-grow flex flex-col justify-between text-start">
                <div>
                  <h3 className="font-bold text-lg truncate text-start">{p.title}</h3>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>SKU: {p.sku || "N/A"}</span>
                    <span>{t('stockLabel')}: {p.stock} {t('pieces')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-2 justify-start">
                    <span className="text-xl font-extrabold text-primary font-outfit">{formatCurrency(parseFloat(p.price))}</span>
                    {p.compare_price && parseFloat(p.compare_price) > parseFloat(p.price) && (
                      <span className="text-xs text-muted-foreground line-through font-outfit">{formatCurrency(parseFloat(p.compare_price))}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/products/${p.id}`)} variant="outline" size="sm" className="flex-1 flex items-center gap-1.5 justify-center border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-xs">
                      <Edit2 className="h-3.5 w-3.5" /> {t('edit')}
                    </Button>
                    <Button
                      onClick={() => window.open(`http://${selectedStore?.subdomain}.localhost:3000/products/${p.slug}`, "_blank")}
                      variant="outline"
                      size="sm"
                      className="px-3 border-border dark:border-white/5 hover:bg-muted dark:hover:bg-white/5 text-xs"
                      title={t('viewProductPage')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button onClick={() => handleDelete(p.id)} variant="destructive" size="sm" className="px-3">
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
          <p className="text-muted-foreground">{t('noProductsFound')}</p>
        </div>
      )}
    </div>
  );
}
