import { create } from 'zustand';

interface Store {
  id: string;
  name: string;
  subdomain: string;
  language: string;
  logo: string;
  user_role?: 'owner' | 'worker';
  user_permissions?: {
    can_manage_products: boolean;
    can_manage_orders: boolean;
    can_manage_delivery: boolean;
    can_manage_pages: boolean;
    can_manage_themes: boolean;
    can_manage_pixels: boolean;
    can_manage_integrations: boolean;
    can_manage_settings: boolean;
    can_manage_workers: boolean;
  };
  settings?: {
    primary_color?: string;
    secondary_color?: string;
    contact_phone?: string;
    contact_email?: string;
    whatsapp_number?: string;
    currency?: string;
    default_delivery_price?: number;
    free_delivery_threshold?: number;
  };
}

interface DashboardState {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedStore: null,
  setSelectedStore: (store) => set({ selectedStore: store }),
}));
