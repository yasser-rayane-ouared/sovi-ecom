"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { PixelForm, PixelTable } from "../../../components/pixels";
import { validateMetaPixel } from "../../../components/pixels";
import { CheckCircle, AlertCircle, Plus } from "lucide-react";

export default function PixelsDashboard() {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const currentStoreId = selectedStore?.id;

  const [pixels, setPixels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pixelName, setPixelName] = useState("");
  const [platform, setPlatform] = useState("meta");
  const [pixelIdValue, setPixelIdValue] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [associatedProduct, setAssociatedProduct] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pixelHealth, setPixelHealth] = useState<Record<string, 'loading' | 'valid' | 'invalid'>>({});
  const [pixelHealthMsg, setPixelHealthMsg] = useState<Record<string, string>>({});

  const fetchPixelsAndProducts = async () => {
    if (!currentStoreId) return;
    setLoading(true);
    try {
      const [pixelsRes, productsRes] = await Promise.all([
        api.get(`/pixels/${currentStoreId}/`),
        api.get(`/products/${currentStoreId}/`)
      ]);
      const pixelList = Array.isArray(pixelsRes.data)
        ? pixelsRes.data
        : (pixelsRes.data?.results || []);
      setPixels(pixelList);
      setProducts(productsRes.data?.results || productsRes.data || []);
    } catch (err) {
      setError(t("pixelsGenericError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPixelsAndProducts();
  }, [currentStoreId]);

  const resetForm = () => {
    setPixelName("");
    setPlatform("meta");
    setPixelIdValue("");
    setAccessToken("");
    setTestEventCode("");
    setAssociatedProduct("");
    setIsActive(true);
    setEditId(null);
    setIsEditing(false);
  };

  const handleTestPixel = async (pixel: any) => {
    if (pixel.platform !== 'meta') return;
    setPixelHealth((prev) => ({ ...prev, [pixel.id]: 'loading' }));
    setPixelHealthMsg((prev) => ({ ...prev, [pixel.id]: '' }));
    const result = await validateMetaPixel(pixel.pixel_id);
    setPixelHealth((prev) => ({ ...prev, [pixel.id]: result.valid ? 'valid' : 'invalid' }));
    setPixelHealthMsg((prev) => ({ ...prev, [pixel.id]: result.valid ? (result.name || 'Pixel found') : (result.error || 'Invalid pixel') }));
  };

  const handleEdit = (pixel: any) => {
    setEditId(pixel.id);
    setPixelName(pixel.name || "");
    setPlatform(pixel.platform);
    setPixelIdValue(pixel.pixel_id);
    setAccessToken(pixel.access_token || "");
    setTestEventCode(pixel.test_event_code || "");
    setAssociatedProduct(pixel.product || "");
    setIsActive(pixel.is_active);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("pixelsDeleteConfirm"))) return;
    setSuccess("");
    setError("");
    try {
      await api.delete(`/pixels/${currentStoreId}/${id}/`);
      setSuccess(t("pixelsDeleteSuccess"));
      fetchPixelsAndProducts();
    } catch (err) {
      setError(t("pixelsDeleteError"));
    }
  };

  const handleSubmit = async (payload: any) => {
    setSuccess("");
    setError("");

    if (!payload.pixel_id.trim()) {
      setError(t("pixelsRequiredError"));
      return;
    }

    try {
      if (editId) {
        await api.put(`/pixels/${currentStoreId}/${editId}/`, payload);
        setSuccess(t("pixelsUpdateSuccess"));
      } else {
        await api.post(`/pixels/${currentStoreId}/`, payload);
        setSuccess(t("pixelsAddSuccess"));
      }
      resetForm();
      fetchPixelsAndProducts();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]);
        setError(`Error: ${firstKey} — ${msg}`);
      } else {
        setError(t("pixelsGenericError"));
      }
    }
  };

  return (
    <div 
      className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("pixelsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("pixelsDesc")}</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 self-start font-semibold">
            <Plus className="h-5 w-5" /> {t("pixelsAddNew")}
          </Button>
        )}
      </div>

      {success && (
        <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isEditing && (
        <PixelForm
          editId={editId}
          initialName={pixelName}
          initialPlatform={platform}
          initialPixelId={pixelIdValue}
          initialAccessToken={accessToken}
          initialTestEventCode={testEventCode}
          initialProduct={associatedProduct}
          initialIsActive={isActive}
          products={products}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      <PixelTable
        pixels={pixels}
        loading={loading}
        pixelHealth={pixelHealth}
        pixelHealthMsg={pixelHealthMsg}
        onTest={handleTestPixel}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => setIsEditing(true)}
      />
    </div>
  );
}
