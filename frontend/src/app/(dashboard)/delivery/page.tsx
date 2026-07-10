"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";
import {
  Truck, AlertCircle, Save, Search,
  MapPin, Check, Loader2,
  RefreshCw, DollarSign, ChevronUp, ChevronDown,
  Plus, X, ArrowLeft, Wifi, WifiOff, Trash2, Eye, EyeOff, Link2,
} from "lucide-react";

/* ─── Interfaces ───────────────────────────────────────────────────────────── */

interface WilayaPricing {
  id: string;
  code: number;
  name_ar: string;
  name_fr: string;
  home_price: number;
  desk_price: number;
  is_active: boolean;
}

interface DeliveryCompany {
  id: string;
  name: string;
  display_name: string;
  logo: string;
  is_active: boolean;
  supports_tracking: boolean;
}

interface DeliveryConfig {
  id: string;
  company: string;
  company_name: string;
  company_logo: string;
  api_key: string;
  api_secret: string;
  api_id: string;
  is_active: boolean;
  is_default: boolean;
  webhook_url: string;
}

/* ─── Company field definitions ────────────────────────────────────────────── */

interface FieldDef {
  key: string;
  label: string;
  labelAr: string;
  placeholder: string;
  type: "text" | "password";
  required: boolean;
}

const COMPANY_FIELDS: Record<string, FieldDef[]> = {
  yalidine: [
    { key: "api_id", label: "API ID", labelAr: "معرف API", placeholder: "Your Yalidine API ID", type: "text", required: true },
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Yalidine API Token", type: "password", required: true },
  ],
  noest: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Noest/Ecotrack API Token", type: "password", required: true },
    { key: "api_id", label: "User GUID", labelAr: "معرف المستخدم", placeholder: "Your Noest User GUID", type: "text", required: true },
  ],
  zr_express: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your ZR Express API Token", type: "password", required: true },
  ],
  maystro_delivery: [
    { key: "api_key", label: "API Key", labelAr: "مفتاح API", placeholder: "Your Maystro API Key", type: "password", required: true },
    { key: "api_secret", label: "API Secret", labelAr: "سر API", placeholder: "Your Maystro API Secret", type: "password", required: false },
  ],
  dhd: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your DHD Token", type: "password", required: true },
  ],
  guepex: [
    { key: "api_key", label: "API Key", labelAr: "مفتاح API", placeholder: "Your Guepex API Key", type: "password", required: true },
    { key: "api_secret", label: "API Secret", labelAr: "سر API", placeholder: "Your Guepex Secret", type: "password", required: false },
  ],
  yaliteck: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Yaliteck Token", type: "password", required: true },
  ],
  flash_delivery: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Flash Delivery Token", type: "password", required: true },
  ],
  ecom_delivery: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Ecom Delivery Token", type: "password", required: true },
  ],
  ecolog: [
    { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Ecolog Token", type: "password", required: true },
  ],
  ems: [
    { key: "api_key", label: "Tracking Code", labelAr: "رمز التتبع", placeholder: "Your EMS Account ID", type: "text", required: false },
  ],
};

const DEFAULT_FIELDS: FieldDef[] = [
  { key: "api_key", label: "API Key", labelAr: "مفتاح API", placeholder: "API Key", type: "password", required: true },
];

/* ─── Company SVG logos (inline) ───────────────────────────────────────────── */

const COMPANY_COLORS: Record<string, string> = {
  yalidine: "from-yellow-500 to-amber-600",
  noest: "from-blue-500 to-cyan-600",
  zr_express: "from-emerald-500 to-green-600",
  maystro_delivery: "from-purple-500 to-violet-600",
  dhd: "from-orange-500 to-red-500",
  guepex: "from-sky-500 to-blue-600",
  yaliteck: "from-teal-500 to-emerald-600",
  flash_delivery: "from-rose-500 to-pink-600",
  ecom_delivery: "from-indigo-500 to-purple-600",
  ecolog: "from-lime-500 to-green-600",
  ems: "from-slate-500 to-gray-600",
};

