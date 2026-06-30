"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  ShoppingBag, Truck, Layers, CheckCircle2, ArrowRight,
  Percent, Smartphone, Sparkles, MessageSquare, 
  Database, Lock, Check, ShieldAlert, Users, Globe, 
  LineChart, CreditCard, RotateCcw, Play, FileText, ChevronRight,
  Menu, X
} from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguageStore } from "../../stores/language";
import dynamic from "next/dynamic";

const ProfitCalculator = dynamic(() => import("../../components/marketing/ProfitCalculator"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-3xl bg-slate-900/40 animate-pulse border border-border/10 flex flex-col items-center justify-center gap-4 text-center font-cairo">
      <div className="h-9 w-9 rounded-full border-2 border-t-transparent border-amber-500 animate-spin" />
      <div className="text-amber-500 font-bold tracking-wider text-xs">جاري تحميل حاسبة الأرباح...</div>
    </div>
  )
});

const LiveSimulator = dynamic(() => import("../../components/marketing/LiveSimulator"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-3xl bg-slate-900/40 animate-pulse border border-border/10 flex flex-col items-center justify-center gap-4 text-center font-cairo">
      <div className="h-9 w-9 rounded-full border-2 border-t-transparent border-amber-500 animate-spin" />
      <div className="text-amber-500 font-bold tracking-wider text-xs">جاري تحميل لوحة المحاكاة...</div>
    </div>
  )
});

