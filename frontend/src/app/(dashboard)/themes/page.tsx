"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Palette, CheckCircle2, Sparkles } from "lucide-react";

interface ThemesProps {
  storeId?: string;
  storeSubdomain?: string;
}

export default function ThemesDashboard({ storeId }: ThemesProps) {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;
  const [themes, setThemes] = useState<any[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  const fetchThemes = () => {
    if (currentStoreId) {
      setLoading(true);
      api.get("/themes/")
        .then((res) => {
          setThemes(res.data || []);
          return api.get(`/stores/${currentStoreId}/`);
        })
        .then((res) => {
          if (res.data?.active_theme?.slug) {
            setActiveTheme(res.data.active_theme.slug);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchThemes();
  }, [currentStoreId]);

  const handleActivate = async (slug: string) => {
    setSuccess("");
    try {
      await api.patch(`/stores/${currentStoreId}/`, { active_theme_slug: slug });
      setActiveTheme(slug);
      setSuccess(t("themesSuccess"));
    } catch (err) {
      alert(t("themesError"));
    }
  };

  return (
    <div 
      className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("themesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("themesDesc")}</p>
        </div>
        <Link href="/themes/customize">
          <Button variant="glow" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> {t("themesCustomizeBtn")}
          </Button>
        </Link>
      </div>

      {success && (
        <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted/10 border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme) => {
            const isActive = activeTheme === theme.slug;
            return (
              <Card key={theme.id} className={`overflow-hidden transition-all hover:scale-[1.01] ${isActive ? "border-primary/50 ring-2 ring-primary/20" : ""}`}>
                <div
                  className="aspect-video w-full bg-cover bg-center border-b border-border relative"
                  style={{ backgroundImage: `url(${theme.preview_image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'})` }}
                >
                  {isActive && (
                    <span className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} bg-primary text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t("themesActiveLabel")}
                    </span>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{theme.description}</p>
                  </div>

                  <div className={`pt-4 border-t border-border flex gap-2 justify-between items-center text-xs ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <span className="text-muted-foreground">{t("themesCreator")} {theme.creator}</span>
                    <Button
                      disabled={isActive}
                      onClick={() => handleActivate(theme.slug)}
                      variant={isActive ? "outline" : "glow"}
                      size="sm"
                      className="text-xs font-semibold"
                    >
                      {isActive ? t("themesActiveBtn") : t("themesActivateBtn")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
