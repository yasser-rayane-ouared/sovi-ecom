"use client";

import React, { useState, useEffect } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Search, Download, Truck, Check, X, Package, AlertCircle, ExternalLink,
  RefreshCw, CheckSquare, Square, ShieldAlert, Trash2, ArrowUpRight, MessageSquare,
  Sparkles, Layers, Tag, Phone, Clock, MoreHorizontal, Printer, Edit, Save, Loader2
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";

interface DeliveryConfig {
  id: string;
  company: string;
  company_name: string;
  company_logo: string;
  is_active: boolean;
  is_default: boolean;
}

export default function OrdersDashboard() {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl, language } = useLanguageStore();
  const currentStoreId = selectedStore?.id;

  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryConfigs, setDeliveryConfigs] = useState<DeliveryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubTab, setSelectedSubTab] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"active" | "abandoned">("active");

  const statusKeys = [
    { key: "all", label: t("ordersAllStatuses") },
    { key: "new", label: t("ordersStatusNew") },
    { key: "no_answer", label: t("ordersStatusNoAnswer") },
    { key: "postponed", label: t("ordersStatusPostponed") },
    { key: "confirmed", label: t("ordersStatusConfirmed") },
    { key: "pending", label: t("ordersStatusPending") },
    { key: "prepared", label: t("ordersStatusPrepared") },
    { key: "shipped", label: t("ordersStatusShipped") },
    { key: "delivered", label: t("ordersStatusDelivered") },
    { key: "returned", label: t("ordersStatusReturned") },
    { key: "cancelled", label: t("ordersStatusCancelled") },
  ];

  // Selection states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Export modal state
  const [exportModal, setExportModal] = useState<{ open: boolean; orderId: string; orderNumber: string } | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string; tracking?: string; label?: string } | null>(null);

  // Fraud / Duplicates modal state
  const [fraudModal, setFraudModal] = useState<{ open: boolean; order: any; relatedOrders: any[]; loading: boolean } | null>(null);

  // Row dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit Modal states
  const [editModal, setEditModal] = useState<{
    open: boolean;
    order: any;
    fullName: string;
    phone: string;
    phone2: string;
    wilayaId: string;
    communeId: string;
    address: string;
    deliveryMethod: 'home' | 'desk';
    stopdeskId: string;
    stopdeskName: string;
    total: string;
    loading: boolean;
  } | null>(null);

  const [editWilayas, setEditWilayas] = useState<any[]>([]);
  const [editCommunes, setEditCommunes] = useState<any[]>([]);
  const [editStopdesks, setEditStopdesks] = useState<any[]>([]);
  const [editLoadingCommunes, setEditLoadingCommunes] = useState(false);
  const [editLoadingStopdesks, setEditLoadingStopdesks] = useState(false);

  const fetchEditCommunesAndStopdesks = async (wilayaId: string, subdomain: string) => {
    if (!subdomain || !wilayaId) return;
    setEditLoadingCommunes(true);
    setEditLoadingStopdesks(true);
    
    // Find wilaya code from id/code
    let wilayaCode = wilayaId;
    if (editWilayas.length > 0) {
      const wilayaObj = editWilayas.find(w => w.id === wilayaId || w.code?.toString() === wilayaId.toString());
      if (wilayaObj) {
        wilayaCode = wilayaObj.code || wilayaId;
      }
    }
    
    try {
      const communesRes = await api.get(`/storefront/${subdomain}/wilayas/${wilayaCode}/communes/`);
      setEditCommunes(communesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch communes", err);
    } finally {
      setEditLoadingCommunes(false);
    }
    
    try {
      const stopdesksRes = await api.get(`/storefront/${subdomain}/wilayas/${wilayaCode}/stopdesks/`);
      const stopdesksData = stopdesksRes.data?.stopdesks ?? stopdesksRes.data ?? [];
      setEditStopdesks(stopdesksData);
    } catch (err) {
      console.error("Failed to fetch stopdesks", err);
    } finally {
      setEditLoadingStopdesks(false);
    }
  };

  const openEditModal = async (order: any) => {
    if (!selectedStore?.subdomain) return;
    
    let deliveryMethod: 'home' | 'desk' = 'home';
    let stopdeskId = '';
    let stopdeskName = '';
    
    const notesStr = order.notes || '';
    const match = notesStr.match(/\[StopDesk:\s*([^\]]*)\s*-\s*([^\]]*)\]/);
    if (match) {
      deliveryMethod = 'desk';
      stopdeskId = match[1].trim();
      stopdeskName = match[2].trim();
    } else {
      const matchSimple = notesStr.match(/\[StopDesk:\s*([^\]]*)\]/);
      if (matchSimple) {
        deliveryMethod = 'desk';
        stopdeskName = matchSimple[1].trim();
        if (stopdeskName.includes(' - ')) {
          const parts = stopdeskName.split(' - ', 2);
          stopdeskId = parts[0].trim();
          stopdeskName = parts[1].trim();
        }
      }
    }
    
    setEditModal({
      open: true,
      order,
      fullName: order.full_name || '',
      phone: order.phone || '',
      phone2: order.phone2 || '',
      wilayaId: order.wilaya || '',
      communeId: order.commune || '',
      address: order.address || '',
      deliveryMethod,
      stopdeskId,
      stopdeskName,
      total: order.total || '0',
      loading: false
    });

    let loadedWilayas = editWilayas;
    if (editWilayas.length === 0) {
      try {
        const res = await api.get(`/storefront/${selectedStore.subdomain}/wilayas/`);
        loadedWilayas = res.data || [];
        setEditWilayas(loadedWilayas);
      } catch (err) {
        console.error("Failed to fetch wilayas", err);
      }
    }
    
    if (order.wilaya) {
      // Find wilaya code from ID
      let wilayaCode = order.wilaya;
      const wilayaObj = loadedWilayas.find(w => w.id === order.wilaya || w.code?.toString() === order.wilaya.toString());
      if (wilayaObj) {
        wilayaCode = wilayaObj.code || order.wilaya;
      }
      
      setEditLoadingCommunes(true);
      setEditLoadingStopdesks(true);
      
      try {
        const communesRes = await api.get(`/storefront/${selectedStore.subdomain}/wilayas/${wilayaCode}/communes/`);
        setEditCommunes(communesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch communes", err);
      } finally {
        setEditLoadingCommunes(false);
      }
      
      try {
        const stopdesksRes = await api.get(`/storefront/${selectedStore.subdomain}/wilayas/${wilayaCode}/stopdesks/`);
        const stopdesksData = stopdesksRes.data?.stopdesks ?? stopdesksRes.data ?? [];
        setEditStopdesks(stopdesksData);
      } catch (err) {
        console.error("Failed to fetch stopdesks", err);
      } finally {
        setEditLoadingStopdesks(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal || !currentStoreId) return;
    setEditModal(prev => prev ? { ...prev, loading: true } : null);
    
    const cleanNotes = (notesStr: string) => {
      return notesStr.replace(/\[StopDesk:\s*[^\]]*\]/g, '').trim();
    };
    
    let notes = cleanNotes(editModal.order.notes || '');
    if (editModal.deliveryMethod === 'desk' && editModal.stopdeskName) {
      const deskTag = `[StopDesk: ${editModal.stopdeskId} - ${editModal.stopdeskName}]`;
      notes = notes ? `${notes}\n${deskTag}` : deskTag;
    }
    
    const payload = {
      full_name: editModal.fullName,
      phone: editModal.phone,
      phone2: editModal.phone2,
      wilaya: editModal.wilayaId,
      commune: editModal.communeId,
      address: editModal.address,
      notes,
      subtotal: parseFloat(editModal.total),
      total: parseFloat(editModal.total),
    };
    
    try {
      await api.put(`/orders/${currentStoreId}/${editModal.order.id}/`, payload);
      alert(language === "ar" ? "تم تحديث الطلب بنجاح!" : language === "fr" ? "Commande mise à jour avec succès !" : "Order updated successfully!");
      setEditModal(null);
      fetchOrders();
    } catch (err) {
      alert(language === "ar" ? "فشل تحديث الطلب." : language === "fr" ? "Échec de la mise à jour." : "Failed to update order details.");
    } finally {
      setEditModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const fetchOrders = () => {
    if (!currentStoreId) return;
    setLoading(true);
    const isAbandoned = activeTab === "abandoned";
    
    let url = `/orders/${currentStoreId}/?is_abandoned=${isAbandoned}&page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (activeTab === "active" && selectedSubTab !== "all") {
      url += `&status=${selectedSubTab}`;
    }

    api.get(url)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setOrders(data);
          setTotalCount(data.length);
        } else {
          setOrders(data.results ?? []);
          setTotalCount(data.count ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchDeliveryConfigs = () => {
    if (!currentStoreId) return;
    api.get(`/delivery/${currentStoreId}/configs/`)
      .then((res) => {
        const data = res.data;
        const configs = Array.isArray(data) ? data : (data.results ?? []);
        setDeliveryConfigs(configs.filter((c: DeliveryConfig) => c.is_active));
      })
      .catch(() => {});
  };

  const handleSyncTracking = async () => {
    if (!currentStoreId) return;
    setSyncing(true);
    try {
      const res = await api.post(`/orders/${currentStoreId}/sync-tracking/`);
      alert(res.data.detail || "Tracking sync complete!");
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to sync tracking.");
    } finally {
      setSyncing(false);
    }
  };

  const handleTabChange = (tab: "active" | "abandoned") => {
    setActiveTab(tab);
    setSelectedSubTab("all");
    setPage(1);
  };

  const handleFilterChange = (subTab: string) => {
    setSelectedSubTab(subTab);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  useEffect(() => {
    fetchOrders();
    setSelectedOrders([]);
  }, [currentStoreId, activeTab, page, selectedSubTab, search]);

  useEffect(() => {
    fetchDeliveryConfigs();
  }, [currentStoreId]);

  const handleUpdateStatus = async (storeId: string, id: string, newStatus: string) => {
    try {
      await api.post(`/orders/${storeId}/${id}/status/`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  const handleRestoreAbandoned = async (order: any) => {
    try {
      await api.put(`/orders/${currentStoreId}/${order.id}/`, {
        ...order,
        is_abandoned: false,
        status: "confirmed"
      });
      alert("Order restored successfully!");
      fetchOrders();
    } catch (err) {
      alert("Failed to restore abandoned order.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Order Number,Date,Customer,Phone,Wilaya,Total,Status"];
    const rows = orders.map((o) =>
      `"${o.order_number}","${new Date(o.created_at).toLocaleDateString()}","${o.full_name}","${o.phone}","${o.wilaya_name}","${o.total}","${o.status}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `orders_export_${currentStoreId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCustomTemplateExport = async (template: string) => {
    if (selectedOrders.length === 0) return;
    try {
      const res = await api.get(
        `/orders/${currentStoreId}/export/?template=${template}&ids=${selectedOrders.join(",")}`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_${template}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSelectedOrders([]);
    } catch (err) {
      alert("Failed to export selected format.");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0 || !newStatus) return;
    try {
      await api.post(`/orders/${currentStoreId}/bulk/`, {
        order_ids: selectedOrders,
        action: "update_status",
        status: newStatus
      });
      alert(`Updated status for ${selectedOrders.length} orders successfully!`);
      setSelectedOrders([]);
      fetchOrders();
    } catch {
      alert("Failed to update status for selected orders.");
    }
  };

  const openExportModal = (orderId: string, orderNumber: string) => {
    setExportResult(null);
    setExportModal({ open: true, orderId, orderNumber });
  };

  const handleExportToDelivery = async (configId?: string) => {
    if (!exportModal || !currentStoreId) return;
    setExportingId(exportModal.orderId);
    try {
      const res = await api.post(
        `/orders/${currentStoreId}/${exportModal.orderId}/export-to-delivery/`,
        configId ? { config_id: configId } : {}
      );
      console.log("[EXPORT] Success response:", res.data);
      setExportResult({
        success: true,
        message: res.data.message || t("ordersModalDeliverySuccess"),
        tracking: res.data.tracking_number,
        label: res.data.label_url,
      });
      fetchOrders();
    } catch (err: any) {
      const errData = err.response?.data;
      const errStatus = err.response?.status;
      const errDetail = errData?.detail || errData?.message || JSON.stringify(errData) || err.message || "Unknown error";
      console.error("[EXPORT] Error:", errStatus, errData);
      setExportResult({
        success: false,
        message: `Error ${errStatus || ''}: ${errDetail}`,
      });
    } finally {
      setExportingId(null);
    }
  };

  const handlePrintLabel = async (orderId: string) => {
    setPrintingId(orderId);
    try {
      const res = await api.get(`/orders/${currentStoreId}/${orderId}/print-label/`);
      if (res.data?.label_url) {
        window.open(res.data.label_url, "_blank");
      }
    } catch (err: any) {
      console.error("[PRINT LABEL] Error:", err);
      const errMsg = err.response?.data?.detail || "Failed to retrieve printable label URL.";
      alert(errMsg);
    } finally {
      setPrintingId(null);
    }
  };

  // WhatsApp helper
  const formatWhatsAppUrl = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleWhatsAppConfirm = (order: any) => {
    const itemsSummary = order.items?.map((i: any) => `${i.product_title} (${i.quantity}x)`).join("، ") || "Product";
    let text = "";
    
    if (language === "ar") {
      switch (order.status) {
        case "new":
          text = `السلام عليكم يا ${order.full_name} 🌸\nيسعدنا جداً اختيارك لمتجرنا! لقد تم تسجيل طلبك بنجاح للـ:\n📦 ${itemsSummary}\nالمبلغ الإجمالي للطلب: ${order.total} د.ج.\nالعنوان: ${order.address || "غير محدد"}، ${order.wilaya_name || ""}، ${order.commune_name || ""}.\n\nمن فضلك، أجب على هذه الرسالة بـ *تأكيد* لتأكيد شحن طلبيتك وبدء التجهيز، أو بـ *إلغاء* إذا كنت ترغب في التغيير. شكراً لثقتك بنا! ✨`;
          break;
        case "no_answer":
        case "no_answer_1":
        case "no_answer_2":
        case "no_answer_3":
          text = `أهلاً بك يا ${order.full_name} 📞\nلقد حاولنا الاتصال بك هاتفياً لتأكيد طلبك للـ (*${itemsSummary}*) ولكن لم نتمكن من الوصول إليك.\n\nمن فضلك، هل يمكنك الرد على هذه الرسالة بـ *تأكيد* لتفادي إلغاء الطلب وضمان وصول شحنتك في أسرع وقت؟ نحن بانتظارك! 😊`;
          break;
        case "postponed":
          text = `السلام عليكم يا ${order.full_name} 👋\nبناءً على طلبك، لقد قمنا بتأجيل تأكيد وتجهيز طلبك مؤقتاً.\n\nإذا كنت مستعداً لتأكيد الطلب وشحنه الآن، فقط أرسل كلمة *تأكيد* في ردك وسنتولى الباقي فوراً! متواجدون دوماً لخدمتك.`;
          break;
        case "confirmed":
          text = `بشرى سارة يا ${order.full_name}! 🎉\nلقد تم تأكيد طلبك بنجاح وهو الآن قيد التجهيز الفوري ليتم تسليمه لشركة التوصيل في أقرب وقت.\n📦 طلبك: ${itemsSummary}\n\nسنقوم بإرسال رقم التتبع إليك فور خروجه مع المندوب. شكراً لتسوقك معنا! 🚀`;
          break;
        case "pending":
        case "prepared":
          text = `مرحباً يا ${order.full_name} 🌟\nطلبك للـ (*${itemsSummary}*) جاهز تماماً وتم تغليفه بعناية فائقة وهو بانتظار استلامه من قبل مندوب شركة التوصيل.\n\nاستعد لاستلام مكالمة التوصيل قريباً! شكراً جزيلاً لتعاملك الراقي معنا. 🛍️`;
          break;
        case "shipped":
          text = `أهلاً بك يا ${order.full_name} 🚚\nخبر سعيد! طلبك الآن في طريقه إليك وهو في مرحلة الشحن والتنقل بين الولايات.\n\nيرجى إبقاء هاتفك مفتوحاً لتلقي اتصال الموزع فور وصوله إلى منطقتك. استمتع بمنتجك قريباً! 😍`;
          break;
        case "delivered":
          text = `الحمد لله على سلامة وصول طلبيتك يا ${order.full_name}! 🎁✨\nنتمنى أن يعجبك المنتج ويلبي توقعاتك. يسعدنا جداً سماع رأيك وتقييمك لتجربتك معنا.\n\nشكراً لثقتك بنا ونتطلع لخدمتك مرة أخرى في المستقبل القريب! 🌹`;
          break;
        case "returned":
          text = `السلام عليكم يا ${order.full_name} 😔\nلقد لاحظنا أن طلبيتك قد عادت إلينا بسبب عدم التمكن من تسليمها (أو تعذر الاتصال بك).\n\nنحن نهتم جداً برضاك، فإذا كنت لا تزال ترغب في استلام منتجك، يرجى إعلامنا وسنعيد جدولته لك بتوصيل سريع! يسعدنا تواصلك.`;
          break;
        case "cancelled":
          text = `مرحباً يا ${order.full_name}،\nلقد تم إلغاء طلبك بناءً على رغبتك. نتمنى أن تتاح لنا فرصة أخرى لخدمتك مستقبلاً بمنتجات وعروض أفضل. يومك سعيد! 🌸`;
          break;
        default:
          text = `السلام عليكم يا ${order.full_name} 🌸\nنشكرك على طلبك من متجرنا! رقم طلبك هو ${order.order_number}.\nالمبلغ الإجمالي للطلب: ${order.total} د.ج.\n\nشكراً لك!`;
      }
    } else if (language === "fr") {
      switch (order.status) {
        case "new":
          text = `Bonjour ${order.full_name} 🌸,\nMerci pour votre commande ! Votre numéro de commande est ${order.order_number}.\n📦 Produits : ${itemsSummary}\nTotal : ${order.total} DA\nAdresse : ${order.address || "Non définie"}, ${order.wilaya_name || ""}.\n\nVeuillez répondre par *Confirmer* pour valider l'expédition, ou par *Annuler*. Merci ! ✨`;
          break;
        case "no_answer":
        case "no_answer_1":
        case "no_answer_2":
        case "no_answer_3":
          text = `Bonjour ${order.full_name} 📞,\nNous avons essayé de vous appeler pour confirmer votre commande pour (*${itemsSummary}*) mais nous n'avons pas pu vous joindre.\n\nVeuillez répondre par *Confirmer* pour valider l'envoi rapidement. Merci ! 😊`;
          break;
        case "postponed":
          text = `Bonjour ${order.full_name} 👋,\nVotre commande a été reportée. Répondez par *Confirmer* pour lancer l'expédition dès maintenant !`;
          break;
        case "confirmed":
          text = `Bonne nouvelle ${order.full_name} ! 🎉\nVotre commande de (${itemsSummary}) est confirmée et en cours de préparation pour livraison. Merci pour votre confiance ! 🚀`;
          break;
        case "pending":
        case "prepared":
          text = `Bonjour ${order.full_name} 🌟,\nVotre commande est prête et emballée. Elle sera remise au livreur sous peu ! 🛍️`;
          break;
        case "shipped":
          text = `Bonjour ${order.full_name} 🚚,\nVotre commande est en route ! Veuillez garder votre téléphone allumé pour l'appel du livreur. 😍`;
          break;
        case "delivered":
          text = `Bonjour ${order.full_name} 🎁,\nVotre commande a été livrée ! Donnez-nous votre avis si le produit vous plaît. Merci ! 🌹`;
          break;
        case "returned":
          text = `Bonjour ${order.full_name} 😔,\nVotre colis nous a été retourné. Si vous souhaitez le recevoir à nouveau, contactez-nous pour replanifier !`;
          break;
        case "cancelled":
          text = `Bonjour ${order.full_name},\nVotre commande a été annulée. À bientôt pour de nouvelles offres ! 🌸`;
          break;
        default:
          text = `Bonjour ${order.full_name},\nMerci pour votre commande ! Numéro de commande : ${order.order_number}.\nMontant : ${order.total} DA.\nMerci !`;
      }
    } else {
      switch (order.status) {
        case "new":
          text = `Hello ${order.full_name} 🌸,\nThank you for your order! Your order number is ${order.order_number}.\n📦 Products: ${itemsSummary}\nTotal: ${order.total} DZD\nAddress: ${order.address || "Not specified"}, ${order.wilaya_name || ""}.\n\nPlease reply with *Confirm* to confirm shipment, or *Cancel*. Thank you! ✨`;
          break;
        case "no_answer":
        case "no_answer_1":
        case "no_answer_2":
        case "no_answer_3":
          text = `Hello ${order.full_name} 📞,\nWe tried calling you to confirm your order for (*${itemsSummary}*) but couldn't reach you.\n\nPlease reply with *Confirm* to ship your order as soon as possible. Thank you! 😊`;
          break;
        case "postponed":
          text = `Hello ${order.full_name} 👋,\nYour order has been postponed. Reply with *Confirm* to ship it now!`;
          break;
        case "confirmed":
          text = `Great news ${order.full_name}! 🎉\nYour order for (${itemsSummary}) is confirmed and being prepared for shipment. Thank you for shopping with us! 🚀`;
          break;
        case "pending":
        case "prepared":
          text = `Hello ${order.full_name} 🌟,\nYour order is ready and packed. It will be handed to the delivery courier shortly! 🛍️`;
          break;
        case "shipped":
          text = `Hello ${order.full_name} 🚚,\nYour order is on its way! Please keep your phone reachable for the delivery driver. 😍`;
          break;
        case "delivered":
          text = `Hello ${order.full_name} 🎁,\nYour order was successfully delivered! Let us know your feedback if you like it. Thank you! 🌹`;
          break;
        case "returned":
          text = `Hello ${order.full_name} 😔,\nYour package has been returned to us. If you still want it, reply to reschedule!`;
          break;
        case "cancelled":
          text = `Hello ${order.full_name},\nYour order has been cancelled. Hope to serve you again in the future! 🌸`;
          break;
        default:
          text = `Hello ${order.full_name},\nThank you for your order! Order number: ${order.order_number}.\nTotal: ${order.total} DZD.\nThank you!`;
      }
    }
    window.open(formatWhatsAppUrl(order.phone, text), "_blank");
  };

  const handleWhatsAppRecover = (order: any) => {
    const itemsSummary = order.items?.map((i: any) => `${i.product_title} (${i.quantity}x)`).join("، ") || "Product";
    let text = "";
    if (language === "ar") {
      text = `مرحباً يا ${order.full_name}،\nنحن سعداء باختيارك لمتجرنا! لاحظنا أنك لم تكمل طلبك الخاص بـ:\n- ${itemsSummary}\n\nهل واجهتك أي مشكلة أثناء إتمام الطلب؟ يسعدنا جداً مساعدتك وإتمام الطلب لك الآن بخصم مميز أو توصيل سريع!\nفقط قم بالرد على هذه الرسالة وسنتواصل معك فوراً.`;
    } else if (language === "fr") {
      text = `Bonjour ${order.full_name},\nNous sommes ravis que vous ayez choisi notre boutique ! Nous avons remarqué que vous n'avez pas finalisé votre commande pour :\n- ${itemsSummary}\n\nAvez-vous rencontré des difficultés ? Nous serions ravis de vous aider à la finaliser maintenant avec une réduction spéciale ou livraison rapide !\nRépondez simplement à ce message.`;
    } else {
      text = `Hello ${order.full_name},\nWe noticed you didn't complete your order for:\n- ${itemsSummary}\n\nDid you face any issues during checkout? We would love to help you complete it now with a special discount or fast shipping!\nJust reply to this message.`;
    }
    window.open(formatWhatsAppUrl(order.phone, text), "_blank");
  };

  // Fraud / Duplicates Modal Handler
  const openFraudModal = async (order: any) => {
    setFraudModal({ open: true, order, relatedOrders: [], loading: true });
    try {
      const res = await api.get(`/orders/${currentStoreId}/?search=${order.phone}`);
      const results = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setFraudModal({
        open: true,
        order,
        relatedOrders: results.filter((o: any) => o.id !== order.id),
        loading: false
      });
    } catch {
      setFraudModal({ open: true, order, relatedOrders: [], loading: false });
    }
  };

  const handleCancelOtherDuplicates = async (otherOrderIds: string[]) => {
    if (otherOrderIds.length === 0) return;
    if (!confirm(`Are you sure you want to cancel ${otherOrderIds.length} duplicate orders?`)) return;
    try {
      await api.post(`/orders/${currentStoreId}/bulk/`, {
        order_ids: otherOrderIds,
        action: "update_status",
        status: "cancelled"
      });
      alert("Cancelled duplicates successfully!");
      setFraudModal(null);
      fetchOrders();
    } catch {
      alert("Failed to cancel duplicate orders.");
    }
  };

  const filteredOrders = orders;

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (st: string) => {
    const badges: Record<string, { label: string; style: string }> = {
      new: { label: t("ordersStatusNew"), style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      no_answer: { label: t("ordersStatusNoAnswer"), style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
      no_answer_1: { label: t("ordersStatusNoAnswer1"), style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
      no_answer_2: { label: t("ordersStatusNoAnswer2"), style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
      no_answer_3: { label: t("ordersStatusNoAnswer3"), style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
      postponed: { label: t("ordersStatusPostponed"), style: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
      confirmed: { label: t("ordersStatusConfirmed"), style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      pending: { label: t("ordersStatusPending"), style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      prepared: { label: t("ordersStatusPrepared"), style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      shipped: { label: t("ordersStatusShipped"), style: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
      delivered: { label: t("ordersStatusDelivered"), style: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
      returned: { label: t("ordersStatusReturned"), style: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
      cancelled: { label: t("ordersStatusCancelled"), style: "bg-red-500/10 text-red-400 border-red-500/20" },
    };
    const b = badges[st] || { label: st, style: "bg-gray-500/10 text-gray-400" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${b.style}`}>{b.label}</span>;
  };

  const renderActions = (o: any) => {
    const isAbandoned = activeTab === "abandoned";
    
    // We will separate buttons that are directly visible in the row, from options inside the "More/Cases" dropdown.
    const visibleButtons: Array<{ label: string; icon: React.ReactNode; onClick: () => void; className: string }> = [];
    const dropdownActions: Array<{ label: string; icon: React.ReactNode; onClick: () => void; className?: string }> = [];

    if (!isAbandoned) {
      // Primary Action Buttons
      if (["new", "no_answer", "postponed"].includes(o.status)) {
        visibleButtons.push({
          label: t("ordersActionConfirm"),
          icon: <Check className="h-3.5 w-3.5" />,
          onClick: () => handleUpdateStatus(currentStoreId!, o.id, "confirmed"),
          className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        });
        
        if (!o.delivery_company_name) {
          visibleButtons.push({
            label: t("ordersActionSendDelivery"),
            icon: <Truck className="h-3.5 w-3.5" />,
            onClick: () => openExportModal(o.id, o.order_number),
            className: "bg-primary/10 hover:bg-primary/20 text-primary font-bold border border-primary/20"
          });
        }
      } else if (["confirmed", "pending", "prepared"].includes(o.status)) {
        if (!o.delivery_company_name) {
          visibleButtons.push({
            label: t("ordersActionSendDelivery"),
            icon: <Truck className="h-3.5 w-3.5" />,
            onClick: () => openExportModal(o.id, o.order_number),
            className: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm shadow-primary/20"
          });
        }
      } else if (o.status === "shipped") {
        visibleButtons.push({
          label: t("ordersActionReceived"),
          icon: <Check className="h-3.5 w-3.5" />,
          onClick: () => handleUpdateStatus(currentStoreId!, o.id, "delivered"),
          className: "border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 font-bold"
        });
      }

      // Direct visible Edit button for any active order before it is sent to the courier
      if (!o.delivery_company_name && !["shipped", "delivered", "returned", "cancelled"].includes(o.status)) {
        visibleButtons.push({
          label: language === "ar" ? "تعديل" : language === "fr" ? "Modifier" : "Edit",
          icon: <Edit className="h-3.5 w-3.5" />,
          onClick: () => openEditModal(o),
          className: "border border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 text-foreground font-semibold"
        });
      }

      // WhatsApp Button is always visible for active order statuses
      visibleButtons.push({
        label: t("ordersActionWhatsapp"),
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        onClick: () => handleWhatsAppConfirm(o),
        className: "bg-green-600 hover:bg-green-700 text-white font-bold"
      });

      // Status choices (cases) go in the dropdown
      if (["new", "no_answer", "no_answer_1", "no_answer_2", "no_answer_3", "postponed"].includes(o.status)) {
        if (o.status !== "no_answer_1") {
          dropdownActions.push({
            label: t("ordersStatusNoAnswer1"),
            icon: <Phone className="h-3.5 w-3.5" />,
            onClick: () => handleUpdateStatus(currentStoreId!, o.id, "no_answer_1"),
            className: "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
          });
        }
        if (o.status !== "no_answer_2") {
          dropdownActions.push({
            label: t("ordersStatusNoAnswer2"),
            icon: <Phone className="h-3.5 w-3.5" />,
            onClick: () => handleUpdateStatus(currentStoreId!, o.id, "no_answer_2"),
            className: "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
          });
        }
        if (o.status !== "no_answer_3") {
          dropdownActions.push({
            label: t("ordersStatusNoAnswer3"),
            icon: <Phone className="h-3.5 w-3.5" />,
            onClick: () => handleUpdateStatus(currentStoreId!, o.id, "no_answer_3"),
            className: "text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
          });
        }

        if (o.status !== "postponed") {
          dropdownActions.push({
            label: t("ordersStatusPostponed"),
            icon: <Clock className="h-3.5 w-3.5" />,
            onClick: () => handleUpdateStatus(currentStoreId!, o.id, "postponed"),
            className: "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
          });
        }
      }

      // Cancel action in dropdown
      if (!["delivered", "cancelled", "returned"].includes(o.status)) {
        dropdownActions.push({
          label: t("ordersActionCancel"),
          icon: <X className="h-3.5 w-3.5" />,
          onClick: () => handleUpdateStatus(currentStoreId!, o.id, "cancelled"),
          className: "text-rose-600 hover:bg-rose-500/10 font-bold"
        });
      }

      // Edit order action inside dropdown (only if already sent to the courier, as it has a direct button otherwise)
      if (o.delivery_company_name && !["shipped", "delivered", "returned", "cancelled"].includes(o.status)) {
        dropdownActions.push({
          label: language === "ar" ? "تعديل الطلب" : language === "fr" ? "Modifier la commande" : "Edit Order",
          icon: <Edit className="h-3.5 w-3.5" />,
          onClick: () => openEditModal(o),
          className: "text-primary hover:bg-primary/5 font-bold"
        });
      }
    } else {
      // Abandoned tab: WhatsApp recover is visible
      visibleButtons.push({
        label: t("ordersActionRecoverWhatsapp"),
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        onClick: () => handleWhatsAppRecover(o),
        className: "bg-green-600 hover:bg-green-700 text-white font-bold"
      });
      
      // Restore is in dropdown
      dropdownActions.push({
        label: t("ordersActionRestore"),
        icon: <ArrowUpRight className="h-3.5 w-3.5" />,
        onClick: () => handleRestoreAbandoned(o),
        className: "text-primary hover:bg-primary/10"
      });
    }

    const hasDropdown = dropdownActions.length > 0;
    const isDropdownOpen = openDropdownId === o.id;

    return (
      <div className={`relative flex items-center gap-1.5 ${isRtl ? "justify-end" : "justify-start"} flex-wrap md:flex-nowrap`}>
        {o.delivery_company_name && (
          <Button
            size="sm"
            variant="outline"
            disabled={printingId === o.id}
            onClick={() => handlePrintLabel(o.id)}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-bold gap-1 shadow-sm shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{printingId === o.id ? (language === "ar" ? "جاري التحميل..." : "Chargement...") : (language === "ar" ? "طباعة البوليصة" : "Imprimer le bon")}</span>
          </Button>
        )}
        {visibleButtons.map((btn, index) => (
          <Button
            key={index}
            onClick={btn.onClick}
            size="sm"
            className={`text-xs gap-1.5 py-1 px-3 shadow-sm h-8 shrink-0 ${btn.className}`}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </Button>
        ))}
        
        {hasDropdown && (
          <div className="relative shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 relative z-10"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(isDropdownOpen ? null : o.id);
              }}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(null);
                  }}
                />
                <div 
                  className={`absolute z-30 mt-1 min-w-[170px] rounded-xl border border-border dark:border-white/10 bg-card text-card-foreground shadow-2xl p-1 animate-in fade-in slide-in-from-top-1 duration-150 ${
                    isRtl ? "left-0 origin-top-left" : "right-0 origin-top-right"
                  }`}
                  style={{ top: "100%" }}
                >
                  <div className="flex flex-col gap-0.5">
                    {dropdownActions.map((act, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(null);
                          act.onClick();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-right justify-start ${
                          act.className || "text-foreground hover:bg-muted"
                        }`}
                      >
                        {act.icon}
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("ordersTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("ordersDesc")}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "active" && (
            <Button
              onClick={handleSyncTracking}
              disabled={syncing}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-indigo-500/20 border-none transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("ordersSyncing") : t("ordersSyncBtn")}
            </Button>
          )}
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5">
            <Download className="h-4 w-4" /> {t("ordersExportCsv")}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-border dark:border-white/10 pb-px">
        <button
          onClick={() => handleTabChange("active")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground dark:hover:text-white"
          }`}
        >
          <Layers className="h-4 w-4" /> {t("ordersTabActive")}
        </button>
        <button
          onClick={() => handleTabChange("abandoned")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${
            activeTab === "abandoned"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground dark:hover:text-white"
          }`}
        >
          <Package className="h-4 w-4" /> {t("ordersTabAbandoned")}
        </button>
      </div>

      {/* Filters & Sub-Tabs */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4">
          <Card className={`border-border dark:border-white/5 bg-card/50 dark:bg-white/5 p-3 flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("ordersSearchPlaceholder")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`bg-transparent border-none text-sm text-foreground focus:outline-none w-full placeholder:text-muted-foreground ${isRtl ? "text-right" : "text-left"}`}
            />
          </Card>
        </div>

        {activeTab === "active" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {statusKeys.map((status) => {
              const count = status.key === "all" 
                ? orders.length 
                : status.key === "no_answer"
                ? orders.filter(o => ["no_answer", "no_answer_1", "no_answer_2", "no_answer_3"].includes(o.status)).length
                : orders.filter(o => o.status === status.key).length;
              const isActive = selectedSubTab === status.key;
              return (
                <button
                  key={status.key}
                  onClick={() => handleFilterChange(status.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border transition-all duration-200 shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-card hover:bg-muted text-muted-foreground border-border dark:border-white/5"
                  }`}
                >
                  <span>{status.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive 
                      ? "bg-primary-foreground/20 text-primary-foreground font-mono" 
                      : "bg-muted text-muted-foreground font-mono"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk actions floating bar */}
      {selectedOrders.length > 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-lg shadow-primary/10 border p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-bold">
              {t("ordersBulkSelected").replace("{count}", selectedOrders.length.toString())}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              onClick={() => handleCustomTemplateExport("yalidine")}
              variant="outline"
              size="sm"
              className="border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 text-xs gap-1.5"
            >
              {t("ordersBulkExportYalidine")}
            </Button>
            <Button
              onClick={() => handleCustomTemplateExport("zr_express")}
              variant="outline"
              size="sm"
              className="border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 text-xs gap-1.5"
            >
              {t("ordersBulkExportZr")}
            </Button>
            <Button
              onClick={() => handleCustomTemplateExport("ecotrack")}
              variant="outline"
              size="sm"
              className="border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 text-xs gap-1.5"
            >
              {t("ordersBulkExportEcotrack")}
            </Button>
            
            <div className="h-5 w-px bg-border dark:bg-white/10 mx-1 hidden md:block" />
            
            <div className="flex flex-wrap gap-1.5 items-center">
              <Button
                onClick={() => handleBulkStatusUpdate("confirmed")}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-sm h-8"
              >
                <Check className="h-3.5 w-3.5" />
                {t("ordersStatusConfirmed")}
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("no_answer_1")}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold gap-1 h-8"
              >
                <Phone className="h-3.5 w-3.5" />
                {t("ordersStatusNoAnswer1")}
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("no_answer_2")}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold gap-1 h-8"
              >
                <Phone className="h-3.5 w-3.5" />
                {t("ordersStatusNoAnswer2")}
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("no_answer_3")}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold gap-1 h-8"
              >
                <Phone className="h-3.5 w-3.5" />
                {t("ordersStatusNoAnswer3")}
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("postponed")}
                variant="outline"
                size="sm"
                className="border-orange-500/30 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold gap-1 h-8"
              >
                <Clock className="h-3.5 w-3.5" />
                {t("ordersStatusPostponed")}
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("cancelled")}
                variant="destructive"
                size="sm"
                className="text-xs font-bold gap-1 h-8"
              >
                <X className="h-3.5 w-3.5" />
                {t("ordersStatusCancelled")}
              </Button>
            </div>

            <Button
              onClick={() => setSelectedOrders([])}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("ordersBulkCancelSelection")}
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="border-border dark:border-white/5 bg-card/40 dark:bg-white/5 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? "text-right" : "text-left"} border-collapse`}>
              <thead>
                <tr className="border-b border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.02] text-xs text-muted-foreground font-bold">
                  <th className="p-4 w-10 text-center">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
                      {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">{t("ordersColNumber")}</th>
                  <th className="p-4">{t("ordersColDate")}</th>
                  <th className="p-4">{t("ordersColCustomer")}</th>
                  <th className="p-4">{t("ordersColPhone")}</th>
                  <th className="p-4">{t("ordersColWilaya")}</th>
                  <th className="p-4">{t("ordersColProducts")}</th>
                  <th className="p-4">{t("ordersColTotal")}</th>
                  {activeTab === "active" && <th className="p-4">{t("ordersColStatus")}</th>}
                  <th className={`p-4 ${isRtl ? "text-left" : "text-right"}`}>{t("ordersColActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground animate-pulse">Loading...</td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => {
                    const isSelected = selectedOrders.includes(o.id);
                    const itemsSummary = o.items?.map((i: any) => `${i.product_title} (${i.quantity}x)`).join("، ") || "—";
                    return (
                       <tr key={o.id} className={`hover:bg-muted/10 dark:hover:bg-white/[0.02] transition-all ${isSelected ? "bg-primary/5" : ""}`}>
                        <td className="p-4 text-center">
                          <button onClick={() => toggleSelectOrder(o.id)} className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
                            {isSelected ? (
                              <CheckSquare className="h-4.5 w-4.5 text-primary" />
                            ) : (
                              <Square className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </td>
                        <td className="p-4 font-bold font-outfit text-primary">{o.order_number}</td>
                        <td className="p-4 text-xs text-muted-foreground font-outfit">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-4 font-bold">
                          <div className="flex flex-col gap-1">
                            <span>{o.full_name}</span>
                            <div className="flex gap-1.5 flex-wrap mt-0.5">
                              {o.is_duplicate && (
                                <button
                                  onClick={() => openFraudModal(o)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1 cursor-pointer hover:bg-yellow-500/20"
                                >
                                  <ShieldAlert className="h-3 w-3" /> Duplicate ({o.duplicate_count})
                                </button>
                              )}
                              {o.risk_score > 30 && (
                                <button
                                  onClick={() => openFraudModal(o)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 cursor-pointer hover:bg-red-500/20"
                                >
                                  <AlertCircle className="h-3 w-3" /> Risk: {o.risk_score}%
                                </button>
                              )}
                              {o.coupon_code && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                  <Tag className="h-3 w-3" /> Coupon: -{o.coupon_discount ? parseFloat(o.coupon_discount).toLocaleString() : '0'} DA
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-outfit text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{o.phone}</span>
                            {o.phone && (
                              <a
                                href={`tel:${o.phone}`}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 hover:scale-110 shadow-sm border border-primary/10"
                                title="Call Customer"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold">
                          <div className="flex flex-col">
                            <span>{o.wilaya_name || "—"}</span>
                            {o.commune_name && <span className="text-[10px] text-muted-foreground">{o.commune_name}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-xs max-w-xs truncate" title={itemsSummary}>{itemsSummary}</td>
                        <td className="p-4 font-extrabold font-outfit">{formatCurrency(parseFloat(o.total))}</td>
                        {activeTab === "active" && <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            {getStatusBadge(o.status)}
                            {o.delivery_company_name && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                                <Truck className="h-2.5 w-2.5" />
                                {o.delivery_company_name}
                              </span>
                            )}
                          </div>
                        </td>}
                        <td className={`p-4 ${isRtl ? "text-left" : "text-right"}`}>
                          {renderActions(o)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">{t("ordersNoOrders")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {Math.ceil(totalCount / 20) > 1 && (
            <div className="p-4 border-t border-border dark:border-white/5 flex items-center justify-between bg-muted/10 dark:bg-white/[0.01] flex-wrap gap-3">
              <span className="text-xs text-muted-foreground font-semibold">
                {language === "ar"
                  ? `عرض الصفحة ${page} من ${Math.ceil(totalCount / 20)} (إجمالي ${totalCount} طلب)`
                  : language === "fr"
                  ? `Page ${page} sur ${Math.ceil(totalCount / 20)} (${totalCount} commandes au total)`
                  : `Page ${page} of ${Math.ceil(totalCount / 20)} (${totalCount} total orders)`}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="h-8 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 font-bold"
                >
                  {language === "ar" ? "السابق" : language === "fr" ? "Précédent" : "Previous"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === Math.ceil(totalCount / 20)}
                  onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(totalCount / 20)))}
                  className="h-8 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 font-bold"
                >
                  {language === "ar" ? "التالي" : language === "fr" ? "Suivant" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export to Delivery Modal */}
      {exportModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border dark:border-border bg-background dark:bg-background shadow-2xl">
            <CardContent className="p-6 space-y-5">
              <div className={`flex items-center justify-between ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{t("ordersModalDeliveryTitle")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{t("ordersModalDeliveryOrder")} <span className="text-primary font-bold">{exportModal.orderNumber}</span></p>
                </div>
                <button
                  onClick={() => { setExportModal(null); setExportResult(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {exportResult ? (
                <div className={`rounded-xl p-4 border ${exportResult.success ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className={`flex items-start gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    {exportResult.success
                      ? <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />}
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${exportResult.success ? "text-emerald-400" : "text-red-400"}`}>
                        {exportResult.message}
                      </p>
                      {exportResult.tracking && (
                        <p className="text-xs text-muted-foreground">{t("ordersModalDeliveryTracking")} <span className="text-foreground font-bold">{exportResult.tracking}</span></p>
                      )}
                      {exportResult.label && (
                        <a href={exportResult.label} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                          <ExternalLink className="h-3 w-3" /> {t("ordersModalDeliveryPrint")}
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => { setExportModal(null); setExportResult(null); }}
                    className="w-full mt-4" variant="outline"
                  >
                    {t("ordersModalDeliveryClose")}
                  </Button>
                </div>
              ) : deliveryConfigs.length === 0 ? (
                <div className="rounded-xl p-4 border border-orange-500/20 bg-orange-500/5">
                  <div className={`flex items-start gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-orange-400">{t("ordersModalDeliveryNoCompany")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("ordersModalDeliveryNoCompanyDesc")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("ordersModalDeliverySelect")}</p>
                  <div className="space-y-2">
                    {deliveryConfigs.map((cfg) => (
                      <button
                        key={cfg.id}
                        disabled={exportingId === exportModal.orderId}
                        onClick={() => handleExportToDelivery(cfg.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border border-border dark:border-border bg-card/60 dark:bg-card/60 hover:bg-muted dark:hover:bg-muted hover:border-primary/30 transition-all text-right disabled:opacity-50 ${isRtl ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted/40 dark:bg-muted/40 flex items-center justify-center shrink-0">
                          {cfg.company_logo ? (
                            <img src={cfg.company_logo} alt={cfg.company_name} className="h-7 w-7 object-contain" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{cfg.company_name}</p>
                          {cfg.is_default && <span className="text-xs text-primary">{t("ordersModalDeliveryDefault")}</span>}
                        </div>
                        {exportingId === exportModal.orderId && <span className="mr-auto text-xs text-muted-foreground animate-pulse">{t("ordersModalDeliverySending")}</span>}
                      </button>
                    ))}
                  </div>
                  {deliveryConfigs.length === 1 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t("ordersModalDeliveryAutoSend").replace("{company}", deliveryConfigs[0].company_name)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fraud / Duplicate Details Modal */}
      {fraudModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <Card className="w-full max-w-2xl border-border dark:border-white/10 bg-background dark:bg-[#0f1118] shadow-2xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className={`flex items-center justify-between border-b border-border dark:border-white/5 pb-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <div className={`flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <ShieldAlert className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-lg">{t("ordersModalFraudTitle")}</h3>
                    <p className="text-xs text-muted-foreground font-outfit">{t("ordersModalFraudCustomer")} {fraudModal.order.full_name} ({fraudModal.order.phone})</p>
                  </div>
                </div>
                <button onClick={() => setFraudModal(null)} className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {fraudModal.loading ? (
                <div className="py-8 text-center text-muted-foreground animate-pulse">Loading database analytics for customer...</div>
              ) : (
                <div className="space-y-4">
                  {/* Warning summary */}
                  <div className={`p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-sm flex gap-3 ${isRtl ? "flex-row text-right" : "flex-row-reverse text-left"}`}>
                    <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-yellow-400">{t("ordersModalFraudWarningTitle")}</p>
                      <p className="text-xs text-muted leading-relaxed">
                        {t("ordersModalFraudWarningDesc")
                          .replace("{count}", (fraudModal.relatedOrders.length + 1).toString())
                          .replace("{score}", fraudModal.order.risk_score.toString())}
                      </p>
                    </div>
                  </div>

                  {/* Orders history */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-bold">{t("ordersModalFraudHistory")} ({fraudModal.order.phone})</p>
                    <div className="max-h-48 overflow-y-auto border border-border dark:border-white/5 rounded-xl bg-card dark:bg-white/[0.01] divide-y divide-border dark:divide-white/5">
                      {/* Current Order row */}
                      <div className={`p-3 bg-primary/5 flex justify-between items-center text-xs ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                        <div>
                          <span className="font-bold text-primary font-outfit">{fraudModal.order.order_number}</span>
                          <span className="text-[10px] text-primary/70 mr-2 border border-primary/20 rounded px-1">{t("ordersModalFraudCurrentOrder")}</span>
                          <p className="text-[10px] text-muted-foreground font-outfit mt-1">{new Date(fraudModal.order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-outfit block text-foreground dark:text-white">{formatCurrency(parseFloat(fraudModal.order.total))}</span>
                          <span className="text-muted-foreground text-[10px]">{getStatusBadge(fraudModal.order.status)}</span>
                        </div>
                      </div>

                      {/* Related orders */}
                      {fraudModal.relatedOrders.length > 0 ? (
                        fraudModal.relatedOrders.map((ro) => (
                          <div key={ro.id} className={`p-3 flex justify-between items-center text-xs hover:bg-muted/10 dark:hover:bg-white/[0.02] ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                            <div>
                              <span className="font-bold text-foreground dark:text-white font-outfit">{ro.order_number}</span>
                              <p className="text-[10px] text-muted-foreground font-outfit mt-1">{new Date(ro.created_at).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold font-outfit block text-foreground dark:text-white">{formatCurrency(parseFloat(ro.total))}</span>
                              <span className="text-muted-foreground text-[10px]">{getStatusBadge(ro.status)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted-foreground text-[10px]">{t("ordersModalFraudNoPrevious")}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {fraudModal.relatedOrders.filter((ro) => !["cancelled", "delivered"].includes(ro.status)).length > 0 && (
                    <div className={`pt-2 border-t border-border dark:border-white/5 flex gap-2 justify-end ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <Button
                        onClick={() => handleCancelOtherDuplicates(
                          fraudModal.relatedOrders.filter((ro) => !["cancelled", "delivered"].includes(ro.status)).map(ro => ro.id)
                        )}
                        variant="destructive"
                        className="text-xs"
                      >
                        {t("ordersModalFraudActionCancelOthers")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Order Details Modal */}
      {editModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <Card className="w-full max-w-lg border-border dark:border-white/10 bg-background dark:bg-[#0f1118] shadow-2xl overflow-hidden my-8">
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div className={`flex items-center justify-between border-b border-border dark:border-white/5 pb-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {language === "ar" ? "تعديل بيانات الطلب" : language === "fr" ? "Modifier la commande" : "Edit Order Details"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-outfit mt-0.5">
                    {language === "ar" ? `رقم الطلب: ${editModal.order.order_number}` : `Order: ${editModal.order.order_number}`}
                  </p>
                </div>
                <button onClick={() => setEditModal(null)} className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">
                    {language === "ar" ? "الاسم الكامل للزبون" : language === "fr" ? "Nom complet" : "Customer Full Name"}
                  </label>
                  <input
                    type="text"
                    value={editModal.fullName}
                    onChange={(e) => setEditModal(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Phone numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">
                      {language === "ar" ? "رقم الهاتف" : language === "fr" ? "Téléphone" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={editModal.phone}
                      onChange={(e) => setEditModal(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">
                      {language === "ar" ? "رقم هاتف بديل" : language === "fr" ? "Téléphone 2" : "Alternative Phone"}
                    </label>
                    <input
                      type="text"
                      value={editModal.phone2}
                      onChange={(e) => setEditModal(prev => prev ? { ...prev, phone2: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit"
                    />
                  </div>
                </div>

                {/* Wilaya and Commune selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">
                      {language === "ar" ? "الولاية" : language === "fr" ? "Wilaya" : "Province/Wilaya"}
                    </label>
                    <select
                      value={editModal.wilayaId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditModal(prev => prev ? { ...prev, wilayaId: val, communeId: '', stopdeskId: '', stopdeskName: '' } : null);
                        fetchEditCommunesAndStopdesks(val, selectedStore.subdomain);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="" disabled className="dark:bg-[#0f1118]">
                        {language === "ar" ? "اختر الولاية" : "Select Wilaya"}
                      </option>
                      {editWilayas.map((w) => (
                        <option key={w.id} value={w.id} className="dark:bg-[#0f1118]">
                          {w.code} - {isRtl ? w.name_ar : w.name_fr}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground block">
                      {language === "ar" ? "البلدية" : language === "fr" ? "Commune" : "City/Commune"}
                    </label>
                    <select
                      value={editModal.communeId}
                      disabled={!editModal.wilayaId || editLoadingCommunes}
                      onChange={(e) => setEditModal(prev => prev ? { ...prev, communeId: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="" disabled className="dark:bg-[#0f1118]">
                        {editLoadingCommunes ? (language === "ar" ? "جاري التحميل..." : "Chargement...") : (language === "ar" ? "اختر البلدية" : "Select Commune")}
                      </option>
                      {editCommunes.map((c) => (
                        <option key={c.id} value={c.id} className="dark:bg-[#0f1118]">
                          {isRtl ? c.name_ar : c.name_fr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Method Choice */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">
                    {language === "ar" ? "نوع التوصيل" : language === "fr" ? "Type de livraison" : "Delivery Method"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditModal(prev => prev ? { ...prev, deliveryMethod: 'home', stopdeskId: '', stopdeskName: '' } : null)}
                      className={`px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                        editModal.deliveryMethod === 'home'
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border dark:border-white/10 bg-card dark:bg-white/[0.01] text-muted-foreground"
                      }`}
                    >
                      <Package className="h-4 w-4" />
                      <span>{language === "ar" ? "توصيل للمنزل" : language === "fr" ? "À Domicile" : "Home Delivery"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditModal(prev => prev ? { ...prev, deliveryMethod: 'desk' } : null)}
                      className={`px-3 py-2.5 rounded-xl border transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                        editModal.deliveryMethod === 'desk'
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border dark:border-white/10 bg-card dark:bg-white/[0.01] text-muted-foreground"
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                      <span>{language === "ar" ? "استلام من المكتب" : language === "fr" ? "Bureau StopDesk" : "StopDesk Center"}</span>
                    </button>
                  </div>
                </div>

                {/* Stopdesk select (only if desk method chosen) */}
                {editModal.deliveryMethod === 'desk' && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="text-xs font-bold text-muted-foreground block">
                      {language === "ar" ? "مكتب التوصيل / مركز الاستلام" : language === "fr" ? "Bureau StopDesk" : "Stopdesk Agency/Center"}
                    </label>
                    <select
                      value={editModal.stopdeskId}
                      disabled={editLoadingStopdesks}
                      onChange={(e) => {
                        const id = e.target.value;
                        const obj = editStopdesks.find(s => s.id?.toString() === id.toString() || s.center_id?.toString() === id.toString());
                        const name = obj ? (obj.name || obj.center_name || '') : '';
                        setEditModal(prev => prev ? { ...prev, stopdeskId: id, stopdeskName: name } : null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="" disabled className="dark:bg-[#0f1118]">
                        {editLoadingStopdesks ? (language === "ar" ? "جاري التحميل..." : "Chargement...") : (language === "ar" ? "اختر مكتب التوصيل" : "Select Stopdesk")}
                      </option>
                      {editStopdesks.map((s, idx) => {
                        const sId = s.id || s.center_id || idx.toString();
                        const sName = s.name || s.center_name || '';
                        return (
                          <option key={sId} value={sId} className="dark:bg-[#0f1118]">
                            {sName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Detailed Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">
                    {language === "ar" ? "العنوان بالتفصيل" : language === "fr" ? "Adresse" : "Detailed Address"}
                  </label>
                  <textarea
                    rows={2}
                    value={editModal.address}
                    onChange={(e) => setEditModal(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Order Total Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">
                    {language === "ar" ? "المبلغ الإجمالي (شامل الشحن)" : language === "fr" ? "Total de la commande" : "Order Total Price (DZD)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editModal.total}
                    onChange={(e) => setEditModal(prev => prev ? { ...prev, total: e.target.value } : null)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className={`flex gap-3 pt-3 border-t border-border dark:border-white/5 justify-end ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editModal.loading || !editModal.fullName || !editModal.phone || !editModal.wilayaId}
                  className="px-5 font-bold flex items-center gap-1.5"
                >
                  {editModal.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{language === "ar" ? "حفظ التغييرات" : language === "fr" ? "Enregistrer" : "Save Changes"}</span>
                </Button>
                <Button
                  onClick={() => setEditModal(null)}
                  variant="outline"
                  className="border-border dark:border-white/10"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
