"use client";

import React from "react";
import { useLanguageStore } from "../../stores/language";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { PixelHealthBadge } from "./pixel-health-badge";
import { Eye, Sparkles, HelpCircle, Edit3, Trash2, Plus } from "lucide-react";
import type { PixelHealthStatus } from "./types";

interface PixelItem {
  id: string;
  name: string;
  platform: string;
  pixel_id: string;
  product_title?: string;
  is_active: boolean;
}

interface PixelTableProps {
  pixels: PixelItem[];
  loading: boolean;
  pixelHealth: Record<string, PixelHealthStatus>;
  pixelHealthMsg: Record<string, string>;
  onTest: (pixel: PixelItem) => void;
  onEdit: (pixel: PixelItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function PixelTable({
  pixels,
  loading,
  pixelHealth,
  pixelHealthMsg,
  onTest,
  onEdit,
  onDelete,
  onAdd,
}: PixelTableProps) {
  const { t, isRtl } = useLanguageStore();

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className={`border-b border-border ${isRtl ? "text-right" : "text-left"}`}>
        <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <Eye className="h-5 w-5 text-accent" /> {t("pixelsTableTitle")}
        </CardTitle>
        <CardDescription>{t("pixelsTableDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center space-y-4 animate-pulse">
            <div className="h-8 bg-muted/10 rounded w-1/3 mx-auto"></div>
            <div className="h-24 bg-muted/10 rounded w-full"></div>
          </div>
        ) : pixels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse text-sm ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20 font-semibold">
                  <th className="p-4">{t("pixelsTableNameCol")}</th>
                  <th className="p-4">{t("pixelsTablePlatformCol")}</th>
                  <th className="p-4">{t("pixelsTablePixelIdCol")}</th>
                  <th className="p-4">{t("pixelsTableProductCol")}</th>
                  <th className="p-4 text-center">{t("pixelsTableStatusCol")}</th>
                  <th className={`p-4 ${isRtl ? "text-left" : "text-right"}`}>{t("pixelsTableActionsCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pixels.map((pixel) => (
                  <tr key={pixel.id} className="hover:bg-muted/10 transition-all">
                    <td className="p-4 font-bold">{pixel.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        pixel.platform === 'meta'
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : pixel.platform === 'tiktok'
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                        {pixel.platform === 'meta' ? "Meta (Facebook)" : pixel.platform === 'tiktok' ? "TikTok" : "Snapchat"}
                      </span>
                    </td>
                    <td className="p-4 font-outfit text-muted-foreground">{pixel.pixel_id}</td>
                    <td className="p-4">
                      {pixel.product_title ? (
                        <span className={`text-accent flex items-center gap-1 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                          <Sparkles className="h-4 w-4" /> {pixel.product_title}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t("pixelsTableAllStore")}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${pixel.is_active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                    </td>
                    <td className={`p-4 space-x-2 space-x-reverse ${isRtl ? "text-left" : "text-right"}`}>
                      {pixel.platform === 'meta' && (
                        <PixelHealthBadge
                           pixelId={pixel.id}
                           status={pixelHealth[pixel.id]}
                           message={pixelHealthMsg[pixel.id]}
                           onTest={() => onTest(pixel)}
                        />
                      )}
                      <Button onClick={() => onEdit(pixel)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-400 hover:text-amber-500 hover:bg-muted/10">
                        <Edit3 className="h-4.5 w-4.5" />
                      </Button>
                      <Button onClick={() => onDelete(pixel.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-muted/10">
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30" />
            <p>{t("pixelsTableNoPixels")}</p>
            <Button onClick={onAdd} size="sm" variant="outline" className="mt-2 border-border hover:bg-muted/10">
              {t("pixelsTableAddFirst")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
