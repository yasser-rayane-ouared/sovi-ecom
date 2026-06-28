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
} from "lucide-react";

interface WilayaPricing {
  id: string;
  code: number;
  name_ar: string;
  name_fr: string;
  home_price: number;
  desk_price: number;
  is_active: boolean;
}

export default function DeliveryDashboard() {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const storeId = selectedStore?.id;

  // ─── Pricing state ────────────────────────────────────────────────────────
  const [pricing, setPricing] = useState<WilayaPricing[]>([]);
  const [originalPricing, setOriginalPricing] = useState<WilayaPricing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingSuccess, setPricingSuccess] = useState("");
  const [pricingError, setPricingError] = useState("");
  const [sortField, setSortField] = useState<"code" | "home_price" | "desk_price">("code");
  const [sortAsc, setSortAsc] = useState(true);

  // ─── Delivery companies state ─────────────────────────────────────────────
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (!storeId) return;
    Promise.all([
      api.get("/delivery/companies/"),
      api.get(`/delivery/${storeId}/configs/`)
    ]).then(([companiesRes, configsRes]) => {
      const activeConfigCompanyIds = new Set<string>();
      const configData = Array.isArray(configsRes.data) ? configsRes.data : (configsRes.data?.results ?? []);
      for (const config of configData) {
        if (config.is_active) {
          activeConfigCompanyIds.add(config.company);
        }
      }
      
      const active = (companiesRes.data || []).filter(
        (c: any) => c.name !== "manual" && activeConfigCompanyIds.has(c.id)
      );
      setCompanies(active);
    }).catch(() => {});
  }, [storeId]);

  // ─── Bulk set ─────────────────────────────────────────────────────────────
  const [bulkHome, setBulkHome] = useState("");
  const [bulkDesk, setBulkDesk] = useState("");

  // ─── Load pricing ────────────────────────────────────────────────────────
  const loadPricing = useCallback(() => {
    if (!storeId) return;
    setPricingLoading(true);
    setPricingError("");
    api
      .get(`/delivery/${storeId}/pricing/`)
      .then((res) => {
        const data: WilayaPricing[] = (res.data || []).map((item: any) => ({
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

  useEffect(() => {
    loadPricing();
  }, [storeId, loadPricing]);

  // ─── Derived state ───────────────────────────────────────────────────────
  const hasChanges = useMemo(
    () => JSON.stringify(pricing) !== JSON.stringify(originalPricing),
    [pricing, originalPricing]
  );

  const filteredPricing = useMemo(() => {
    let rows = pricing;
    if (pricingSearch.trim()) {
      const q = pricingSearch.toLowerCase();
      rows = rows.filter(
        (w) => w.name_ar.includes(q) || w.name_fr.toLowerCase().includes(q) || String(w.code).includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const diff =
        sortField === "code"
          ? a.code - b.code
          : sortField === "home_price"
          ? a.home_price - b.home_price
          : a.desk_price - b.desk_price;
      return sortAsc ? diff : -diff;
    });
  }, [pricing, pricingSearch, sortField, sortAsc]);

  const stats = useMemo(() => ({
    total: pricing.length,
    active: pricing.filter((w) => w.is_active).length,
    avgHome: pricing.length ? Math.round(pricing.reduce((s, w) => s + w.home_price, 0) / pricing.length) : 0,
  }), [pricing]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const updatePrice = (id: string, field: "home_price" | "desk_price" | "is_active", value: number | boolean) => {
    setPricing((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  const applyBulkPrices = () => {
    setPricing((prev) =>
      prev.map((w) => ({
        ...w,
        home_price: bulkHome ? parseFloat(bulkHome) : w.home_price,
        desk_price: bulkDesk ? parseFloat(bulkDesk) : w.desk_price,
      }))
    );
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
      
      const apiPricingMap: Record<number, { home_price: number; desk_price: number }> = {};
      for (const item of apiPricing) {
        apiPricingMap[item.code] = {
          home_price: item.home_price,
          desk_price: item.desk_price,
        };
      }
      
      setPricing((prev) =>
        prev.map((w) => {
          const match = apiPricingMap[w.code];
          if (match) {
            return {
              ...w,
              home_price: match.home_price,
              desk_price: match.desk_price,
            };
          }
          return w;
        })
      );
      
      setPricingSuccess(isRtl ? `✅ تم تطبيق أسعار شحن ${companyName} في الجدول! (تذكر حفظ التغييرات)` : `✅ Applied ${companyName} default rates locally! (Remember to save changes)`);
      setTimeout(() => setPricingSuccess(""), 5000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || t("deliveryError") || "Failed to fetch default rates.";
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
        pricing: pricing.map((w) => ({
          id: w.id,
          home_price: w.home_price,
          desk_price: w.desk_price,
          is_active: w.is_active,
        })),
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
    sortField === field ? (
      sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : (
      <ChevronUp className="h-3 w-3 opacity-20" />
    );

  // ─── Toggle is_active via switch helper ────────────────────────────────────
  const ToggleIcon = ({ active }: { active: boolean }) => (
    <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${active ? "translate-x-5" : "translate-x-0"}`} />
    </div>
  );

  return (
    <div 
      className={`space-y-6 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            {t("shippingRates")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("deliveryDesc")}
          </p>
        </div>
        {!storeId && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{t("deliveryNoStore")}</span>
          </div>
        )}
      </div>

      {/* Pricing Section */}
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
        {pricing.length > 0 && companies.length > 0 && (
          <div className="border border-border dark:border-white/5 bg-card/60 dark:bg-white/[0.03] rounded-xl p-5 space-y-3">
            <div className={`flex items-center gap-2 text-xs font-bold text-muted-foreground ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>{isRtl ? "تطبيق أسعار الشحن الافتراضية للشركات" : "Apply Default Rates for Logistics Couriers"}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {companies.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  variant="outline"
                  onClick={() => applyCompanyDefaultPricingLocal(c.id, c.display_name)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted dark:bg-white/5 dark:hover:bg-white/10 text-foreground transition-all duration-200 shadow-sm hover:scale-[1.02] h-auto"
                >
                  {c.logo ? (
                    <img src={c.logo} alt={c.display_name} className="h-4 w-4 object-cover rounded-md" />
                  ) : (
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{c.display_name}</span>
                </Button>
              ))}
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
          {/* Search */}
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

          {/* Bulk Set */}
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("deliveryBulkHome")}</label>
              <Input
                type="number"
                placeholder="e.g. 600"
                value={bulkHome}
                onChange={(e) => setBulkHome(e.target.value)}
                className="w-28 border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("deliveryBulkDesk")}</label>
              <Input
                type="number"
                placeholder="e.g. 400"
                value={bulkDesk}
                onChange={(e) => setBulkDesk(e.target.value)}
                className="w-28 border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground"
              />
            </div>
            <Button
              variant="outline"
              onClick={applyBulkPrices}
              disabled={!bulkHome && !bulkDesk}
              className="border-border dark:border-white/10 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 gap-2"
            >
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
                    <th
                      className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none w-16`}
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                         {t("deliveryColCode")} <SortIcon field="code" />
                      </div>
                    </th>
                    <th className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground`}>{t("deliveryColWilayaAr")}</th>
                    <th className={`${isRtl ? "text-right" : "text-left"} py-3.5 px-4 font-semibold text-muted-foreground hidden lg:table-cell`}>{t("deliveryColWilayaFr")}</th>
                    <th
                      className="text-center py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none"
                      onClick={() => handleSort("home_price")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t("deliveryColHomePrice")} <SortIcon field="home_price" />
                      </div>
                    </th>
                    <th
                      className="text-center py-3.5 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground dark:hover:text-white transition-colors select-none"
                      onClick={() => handleSort("desk_price")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> {t("deliveryColDeskPrice")} <SortIcon field="desk_price" />
                      </div>
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground w-24">{t("deliveryColStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPricing.map((w, idx) => (
                    <tr
                      key={w.id}
                      className={`border-b border-border dark:border-white/5 transition-colors hover:bg-muted/10 dark:hover:bg-white/[0.04] ${
                        !w.is_active ? "opacity-40" : ""
                      } ${idx % 2 === 0 ? "" : "bg-muted/5 dark:bg-white/[0.01]"}`}
                    >
                      {/* Code badge */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center justify-center h-7 w-9 rounded-lg bg-primary/10 text-primary font-bold text-xs font-outfit">
                          {String(w.code).padStart(2, "0")}
                        </span>
                      </td>

                      {/* Arabic name */}
                      <td className={`py-2.5 px-4 font-semibold text-foreground dark:text-white`}>{w.name_ar}</td>

                      {/* French name */}
                      <td className={`py-2.5 px-4 text-muted-foreground hidden lg:table-cell font-outfit text-xs`}>{w.name_fr}</td>

                      {/* Home price input */}
                      <td className="py-2.5 px-4">
                        <Input
                          type="number"
                          min="0"
                          value={w.home_price}
                          onChange={(e) => updatePrice(w.id, "home_price", parseFloat(e.target.value) || 0)}
                          className="w-24 mx-auto text-center border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit h-8 text-xs focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </td>

                      {/* Desk price input */}
                      <td className="py-2.5 px-4">
                        <Input
                          type="number"
                          min="0"
                          value={w.desk_price}
                          onChange={(e) => updatePrice(w.id, "desk_price", parseFloat(e.target.value) || 0)}
                          className="w-24 mx-auto text-center border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit h-8 text-xs focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                        />
                      </td>

                      {/* Active toggle */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => updatePrice(w.id, "is_active", !w.is_active)}
                          className="transition-all duration-200 hover:scale-110"
                          title={w.is_active ? "Disable" : "Enable"}
                        >
                          <ToggleIcon active={w.is_active} />
                        </button>
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
            <Button
              onClick={handleSavePricing}
              disabled={pricingSaving || !hasChanges}
              className="flex items-center gap-2 font-bold px-8 bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
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
