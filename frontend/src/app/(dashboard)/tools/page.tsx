"use client";

import React from "react";
import { Wrench, Sparkles, Image, BarChart3, Bot, Compass, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLanguageStore } from "../../../stores/language";

export default function ToolsPage() {
  const { t, isRtl } = useLanguageStore();

  const upcomingTools = [
    {
      title: t("toolsSmartAnalyzer"),
      desc: t("toolsSmartAnalyzerDesc"),
      icon: BarChart3,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20",
    },
    {
      title: t("toolsPhotoEditor"),
      desc: t("toolsPhotoEditorDesc"),
      icon: Image,
      color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/20",
    },
    {
      title: t("toolsAdWriter"),
      desc: t("toolsAdWriterDesc"),
      icon: Bot,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div 
      className={`min-h-[70vh] flex flex-col justify-center items-center max-w-4xl mx-auto px-4 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Glow Effect */}
      <div className="absolute h-80 w-80 rounded-full bg-primary/10 blur-[80px] -z-10 top-1/3"></div>

      <div className="w-full text-center space-y-6 animate-fade-in-up">
        {/* Animated Icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border shadow-xl text-primary animate-bounce relative">
          <Wrench className="h-10 w-10 relative z-10" />
          <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-yellow-400 animate-pulse" />
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t("toolsTitle")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("toolsDesc")}
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="bg-card/60 backdrop-blur-md border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center max-w-xl mx-auto">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
            <span>{t("toolsComingSoon")}</span>
            <Compass className="h-5 w-5 text-accent animate-spin-slow" />
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("toolsComingSoonDesc")}
          </p>
        </div>

        {/* Upcoming Tools Previews */}
        <div className="space-y-4 pt-6">
          <h3 className="text-xs font-black text-accent tracking-widest uppercase mb-4 text-center">
            {t("toolsUpcomingTitle")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingTools.map((tool, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border bg-gradient-to-b ${tool.color} bg-card/40 backdrop-blur-sm shadow-md flex flex-col justify-between ${isRtl ? "items-end text-right" : "items-start text-left"} hover:scale-105 transition-all duration-300`}
              >
                <div className="p-2.5 rounded-xl bg-card border border-border text-foreground mb-4">
                  <tool.icon className="h-6 w-6" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground mb-2">{tool.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="pt-6">
          <Link href="/overview">
            <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-semibold transition-all">
              {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {t("backToDashboard")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
