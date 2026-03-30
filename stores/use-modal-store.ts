import { create } from "zustand";

type ModalType = "deposit" | null;

type ModalPayload = {
  title: string;
  description: string;
};

type ModalState = {
  type: ModalType;
  payload: ModalPayload | null;
  open: (type: Exclude<ModalType, null>, payload: ModalPayload) => void;
  close: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  payload: null,
  open: (type, payload) => set({ type, payload }),
  close: () => set({ type: null, payload: null }),
}));
