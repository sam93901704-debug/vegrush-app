'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unitType: string;
  unitValue: string;
  stockQty: string;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cart';

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the structure
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item: any) =>
            item &&
            item.product &&
            item.product.id &&
            typeof item.qty === 'number' &&
            item.qty > 0
        );
      }
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }
  return [];
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!isInitialized) {
      const loadedItems = loadCartFromStorage();
      setItems(loadedItems);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(items);
    }
  }, [items, isInitialized]);

  // Add item to cart
  const addItem = useCallback((product: Product, qty: number) => {
    if (qty <= 0) return;

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          qty: updatedItems[existingItemIndex].qty + qty,
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { product, qty }];
      }
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  }, []);

  // Update quantity of an item
  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      )
    );
  }, [removeItem]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Get total number of items in cart
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.qty, 0);
  }, [items]);

  // Get total price of all items in cart
  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => {
      const unitValue = parseFloat(item.product.unitValue);
      const pricePerUnit = item.product.price / unitValue;
      return total + pricePerUnit * item.qty;
    }, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

