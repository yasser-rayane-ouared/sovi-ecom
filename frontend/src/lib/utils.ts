import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStorefrontLink(subdomain: string, path: string) {
  if (typeof window === 'undefined') {
    return `/${subdomain}${path === '/' ? '' : path}`;
  }
  
  const hostname = window.location.hostname;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const cleanRoot = rootDomain.split(':')[0];
  
  const isMainDomain = hostname === cleanRoot || hostname === `www.${cleanRoot}`;
  
  if (isMainDomain) {
    return `/${subdomain}${path === '/' ? '' : path}`;
  } else {
    return path;
  }
}

export function getRootDomain() {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
      return process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    }
    // Fallback: If on local/IP/etc, return active host
    return window.location.host;
  }
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "sovi.localhost:3000";
}

export function getFullImageUrl(url: string) {
  if (!url) return "";
  let cleanUrl = url;
  // If the url points to localhost but we are in production, rewrite it to the api base url
  if (cleanUrl.startsWith("http://localhost:8000") || cleanUrl.startsWith("http://127.0.0.1:8000")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";
    cleanUrl = cleanUrl.replace("http://localhost:8000", baseUrl).replace("http://127.0.0.1:8000", baseUrl);
  }
  // Prevent Mixed Content blocks in production by upgrading to HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:" && cleanUrl.startsWith("http://")) {
    if (!cleanUrl.includes("localhost") && !cleanUrl.includes("127.0.0.1")) {
      cleanUrl = cleanUrl.replace("http://", "https://");
    }
  }
  if (cleanUrl.startsWith("http")) return cleanUrl;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";
  
  let relativePath = cleanUrl;
  if (!relativePath.startsWith("/")) {
    relativePath = `/${relativePath}`;
  }
  
  let finalBaseUrl = baseUrl;
  if (typeof window !== "undefined" && window.location.protocol === "https:" && finalBaseUrl.startsWith("http://")) {
    if (!finalBaseUrl.includes("localhost") && !finalBaseUrl.includes("127.0.0.1")) {
      finalBaseUrl = finalBaseUrl.replace("http://", "https://");
    }
  }
  return `${finalBaseUrl}${relativePath}`;
}
