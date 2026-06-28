"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useDashboardStore } from "../../../stores/dashboard";
import { useLanguageStore } from "../../../stores/language";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Sparkles, Send, Bot, User, CheckCircle2, RefreshCw, AlertCircle, ShoppingBag, ShoppingCart, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "user" | "claude";
  text: string;
  timestamp: Date;
  actionExecuted?: string | null;
}

export default function AssistantPage() {
  const { selectedStore } = useDashboardStore();
  const { isRtl, language } = useLanguageStore();
  const currentStoreId = selectedStore?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [configActive, setConfigActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const localLabels = {
    title: isRtl ? "مساعد الذكاء الاصطناعي (Claude)" : "Claude AI Assistant",
    desc: isRtl ? "تحدث مع المساعد لإدارة متجرك، وتحديث الأسعار، وفحص الطلبات بالذكاء الاصطناعي." : "Chat with Claude to manage your store, query orders, write product copy, or update prices.",
    placeholder: isRtl ? "اسأل Claude عن سلعك، مبيعاتك، أو اطلب منه تعديل الأسعار..." : "Ask Claude about products, orders, or request price updates...",
    quickListProducts: isRtl ? "اعرض السلع النشطة 📦" : "List active products 📦",
    quickCheckOrders: isRtl ? "افحص الطلبيات الأخيرة 🛒" : "Check recent orders 🛒",
    quickUpdatePrice: isRtl ? "كيف أعدل سعر منتج؟ 💰" : "How to update a price? 💰",
    welcomeTitle: isRtl ? "أهلاً بك في المساعد الذكي Sovi AI" : "Welcome to Sovi AI Assistant",
    welcomeDesc: isRtl ? "اختر أحد الأسئلة السريعة بالأسفل أو اكتب توجيهاتك مباشرة للمساعد:" : "Select a quick prompt template below or type your directions directly to the assistant:",
    systemActionBadge: isRtl ? "مهمة منفذة" : "Task Executed",
    configWarning: isRtl ? "وضع المعاينة النشط: لتفعيل المساعد بالكامل يرجى تكوين مفتاح API في الإعدادات > الدمج." : "Preview Mode Active: Configure your API Key in Settings > Integrations for full capability.",
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (currentStoreId) {
      api.get(`/integrations/${currentStoreId}/claude/`)
        .then((res) => {
          setConfigActive(res.data.is_active && !!res.data.api_key);
        })
        .catch(() => {});
    }
  }, [currentStoreId]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !currentStoreId || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await api.post(`/integrations/${currentStoreId}/claude/chat/`, {
        message: textToSend,
      });

      const claudeMsg: Message = {
        id: Math.random().toString(),
        sender: "claude",
        text: res.data.response || "",
        timestamp: new Date(),
        actionExecuted: res.data.action_executed,
      };

      setMessages((prev) => [...prev, claudeMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "claude",
        text: isRtl ? "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي." : "Sorry, an error occurred while reaching the AI assistant.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`h-[calc(100vh-220px)] flex flex-col justify-between text-foreground ${
        isRtl ? "font-cairo text-right" : "font-sans text-left"
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Top Header info */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent animate-pulse" /> {localLabels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{localLabels.desc}</p>
        </div>
        
        {!configActive && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>{localLabels.configWarning}</span>
          </div>
        )}
      </div>

      {/* Main Messages Area */}
      <div className="flex-grow my-4 overflow-y-auto pr-1 pl-1 space-y-4 custom-scrollbar bg-secondary/5 rounded-2xl border border-border p-6 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
              <Bot className="h-9 w-9 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{localLabels.welcomeTitle}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{localLabels.welcomeDesc}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5 w-full pt-4">
              <button 
                onClick={() => handleSendMessage(isRtl ? "اعرض سلع متجري النشطة بالتفصيل" : "Show all my active store products in detail")}
                className="p-3 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary/10 transition-all flex items-center gap-2 text-start"
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>{localLabels.quickListProducts}</span>
              </button>
              
              <button 
                onClick={() => handleSendMessage(isRtl ? "افحص الطلبات الأخيرة وتفاصيل مبيعاتي" : "Show my recent orders and sales breakdown")}
                className="p-3 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary/10 transition-all flex items-center gap-2 text-start"
              >
                <ShoppingCart className="h-4 w-4 text-accent" />
                <span>{localLabels.quickCheckOrders}</span>
              </button>

              <button 
                onClick={() => setInputText(isRtl ? "تعديل سعر المنتج [اسم المنتج] إلى [السعر الجديد] دج" : "Update price of product [title] to [new_price] DZD")}
                className="p-3 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-secondary/10 transition-all flex items-center gap-2 text-start"
              >
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>{localLabels.quickUpdatePrice}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Icon Badge */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    msg.sender === "user" 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-accent/10 border-accent/20 text-accent"
                  }`}>
                    {msg.sender === "user" ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-2">
                    <Card className={`border-border rounded-2xl p-4 shadow-sm ${
                      msg.sender === "user" 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "bg-card text-foreground"
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-line font-cairo">
                        {msg.text}
                      </div>
                    </Card>

                    {/* Action Executed success notice */}
                    {msg.actionExecuted && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-bold max-w-sm animate-fade-in-up">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase text-emerald-500 tracking-wider block">{localLabels.systemActionBadge}</span>
                          <span className="font-medium text-white">{msg.actionExecuted}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Inputs Area */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex gap-3 pt-2"
      >
        <Input
          placeholder={localLabels.placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-grow ${isRtl ? "pr-4 text-right" : "pl-4 text-left"}`}
          disabled={loading || !currentStoreId}
        />
        <Button 
          type="submit" 
          disabled={loading || !inputText.trim() || !currentStoreId}
          variant="glow"
          className="flex items-center justify-center h-10 w-10 p-0 rounded-lg flex-shrink-0"
        >
          {loading ? (
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className={`h-4.5 w-4.5 ${isRtl ? "rotate-180" : ""}`} />
          )}
        </Button>
      </form>
    </div>
  );
}