function CompanyAvatar({ name, displayName, logo, size = "md" }: { name: string; displayName: string; logo?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" };
  const gradient = COMPANY_COLORS[name] || "from-slate-500 to-gray-600";

  if (logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center`}>
        <img src={logo} alt={displayName} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black flex-shrink-0 shadow-lg`}>
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function DeliveryDashboard() {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const storeId = selectedStore?.id;

  /* ─── Companies & configs state ──────────────────────────────────────────── */
  const [allCompanies, setAllCompanies] = useState<DeliveryCompany[]>([]);
  const [linkedConfigs, setLinkedConfigs] = useState<DeliveryConfig[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  /* ─── Add company flow ──────────────────────────────────────────────────── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<DeliveryCompany | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  /* ─── Pricing state ──────────────────────────────────────────────────────── */
  const [pricing, setPricing] = useState<WilayaPricing[]>([]);
  const [originalPricing, setOriginalPricing] = useState<WilayaPricing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingSuccess, setPricingSuccess] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [sortField, setSortField] = useState<"code" | "home_price" | "desk_price">("code");
  const [sortAsc, setSortAsc] = useState(true);
  const [bulkHome, setBulkHome] = useState("");
  const [bulkDesk, setBulkDesk] = useState("");

  /* ─── Load companies & configs ───────────────────────────────────────────── */
  const loadCompaniesAndConfigs = useCallback(async () => {
    if (!storeId) return;
    setCompaniesLoading(true);
    try {
      const [companiesRes, configsRes] = await Promise.all([
        api.get("/delivery/companies/"),
        api.get(`/delivery/${storeId}/configs/`),
      ]);
      const companyData: DeliveryCompany[] = Array.isArray(companiesRes.data) ? companiesRes.data : (companiesRes.data?.results || []);
      const configData: DeliveryConfig[] = Array.isArray(configsRes.data) ? configsRes.data : (configsRes.data?.results || []);

      setAllCompanies(companyData.filter((c) => c.name !== "manual"));
      setLinkedConfigs(configData);
    } catch {
      /* silent */
    } finally {
      setCompaniesLoading(false);
    }
  }, [storeId]);

  useEffect(() => { loadCompaniesAndConfigs(); }, [loadCompaniesAndConfigs]);

  /* ─── Derived: which companies are already linked ────────────────────────── */
  const linkedCompanyIds = useMemo(() => new Set(linkedConfigs.map((c) => c.company)), [linkedConfigs]);
  const activeConfigs = useMemo(() => linkedConfigs.filter((c) => c.is_active), [linkedConfigs]);
  const availableCompanies = useMemo(
    () => allCompanies.filter((c) => !linkedCompanyIds.has(c.id)),
    [allCompanies, linkedCompanyIds]
  );

  /* ─── Add company: open config form ──────────────────────────────────────── */
  const openCompanyConfig = (company: DeliveryCompany) => {
    setSelectedCompany(company);
    setFormValues({});
    setShowPasswords({});
    setTestResult(null);
    setTestingConnection(false);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedCompany(null);
    setFormValues({});
    setTestResult(null);
    setTestingConnection(false);
  };

  /* ─── Test connection ────────────────────────────────────────────────────── */
  const handleTestConnection = async () => {
    if (!storeId || !selectedCompany) return;
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.post(`/delivery/${storeId}/test-connection/`, {
        company_id: selectedCompany.id,
        ...formValues,
      });
      setTestResult({ success: res.data.success, message: res.data.message || res.data.error });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Connection test failed.";
      setTestResult({ success: false, message: errorMsg });
    } finally {
      setTestingConnection(false);
    }
  };

  /* ─── Save & link company ────────────────────────────────────────────────── */
  const handleSaveAndLink = async () => {
    if (!storeId || !selectedCompany) return;
    setSaving(true);
    try {
      await api.post(`/delivery/${storeId}/configs/`, {
        company: selectedCompany.id,
        api_key: formValues.api_key || "",
        api_secret: formValues.api_secret || "",
        api_id: formValues.api_id || "",
        is_active: true,
      });
      await loadCompaniesAndConfigs();
      closeModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.company?.[0] || "Failed to save configuration.";
      setTestResult({ success: false, message: typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg) });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Remove linked company ──────────────────────────────────────────────── */
  const handleRemoveConfig = async (configId: string) => {
    if (!storeId) return;
    try {
      await api.delete(`/delivery/${storeId}/configs/${configId}/`);
      await loadCompaniesAndConfigs();
    } catch { /* silent */ }
  };

  /* ─── Toggle active ──────────────────────────────────────────────────────── */
  const handleToggleActive = async (config: DeliveryConfig) => {
    if (!storeId) return;
    try {
      await api.patch(`/delivery/${storeId}/configs/${config.id}/`, {
        is_active: !config.is_active,
      });
      await loadCompaniesAndConfigs();
    } catch { /* silent */ }
  };

  /* ─── Pricing logic (same as before) ─────────────────────────────────────── */
  const loadPricing = useCallback(() => {
    if (!storeId) return;
    setPricingLoading(true);
    setPricingError("");
    api.get(`/delivery/${storeId}/pricing/`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const data: WilayaPricing[] = list.map((item: any) => ({
          id: item.id,
          code: item.wilaya_code ?? item.code ?? 0,
          name_ar: item.wilaya_name ?? item.name_ar ?? "",
          name_fr: item.wilaya_name_fr ?? item.name_fr ?? "",
          home_price: parseFloat(item.home_price) || 600,
          desk_price: parseFloat(item.desk_price) || 400,
          is_active: item.is_active !== false,
        }));
        data.sort((a, b) => a.code - b.code);
        setPricing(data);
        setOriginalPricing(JSON.parse(JSON.stringify(data)));
      })
      .catch(() => setPricingError(t("deliveryError")))
      .finally(() => setPricingLoading(false));
  }, [storeId, t]);

  useEffect(() => { loadPricing(); }, [storeId, loadPricing]);

  const hasChanges = useMemo(() => JSON.stringify(pricing) !== JSON.stringify(originalPricing), [pricing, originalPricing]);

  const filteredPricing = useMemo(() => {
    let rows = pricing;
    if (pricingSearch.trim()) {
      const q = pricingSearch.toLowerCase();
      rows = rows.filter((w) => w.name_ar.includes(q) || w.name_fr.toLowerCase().includes(q) || String(w.code).includes(q));
    }
    return [...rows].sort((a, b) => {
      const diff = sortField === "code" ? a.code - b.code : sortField === "home_price" ? a.home_price - b.home_price : a.desk_price - b.desk_price;
      return sortAsc ? diff : -diff;
    });
  }, [pricing, pricingSearch, sortField, sortAsc]);

  const stats = useMemo(() => ({
    total: pricing.length,
    active: pricing.filter((w) => w.is_active).length,
    avgHome: pricing.length ? Math.round(pricing.reduce((s, w) => s + w.home_price, 0) / pricing.length) : 0,
  }), [pricing]);

  const updatePrice = (id: string, field: "home_price" | "desk_price" | "is_active", value: number | boolean) => {
    setPricing((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  const applyBulkPrices = () => {
    setPricing((prev) => prev.map((w) => ({
      ...w,
      home_price: bulkHome ? parseFloat(bulkHome) : w.home_price,
      desk_price: bulkDesk ? parseFloat(bulkDesk) : w.desk_price,
    })));
    setBulkHome("");
    setBulkDesk("");
  };

  const applyCompanyDefaultPricingLocal = async (companyId: string, companyName: string) => {
    if (!storeId) return;
    setPricingLoading(true);
    setPricingSuccess("");
    setPricingError("");
    try {
      const res = await api.get(`/delivery/${storeId}/configs/${companyId}/fees/`);
      const apiPricing = res.data.pricing || [];
      const apiMap: Record<number, { home_price: number; desk_price: number }> = {};
      for (const item of apiPricing) apiMap[item.code] = { home_price: item.home_price, desk_price: item.desk_price };
      setPricing((prev) => prev.map((w) => {
        const match = apiMap[w.code];
        return match ? { ...w, home_price: match.home_price, desk_price: match.desk_price } : w;
      }));
      setPricingSuccess(isRtl ? `✅ تم تطبيق أسعار شحن ${companyName} في الجدول! (تذكر حفظ التغييرات)` : `✅ Applied ${companyName} default rates locally! (Remember to save changes)`);
      setTimeout(() => setPricingSuccess(""), 5000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || t("deliveryError");
      setPricingError(isRtl ? `❌ فشل تطبيق أسعار الشحن: ${errorMsg}` : `❌ Failed to apply default rates: ${errorMsg}`);
      setTimeout(() => setPricingError(""), 6000);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleSort = (field: "code" | "home_price" | "desk_price") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleSavePricing = async () => {
    if (!storeId) return;
    setPricingSaving(true);
    setPricingSuccess("");
    setPricingError("");
    try {
      await api.put(`/delivery/${storeId}/pricing/bulk/`, {
        pricing: pricing.map((w) => ({ id: w.id, home_price: w.home_price, desk_price: w.desk_price, is_active: w.is_active })),
      });
      setOriginalPricing(JSON.parse(JSON.stringify(pricing)));
      setPricingSuccess(`✅ ${t("deliverySuccess")}`);
      setTimeout(() => setPricingSuccess(""), 5000);
    } catch {
      setPricingError(t("deliveryError"));
    } finally {
      setPricingSaving(false);
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronUp className="h-3 w-3 opacity-20" />;

  const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="transition-all duration-200 hover:scale-110">
      <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${active ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );

const ECOTRACK_COMPANIES = [
  'noest', 'ecolog', 'guepex', 'gupex', 'dhd', 'yaliteck',
  '48hr_livraison', 'allo_livraison', 'anderson_delivery', 'areex', 'assil_delivery', 'baconsult',
  'colireli', 'colivraison_express', 'coyote_express', 'delivromail', 'dhd_express', 'distazero',
  'expedia_chrono', 'fretdirect', 'fz_delivery', 'golivri', 'hhd_express', 'imir', 'medexpress',
  'monohub', 'msm_go', 'navex_delivery', 'negmar_express', 'noest_express', 'om_express',
  'ontime_ecotrack', 'packers', 'pdex', 'prest', 'rb_livraison', 'rex_livraison', 'rocket_delivery',
  'salva_delivery', 'samex_delivery', 'speed_delivery', 'swift_express', 'tsl_express',
  'ultra_express', 'univer_delivery', 'worldexpress', 'zvit_express'
];

  /* ─── Get fields for a company ───────────────────────────────────────────── */
  const getFields = (companyName: string) => {
    if (ECOTRACK_COMPANIES.includes(companyName)) {
      return [
        { key: "api_key", label: "API Token", labelAr: "رمز API", placeholder: "Your Ecotrack API Token", type: "password", required: true },
        { key: "api_id", label: "User GUID", labelAr: "معرف المستخدم", placeholder: "Your Ecotrack User GUID", type: "text", required: true },
      ];
    }
    return COMPANY_FIELDS[companyName] || DEFAULT_FIELDS;
  };

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /* RENDER                                                                     */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} dir={isRtl ? "rtl" : "ltr"}>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            {t("shippingRates")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("deliveryDesc")}</p>
        </div>
        {!storeId && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{t("deliveryNoStore")}</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: DELIVERY COMPANIES                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{isRtl ? "شركات التوصيل" : "Delivery Companies"}</h2>
          </div>
        </div>

        {companiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeConfigs.length === 0 && !showAddModal ? (
          /* ─── Empty state ──────────────────────────────────────────────── */
          <Card className="border-border dark:border-white/5 bg-card/40 dark:bg-white/[0.02] backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Truck className="h-10 w-10 text-primary/60" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold">{isRtl ? "لا توجد شركات توصيل مرتبطة" : "No delivery companies linked"}</h3>
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? "اربط شركة توصيل لبدء شحن الطلبات تلقائياً. يمكنك إضافة Yalidine, Noest, ZR Express والمزيد."
                    : "Link a delivery company to start shipping orders automatically. Add Yalidine, Noest, ZR Express, and more."}
                </p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 h-auto text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30"
              >
                <Plus className="h-5 w-5" />
                {isRtl ? "إضافة شركة توصيل" : "Add Delivery Company"}
              </Button>
            </div>
          </Card>
        ) : (
          /* ─── Linked companies list ────────────────────────────────────── */
          <div className="space-y-3">
            <div className="grid gap-3">
              {linkedConfigs.map((config) => {
                const company = allCompanies.find((c) => c.id === config.company);
                if (!company) return null;
                return (
                  <Card key={config.id} className={`border-border dark:border-white/5 bg-card/60 dark:bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:shadow-md ${!config.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between p-4 gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <CompanyAvatar name={company.name} displayName={company.display_name} logo={config.company_logo} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground truncate">{company.display_name}</h3>
                            {config.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Wifi className="h-2.5 w-2.5" /> {isRtl ? "متصل" : "Connected"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                <WifiOff className="h-2.5 w-2.5" /> {isRtl ? "معطل" : "Disabled"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {config.api_key ? `API Key: ${"•".repeat(8)}${config.api_key.slice(-4)}` : isRtl ? "لم يتم تعيين بيانات الاعتماد" : "No credentials set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ToggleSwitch active={config.is_active} onToggle={() => handleToggleActive(config)} />
                        <button
                          onClick={() => handleRemoveConfig(config.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          title={isRtl ? "إزالة" : "Remove"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Add more button */}
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="w-full border-dashed border-2 border-border dark:border-white/10 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 text-muted-foreground hover:text-primary gap-2 py-3 h-auto transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              {isRtl ? "إضافة شركة توصيل" : "Add Delivery Company"}
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ADD COMPANY MODAL (overlay)                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-background border border-border dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedCompany ? (
              /* ─── Company selection grid ─────────────────────────────────── */
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    {isRtl ? "اختر شركة توصيل" : "Choose a Delivery Company"}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                {availableCompanies.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium">{isRtl ? "تم ربط جميع الشركات المتاحة" : "All available companies are already linked!"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => openCompanyConfig(company)}
                        className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border dark:border-white/5 bg-card/40 dark:bg-white/[0.02] hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                      >
                        <CompanyAvatar name={company.name} displayName={company.display_name} logo={company.logo} size="lg" />
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{company.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ─── Company config form ────────────────────────────────────── */
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCompany(null)} className="p-1.5 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
                      <ArrowLeft className={`h-5 w-5 text-muted-foreground ${isRtl ? "rotate-180" : ""}`} />
                    </button>
                    <CompanyAvatar name={selectedCompany.name} displayName={selectedCompany.display_name} logo={selectedCompany.logo} size="sm" />
                    <h2 className="text-lg font-bold">{selectedCompany.display_name}</h2>
                  </div>
                  <button onClick={closeModal} className="p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? `أدخل بيانات الاعتماد الخاصة بك لـ ${selectedCompany.display_name} لربطها بمتجرك.`
                    : `Enter your ${selectedCompany.display_name} credentials to link it to your store.`}
                </p>

                {/* Form fields */}
                <div className="space-y-4">
                  {getFields(selectedCompany.name).map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-sm font-semibold flex items-center gap-1">
                        {isRtl ? field.labelAr : field.label}
                        {field.required && <span className="text-red-400">*</span>}
                      </label>
                      <div className="relative">
                        <Input
                          type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
                          placeholder={field.placeholder}
                          value={formValues[field.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [field.key]: e.target.value }))}
                          className={`border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground placeholder:text-muted-foreground ${field.type === "password" ? (isRtl ? "pl-10" : "pr-10") : ""}`}
                        />
                        {field.type === "password" && (
                          <button
                            type="button"
                            onClick={() => setShowPasswords((p) => ({ ...p, [field.key]: !p[field.key] }))}
                            className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3" : "right-3"} text-muted-foreground hover:text-foreground transition-colors`}
                          >
                            {showPasswords[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Test result */}
                {testResult && (
                  <div className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
                    testResult.success
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}>
                    {testResult.success ? <Check className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                    <span className="break-all">{testResult.message}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="flex-1 border-border dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 gap-2 h-11"
                  >
                    {testingConnection ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {isRtl ? "جاري الاختبار..." : "Testing..."}</>
                    ) : (
                      <><Wifi className="h-4 w-4" /> {isRtl ? "اختبار الاتصال" : "Test Connection"}</>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveAndLink}
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-11 shadow-lg shadow-primary/20"
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {isRtl ? "جاري الحفظ..." : "Saving..."}</>
                    ) : (
                      <><Check className="h-4 w-4" /> {isRtl ? "حفظ وربط" : "Save & Link"}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: PRICING TABLE                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        {/* Stats cards */}
        {pricing.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: t("deliveryTotalWilayas"), value: `${stats.total}`, icon: MapPin, color: "text-primary" },
              { label: t("deliveryActiveWilayas"), value: `${stats.active}`, icon: Truck, color: "text-emerald-400" },
              { label: t("deliveryAvgHomePrice"), value: `${stats.avgHome} DA`, icon: DollarSign, color: "text-accent" },
            ].map((s) => (
              <div key={s.label} className="border border-border dark:border-white/5 bg-card/60 dark:bg-white/[0.03] rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/40 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-lg font-black font-outfit">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Apply Default Rates */}
        {pricing.length > 0 && activeConfigs.length > 0 && (
          <div className="border border-border dark:border-white/5 bg-card/60 dark:bg-white/[0.03] rounded-xl p-5 space-y-3">
            <div className={`flex items-center gap-2 text-xs font-bold text-muted-foreground ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>{isRtl ? "تطبيق أسعار الشحن الافتراضية للشركات" : "Apply Default Rates for Logistics Couriers"}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {activeConfigs.map((cfg) => {
                const company = allCompanies.find((c) => c.id === cfg.company);
                if (!company) return null;
                return (
                  <Button
                    key={cfg.id}
                    type="button"
                    variant="outline"
                    onClick={() => applyCompanyDefaultPricingLocal(cfg.id, company.display_name)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted dark:bg-white/5 dark:hover:bg-white/10 text-foreground transition-all duration-200 shadow-sm hover:scale-[1.02] h-auto"
                  >
                    <CompanyAvatar name={company.name} displayName={company.display_name} logo={cfg.company_logo} size="sm" />
                    <span>{company.display_name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Banners */}
        {pricingSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <Check className="h-5 w-5 flex-shrink-0" /> {pricingSuccess}
          </div>
        )}
        {pricingError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {pricingError}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-1 w-full">
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("deliverySearchLabel")}</label>
            <div className="relative">
              <Search className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={t("deliverySearchPlaceholder")}
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                className={`${isRtl ? "pr-10 text-right" : "pl-10 text-left"} border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white placeholder:text-muted-foreground`}
              />
            </div>
          </div>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("deliveryBulkHome")}</label>
              <Input type="number" placeholder="e.g. 600" value={bulkHome} onChange={(e) => setBulkHome(e.target.value)}
                className="w-28 border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("deliveryBulkDesk")}</label>
              <Input type="number" placeholder="e.g. 400" value={bulkDesk} onChange={(e) => setBulkDesk(e.target.value)}
                className="w-28 border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground" />
            </div>
            <Button variant="outline" onClick={applyBulkPrices} disabled={!bulkHome && !bulkDesk}
              className="border-border dark:border-white/10 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 gap-2">
              <RefreshCw className="h-4 w-4" /> {t("deliveryBulkApply")}
            </Button>
          </div>
        </div>

        {/* Table */}
        {pricingLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">{t("deliveryLoadingRates")}</span>
          </div>
        ) : !storeId ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <MapPin className="h-10 w-10 opacity-30" />
            <span className="text-sm">{t("deliverySelectStorePrompt")}</span>
          </div>
        ) : (
          <Card className="border-border dark:border-white/5 bg-card/40 dark:bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-white/10 bg-muted/20 dark:bg-white/[0.03]">
                    <th className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none w-16`} onClick={() => handleSort("code")}>
                      <div className="flex items-center gap-1">{t("deliveryColCode")} <SortIcon field="code" /></div>
                    </th>
                    <th className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground`}>{t("deliveryColWilayaAr")}</th>
                    <th className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground hidden lg:table-cell`}>{t("deliveryColWilayaFr")}</th>
                    <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none" onClick={() => handleSort("home_price")}>
                      <div className="flex items-center justify-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t("deliveryColHomePrice")} <SortIcon field="home_price" /></div>
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none" onClick={() => handleSort("desk_price")}>
                      <div className="flex items-center justify-center gap-1"><Truck className="h-3.5 w-3.5" /> {t("deliveryColDeskPrice")} <SortIcon field="desk_price" /></div>
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground w-24">{t("deliveryColStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPricing.map((w, idx) => (
                    <tr key={w.id} className={`border-b border-border dark:border-white/5 transition-colors hover:bg-muted/10 dark:hover:bg-white/[0.04] ${!w.is_active ? "opacity-40" : ""} ${idx % 2 === 0 ? "" : "bg-muted/5 dark:bg-white/[0.01]"}`}>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center justify-center h-7 w-9 rounded-lg bg-primary/10 text-primary font-bold text-xs font-outfit">
                          {String(w.code).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground dark:text-white">{w.name_ar}</td>
                      <td className="py-2.5 px-4 text-muted-foreground hidden lg:table-cell font-outfit text-xs">{w.name_fr}</td>
                      <td className="py-2.5 px-4">
                        <Input type="number" min="0" value={w.home_price}
                          onChange={(e) => updatePrice(w.id, "home_price", parseFloat(e.target.value) || 0)}
                          className="w-24 mx-auto text-center border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit h-8 text-xs focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
                      </td>
                      <td className="py-2.5 px-4">
                        <Input type="number" min="0" value={w.desk_price}
                          onChange={(e) => updatePrice(w.id, "desk_price", parseFloat(e.target.value) || 0)}
                          className="w-24 mx-auto text-center border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit h-8 text-xs focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <ToggleSwitch active={w.is_active} onToggle={() => updatePrice(w.id, "is_active", !w.is_active)} />
                      </td>
                    </tr>
                  ))}
                  {filteredPricing.length === 0 && !pricingLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        {t("deliveryNoWilayasFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Sticky Save Bar */}
        {pricing.length > 0 && (
          <div className={`flex justify-between items-center sticky bottom-0 py-4 px-1 bg-background/95 backdrop-blur-md border-t border-border dark:border-white/5 -mx-1 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{stats.total} {t("deliveryTotalWilayas")}</span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-400">{stats.active} {t("deliveryActive")}</span>
              {hasChanges && (
                <>
                  <span className="text-amber-500">•</span>
                  <span className="text-amber-400 font-semibold">{t("deliveryUnsavedChanges")}</span>
                </>
              )}
            </div>
            <Button onClick={handleSavePricing} disabled={pricingSaving || !hasChanges}
              className="flex items-center gap-2 font-bold px-8 bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20">
              {pricingSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("deliverySaving")}</>
              ) : (
                <><Save className="h-4 w-4" /> {t("deliverySaveBtn")}</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
