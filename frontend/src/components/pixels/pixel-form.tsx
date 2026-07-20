"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguageStore } from "../../stores/language";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Code, Save, Eye, EyeOff, X } from "lucide-react";

interface PixelFormProps {
  editId: string | null;
  initialName: string;
  initialPlatform: string;
  initialPixelId: string;
  initialAccessToken: string;
  initialTestEventCode?: string;
  initialProduct: string;
  initialIsActive: boolean;
  products: { id: string; title: string }[];
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
}

export function PixelForm({
  editId,
  initialName,
  initialPlatform,
  initialPixelId,
  initialAccessToken,
  initialTestEventCode = "",
  initialProduct,
  initialIsActive,
  products,
  onSubmit,
  onCancel,
}: PixelFormProps) {
  const { t, isRtl } = useLanguageStore();
  const [pixelName, setPixelName] = useState(initialName);
  const [platform, setPlatform] = useState(initialPlatform);
  const [pixelIdValue, setPixelIdValue] = useState(initialPixelId);
  const [accessToken, setAccessToken] = useState(initialAccessToken);
  const [testEventCode, setTestEventCode] = useState(initialTestEventCode);
  const [associatedProduct, setAssociatedProduct] = useState(initialProduct);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [showToken, setShowToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: pixelName.trim() || `${platform.toUpperCase()} Pixel`,
        platform,
        pixel_id: pixelIdValue.trim(),
        access_token: platform === "meta" ? accessToken.trim() : "",
        test_event_code: platform === "meta" ? testEventCode.trim() : "",
        product: associatedProduct || null,
        is_active: isActive,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardHeader className={`border-b border-border flex items-center justify-between ${isRtl ? "flex-row text-right" : "flex-row-reverse text-left"}`}>
          <div>
            <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Code className="h-5 w-5 text-primary" /> 
              {editId ? t("pixelsFormEditTitle") : t("pixelsFormAddTitle")}
            </CardTitle>
            <CardDescription>{t("pixelsFormDesc")}</CardDescription>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t("pixelsFormNameLabel")}</label>
                <Input
                  placeholder={t("pixelsFormNamePlaceholder")}
                  value={pixelName}
                  onChange={(e) => setPixelName(e.target.value)}
                  className={`${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t("pixelsFormPlatformLabel")}</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={`flex h-10 w-full rounded-lg border border-border bg-input text-foreground px-3 py-2 text-sm focus-visible:outline-none ${isRtl ? "text-right" : "text-left"}`}
                >
                  <option value="meta" className="bg-background text-foreground">Meta (Facebook)</option>
                  <option value="tiktok" className="bg-background text-foreground">TikTok</option>
                  <option value="snapchat" className="bg-background text-foreground">Snapchat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t("pixelsFormPixelIdLabel")}</label>
                <Input
                  placeholder={t("pixelsFormPixelIdPlaceholder")}
                  value={pixelIdValue}
                  onChange={(e) => setPixelIdValue(e.target.value)}
                  className={`font-outfit ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t("pixelsFormProductLabel")}</label>
                <select
                  value={associatedProduct}
                  onChange={(e) => setAssociatedProduct(e.target.value)}
                  className={`flex h-10 w-full rounded-lg border border-border bg-input text-foreground px-3 py-2 text-sm focus-visible:outline-none ${isRtl ? "text-right" : "text-left"}`}
                >
                  <option value="" className="bg-background text-foreground">{t("pixelsFormProductAll")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-background text-foreground">
                      {p.title}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">{t("pixelsFormProductDesc")}</p>
              </div>

              {platform === "meta" && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold">{t("pixelsFormTokenLabel")}</label>
                    <div className="relative">
                      <textarea
                        placeholder={t("pixelsFormTokenPlaceholder")}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        rows={showToken ? 3 : 1}
                        className={`flex min-h-[40px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none font-outfit ${isRtl ? "pr-10 text-right" : "pl-10 text-left"}`}
                        style={{ WebkitTextSecurity: showToken ? 'none' : 'disc' } as any}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className={`absolute ${isRtl ? "left-2" : "right-2"} top-2 p-1 text-muted-foreground hover:text-foreground transition-colors`}
                        title={showToken ? 'Hide token' : 'Show token'}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t("pixelsFormTokenDesc")}</p>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold">
                      {isRtl ? "رمز اختبار الأحداث (Test Event Code - اختياري)" : "Meta Test Event Code (Optional)"}
                    </label>
                    <Input
                      placeholder="e.g. TEST12345"
                      value={testEventCode}
                      onChange={(e) => setTestEventCode(e.target.value)}
                      className={`font-outfit ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isRtl
                        ? "أدخل رمز الاختبار الموجود في تبويب Test Events في Facebook Events Manager لعرض الأحداث المباشرة عند التجربة."
                        : "Enter your Test Event Code from the 'Test Events' tab in Facebook Events Manager to view live test events."}
                    </p>
                  </div>
                </>
              )}

              <div className={`flex items-center gap-3 pt-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-border bg-input text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">{t("pixelsFormActiveLabel")}</label>
              </div>
            </div>

            <div className={`flex justify-end gap-3 border-t border-border pt-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Button type="button" onClick={onCancel} variant="outline" className="border-border hover:bg-muted/10">
                {t("pixelsFormCancelBtn")}
              </Button>
              <Button type="submit" variant="glow" className="flex items-center gap-2 font-semibold" disabled={submitting}>
                <Save className="h-5 w-5" /> {editId ? t("pixelsFormSaveBtn") : t("pixelsFormAddBtn")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
