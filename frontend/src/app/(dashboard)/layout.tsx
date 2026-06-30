"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth";
import { useDashboardStore } from "../../stores/dashboard";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Truck, Layers, Palette,
  Settings, Link2, LogOut, ChevronDown, Menu, X, PlusCircle, Sparkles, Check, Trophy, Users, Wrench, Star, Store,
  AlertCircle, Coins, FileText, MessageSquare, Megaphone, ExternalLink,
  SidebarClose, SidebarOpen
} from "lucide-react";
import { getStorefrontLink, getFullImageUrl } from "../../lib/utils";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguageStore } from "../../stores/language";
import SubscriptionCountdownBanner from "../../components/SubscriptionCountdownBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, language, isRtl } = useLanguageStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialize, logout } = useAuthStore();

  const [stores, setStores] = useState<any[]>([]);
  const { selectedStore, setSelectedStore } = useDashboardStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSidebarCollapsed, setGlobalSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("global_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleGlobalSidebar = () => {
    const nextVal = !globalSidebarCollapsed;
    setGlobalSidebarCollapsed(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem("global_sidebar_collapsed", String(nextVal));
    }
  };

  // Onboarding Checklist States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingTasks, setOnboardingTasks] = useState({
    storeNamed: false,
    firstProduct: false,
    shippingRates: false,
    yalidineConnected: false
  });
  const [celebrated, setCelebrated] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

  // Subscription Gate States
  const [subStatus, setSubStatus] = useState<any>(null);
  const [checkingSub, setCheckingSub] = useState(true);

  // Sync tasks with selectedStore loading
  useEffect(() => {
    if (selectedStore) {
      const isNamed = !!selectedStore.name && selectedStore.name !== "اختر المتجر" && selectedStore.name !== "Select Store" && selectedStore.name !== "Choisir la boutique";
      const key = `onboarding_store_${selectedStore.id}`;
      const savedTasks = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      
      let tasksObj = {
        storeNamed: isNamed,
        firstProduct: false,
        shippingRates: false,
        yalidineConnected: false
      };

      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          tasksObj = { ...parsed, storeNamed: isNamed };
        } catch (e) {}
      }
      
      setOnboardingTasks(tasksObj);
    }
  }, [selectedStore]);

  const toggleOnboardingTask = (key: keyof typeof onboardingTasks) => {
    if (key === 'storeNamed') return; // Read-only task, automatically computed
    const updated = { ...onboardingTasks, [key]: !onboardingTasks[key] };
    setOnboardingTasks(updated);
    
    if (selectedStore?.id) {
      localStorage.setItem(`onboarding_store_${selectedStore.id}`, JSON.stringify(updated));
    }

    const allCompleted = Object.values(updated).every(Boolean);
    if (allCompleted && !celebrated) {
      triggerConfetti();
      setCelebrated(true);
    } else if (!allCompleted) {
      setCelebrated(false);
    }
  };

  const triggerConfetti = () => {
    const colors = ["#d4af37", "#aa7c11", "#ebd0a7", "#818cf8", "#34d399", "#f43f5e"];
    const particles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      size: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
      rotation: Math.random() * 360
    }));
    setConfettiParticles(particles);

    setTimeout(() => {
      setConfettiParticles([]);
    }, 7000);
  };

  useEffect(() => {
    initialize().then(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      // Fetch owned stores
      api.get("/stores/").then((res) => {
        const storeList = Array.isArray(res.data) 
          ? res.data 
          : (res.data?.results || []);
        setStores(storeList);
        if (storeList.length > 0) {
          const currentSelected = useDashboardStore.getState().selectedStore;
          if (!currentSelected) {
            setSelectedStore(storeList[0]);
          } else {
            const freshStore = storeList.find((s: any) => s.id === currentSelected.id);
            if (freshStore) {
              setSelectedStore(freshStore);
            } else {
              setSelectedStore(storeList[0]);
            }
          }
        } else {
          // If no stores, go to setup wizard (only for non-superadmins)
          if (!useAuthStore.getState().user?.is_superadmin) {
            router.push("/create-store");
          }
        }
      }).catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect superadmin to admin panel if they go to overview or dashboard root
  useEffect(() => {
    if (user?.is_superadmin && (pathname === "/overview" || pathname === "/")) {
      router.push("/admin/accounts");
    }
  }, [user, pathname, router]);

  // Subscription verification check
  useEffect(() => {
    if (!selectedStore?.id || user?.is_superadmin) return;
    setCheckingSub(true);
    
    api.get(`/subscriptions/status/?store_id=${selectedStore.id}`)
      .then((res) => {
        setSubStatus(res.data);
        if (!res.data.has_active_subscription) {
          if (pathname !== "/billing") {
            router.push(`/choose-plan?store_id=${selectedStore.id}`);
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSub(false));
  }, [selectedStore?.id, router, user?.is_superadmin, pathname]);

  // Route guard logic for worker accounts
  useEffect(() => {
    if (selectedStore) {
      const isOwner = selectedStore.user_role === 'owner';
      const perms = selectedStore.user_permissions;
      const path = pathname;

      if (!isOwner && perms) {
        let isAllowed = true;
        if ((path.endsWith('/products') || path.includes('/products/')) && !perms.can_manage_products) isAllowed = false;
        if ((path.endsWith('/orders') || path.includes('/orders/')) && !perms.can_manage_orders) isAllowed = false;
        if (path.endsWith('/delivery') && !perms.can_manage_delivery) isAllowed = false;
        if ((path.endsWith('/pages') || path.includes('/pages/')) && !perms.can_manage_pages) isAllowed = false;
        if (path.endsWith('/themes') && !perms.can_manage_themes) isAllowed = false;
        if (path.endsWith('/pixels') && !perms.can_manage_pixels) isAllowed = false;
        if (path.endsWith('/integrations') && !perms.can_manage_integrations) isAllowed = false;
        if (path.endsWith('/settings') && !perms.can_manage_settings) isAllowed = false;
        if (path.endsWith('/workers') && !perms.can_manage_workers) isAllowed = false;

        if (!isAllowed) {
          router.push('/overview');
        }
      }
    }
  }, [pathname, selectedStore, router]);

  // Dynamic Tab Favicon Update
  useEffect(() => {
    if (selectedStore?.logo) {
      const logoUrl = getFullImageUrl(selectedStore.logo);
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
    } else {
      const linkSelectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
      linkSelectors.forEach((selector) => {
        const link: HTMLLinkElement | null = document.querySelector(selector);
        if (link) {
          link.href = "/logo.png";
        }
      });
    }
  }, [selectedStore]);

  const handleLogout = () => {
    logout();
    setSelectedStore(null);
    router.push("/login");
  };

  const hasPerm = (permKey: string) => {
    if (!selectedStore) return false;
    if (selectedStore.user_role === 'owner') return true;
    return !!selectedStore.user_permissions?.[permKey as keyof typeof selectedStore.user_permissions];
  };

  const menuItems = user?.is_superadmin
    ? [
        { name: language === 'ar' ? "إدارة المتاجر" : (language === 'fr' ? "Gestion des boutiques" : "Manage Stores"), path: `/admin/accounts`, icon: Users },
        { name: language === 'ar' ? "إيصالات الدفع" : (language === 'fr' ? "Reçus de paiement" : "Payment Receipts"), path: `/admin/receipts`, icon: FileText },
        { name: language === 'ar' ? "محادثات الدعم" : (language === 'fr' ? "Chats de support" : "Support Chats"), path: `/admin/support`, icon: MessageSquare },
        { name: language === 'ar' ? "نصائح وإرشادات" : (language === 'fr' ? "Conseils Marketing" : "Marketing Advice"), path: `/admin/advices`, icon: Megaphone },
      ]
    : (selectedStore
        ? [
            { name: t('overview'), path: `/overview`, icon: LayoutDashboard },
            { name: t('adviceFeed'), path: `/advices`, icon: Megaphone },
            ...(hasPerm('can_manage_themes') ? [{ name: t('storeCustomize'), path: `/themes/customize`, icon: Store }] : []),
            ...(hasPerm('can_manage_products') ? [{ name: t('products'), path: `/products`, icon: ShoppingBag }] : []),
            ...(hasPerm('can_manage_orders') ? [{ name: t('orders'), path: `/orders`, icon: ShoppingCart }] : []),
            ...(hasPerm('can_manage_products') ? [{ name: t('reviews'), path: `/reviews`, icon: Star }] : []),
            ...(hasPerm('can_manage_delivery') ? [{ name: t('shippingRates'), path: `/delivery`, icon: Truck }] : []),
            ...(hasPerm('can_manage_pages') ? [{ name: t('landingPages'), path: `/pages`, icon: Layers }] : []),
            ...(hasPerm('can_manage_themes') ? [{ name: t('themes'), path: `/themes`, icon: Palette }] : []),
            ...(hasPerm('can_manage_pixels') ? [{ name: t('pixels'), path: `/pixels`, icon: Sparkles }] : []),
            ...(hasPerm('can_manage_integrations') ? [{ name: t('integrations'), path: `/integrations`, icon: Link2 }] : []),
            ...(hasPerm('can_manage_settings') ? [{ name: t('generalSettings'), path: `/settings`, icon: Settings }] : []),
            ...(selectedStore.user_role === 'owner' ? [{ name: t('billing'), path: `/billing`, icon: Coins }] : []),
            { name: t('tools'), path: `/tools`, icon: Wrench },
            ...(selectedStore.user_role === 'owner' || hasPerm('can_manage_workers') ? [{ name: t('workers'), path: `/workers`, icon: Users }] : []),
            { name: language === 'ar' ? "الدعم الفني" : (language === 'fr' ? "Support client" : "Help Chat"), path: `/support`, icon: MessageSquare },
          ]
        : []);
  const completedCount = Object.values(onboardingTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col ${globalSidebarCollapsed ? 'w-20 p-3' : 'w-72 p-6'} bg-card justify-between flex-shrink-0 transition-all duration-300 ${isRtl ? 'border-l border-border' : 'border-r border-border'}`}>
        <div className="space-y-8">
          {/* Logo & Store Select */}
          {globalSidebarCollapsed && (
            <div className="flex justify-center">
              <button
                onClick={toggleGlobalSidebar}
                className="h-10 w-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all animate-fade-in"
                title={language === 'ar' ? "عرض القائمة الجانبية" : "Show Sidebar"}
              >
                {isRtl ? <SidebarOpen className="h-4 w-4 text-primary rotate-180" /> : <SidebarOpen className="h-4 w-4 text-primary" />}
              </button>
            </div>
          )}

          {user?.is_superadmin ? (
            <div className={`flex items-center ${globalSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 p-3'} rounded-xl border border-border bg-primary/10 text-primary font-cairo`} title={t('adminDashboard')}>
              <img src="/logo.png" alt="Sovi Logo" className="h-8 w-8 rounded-lg object-cover" />
              {!globalSidebarCollapsed && (
                <div className="text-start">
                  <h4 className="font-bold text-sm text-foreground">{t('adminDashboard')}</h4>
                  <span className="text-[10px] text-accent font-outfit">Website Owner Admin</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {!globalSidebarCollapsed ? (
                <div className="flex items-center gap-2">
                  <div className="flex-grow min-w-0">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="store-card-gradient w-full rounded-2xl transition-all duration-300 font-cairo"
                    >
                      <div className="relative flex items-center justify-between pl-3.5 pr-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Store Logo / Initial Avatar */}
                          <div className="store-avatar-glass h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0 font-outfit text-white overflow-hidden">
                            {selectedStore?.logo ? (
                              <img
                                src={getFullImageUrl(selectedStore.logo)}
                                alt={selectedStore.name}
                                className="h-full w-full object-cover rounded-xl"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  (e.currentTarget.nextSibling as HTMLElement)!.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className="h-full w-full flex items-center justify-center"
                              style={{ display: selectedStore?.logo ? 'none' : 'flex' }}
                            >
                              {selectedStore?.name?.[0]?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="text-start">
                            <h4 className="font-black text-sm truncate max-w-[110px] text-white tracking-wide font-cairo leading-tight drop-shadow">
                              {selectedStore?.name || t('selectStore')}
                            </h4>
                            <span className="text-[10px] font-semibold tracking-widest uppercase font-outfit" style={{ color: 'rgba(255,255,255,0.72)' }}>
                              {selectedStore?.subdomain}
                            </span>
                          </div>
                        </div>
                        <div className="store-chevron-glass h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                          <ChevronDown className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={toggleGlobalSidebar}
                    className="h-10 w-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                    title={language === 'ar' ? "إخفاء القائمة الجانبية" : "Hide Sidebar"}
                  >
                    {isRtl ? <SidebarClose className="h-4 w-4 text-primary rotate-180" /> : <SidebarClose className="h-4 w-4 text-primary" />}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="store-card-gradient w-full rounded-2xl transition-all duration-300 font-cairo p-1"
                  >
                    <div className="relative flex items-center justify-center p-2">
                      {/* Store Logo / Initial Avatar */}
                      <div className="store-avatar-glass h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0 font-outfit text-white overflow-hidden">
                        {selectedStore?.logo ? (
                          <img
                            src={getFullImageUrl(selectedStore.logo)}
                            alt={selectedStore.name}
                            className="h-full w-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget.nextSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span
                          className="h-full w-full flex items-center justify-center"
                          style={{ display: selectedStore?.logo ? 'none' : 'flex' }}
                        >
                          {selectedStore?.name?.[0]?.toUpperCase() || 'S'}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl p-2 z-50 font-cairo text-foreground">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStore(s);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-start p-2.5 rounded-lg text-sm hover:bg-secondary transition-all flex justify-between items-center ${
                        selectedStore?.id === s.id ? "text-accent bg-accent/10 font-bold" : "text-muted-foreground"
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground font-outfit">{s.subdomain}</span>
                    </button>
                  ))}
                  <div className="border-t border-border my-2"></div>
                  <Link href="/create-store" className="w-full">
                    <Button variant="ghost" className="w-full text-xs font-semibold flex items-center gap-2 justify-center py-2 border border-dashed border-border hover:bg-secondary text-accent">
                      <PlusCircle className="h-4 w-4" /> {t('createStore')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Online Store Link Button */}
              {selectedStore && (
                <a
                  href={getStorefrontLink(selectedStore.subdomain, '/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`store-visit-btn mt-2 flex items-center justify-center rounded-xl font-bold font-cairo ${globalSidebarCollapsed ? 'p-3' : 'gap-2 w-full px-3 py-2.5 text-xs'}`}
                  title={language === 'ar' ? "زيارة المتجر" : "Visit Store"}
                >
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  {!globalSidebarCollapsed && (
                    <span>
                      {language === 'ar' ? "زيارة المتجر الإلكتروني" : (language === 'fr' ? "Visiter la boutique" : "Visit Online Store")}
                    </span>
                  )}
                </a>
              )}
            </div>
          )}



          {/* Navigation Menu */}
          <nav className="space-y-1.5 font-cairo">
            {menuItems.map((item, idx) => {
              const isActive = pathname.endsWith(item.path);
              return (
                <Link key={idx} href={item.path} className="block">
                  <div
                    className={`flex items-center ${globalSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'} rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title={item.name}
                  >
                    <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                    {!globalSidebarCollapsed && <span>{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Footer auth info */}
        <div className="border-t border-border pt-4 space-y-4 font-cairo text-foreground">
          <div className="flex flex-col gap-3">
            <div className={`flex items-center ${globalSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'} rounded-xl bg-secondary/30 border border-border/50`} title={user?.full_name}>
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary font-outfit shadow-inner flex-shrink-0">
                {user?.first_name?.[0]?.toUpperCase() || "A"}
              </div>
              {!globalSidebarCollapsed && (
                <div className="text-start min-w-0 flex-1">
                  <h5 className="text-sm font-bold text-foreground truncate">{user?.full_name}</h5>
                  <span className="text-[10px] text-muted-foreground truncate block">{user?.email}</span>
                </div>
              )}
            </div>
            {!globalSidebarCollapsed && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {language === 'ar' ? "خيارات الواجهة" : (language === 'fr' ? "Options d'interface" : "Interface Options")}
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center ${globalSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'} w-full text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all`}
            title={t('logout')}
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {!globalSidebarCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Header - Mobile */}
        <header className="lg:hidden flex items-center justify-between px-6 h-16 border-b border-border bg-card">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-secondary text-foreground">
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden flex">
            <div className={`w-72 bg-card h-full p-6 flex flex-col text-foreground ${isRtl ? 'border-l border-border' : 'border-r border-border'}`}>
              {/* Mobile Sidebar Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">Sovi</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg bg-secondary text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Navigation Area */}
              <div className="flex-grow overflow-y-auto my-4 py-2 pr-1 -mr-1">
                <nav className="space-y-1 font-cairo">
                  {menuItems.map((item, idx) => (
                    <Link key={idx} href={item.path} onClick={() => setSidebarOpen(false)} className="block">
                      <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="pt-4 border-t border-border flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-red-500 font-cairo w-full px-4 py-2.5 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Banner */}
        {!user?.is_superadmin && <SubscriptionCountdownBanner />}

        {/* Content Page */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto relative bg-grid">
          {user?.is_superadmin ? (
            children
          ) : selectedStore ? (
            checkingSub ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-cairo">{t('verifyingSubscription')}</div>
            ) : subStatus && !subStatus.has_active_subscription && pathname !== "/billing" && pathname !== "/admin/receipts" && pathname !== "/admin/accounts" ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-lg mx-auto font-cairo p-6 bg-card/60 backdrop-blur-md border border-border rounded-2xl shadow-xl">
                <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-10 w-10 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {language === 'ar' ? "عذراً، اشتراك متجرك منتهٍ!" : (language === 'fr' ? "Désolé, votre abonnement a expiré !" : "Sorry, your store subscription has expired!")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {language === 'ar' ? "توقفت مبيعات متجرك وموقعك الإلكتروني مؤقتاً بسبب انتهاء صلاحية اشتراكك. يرجى تجديد الاشتراك لاستعادة تشغيل متجرك الإلكتروني واستقبل مبيعات جديدة." : (language === 'fr' ? "Les ventes de votre boutique et votre site internet sont temporairement suspendus. Veuillez renouveler votre abonnement pour relancer votre boutique." : "Your store sales and website are temporarily suspended. Please renew your subscription to reactivate your store.")}
                </p>
                <Button onClick={() => router.push("/billing")} variant="glow" className="py-6 px-8 text-sm font-bold flex items-center gap-2">
                  <span>
                    {language === 'ar' ? "جدد اشتراكك الآن" : (language === 'fr' ? "Renouveler maintenant" : "Renew Subscription Now")}
                  </span>
                  <Coins className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              React.cloneElement(children as React.ReactElement, { storeId: selectedStore.id, storeSubdomain: selectedStore.subdomain })
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground font-cairo">{t('loadingStore')}</div>
          )}
        </main>

        {/* Confetti Celebration Overlay */}
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}vh`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                transform: `rotate(${p.rotation}deg)`,
                opacity: 0.85,
                animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Floating Onboarding Checklist Card */}
        {selectedStore && !user?.is_superadmin && showOnboarding && (
          <div className="fixed bottom-6 left-6 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl p-5 font-cairo text-start animate-fade-in-up text-foreground">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-[#d4af37]" />
                <h4 className="font-bold text-xs">{t('onboardingSteps')}</h4>
              </div>
              <button onClick={() => setShowOnboarding(false)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5 space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>{t('progress')}</span>
                <span className="font-outfit font-bold">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="mt-4 space-y-2.5">
              {[
                { key: "storeNamed", label: t('checklistNamed'), desc: t('checklistNamedDesc'), auto: true },
                { key: "firstProduct", label: t('checklistProduct'), desc: t('checklistProductDesc'), auto: false },
                { key: "shippingRates", label: t('checklistShipping'), desc: t('checklistShippingDesc'), auto: false },
                { key: "yalidineConnected", label: t('checklistYalidine'), desc: t('checklistYalidineDesc'), auto: false }
              ].map((task) => {
                const isDone = onboardingTasks[task.key as keyof typeof onboardingTasks];
                return (
                  <div
                    key={task.key}
                    onClick={() => !task.auto && toggleOnboardingTask(task.key as keyof typeof onboardingTasks)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                      task.auto ? 'cursor-default' : 'cursor-pointer hover:bg-secondary'
                    } ${isDone ? 'border-accent/20 bg-accent/5' : 'border-border bg-secondary/30'}`}
                  >
                    <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                      isDone ? 'bg-accent border-accent text-primary-foreground font-bold' : 'border-border'
                    }`}>
                      {isDone && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isDone ? 'text-foreground font-bold' : 'text-foreground'}`}>{task.label}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">{task.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-3.5 border-t border-border">
              {progressPercent === 100 ? (
                <div className="space-y-2.5 text-center">
                  <p className="text-[11px] text-emerald-400 font-bold">{t('checklistComplete')}</p>
                  <Button onClick={triggerConfetti} size="sm" variant="glow" className="w-full text-xs font-extrabold flex items-center justify-center gap-1">
                    {t('checklistCelebration')}
                  </Button>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center">{t('checklistRemaining')}</p>
              )}
            </div>
          </div>
        )}

        {/* Toggle Float button */}
        {selectedStore && !user?.is_superadmin && !showOnboarding && (
          <div className="fixed bottom-6 left-6 z-40 font-cairo">
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-xs border border-border"
            >
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-[#d4af37]" />
              <span>{t('checklistFloatBtn')}</span>
              {completedCount < 4 && (
                <span className="h-5 w-5 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center font-outfit">{4 - completedCount}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
