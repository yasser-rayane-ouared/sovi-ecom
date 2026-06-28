"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import {
  Users, UserPlus, Shield, ShieldAlert, Edit, Trash2, X, Check,
  AlertCircle, Phone, ShoppingCart, ShoppingBag, Settings,
  Sparkles, Palette, Layers, Truck, Link2, KeyRound
} from "lucide-react";
import { useLanguageStore } from "../../../stores/language";

interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_delivery: boolean;
  can_manage_pages: boolean;
  can_manage_themes: boolean;
  can_manage_pixels: boolean;
  can_manage_integrations: boolean;
  can_manage_settings: boolean;
  can_manage_workers: boolean;
  created_at: string;
}

export default function WorkersPage() {
  const { selectedStore } = useDashboardStore();
  const storeId = selectedStore?.id;
  const { t, isRtl } = useLanguageStore();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Permissions States
  const [perms, setPerms] = useState({
    can_manage_products: false,
    can_manage_orders: false,
    can_manage_delivery: false,
    can_manage_pages: false,
    can_manage_themes: false,
    can_manage_pixels: false,
    can_manage_integrations: false,
    can_manage_settings: false,
    can_manage_workers: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);

  const fetchWorkers = async () => {
    if (!storeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/stores/${storeId}/workers/`);
      const workerList = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.results || []);
      setWorkers(workerList);
    } catch (err: any) {
      setError(t('workersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [storeId]);

  const resetForm = () => {
    setName("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setPerms({
      can_manage_products: false,
      can_manage_orders: false,
      can_manage_delivery: false,
      can_manage_pages: false,
      can_manage_themes: false,
      can_manage_pixels: false,
      can_manage_integrations: false,
      can_manage_settings: false,
      can_manage_workers: false,
    });
    setEditingWorker(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setName(worker.user.name);
    setPassword(""); // Keep blank to not change password
    setFirstName(worker.user.first_name);
    setLastName(worker.user.last_name);
    setPhone(worker.user.phone || "");
    setPerms({
      can_manage_products: worker.can_manage_products,
      can_manage_orders: worker.can_manage_orders,
      can_manage_delivery: worker.can_manage_delivery,
      can_manage_pages: worker.can_manage_pages,
      can_manage_themes: worker.can_manage_themes,
      can_manage_pixels: worker.can_manage_pixels,
      can_manage_integrations: worker.can_manage_integrations,
      can_manage_settings: worker.can_manage_settings,
      can_manage_workers: worker.can_manage_workers,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      name,
      first_name: firstName,
      last_name: lastName,
      phone,
      ...perms,
      ...(password ? { password } : {}),
    };

    try {
      if (editingWorker) {
        await api.put(`/stores/${storeId}/workers/${editingWorker.id}/`, payload);
        setSuccess(t('workerEditSuccess'));
      } else {
        await api.post(`/stores/${storeId}/workers/`, payload);
        setSuccess(t('workerAddSuccess'));
      }
      setShowModal(false);
      resetForm();
      fetchWorkers();
    } catch (err: any) {
      const apiErr = err.response?.data;
      if (apiErr && typeof apiErr === "object") {
        const firstKey = Object.keys(apiErr)[0];
        const msg = apiErr[firstKey];
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError(t('workerSaveError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!storeId || !deletingWorkerId) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/stores/${storeId}/workers/${deletingWorkerId}/`);
      setSuccess(t('workerDeleteSuccess'));
      setDeletingWorkerId(null);
      fetchWorkers();
    } catch (err: any) {
      setError(t('workerDeleteError'));
    }
  };

  const permissionsList = [
    { key: "can_manage_products", label: t('products'), desc: t('permProductsDesc'), icon: ShoppingBag, color: "text-blue-500 bg-blue-500/10" },
    { key: "can_manage_orders", label: t('orders'), desc: t('permOrdersDesc'), icon: ShoppingCart, color: "text-emerald-500 bg-emerald-500/10" },
    { key: "can_manage_delivery", label: t('shippingRates'), desc: t('permDeliveryDesc'), icon: Truck, color: "text-amber-500 bg-amber-500/10" },
    { key: "can_manage_pages", label: t('landingPages'), desc: t('permPagesDesc'), icon: Layers, color: "text-purple-500 bg-purple-500/10" },
    { key: "can_manage_themes", label: t('themes'), desc: t('permThemesDesc'), icon: Palette, color: "text-pink-500 bg-pink-500/10" },
    { key: "can_manage_pixels", label: t('pixels'), desc: t('permPixelsDesc'), icon: Sparkles, color: "text-cyan-500 bg-cyan-500/10" },
    { key: "can_manage_integrations", label: t('integrations'), desc: t('permIntegrationsDesc'), icon: Link2, color: "text-indigo-500 bg-indigo-500/10" },
    { key: "can_manage_settings", label: t('generalSettings'), desc: t('permSettingsDesc'), icon: Settings, color: "text-slate-500 bg-slate-500/10" },
    { key: "can_manage_workers", label: t('workers'), desc: t('permWorkersDesc'), icon: Users, color: "text-red-500 bg-red-500/10" },
  ];

  return (
    <div className={`space-y-8 max-w-6xl mx-auto pb-10 ${isRtl ? 'font-cairo text-right' : 'font-sans text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Info */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6`}>
        <div className="text-start">
          <h1 className={`text-3xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <Users className="h-8 w-8 text-primary" />
            {t('manageWorkersTitle')}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {t('manageWorkersDesc')}
          </p>
        </div>
        <div className="flex justify-start">
          <Button onClick={handleOpenAddModal} variant="glow" className="flex items-center gap-2 font-bold px-5 py-2.5">
            <UserPlus className="h-4.5 w-4.5" /> {t('addNewWorker')}
          </Button>
        </div>
      </div>

      {/* Alert Notices */}
      {success && (
        <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <Check className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>{t('loadingWorkers')}</span>
        </div>
      ) : workers.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-card/40 backdrop-blur-md p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t('noWorkersTitle')}</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t('noWorkersDesc')}
          </p>
          <Button onClick={handleOpenAddModal} variant="outline" className="font-bold flex items-center gap-2 hover:bg-secondary">
            <UserPlus className="h-4.5 w-4.5" /> {t('addFirstWorker')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workers.map((worker) => {
            const activePermsCount = permissionsList.filter(p => worker[p.key as keyof Worker] === true).length;
            return (
              <Card key={worker.id} className="border-border bg-card/70 backdrop-blur-md hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-primary to-accent opacity-70"></div>
                <CardHeader className={`flex justify-between items-start pt-6 pb-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                      {worker.user.first_name?.[0]?.toUpperCase() || "W"}
                    </div>
                    <div className="text-start">
                      <h3 className="font-bold text-foreground">
                        {worker.user.first_name} {worker.user.last_name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-outfit">
                        {worker.user.name} @
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => handleOpenEditModal(worker)}
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                      title={t('editWorkerTooltip')}
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </Button>
                    <Button
                      onClick={() => setDeletingWorkerId(worker.id)}
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      title={t('deleteWorkerTooltip')}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {worker.user.phone && (
                    <div className={`flex items-center gap-2 text-xs text-muted-foreground font-outfit ${isRtl ? 'justify-end' : 'justify-start'}`}>
                      <Phone className="h-3.5 w-3.5" />
                      <span>{worker.user.phone}</span>
                    </div>
                  )}

                  <div className="border-t border-border/60 my-3"></div>

                  <div>
                    <span className="text-xs font-bold text-accent block mb-2 text-start">
                      {t('allowedPermissions')} ({activePermsCount}/{permissionsList.length}) :
                    </span>
                    <div className={`flex flex-wrap gap-1.5 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                      {activePermsCount === 0 ? (
                        <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                          {t('noActivePermissions')}
                        </span>
                      ) : (
                        permissionsList.map((p) => {
                          const has = worker[p.key as keyof Worker] === true;
                          if (!has) return null;
                          return (
                            <span
                              key={p.key}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <p.icon className="h-3 w-3" />
                              {p.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className={`p-6 border-b border-border flex justify-between items-center bg-secondary/30 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5.5 w-5.5 text-primary" />
                {editingWorker ? t('editWorkerTitle') : t('addNewWorkerTitle')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 text-start">
              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{t('firstName')}</label>
                  <Input
                    required
                    placeholder={t('firstNamePlaceholder')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{t('lastName')}</label>
                  <Input
                    required
                    placeholder={t('lastNamePlaceholder')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-muted-foreground flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Shield className="h-3.5 w-3.5 text-accent" />
                    <span>{t('workerUsername')}</span>
                  </label>
                  <Input
                    required
                    placeholder={t('workerUsernamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-start font-outfit"
                    disabled={!!editingWorker && selectedStore?.user_role !== 'owner'}
                  />
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    {t('workerUsernameHelp')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-muted-foreground flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <KeyRound className="h-3.5 w-3.5 text-accent" />
                    <span>{t('password')}</span>
                  </label>
                  <Input
                    type="password"
                    required={!editingWorker}
                    placeholder={editingWorker ? t('workerPasswordHelp') : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-start font-outfit"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">{t('phone')}</label>
                  <Input
                    placeholder="0661223344"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-start font-outfit"
                  />
                </div>
              </div>

              <div className="border-t border-border/60 my-4"></div>

              {/* Permissions Checklist */}
              <div>
                <h3 className={`font-bold text-sm text-foreground flex items-center gap-1.5 mb-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                  <span>{t('selectPermissionsTitle')}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {permissionsList.map((p) => {
                    const active = perms[p.key as keyof typeof perms];
                    return (
                      <div
                        key={p.key}
                        onClick={() => setPerms({ ...perms, [p.key]: !active })}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-secondary/40 transition-all ${
                          active ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                          active ? 'bg-primary border-primary text-primary-foreground font-bold' : 'border-border'
                        }`}>
                          {active && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="text-start flex-grow">
                          <span className={`text-xs font-bold block text-foreground flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                            <p.icon className={`h-4 w-4 p-0.5 rounded ${p.color}`} />
                            {p.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">{p.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className={`flex gap-3 pt-4 border-t border-border bg-card justify-end ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="font-bold border border-border"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="glow"
                  className="font-bold px-6"
                >
                  {submitting ? t('saving') : t('saveWorker')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWorkerId && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up space-y-4">
            <div className="h-14 w-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('deleteWorkerTitle')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('deleteWorkerConfirm')}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeletingWorkerId(null)}
                className="font-bold border border-border"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-6"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
