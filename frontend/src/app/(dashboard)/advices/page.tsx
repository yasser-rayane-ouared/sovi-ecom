"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { 
  Megaphone, BookOpen, Clock, User, Filter, ArrowRight, ArrowLeft, X, Loader2
} from "lucide-react";

export default function MerchantAdvicesFeedPage() {
  const { t, isRtl, language } = useLanguageStore();
  
  const [advices, setAdvices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Selected advice to show full content in a modal
  const [selectedAdvice, setSelectedAdvice] = useState<any>(null);

  const fetchAdvices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/marketing-advices/");
      setAdvices(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (err) {
      console.error("Error fetching advices feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvices();
  }, []);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "marketing":
        return t("marketingAdvice");
      case "business":
        return t("businessAdvice");
      case "general":
        return t("generalAnnouncement");
      default:
        return cat;
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "marketing":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "business":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "general":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const getCategoryGlow = (cat: string) => {
    switch (cat) {
      case "marketing":
        return "group-hover:border-indigo-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]";
      case "business":
        return "group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]";
      case "general":
        return "group-hover:border-amber-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]";
      default:
        return "group-hover:border-primary/30";
    }
  };

  const filteredAdvices = categoryFilter 
    ? advices.filter((item) => item.category === categoryFilter)
    : advices;

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'en-US', options);
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            {language === "ar" ? "جاري تحميل آخر النصائح والتوجيهات..." : "Loading advices feed..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-secondary/30 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Megaphone className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? "نصائح وإرشادات Sovi" : "Sovi Advices & Tips"}</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {language === 'ar' ? "لوحة النصائح واستراتيجيات النمو" : "Growth Strategies & Tips"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {language === 'ar' 
              ? "استقبل أفضل النصائح، الدروس المستفادة، واستراتيجيات التسويق والأعمال لزيادة مبيعات متجرك الإلكتروني في الجزائر." 
              : "Get the best advices, lessons learned, and marketing/business strategies to scale your e-commerce store in Algeria."}
          </p>
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-border/50 pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">{language === 'ar' ? "تصنيف النصائح:" : "Filter by:"}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { label: language === "ar" ? "كل النصائح" : "All Feed", value: "" },
            { label: t("marketingAdvice"), value: "marketing" },
            { label: t("businessAdvice"), value: "business" },
            { label: t("generalAnnouncement"), value: "general" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                categoryFilter === tab.value 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 font-bold" 
                  : "bg-card border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredAdvices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvices.map((advice) => (
            <div 
              key={advice.id}
              onClick={() => setSelectedAdvice(advice)}
              className={`group flex flex-col justify-between bg-card border border-border/60 rounded-2xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 ${getCategoryGlow(advice.category)}`}
            >
              <div className="space-y-4">
                <div className={`flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border inline-block ${getCategoryBadgeClass(advice.category)}`}>
                    {getCategoryLabel(advice.category)}
                  </span>
                  
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(advice.created_at)}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {advice.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {advice.content}
                  </p>
                </div>
              </div>

              <div className={`flex items-center justify-between border-t border-border/50 pt-4 mt-6 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-primary">
                    {advice.author_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <span className="truncate max-w-[100px]">{advice.author_name || "Admin"}</span>
                </div>

                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  <span>{language === 'ar' ? "اقرأ النصيحة كاملة" : "Read Full Post"}</span>
                  {isRtl ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card/40 border border-dashed border-border rounded-2xl space-y-4 max-w-md mx-auto">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">{language === 'ar' ? "لا توجد منشورات حالياً" : "Empty Feed"}</h3>
            <p className="text-xs text-muted-foreground px-6">{t("noAdvicesYet")}</p>
          </div>
        </div>
      )}

      {/* Full Advice Modal View */}
      {selectedAdvice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 ${isRtl ? "text-right" : "text-left"} animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className={`flex justify-between items-start ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="space-y-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border inline-block ${getCategoryBadgeClass(selectedAdvice.category)}`}>
                  {getCategoryLabel(selectedAdvice.category)}
                </span>
                <div className={`flex flex-wrap gap-4 text-xs text-muted-foreground ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(selectedAdvice.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{selectedAdvice.author_name || "Admin"}</span>
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedAdvice(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-secondary rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-foreground leading-snug">
                {selectedAdvice.title}
              </h2>
              
              <div className="border-t border-border/50 pt-6">
                {/* Properly display formatted paragraphs */}
                <div className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-line space-y-4">
                  {selectedAdvice.content}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 flex justify-end">
              <Button 
                onClick={() => setSelectedAdvice(null)}
                className="font-bold py-5 px-6"
              >
                {language === 'ar' ? "فهمت، إغلاق" : "Got it, Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
