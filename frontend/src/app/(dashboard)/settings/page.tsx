"use client";
import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useLanguageStore } from "../../../stores/language";
import { useDashboardStore } from "../../../stores/dashboard";
import { getRootDomain, getFullImageUrl } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import {
  Settings, Save, Phone, DollarSign, Upload, Image, CheckCircle,
  AlertCircle, Shield, Lock, Palette, Globe, Info, Store, Truck,
  Check, Sparkles, Sliders, HelpCircle
} from "lucide-react";

interface SettingsProps {
  storeId?: string;
  storeSubdomain?: string;
}

type SettingsTab = "identity" | "shipping" | "domain" | "security" | "storefront";

export default function SettingsDashboard({ storeId }: SettingsProps) {
  const { selectedStore, setSelectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<SettingsTab>("identity");

  // State definitions
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [language, setLanguage] = useState("ar");

  const [whatsapp, setWhatsapp] = useState("");
  const [currency, setCurrency] = useState("DZD");
  const [defaultDeliveryPrice, setDefaultDeliveryPrice] = useState("600");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("8000");

  // Security
  const [securityEnablePhoneValidation, setSecurityEnablePhoneValidation] = useState(false);
  const [securityEnableCaptcha, setSecurityEnableCaptcha] = useState(false);
  const [securityCaptchaSiteKey, setSecurityCaptchaSiteKey] = useState("");
  const [securityCaptchaSecretKey, setSecurityCaptchaSecretKey] = useState("");
  const [securityEnableFirebaseOtp, setSecurityEnableFirebaseOtp] = useState(false);
  const [securityFirebaseConfigJson, setSecurityFirebaseConfigJson] = useState("");
  const [securityMaxOrdersPerDay, setSecurityMaxOrdersPerDay] = useState("5");
  const [securityBlockNonAlgerianIps, setSecurityBlockNonAlgerianIps] = useState(false);

  // Storefront Customization
  const [announcementText, setAnnouncementText] = useState("الدفع عند الاستلام في 58 ولاية!");
  const [announcementBgColor, setAnnouncementBgColor] = useState("#4f46e5");
  const [whatsappFloatingButton, setWhatsappFloatingButton] = useState(true);
  const [badge1Title, setBadge1Title] = useState("توصيل سريع");
  const [badge1Desc, setBadge1Desc] = useState("التوصيل لجميع الولايات بأسعار مدروسة.");
  const [badge2Title, setBadge2Title] = useState("الدفع عند الاستلام");
  const [badge2Desc, setBadge2Desc] = useState("لا تدفع أي شيء حتى تستلم منتجك بين يديك.");
  const [badge3Title, setBadge3Title] = useState("دعم العملاء");
  const [badge3Desc, setBadge3Desc] = useState("فريق عملنا متواجد للرد على اتصالاتكم وتأكيد الطلبييات.");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/products/${currentStoreId}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newLogo = res.data.image_url;
      setLogo(newLogo);

      // Save logo to backend database immediately
      await api.patch(`/stores/${currentStoreId}/`, {
        logo: newLogo,
      });

      // Update global context/sidebar state instantly
      if (selectedStore && selectedStore.id === currentStoreId) {
        setSelectedStore({
          ...selectedStore,
          logo: newLogo,
        });
      }
    } catch (err: any) {
      setError(t("settingsIdentityLogoUploadError"));
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    if (currentStoreId) {
      api.get(`/stores/${currentStoreId}/`)
        .then((res) => {
          const d = res.data;
          setStoreName(d.name || "");
          setDescription(d.description || "");
          setLogo(d.logo || "");
          setLanguage(d.language || "ar");

          const s = d.settings || {};
          setWhatsapp(s.whatsapp_number || "");
          setCurrency(s.currency || "DZD");
          setDefaultDeliveryPrice((s.default_delivery_price || "600").toString());
          setFreeDeliveryThreshold((s.free_delivery_threshold || "8000").toString());
          setSecurityEnablePhoneValidation(!!s.security_enable_phone_validation);
          setSecurityEnableCaptcha(!!s.security_enable_captcha);
          setSecurityCaptchaSiteKey(s.security_captcha_site_key || "");
          setSecurityCaptchaSecretKey(s.security_captcha_secret_key || "");
          setSecurityEnableFirebaseOtp(!!s.security_enable_firebase_otp);
          setSecurityFirebaseConfigJson(s.security_firebase_config_json || "");
          setSecurityMaxOrdersPerDay((s.security_max_orders_per_day !== undefined ? s.security_max_orders_per_day : 5).toString());
          setSecurityBlockNonAlgerianIps(!!s.security_block_non_algerian_ips);
          
          setAnnouncementText(s.announcement_text || "الدفع عند الاستلام في 58 ولاية!");
          setAnnouncementBgColor(s.announcement_bg_color || "#4f46e5");
          setWhatsappFloatingButton(s.whatsapp_floating_button !== undefined ? !!s.whatsapp_floating_button : true);
          setBadge1Title(s.badge_1_title || "توصيل سريع");
          setBadge1Desc(s.badge_1_desc || "التوصيل لجميع الولايات بأسعار مدروسة.");
          setBadge2Title(s.badge_2_title || "الدفع عند الاستلام");
          setBadge2Desc(s.badge_2_desc || "لا تدفع أي شيء حتى تستلم منتجك بين يديك.");
          setBadge3Title(s.badge_3_title || "دعم العملاء");
          setBadge3Desc(s.badge_3_desc || "فريق عملنا متواجد للرد على اتصالاتكم وتأكيد الطلبيات.");
          
          setCustomDomain(d.custom_domain || "");
        })
        .catch(() => {});
    }
  }, [currentStoreId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);

    try {
      let cleanDomain = customDomain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^(https?:\/\/)/, '');
      cleanDomain = cleanDomain.split('/')[0];
      if (cleanDomain.startsWith('www.')) {
        cleanDomain = cleanDomain.substring(4);
      }

      await api.patch(`/stores/${currentStoreId}/`, {
        name: storeName,
        description,
        logo,
        language,
        custom_domain: cleanDomain || null,
      });

      await api.post(`/stores/${currentStoreId}/setup/`, {
        whatsapp_number: whatsapp,
        currency,
        default_delivery_price: parseFloat(defaultDeliveryPrice) || 0,
        free_delivery_threshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold) : null,
        security_enable_phone_validation: securityEnablePhoneValidation,
        security_enable_captcha: securityEnableCaptcha,
        security_captcha_site_key: securityCaptchaSiteKey,
        security_captcha_secret_key: securityCaptchaSecretKey,
        security_enable_firebase_otp: securityEnableFirebaseOtp,
        security_firebase_config_json: securityFirebaseConfigJson,
        security_max_orders_per_day: parseInt(securityMaxOrdersPerDay) || 0,
        security_block_non_algerian_ips: securityBlockNonAlgerianIps,
        announcement_text: announcementText,
        announcement_bg_color: announcementBgColor,
        whatsapp_floating_button: whatsappFloatingButton,
        badge_1_title: badge1Title,
        badge_1_desc: badge1Desc,
        badge_2_title: badge2Title,
        badge_2_desc: badge2Desc,
        badge_3_title: badge3Title,
        badge_3_desc: badge3Desc,
      });

      if (selectedStore && selectedStore.id === currentStoreId) {
        setSelectedStore({
          ...selectedStore,
          name: storeName,
          logo: logo,
        });
      }

      setSuccess(t("settingsSaveSuccess"));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(t("settingsSaveError"));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const tabsConfig = [
    {
      id: "identity" as SettingsTab,
      label: t("settingsTabIdentity"),
      description: t("settingsTabIdentityDesc"),
      icon: Store,
      color: "text-indigo-400"
    },
    {
      id: "shipping" as SettingsTab,
      label: t("settingsTabShipping"),
      description: t("settingsTabShippingDesc"),
      icon: Truck,
      color: "text-emerald-400"
    },
    {
      id: "domain" as SettingsTab,
      label: t("settingsTabDomain"),
      description: t("settingsTabDomainDesc"),
      icon: Globe,
      color: "text-sky-400"
    },
    {
      id: "security" as SettingsTab,
      label: t("settingsTabSecurity"),
      description: t("settingsTabSecurityDesc"),
      icon: Shield,
      color: "text-rose-400"
    },
    {
      id: "storefront" as SettingsTab,
      label: t("settingsTabStorefront"),
      description: t("settingsTabStorefrontDesc"),
      icon: Palette,
      color: "text-amber-400"
    }
  ];

  return (
    <div className={`space-y-8 text-foreground pb-16 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 backdrop-blur-md">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-accent/5 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> {t("settingsPremiumBadge")}
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground">
              {t("settingsTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("settingsDesc")}
            </p>
          </div>
          {selectedStore?.subdomain && (
            <a
              href={`/${selectedStore.subdomain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:shadow-[0_0_25px_rgba(79,70,229,0.2)]"
            >
              <span>{t("settingsLiveStoreBtn")}</span>
            </a>
          )}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <div className="p-1.5 rounded-lg bg-emerald-500/15">
            <CheckCircle className="h-5 w-5" />
          </div>
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3 animate-in fade-in duration-300">
          <div className="p-1.5 rounded-lg bg-rose-500/15">
            <AlertCircle className="h-5 w-5" />
          </div>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* RIGHT: Navigation Sidebar (Luxury Tabs) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-3xl border border-border bg-card/60 p-4 backdrop-blur-md space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground px-3 uppercase tracking-wider block mb-3">{t("settingsTabTitle", "أقسام الإعدادات")}</span>
            {tabsConfig.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSuccess("");
                    setError("");
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${isRtl ? "text-right" : "text-left"} ${
                    isActive
                      ? (isRtl ? "bg-gradient-to-l from-primary/15 via-primary/5 to-transparent border-r-4 border-r-primary text-foreground shadow-inner" : "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-l-4 border-l-primary text-foreground shadow-inner")
                      : "hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                  }`}
                  type="button"
                >
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    isActive ? "bg-primary/20 text-primary" : "bg-muted/25 text-muted-foreground group-hover:text-foreground"
                  }`}>
                    <TabIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-bold block text-foreground">{tab.label}</span>
                    <span className="text-xs text-muted-foreground block group-hover:text-foreground/80 transition-colors leading-relaxed">
                      {tab.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse ${isRtl ? "left-4" : "right-4"}`}></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Help Card */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <HelpCircle className="h-4 w-4" /> {t("settingsHelpTitle")}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("settingsHelpDesc")}
            </p>
            <a
              href="https://wa.me/213661234567"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 text-xs text-foreground font-bold transition-all"
            >
              {t("settingsHelpSupportBtn")}
            </a>
          </div>
        </div>

        {/* LEFT: Content Panel (Active Tab Fields) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Tab: Store Identity */}
            {activeTab === "identity" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Card className="border-border bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">
                  <CardHeader className="border-b border-border p-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                      <Store className="h-5 w-5 text-indigo-400" /> {t("settingsIdentityCardTitle")}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t("settingsIdentityCardDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/90">{t("settingsIdentityName")}</label>
                      <Input
                        required
                        placeholder={t("settingsIdentityNamePlaceholder")}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="ps-3 text-start h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-foreground/90 block">{t("settingsIdentityLogo")}</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {logo ? (
                          <div className="relative w-40 h-20 rounded-2xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center p-3 group shadow-inner">
                            <img src={getFullImageUrl(logo)} alt="Logo Preview" className="h-full w-auto object-contain" />
                            <button
                              type="button"
                              onClick={async () => {
                                setLogo("");
                                try {
                                  await api.patch(`/stores/${currentStoreId}/`, {
                                    logo: "",
                                  });
                                  if (selectedStore && selectedStore.id === currentStoreId) {
                                    setSelectedStore({
                                      ...selectedStore,
                                      logo: "",
                                    });
                                  }
                                } catch (e) {}
                              }}
                              className="absolute inset-0 bg-background/95 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-500 font-bold text-xs transition-opacity rounded-2xl font-cairo"
                            >
                              {t("settingsIdentityLogoRemove")}
                            </button>
                          </div>
                        ) : (
                          <div className="w-40 h-20 rounded-2xl border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center text-xs text-muted-foreground">
                            <Image className="h-6 w-6 mb-1.5 opacity-30 text-muted-foreground" />
                            <span>{t("settingsIdentityLogoNone")}</span>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <label className="cursor-pointer">
                            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 text-xs font-semibold text-foreground transition-all shadow-sm">
                              <Upload className="h-4 w-4 text-indigo-400" />
                              {uploadingLogo ? t("settingsIdentityLogoUploading") : t("settingsIdentityLogoUploadBtn")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo}
                            />
                          </label>
                          <p className="text-[10px] text-muted-foreground">{t("settingsIdentityLogoSizeLimit")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/90">{t("settingsIdentityDescLabel")}</label>
                      <textarea
                        placeholder={t("settingsIdentityDescPlaceholder")}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/90">{t("settingsIdentityLang")}</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="flex w-full rounded-xl border border-border bg-input px-3 h-12 text-sm text-foreground focus-visible:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="ar" className="bg-card text-foreground">العربية (Arabic)</option>
                        <option value="fr" className="bg-card text-foreground">Français (French)</option>
                        <option value="en" className="bg-card text-foreground">English</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">{t("settingsIdentityLangDesc")}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Store Mockup Preview */}
                <div className="rounded-3xl border border-border bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent p-6 space-y-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">{t("settingsIdentityMockupTitle")}</span>
                  <div className="border border-border bg-muted/15 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      {logo ? (
                        <img src={getFullImageUrl(logo)} alt="mockup logo" className="h-8 w-auto object-contain" />
                      ) : (
                        <div className="h-8 w-24 bg-muted/20 rounded animate-pulse"></div>
                      )}
                      <div className="flex gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted/20"></div>
                        <div className="h-6 w-6 rounded-full bg-muted/20"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-foreground">{storeName || t("settingsIdentityMockupNamePl")}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed min-h-[30px]">
                        {description || t("settingsIdentityMockupDescPl")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Shipping & Finances */}
            {activeTab === "shipping" && (
              <Card className="border-border bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="border-b border-border p-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Truck className="h-5 w-5 text-emerald-400" /> {t("settingsShippingCardTitle")}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t("settingsShippingCardDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/90 flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-emerald-400" /> {t("settingsShippingWhatsapp")}
                    </label>
                    <Input
                      placeholder="0661234567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="ps-3 text-start font-outfit h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {t("settingsShippingWhatsappDesc")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/90">{t("settingsShippingCurrency")}</label>
                      <Input
                        value={currency}
                        disabled
                        className="ps-3 text-start font-bold text-muted-foreground h-12 rounded-xl border-border bg-muted/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/90">{t("settingsShippingDefaultPrice")}</label>
                      <Input
                        type="number"
                        value={defaultDeliveryPrice}
                        onChange={(e) => setDefaultDeliveryPrice(e.target.value)}
                        className="ps-3 text-start font-outfit h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/90">{t("settingsShippingFreeThreshold")}</label>
                    <Input
                      type="number"
                      placeholder="8000"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                      className="ps-3 text-start font-outfit h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                    />
                    <p className="text-[10px] text-muted-foreground">{t("settingsShippingFreeThresholdDesc")}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab: Custom Domain */}
            {activeTab === "domain" && (
              <Card className="border-border bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="border-b border-border p-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Globe className="h-5 w-5 text-sky-400" /> {t("settingsDomainCardTitle")}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t("settingsDomainCardDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/90 block">{t("settingsDomainLabel")}</label>
                        <Input
                          placeholder="example.com"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          className="ps-3 text-start font-outfit text-sm h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                          dir="ltr"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("settingsDomainDesc")}
                      </p>
                    </div>

                    <div className="space-y-3 bg-muted/15 p-5 rounded-2xl border border-border text-xs">
                      <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
                        <Info className="h-4 w-4" /> {t("settingsDomainDnsTitle")}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("settingsDomainDnsDesc")}
                      </p>
                      <div className="space-y-2 pt-1 font-mono text-[10px]" dir="ltr">
                        <div className="flex justify-between bg-muted/20 p-2 rounded-lg border border-border">
                          <span className="text-muted-foreground">Type: <strong className="text-foreground">CNAME</strong></span>
                          <span className="text-muted-foreground">Host: <strong className="text-foreground">www</strong></span>
                          <span className="text-muted-foreground">Target: <strong className="text-foreground">{getRootDomain().split(':')[0]}</strong></span>
                        </div>
                        <div className="flex justify-between bg-muted/20 p-2 rounded-lg border border-border">
                          <span className="text-muted-foreground">Type: <strong className="text-foreground">A</strong></span>
                          <span className="text-muted-foreground">Host: <strong className="text-foreground">@</strong></span>
                          <span className="text-muted-foreground">Value: <strong className="text-foreground">127.0.0.1</strong></span>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-500 font-semibold leading-relaxed font-cairo">
                        {t("settingsDomainDnsWarning")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab: Security & Antispam */}
            {activeTab === "security" && (
              <Card className="border-border bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="border-b border-border p-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5 text-rose-400" /> {t("settingsSecurityCardTitle")}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t("settingsSecurityCardDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Google reCAPTCHA v3 Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card/40 transition-all hover:bg-muted/10">
                    <div className="space-y-1 text-right pl-4">
                      <span className="text-sm font-bold block text-foreground">{t("settingsSecurityRecaptcha")}</span>
                      <span className="text-xs text-muted-foreground block leading-relaxed">
                        {t("settingsSecurityRecaptchaDesc")}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={securityEnableCaptcha}
                        onChange={(e) => setSecurityEnableCaptcha(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* reCAPTCHA Keys Input Fields */}
                  {securityEnableCaptcha && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl border border-border bg-muted/15 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="col-span-1 md:col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/20 text-right text-xs text-foreground/80 leading-relaxed">
                        <p className="font-bold text-primary mb-1">
                          {language === 'ar' ? "📋 خطوات الحصول على مفاتيح Google reCAPTCHA v3:" : "📋 How to get Google reCAPTCHA v3 Keys:"}
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                          {language === 'ar' ? (
                            <>
                              <li>اذهب إلى <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">لوحة تحكم Google reCAPTCHA</a>.</li>
                              <li>اضغط على <b>إنشاء (+)</b> لتسجيل موقع جديد.</li>
                              <li>اكتب تسمية للموقع، واختر نوع <b>reCAPTCHA v3</b>، وأضف نطاق متجرك (مثال: <code>yourstore.com</code> أو <code>athletic-love-production-b2e8.up.railway.app</code>) <b>دون كتابة <code>https://</code> أو أي مسار آخر (يجب كتابة النطاق الصافي فقط)</b>.</li>
                              <li>انسخ <b>Site Key</b> و <b>Secret Key</b> الممنوحين والصقهما أدناه.</li>
                            </>
                          ) : (
                            <>
                              <li>Go to <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Google reCAPTCHA Console</a>.</li>
                              <li>Click <b>Create (+)</b> to register a new site.</li>
                              <li>Enter a label, select <b>reCAPTCHA v3</b>, and add your store domain (e.g. <code>yourstore.com</code> or <code>athletic-love-production-b2e8.up.railway.app</code>) <b>without <code>https://</code>, protocols, or paths (enter the clean domain host only)</b>.</li>
                              <li>Copy the generated <b>Site Key</b> and <b>Secret Key</b> and paste them below.</li>
                            </>
                          )}
                        </ol>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/90">{t("settingsSecurityRecaptchaSiteKey")}</label>
                        <Input
                          required={securityEnableCaptcha}
                          placeholder="Site Key الخاص بـ Google reCAPTCHA"
                          value={securityCaptchaSiteKey}
                          onChange={(e) => setSecurityCaptchaSiteKey(e.target.value)}
                          className="ps-3 text-start font-outfit text-xs h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/90 flex items-center gap-1.5 justify-end">
                          <Lock className="h-4 w-4 text-muted-foreground" /> {t("settingsSecurityRecaptchaSecretKey")}
                        </label>
                        <Input
                          required={securityEnableCaptcha}
                          type="password"
                          placeholder="Secret Key الخاص بـ Google reCAPTCHA"
                          value={securityCaptchaSecretKey}
                          onChange={(e) => setSecurityCaptchaSecretKey(e.target.value)}
                          className="ps-3 text-start font-outfit text-xs h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Firebase OTP Phone Verification Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card/40 transition-all hover:bg-muted/10">
                    <div className="space-y-1 text-right pl-4">
                      <span className="text-sm font-bold block text-foreground">{t("settingsSecurityFirebaseOtp")}</span>
                      <span className="text-xs text-muted-foreground block leading-relaxed">
                        {t("settingsSecurityFirebaseOtpDesc")}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={securityEnableFirebaseOtp}
                        onChange={(e) => setSecurityEnableFirebaseOtp(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Firebase Config Input Field */}
                  {securityEnableFirebaseOtp && (
                    <div className="space-y-2 p-5 rounded-2xl border border-border bg-muted/15 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-right text-xs text-foreground/80 leading-relaxed space-y-1">
                        <p className="font-bold text-primary mb-1">
                          {language === 'ar' ? "📋 خطوات تفعيل التحقق من الهاتف SMS OTP وربط Firebase:" : "📋 How to configure Firebase Phone Auth (SMS OTP):"}
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                          {language === 'ar' ? (
                            <>
                              <li>اذهب إلى <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">منصة Firebase Console</a> واضغط على <b>Add Project</b> لإنشاء مشروع.</li>
                              <li>من القائمة الجانبية، اذهب إلى <b>Build > Authentication > Sign-in method</b> وقم بتفعيل خيار <b>Phone</b>.</li>
                              <li>اذهب إلى إعدادات المشروع (أيقونة الترس)، وفي قسم <b>Your Apps</b>، اضغط على رمز <b>{"Web (</>)"}</b> لتسجيل تطبيق جديد.</li>
                              <li>انسخ كود الإعداد (كائن <code>firebaseConfig</code> بصيغة JSON) والصقه بالكامل في المربع أدناه.</li>
                            </>
                          ) : (
                            <>
                              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Firebase Console</a> and click <b>Add Project</b>.</li>
                              <li>Navigate to <b>Build > Authentication > Sign-in method</b> and enable the <b>Phone</b> sign-in provider.</li>
                              <li>Go to Project Settings (Gear icon), under <b>Your Apps</b> click on the <b>{"Web (</>)"}</b> icon to register your app.</li>
                              <li>Copy the <code>firebaseConfig</code> JSON object and paste it below.</li>
                            </>
                          )}
                        </ol>
                      </div>
                      <label className="text-sm font-bold text-foreground/90 block">{t("settingsSecurityFirebaseConfig")}</label>
                      <textarea
                        required={securityEnableFirebaseOtp}
                        placeholder={`مثال:\n{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        value={securityFirebaseConfigJson}
                        onChange={(e) => setSecurityFirebaseConfigJson(e.target.value)}
                        className="flex min-h-[140px] w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground font-outfit focus-visible:outline-none focus:ring-1 focus:ring-primary/50 text-left"
                        dir="ltr"
                      />
                      <p className="text-[10px] text-muted-foreground">{t("settingsSecurityFirebaseConfigDesc")}</p>
                    </div>
                  )}

                  {/* Maximum Orders Limit */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-border bg-card/40 gap-4 transition-all hover:bg-muted/10">
                    <div className="space-y-1 text-right flex-grow">
                      <span className="text-sm font-bold block text-foreground">{t("settingsSecurityMaxOrders")}</span>
                      <span className="text-xs text-muted-foreground block leading-relaxed">
                        {t("settingsSecurityMaxOrdersDesc")}
                      </span>
                    </div>
                    <div className="w-full sm:w-28">
                      <Input
                        type="number"
                        min="0"
                        required
                        value={securityMaxOrdersPerDay}
                        onChange={(e) => setSecurityMaxOrdersPerDay(e.target.value)}
                        className="text-center font-outfit h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Block Non-Algerian IPs Toggle */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card/40 transition-all hover:bg-muted/10">
                    <div className="space-y-1 text-right pl-4">
                      <span className="text-sm font-bold block text-foreground">{t("settingsSecurityBlockIps")}</span>
                      <span className="text-xs text-muted-foreground block leading-relaxed">
                        {t("settingsSecurityBlockIpsDesc")}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={securityBlockNonAlgerianIps}
                        onChange={(e) => setSecurityBlockNonAlgerianIps(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab: Storefront Customization */}
            {activeTab === "storefront" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Card className="border-border bg-card/60 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">
                  <CardHeader className="border-b border-border p-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                      <Palette className="h-5 w-5 text-amber-400" /> {t("settingsStorefrontCardTitle")}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t("settingsStorefrontCardDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    
                    {/* Announcement text & color */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl border border-border bg-card/40">
                      <div className="md:col-span-2 space-y-1.5 text-right">
                        <label className="text-sm font-bold text-foreground/90">{t("settingsStorefrontAnnounceText")}</label>
                        <Input
                          required
                          placeholder="مثال: الدفع عند الاستلام في 58 ولاية!"
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          className="ps-3 text-start h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-sm font-bold text-foreground/90">{t("settingsStorefrontAnnounceBg")}</label>
                        <div className="flex gap-2">
                          <Input
                            required
                            type="color"
                            value={announcementBgColor}
                            onChange={(e) => setAnnouncementBgColor(e.target.value)}
                            className="h-12 w-14 p-1.5 rounded-xl cursor-pointer"
                          />
                          <Input
                            required
                            type="text"
                            value={announcementBgColor}
                            onChange={(e) => setAnnouncementBgColor(e.target.value)}
                            className="pr-3 font-mono text-xs flex-grow h-12 rounded-xl text-center focus:ring-primary/20 focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Floating WhatsApp Toggle */}
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card/40 transition-all hover:bg-muted/10">
                      <div className="space-y-1 text-right pl-4">
                        <span className="text-sm font-bold block text-foreground">تفعيل زر WhatsApp العائم</span>
                        <span className="text-xs text-muted-foreground block leading-relaxed">
                          عرض أيقونة WhatsApp عائمة باستمرار في أسفل واجهة المتجر لتشجيع العميل على التواصل المباشر.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={whatsappFloatingButton}
                          onChange={(e) => setWhatsappFloatingButton(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Trust Badges Customize */}
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h4 className="text-md font-bold text-right text-foreground/90">تعديل نصوص بطاقات الثقة والضمانات</h4>
                      <p className="text-xs text-muted-foreground text-right leading-relaxed mb-4">
                        قم بتعديل العناوين والشروح للبطاقات الثلاث المخصصة لعرض الضمانات في متجرك.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Badge 1 */}
                        <div className="p-5 rounded-2xl border border-border bg-muted/15 space-y-4 text-right">
                          <span className="text-xs font-bold text-primary block border-b border-border pb-2">{t("settingsStorefrontBadge1CardTitle")}</span>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeTitleLabel")}</label>
                            <Input
                              required
                              value={badge1Title}
                              onChange={(e) => setBadge1Title(e.target.value)}
                              className="ps-3 text-start text-xs h-10 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeDescLabel")}</label>
                            <textarea
                              required
                              value={badge1Desc}
                              onChange={(e) => setBadge1Desc(e.target.value)}
                              className="flex min-h-[70px] w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
                            />
                          </div>
                        </div>

                        {/* Badge 2 */}
                        <div className="p-5 rounded-2xl border border-border bg-muted/15 space-y-4 text-right">
                          <span className="text-xs font-bold text-primary block border-b border-border pb-2">{t("settingsStorefrontBadge2CardTitle")}</span>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeTitleLabel")}</label>
                            <Input
                              required
                              value={badge2Title}
                              onChange={(e) => setBadge2Title(e.target.value)}
                              className="ps-3 text-start text-xs h-10 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeDescLabel")}</label>
                            <textarea
                              required
                              value={badge2Desc}
                              onChange={(e) => setBadge2Desc(e.target.value)}
                              className="flex min-h-[70px] w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
                            />
                          </div>
                        </div>

                        {/* Badge 3 */}
                        <div className="p-5 rounded-2xl border border-border bg-muted/15 space-y-4 text-right">
                          <span className="text-xs font-bold text-primary block border-b border-border pb-2">{t("settingsStorefrontBadge3CardTitle")}</span>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeTitleLabel")}</label>
                            <Input
                              required
                              value={badge3Title}
                              onChange={(e) => setBadge3Title(e.target.value)}
                              className="ps-3 text-start text-xs h-10 rounded-lg"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">{t("settingsStorefrontBadgeDescLabel")}</label>
                            <textarea
                              required
                              value={badge3Desc}
                              onChange={(e) => setBadge3Desc(e.target.value)}
                              className="flex min-h-[70px] w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Theme Mockup Preview */}
                <div className="rounded-3xl border border-border bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent p-6 space-y-4">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">{t("settingsStorefrontMockupTitle")}</span>
                  
                  {/* Mock Announcement */}
                  <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-muted/15">
                    <div 
                      className="text-center py-2.5 text-xs font-bold transition-all text-white"
                      style={{ backgroundColor: announcementBgColor }}
                    >
                      {announcementText || "نص الإعلان سيظهر هنا"}
                    </div>

                    {/* Mock Badges Grid */}
                    <div className="p-6 grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border">
                        <span className="text-base">🚚</span>
                        <h5 className="text-[10px] font-bold text-foreground truncate">{badge1Title}</h5>
                        <p className="text-[8px] text-muted-foreground line-clamp-2 leading-relaxed">{badge1Desc}</p>
                      </div>
                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border">
                        <span className="text-base">💵</span>
                        <h5 className="text-[10px] font-bold text-foreground truncate">{badge2Title}</h5>
                        <p className="text-[8px] text-muted-foreground line-clamp-2 leading-relaxed">{badge2Desc}</p>
                      </div>
                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border">
                        <span className="text-base">📞</span>
                        <h5 className="text-[10px] font-bold text-foreground truncate">{badge3Title}</h5>
                        <p className="text-[8px] text-muted-foreground line-clamp-2 leading-relaxed">{badge3Desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global luxury Save Settings button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading} 
                variant="glow" 
                className="flex items-center gap-2 h-12 px-8 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(79,70,229,0.25)]"
              >
                <Save className="h-5 w-5" /> 
                {loading ? t("settingsSavingBtn") : t("settingsSaveBtn")}
              </Button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  );
}
