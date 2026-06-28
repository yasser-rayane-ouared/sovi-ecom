import type { Metadata } from "next";
import StorefrontColorInitializer from "./StorefrontColorInitializer";

interface Props {
  params: { store: string };
  children: React.ReactNode;
}

const getFullImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${url}`;
};

export async function generateMetadata({ params }: { params: { store: string } }): Promise<Metadata> {
  const subdomain = params.store;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${baseUrl}/storefront/${subdomain}/`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    
    const store = await res.json();
    const logoUrl = getFullImageUrl(store.logo) || "/logo.png";
    
    const titleSuffix = store.language === "en" 
      ? "Official Online Store" 
      : store.language === "fr" 
        ? "Boutique en ligne officielle" 
        : "المتجر الإلكتروني الرسمي";
        
    return {
      title: `${store.name} — ${store.tagline || titleSuffix}`,
      description: store.description || `Welcome to ${store.name}`,
      icons: {
        icon: logoUrl,
        shortcut: logoUrl,
        apple: logoUrl,
      }
    };
  } catch (e) {
    return {};
  }
}

export default async function StorefrontLayout({
  children,
  params
}: Props) {
  const subdomain = params.store;
  let primaryColor = "";
  let logo = "";
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${baseUrl}/storefront/${subdomain}/`, { next: { revalidate: 60 } });
    if (res.ok) {
      const store = await res.json();
      primaryColor = store?.settings?.primary_color || "";
      logo = store?.logo || "";
    }
  } catch (e) {}

  return (
    <>
      <StorefrontColorInitializer primaryColor={primaryColor} logo={logo} />
      {children}
    </>
  );
}
