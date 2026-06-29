"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { useLanguageStore } from "../../../../stores/language";
import { useAuthStore } from "../../../../stores/auth";
import { getRootDomain } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { 
  Users, Store, AlertCircle, ShieldAlert, Sparkles, 
  CheckCircle2, Search, Calendar, Coins, Loader2, Play, Ban
} from "lucide-react";

export default function AdminAccountsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, isRtl } = useLanguageStore();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // System settings state
  const [usdtRate, setUsdtRate] = useState<string>("260");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user && !user.is_superadmin) {
      router.push("/overview");
    }
  }, [user, router]);

  const fetchAccountsAndStats = async () => {
    setLoading(true);
    try {
      const [accountsRes, statsRes] = await Promise.all([
        api.get("/subscriptions/admin/accounts/"),
        api.get("/subscriptions/admin/stats/")
      ]);
      setAccounts(accountsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error(err);
      setError(t("adminAccountsLoadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get("/admin-panel/settings/usdt_exchange_rate/");
      setUsdtRate(res.data.value || "260");
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_superadmin) {
      fetchAccountsAndStats();
      fetchSettings();
    }
  }, [user]);

  const handleToggleSuspend = async (storeId: string) => {
    setActionLoadingId(storeId);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/admin-panel/stores/${storeId}/suspend/`);
      const updated = res.data;
      setSuccess(
        updated.is_suspended 
          ? t("adminAccountsSuccessSuspend").replace("{name}", updated.name) 
          : t("adminAccountsSuccessUnsuspend").replace("{name}", updated.name)
      );
      fetchAccountsAndStats();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || t("adminAccountsToggleError", "فشل إيقاف/تنشيط المتجر."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveUsdtRate = async () => {
    setSavingSettings(true);
    setError("");
    setSuccess("");
    try {
      await api.patch("/admin-panel/settings/usdt_exchange_rate/", {
        value: usdtRate
      });
      setSuccess(isRtl ? "تم تحديث سعر صرف USDT بنجاح." : "USDT exchange rate updated successfully.");
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(isRtl ? "فشل حفظ سعر صرف USDT." : "Failed to update USDT exchange rate.");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => 
    acc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user?.is_superadmin || (loading && accounts.length === 0)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t("adminAccountsLoadingTitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("adminAccountsTitle")}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("adminAccountsDesc")}</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-muted-foreground">{t("adminAccountsStatRevenue")}</CardDescription>
              <CardTitle className="text-2xl font-black text-primary">{Math.round(stats.total_revenue).toLocaleString()} دج</CardTitle>
            </CardHeader>
            <CardContent className={`text-[10px] text-muted-foreground flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
              <span>{t("adminAccountsStatRevenueSub")}</span>
              <Coins className="h-4 w-4 text-primary" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-muted-foreground">{t("adminAccountsStatStores")}</CardDescription>
              <CardTitle className="text-2xl font-black">{stats.total_stores}</CardTitle>
            </CardHeader>
            <CardContent className={`text-[10px] text-muted-foreground flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
              <span>{t("adminAccountsStatStoresSub")}</span>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-muted-foreground">{t("adminAccountsStatActiveSubs")}</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-400">{stats.active_subscriptions}</CardTitle>
            </CardHeader>
            <CardContent className={`text-[10px] text-muted-foreground flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
              <span>{t("adminAccountsStatActiveSubsSub")}</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-muted-foreground">{t("adminAccountsStatPending")}</CardDescription>
              <CardTitle className={`text-2xl font-black ${stats.pending_receipts > 0 ? "text-amber-400" : ""}`}>
                {stats.pending_receipts}
              </CardTitle>
            </CardHeader>
            <CardContent className={`text-[10px] text-muted-foreground flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
              <span>{t("adminAccountsStatPendingSub")}</span>
              <AlertCircle className={`h-4 w-4 ${stats.pending_receipts > 0 ? "text-amber-400 animate-pulse" : ""}`} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* USDT Exchange Rate Settings Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card/60 backdrop-blur-md md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              {isRtl ? "سعر صرف RedotPay (USDT)" : "RedotPay Exchange Rate (USDT)"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isRtl 
                ? "تعديل سعر صرف 1 USDT مقابل الدينار الجزائري للدفع بـ RedotPay" 
                : "Modify the 1 USDT exchange rate in Algerian Dinars (DZD) for RedotPay payments"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={usdtRate}
                  onChange={(e) => setUsdtRate(e.target.value)}
                  placeholder="260"
                  className="font-outfit text-start pr-12 text-sm"
                  dir="ltr"
                />
                <div className={`absolute top-2.5 text-xs font-bold text-muted-foreground ${isRtl ? "left-3" : "right-3"}`}>
                  DA
                </div>
              </div>
              <Button
                onClick={handleSaveUsdtRate}
                disabled={savingSettings || settingsLoading}
                size="sm"
                className="shrink-0"
              >
                {savingSettings ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  isRtl ? "حفظ السعر" : "Save Rate"
                )}
              </Button>
            </div>
            {settingsLoading && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isRtl ? "جاري تحميل سعر الصرف الحالي..." : "Loading current exchange rate..."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className={`relative w-full md:w-80 ${isRtl ? "mr-auto" : "ml-auto"}`}>
        <Search className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("adminAccountsSearchPl")}
          className={`text-start ${isRtl ? "pr-10" : "pl-10"}`}
        />
      </div>

      {/* Stores List Table */}
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-0">
          {filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminAccountsColStore")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminAccountsColOwner")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminAccountsColPlan")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminAccountsColExpiry")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminAccountsColStatus")}</th>
                    <th className="p-4 text-center">{t("adminAccountsColActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => {
                    const hasSub = acc.active_limits?.has_active_subscription;
                    const isSuspended = acc.is_suspended;
                    
                    return (
                      <tr key={acc.store_id} className="border-b border-border/50 hover:bg-muted/10 transition-colors duration-150">
                        <td className="p-4">
                          <div className="font-bold text-foreground">{acc.name}</div>
                          <span className="text-[10px] text-muted-foreground font-outfit">{acc.subdomain}.{getRootDomain()}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-foreground text-xs">{acc.owner_name}</div>
                          <span className="text-[10px] text-muted-foreground">{acc.owner_email}</span>
                        </td>
                        <td className="p-4">
                          {hasSub && acc.active_limits.plans?.length > 0 ? (
                            <span className="font-semibold text-primary">{acc.active_limits.plans[0].display_name_ar}</span>
                          ) : (
                            <span className="text-red-400 font-bold">{t("adminAccountsNoPlan", "لا يوجد خطة")}</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {hasSub && acc.active_limits.expires_at ? (
                            new Date(acc.active_limits.expires_at).toLocaleDateString("ar-DZ")
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${
                            isSuspended 
                              ? "bg-red-500/10 text-red-400" 
                              : hasSub 
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-500/10 text-zinc-400"
                          }`}>
                            {isSuspended ? t("adminAccountsStatusSuspended") : hasSub ? t("adminAccountsStatusActive") : t("adminAccountsStatusExpired")}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            onClick={() => handleToggleSuspend(acc.store_id)}
                            disabled={actionLoadingId === acc.store_id}
                            size="sm"
                            variant={isSuspended ? "default" : "outline"}
                            className={`text-xs flex items-center gap-1 mx-auto ${
                              isSuspended ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-red-400 hover:text-red-300 border-red-500/20"
                            }`}
                          >
                            {actionLoadingId === acc.store_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isSuspended ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            <span>{isSuspended ? t("adminAccountsActionActivate") : t("adminAccountsActionSuspend")}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p>{t("adminAccountsNoStores")}</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
