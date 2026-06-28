import { create } from 'zustand';

interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  variant?: {
    id: string;
    name: string;
    price?: number;
  };
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  addItem: (newItem) => {
    const items = [...get().items];
    const existing = items.find(
      (item) =>
        item.product_id === newItem.product_id &&
        item.variant?.id === newItem.variant?.id
    );

    if (existing) {
      existing.quantity += newItem.quantity;
    } else {
      items.push({
        ...newItem,
        id: `${newItem.product_id}-${newItem.variant?.id || 'default'}-${Date.now()}`,
      });
    }

    const total = items.reduce((acc, item) => acc + (item.variant?.price || item.price) * item.quantity, 0);
    set({ items, total });
  },
  removeItem: (itemId) => {
    const items = get().items.filter((item) => item.id !== itemId);
    const total = items.reduce((acc, item) => acc + (item.variant?.price || item.price) * item.quantity, 0);
    set({ items, total });
  },
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const items = get().items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    const total = items.reduce((acc, item) => acc + (item.variant?.price || item.price) * item.quantity, 0);
    set({ items, total });
  },
  clearCart: () => set({ items: [], total: 0 }),
}));
