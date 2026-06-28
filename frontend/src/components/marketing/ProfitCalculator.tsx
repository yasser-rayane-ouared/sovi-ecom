"use client";

import React, { useState } from "react";
import { Truck, Smartphone, Percent, ShieldAlert } from "lucide-react";
import { useLanguageStore } from "../../stores/language";

export default function ProfitCalculator() {
  const { t, language } = useLanguageStore();

  const [costPrice, setCostPrice] = useState(1500);
  const [sellPrice, setSellPrice] = useState(3800);
  const [monthlyOrders, setMonthlyOrders] = useState(250);
  const [confRate, setConfRate] = useState(75);
  const [delivRate, setDelivRate] = useState(80);
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');

  // Calculations
  const shippingFee = deliveryType === 'home' ? 600 : 400;
  const totalConfirmed = Math.round(monthlyOrders * (confRate / 100));
  const totalDelivered = Math.round(totalConfirmed * (delivRate / 100));
  const totalReturned = totalConfirmed - totalDelivered;

  const grossRevenue = totalDelivered * sellPrice;
  const totalCogs = totalDelivered * costPrice; // COGS for items sold
  const totalShipping = (totalDelivered + totalReturned) * shippingFee; // Shipping paid for outbound
  const totalReturnCost = totalReturned * 350; // Surcharge of returns (Algerian average return fee)

  const netProfit = grossRevenue - totalCogs - totalShipping - totalReturnCost;
  const roi = (totalCogs + totalShipping + totalReturnCost) > 0 
    ? Math.round((netProfit / (totalCogs + totalShipping + totalReturnCost)) * 100) 
    : 0;

  const copy = {
    ar: {
      calcConfirmRate: "معدل تأكيد الطلبيات:",
      calcDeliveryRate: "معدل تسليم الطرود (Delivery Rate):",
      calcRevenue: "إجمالي المقبوضات (Gross Revenue):",
      calcCogs: "تكلفة السلع المسلمة (COGS):",
      calcShipping: "تكلفة شحن الطرود:",
      calcReturnCost: "تكلفة شحن المرتجعات (Retour):",
      calcSavingDetail: "توفر Sovi حماية للمخزون بإرجاع السلع التالفة أو المرتجعة للرفوف فوراً، مما يعني صفر خسائر في تكلفة المنتج للطرود المرتجعة.",
      calcProfitNet: "صافي أرباحك الصافية شهرياً:",
      calcRoi: "العائد على الاستثمار:",
    },
    fr: {
      calcConfirmRate: "Taux de Confirmation:",
      calcDeliveryRate: "Taux de Livraison (Delivery Rate):",
      calcRevenue: "Revenu Brut (Gross):",
      calcCogs: "Coût des Marchandises (COGS):",
      calcShipping: "Frais de Livraison:",
      calcReturnCost: "Pertes sur Retours (Retour):",
      calcSavingDetail: "Grâce au restock automatique de Sovi, les colis retournés ne sont pas perdus. Ils reviennent automatiquement en stock. Perte produit = 0 DA.",
      calcProfitNet: "Bénéfice Net Mensuel:",
      calcRoi: "Retour sur Investissement (ROI):",
    },
    en: {
      calcConfirmRate: "Confirmation Rate:",
      calcDeliveryRate: "Delivery Rate (Delivery Rate):",
      calcRevenue: "Gross Revenue:",
      calcCogs: "Cost of Goods (COGS):",
      calcShipping: "Outbound Shipping Fees:",
      calcReturnCost: "Return Shipping Fees (Retour):",
      calcSavingDetail: "With Sovi's automated restock, returned parcels go back to stock. Zero product loss. Only Yalidine return fees (approx 350 DZD) apply.",
      calcProfitNet: "Expected Monthly Net Profit:",
      calcRoi: "Return on Investment (ROI):",
    }
  };

  const activeCopy = copy[language as 'ar' | 'fr' | 'en'] || copy.fr;

  return (
    <section id="calculator" className="py-24 border-t border-border bg-card/25 relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
            <Percent className="h-3.5 w-3.5" />
            <span>{language === 'ar' ? 'محاكاة مالية واقعية' : 'Simulation Financière Réelle'}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black font-cairo text-foreground leading-tight">{t('calculatorTitle')}</h2>
          <p className="text-sm text-muted-foreground font-cairo">{t('calculatorDesc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Control Panel (Sliders) */}
          <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-center shadow-xl">
            
            {/* Product Cost slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="font-cairo text-muted-foreground">{t('productCost')}</span>
                <span className="text-amber-500 font-bold font-outfit">{costPrice.toLocaleString()} DA</span>
              </div>
              <input
                type="range"
                min="300"
                max="10000"
                step="100"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
              />
            </div>

            {/* Selling Price slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="font-cairo text-muted-foreground">{t('sellingPrice')}</span>
                <span className="text-amber-500 font-bold font-outfit">{sellPrice.toLocaleString()} DA</span>
              </div>
              <input
                type="range"
                min="1000"
                max="20000"
                step="100"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
              />
            </div>

            {/* Monthly Orders slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="font-cairo text-muted-foreground">{t('monthlySales')}</span>
                <span className="text-amber-500 font-bold font-outfit">{monthlyOrders} {t('order')}</span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={monthlyOrders}
                onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
              />
            </div>

            {/* Confirmation Rate slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="font-cairo text-muted-foreground">{activeCopy.calcConfirmRate}</span>
                <span className="text-amber-500 font-bold font-outfit">{confRate}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={confRate}
                onChange={(e) => setConfRate(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
              />
            </div>

            {/* Delivery Rate slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="font-cairo text-muted-foreground">{activeCopy.calcDeliveryRate}</span>
                <span className="text-amber-500 font-bold font-outfit">{delivRate}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={delivRate}
                onChange={(e) => setDelivRate(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
              />
            </div>

            {/* Delivery method toggle */}
            <div className="space-y-3 pt-2">
              <span className="text-xs text-muted-foreground font-bold font-cairo block">{t('shippingMethod')}</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType('home')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === 'home' ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'border-border bg-card/50 text-muted-foreground hover:bg-card'}`}
                >
                  <Truck className="h-4 w-4" /> {t('homeDelivery')}
                </button>
                <button
                  onClick={() => setDeliveryType('desk')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === 'desk' ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300' : 'border-border bg-card/50 text-muted-foreground hover:bg-card'}`}
                >
                  <Smartphone className="h-4 w-4" /> {t('officeDelivery')}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel (Calculations) */}
          <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-border bg-card p-6 md:p-8 flex flex-col justify-between space-y-6 text-start relative shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
            
            <div className="space-y-4 w-full">
              <h3 className="text-xs font-bold text-muted-foreground border-b border-border pb-2 uppercase tracking-wider">{t('financialReport')}</h3>
              
              <div className="space-y-3.5 text-xs font-medium">
                {/* Gross revenue */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{activeCopy.calcRevenue}</span>
                  <span className="font-bold text-foreground font-outfit">{grossRevenue.toLocaleString()} DA</span>
                </div>
                
                {/* COGS */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{activeCopy.calcCogs}</span>
                  <span className="font-bold text-rose-500 font-outfit">-{totalCogs.toLocaleString()} DA</span>
                </div>
                
                {/* Delivery Cost */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{activeCopy.calcShipping}</span>
                  <span className="font-bold text-rose-500 font-outfit">-{totalShipping.toLocaleString()} DA</span>
                </div>

                {/* Return Cost */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{activeCopy.calcReturnCost}</span>
                  <span className="font-bold text-rose-500 font-outfit">-{totalReturnCost.toLocaleString()} DA</span>
                </div>

                {/* Sovi Subscription cost */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sovi Platform Fee:</span>
                  <span className="font-bold text-emerald-500">0 DA ({t('free')})</span>
                </div>
              </div>

              {/* Micro savings tip */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[10px] text-muted-foreground flex gap-2 font-cairo">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span>{activeCopy.calcSavingDetail}</span>
              </div>
            </div>

            {/* Net profit outcomes */}
            <div className="border-t border-border pt-4 space-y-4 w-full">
              <div>
                <span className="text-xs text-muted-foreground block">{activeCopy.calcProfitNet}</span>
                <span className="text-3xl font-black text-emerald-500 font-outfit block mt-1">{netProfit.toLocaleString()} DA</span>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-2 px-3 rounded-lg text-xs justify-center font-bold">
                <Percent className="h-4 w-4" />
                <span>{activeCopy.calcRoi} {roi}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
