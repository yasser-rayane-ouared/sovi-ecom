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