export default function MarketingHome() {
  const { t, language, isRtl } = useLanguageStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  // Local luxury copy deck
  const copy = {
    ar: {
      heroBadge: "نظام بيئي فاخر للتجارة الإلكترونية بالجزائر ⚜️",
      heroTitleStart: "أنشئ إمبراطورية التجارة الإلكترونية الخاصة بك في ",
      heroTitleEnd: "",
      heroDescription: "Sovi هي المنصة المتكاملة الأولى المصممة خصيصاً للدفع عند الاستلام (COD) في الجزائر. اربط متجرك بـ Claude AI، زامن طلبياتك مع جميع شركات الشحن، وجداول Google Sheets تلقائياً وبأعلى درجات الأمان والاحترافية.",
      createStoreNow: "ابدأ رحلة النجاح مجاناً",
      calcProfit: "الحاسبة الذكية للأرباح",
      
      featTitle: "أجنحة نظام Sovi النخبوية",
      featDesc: "كل ما يحتاجه التاجر الطموح للسيطرة على السوق الجزائرية بأتمتة كاملة وتصميم فاخر.",
      
      featAiTitle: "1. مساعد الذكاء الاصطناعي Claude AI (MCP)",
      featAiDesc: "تحكّم في متجرك بالكامل عبر الدردشة مع Claude. أنشئ صفحات هبوط فاخرة، عدّل الأسعار، اكتب نصوصاً تسويقية بالدارجة الجزائرية، وحلل طلبياتك بأوامر نصية بسيطة وسريعة.",
      
      featLogisticsTitle: "2. شحن متكامل مع جميع الشركات",
      featLogisticsDesc: "اربط متجرك مع Yalidine، ZR Express، EcoTrack، Maystro، Nord & Sud و Fastlo. ولّد ملصقات الشحن وتتبع حالة طرودك تلقائياً وبشكل فوري مع ضبط أسعار الولايات الـ 58.",
      
      featSheetsTitle: "3. مزامنة Google Sheets فائقة السرعة",
      featSheetsDesc: "تصدير فوري للطلبات الجديدة إلى جداول البيانات مباشرة مع نظام ذكي يمنع تكرار الصفوف ويضمن أمان وسرعة مزامنة بياناتك بدون رسوم إضافية.",
      
      featInventoryTitle: "4. إدارة المخزون التلقائية و Restock",
      featInventoryDesc: "خصم تلقائي للمنتجات عند تأكيد الطلب، وإعادة شحن تلقائي فوري للمخزون (Restock) في حالة إلغاء الطلبية أو إرجاع الطرد (Retour)، مع تنبيهات عند اقتراب نفاد الكمية.",
      
      featSecurityTitle: "5. درع الحماية والحد من الاحتيال",
      featSecurityDesc: "تجنب الخسائر والطلبات الوهمية عبر تفعيل التحقق برمز SMS OTP، وتصفية الطلبات الجغرافية (IP جزائري فقط)، والتحقق التلقائي من تكرار الهواتف وتقييم مخاطر المشتري.",
      
      featPagesTitle: "6. منشئ صفحات الهبوط الاحترافية",
      featPagesDesc: "قوالب صفحات هبوط فاخرة مصممة لجذب المشترين في الجزائر وتحقيق أعلى معدل تحويل لزوار متجرك مع عروض كمية مخصصة وفورم طلب مباشر فائق السرعة.",
      
      featPixelsTitle: "7. البكسلات المتقدمة و Meta Conversions API (CAPI)",
      featPixelsDesc: "اربط بكسلات فيسبوك، تيك توك، وسناب شات مع دعم كامل لـ Meta Conversions API لإرسال أحداث الشراء من السيرفر مباشرة لتفادي حواجب الإعلانات وضمان دقة استهدافك.",
      
      featWorkersTitle: "8. إدارة الموظفين ومراكز الاتصال",
      featWorkersDesc: "أنشئ حسابات مخصصة لفريق عملك (موظفي تأكيد الطلبيات، عمال التعبئة) مع صلاحيات محددة لحماية بياناتك وتحسين كفاءة العمل.",
      
      simTitle: "جرب المزامنة والأتمتة الحية بنقرة واحدة",
      simDesc: "شاهد كيف تترابط أنظمة Sovi لحماية مخزونك وأتمتة مبيعاتك لحظة بلحظة.",
      simBtnOrder: "محاكاة طلب زبون جديد 🛒",
      simBtnReturn: "محاكاة إرجاع الطرد (Retour) 🔄",
      simStatusIdle: "في انتظار إطلاق المحاكاة...",
      simStepCheckout: "1. زبون جديد يقوم بالطلب على صفحة الهبوط...",
      simStepFraud: "2. فحص الأمان: IP جزائري ✅، لا يوجد سبام ✅",
      simStepStock: "3. المخزون: تم خصم قطعة واحدة تلقائياً من مخزون المنتج 📉",
      simStepSheets: "4. Google Sheets: تم إدراج الطلب تلقائياً وبدون تكرار 📊",
      simStepShipping: "5. التوصيل: تم إرسال الطلب للشركة وتوليد كود التتبع 🚚",
      simStepDone: "✨ اكتملت العملية بنجاح في 1.2 ثانية! كل شيء مؤتمت.",
      simStepReturnStock: "1. الطرد تم إرجاعه أو إلغاؤه من الزبون...",
      simStepReturnStockDone: "2. المخزون: تمت إعادة القطعة للمخزون (Restock) وتحديث حالة Google Sheet تلقائياً 📈",
      
      simInvTitle: "حالة المخزون بالمتجر",
      simInvProd: "المنتج",
      simInvStock: "المخزون المتوفر",
      simInvStatus: "الحالة",
      simInvLowAlert: "تنبيه مخزون منخفض",
      
      simSheetTitle: "جداول بيانات Google Sheets (مزامنة فورية)",
      
      calcConfirmRate: "معدل تأكيد الطلبيات:",
      calcDeliveryRate: "معدل تسليم الطرود (Delivery Rate):",
      calcRevenue: "إجمالي المقبوضات (Gross Revenue):",
      calcCogs: "تكلفة السلع المسلمة (COGS):",
      calcShipping: "تكلفة شحن الطرود:",
      calcReturnCost: "تكلفة شحن المرتجعات (Retour):",
      calcSavingDetail: "توفر Sovi حماية للمخزون بإرجاع السلع التالفة أو المرتجعة للرفوف فوراً، مما يعني صفر خسائر في تكلفة المنتج للطرود المرتجعة.",
      calcProfitNet: "صافي أرباحك الصافية شهرياً:",
      calcRoi: "العائد على الاستثمار:",
      
      priceTitle: "خطط نخبة الأعمال والتجار",
      priceDesc: "باقات مرنة تضمن أعلى أداء لمتجرك وسرعة فائقة لعملائك بالجزائر.",
      priceStarterName: "الباقة الأساسية (Starter)",
      priceStarterPrice: "1,200 دج / شهرياً",
      priceStarterDesc: "مثالية للمبتدئين لبناء متجر وتأكيد طلبياتهم الأولى.",
      priceProName: "الباقة الاحترافية (Pro)",
      priceProPrice: "2,500 دج / شهرياً",
      priceProDesc: "للتجار الساعين للنمو مع ربط شركات الشحن وحماية متطورة ضد الاحتيال والسبام.",
      priceMaxName: "باقة النخبة القصوى (Max)",
      priceMaxPrice: "4,900 دج / شهرياً",
      priceMaxDesc: "باقة غير محدودة بالكامل لأصحاب الأعمال والشركات الكبرى لإدارة المتاجر المتعددة بذكاء واحترافية.",
      priceBillingMethods: "ندعم وسائل الدفع المحلية بالجزائر لتسهيل أعمالك:",
      priceCcpBaridi: "بريدي موب / CCP",
      priceRedotpay: "تحويل RedotPay الفوري",
      
      ctaTitle: "هل أنت مستعد لقيادة مبيعاتك نحو القمة؟",
      ctaDesc: "انضم إلى مئات التجار الذين يثقون بمنصة Sovi لإدارة أعمالهم وتطوير تجارتهم الإلكترونية بالجزائر.",
      ctaBtn: "ابدأ إنشاء متجرك الفاخر الآن مجاناً"
    },
    fr: {
      heroBadge: "Écosystème E-Commerce d'Élite en Algérie ⚜️",
      heroTitleStart: "Bâtissez votre empire e-commerce en ",
      heroTitleEnd: "",
      heroDescription: "Sovi est la plateforme d'élite conçue spécifiquement pour le Cash on Delivery (COD) en Algérie. Connectez votre store à Claude AI, synchronisez vos ventes avec tous les transporteurs, et Google Sheets instantanément avec une sécurité maximale.",
      createStoreNow: "Démarrer gratuitement maintenant",
      calcProfit: "Simulateur de Profits Intelligent",
      
      featTitle: "Les Suites Technologiques Sovi",
      featDesc: "Tout ce dont un marchand ambitieux a besoin pour dominer le marché algérien avec une automatisation totale.",
      
      featAiTitle: "1. Connecteur Claude AI (MCP)",
      featAiDesc: "Contrôlez votre boutique par simple chat avec Claude. Générez des landing pages de luxe, ajustez vos prix, rédigez vos textes en Derja et analysez vos ventes par commandes textuelles.",
      
      featLogisticsTitle: "2. Logistique Intégrée (Toutes Sociétés)",
      featLogisticsDesc: "Intégrez Yalidine, ZR Express, EcoTrack, Maystro, Nord & Sud et Fastlo. Générez des bordereaux, suivez les colis en temps réel et appliquez automatiquement les tarifs des 58 Wilayas.",
      
      featSheetsTitle: "3. Météore Google Sheets Sync",
      featSheetsDesc: "Exportation en temps réel de vos ventes vers vos classeurs Google Sheets avec un moteur de protection intelligent anti-doublons et sans frais de transfert de données.",
      
      featInventoryTitle: "4. Cycle de Stock & Restock COD",
      featInventoryDesc: "Déduction automatique des produits à la confirmation de commande et réapprovisionnement automatique instantané (Restock) si le colis est annulé ou retourné (Retour), avec alertes de seuil bas.",
      
      featSecurityTitle: "5. Bouclier Anti-Fraude Algérie",
      featSecurityDesc: "Évitez les pertes et fausses commandes grâce à la validation SMS OTP, au blocage géographique IP (Algérie uniquement), au filtre des numéros doublons et à l'analyse de risque acheteur.",
      
      featPagesTitle: "6. Créateur de Landing Pages de Luxe",
      featPagesDesc: "Des templates haut de gamme conçus pour le marché algérien, formulaires de commande directe ultra-rapides et gestion dynamique des offres par quantité.",
      
      featPixelsTitle: "7. Pixels Publicitaires & Meta CAPI",
      featPixelsDesc: "Intégrez vos pixels Meta, TikTok, et Snapchat avec support natif de l'API de Conversions Meta (CAPI) pour contourner les bloqueurs de publicité et optimiser vos campagnes.",
      
      featWorkersTitle: "8. Gestion d'Équipe & Centres d'Appel",
      featWorkersDesc: "Créez des accès sécurisés pour vos agents de confirmation et emballeurs avec des permissions restreintes pour protéger vos données de vente.",
      
      simTitle: "Testez l'Automatisation Live en un Clic",
      simDesc: "Visualisez en temps réel comment les systèmes Sovi collaborent pour protéger vos stocks et fluidifier vos ventes.",
      simBtnOrder: "Simuler un Achat Client 🛒",
      simBtnReturn: "Simuler un Retour Colis (Restock) 🔄",
      simStatusIdle: "En attente du lancement de la simulation...",
      simStepCheckout: "1. Un client commande sur une landing page de luxe...",
      simStepFraud: "2. Contrôle anti-fraude: IP Algérie ✅, Aucun spam détecté ✅",
      simStepStock: "3. Gestion de stock: -1 article déduit automatiquement de l'inventaire 📉",
      simStepSheets: "4. Google Sheets: La ligne est insérée instantanément sans doublon 📊",
      simStepShipping: "5. Logistique: Commande envoyée au transporteur, tracking généré 🚚",
      simStepDone: "✨ Simulation réussie en 1.2s! Tout le cycle COD a été automatisé.",
      simStepReturnStock: "1. Le colis est annulé par le client ou retourné par le livreur...",
      simStepReturnStockDone: "2. Restock: L'article est remis en stock automatiquement (+1) et le statut Sheets mis à jour 📈",
      
      simInvTitle: "État du Stock en Boutique",
      simInvProd: "Produit",
      simInvStock: "Quantité en Stock",
      simInvStatus: "Statut",
      simInvLowAlert: "Alerte de Stock Bas",
      
      simSheetTitle: "Google Sheets connecté (Synchro en direct)",
      
      calcConfirmRate: "Taux de Confirmation:",
      calcDeliveryRate: "Taux de Livraison (Delivery Rate):",
      calcRevenue: "Revenu Brut (Gross):",
      calcCogs: "Coût des Marchandises (COGS):",
      calcShipping: "Frais de Livraison:",
      calcReturnCost: "Pertes sur Retours (Retour):",
      calcSavingDetail: "Grâce au restock automatique de Sovi, les colis retournés ne sont pas perdus. Ils reviennent automatiquement en stock. Perte produit = 0 DA.",
      calcProfitNet: "Bénéfice Net Mensuel:",
      calcRoi: "Retour sur Investissement (ROI):",
      
      priceTitle: "Des Offres Conçues pour Performer",
      priceDesc: "Des tarifs transparents et adaptés pour propulser vos ventes en Algérie.",
      priceStarterName: "Plan Starter",
      priceStarterPrice: "1 200 DA / mois",
      priceStarterDesc: "Idéal pour lancer votre boutique et tester vos premiers produits.",
      priceProName: "Plan Professionnel (Pro)",
      priceProPrice: "2 500 DA / mois",
      priceProDesc: "Pour les marchands voulant intégrer les transporteurs et le bouclier anti-fraude.",
      priceMaxName: "Plan Élite Max",
      priceMaxPrice: "4 900 DA / mois",
      priceMaxDesc: "Accès illimité complet avec multi-boutiques et connecteur Claude AI MCP.",
      priceBillingMethods: "Méthodes de paiement locales acceptées pour votre confort:",
      priceCcpBaridi: "CCP / BaridiMob",
      priceRedotpay: "Transfert RedotPay instantané",
      
      ctaTitle: "Prêt à scaler vos ventes en Algérie ?",
      ctaDesc: "Rejoignez des centaines de marchands qui font confiance à Sovi pour automatiser et développer leur business.",
      ctaBtn: "Lancer mon Store de Luxe Gratuitement"
    },
    en: {
      heroBadge: "Elite E-Commerce Ecosystem in Algeria ⚜️",
      heroTitleStart: "Build your e-commerce empire in ",
      heroTitleEnd: "",
      heroDescription: "Sovi is the ultimate platform designed specifically for Cash on Delivery (COD) in Algeria. Connect your store directly to Claude AI, sync orders with all courier companies, and Google Sheets automatically with top-tier security.",
      createStoreNow: "Get Started Free Now",
      calcProfit: "Smart Profit Calculator",
      
      featTitle: "The Sovi Technology Suites",
      featDesc: "Everything an ambitious merchant needs to dominate the Algerian market with total automation.",
      
      featAiTitle: "1. Claude AI MCP Connector",
      featAiDesc: "Control your entire store by chatting with Claude. Generate premium landing pages, adjust prices, draft high-converting copy in Algerian Arabic, and extract sales reports.",
      
      featLogisticsTitle: "2. Integrated Logistics (All Carriers)",
      featLogisticsDesc: "Connect with Yalidine, ZR Express, EcoTrack, Maystro, Nord & Sud, and Fastlo. Print shipping labels in bulk, track parcels, and auto-sync delivery rates for all 58 Wilayas.",
      
      featSheetsTitle: "3. Real-Time Google Sheets Sync",
      featSheetsDesc: "Instantly stream your sales to Google Sheets. Features built-in duplicate prevention and offline protection with zero egress fees.",
      
      featInventoryTitle: "4. COD Inventory & Restock Engine",
      featInventoryDesc: "Automatically decrement stock on order confirmation. Automatically restock returned or cancelled items back to your shelves, with low stock threshold alerts.",
      
      featSecurityTitle: "5. Algerian Anti-Fraud Shield",
      featSecurityDesc: "Stop fake orders and spam. Activate SMS OTP confirmation, geoblock non-Algerian IPs, filter duplicate phone numbers, and get AI fraud risk scores.",
      
      featPagesTitle: "6. Luxury Landing Page Builder",
      featPagesDesc: "High-converting templates customized for Algeria, lightweight direct checkout forms, and quantity-based volume discount pricing.",
      
      featPixelsTitle: "7. Marketing Pixels & Meta CAPI",
      featPixelsDesc: "Link Facebook, TikTok, and Snapchat pixels with native support for server-side Meta Conversions API (CAPI) to bypass ad blockers.",
      
      featWorkersTitle: "8. Staff Accounts & Call Centers",
      featWorkersDesc: "Create dedicated sub-accounts for confirmation agents and warehouse staff with restricted access permissions to keep data secure.",
      
      simTitle: "Test Live Automation in One Click",
      simDesc: "Watch how Sovi's systems interact in real-time to protect your inventory and automate your workflow.",
      simBtnOrder: "Simulate Customer Order 🛒",
      simBtnReturn: "Simulate Order Return (Restock) 🔄",
      simStatusIdle: "Waiting to launch simulation...",
      simStepCheckout: "1. Customer places an order on a luxury landing page...",
      simStepFraud: "2. Security check: Algerian IP verified ✅, no spam detected ✅",
      simStepStock: "3. Stock check: -1 item automatically decremented from inventory 📉",
      simStepSheets: "4. Google Sheets: Row written in real-time with duplicate protection 📊",
      simStepShipping: "5. Courier sync: Sent to shipping company, tracking ID generated 🚚",
      simStepDone: "✨ Simulation succeeded in 1.2s! Complete COD lifecycle automated.",
      simStepReturnStock: "1. Customer cancels order or delivery parcel is returned...",
      simStepReturnStockDone: "2. Auto Restock: Item added back to stock (+1) and Sheets status auto-updated 📈",
      
      simInvTitle: "Store Inventory Status",
      simInvProd: "Product",
      simInvStock: "Qty in Stock",
      simInvStatus: "Status",
      simInvLowAlert: "Low Stock Alert",
      
      simSheetTitle: "Google Sheets Connection (Live Stream)",
      
      calcConfirmRate: "Confirmation Rate:",
      calcDeliveryRate: "Delivery Rate (Delivery Rate):",
      calcRevenue: "Gross Revenue:",
      calcCogs: "Cost of Goods (COGS):",
      calcShipping: "Outbound Shipping Fees:",
      calcReturnCost: "Return Shipping Fees (Retour):",
      calcSavingDetail: "With Sovi's automated restock, returned parcels go back to stock. Zero product loss. Only Yalidine return fees (approx 350 DZD) apply.",
      calcProfitNet: "Expected Monthly Net Profit:",
      calcRoi: "Return on Investment (ROI):",
      
      priceTitle: "Built for Elite Merchants",
      priceDesc: "Transparent pricing designed to scale your e-commerce operations in Algeria.",
      priceStarterName: "Starter Plan",
      priceStarterPrice: "1,200 DZD / month",
      priceStarterDesc: "Ideal for launching your store and validating your first products.",
      priceProName: "Professional Plan (Pro)",
      priceProPrice: "2,500 DZD / month",
      priceProDesc: "For growing merchants looking for logistics API integrations and anti-spam filters.",
      priceMaxName: "Elite Max Plan",
      priceMaxPrice: "4,900 DZD / month",
      priceMaxDesc: "Complete unlimited features, multi-store support, and Claude AI MCP integration.",
      priceBillingMethods: "Local payment methods supported in Algeria for your convenience:",
      priceCcpBaridi: "CCP / BaridiMob",
      priceRedotpay: "Instant RedotPay transfer",
      
      ctaTitle: "Ready to scale your sales in Algeria?",
      ctaDesc: "Join hundreds of merchants who trust Sovi to automate and grow their online business.",
      ctaBtn: "Launch My Luxury Store Free"
    }
  };

  const activeCopy = copy[language as 'ar' | 'fr' | 'en'] || copy.fr;

  const featuresList = [
    {
      icon: MessageSquare,
      title: activeCopy.featAiTitle,
      desc: activeCopy.featAiDesc,
      className: "lg:col-span-2 border-amber-500/20 bg-amber-500/[0.02]"
    },
    {
      icon: Truck,
      title: activeCopy.featLogisticsTitle,
      desc: activeCopy.featLogisticsDesc,
      className: "lg:col-span-1 border-blue-500/10"
    },
    {
      icon: Layers,
      title: activeCopy.featSheetsTitle,
      desc: activeCopy.featSheetsDesc,
      className: "lg:col-span-1 border-emerald-500/10"
    },
    {
      icon: Database,
      title: activeCopy.featInventoryTitle,
      desc: activeCopy.featInventoryDesc,
      className: "lg:col-span-2 border-indigo-500/20 bg-indigo-500/[0.02]"
    },
    {
      icon: Lock,
      title: activeCopy.featSecurityTitle,
      desc: activeCopy.featSecurityDesc,
      className: "lg:col-span-1 border-rose-500/10"
    },
    {
      icon: ShoppingBag,
      title: activeCopy.featPagesTitle,
      desc: activeCopy.featPagesDesc,
      className: "lg:col-span-2 border-primary/20 bg-primary/[0.02]"
    },
    {
      icon: Globe,
      title: activeCopy.featPixelsTitle,
      desc: activeCopy.featPixelsDesc,
      className: "lg:col-span-1 border-sky-500/10"
    },
    {
      icon: Users,
      title: activeCopy.featWorkersTitle,
      desc: activeCopy.featWorkersDesc,
      className: "lg:col-span-2 border-amber-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden noise-bg bg-grid-faded">
      
      {/* Aurora mesh glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-[120px] pointer-events-none animate-aurora-fluid-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-emerald-500/5 to-transparent blur-[140px] pointer-events-none animate-aurora-fluid-2"></div>
      <div className="absolute top-[30%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/[0.02] blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-4 z-40 mx-auto max-w-7xl w-[92%] rounded-2xl border border-border bg-card/75 backdrop-blur-lg shadow-2xl transition-all duration-300 overflow-hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-8">
          <div className="flex items-center gap-4 lg:gap-8 xl:gap-12">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent tracking-widest font-outfit">Sovi</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs uppercase tracking-widest font-bold text-muted-foreground">
              <a href="#features" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300">{t('features')}</a>
              <a href="#simulator" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300">{language === 'ar' ? 'المحاكاة الحية' : (language === 'fr' ? 'Simulation Live' : 'Live Simulation')}</a>
              <a href="#calculator" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300">{t('profitCalculator')}</a>
              <a href="#pricing" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300">{language === 'ar' ? 'الخطط' : 'Tarifs'}</a>
            </nav>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm px-4 h-9 rounded-xl">{t('login')}</Button>
            </Link>
            <Link href="/register" className="inline-flex">
              <Button className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 sm:px-5 h-9 rounded-xl shadow-lg shadow-amber-500/20 border-none transition-all duration-300 hover:scale-105 btn-shimmer">
                {t('getStarted')}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/40 bg-card/90 backdrop-blur-lg px-6 py-4 space-y-4 shadow-xl text-start"
            >
              <nav className="flex flex-col gap-4 text-xs uppercase tracking-widest font-bold text-muted-foreground">
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-500 transition-colors py-2"
                >
                  {t('features')}
                </a>
                <a
                  href="#simulator"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-500 transition-colors py-2"
                >
                  {language === 'ar' ? 'المحاكاة الحية' : (language === 'fr' ? 'Simulation Live' : 'Live Simulation')}
                </a>
                <a
                  href="#calculator"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-500 transition-colors py-2"
                >
                  {t('profitCalculator')}
                </a>
                <a
                  href="#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-500 transition-colors py-2"
                >
                  {language === 'ar' ? 'الخطط' : 'Tarifs'}
                </a>
                <hr className="border-border/30" />
                
                {/* Theme and Language toggles for mobile view */}
                <div className="flex items-center justify-between py-2 border-b border-border/30 pb-3">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {language === 'ar' ? 'خيارات الواجهة' : (language === 'fr' ? 'Options d\'interface' : 'Interface Options')}
                  </span>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                </div>

                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full sm:hidden"
                >
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground text-xs rounded-xl py-3 border border-border/50">
                    {t('login')}
                  </Button>
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[10px] sm:text-xs font-bold mb-8 shadow-inner"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span>{activeCopy.heroBadge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-8 font-cairo leading-tight max-w-4xl text-foreground"
          >
            {activeCopy.heroTitleStart}
            <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent px-2">
              {language === 'ar' ? 'الجزائر' : (language === 'fr' ? 'Algérie' : 'Algeria')}
            </span>
            {activeCopy.heroTitleEnd}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground mb-12 max-w-3xl font-cairo leading-relaxed"
          >
            {activeCopy.heroDescription}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-slate-950 font-extrabold flex items-center justify-center gap-2 px-8 py-6 text-sm rounded-xl shadow-xl shadow-amber-500/10 hover:opacity-95 active:scale-95 transition-all duration-300 btn-shimmer">
                {activeCopy.createStoreNow} <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
            <a href="#calculator" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-border bg-card/40 hover:bg-card/80 text-foreground font-bold py-6 text-sm rounded-xl transition-all duration-300">
                {activeCopy.calcProfit}
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      <LiveSimulator />

      {/* Feature Showcase Grid (Sovi Elite Suite) */}
      <section id="features" className="py-24 border-t border-border bg-background relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black font-cairo text-foreground leading-tight">{activeCopy.featTitle}</h2>
            <p className="text-muted-foreground font-cairo text-sm sm:text-base">{activeCopy.featDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => (
              <Card key={i} className={`border border-border bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-amber-500/30 hover:bg-card/75 hover:shadow-2xl dark:hover:shadow-amber-500/[0.02] group ${f.className}`}>
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-300">
                    <f.icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-cairo text-foreground">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-cairo leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ProfitCalculator />

      {/* Subscription Plans & Payments Section */}
      <section id="pricing" className="py-24 border-t border-border bg-background relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black font-cairo text-foreground leading-tight">{activeCopy.priceTitle}</h2>
            <p className="text-sm text-muted-foreground font-cairo">{activeCopy.priceDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="bg-card/40 border border-border hover:border-slate-400/30 rounded-3xl p-8 flex flex-col justify-between text-start transition-all duration-300 relative">
              <div className="space-y-4">
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground font-mono">Starter Tier</span>
                <h3 className="text-2xl font-black font-cairo text-foreground">{activeCopy.priceStarterName}</h3>
                <span className="text-3xl font-black font-outfit text-amber-500 block">{activeCopy.priceStarterPrice}</span>
                <p className="text-xs sm:text-sm text-muted-foreground font-cairo leading-relaxed">{activeCopy.priceStarterDesc}</p>
                <div className="border-t border-border pt-4 space-y-2.5 text-xs text-muted-foreground font-cairo">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Up to 5 active products</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Max 1 Worker Account</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Max 2 Ad Pixels</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 200 Orders per month limit</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> All Platform Features unlocked</div>
                </div>
              </div>
              <Link href="/register" className="mt-8 block">
                <Button variant="outline" className="w-full font-bold rounded-xl h-11 border-border">{language === 'ar' ? 'سجل الآن' : 'S\'inscrire'}</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-card border border-amber-500/20 hover:border-amber-500/30 rounded-3xl p-8 flex flex-col justify-between text-start transition-all duration-300 relative shadow-lg">
              <div className="space-y-4">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono">Professional Tier</span>
                <h3 className="text-2xl font-black font-cairo text-foreground">{activeCopy.priceProName}</h3>
                <span className="text-3xl font-black font-outfit text-amber-500 block">{activeCopy.priceProPrice}</span>
                <p className="text-xs sm:text-sm text-muted-foreground font-cairo leading-relaxed">{activeCopy.priceProDesc}</p>
                <div className="border-t border-border pt-4 space-y-2.5 text-xs text-muted-foreground font-cairo">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Up to 15 active products</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Max 5 Worker Accounts</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Max 5 Ad Pixels</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> 1,000 Orders per month limit</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Custom Domain & OTP SMS Geoblock</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> All Platform Features unlocked</div>
                </div>
              </div>
              <Link href="/register" className="mt-8 block">
                <Button className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl h-11 border-none hover:bg-slate-800 dark:hover:bg-slate-700">
                  {language === 'ar' ? 'سجل في المحترف' : 'Lancer mon Plan Pro'}
                </Button>
              </Link>
            </div>

            {/* Max Plan */}
            <div className="bg-card border border-amber-500/50 rounded-3xl p-8 flex flex-col justify-between text-start transition-all duration-300 relative shadow-2xl">
              <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono">
                RECOMMENDED
              </div>
              <div className="space-y-4">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-500 font-mono">Elite Max Tier</span>
                <h3 className="text-2xl font-black font-cairo text-foreground">{activeCopy.priceMaxName}</h3>
                <span className="text-3xl font-black font-outfit text-amber-500 block">{activeCopy.priceMaxPrice}</span>
                <p className="text-xs sm:text-sm text-muted-foreground font-cairo leading-relaxed">{activeCopy.priceMaxDesc}</p>
                <div className="border-t border-border pt-4 space-y-2.5 text-xs text-muted-foreground font-cairo">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Unlimited Products & Orders</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Unlimited Staff & Ad Pixels</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Claude AI MCP Server integration</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Multi-Store management</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> Full API access</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-500" /> All Pro Features included</div>
                </div>
              </div>
              <Link href="/register" className="mt-8 block">
                <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black rounded-xl h-11 border-none hover:from-amber-500 hover:to-yellow-400 btn-shimmer">
                  {language === 'ar' ? 'سجل في الأقصى' : 'Lancer mon Plan Max'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Local payments banner */}
          <div className="mt-16 bg-card border border-border rounded-3xl p-6 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 shadow-md text-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="h-5.5 w-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground font-cairo">{activeCopy.priceBillingMethods}</h4>
                <p className="text-xs text-muted-foreground font-cairo">{language === 'ar' ? 'فواتير محلية ميسرة دون الحاجة لبطاقات ائتمان أجنبية.' : 'Facturation simplifiée en Algérie.'}</p>
              </div>
            </div>
            
            <div className="flex gap-4 font-cairo font-bold text-xs">
              <span className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                {activeCopy.priceCcpBaridi}
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                {activeCopy.priceRedotpay}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 border-t border-border bg-card/25 relative z-10">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-6xl font-black font-cairo text-foreground leading-tight">{activeCopy.ctaTitle}</h2>
            <p className="text-sm sm:text-base text-muted-foreground font-cairo max-w-2xl mx-auto leading-relaxed">{activeCopy.ctaDesc}</p>
            <div className="pt-6">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black px-10 py-6 text-base rounded-xl shadow-2xl shadow-amber-500/20 border-none btn-shimmer transition-transform hover:scale-105">
                  {activeCopy.ctaBtn}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/65 text-center text-xs sm:text-sm text-muted-foreground relative z-10 font-cairo">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Sovi E-Commerce. {t("footerRights")}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">{t("terms")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("privacy")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
