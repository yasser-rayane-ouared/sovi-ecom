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
  Megaphone, Plus, Edit, Trash2, Search, Loader2, AlertCircle, CheckCircle2, X
} from "lucide-react";

export default function AdminAdvicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, isRtl, language } = useLanguageStore();

  const [advices, setAdvices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<any>(null); // null means creating
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("marketing");
  const [formContent, setFormContent] = useState("");

  // Delete Confirm Modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [adviceToDelete, setAdviceToDelete] = useState<any>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user && !user.is_superadmin) {
      router.push("/overview");
    }
  }, [user, router]);

  const fetchAdvices = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the admin CRUD endpoint
      const res = await api.get("/admin-panel/advices/");
      setAdvices(res.data?.results || res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(language === "ar" ? "فشل تحميل قائمة النصائح" : "Failed to load advice posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_superadmin) {
      fetchAdvices();
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setCurrentAdvice(null);
    setFormTitle("");
    setFormCategory("marketing");
    setFormContent("");
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (advice: any) => {
    setCurrentAdvice(advice);
    setFormTitle(advice.title);
    setFormCategory(advice.category);
    setFormContent(advice.content);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleSaveAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setError(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
      };

      if (currentAdvice) {
        // Edit existing post
        const res = await api.put(`/admin-panel/advices/${currentAdvice.id}/`, payload);
        setSuccess(language === "ar" ? "تم تحديث النصيحة بنجاح" : "Advice post updated successfully.");
      } else {
        // Create new post
        const res = await api.post("/admin-panel/advices/", payload);
        setSuccess(language === "ar" ? "تم نشر النصيحة الجديدة بنجاح" : "New advice post published successfully.");
      }
      setModalOpen(false);
      fetchAdvices();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.response?.data?.error || (language === "ar" ? "حدث خطأ أثناء حفظ البيانات" : "An error occurred while saving."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = (advice: any) => {
    setAdviceToDelete(advice);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAdvice = async () => {
    if (!adviceToDelete) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/admin-panel/advices/${adviceToDelete.id}/`);
      setSuccess(language === "ar" ? "تم حذف النصيحة بنجاح" : "Advice post deleted successfully.");
      setDeleteConfirmOpen(false);
      setAdviceToDelete(null);
      fetchAdvices();
    } catch (err: any) {
      console.error(err);
      setError(language === "ar" ? "فشل حذف النصيحة" : "Failed to delete advice post.");
      setDeleteConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAdvices = advices.filter((advice) => {
    const matchesSearch = advice.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          advice.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? advice.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "marketing":
        return t("marketingAdvice");
      case "business":
        return t("businessAdvice");
      case "general":
        return t("generalAnnouncement");
      default:
        return cat;
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "marketing":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "business":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "general":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  if (!user?.is_superadmin || (loading && advices.length === 0)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-cairo">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            {language === "ar" ? "جاري تحميل قائمة النصائح..." : "Loading advices..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? "text-right font-cairo" : "text-left font-sans"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary animate-pulse" />
            <span>{language === "ar" ? "إدارة النصائح والإرشادات" : "Manage Marketing Advice"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "ar" ? "انشر نصائح وإرشادات تسويقية وأعمال تظهر مباشرة في لوحة تحكم التجار." : "Publish marketing and business advices directly to store owners' feeds."}
          </p>
        </div>
        <Button 
          onClick={handleOpenCreateModal} 
          variant="glow"
          className="flex items-center gap-1.5 py-5 font-bold"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "ar" ? "إضافة نصيحة جديدة" : "Add New Advice"}</span>
        </Button>
      </div>

      {/* Action Status messages */}
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

      {/* Filters */}
      <div className={`flex flex-col md:flex-row gap-4 items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="flex gap-2 bg-muted p-1 rounded-xl w-full md:w-auto">
          {[
            { label: language === "ar" ? "الكل" : "All", value: "" },
            { label: t("marketingAdvice"), value: "marketing" },
            { label: t("businessAdvice"), value: "business" },
            { label: t("generalAnnouncement"), value: "general" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === tab.value 
                  ? "bg-background text-foreground shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className={`absolute top-3 h-4 w-4 text-muted-foreground ${isRtl ? "right-3" : "left-3"}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "ابحث بالعنوان أو المحتوى..." : "Search by title or content..."}
            className={`text-start ${isRtl ? "pr-10" : "pl-10"}`}
          />
        </div>
      </div>

      {/* Advices list */}
      <Card className="border-border bg-card/60 backdrop-blur-md">
        <CardContent className="p-0">
          {filteredAdvices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isRtl ? "text-right" : "text-left"}`}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{language === "ar" ? "العنوان" : "Title"}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{language === "ar" ? "الفئة" : "Category"}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{language === "ar" ? "الناشر" : "Author"}</th>
                    <th className={`p-4 ${isRtl ? "text-right" : "text-left"}`}>{language === "ar" ? "تاريخ النشر" : "Published At"}</th>
                    <th className="p-4 text-center">{language === "ar" ? "العمليات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvices.map((advice) => (
                    <tr key={advice.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors duration-150">
                      <td className="p-4 font-bold text-foreground max-w-md truncate">{advice.title}</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${getCategoryBadgeClass(advice.category)}`}>
                          {getCategoryLabel(advice.category)}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{advice.author_name || "Admin"}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(advice.created_at).toLocaleDateString(language === "ar" ? "ar-DZ" : "en-US")}{" "}
                        {new Date(advice.created_at).toLocaleTimeString(language === "ar" ? "ar-DZ" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            onClick={() => handleOpenEditModal(advice)}
                            size="sm"
                            variant="outline"
                            className="text-xs hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/20"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            onClick={() => handleConfirmDelete(advice)}
                            size="sm"
                            variant="outline"
                            className="text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <Megaphone className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <p>{t("noAdvicesYet")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 ${isRtl ? "text-right" : "text-left"} animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className={`flex justify-between items-center border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <h3 className="text-xl font-bold">
                {currentAdvice 
                  ? (language === "ar" ? "تعديل النصيحة" : "Edit Advice Post") 
                  : (language === "ar" ? "إضافة نصيحة جديدة" : "Add New Advice Post")}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg p-1 hover:bg-secondary rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvice} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">
                  {language === "ar" ? "العنوان" : "Title"} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={language === "ar" ? "أدخل عنواناً جذاباً..." : "Enter a catchy title..."}
                  required
                  className="text-start"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">
                  {language === "ar" ? "الفئة" : "Category"}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className={`flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isRtl ? "text-right" : "text-left"}`}
                >
                  <option value="marketing">{t("marketingAdvice")}</option>
                  <option value="business">{t("businessAdvice")}</option>
                  <option value="general">{t("generalAnnouncement")}</option>
                </select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">
                  {language === "ar" ? "المحتوى" : "Content"} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={language === "ar" ? "اكتب تفاصيل النصيحة هنا..." : "Write details of your advice post here..."}
                  required
                  className={`flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isRtl ? "text-right" : "text-left"}`}
                />
                <span className="text-[10px] text-muted-foreground block">
                  {language === "ar" 
                    ? "يمكنك كتابة أسطر جديدة لتنظيم الفقرات." 
                    : "You can write new lines to separate paragraphs."}
                </span>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-3 justify-end pt-4 border-t border-border ${isRtl ? "flex-row-reverse" : ""}`}>
                <Button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{language === "ar" ? "حفظ ونشر" : "Publish & Save"}</span>
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={actionLoading}
                >
                  <span>{language === "ar" ? "إلغاء" : "Cancel"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-6 ${isRtl ? "text-right" : "text-left"} animate-in fade-in zoom-in-95 duration-200`}>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {language === "ar" ? "تأكيد حذف النصيحة" : "Confirm Deletion"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {language === "ar" 
                  ? `هل أنت متأكد من رغبتك في حذف النصيحة "${adviceToDelete?.title}" بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.` 
                  : `Are you sure you want to permanently delete the advice post "${adviceToDelete?.title}"? This action cannot be undone.`}
              </p>
            </div>

            <div className={`flex gap-3 justify-end ${isRtl ? "flex-row-reverse" : ""}`}>
              <Button 
                onClick={handleDeleteAdvice}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 flex items-center gap-1"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{language === "ar" ? "حذف نهائي" : "Delete"}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setAdviceToDelete(null);
                }}
                disabled={actionLoading}
              >
                <span>{language === "ar" ? "إلغاء" : "Cancel"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
