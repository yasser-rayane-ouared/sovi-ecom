"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Card, CardContent } from "../../../components/ui/card";
import {
  TrendingUp, ShoppingCart, CheckCircle, Percent, ArrowUpRight, Clock,
  MapPin, AlertCircle, ShoppingBag, Coins, HelpCircle, Truck, Globe,
  ArrowRight, Activity, Eye, Layers
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import AlgeriaMap from "./AlgeriaMap";

interface OverviewProps {
  storeId?: string;
  storeSubdomain?: string;
}

// Local translations to avoid strict TypeScript key dictionary mapping issues with translations.ts
const localTranslations: Record<string, Record<string, string>> = {
  ar: {
    funnelTitle: "قمع تأكيد طلبات الدفع عند الاستلام (COD)",
    funnelDesc: "معدل التحويل والتسرب عبر مراحل الطلب",
    funnelNew: "طلبات جديدة",
    funnelConfirmed: "مؤكدة هاتفياً",
    funnelShipped: "مشحونة",
    funnelDelivered: "مسلمة ومقبوضة",
    funnelConversion: "نسبة التحويل",
    funnelDropoff: "نسبة التسرب",
    deliveryAnalyticsTitle: "تحليلات شركاء الشحن (Yalidine / ZR)",
    deliverySuccessRate: "نجاح التوصيل الكلي",
    deliveryReturnRate: "نسبة المرتجعات الكلية",
    deliveredvsReturned: "المسلمة / المرجعة",
    wilayaName: "الولاية",
    successRate: "نسبة النجاح",
    ordersCount: "طلب",
    heatmapTitle: "خريطة الولايات التفاعلية بالجزائر",
    heatmapDesc: "توزيع الطلبيات ومعدل نجاح التوصيل حسب المناطق الجغرافية الكبرى.",
    liveActivityTitle: "شريط النشاط المباشر",
    activityNewOrder: "سجل طلب جديد",
    activityStatusChanged: "تحديث حالة الطلب",
    activityTimeJustNow: "الآن",
    activityTimeMinsAgo: "منذ {n} دقيقة",
    activityTimeHoursAgo: "منذ {n} ساعة",
    activityTimeDaysAgo: "منذ {n} يوم",
    activityTotal: "الإجمالي",
    activityFrom: "من",
    activityTo: "إلى",
    regionCenter: "الوسط",
    regionWest: "الغرب",
    regionEast: "الشرق",
    regionHighlands: "الهضاب العليا",
    regionSouth: "الجنوب والصحراء",
    ordersLabel: "طلبيات",
    successRateLabel: "نسبة التوصيل",
    deliveredCountLabel: "المستلمة",
    returnedCountLabel: "المرتجعة",
    storeViews: "زيارات المتجر",
    adSpend: "تكلفة الإعلانات",
    sourcingCost: "تكلفة السلع (Sourcing)",
    deliveryLoss: "خسائر التوصيل (الراجع)",
    aov: "متوسط قيمة الطلب (AOV)",
    deliveryLossTooltip: "تكاليف الشحن المدفوعة لشركات التوصيل مقابل الطرود المرتجعة.",
    adSpendTooltip: "إجمالي تكاليف الإعلانات المحسوبة بناءً على تكلفة الإعلان للطلب المحددة في إعدادات المنتجات.",
    sourcingCostTooltip: "التكلفة الإجمالية لشراء/تصنيع السلع التي تم تسليمها بالفعل للمشترين.",
    prdAnalyticsTitle: "📊 تحليلات المنتجات التفصيلية",
    prdProduct: "المنتج",
    prdViews: "المشاهدات",
    prdOrders: "الطلبات",
    prdConfRate: "التأكيد",
    prdDelRate: "التوصيل",
    prdRevenue: "الإيرادات",
    prdAdCost: "الإعلانات",
    prdSourcing: "التكلفة",
    prdProfit: "الربح",
    prdStock: "المخزون",
    prdNoData: "لا توجد بيانات منتجات بعد",
    prdLowStock: "مخزون منخفض",
    prdOutOfStock: "نفد المخزون",
  },
  en: {
    funnelTitle: "COD Order Confirmation Funnel",
    funnelDesc: "Conversion and drop-off rates through order stages",
    funnelNew: "New Orders",
    funnelConfirmed: "Phone Confirmed",
    funnelShipped: "Shipped / In Transit",
    funnelDelivered: "Delivered & Paid",
    funnelConversion: "Conversion Rate",
    funnelDropoff: "Drop-off Rate",
    deliveryAnalyticsTitle: "Delivery Partner Analytics (Yalidine / ZR)",
    deliverySuccessRate: "Overall Success Rate",
    deliveryReturnRate: "Overall Return Rate",
    deliveredvsReturned: "Delivered / Returned",
    wilayaName: "Wilaya",
    successRate: "Success Rate",
    ordersCount: "orders",
    heatmapTitle: "Interactive Algeria Wilaya Heatmap",
    heatmapDesc: "Order distribution and delivery rates by major commercial zones.",
    liveActivityTitle: "Live Activity Ticker",
    activityNewOrder: "New Order Registered",
    activityStatusChanged: "Order Status Updated",
    activityTimeJustNow: "Just now",
    activityTimeMinsAgo: "{n}m ago",
    activityTimeHoursAgo: "{n}h ago",
    activityTimeDaysAgo: "{n}d ago",
    activityTotal: "Total",
    activityFrom: "from",
    activityTo: "to",
    regionCenter: "Center",
    regionWest: "West",
    regionEast: "East",
    regionHighlands: "Highlands",
    regionSouth: "South & Sahara",
    ordersLabel: "Orders",
    successRateLabel: "Delivery Rate",
    deliveredCountLabel: "Delivered",
    returnedCountLabel: "Returned",
    storeViews: "Store Page Views",
    adSpend: "Ad Spend",
    sourcingCost: "Product Sourcing Cost",
    deliveryLoss: "Delivery Return Loss",
    aov: "Average Order Value (AOV)",
    deliveryLossTooltip: "Total delivery fees paid to shipping partners for returned packages.",
    adSpendTooltip: "Total advertising costs calculated based on ad cost per order set in product details.",
    sourcingCostTooltip: "Total sourcing cost for delivered/completed orders.",
    prdAnalyticsTitle: "\ud83d\udcca Product Analytics Breakdown",
    prdProduct: "Product",
    prdViews: "Views",
    prdOrders: "Orders",
    prdConfRate: "Conf. Rate",
    prdDelRate: "Del. Rate",
    prdRevenue: "Revenue",
    prdAdCost: "Ad Cost",
    prdSourcing: "Sourcing",
    prdProfit: "Profit",
    prdStock: "Stock",
    prdNoData: "No product data yet",
    prdLowStock: "Low stock",
    prdOutOfStock: "Out of stock",
  },
  fr: {
    funnelTitle: "Tunnel de Confirmation des Commandes COD",
    funnelDesc: "Taux de conversion et d'abandon par étape de commande",
    funnelNew: "Nouvelles Commandes",
    funnelConfirmed: "Confirmées par Tél",
    funnelShipped: "Expédiées",
    funnelDelivered: "Livrées & Payées",
    funnelConversion: "Taux de Conversion",
    funnelDropoff: "Taux d'Abandon",
    deliveryAnalyticsTitle: "Analyses de Livraison (Yalidine / ZR)",
    deliverySuccessRate: "Taux de Réussite Global",
    deliveryReturnRate: "Taux de Retour Global",
    deliveredvsReturned: "Livré / Retourné",
    wilayaName: "Wilaya",
    successRate: "Taux de Réussite",
    ordersCount: "commandes",
    heatmapTitle: "Carte Thermique Interactive des Wilayas",
    heatmapDesc: "Distribution des commandes et taux de livraison par grandes zones commerciales.",
    liveActivityTitle: "Flux d'Activité en Direct",
    activityNewOrder: "Nouvelle Commande Enregistrée",
    activityStatusChanged: "Statut de Commande Mis à Jour",
    activityTimeJustNow: "À l'instant",
    activityTimeMinsAgo: "Il y a {n} min",
    activityTimeHoursAgo: "Il y a {n} h",
    activityTimeDaysAgo: "Il y a {n} j",
    activityTotal: "Total",
    activityFrom: "de",
    activityTo: "à",
    regionCenter: "Centre",
    regionWest: "Ouest",
    regionEast: "Est",
    regionHighlands: "Hauts Plateaux",
    regionSouth: "Sud & Sahara",
    ordersLabel: "Commandes",
    successRateLabel: "Taux de Livraison",
    deliveredCountLabel: "Livré",
    returnedCountLabel: "Retourné",
    storeViews: "Visites de la boutique",
    adSpend: "Dépenses publicitaires",
    sourcingCost: "Coût d'achat produits",
    deliveryLoss: "Pertes de livraison",
    aov: "Panier Moyen (AOV)",
    deliveryLossTooltip: "Frais d'expédition payés aux partenaires pour les colis retournés.",
    adSpendTooltip: "Coût publicitaire total calculé selon le coût pub par commande configuré dans le produit.",
    sourcingCostTooltip: "Coût total d'achat des produits pour les commandes livrées.",
    prdAnalyticsTitle: "📊 Analyse détaillée des produits",
    prdProduct: "Produit",
    prdViews: "Vues",
    prdOrders: "Commandes",
    prdConfRate: "Taux Conf.",
    prdDelRate: "Taux Livr.",
    prdRevenue: "Revenus",
    prdAdCost: "Pub",
    prdSourcing: "Coût",
    prdProfit: "Bénéfice",
    prdStock: "Stock",
    prdNoData: "Aucune donnée produit",
    prdLowStock: "Stock bas",
    prdOutOfStock: "Rupture de stock",
  }
};

// 58 Wilaya Zone Mapping
const zoneMapping: Record<string, string> = {
  // Center
  "alger": "center", "algiers": "center", "aljazaer": "center", "الجزائر": "center",
  "blida": "center", "البليدة": "center",
  "tipaza": "center", "تيبازة": "center",
  "boumerdes": "center", "بومرداس": "center",
  "medea": "center", "المدية": "center",
  "bouira": "center", "البويرة": "center",
  "tiziouzou": "center", "تيزيوزو": "center",
  "aindefla": "center", "عينالدفلى": "center",
  "bejaia": "center", "بجاية": "center",

  // West
  "oran": "west", "وهران": "west",
  "mostaganem": "west", "مستغانم": "west",
  "mascara": "west", "معسكر": "west",
  "sidibelabbes": "west", "سيديبلعباس": "west",
  "tlemcen": "west", "تلمسان": "west",
  "relizane": "west", "غليزان": "west",
  "aintemouchent": "west", "عينتموشنت": "west",
  "saida": "west", "سعيدة": "west",
  "chlef": "west", "الشلف": "west",

  // East
  "constantine": "east", "قسنطينة": "east",
  "annaba": "east", "عنابة": "east",
  "skikda": "east", "سكيكدة": "east",
  "jijel": "east", "جيجل": "east",
  "batna": "east", "باتنة": "east",
  "mila": "east", "ميلة": "east",
  "oumelbouaghi": "east", "امالبواقي": "east",
  "soukahras": "east", "سوقاهراس": "east",
  "guelma": "east", "قالمة": "east",
  "eltarf": "east", "الطارف": "east",
  "tebessa": "east", "تبسة": "east",

  // Highlands
  "setif": "highlands", "سطيف": "highlands",
  "bordjbouarreridj": "highlands", "برجبوعريريج": "highlands",
  "msila": "highlands", "المسيلة": "highlands",
  "tiaret": "highlands", "تيارت": "highlands",
  "djelfa": "highlands", "الجلفة": "highlands",
  "laghouat": "highlands", "الاغواط": "highlands",
  "khenchela": "highlands", "خنشلة": "highlands",
  "tissemsilt": "highlands", "تسمسيلت": "highlands",

  // South
  "ouargla": "south", "ورقلة": "south",
  "ghardaia": "south", "غرداية": "south",
  "biskra": "south", "بسكرة": "south",
  "eloued": "south", "الوادي": "south",
  "bechar": "south", "بشار": "south",
  "adrar": "south", "ادرار": "south",
  "tamanrasset": "south", "تمنراست": "south",
  "illizi": "south", "اليزي": "south",
  "tindouf": "south", "تندوف": "south",
  "elbayadh": "south", "البيض": "south",
  "naama": "south", "النعامة": "south",
  "elmghair": "south", "المغير": "south",
  "elmeniaa": "south", "المنيعة": "south",
  "ouleddjellal": "south", "اولادجلال": "south",
  "bordjbajimokhtar": "south", "برجباجيمختار": "south",
  "beniabbes": "south", "بنيعباس": "south",
  "timimoun": "south", "تيميمون": "south",
  "touggourt": "south", "تقرت": "south",
  "djanet": "south", "جانت": "south",
  "insalah": "south", "عينصالح": "south",
  "inguezzam": "south", "عينقزام": "south",
};

export default function DashboardOverview({ storeId, storeSubdomain }: OverviewProps) {
  const { selectedStore } = useDashboardStore();
  const { t, language, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;
  const [data, setData] = useState<any>(null);
  const [productsSummary, setProductsSummary] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  // SVG states
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredWilaya, setHoveredWilaya] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Normalization helper
  const normalizeName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[أإآ]/g, "ا") // normalize hamzas
      .replace(/ة/g, "ه") // normalize teh marbuta
      .replace(/[^a-z0-9\u0600-\u06FF]/g, "") // strip spaces and punctuation
      .trim();
  };

  const l = (key: string, replacements?: Record<string, string | number>) => {
    const lang = language === 'ar' || language === 'en' || language === 'fr' ? language : 'ar';
    let text = localTranslations[lang]?.[key] || localTranslations['ar']?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  useEffect(() => {
    if (currentStoreId) {
      setLoading(true);
      Promise.all([
        api.get(`/analytics/${currentStoreId}/dashboard/?days=${days}`),
        api.get(`/analytics/${currentStoreId}/products-summary/?days=${days}`),
      ])
        .then(([dashRes, prodRes]) => {
          setData(dashRes.data);
          setProductsSummary(Array.isArray(prodRes.data) ? prodRes.data : []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [storeId, days, currentStoreId]);

  const zoneStats = useMemo(() => {
    const stats = {
      center: { nameKey: "regionCenter", count: 0, delivered: 0, returned: 0, revenue: 0 },
      west: { nameKey: "regionWest", count: 0, delivered: 0, returned: 0, revenue: 0 },
      east: { nameKey: "regionEast", count: 0, delivered: 0, returned: 0, revenue: 0 },
      highlands: { nameKey: "regionHighlands", count: 0, delivered: 0, returned: 0, revenue: 0 },
      south: { nameKey: "regionSouth", count: 0, delivered: 0, returned: 0, revenue: 0 },
    };

    if (!data?.top_wilayas) return stats;

    data.top_wilayas.forEach((w: any) => {
      const nameAr = normalizeName(w.wilaya__name_ar || "");
      const nameFr = normalizeName(w.wilaya__name_fr || "");
      const nameEn = normalizeName(w.wilaya__name_en || "");

      const zone = zoneMapping[nameAr] || zoneMapping[nameFr] || zoneMapping[nameEn] || "center";
      
      stats[zone as keyof typeof stats].count += w.count || 0;
      stats[zone as keyof typeof stats].delivered += w.delivered_count || 0;
      stats[zone as keyof typeof stats].returned += w.returned_count || 0;
      stats[zone as keyof typeof stats].revenue += w.revenue || 0;
    });

    return stats;
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-6 font-cairo">
        <h1 className="text-3xl font-bold">{t('overviewTitle')}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border"></div>
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-card border border-border animate-pulse"></div>
      </div>
    );
  }

  const { overview, top_wilayas, top_products, daily_orders, recent_activities } = data;

  const getStatusCount = (statusName: string) => {
    const item = data.status_breakdown?.find((s: any) => s.status === statusName);
    return item ? item.count : 0;
  };

  // Funnel calculations
  const totalOrders = overview.total_orders || 0;
  const confirmedCount = (overview.confirmed || 0) + (overview.delivered || 0) + (overview.returned || 0) + getStatusCount('prepared') + getStatusCount('shipped');
  const shippedCount = (overview.delivered || 0) + (overview.returned || 0) + getStatusCount('shipped');
  const deliveredCount = overview.delivered || 0;

  const funnelStages = [
    {
      key: "created",
      title: l("funnelNew"),
      count: totalOrders,
      percent: 100,
      color: "from-blue-500/10 to-blue-500/5 hover:border-blue-500/20 hover:shadow-blue-500/5",
      iconColor: "text-blue-400 bg-blue-400/10",
      icon: ShoppingCart,
      desc: l("funnelDesc"),
      dropoff: null,
    },
    {
      key: "confirmed",
      title: l("funnelConfirmed"),
      count: Math.min(confirmedCount, totalOrders),
      percent: totalOrders > 0 ? Math.round((Math.min(confirmedCount, totalOrders) / totalOrders) * 100) : 0,
      color: "from-amber-500/10 to-amber-500/5 hover:border-amber-500/20 hover:shadow-amber-500/5",
      iconColor: "text-amber-400 bg-amber-400/10",
      icon: CheckCircle,
      desc: `${totalOrders > 0 ? Math.round((Math.min(confirmedCount, totalOrders) / totalOrders) * 100) : 0}% ${l("successRate")}`,
      dropoff: {
        count: Math.max(0, totalOrders - confirmedCount),
        percent: totalOrders > 0 ? Math.round((Math.max(0, totalOrders - confirmedCount) / totalOrders) * 100) : 0,
        label: l("statusCancelled") + " / " + t("ordersStatusNoAnswer"),
      }
    },
    {
      key: "shipped",
      title: l("funnelShipped"),
      count: Math.min(shippedCount, confirmedCount),
      percent: confirmedCount > 0 ? Math.round((Math.min(shippedCount, confirmedCount) / confirmedCount) * 100) : 0,
      color: "from-purple-500/10 to-purple-500/5 hover:border-purple-500/20 hover:shadow-purple-500/5",
      iconColor: "text-purple-400 bg-purple-400/10",
      icon: Truck,
      desc: `${confirmedCount > 0 ? Math.round((Math.min(shippedCount, confirmedCount) / confirmedCount) * 100) : 0}% Shipped`,
      dropoff: {
        count: Math.max(0, confirmedCount - shippedCount),
        percent: confirmedCount > 0 ? Math.round((Math.max(0, confirmedCount - shippedCount) / confirmedCount) * 100) : 0,
        label: t("ordersStatusPostponed") + " / " + t("ordersStatusPrepared"),
      }
    },
    {
      key: "delivered",
      title: l("funnelDelivered"),
      count: Math.min(deliveredCount, shippedCount),
      percent: shippedCount > 0 ? Math.round((Math.min(deliveredCount, shippedCount) / shippedCount) * 100) : 0,
      color: "from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/20 hover:shadow-emerald-500/5",
      iconColor: "text-emerald-400 bg-emerald-400/10",
      icon: Coins,
      desc: `${shippedCount > 0 ? Math.round((Math.min(deliveredCount, shippedCount) / shippedCount) * 100) : 0}% Delivery Rate`,
      dropoff: {
        count: Math.max(0, shippedCount - deliveredCount),
        percent: shippedCount > 0 ? Math.round((Math.max(0, shippedCount - deliveredCount) / shippedCount) * 100) : 0,
        label: l("statusReturned"),
      }
    }
  ];

  const statCards = [
    {
      title: t('totalSales'),
      value: `${overview.total_revenue} DZD`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: t('netProfitLabel'),
      value: `${overview.net_profit} DZD`,
      icon: Coins,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      tooltip: t('netProfitTooltip'),
    },
    {
      title: t('receivedOrders'),
      value: overview.total_orders,
      icon: ShoppingCart,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: t('deliveredOrders'),
      value: overview.delivered,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: l('storeViews'),
      value: overview.views,
      icon: Eye,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      title: l('adSpend'),
      value: `${overview.total_ad_spend} DZD`,
      icon: Coins,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      tooltip: l('adSpendTooltip'),
    },
    {
      title: l('sourcingCost'),
      value: `${overview.total_sourcing_cost} DZD`,
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      tooltip: l('sourcingCostTooltip'),
    },
    {
      title: l('deliveryLoss'),
      value: `${overview.total_delivery_loss} DZD`,
      icon: AlertCircle,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      tooltip: l('deliveryLossTooltip'),
    },
    {
      title: t('conversionRate'),
      value: `${overview.conversion_rate}%`,
      icon: Percent,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      title: l('aov'),
      value: `${overview.delivered > 0 ? Math.round(overview.total_revenue / overview.delivered) : 0} DZD`,
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
  ];

  const calculateSuccessRate = (delivered: number, returned: number) => {
    const total = delivered + returned;
    return total > 0 ? (delivered / total) * 100 : 0;
  };

  const getZoneColor = (zoneKey: string) => {
    const zone = zoneStats[zoneKey as keyof typeof zoneStats];
    if (!zone || zone.count === 0) return 'rgba(255,255,255,0.03)';
    const maxOrders = Math.max(...Object.values(zoneStats).map(z => z.count), 1);
    const ratio = zone.count / maxOrders;
    const opacity = 0.15 + 0.65 * ratio;
    return `rgba(16, 185, 129, ${opacity})`;
  };

  const getWilayaStats = (wilayaName: string) => {
    if (!data?.top_wilayas) return null;
    const normalizedTarget = normalizeName(wilayaName);
    return data.top_wilayas.find((w: any) => {
      return (
        normalizeName(w.wilaya__name_en) === normalizedTarget ||
        normalizeName(w.wilaya__name_fr) === normalizedTarget ||
        normalizeName(w.wilaya__name_ar) === normalizedTarget
      );
    });
  };

  const getWilayaColor = (wilayaName: string) => {
    const stats = getWilayaStats(wilayaName);
    if (!stats || stats.count === 0) return 'var(--input)';
    const maxOrders = Math.max(...data.top_wilayas.map((w: any) => w.count || 0), 1);
    const ratio = stats.count / maxOrders;
    const opacity = 0.15 + 0.65 * ratio;
    return `rgba(16, 185, 129, ${opacity})`;
  };

  const getLocalizedWilayaName = (wilayaName: string) => {
    const stats = getWilayaStats(wilayaName);
    if (stats) {
      if (language === 'ar') return stats.wilaya__name_ar || stats.wilaya__name_fr || stats.wilaya__name_en;
      if (language === 'fr') return stats.wilaya__name_fr || stats.wilaya__name_en || stats.wilaya__name_ar;
      return stats.wilaya__name_en || stats.wilaya__name_fr || stats.wilaya__name_ar;
    }
    return wilayaName;
  };

  const isWilayaHighlighted = (wilayaName: string) => {
    if (hoveredWilaya === wilayaName) return true;
    if (!hoveredZone) return false;
    const norm = normalizeName(wilayaName);
    return zoneMapping[norm] === hoveredZone;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15,
    });
  };

  const formatActivityTime = (isoString: string) => {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return l('activityTimeJustNow');
    if (diffMins < 60) return l('activityTimeMinsAgo', { n: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return l('activityTimeHoursAgo', { n: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return l('activityTimeDaysAgo', { n: diffDays });
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, Record<string, string>> = {
      new: { ar: "جديد", en: "New", fr: "Nouveau" },
      no_answer: { ar: "لا يجيب", en: "No Answer", fr: "Pas de Réponse" },
      postponed: { ar: "تأجيل التأكيد", en: "Postponed", fr: "Reporté" },
      confirmed: { ar: "مؤكد", en: "Confirmed", fr: "Confirmé" },
      pending: { ar: "قيد الانتظار", en: "Pending", fr: "En Attente" },
      prepared: { ar: "جاهز", en: "Prepared", fr: "Préparé" },
      shipped: { ar: "تم الشحن", en: "Shipped", fr: "Expédié" },
      delivered: { ar: "مستلم", en: "Delivered", fr: "Livré" },
      returned: { ar: "راجع", en: "Returned", fr: "Retourné" },
      cancelled: { ar: "ملغي", en: "Cancelled", fr: "Annulé" },
    };
    const lang = language === 'ar' || language === 'en' || language === 'fr' ? language : 'ar';
    return statusLabels[status]?.[lang] || status;
  };

  const getActivityStyle = (act: any) => {
    if (act.type === 'order_created') {
      return {
        icon: ShoppingCart,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-500/20",
      };
    }
    
    const toStatus = act.to_status;
    switch (toStatus) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          color: "text-yellow-400",
          bg: "bg-yellow-400/10",
          border: "border-yellow-500/20",
        };
      case 'prepared':
        return {
          icon: Clock,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          border: "border-amber-500/20",
        };
      case 'shipped':
        return {
          icon: Truck,
          color: "text-purple-400",
          bg: "bg-purple-400/10",
          border: "border-purple-500/20",
        };
      case 'delivered':
        return {
          icon: CheckCircle,
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
          border: "border-emerald-500/20",
        };
      case 'returned':
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bg: "bg-red-400/10",
          border: "border-red-500/20",
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          color: "text-rose-400",
          bg: "bg-rose-400/10",
          border: "border-rose-500/20",
        };
      default:
        return {
          icon: Clock,
          color: "text-muted-foreground",
          bg: "bg-white/5",
          border: "border-white/5",
        };
    }
  };

  const getWilayaName = (w: any) => {
    if (language === 'ar') return w.wilaya__name_ar || w.wilaya__name_fr || w.wilaya__name_en;
    if (language === 'fr') return w.wilaya__name_fr || w.wilaya__name_en || w.wilaya__name_ar;
    return w.wilaya__name_en || w.wilaya__name_fr || w.wilaya__name_ar;
  };

  const getWilayaNameFromActivity = (act: any) => {
    if (language === 'ar') return act.wilaya_ar || act.wilaya_fr || act.wilaya_en;
    if (language === 'fr') return act.wilaya_fr || act.wilaya_en || act.wilaya_ar;
    return act.wilaya_en || act.wilaya_fr || act.wilaya_ar;
  };

  // Delivery Partner metrics
  const totalDeliveredReturned = deliveredCount + (overview.returned || 0);
  const overallSuccessRate = totalDeliveredReturned > 0 ? (deliveredCount / totalDeliveredReturned) * 100 : 0;
  const overallReturnRate = totalDeliveredReturned > 0 ? ((overview.returned || 0) / totalDeliveredReturned) * 100 : 0;

  return (
    <div className="space-y-8 font-cairo">
      {/* Title & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('storeOverview')}</h1>
          <p className="text-sm text-muted">{t('storeOverviewDesc')}</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { label: t('days7'), val: 7 },
            { label: t('days30'), val: 30 },
            { label: t('days90'), val: 90 },
          ].map((d) => (
            <button
              key={d.val}
              onClick={() => setDays(d.val)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                days === d.val ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border bg-card border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2 flex-grow text-start">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground font-medium">{card.title}</span>
                    {card.tooltip && (
                      <span className="cursor-help text-muted-foreground hover:text-foreground" title={card.tooltip}>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold font-outfit">{card.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 1. Interactive COD Confirmation Funnel */}
      <Card className="border-border bg-card border backdrop-blur-sm p-6 space-y-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <div className="text-start">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> {l('funnelTitle')}
          </h3>
          <p className="text-xs text-muted mt-1">{l('funnelDesc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {funnelStages.map((stage, idx) => (
            <div key={stage.key} className="relative">
              <Card className={`border-border bg-gradient-to-br ${stage.color} backdrop-blur-md p-5 transition-all duration-300 hover:scale-[1.02] text-start h-full flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted font-medium uppercase tracking-wider">{stage.title}</span>
                      <h3 className="text-2xl font-bold font-outfit mt-1">{stage.count}</h3>
                    </div>
                    <div className={`h-10 w-10 rounded-xl ${stage.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <stage.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">{l('funnelConversion')}</span>
                      <span className="font-outfit text-foreground">{stage.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${
                          stage.key === 'created' ? 'from-blue-500 to-blue-400' :
                          stage.key === 'confirmed' ? 'from-amber-500 to-amber-400' :
                          stage.key === 'shipped' ? 'from-purple-500 to-purple-400' :
                          'from-emerald-500 to-emerald-400'
                        }`}
                        style={{ width: `${stage.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {stage.dropoff && (
                  <div className="mt-4 pt-3 border-t border-border flex items-start gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-muted truncate block leading-tight">{stage.dropoff.label}</span>
                      <span className="font-semibold text-red-400 font-outfit">
                        -{stage.dropoff.count} ({stage.dropoff.percent}%) {l('funnelDropoff')}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Connector Chevron */}
              {idx < 3 && (
                <div className="absolute z-10 bottom-[-20px] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:-right-5 rtl:md:-left-5 rtl:md:right-auto">
                  <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg shadow-black/50">
                    <ArrowRight className={`h-4 w-4 text-muted/60 ${isRtl ? "rotate-180" : ""} rotate-90 md:rotate-0`} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Charts & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-card border backdrop-blur-sm p-6 space-y-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">{t('dailySalesChart')}</h3>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              {t('liveStatus')} <Clock className="h-3 w-3 animate-spin" />
            </span>
          </div>

          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_orders} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111625",
                    borderColor: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    borderRadius: "8px",
                    fontFamily: "Cairo",
                  }}
                />
                <Area type="monotone" dataKey="revenue" name={t('revenueLabel')} stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="net_profit" name={t('netProfitChart')} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Live Activity Ticker Feed */}
        <Card className="border-border bg-card border backdrop-blur-sm p-6 space-y-4 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between">
          <div className="text-start">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent animate-pulse" /> {l('liveActivityTitle')}
            </h3>
          </div>
          
          <div className="h-[310px] overflow-y-auto pr-1 space-y-3 custom-scrollbar flex-grow mt-4">
            {recent_activities && recent_activities.length > 0 ? (
              recent_activities.map((act: any, i: number) => {
                const isOrderCreated = act.type === 'order_created';
                const actStyle = getActivityStyle(act);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: isRtl ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl bg-card border border-border flex items-start gap-3 hover:bg-secondary/5 hover:border-border/60 transition-all duration-300 text-start"
                  >
                    {/* Icon Circle */}
                    <div className={`h-8 w-8 rounded-lg ${actStyle.bg} flex items-center justify-center flex-shrink-0 border ${actStyle.border}`}>
                      <actStyle.icon className={`h-4 w-4 ${actStyle.color}`} />
                    </div>
                    
                    {/* Info text */}
                    <div className="flex-grow space-y-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {isOrderCreated ? l('activityNewOrder') : l('activityStatusChanged')}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap font-outfit">
                          {formatActivityTime(act.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {isOrderCreated ? (
                          <>
                            {l('activityNewOrder')}{' '}
                            <span className="font-bold text-foreground font-outfit">#{act.order_number}</span>{' '}
                            {l('activityTotal')}{' '}
                            <span className="font-bold text-emerald-400 font-outfit">{act.total} DZD</span>{' '}
                            {l('activityFrom')}{' '}
                            <span className="font-bold text-foreground">{act.customer_name}</span>{' '}
                            ({getWilayaNameFromActivity(act)})
                          </>
                        ) : (
                          <>
                            {l('activityStatusChanged')}{' '}
                            <span className="font-bold text-foreground font-outfit">#{act.order_number}</span>{' '}
                            ({act.customer_name}) {l('activityFrom')}{' '}
                            <span className="text-red-500/70 dark:text-red-400/70 line-through">{getStatusLabel(act.from_status)}</span>{' '}
                            {l('activityTo')}{' '}
                            <span className="text-emerald-400 font-bold">{getStatusLabel(act.to_status)}</span>
                            {act.note && <span className="block text-[10px] italic text-muted mt-0.5">"{act.note}"</span>}
                          </>
                        )}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted">
                {t('noDataAvailable')}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Heatmap & 4. Delivery Partner Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
        {/* Heatmap Card */}
        <Card className="lg:col-span-2 border-border bg-card border backdrop-blur-sm p-6 space-y-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 relative">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary animate-pulse" /> {l('heatmapTitle')}
            </h3>
            <p className="text-xs text-muted mt-1">{l('heatmapDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* SVG Map */}
            <div 
              className="md:col-span-3 flex justify-center relative min-h-[400px]"
              onMouseLeave={() => { setHoveredWilaya(null); setHoveredZone(null); }}
            >
              <AlgeriaMap
                hoveredWilaya={hoveredWilaya}
                setHoveredWilaya={setHoveredWilaya}
                getWilayaColor={getWilayaColor}
                handleMouseMove={handleMouseMove}
                isWilayaHighlighted={isWilayaHighlighted}
              />

              {/* Tooltip */}
              {(hoveredWilaya || hoveredZone) && (
                <div
                  style={{ left: tooltipPos.x, top: tooltipPos.y }}
                  className="absolute z-10 bg-card/95 border border-border rounded-xl p-3 shadow-xl backdrop-blur-md pointer-events-none min-w-[180px] transition-all duration-75 text-start text-foreground"
                >
                  {hoveredWilaya ? (
                    <>
                      <p className="text-sm font-bold text-foreground mb-2">{getLocalizedWilayaName(hoveredWilaya)}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">{l('ordersLabel')}:</span>
                          <span className="font-bold text-foreground font-outfit">{getWilayaStats(hoveredWilaya)?.count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('successRateLabel')}:</span>
                          <span className="font-bold text-emerald-400 font-outfit">
                            {calculateSuccessRate(
                              getWilayaStats(hoveredWilaya)?.delivered_count || 0,
                              getWilayaStats(hoveredWilaya)?.returned_count || 0
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('deliveredCountLabel')}:</span>
                          <span className="font-semibold text-foreground font-outfit">{getWilayaStats(hoveredWilaya)?.delivered_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('returnedCountLabel')}:</span>
                          <span className="font-semibold text-red-400 font-outfit">{getWilayaStats(hoveredWilaya)?.returned_count || 0}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-foreground mb-2">{l(zoneStats[hoveredZone as keyof typeof zoneStats].nameKey)}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">{l('ordersLabel')}:</span>
                          <span className="font-bold text-foreground font-outfit">{zoneStats[hoveredZone as keyof typeof zoneStats].count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('successRateLabel')}:</span>
                          <span className="font-bold text-emerald-400 font-outfit">
                            {calculateSuccessRate(
                              zoneStats[hoveredZone as keyof typeof zoneStats].delivered,
                              zoneStats[hoveredZone as keyof typeof zoneStats].returned
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('deliveredCountLabel')}:</span>
                          <span className="font-semibold text-foreground font-outfit">{zoneStats[hoveredZone as keyof typeof zoneStats].delivered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">{l('returnedCountLabel')}:</span>
                          <span className="font-semibold text-red-400 font-outfit">{zoneStats[hoveredZone as keyof typeof zoneStats].returned}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Region side list */}
            <div className="md:col-span-2 space-y-3">
              {Object.entries(zoneStats).map(([key, zone]: [string, any]) => (
                <div
                  key={key}
                  className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    hoveredZone === key
                      ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/5'
                      : 'bg-card border-border hover:border-border/60'
                  }`}
                  onMouseEnter={() => setHoveredZone(key)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold">{l(zone.nameKey)}</span>
                    <span className="text-xs text-muted-foreground font-outfit">{zone.count} {l('ordersCount')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-grow bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${calculateSuccessRate(zone.delivered, zone.returned)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-outfit">
                      {calculateSuccessRate(zone.delivered, zone.returned).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 4. Integrated Delivery Partner Analytics (Yalidine, ZR Express) */}
        <Card className="border-border bg-card border p-6 space-y-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-400" /> {l('deliveryAnalyticsTitle')}
            </h3>
          </div>

          <div className="space-y-4 my-2">
            {/* Overall stats progress rings or bars */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/5 border border-border rounded-xl text-center space-y-1">
                <span className="text-[10px] text-muted block leading-none">{l('deliverySuccessRate')}</span>
                <span className="text-lg font-extrabold text-emerald-400 font-outfit">{overallSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="p-3 bg-secondary/5 border border-border rounded-xl text-center space-y-1">
                <span className="text-[10px] text-muted block leading-none">{l('deliveryReturnRate')}</span>
                <span className="text-lg font-extrabold text-red-400 font-outfit">{overallReturnRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="h-0.5 bg-border w-full"></div>
            
            {/* Wilayas table list */}
            <div className="flex-grow space-y-3">
              <span className="text-xs text-muted font-bold block">{t('topWilayas')}</span>
              <div className="space-y-2 divide-y divide-border">
                {top_wilayas.length > 0 ? (
                  top_wilayas.slice(0, 5).map((w: any, i: number) => {
                    const success = calculateSuccessRate(w.delivered_count, w.returned_count);
                    let successBadgeColor = "text-red-400 bg-red-400/10 border-red-500/20";
                    if (success >= 80) successBadgeColor = "text-emerald-400 bg-emerald-400/10 border-emerald-500/20";
                    else if (success >= 60) successBadgeColor = "text-amber-400 bg-amber-400/10 border-amber-500/20";
                    
                    return (
                      <div key={i} className="pt-2 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-muted bg-secondary/15 h-5 w-5 rounded-md flex items-center justify-center font-outfit">{i + 1}</span>
                          <span className="font-semibold">{getWilayaName(w)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-outfit">{w.count} {l('ordersLabel')}</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold font-outfit ${successBadgeColor}`}>
                            {success.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-muted text-xs">{t('noDataAvailable')}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted flex items-start gap-1 leading-normal text-start">
            <AlertCircle className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
            <span>
              {language === 'ar' 
                ? "يتم احتساب نسبة نجاح التوصيل بناءً على الطلبيات التي تم تسليمها بالفعل أو استرجاعها من شركات التوصيل."
                : "Delivery rate is calculated relative to shipped parcels that have been either successfully paid or fully returned."
              }
            </span>
          </div>
        </Card>
      </div>

      {/* Per-Product Analytics Table */}
      <Card className="border-border bg-card border p-6 space-y-4 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          {l('prdAnalyticsTitle')}
        </h3>
        <div className="overflow-x-auto -mx-2">
          {productsSummary.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-start px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdProduct')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1"><Eye className="h-3.5 w-3.5" />{l('prdViews')}</span>
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1"><ShoppingCart className="h-3.5 w-3.5" />{l('prdOrders')}</span>
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdConfRate')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">
                    <span className="flex items-center justify-center gap-1"><Truck className="h-3.5 w-3.5" />{l('prdDelRate')}</span>
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdRevenue')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdAdCost')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdSourcing')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdProfit')}</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-xs uppercase tracking-wider">{l('prdStock')}</th>
                </tr>
              </thead>
              <tbody>
                {productsSummary.map((p: any, i: number) => {
                  const stockColor = !p.track_inventory ? 'text-muted-foreground' : p.stock <= 0 ? 'text-red-400' : p.stock <= p.low_stock_threshold ? 'text-amber-400' : 'text-emerald-400';
                  const stockBg = !p.track_inventory ? '' : p.stock <= 0 ? 'bg-red-500/10' : p.stock <= p.low_stock_threshold ? 'bg-amber-500/10' : 'bg-emerald-500/10';
                  const profitColor = p.net_profit > 0 ? 'text-emerald-400' : p.net_profit < 0 ? 'text-red-400' : 'text-muted-foreground';
                  return (
                    <tr key={p.product_id} className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5 min-w-[140px]">
                          {p.primary_image ? (
                            <img src={p.primary_image} alt="" className="h-8 w-8 rounded-lg object-cover border border-border/50 shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-semibold text-xs truncate max-w-[150px]" title={p.title}>{p.title}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-3 font-outfit text-xs font-medium">{p.views.toLocaleString()}</td>
                      <td className="text-center px-2 py-3 font-outfit text-xs font-bold">{p.total_orders}</td>
                      <td className="text-center px-2 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.confirmation_rate >= 70 ? 'bg-emerald-500/15 text-emerald-400' :
                          p.confirmation_rate >= 40 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {p.confirmation_rate}%
                        </span>
                      </td>
                      <td className="text-center px-2 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.delivery_rate >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                          p.delivery_rate >= 50 ? 'bg-amber-500/15 text-amber-400' :
                          p.delivery_rate > 0 ? 'bg-red-500/15 text-red-400' :
                          'bg-muted/20 text-muted-foreground'
                        }`}>
                          {p.delivery_rate > 0 ? `${p.delivery_rate}%` : '—'}
                        </span>
                      </td>
                      <td className="text-center px-2 py-3 font-outfit text-xs font-semibold text-emerald-400">{p.revenue > 0 ? p.revenue.toLocaleString() : '—'}</td>
                      <td className="text-center px-2 py-3 font-outfit text-xs text-orange-400">{p.ad_spend > 0 ? p.ad_spend.toLocaleString() : '—'}</td>
                      <td className="text-center px-2 py-3 font-outfit text-xs text-blue-400">{p.sourcing_cost > 0 ? p.sourcing_cost.toLocaleString() : '—'}</td>
                      <td className={`text-center px-2 py-3 font-outfit text-xs font-extrabold ${profitColor}`}>
                        {p.net_profit !== 0 ? (p.net_profit > 0 ? '+' : '') + p.net_profit.toLocaleString() : '—'}
                      </td>
                      <td className="text-center px-2 py-3">
                        {p.track_inventory ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${stockBg} ${stockColor}`}>
                            {p.stock}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">{l('prdNoData')}</div>
          )}
        </div>
      </Card>

      {/* Status Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
        {/* spacer for layout */}
        <div className="lg:col-span-2" />

        {/* Original Status Breakdowns */}
        <Card className="border-border bg-card border backdrop-blur-sm p-6 space-y-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <h3 className="text-lg font-bold text-start">{t('deliveryStatusTitle')}</h3>
          <div className="space-y-4">
            {[
              { label: t('statusNew'), val: overview.total_orders - overview.confirmed - overview.cancelled, color: "bg-blue-500" },
              { label: t('statusConfirmed'), val: overview.confirmed, color: "bg-yellow-500" },
              { label: t('statusDelivered'), val: overview.delivered, color: "bg-emerald-500" },
              { label: t('statusCancelled'), val: overview.cancelled, color: "bg-red-500" },
              { label: t('statusReturned'), val: overview.returned, color: "bg-orange-500" }
            ].map((st, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${st.color}`}></span>
                    {st.label}
                  </span>
                  <span className="font-bold">{st.val}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${st.color}`}
                    style={{ width: `${overview.total_orders > 0 ? (st.val / overview.total_orders) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
