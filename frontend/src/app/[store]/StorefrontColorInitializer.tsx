"use client";

import { useEffect } from "react";

const getFullImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${url}`;
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
