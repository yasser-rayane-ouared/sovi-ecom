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
    if (hostname.includes('railway.app')) {
      return `/${subdomain}${path === '/' ? '' : path}`;
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `http://${subdomain}.localhost${port}${path}`;
    }
    
    const protocol = window.location.protocol;
    return `${protocol}//${subdomain}.${cleanRoot}${path}`;
  } else {
    return path;
  }
}

export function getAbsoluteStorefrontLink(subdomain: string, path: string, customDomain?: string) {
  if (typeof window === 'undefined') {
    return `/${subdomain}${path === '/' ? '' : path}`;
  }
  
  if (customDomain) {
    return `${window.location.protocol}//${customDomain}${path}`;
  }
  
  const hostname = window.location.hostname;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  // If we are on localhost, return http://{subdomain}.localhost:3000/path
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `http://${subdomain}.localhost${port}${path}`;
  }
  
  // If using default Railway domains (e.g., app.up.railway.app), we cannot use nested subdomains
  // because SSL certificates do not support nested wildcards (*.*.up.railway.app).
  // Instead, we must use path-based routing: https://{hostname}/{subdomain}{path}
  if (hostname.includes('railway.app')) {
    return `${window.location.protocol}//${hostname}/${subdomain}${path}`;
  }
  
  // In production: return current protocol to support HTTPS on subdomains
  const cleanRoot = rootDomain.split(':')[0];
  const protocol = window.location.protocol;
  return `${protocol}//${subdomain}.${cleanRoot}${path}`;
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
