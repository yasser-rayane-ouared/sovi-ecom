"use client";

import { useEffect } from "react";

const getFullImageUrl = (url: string) => {
  if (!url) return "";
  let cleanUrl = url;
  if (cleanUrl.startsWith("http://localhost:8000") || cleanUrl.startsWith("http://127.0.0.1:8000")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";
    cleanUrl = cleanUrl.replace("http://localhost:8000", baseUrl).replace("http://127.0.0.1:8000", baseUrl);
  }
  if (cleanUrl.startsWith("http") || cleanUrl.startsWith("data:") || cleanUrl.startsWith("blob:")) return cleanUrl;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${cleanUrl}`;
};

export default function StorefrontColorInitializer({ primaryColor, logo }: { primaryColor?: string; logo?: string }) {
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
  }, [primaryColor]);

  useEffect(() => {
    if (logo) {
      const logoUrl = getFullImageUrl(logo);
      const linkSelectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
      
      linkSelectors.forEach((selector) => {
        let link: HTMLLinkElement | null = document.querySelector(selector);
        if (!link && selector.includes('icon')) {
          link = document.createElement('link');
          if (selector.includes('shortcut')) {
            link.rel = 'shortcut icon';
          } else if (selector.includes('apple')) {
            link.rel = 'apple-touch-icon';
          } else {
            link.rel = 'icon';
          }
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        if (link) {
          link.href = logoUrl;
        }
      });
    }
  }, [logo]);
  
  return null;
}
