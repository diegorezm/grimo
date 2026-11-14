import { onlineManager } from "@tanstack/react-query";
import { create } from "zustand";
import { errorMessage } from "./convex-cache";

/**
 * Short notices after an action ("Fundação foi para Lidos · Desfazer"), shown by each app's
 * toaster at the bottom of the screen. One at a time: a new one replaces the last.
 */
export type ToastTone = "success" | "info" | "error";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** One button on the notice: "Desfazer", "Tentar de novo". */
  action?: { label: string; run: () => void };
}

const DURATION_MS = { success: 3500, info: 4500, error: 6000 } as const;

interface ToastState {
  current: Toast | null;
  show: (toast: Omit<Toast, "id">) => void;
  dismiss: (id?: number) => void;
}

let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (toast) => {
    const id = nextId++;
    clearTimeout(timer);
    set({ current: { ...toast, id } });
    timer = setTimeout(() => get().dismiss(id), DURATION_MS[toast.tone]);
  },
  dismiss: (id) => {
    if (id === undefined || get().current?.id === id) set({ current: null });
  },
}));

/** Show a notice from anywhere (event handlers, mutation callbacks). */
export const toast = {
  /**
   * The change is saved. Offline it is kept on the device and sent later (the mutation waits),
   * so the reader is told that instead.
   */
  saved(message: string, action?: Toast["action"]) {
    if (!onlineManager.isOnline()) {
      useToastStore.getState().show({
        tone: "info",
        message: "Sem internet. Salvo no aparelho, envia quando voltar.",
      });
      return;
    }
    useToastStore.getState().show({ tone: "success", message, action });
  },
  /** It failed: what happened, and a retry when there is one. */
  failed(error: unknown, retry?: () => void) {
    useToastStore.getState().show({
      tone: "error",
      message: errorMessage(error),
      action: retry ? { label: "Tentar de novo", run: retry } : undefined,
    });
  },
  info(message: string) {
    useToastStore.getState().show({ tone: "info", message });
  },
};
