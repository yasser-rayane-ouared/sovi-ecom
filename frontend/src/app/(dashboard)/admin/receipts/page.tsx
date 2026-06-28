"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { useLanguageStore } from "../../../../stores/language";
import { useAuthStore } from "../../../../stores/auth";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { 
  CheckCircle2, XCircle, Search, Eye, Coins, FileText, 
  AlertCircle, Loader2, ZoomIn, MessageSquare
} from "lucide-react";

export default function AdminReceiptsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, isRtl, language } = useLanguageStore();
  
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected receipt for detail view
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user && !user.is_superadmin) {
      router.push("/overview");
    }
  }, [user, router]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const url = statusFilter 
        ? `/subscriptions/admin/receipts/?status=${statusFilter}`
        : "/subscriptions/admin/receipts/";
      const res = await api.get(url);
      setReceipts(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t("adminReceiptsLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_superadmin) {
      fetchReceipts();
    }
  }, [user, statusFilter]);

  const handleApprove = async (receiptId: string) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/subscriptions/admin/receipts/${receiptId}/approve/`, {
        admin_note: adminNote.trim()
      });
      setSuccess(t("adminReceiptsSuccessApprove"));
      setSelectedReceipt(null);
      setAdminNote("");
      fetchReceipts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || t("adminReceiptsApproveError", "فشل إرسال طلب الموافقة."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (receiptId: string) => {
    if (!adminNote.trim()) {
      setError(t("adminReceiptsDeclineReasonRequired", "يرجى توضيح سبب الرفض في الملاحظات أولاً."));
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/subscriptions/admin/receipts/${receiptId}/decline/`, {
        admin_note: adminNote.trim()
      });
      setSuccess(t("adminReceiptsSuccessDecline"));
      setSelectedReceipt(null);
      setAdminNote("");
      fetchReceipts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || t("adminReceiptsDeclineError", "فشل إرسال طلب الرفض."));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((r) => 
    r.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user?.is_superadmin || (loading && receipts.length === 0)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">{t("adminReceiptsLoadingTitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("adminReceiptsTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("adminReceiptsDesc")}</p>
        </div>
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

      {/* Stats Summary & Filters */}
      <div className={`flex flex-col md:flex-row gap-4 items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        {/* Status Filter buttons */}
        <div className="flex gap-2 bg-muted p-1 rounded-xl w-full md:w-auto">
          {[
            { label: t("adminReceiptsFilterPending"), value: "pending" },
            { label: t("adminReceiptsFilterApproved"), value: "approved" },
            { label: t("adminReceiptsFilterDeclined"), value: "declined" },
            { label: t("adminReceiptsFilterAll"), value: "" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                statusFilter === tab.value 
                  ? "bg-background text-foreground shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("adminReceiptsSearchPl")}
            className={`text-start ${isRtl ? "pr-10" : "pl-10"}`}
          />
        </div>
      </div>

      {/* Receipts Table */}
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-0">
          {filteredReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isRtl ? "text-right" : "text-left"}`}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColStore")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColPlan")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColMethod")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColAmount")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColDate")}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{t("adminReceiptsColStatus")}</th>
                    <th className="p-4 text-center">{t("adminReceiptsColActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors duration-150">
                      <td className="p-4 font-bold text-foreground">{receipt.store_name}</td>
                      <td className="p-4 text-primary font-bold">{receipt.plan_display_name_ar}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {receipt.payment_method === "baridimob_ccp" ? t("billingModalMethodCcp") : t("billingModalMethodRedotpay")}
                      </td>
                      <td className="p-4 font-bold">
                        {receipt.payment_method === "redotpay" && receipt.amount_usdt ? (
                          <span className="font-outfit text-accent">{parseFloat(receipt.amount_usdt).toFixed(2)} USDT</span>
                        ) : (
                          <span>{Math.round(receipt.amount_da)} دج</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(receipt.submitted_at).toLocaleDateString("ar-DZ")}{" "}
                        {new Date(receipt.submitted_at).toLocaleTimeString("ar-DZ", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${
                          receipt.status === "approved" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : receipt.status === "declined"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {receipt.status === "approved" ? t("adminReceiptsStatusApproved") : receipt.status === "declined" ? t("adminReceiptsStatusDeclined") : t("adminReceiptsStatusPending")}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setAdminNote(receipt.admin_note || "");
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs flex items-center gap-1 mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{t("adminReceiptsActionView")}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p>{t("adminReceiptsNoReceipts")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Verification Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 ${isRtl ? "text-right" : "text-left"} animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className={`flex justify-between items-center border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <h3 className="text-xl font-bold">{t("adminReceiptsModalTitle")}</h3>
              <button 
                onClick={() => {
                  setSelectedReceipt(null);
                  setAdminNote("");
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Receipt Image Panel */}
              <div className="space-y-2 order-last lg:order-first">
                <span className="text-xs font-bold text-muted-foreground block mb-1">{t("adminReceiptsModalImageTitle")}</span>
                <a href={selectedReceipt.receipt_image} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-border">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 z-10">
                    <ZoomIn className="h-6 w-6 animate-pulse" />
                  </div>
                  <img 
                    src={selectedReceipt.receipt_image} 
                    alt="Receipt Image" 
                    className="w-full h-auto max-h-[50vh] object-contain mx-auto rounded-xl bg-background"
                  />
                </a>
              </div>

              {/* Receipt Info Panel */}
              <div className="space-y-6">
                
                <div className="space-y-4">
                  <h4 className="font-bold text-sm border-b border-border pb-2 text-primary">{t("adminReceiptsModalSectionTitle")}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelStore", "اسم المتجر:")}</span>
                      <span className="font-bold text-foreground text-sm">{selectedReceipt.store_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelPlan", "الخطة المطلوبة:")}</span>
                      <span className="font-bold text-primary text-sm">{selectedReceipt.plan_display_name_ar}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelMethod", "وسيلة الدفع:")}</span>
                      <span className="font-bold text-foreground text-sm">
                        {selectedReceipt.payment_method === "baridimob_ccp" ? t("billingModalMethodCcp") : (language === "ar" ? "ريدوت باي RedotPay" : "RedotPay")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelAmount", "المبلغ المعلن:")}</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {selectedReceipt.payment_method === "redotpay" && selectedReceipt.amount_usdt ? (
                          <span className="font-outfit">{parseFloat(selectedReceipt.amount_usdt).toFixed(2)} USDT ({Math.round(selectedReceipt.amount_da)} {language === "ar" ? "دج" : "DA"})</span>
                        ) : (
                          <span>{Math.round(selectedReceipt.amount_da)} {language === "ar" ? "دج" : "DA"}</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelDate", "تاريخ الإرسال:")}</span>
                      <span className="font-bold text-foreground">
                        {new Date(selectedReceipt.submitted_at).toLocaleString(language === "ar" ? "ar-DZ" : "en-US")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t("adminReceiptsModalLabelStatus", "حالة الإيصال:")}</span>
                      <span className={`font-bold ${
                        selectedReceipt.status === 'approved' ? 'text-emerald-400' : selectedReceipt.status === 'declined' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {selectedReceipt.status === 'approved' ? t('adminReceiptsStatusApproved') : selectedReceipt.status === 'declined' ? t('adminReceiptsStatusDeclined') : t('adminReceiptsStatusPending')}
                      </span>
                    </div>
                  </div>

                  {selectedReceipt.note && (
                    <div className={`p-3 rounded-lg bg-muted/40 border border-border text-xs ${isRtl ? "text-right" : "text-left"}`}>
                      <span className="font-bold text-muted-foreground block mb-1">{t("adminReceiptsModalLabelNote", "ملاحظة التاجر:")}</span>
                      <p className="text-foreground">{selectedReceipt.note}</p>
                    </div>
                  )}
                </div>

                {/* Notes and feedback form */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold flex items-center justify-end gap-1">
                    <span>{t("adminReceiptsModalLabelNotesForm")}</span>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <textarea
                    rows={4}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t("adminReceiptsModalNotesPl")}
                    className={`flex w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground ${isRtl ? "text-right" : "text-left"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200`}
                  />
                </div>

                {selectedReceipt.status === "pending" && (
                  <div className={`flex gap-3 justify-end pt-4 border-t border-border ${isRtl ? "flex-row-reverse" : ""}`}>
                    <Button 
                      onClick={() => handleApprove(selectedReceipt.id)}
                      disabled={actionLoading}
                      className="py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 px-6"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>{t("adminReceiptsModalApproveBtn")}</span>
                    </Button>
                    
                    <Button 
                      onClick={() => handleDecline(selectedReceipt.id)}
                      disabled={actionLoading}
                      className="py-5 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 px-6"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      <span>{t("adminReceiptsModalDeclineBtn")}</span>
                    </Button>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
