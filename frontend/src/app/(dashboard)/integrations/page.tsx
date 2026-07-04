"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import {
  FileSpreadsheet, Play, CheckCircle2, AlertCircle, Save, Sparkles, ArrowRight, Copy, Check, Info,
  Truck, Key, Loader2, ShieldCheck, DollarSign, Download
} from "lucide-react";

const STORE_MANAGEMENT_SKILL = `---
name: Store Customization & Setup
description: Assists in modifying store details, creating and editing products, setting up landing pages and page sections, and adjusting theme settings.
---

# Store Customization & Setup Skill Guide

This skill guide provides the necessary knowledge and tools reference to perform store customizations, design optimization, and catalog management for the Sovi e-commerce platform.

---

## 1. Product Catalog Management

### Product Creation and Editing
*   **Listing Products:** Use \`list_products\` to review current items. Always double-check existing SKUs and titles to avoid duplicate creations.
*   **Creating Products:** Use \`create_product\`. Ensure:
    *   \`title\` is descriptive (under 80 characters for optimal rendering).
    *   \`price\` is defined correctly. For discount structures, set \`compare_price\` higher than \`price\`.
    *   \`status\` defaults to \`draft\` so the merchant can review details before publishing.
    *   \`track_inventory\`: If set to \`true\`, ensure a valid \`stock_quantity\` is defined.

### Optimized Layout Structures
*   Sovi landing pages are built using modular section blocks (configured in \`ProductSection\`).
*   **Conversion-Optimized Layout Flow:**
    1.  **Header:** Clean, lightweight navigation.
    2.  **Hero Block:** Rich graphic header with a bold visual headline and sub-headline.
    3.  **Features Block:** Illustrates primary product benefits.
    4.  **Before/After Slider:** Crucial for cosmetic, skin care, or home cleaning products.
    5.  **Quantity Offers / Bundles:** Incentivizes higher average order value (e.g., *"Buy 2, Get 1 Free"*).
    6.  **Checkout Form:** Embedded order form at the bottom to maximize convenience.

---

## 2. Store Theme & Layout Customization

### Editing Themes
*   Use \`get_theme_settings\` to retrieve the current visual configurations.
*   Use \`update_theme_settings\` to adjust styling properties.
*   **Branding Guidelines:**
    *   **Cairo Font:** Used by default for Arabic elements. Make sure typography aligns correctly (Arabic reads RTL; French/English read LTR).
    *   Avoid plain/generic HTML colors. Use luxury palettes (e.g., deep amber \`#d97706\`, elegant green \`#047857\`, and modern slate accents).
    *   Keep mobile grids responsive. Always favor stacked grids (\`grid-cols-1 sm:grid-cols-2\`) on mobile layout settings.
`;

const MARKETING_ANALYTICS_SKILL = `---
name: Storefront Conversion & Analytics Integration
description: Guides integrating tracking pixels (Facebook/TikTok/Snapchat), managing Conversions API (CAPI) events, configuring Google Sheets sync, setting up high-converting product copies, and providing analytics.
---

# Storefront Conversion & Analytics Integration Guide

This guide details how to help merchants maximize their sales conversion rates, set up ad tracking (Pixels/CAPI), and generate/analyze store performance stats.

---

## 1. Pixel and Conversions API (CAPI) Tracking

### Meta CAPI Payload Matching
To maximize the Meta Event Match Quality Score (aiming for 8.5+ out of 10), CAPI events must send enriched, hashed user details.
*   **Browser/Server Deduplication:** Always ensure the browser pixel event and the server-side Conversions API event carry the exact same \`event_id\` payload.
*   **Hashed Parameters Checklist:**
    *   \`ph\`: Hashed Phone Number (always normalized to standard Algerian format: prepend country code \`213\` and drop leading \`0\`).
    *   \`fn\`: Hashed First Name.
    *   \`ln\`: Hashed Last Name.
    *   \`ct\`: Hashed City (Wilaya name in Arabic or French).
    *   \`st\`: Hashed State/Province (Wilaya name).
    *   \`country\`: Hashed country (always \`dz\` for Algerian stores).

### Pixel Management
*   Pixels can be set globally (whole storefront) or customized to trigger only on specific product pages.
*   Support Platforms: \`meta\` (Meta/Facebook), \`tiktok\` (TikTok Pixel), \`snapchat\` (Snapchat Pixel).

---

## 2. Marketing & Sales Conversion Copywriting

### Copywriting Hooks & Branding
*   **The Hook:** Start landing pages with a clear pain-point resolution (e.g., *"Say goodbye to back pain while sleeping"*).
*   **Urgency & Trust Elements:**
    *   Incorporate trust badges (e.g., *Free delivery in Algiers*, *Cash on delivery in 58 Wilayas*, *100% money back guarantee*).
    *   Include bundle offers with automatic pricing calculations.
*   **Pre-Submit Lead Capture:**
    *   Explain to merchants how Sovi automatically captures customer phone numbers the moment they enter them in the form—even if they abandon checkout. This data is stored as an **Abandoned Lead** to allow immediate follow-ups.

---

## 3. Analytics & Statistics
*   Explain the order conversion funnel to merchants:
    \`Landings -> ViewContent -> InitiateCheckout (Lead) -> Purchase (COD Order) -> Delivered\`
*   Assess Wilaya-specific performance. Help merchants determine which Algerian Wilayas yield the highest delivery ratios so they can optimize ad target locations.
`;

