"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Loader2, Search, Check } from "lucide-react";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Wilaya {
  id: number;
  code: number;
  name: string;
}

interface Commune {
  id: number;
  name: string;
}

interface LocationSelectorProps {
  /** Called whenever wilaya or commune selection changes */
  onLocationChange?: (location: {
    wilaya: Wilaya | null;
    commune: Commune | null;
  }) => void;
  /** Pre-selected wilaya ID */
  defaultWilayaId?: number;
  /** Pre-selected commune ID */
  defaultCommuneId?: number;
  /** Label for the wilaya dropdown */
  wilayaLabel?: string;
  /** Label for the commune dropdown */
  communeLabel?: string;
  /** Show compact variant */
  compact?: boolean;
  /** Error messages from parent form */
  errors?: { wilaya?: string; commune?: string };
}

// ─── Custom Dropdown ────────────────────────────────────────────────────────
function Dropdown<T extends { id: number; name: string }>({
  label,
  icon,
  items,
  selected,
  onSelect,
  loading,
  disabled,
  placeholder,
  error,
  displayFn,
  searchable = false,
}: {
  label: string;
  icon: React.ReactNode;
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  error?: string;
  displayFn?: (item: T) => string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = searchable && search
    ? items.filter((item) =>
        (displayFn ? displayFn(item) : item.name)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : items;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-dropdown="${label}"]`)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, label]);

  return (
    <div className="flex flex-col gap-1.5" data-dropdown={label}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3
            text-left text-sm transition-all duration-200
            ${disabled
              ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/50"
              : isOpen
                ? "border-primary/50 bg-card shadow-lg shadow-primary/5 ring-2 ring-primary/20"
                : error
                  ? "border-red-400/60 bg-card hover:border-red-400"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-md"
            }
          `}
        >
          <span className={`flex-shrink-0 ${disabled ? "opacity-40" : "text-primary/70"}`}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              icon
            )}
          </span>
          <span className={`flex-1 truncate ${!selected ? "text-muted-foreground/60" : "font-medium"}`}>
            {loading
              ? "Loading..."
              : selected
                ? displayFn
                  ? displayFn(selected)
                  : selected.name
                : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/10"
            >
              {searchable && (
                <div className="border-b border-border/40 p-2">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                      autoFocus
                    />
                  </div>
                </div>
              )}
              <div className="max-h-60 overflow-y-auto overscroll-contain py-1 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground/60">
                    No results found
                  </div>
                ) : (
                  filtered.map((item) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`
                          flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm
                          transition-colors duration-100
                          ${isSelected
                            ? "bg-primary/10 font-medium text-primary"
                            : "hover:bg-muted/50"
                          }
                        `}
                      >
                        <span className="flex-1 truncate">
                          {displayFn ? displayFn(item) : item.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function LocationSelector({
  onLocationChange,
  defaultWilayaId,
  defaultCommuneId,
  wilayaLabel = "Wilaya (Province)",
  communeLabel = "Commune (City)",
  compact = false,
  errors,
}: LocationSelectorProps) {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Fetch wilayas on mount
  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        setLoadingWilayas(true);
        const response = await api.get("/wilayas/");
        const data = response.data;
        setWilayas(data);
        // Auto-select default
        if (defaultWilayaId) {
          const found = data.find((w: Wilaya) => w.id === defaultWilayaId);
          if (found) setSelectedWilaya(found);
        }
      } catch (error) {
        console.error("Failed to fetch wilayas:", error);
      } finally {
        setLoadingWilayas(false);
      }
    };
    fetchWilayas();
  }, [defaultWilayaId]);

  // Fetch communes when wilaya changes
  useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      setSelectedCommune(null);
      return;
    }
    const fetchCommunes = async () => {
      try {
        setLoadingCommunes(true);
        setSelectedCommune(null);
        const response = await api.get(`/communes/?wilaya=${selectedWilaya.id}`);
        const data = response.data;
        setCommunes(data);
        // Auto-select default commune
        if (defaultCommuneId) {
          const found = data.find((c: Commune) => c.id === defaultCommuneId);
          if (found) setSelectedCommune(found);
        }
      } catch (error) {
        console.error("Failed to fetch communes:", error);
      } finally {
        setLoadingCommunes(false);
      }
    };
    fetchCommunes();
  }, [selectedWilaya, defaultCommuneId]);

  // Notify parent of changes
  useEffect(() => {
    onLocationChange?.({
      wilaya: selectedWilaya,
      commune: selectedCommune,
    });
  }, [selectedWilaya, selectedCommune, onLocationChange]);

  const handleWilayaSelect = useCallback((wilaya: Wilaya) => {
    setSelectedWilaya(wilaya);
    setSelectedCommune(null);
    setCommunes([]);
  }, []);

  const handleCommuneSelect = useCallback((commune: Commune) => {
    setSelectedCommune(commune);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${compact ? "space-y-3" : "space-y-4"}`}
    >
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2 pb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Delivery Location</h3>
            <p className="text-xs text-muted-foreground/70">
              Select your wilaya and commune
            </p>
          </div>
        </div>
      )}

      {/* Wilaya Dropdown */}
      <Dropdown
        label={wilayaLabel}
        icon={<MapPin className="h-4 w-4" />}
        items={wilayas}
        selected={selectedWilaya}
        onSelect={handleWilayaSelect}
        loading={loadingWilayas}
        disabled={loadingWilayas}
        placeholder="Select a wilaya..."
        error={errors?.wilaya}
        displayFn={(w) => `${w.code.toString().padStart(2, "0")} - ${w.name}`}
        searchable
      />

      {/* Commune Dropdown */}
      <Dropdown
        label={communeLabel}
        icon={<MapPin className="h-4 w-4" />}
        items={communes}
        selected={selectedCommune}
        onSelect={handleCommuneSelect}
        loading={loadingCommunes}
        disabled={!selectedWilaya || loadingCommunes}
        placeholder={
          selectedWilaya
            ? "Select a commune..."
            : "Select a wilaya first"
        }
        error={errors?.commune}
        searchable
      />

      {/* Selected Summary */}
      <AnimatePresence>
        {selectedWilaya && selectedCommune && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {selectedCommune.name}
                </span>
                <span className="text-muted-foreground/60"> — </span>
                <span className="text-muted-foreground/80">
                  {selectedWilaya.name} ({selectedWilaya.code.toString().padStart(2, "0")})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
