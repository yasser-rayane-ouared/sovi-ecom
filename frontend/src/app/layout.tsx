import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Sovi — SaaS Multi-Tenant Algerian COD E-Commerce Platform",
  description: "Create and grow your own e-commerce store in Algeria. High conversion storefronts, custom landing pages, and Yalidine/ZR Express shipment integrations.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var activeTheme = theme || systemTheme;
                  if (activeTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  var lang = localStorage.getItem('language') || 'ar';
                  var dir = lang === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.setAttribute('lang', lang);
                  document.documentElement.setAttribute('dir', dir);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="bg-background text-foreground transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