const OPERATIONS_SECURITY_SKILL = `---
name: Store Operations & Fraud Prevention
description: Instructions on managing orders, tracking shipments (Yalidine/ZR), configuring security rate limits, OTP checkouts, and managing team workers permissions.
---

# Store Operations & Fraud Prevention Guide

This guide describes standard operational workflows, shipment tracking automation, and security setup for store protection.

---

## 1. Order Lifecycle & Status Management

### COD Order Statuses
Merchants process Cash on Delivery (COD) orders via the following standard statuses:
*   \`new\`: Order newly created.
*   \`no_answer\`, \`no_answer_1\`, \`no_answer_2\`, \`no_answer_3\`: Client did not answer phone confirmation calls.
*   \`postponed\`: Client requested to postpone delivery.
*   \`confirmed\`: Order confirmed by call center agent.
*   \`prepared\`: Order packed and ready for shipping.
*   \`shipped\`: Handed over to Yalidine or ZR Express.
*   \`delivered\`: Package successfully delivered and paid.
*   \`returned\`: Package returned back to store inventory (*Retour*).
*   \`cancelled\`: Order cancelled by customer/merchant.

### Automatic Yalidine Status Sync
*   Sovi has a built-in background sync worker that polls Yalidine status updates automatically every 2 hours.
*   The worker moves packages through (*In Transit -> Out for Delivery -> Delivered / Returned*) and instantly updates the status column in the merchant's **Google Sheet**.

---

## 2. Store Security & Anti-Fraud Settings

To prevent fake orders and spam from competitor bots, Sovi provides several security tools:
*   **Phone Number Format Validation:** Automatically checks that the input is a valid Algerian mobile number format (\`05\`, \`06\`, \`07\`, or \`213\` prefix).
*   **Firebase SMS OTP Verification:** Requires verification code authentication before checkout is submitted.
*   **Google reCAPTCHA v3:** Blocks automated bots by analyzing user interaction scores.
*   **IP-Based Rate Limiting:** Limits the number of checkout orders allowed per day from a single IP address.
*   **Algerian IP Lock:** Blocks non-Algerian IP addresses from placing orders.

---

## 3. Team Workers & Access Permissions
*   Merchants can create worker profiles (call center, packagers, admins) to delegate tasks.
*   Ensure workers are granted limited scopes (e.g., call centers can only view orders and update statuses; they shouldn't edit product prices or delete theme layouts).
`;

interface IntegrationsProps {
  storeId?: string;
  storeSubdomain?: string;
}

