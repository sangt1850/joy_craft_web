import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms, 기본 3500
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, options) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, ...options }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, options?.duration ?? 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
