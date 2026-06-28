"use client";

import React, { useEffect, useState, useRef } from "react";
import { Languages, Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguageStore } from "../stores/language";
import { motion, AnimatePresence } from "framer-motion";

const AlgeriaFlag = () => (
  <svg className="w-[18px] h-[12px] rounded-sm shadow-sm object-cover flex-shrink-0 border border-black/5" viewBox="0 0 24 16">
    <rect width="12" height="16" fill="#006233" />
    <rect x="12" width="12" height="16" fill="#FFFFFF" />
    <circle cx="12" cy="8" r="3.5" fill="#D21034" />
    <circle cx="13" cy="8" r="3.0" fill="#FFFFFF" />
    <polygon points="13.5,6.5 13.9,7.5 14.9,7.5 14.1,8.2 14.4,9.2 13.5,8.6 12.6,9.2 12.9,8.2 12.1,7.5 13.1,7.5" fill="#D21034" />
  </svg>
);

const UKFlag = () => (
  <svg className="w-[18px] h-[12px] rounded-sm shadow-sm object-cover flex-shrink-0 border border-black/5" viewBox="0 0 60 40">
    <rect width="60" height="40" fill="#012169"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 L30,40 M0,20 L60,20" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 L30,40 M0,20 L60,20" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const FranceFlag = () => (
  <svg className="w-[18px] h-[12px] rounded-sm shadow-sm object-cover flex-shrink-0 border border-black/5" viewBox="0 0 3 2">
    <rect width="1" height="2" fill="#002395" />
    <rect x="1" width="1" height="2" fill="#FFFFFF" />
    <rect x="2" width="1" height="2" fill="#ED2939" />
  </svg>
);

export function LanguageToggle() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { language, setLanguage, isRtl } = useLanguageStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg border border-border bg-card/40">
        <Languages className="h-[1.1rem] w-[1.1rem] text-primary animate-pulse" />
        <span className="w-8" />
      </Button>
    );
  }

  const langNames = {
    ar: { label: "العربية", flag: <AlgeriaFlag /> },
    en: { label: "English", flag: <UKFlag /> },
    fr: { label: "Français", flag: <FranceFlag /> }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-lg border border-border bg-card/40 backdrop-blur-sm hover:bg-secondary/80 text-foreground transition-all duration-300 flex items-center gap-2 font-medium hover:border-primary/30"
      >
        <Languages className="h-[1.1rem] w-[1.1rem] text-primary" />
        <span className="text-xs uppercase font-semibold font-mono">{language}</span>
        {langNames[language].flag}
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute mt-2 w-40 rounded-xl border border-border/80 bg-card/90 backdrop-blur-md shadow-2xl p-1.5 z-50 overflow-hidden font-cairo ${
              isRtl ? "left-0 origin-top-left" : "right-0 origin-top-right"
            }`}
          >
            {Object.entries(langNames).map(([code, { label, flag }]) => {
              const active = language === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code as any);
                    setOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-xs hover:bg-secondary/70 transition-all flex items-center justify-between ${
                    active ? "text-primary bg-primary/10 font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  dir={code === 'ar' ? 'rtl' : 'ltr'}
                >
                  <span className="flex items-center gap-2.5">
                    {flag}
                    <span className="font-semibold">{label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageToggle;

