"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Play, RotateCcw, Check, Layers } from "lucide-react";
import { useLanguageStore } from "../../stores/language";

export default function LiveSimulator() {
  const { language } = useLanguageStore();

  const [simStep, setSimStep] = useState<'idle' | 'checkout' | 'fraud' | 'stock' | 'sheets' | 'shipping' | 'done'>('idle');
  const [simAction, setSimAction] = useState<'order' | 'return' | 'idle'>('idle');
  const [simInventory, setSimInventory] = useState(15);
  const [simSheets, setSimSheets] = useState([
    { id: "YA-5819", name: "Anis K.", phone: "0550-11-22-33", wilaya: "Alger", price: "4,500 DA", status: "Delivered" },
    { id: "YA-7429", name: "Amine M.", phone: "0662-44-55-66", wilaya: "Setif", price: "8,200 DA", status: "Confirmed" }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runOrderSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimAction('order');
    setSimStep('checkout');
    
    setTimeout(() => {
      setSimStep('fraud');
      setTimeout(() => {
        setSimStep('stock');
        setSimInventory(14);
        setTimeout(() => {
          setSimStep('sheets');
          setSimSheets(prev => [
            ...prev,
            { id: "YA-9281", name: "Ryad K.", phone: "0770-12-34-56", wilaya: "Oran", price: "3,800 DA", status: "New" }
          ]);
          setTimeout(() => {
            setSimStep('shipping');
            setTimeout(() => {
              setSimStep('done');
              setIsSimulating(false);
            }, 1100);
          }, 1100);
        }, 1100);
      }, 1100);
    }, 1200);
  };

  const runReturnSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimAction('return');
    setSimStep('stock');
    
    setTimeout(() => {
      setSimInventory(15);
      setSimStep('sheets');
      setTimeout(() => {
        setSimSheets(prev => 
          prev.map(row => 
            row.name === "Ryad K." 
              ? { ...row, status: "Returned" } 
              : row
          )
        );
        setTimeout(() => {
          setSimStep('done');
          setIsSimulating(false);
        }, 1100);
      }, 1100);
    }, 1200);
  };

  const resetSimulation = () => {
    setSimStep('idle');
    setSimAction('idle');
    setSimInventory(15);
    setSimSheets([
      { id: "YA-5819", name: "Anis K.", phone: "0550-11-22-33", wilaya: "Alger", price: "4,500 DA", status: "Delivered" },
      { id: "YA-7429", name: "Amine M.", phone: "0662-44-55-66", wilaya: "Setif", price: "8,200 DA", status: "Confirmed" }
    ]);
    setIsSimulating(false);
  };

  const copy = {
    ar: {
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
    },
    fr: {
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
    },
    en: {
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
    }
  };

  const activeCopy = copy[language as 'ar' | 'fr' | 'en'] || copy.fr;

  return (
    <section id="simulator" className="py-20 border-t border-border bg-card/25 relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <Play className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? 'تكنولوجيا حية' : 'Technologie Live'}</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-black font-cairo text-foreground leading-tight">{activeCopy.simTitle}</h2>
          <p className="text-sm text-muted-foreground font-cairo">{activeCopy.simDesc}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Left Column: Simulator Console */}
          <div className="lg:col-span-2 bg-[#0b0c10] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between text-start relative overflow-hidden shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            
            <div className="space-y-4">
              {/* Console header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-xs font-bold text-slate-300 font-mono">Sovi Core Terminal</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                  {isSimulating ? "RUNNING" : "READY"}
                </span>
              </div>

              {/* Simulation log actions */}
              <div className="space-y-3.5 min-h-[220px] font-cairo text-xs text-slate-400 pt-2">
                {simStep === 'idle' && (
                  <div className="flex items-center gap-2 text-slate-500 font-mono py-2">
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    <span>{activeCopy.simStatusIdle}</span>
                  </div>
                )}

                {/* Step 1: Checkout Form */}
                {simAction === 'order' && ['checkout', 'fraud', 'stock', 'sheets', 'shipping', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['checkout'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['checkout'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepCheckout}</span>
                  </motion.div>
                )}

                {/* Step 2: Fraud Security Check */}
                {simAction === 'order' && ['fraud', 'stock', 'sheets', 'shipping', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['fraud'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['fraud'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepFraud}</span>
                  </motion.div>
                )}

                {/* Step 3: Stock decremented */}
                {simAction === 'order' && ['stock', 'sheets', 'shipping', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['stock'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['stock'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepStock}</span>
                  </motion.div>
                )}

                {/* Step 4: Sheets sync */}
                {simAction === 'order' && ['sheets', 'shipping', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['sheets'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['sheets'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepSheets}</span>
                  </motion.div>
                )}

                {/* Step 5: Shipping generated */}
                {simAction === 'order' && ['shipping', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['shipping'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['shipping'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepShipping}</span>
                  </motion.div>
                )}

                {/* Simulation finished banner */}
                {simAction === 'order' && simStep === 'done' && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-center font-bold">
                    {activeCopy.simStepDone}
                  </motion.div>
                )}

                {/* Return simulation flow */}
                {simAction === 'return' && ['stock', 'sheets', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['stock'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['stock'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepReturnStock}</span>
                  </motion.div>
                )}

                {simAction === 'return' && ['sheets', 'done'].includes(simStep) && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2 py-1 ${['sheets'].includes(simStep) ? 'text-amber-400 font-bold' : 'text-emerald-500'}`}>
                    {['sheets'].includes(simStep) ? <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span> : <Check className="h-4 w-4" />}
                    <span>{activeCopy.simStepReturnStockDone}</span>
                  </motion.div>
                )}

                {simAction === 'return' && simStep === 'done' && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3 text-center font-bold">
                    {language === 'ar' ? '✨ تم استرجاع المنتج للمخزون وتحديث الحالات تلقائياً!' : '✨ Item returned to inventory & Sheets status updated automatically!'}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-6 border-t border-slate-800 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={runOrderSimulation}
                  disabled={isSimulating || (simStep === 'done' && simAction === 'order')}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {activeCopy.simBtnOrder}
                </Button>
                
                <Button
                  onClick={runReturnSimulation}
                  disabled={isSimulating || simStep !== 'done' || simAction !== 'order'}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {activeCopy.simBtnReturn}
                </Button>
              </div>
              
              {(simStep === 'done' || simAction !== 'idle') && (
                <Button
                  onClick={resetSimulation}
                  disabled={isSimulating}
                  variant="outline"
                  className="border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-bold py-2 rounded-xl text-xs w-full"
                >
                  {language === 'ar' ? 'إعادة تعيين المحاكاة' : 'Réinitialiser la Simulation'}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Database State Visualization */}
          <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
            {/* Widget A: Stock Status */}
            <div className="bg-[#0b0c10] border border-slate-800 rounded-3xl p-5 shadow-xl text-start">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center justify-between">
                <span>{activeCopy.simInvTitle}</span>
                <span className="font-mono text-[10px] text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded bg-amber-500/5">
                  SOVI STOCK ENGINE V2
                </span>
              </h3>

              <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-[#0e0f14]/60 font-mono text-xs">
                <table className="w-full text-left border-collapse" dir="ltr">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                      <th className="p-3 font-semibold">{activeCopy.simInvProd}</th>
                      <th className="p-3 font-semibold text-center">{activeCopy.simInvStock}</th>
                      <th className="p-3 font-semibold text-center">Low Threshold</th>
                      <th className="p-3 font-semibold text-right">{activeCopy.simInvStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-sans font-bold flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                        Sartorial Gold Watch
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold transition-all duration-300 ${simInventory === 14 ? 'bg-amber-500/20 text-amber-400 scale-105' : 'bg-slate-800 text-white'}`}>
                          {simInventory} pcs
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-500">5 pcs</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          OPTIMAL
                        </span>
                      </td>
                    </tr>
                    <tr className="opacity-50">
                      <td className="p-3 font-sans flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                        Smart Air humidifier
                      </td>
                      <td className="p-3 text-center">3 pcs</td>
                      <td className="p-3 text-center text-slate-500">10 pcs</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px] font-bold animate-pulse">
                          {activeCopy.simInvLowAlert} ⚠️
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Widget B: Sheets Live Stream */}
            <div className="bg-[#0b0c10] border border-slate-800 rounded-3xl p-5 shadow-xl text-start flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    {activeCopy.simSheetTitle}
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    ANTI-DUPLICATE SECURE LOCK 🔐
                  </span>
                </h3>
                
                <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-black/40 font-mono text-[10px]">
                  <table className="w-full text-left border-collapse" dir="ltr">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                        <th className="p-2 border-r border-slate-800">Order ID</th>
                        <th className="p-2 border-r border-slate-800">Customer</th>
                        <th className="p-2 border-r border-slate-800">Phone</th>
                        <th className="p-2 border-r border-slate-800">Wilaya</th>
                        <th className="p-2 border-r border-slate-800">Total</th>
                        <th className="p-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {simSheets.map((row, idx) => (
                        <motion.tr
                          key={row.id}
                          initial={idx === simSheets.length - 1 && simAction === 'order' ? { opacity: 0, backgroundColor: "rgba(16,185,129,0.2)" } : false}
                          animate={idx === simSheets.length - 1 && simAction === 'order' ? { opacity: 1, backgroundColor: "transparent" } : false}
                          transition={{ duration: 0.5 }}
                          className="hover:bg-slate-900/30"
                        >
                          <td className="p-2 border-r border-slate-850 text-slate-500">{row.id}</td>
                          <td className="p-2 border-r border-slate-850 font-bold">{row.name}</td>
                          <td className="p-2 border-r border-slate-850">{row.phone}</td>
                          <td className="p-2 border-r border-slate-850">{row.wilaya}</td>
                          <td className="p-2 border-r border-slate-850 text-emerald-400 font-bold">{row.price}</td>
                          <td className="p-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors duration-500 ${
                              row.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              row.status === 'Confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                              row.status === 'Returned' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-[10px] text-slate-500 font-mono italic leading-relaxed text-center">
                * Live Google API hook captures data and generates AWB tickets automatically. Zero manual export needed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