export default function IntegrationsDashboard({ storeId }: IntegrationsProps) {
  const { selectedStore } = useDashboardStore();
  const { t, isRtl } = useLanguageStore();
  const currentStoreId = storeId || selectedStore?.id;

  const downloadSkill = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${name}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<"sheets" | "telegram" | "claude" | "delivery">("sheets");

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Orders");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [syncOnCreate, setSyncOnCreate] = useState(true);

  // Claude AI state
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [claudeIsActive, setClaudeIsActive] = useState(false);
  const [claudeAutoFraudCheck, setClaudeAutoFraudCheck] = useState(false);
  const [claudeAutoDraftReplies, setClaudeAutoDraftReplies] = useState(false);
  const [claudeAutoProductCopy, setClaudeAutoProductCopy] = useState(false);
  const [claudeSystemPrompt, setClaudeSystemPrompt] = useState("");
  const [claudeId, setClaudeId] = useState("");
  const [copiedMcpUrl, setCopiedMcpUrl] = useState(false);

  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingClaude, setLoadingClaude] = useState(false);
  const [testing, setTesting] = useState(false);
  const [successSheets, setSuccessSheets] = useState("");
  const [errorSheets, setErrorSheets] = useState("");
  const [successClaude, setSuccessClaude] = useState("");
  const [errorClaude, setErrorClaude] = useState("");

  // Telegram state
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramIsActive, setTelegramIsActive] = useState(false);
  const [telegramSendOnCreate, setTelegramSendOnCreate] = useState(true);
  const [telegramSendOnStatusChange, setTelegramSendOnStatusChange] = useState(false);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [successTelegram, setSuccessTelegram] = useState("");
  const [errorTelegram, setErrorTelegram] = useState("");

  // Delivery companies state
  const [companies, setCompanies] = useState<any[]>([]);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [credLoading, setCredLoading] = useState(false);
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");

  // Construct MCP Server URL using NEXT_PUBLIC_API_URL if available, else fallback to window.location
  const mcpServerUrl = (() => {
    let apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase && typeof window !== "undefined") {
      apiBase = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ":" + window.location.port : ""}/api`;
    }
    const cleanBase = apiBase ? (apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase) : "";
    return `${cleanBase}/integrations/${currentStoreId}/mcp/sse/${claudeId}/`;
  })();

  // Multilingual local translations for Claude Card
  const claudeLabels = {
    title: isRtl ? "مساعد الذكاء الاصطناعي (Claude Connector)" : "Claude AI Connector (MCP)",
    desc: isRtl ? "اربط متجرك مع Claude كـ Connector للوصول إلى المنتجات والطلبيات وإجراء المهام تلقائياً." : "Connect Claude directly to your store's data and tools via the Model Context Protocol.",
    apiKey: isRtl ? "مفتاح API الخاص بـ Anthropic" : "Anthropic API Key",
    apiKeyDesc: isRtl ? "أدخل مفتاح API الخاص بك (sk-ant-...) لتفعيل الاتصال." : "Enter your API key (sk-ant-...) to activate connection.",
    enableClaude: isRtl ? "تفعيل اتصال Claude (MCP)" : "Enable Claude Connector",
    fraudCheck: isRtl ? "الفحص التلقائي للطلبات الاحتيالية (السبام)" : "Auto Fraud Check (flag suspicious orders)",
    draftReplies: isRtl ? "تجهيز مسودات تأكيد الطلبات تلقائياً" : "Auto Draft Order Replies",
    productCopy: isRtl ? "تحسين أوصاف المنتجات وترجمتها تلقائياً" : "Auto Product SEO Copywriter",
    sysPrompt: isRtl ? "التوجيهات العامة للمساعد (System Prompt)" : "General System Prompt Instructions",
    saveSuccess: isRtl ? "تم حفظ إعدادات Claude بنجاح!" : "Claude configuration saved successfully!",
    saveError: isRtl ? "فشل حفظ إعدادات Claude." : "Failed to save Claude configuration.",
    mcpTitle: isRtl ? "رابط خادم MCP الخاص بك" : "Your Remote MCP Server URL",
    mcpDesc: isRtl ? "انسخ هذا الرابط والصقه في واجهة كلوود (Claude.ai > Settings > Connectors > Add custom connector):" : "Copy this URL and paste it into Claude (Claude.ai > Settings > Connectors > Add custom connector):",
    copied: isRtl ? "تم النسخ!" : "Copied!",
    copy: isRtl ? "نسخ الرابط" : "Copy URL",
    instructionsTitle: isRtl ? "طريقة الربط مع Claude.ai" : "How to Connect with Claude.ai",
    step1: isRtl ? "1. افتح حسابك في Claude.ai واذهب إلى الإعدادات (Settings)." : "1. Open your Claude.ai account and go to Settings.",
    step2: isRtl ? "2. ضمن قسم 'Connectors'، اضغط على 'Add custom connector'." : "2. Under 'Connectors', click on 'Add custom connector'.",
    step3: isRtl ? "3. أدخل اسماً مناسباً (مثال: Sovi Store) والصق رابط خادم MCP أعلاه." : "3. Enter a name (e.g., 'Sovi Store') and paste the Remote MCP server URL above.",
    step4: isRtl ? "4. اضغط على حفظ (Save) ليتم ربط كلوود بنجاح بمنتجاتك وأدوات متجرك." : "4. Click Save to successfully link Claude with your store tools.",
    step5: isRtl ? "5. قم بتحميل ملفات المهارات (Claude Skills) أدناه وارفعها في قسم 'Custom Instructions' أو ملف تعريف المشروع (Project Custom Instructions) في Claude ليصبح ذكياً ومحترفاً في إدارة متجرك." : "5. Download the custom Claude Skill files below and upload them to your Claude Project's custom instructions to train the AI to handle your store operations perfectly."
  };

  const telegramLabels = {
    title: isRtl ? "إشعارات تليجرام للطلبيات" : "Telegram Orders Notifications",
    desc: isRtl 
      ? "تلقي إشعارات فورية على تطبيق تليجرام عند تسجيل طلب جديد أو تغيير حالته." 
      : "Receive real-time notifications on Telegram when a new order is created or updated.",
    chatId: isRtl ? "معرف المحادثة (Chat ID)" : "Telegram Chat ID",
    chatIdPlaceholder: "مثال: 987654321",
    chatIdDesc: isRtl 
      ? "أدخل معرف المحادثة الشخصية (Chat ID) لتلقي الإشعارات." 
      : "Enter your personal Telegram Chat ID to receive notifications.",
    isActive: isRtl ? "تفعيل إشعارات تليجرام" : "Enable Telegram Notifications",
    sendOnCreate: isRtl ? "إرسال إشعار عند تلقي طلب جديد" : "Send notification on new order",
    sendOnStatusChange: isRtl ? "إرسال إشعار عند تغيير حالة الطلب" : "Send notification on order status change",
    saveSuccess: isRtl ? "تم حفظ إعدادات تليجرام بنجاح!" : "Telegram configuration saved successfully!",
    saveError: isRtl ? "فشل حفظ إعدادات تليجرام." : "Failed to save Telegram configuration.",
    testSuccess: isRtl ? "تم إرسال رسالة تجريبية بنجاح إلى تليجرام!" : "Test message sent successfully to Telegram!",
    testError: isRtl ? "فشل إرسال الرسالة التجريبية. يرجى التحقق من معرف المحادثة (Chat ID) والتأكد من بدء المحادثة مع البوت." : "Failed to send test message. Please verify Chat ID and ensure you have started a chat with the bot.",
    testBtn: isRtl ? "إرسال رسالة تجريبية" : "Send Test Message",
    testingBtn: isRtl ? "جاري الإرسال..." : "Sending Test...",
    instructionsTitle: isRtl ? "كيفية الحصول على معرف المحادثة (Chat ID)" : "How to Get Your Telegram Chat ID",
    step1: isRtl 
      ? "1. افتح تطبيق تليجرام وابحث عن البوت الرسمي للمنصة: @SoviNotificationsBot ثم اضغط على زر Start (ابدأ). هذا الإجراء ضروري ليتمكن البوت من مراسلتك." 
      : "1. Open Telegram, search for our official platform bot: @SoviNotificationsBot and click Start. This allows the bot to send you messages.",
    step2: isRtl 
      ? "2. ابحث عن بوت معرفات الحسابات مثل @GetIdsBot أو @userinfobot ثم اضغط على زر Start (ابدأ). سيعطيك فوراً رقم معرفك الشخصي (مثال: 584930219)." 
      : "2. Search for an ID helper bot such as @GetIdsBot or @userinfobot and click Start. It will instantly display your Telegram Chat ID (e.g., 584930219).",
    step3: isRtl 
      ? "3. انسخ رقم معرف المحادثة (Chat ID) هذا، وأدخله في الحقل أدناه ثم احفظ الإعدادات." 
      : "3. Copy that Chat ID number, paste it into the field below, and save the settings.",
  };

  useEffect(() => {
    if (currentStoreId) {
      // Fetch Google Sheets configs
      api.get(`/integrations/${currentStoreId}/google-sheets/`)
        .then((res) => {
          const d = res.data;
          setSpreadsheetId(d.spreadsheet_id || "");
          setSheetName(d.sheet_name || "Orders");
          setCredentialsJson(d.credentials_json || "");
          setIsActive(d.is_active || false);
          setSyncOnCreate(d.sync_on_create || false);
        })
        .catch(() => {});

      // Fetch Claude config
      api.get(`/integrations/${currentStoreId}/claude/`)
        .then((res) => {
          const d = res.data;
          setClaudeId(d.id || "");
          setClaudeApiKey(d.api_key || "");
          setClaudeIsActive(d.is_active || false);
          setClaudeAutoFraudCheck(d.auto_fraud_check || false);
          setClaudeAutoDraftReplies(d.auto_draft_replies || false);
          setClaudeAutoProductCopy(d.auto_product_copy || false);
          setClaudeSystemPrompt(d.system_prompt || "");
        })
        .catch(() => {});

      // Fetch Telegram config
      api.get(`/integrations/${currentStoreId}/telegram/`)
        .then((res) => {
          const d = res.data;
          setTelegramChatId(d.chat_id || "");
          setTelegramIsActive(d.is_active || false);
          setTelegramSendOnCreate(d.send_on_create ?? true);
          setTelegramSendOnStatusChange(d.send_on_status_change || false);
        })
        .catch(() => {});
    }
  }, [currentStoreId]);

  // Load delivery credentials when tab switches to delivery
  useEffect(() => {
    if (!currentStoreId || activeTab !== "delivery") return;
    setCredLoading(true);
    setCredError("");
    Promise.all([
      api.get("/delivery/companies/"),
      api.get(`/delivery/${currentStoreId}/configs/`)
    ]).then(([companiesRes, configsRes]) => {
      const activeCompanies = (companiesRes.data || []).filter((c: any) => c.name !== 'manual');
      setCompanies(activeCompanies);
      
      const configMap: Record<string, any> = {};
      const configData = Array.isArray(configsRes.data) ? configsRes.data : (configsRes.data?.results ?? []);
      for (const config of configData) {
        configMap[config.company] = config;
      }
      setConfigs(configMap);
    }).catch(() => {
      setCredError(t("deliveryCredError") || "Failed to load company configurations.");
    }).finally(() => {
      setCredLoading(false);
    });
  }, [currentStoreId, activeTab, t]);

  const handleConfigChange = (companyId: string, field: string, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [companyId]: {
        ...(prev[companyId] || { company: companyId }),
        [field]: value
      }
    }));
  };

  const handleSaveCompanyConfig = async (companyId: string) => {
    if (!currentStoreId) return;
    setSavingCompanyId(companyId);
    setCredSuccess("");
    setCredError("");
    
    const config = configs[companyId] || { company: companyId };
    const payload = {
      company: companyId,
      api_key: config.api_key || "",
      api_secret: config.api_secret || "",
      api_id: config.api_id || "",
      is_active: config.is_active ?? false,
      is_default: config.is_default ?? false,
      webhook_url: config.webhook_url || ""
    };
    
    try {
      if (config.id) {
        const res = await api.put(`/delivery/${currentStoreId}/configs/${config.id}/`, payload);
        setConfigs((prev) => ({
          ...prev,
          [companyId]: res.data
        }));
      } else {
        const res = await api.post(`/delivery/${currentStoreId}/configs/`, payload);
        setConfigs((prev) => ({
          ...prev,
          [companyId]: res.data
        }));
      }
      setCredSuccess(t("deliveryCredSuccess") || "Configuration saved successfully.");
      setTimeout(() => setCredSuccess(""), 4000);
    } catch {
      setCredError(t("deliveryCredError") || "Failed to save configuration.");
      setTimeout(() => setCredError(""), 4000);
    } finally {
      setSavingCompanyId(null);
    }
  };

  const applyCompanyDefaultPricing = async (companyName: string) => {
    if (!currentStoreId) return;
    setCredLoading(true);
    setCredSuccess("");
    setCredError("");
    
    try {
      const res = await api.get(`/delivery/${currentStoreId}/pricing/`);
      const pricingData = res.data || [];
      
      const central = [9, 16, 15, 10, 26, 35, 42, 44, 2];
      const western = [13, 14, 20, 22, 27, 29, 31, 46, 48];
      const southern = [1, 3, 8, 11, 30, 32, 33, 37, 45, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];
      
      const getPrices = (code: number): { home: number; desk: number } => {
        let home = 600;
        let desk = 400;
        const name = companyName.toLowerCase();
        if (name.includes("yalidine")) {
          if (central.includes(code)) { home = 450; }
          else if (southern.includes(code)) { home = 800; }
          else { home = 650; }
          desk = home - 200;
        } else if (name.includes("zr")) {
          if (central.includes(code)) { home = 400; }
          else if (southern.includes(code)) { home = 800; }
          else { home = 600; }
          desk = home - 150;
        } else if (name.includes("noest")) {
          if (central.includes(code)) { home = 500; }
          else if (southern.includes(code)) { home = 900; }
          else { home = 700; }
          desk = home - 200;
        } else if (name.includes("maystro")) {
          if (central.includes(code)) { home = 400; }
          else if (southern.includes(code)) { home = 850; }
          else { home = 600; }
          desk = home - 150;
        } else if (name.includes("dhd")) {
          if (central.includes(code)) { home = 450; }
          else if (southern.includes(code)) { home = 800; }
          else { home = 650; }
          desk = home - 200;
        } else if (name.includes("gupex") || name.includes("guepex")) {
          if (central.includes(code)) { home = 400; }
          else if (southern.includes(code)) { home = 900; }
          else { home = 600; }
          desk = home - 150;
        } else if (name.includes("yaliteck")) {
          if (central.includes(code)) { home = 450; }
          else if (southern.includes(code)) { home = 800; }
          else { home = 650; }
          desk = home - 200;
        } else if (name.includes("flash")) {
          if (central.includes(code)) { home = 350; }
          else if (southern.includes(code)) { home = 750; }
          else { home = 550; }
          desk = home - 150;
        } else {
          if (central.includes(code)) { home = 400; }
          else if (southern.includes(code)) { home = 800; }
          else { home = 600; }
          desk = home - 200;
        }
        return { home, desk: Math.max(0, desk) };
      };

      const updatedPricing = pricingData.map((w: any) => {
        const code = w.wilaya_code ?? w.code ?? 0;
        const { home, desk } = getPrices(code);
        return {
          id: w.id,
          home_price: home,
          desk_price: desk,
          is_active: w.is_active,
        };
      });

      await api.put(`/delivery/${currentStoreId}/pricing/bulk/`, { pricing: updatedPricing });
      setCredSuccess(isRtl ? `✅ تم تطبيق أسعار شحن ${companyName} بنجاح!` : `✅ Applied ${companyName} default shipping rates!`);
      setTimeout(() => setCredSuccess(""), 4000);
    } catch (err) {
      setCredError(isRtl ? "فشل تطبيق أسعار الشحن الافتراضية." : "Failed to apply default shipping rates.");
      setTimeout(() => setCredError(""), 4000);
    } finally {
      setCredLoading(false);
    }
  };

  const handleSaveSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessSheets("");
    setErrorSheets("");
    setLoadingSheets(true);

    try {
      await api.put(`/integrations/${currentStoreId}/google-sheets/`, {
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        credentials_json: credentialsJson,
        is_active: isActive,
        sync_on_create: syncOnCreate,
      });
      setSuccessSheets(t("integrationsSaveSuccess"));
    } catch (err) {
      setErrorSheets(t("integrationsSaveError"));
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSaveClaude = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessClaude("");
    setErrorClaude("");
    setLoadingClaude(true);

    try {
      const res = await api.put(`/integrations/${currentStoreId}/claude/`, {
        api_key: claudeApiKey,
        is_active: claudeIsActive,
        auto_fraud_check: claudeAutoFraudCheck,
        auto_draft_replies: claudeAutoDraftReplies,
        auto_product_copy: claudeAutoProductCopy,
        system_prompt: claudeSystemPrompt,
      });
      setClaudeId(res.data.id || "");
      setSuccessClaude(claudeLabels.saveSuccess);
    } catch (err) {
      setErrorClaude(claudeLabels.saveError);
    } finally {
      setLoadingClaude(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessTelegram("");
    setErrorTelegram("");
    setLoadingTelegram(true);

    try {
      await api.put(`/integrations/${currentStoreId}/telegram/`, {
        chat_id: telegramChatId,
        is_active: telegramIsActive,
        send_on_create: telegramSendOnCreate,
        send_on_status_change: telegramSendOnStatusChange,
      });
      setSuccessTelegram(telegramLabels.saveSuccess);
    } catch (err) {
      setErrorTelegram(telegramLabels.saveError);
    } finally {
      setLoadingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setSuccessTelegram("");
    setErrorTelegram("");
    setTestingTelegram(true);

    try {
      const res = await api.post(`/integrations/${currentStoreId}/telegram/test/`);
      setSuccessTelegram(res.data.message || telegramLabels.testSuccess);
    } catch (err: any) {
      setErrorTelegram(err.response?.data?.error || telegramLabels.testError);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestConnection = async () => {
    setSuccessSheets("");
    setErrorSheets("");
    setTesting(true);

    try {
      const res = await api.post(`/integrations/${currentStoreId}/google-sheets/test/`);
      setSuccessSheets(res.data.message || t("integrationsTestSuccess"));
    } catch (err: any) {
      setErrorSheets(err.response?.data?.error || t("integrationsTestError"));
    } finally {
      setTesting(false);
    }
  };

  // Toggle is_active via custom styled switch
  const ToggleIcon = ({ active, onChange }: { active: boolean; onChange: (checked: boolean) => void }) => (
    <div 
      onClick={() => onChange(!active)}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 cursor-pointer ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${active ? "translate-x-5" : "translate-x-0"}`} />
    </div>
  );

  return (
    <div 
      className={`space-y-8 text-foreground ${isRtl ? "font-cairo text-right" : "font-sans text-left"}`} 
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("integrationsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("integrationsDesc")}</p>
        </div>
      </div>

      {/* Subsections Navigation Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("sheets")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
            activeTab === "sheets"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5 scale-[1.02]"
              : "border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{isRtl ? "جداول جوجل (Google Sheets)" : "Google Sheets"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("telegram")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
            activeTab === "telegram"
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-md shadow-sky-500/5 scale-[1.02]"
              : "border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.65-.52.36-.99.53-1.4.52-.46-.01-1.34-.26-2-.47-.8-.26-1.43-.4-1.38-.85.03-.24.36-.48.99-.74 3.89-1.69 6.49-2.8 7.8-3.32 3.71-1.48 4.48-1.74 4.98-1.75.11 0 .36.03.52.16.14.11.18.26.2.37.02.1.03.3.01.44z" />
          </svg>
          <span>{isRtl ? "إشعارات تليجرام (Telegram)" : "Telegram Alerts"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("claude")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
            activeTab === "claude"
              ? "bg-accent/10 border-accent/30 text-accent shadow-md shadow-accent/5 scale-[1.02]"
              : "border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>{isRtl ? "مساعد كلوود (Claude AI)" : "Claude AI"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
            activeTab === "delivery"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5 scale-[1.02]"
              : "border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>{isRtl ? "شركات التوصيل (Logistics)" : "Delivery Companies"}</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {activeTab === "sheets" && (
          <form onSubmit={handleSaveSheets} className="space-y-6 animate-fade-in-up">
            {successSheets && (
              <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <CheckCircle2 className="h-5 w-5" />
                <span>{successSheets}</span>
              </div>
            )}

            {errorSheets && (
              <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <AlertCircle className="h-5 w-5" />
                <span>{errorSheets}</span>
              </div>
            )}

            <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
              <CardHeader className={`border-b border-border ${isRtl ? "text-right" : "text-left"}`}>
                <CardTitle className={`text-xl font-bold flex items-center gap-2 text-primary ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <FileSpreadsheet className="h-5 w-5" /> {t("integrationsCardTitle")}
                </CardTitle>
                <CardDescription>{t("integrationsCardDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t("integrationsSpreadsheetIdLabel")}</label>
                  <Input
                    placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className={`font-outfit ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                  />
                  <p className="text-xs text-muted-foreground">{t("integrationsSpreadsheetIdDesc")}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t("integrationsSheetNameLabel")}</label>
                  <Input
                    placeholder="Orders"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className={`${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t("integrationsCredentialsLabel")}</label>
                  <textarea
                    placeholder='{ "type": "service_account", ... }'
                    value={credentialsJson}
                    onChange={(e) => setCredentialsJson(e.target.value)}
                    className="flex min-h-[150px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none font-outfit text-left custom-scrollbar"
                  />
                  <p className="text-xs text-muted-foreground">{t("integrationsCredentialsDesc")}</p>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border ${isRtl ? "text-right" : "text-left"}`}>
                  <label className={`flex items-center gap-2 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{t("integrationsActiveSync")}</span>
                  </label>

                  <label className={`flex items-center gap-2 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                    <input
                      type="checkbox"
                      checked={syncOnCreate}
                      onChange={(e) => setSyncOnCreate(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{t("integrationsSyncOnCreate")}</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className={`flex justify-between items-center ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !spreadsheetId}
                variant="outline"
                className={`flex items-center gap-2 border-border hover:bg-muted/10 text-xs font-bold ${isRtl ? "flex-row" : "flex-row-reverse"}`}
              >
                <Play className="h-4 w-4" /> {testing ? t("integrationsTestingBtn") : t("integrationsTestBtn")}
              </Button>

              <Button type="submit" disabled={loadingSheets} variant="outline" className={`flex items-center gap-2 border-border font-bold text-xs ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <Save className="h-4 w-4" /> {loadingSheets ? t("deliverySaving") : t("integrationsSaveBtn")}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "telegram" && (
          <form onSubmit={handleSaveTelegram} className="space-y-6 animate-fade-in-up">
            {successTelegram && (
              <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <CheckCircle2 className="h-5 w-5" />
                <span>{successTelegram}</span>
              </div>
            )}

            {errorTelegram && (
              <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <AlertCircle className="h-5 w-5" />
                <span>{errorTelegram}</span>
              </div>
            )}

            <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
              <CardHeader className={`border-b border-border ${isRtl ? "text-right" : "text-left"}`}>
                <CardTitle className={`text-xl font-bold flex items-center gap-2 text-sky-400 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <svg className="h-5 w-5 text-sky-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.65-.52.36-.99.53-1.4.52-.46-.01-1.34-.26-2-.47-.8-.26-1.43-.4-1.38-.85.03-.24.36-.48.99-.74 3.89-1.69 6.49-2.8 7.8-3.32 3.71-1.48 4.48-1.74 4.98-1.75.11 0 .36.03.52.16.14.11.18.26.2.37.02.1.03.3.01.44z" />
                  </svg>
                  {telegramLabels.title}
                </CardTitle>
                <CardDescription>{telegramLabels.desc}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* How to get Chat ID Instructions */}
                <div className={`p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 space-y-3 shadow-sm ${isRtl ? "text-right" : "text-left"}`}>
                  <h4 className="text-xs font-extrabold flex items-center gap-2 text-sky-400">
                    <Info className="h-4 w-4 text-sky-400 flex-shrink-0" />
                    <span>{telegramLabels.instructionsTitle}</span>
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p>{telegramLabels.step1}</p>
                    <p>{telegramLabels.step2}</p>
                    <p>{telegramLabels.step3}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{telegramLabels.chatId}</label>
                  <Input
                    placeholder={telegramLabels.chatIdPlaceholder}
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className={`font-outfit ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                  />
                  <p className="text-xs text-muted-foreground">{telegramLabels.chatIdDesc}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <label className="text-sm font-bold block">{t("settingsOptions")}</label>
                  
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={telegramIsActive}
                        onChange={(e) => setTelegramIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{telegramLabels.isActive}</span>
                    </label>

                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={telegramSendOnCreate}
                        onChange={(e) => setTelegramSendOnCreate(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{telegramLabels.sendOnCreate}</span>
                    </label>

                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={telegramSendOnStatusChange}
                        onChange={(e) => setTelegramSendOnStatusChange(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{telegramLabels.sendOnStatusChange}</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className={`flex justify-between items-center ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram || !telegramChatId}
                variant="outline"
                className={`flex items-center gap-2 border-border hover:bg-muted/10 text-xs font-bold ${isRtl ? "flex-row" : "flex-row-reverse"}`}
              >
                <Play className="h-4 w-4" /> {testingTelegram ? telegramLabels.testingBtn : telegramLabels.testBtn}
              </Button>

              <Button type="submit" disabled={loadingTelegram} variant="outline" className={`flex items-center gap-2 border-border font-bold text-xs ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <Save className="h-4 w-4" /> {loadingTelegram ? t("deliverySaving") : t("integrationsSaveBtn")}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "claude" && (
          <form onSubmit={handleSaveClaude} className="space-y-6">
            {successClaude && (
              <div className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <CheckCircle2 className="h-5 w-5" />
                <span>{successClaude}</span>
              </div>
            )}

            {errorClaude && (
              <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse justify-end"}`}>
                <AlertCircle className="h-5 w-5" />
                <span>{errorClaude}</span>
              </div>
            )}

            <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
              <CardHeader className={`border-b border-border ${isRtl ? "text-right" : "text-left"}`}>
                <CardTitle className={`text-xl font-bold flex items-center gap-2 text-accent ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" /> {claudeLabels.title}
                </CardTitle>
                <CardDescription>{claudeLabels.desc}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{claudeLabels.apiKey}</label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    className={`font-outfit ${isRtl ? "pr-3 text-right" : "pl-3 text-left"}`}
                  />
                  <p className="text-xs text-muted-foreground">{claudeLabels.apiKeyDesc}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <label className="text-sm font-bold block">{t("settingsOptions")}</label>
                  
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={claudeIsActive}
                        onChange={(e) => setClaudeIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{claudeLabels.enableClaude}</span>
                    </label>

                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={claudeAutoFraudCheck}
                        onChange={(e) => setClaudeAutoFraudCheck(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{claudeLabels.fraudCheck}</span>
                    </label>

                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={claudeAutoDraftReplies}
                        onChange={(e) => setClaudeAutoDraftReplies(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{claudeLabels.draftReplies}</span>
                    </label>

                    <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-semibold ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                      <input
                        type="checkbox"
                        checked={claudeAutoProductCopy}
                        onChange={(e) => setClaudeAutoProductCopy(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{claudeLabels.productCopy}</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  <label className="text-sm font-semibold">{claudeLabels.sysPrompt}</label>
                  <textarea
                    placeholder="You are Claude, a helpful AI store assistant..."
                    value={claudeSystemPrompt}
                    onChange={(e) => setClaudeSystemPrompt(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none custom-scrollbar"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end animate-fade-in">
              <Button type="submit" disabled={loadingClaude} variant="glow" className={`flex items-center gap-2 font-bold text-xs ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                <Save className="h-4 w-4" /> {loadingClaude ? t("deliverySaving") : t("integrationsSaveBtn")}
              </Button>
            </div>

            {/* 3. Remote MCP Connector Details */}
            {claudeIsActive && claudeId && (
              <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl mt-6 animate-fade-in-up">
                <CardHeader className={`border-b border-border ${isRtl ? "text-right" : "text-left"}`}>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 text-accent animate-pulse" /> {claudeLabels.mcpTitle}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{claudeLabels.mcpDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={mcpServerUrl}
                      className="font-outfit bg-muted/20 border-border text-foreground flex-1 select-all text-xs"
                    />
                    <Button
                      type="button"
                      variant="glow"
                      onClick={() => {
                        navigator.clipboard.writeText(mcpServerUrl);
                        setCopiedMcpUrl(true);
                        setTimeout(() => setCopiedMcpUrl(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-4 font-bold text-xs"
                    >
                      {copiedMcpUrl ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>{claudeLabels.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>{claudeLabels.copy}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className={`p-4 rounded-xl bg-primary/5 border border-border space-y-3 ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-xs font-extrabold flex items-center gap-2 text-foreground">
                      <Info className="h-4.5 w-4.5 text-accent flex-shrink-0" />
                      <span>{claudeLabels.instructionsTitle}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed list-none pl-0">
                      <li>{claudeLabels.step1}</li>
                      <li>{claudeLabels.step2}</li>
                      <li>{claudeLabels.step3}</li>
                      <li>{claudeLabels.step4}</li>
                      <li className="font-semibold text-accent">{claudeLabels.step5}</li>
                    </ul>
                  </div>

                  <div className={`p-5 rounded-xl bg-accent/5 border border-border space-y-4 ${isRtl ? "text-right" : "text-left"}`}>
                    <h4 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4.5 w-4.5 text-accent flex-shrink-0 animate-pulse" />
                      <span>{isRtl ? "تحميل مهارات كلوود المخصصة (Claude Skills)" : "Download Claude Custom Skills"}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRtl 
                        ? "قم بتحميل هذه الملفات ورفعها إلى مشروع كلوود الخاص بك (Claude Projects) لتوجيه المساعد الذكي حول كيفية إدارة المخزون والتسويق وتحليل الطلبيات بدقة عالية."
                        : "Download these skill files and upload them to your Claude Project or custom instructions to guide the AI assistant on managing inventory, marketing, and order lifecycle logistics."}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-[11px] font-bold py-2 h-auto flex items-center gap-1.5 justify-center hover:bg-primary/10 border-border"
                        onClick={() => downloadSkill("store_management", STORE_MANAGEMENT_SKILL)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isRtl ? "مهارة إدارة المتجر والمنتجات" : "Store Management Skill"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-[11px] font-bold py-2 h-auto flex items-center gap-1.5 justify-center hover:bg-primary/10 border-border"
                        onClick={() => downloadSkill("marketing_analytics", MARKETING_ANALYTICS_SKILL)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isRtl ? "مهارة التسويق وحسابات بكسل" : "Marketing & Pixels Skill"}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-[11px] font-bold py-2 h-auto flex items-center gap-1.5 justify-center hover:bg-primary/10 border-border"
                        onClick={() => downloadSkill("operations_security", OPERATIONS_SECURITY_SKILL)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isRtl ? "مهارة العمليات واللوجستيات" : "Operations & Security Skill"}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        )}

        {activeTab === "delivery" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Info Banner */}
            <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm flex items-start gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
              <Truck className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold block">{t("deliveryCredInfoTitle")}</span>
                <span className="text-xs text-muted-foreground block mt-1">
                  {t("deliveryCredInfoDesc")}
                </span>
              </div>
            </div>

            {credSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> {credSuccess}
              </div>
            )}
            {credError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> {credError}
              </div>
            )}

            {credLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">{t("deliveryCredLoading")}</span>
              </div>
            ) : (
              (() => {
                const activeList = companies.filter((c) => configs[c.id]?.is_active === true);
                const inactiveList = companies.filter((c) => configs[c.id]?.is_active !== true);

                const renderCompanyCard = (c: any) => {
                  const config = configs[c.id] || {};
                  const isSaving = savingCompanyId === c.id;
                  
                  return (
                    <Card key={c.id} className="border-border dark:border-white/5 bg-card/60 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Card Header */}
                        <div className={`border-b border-border dark:border-white/5 p-6 flex items-center justify-between ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                          <div className={`flex items-center gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                            <div className="h-10 w-10 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-border dark:border-white/10 flex-shrink-0">
                              {c.logo ? (
                                <img src={c.logo} alt={c.display_name} className="h-full w-full object-cover" />
                              ) : (
                                <Truck className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-foreground dark:text-white">{c.display_name}</div>
                              <div className="text-xs text-muted-foreground">{t("deliveryAutoSync")} {c.display_name}</div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            config.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-muted/10 text-muted-foreground border border-border'
                          }`}>
                            {config.is_active ? t("deliveryActive") : t("deliveryInactive")}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4">
                          {/* API ID field */}
                          <div className="space-y-1.5">
                            <label className={`text-sm font-semibold text-muted-foreground flex items-center gap-1.5 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                              <Key className="h-4 w-4 text-muted-foreground" />
                              {c.name === 'yalidine' ? 'API ID' : `${t("deliveryApiId")} (Optional)`}
                            </label>
                            <Input
                              placeholder={c.name === 'yalidine' ? 'API ID' : 'API ID'}
                              value={config.api_id || ""}
                              onChange={(e) => handleConfigChange(c.id, "api_id", e.target.value)}
                              className="border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground/60"
                            />
                          </div>

                          {/* API Key / Token field */}
                          <div className="space-y-1.5">
                            <label className={`text-sm font-semibold text-muted-foreground flex items-center gap-1.5 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                              <Key className="h-4 w-4 text-muted-foreground" />
                              {c.name === 'yalidine' ? 'API Token' : t("deliveryApiKey")}
                            </label>
                            <Input
                              type="password"
                              placeholder="API Key / Token"
                              value={config.api_key || ""}
                              onChange={(e) => handleConfigChange(c.id, "api_key", e.target.value)}
                              className="border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground/60"
                            />
                          </div>

                          {/* API Secret field */}
                          <div className="space-y-1.5">
                            <label className={`text-sm font-semibold text-muted-foreground flex items-center gap-1.5 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                              <Key className="h-4 w-4 text-muted-foreground" />
                              {c.name === 'zr_express' ? 'Secret Key' : t("deliveryApiSecret")}
                            </label>
                            <Input
                              type="password"
                              placeholder="Secret Key"
                              value={config.api_secret || ""}
                              onChange={(e) => handleConfigChange(c.id, "api_secret", e.target.value)}
                              className="border-border dark:border-white/10 bg-card dark:bg-white/5 text-foreground dark:text-white font-outfit placeholder:text-muted-foreground/60"
                            />
                          </div>

                          {/* Toggles */}
                          <div className={`flex gap-6 pt-4 border-t border-border dark:border-white/5 items-center ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                            <span className="text-sm font-medium text-muted-foreground">{t("deliveryToggleCompany")}</span>
                            <ToggleIcon 
                              active={config.is_active || false}
                              onChange={(checked) => handleConfigChange(c.id, "is_active", checked)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer actions */}
                      <div className={`border-t border-border dark:border-white/5 p-6 bg-muted/20 dark:bg-white/[0.01] flex flex-col sm:flex-row gap-3 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                        <Button
                          type="button"
                          onClick={() => handleSaveCompanyConfig(c.id)}
                          disabled={isSaving}
                          className="w-full text-xs px-5 py-2.5 rounded-lg font-bold"
                        >
                          {isSaving ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("deliverySaving")}</>
                          ) : (
                            <><Save className="h-3.5 w-3.5" /> {t("deliverySaveSettings")}</>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
                    {/* Active Column */}
                    <div className="space-y-5 md:border-e border-border dark:border-white/5 md:pe-8">
                      <h3 className={`text-xs font-bold text-emerald-500 tracking-wider flex items-center gap-2 uppercase ${isRtl ? "flex-row-reverse" : ""}`}>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isRtl ? "الشركات النشطة" : "Active Companies"} ({activeList.length})</span>
                      </h3>
                      <div className="space-y-6">
                        {activeList.map(renderCompanyCard)}
                        {activeList.length === 0 && (
                          <div className="text-center py-16 border border-dashed border-border dark:border-white/5 rounded-2xl text-muted-foreground text-xs bg-muted/5 dark:bg-white/[0.01]">
                            {isRtl ? "لا توجد شركات شحن نشطة حالياً." : "No active shipping companies."}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inactive Column */}
                    <div className="space-y-5 md:ps-8">
                      <h3 className={`text-xs font-bold text-muted-foreground tracking-wider flex items-center gap-2 uppercase ${isRtl ? "flex-row-reverse" : ""}`}>
                        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-white/20" />
                        <span>{isRtl ? "الشركات غير النشطة" : "Inactive Companies"} ({inactiveList.length})</span>
                      </h3>
                      <div className="space-y-6">
                        {inactiveList.map(renderCompanyCard)}
                        {inactiveList.length === 0 && (
                          <div className="text-center py-16 border border-dashed border-border dark:border-white/5 rounded-2xl text-muted-foreground text-xs bg-muted/5 dark:bg-white/[0.01]">
                            {isRtl ? "كل شركات الشحن نشطة!" : "All shipping companies are active!"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
