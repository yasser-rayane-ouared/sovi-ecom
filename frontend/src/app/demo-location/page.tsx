"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, Terminal, Truck, Settings, Code, ShoppingCart, HelpCircle } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Simulated rates for dynamic shipping calculation demonstration
const getShippingRate = (code: number) => {
  if ([16, 9, 35, 42].includes(code)) return { home: 400, desk: 250 }; // Alger, Blida, Boumerdes, Tipaza
  if ([31, 25, 19].includes(code)) return { home: 600, desk: 400 };  // Oran, Constantine, Setif
  if ([11, 37, 33, 54].includes(code)) return { home: 900, desk: 650 }; // Sahara/Far South
  return { home: 500, desk: 350 }; // Default standard rate
};

export default function DemoLocationPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    wilaya: { id: number; code: number; name: string } | null;
    commune: { id: number; name: string } | null;
  }>({ wilaya: null, commune: null });

  const [deliveryType, setDeliveryType] = useState<"home" | "desk">("home");
  const [isCompact, setIsCompact] = useState(false);

  const handleLocationChange = (location: any) => {
    setSelectedLocation(location);
  };

  const shipping = selectedLocation.wilaya
    ? getShippingRate(selectedLocation.wilaya.code)
    : { home: 0, desk: 0 };

  const currentShippingCost = deliveryType === "home" ? shipping.home : shipping.desk;

  return (
    <div className="min-h-screen bg-[#090d16] text-white overflow-y-auto relative bg-grid pb-16">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]"></div>

      {/* Navigation */}
      <div className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:bg-white/5 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Platform
          </Button>
        </Link>
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-outfit">S</span>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-6 max-w-6xl relative z-10 mt-6">
        <div className="text-center md:text-left mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Algeria Location System
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
            A production-ready cascade dropdown system designed for high-performance Algerian e-commerce checkout systems, optimized for COD operations and direct shipping API integration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Dynamic Selector & Options */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-white/5 bg-white/5 backdrop-blur-md overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-accent to-secondary"></div>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Checkout Delivery Form
                  </h2>
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setIsCompact(false)}
                      className={`px-3 py-1 text-xs rounded-md transition ${!isCompact ? "bg-primary text-white font-medium shadow-md shadow-primary/25" : "text-muted-foreground hover:text-white"}`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setIsCompact(true)}
                      className={`px-3 py-1 text-xs rounded-md transition ${isCompact ? "bg-primary text-white font-medium shadow-md shadow-primary/25" : "text-muted-foreground hover:text-white"}`}
                    >
                      Compact
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Location Selector Component */}
                  <LocationSelector
                    compact={isCompact}
                    onLocationChange={handleLocationChange}
                  />

                  {/* Delivery Method Selection */}
                  {selectedLocation.wilaya && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-2"
                    >
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Delivery Method
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setDeliveryType("home")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                            deliveryType === "home"
                              ? "border-primary bg-primary/10 text-white shadow-lg shadow-primary/5"
                              : "border-white/5 bg-white/5 hover:border-white/20 text-muted-foreground hover:text-white"
                          }`}
                        >
                          <Truck className="h-5 w-5" />
                          <div className="text-sm font-semibold">Home Delivery</div>
                          <div className="text-xs opacity-80">{shipping.home} DZD</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType("desk")}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                            deliveryType === "desk"
                              ? "border-primary bg-primary/10 text-white shadow-lg shadow-primary/5"
                              : "border-white/5 bg-white/5 hover:border-white/20 text-muted-foreground hover:text-white"
                          }`}
                        >
                          <MapPin className="h-5 w-5" />
                          <div className="text-sm font-semibold">Office Collection (Desk)</div>
                          <div className="text-xs opacity-80">{shipping.desk} DZD</div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Platform Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-white/5 bg-white/5 backdrop-blur-md rounded-xl p-5 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Settings className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm">PostgreSQL Optimizations</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Indexes applied on Wilaya codes and unique Commune constraints ensure fast response times for heavy user traffic.
                </p>
              </div>
              <div className="border border-white/5 bg-white/5 backdrop-blur-md rounded-xl p-5 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                  <Code className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm">24H Redis/Local Caching</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Endpoints `/api/wilayas/` and `/api/communes/` cache payloads automatically to guarantee sub-millisecond API loads.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Live State & Code Payload */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live State payload display */}
            <Card className="border-white/5 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/20">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-accent" /> Live Component State
                </h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                    <span className="text-muted-foreground">Selected Wilaya:</span>
                    <span className="font-semibold text-accent">
                      {selectedLocation.wilaya
                        ? `${selectedLocation.wilaya.code.toString().padStart(2, "0")} - ${selectedLocation.wilaya.name}`
                        : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                    <span className="text-muted-foreground">Selected Commune:</span>
                    <span className="font-semibold text-accent">
                      {selectedLocation.commune ? selectedLocation.commune.name : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 border-b border-white/5">
                    <span className="text-muted-foreground">Delivery Cost:</span>
                    <span className="font-bold text-emerald-400">
                      {selectedLocation.wilaya && selectedLocation.commune
                        ? `${currentShippingCost} DZD`
                        : "Choose address"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5" /> Callback Payload (onLocationChange)
                  </label>
                  <pre className="text-xs bg-black/40 border border-white/5 rounded-lg p-4 overflow-x-auto text-blue-300 font-mono select-all">
                    {JSON.stringify(selectedLocation, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Quick Developer Tip */}
            <div className="border border-white/5 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-md rounded-xl p-5 flex gap-4">
              <HelpCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm mb-1 text-white">Production Ready</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This location system is bound directly to the database via standard DRF serializing. Easily hook this component into checkout processes to decrease user error on address entry and improve delivery validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
